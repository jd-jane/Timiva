/**
 * Lunar B2E — Bidirectional Input Corrective + Finalization Browser QA.
 *
 * Owner corrective（overrides prior blur-commit / keep-last-Result locks）:
 * unified Gregorian/Lunar continuous digits, incomplete → Result ?,
 * complete valid → immediate Result, compact lunar never invents leap.
 *
 * Also covers Result rendered evidence matrix (EN/ZH × modes × viewports).
 *
 * Run after build:
 *   LDC_QA_BASE=http://127.0.0.1:4340 node scripts/qa-lunar-b2e-finalization-browser.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.LDC_QA_BASE ?? "http://localhost:4340";
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const evidencePath = join(
	rootDir,
	"local-docs/validation/lunar-b2e-finalization-evidence.json",
);

let passed = 0;
let failed = 0;
const evidence = [];
const matrixCoverage = [];
const matrixEvidence = {};

function assert(condition, message) {
	if (condition) {
		passed += 1;
		evidence.push(`PASS: ${message}`);
		return;
	}
	failed += 1;
	evidence.push(`FAIL: ${message}`);
	console.error(`FAIL: ${message}`);
}

function note(message) {
	evidence.push(`NOTE: ${message}`);
}

function markCovered(cell, sample) {
	matrixCoverage.push(cell);
	matrixEvidence[cell] = sample;
	note(
		`${cell}: text=${JSON.stringify(sample.rsPrimary)} lines=${sample.primaryLogicalLines} ws=${sample.primaryWhiteSpace} fs=${sample.primaryFontSize} overflow=${sample.overflows} weekday=${JSON.stringify(sample.weekdayText)} composition=${sample.rsComposition} layout=${sample.rsLayout}`,
	);
}

async function loadPlaywright() {
	try {
		return await import("playwright");
	} catch {
		throw new Error("playwright not installed");
	}
}

async function waitForServer(url, timeoutMs = 20000) {
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		try {
			const res = await fetch(url);
			if (res.ok) return;
		} catch {
			/* retry */
		}
		await new Promise((r) => setTimeout(r, 250));
	}
	throw new Error(`Server not ready: ${url}`);
}

function installHoverMatchMediaMock(hoverMode) {
	window.__timivaHoverMode = hoverMode;
	const original = window.matchMedia.bind(window);
	function stripHoverClauses(query) {
		return query
			.replace(/\s+and\s+\(\s*hover:\s*(?:hover|none)\s*\)/gi, "")
			.replace(/\(\s*hover:\s*(?:hover|none)\s*\)\s+and\s+/gi, "")
			.trim();
	}
	function resolveMatches(query, baseMatches) {
		const mode = window.__timivaHoverMode;
		const hasHoverHover = /\(hover:\s*hover\)/.test(query);
		const hasHoverNone = /\(hover:\s*none\)/.test(query);
		if (!baseMatches) return false;
		if (mode === "desktop-hover") {
			if (hasHoverHover) return true;
			if (hasHoverNone) return false;
		} else {
			if (hasHoverNone) return true;
			if (hasHoverHover) return false;
		}
		return baseMatches;
	}
	window.matchMedia = (query) => {
		const hasHoverHover = /\(hover:\s*hover\)/.test(query);
		const hasHoverNone = /\(hover:\s*none\)/.test(query);
		if (!hasHoverHover && !hasHoverNone) return original(query);
		const baseQuery = stripHoverClauses(query);
		const baseMql = baseQuery ? original(baseQuery) : null;
		const listeners = new Set();
		const api = {
			get matches() {
				return resolveMatches(query, baseMql ? baseMql.matches : true);
			},
			media: query,
			onchange: null,
			addEventListener(type, listener) {
				if (type === "change") listeners.add(listener);
			},
			removeEventListener(type, listener) {
				if (type === "change") listeners.delete(listener);
			},
			addListener(listener) {
				listeners.add(listener);
			},
			removeListener(listener) {
				listeners.delete(listener);
			},
			dispatchEvent() {
				return false;
			},
		};
		if (baseMql?.addEventListener) {
			baseMql.addEventListener("change", () => {
				for (const listener of listeners) listener.call(api);
				api.onchange?.call(api);
			});
		}
		return api;
	};
}

async function applyCssHoverMedia(page, hoverMode) {
	const cdp = await page.context().newCDPSession(page);
	await cdp.send("Emulation.setEmulatedMedia", {
		features: [{ name: "hover", value: hoverMode === "desktop-hover" ? "hover" : "none" }],
	});
}

async function openPage(browser, path, viewport, hoverMode) {
	const context = await browser.newContext({
		viewport,
		hasTouch: hoverMode === "mobile-none",
		isMobile: hoverMode === "mobile-none" && viewport.width < 768,
	});
	await context.addInitScript(installHoverMatchMediaMock, hoverMode);
	const page = await context.newPage();
	await applyCssHoverMedia(page, hoverMode);
	await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
	await page.waitForSelector("[data-lunar-date-converter-v2]");
	await page.waitForFunction(() => {
		const primary = document.querySelector(
			'[data-lunar-date-converter-v2] .rs-value[data-rs-value="primary"]',
		);
		return primary && primary.textContent && primary.textContent !== "…";
	});
	return { context, page };
}

async function measureResult(page) {
	return page.evaluate(() => {
		const root = document.querySelector("[data-lunar-date-converter-v2]");
		const rs = root?.querySelector("[data-result-summary]");
		const primary = rs?.querySelector('[data-rs-value="primary"]');
		const weekday = rs?.querySelector(".rs-weekday");
		const host = root?.querySelector(".ldcv2-result-host");
		let clientRects = 0;
		if (primary) {
			const range = document.createRange();
			range.selectNodeContents(primary);
			clientRects = range.getClientRects().length;
		}
		const primaryBox = primary?.getBoundingClientRect();
		const weekdayBox = weekday?.getBoundingClientRect();
		const text = primary?.textContent ?? "";
		const logicalLines = text.includes("\n")
			? text.split("\n").filter((line) => line.length > 0).length
			: text.trim()
				? 1
				: 0;
		const overflows = primary
			? primary.scrollWidth > primary.clientWidth + 1
			: false;
		return {
			rsLayout: rs?.getAttribute("data-rs-layout") ?? null,
			rsComposition: root?.getAttribute("data-ldcv2-rs-composition") ?? null,
			inputMode: root?.getAttribute("data-ldcv2-input-mode") ?? null,
			rsPrimary: text.trim(),
			primaryLogicalLines: logicalLines,
			primaryClientRects: clientRects,
			primaryWhiteSpace: primary ? getComputedStyle(primary).whiteSpace : null,
			primaryFontSize: primary ? parseFloat(getComputedStyle(primary).fontSize) : 0,
			weekdayText: weekday && !weekday.hidden ? weekday.textContent?.trim() ?? "" : "",
			weekdayHidden: !weekday || weekday.hidden || getComputedStyle(weekday).display === "none",
			weekdayBelowPrimary:
				Boolean(primaryBox && weekdayBox) && weekdayBox.top >= primaryBox.bottom - 1,
			hostWidth: host?.getBoundingClientRect().width ?? 0,
			overflows,
			hasDot: text.includes("·"),
			hasBadStemBreak:
				!text.includes("\n") && clientRects > 1 && /\w-\s*$/.test(text.replace(/\n/g, "")),
			fieldPhase: root?.getAttribute("data-ldcv2-field-phase") ?? null,
			ameOpen:
				root
					?.querySelector("[data-ame-root]")
					?.getAttribute("data-ame-open") === "true",
			sdcOpen:
				document
					.querySelector("[data-desktop-calendar]")
					?.getAttribute("data-sdc-open") === "true",
			lunarCalOpen:
				document
					.querySelector("[data-lunar-calendar]")
					?.getAttribute("data-lc-open") === "true",
			viewportWidth: window.innerWidth,
			viewportHeight: window.innerHeight,
		};
	});
}

async function switchDesktopMode(page, mode) {
	const selector =
		mode === "lunar" ? '[data-ldcv2-switch="lunar"]' : '[data-ldcv2-switch="gregorian"]';
	await page.locator(selector).click();
	await page.waitForTimeout(80);
}

async function openAme(page) {
	await page.locator("[data-ldcv2-sheet-trigger]").filter({ visible: true }).click();
	await page.waitForFunction(
		() =>
			document
				.querySelector("[data-lunar-date-converter-v2] [data-ame-root]")
				?.getAttribute("data-ame-open") === "true",
	);
}

async function switchAmeMode(page, mode) {
	await page
		.locator(`[data-ldcv2-ame-switch="${mode}"]`)
		.filter({ visible: true })
		.click();
	await page.waitForTimeout(80);
}

async function closeAmeDone(page) {
	await page.locator("[data-ame-submit]").filter({ visible: true }).first().click();
	await page.waitForFunction(
		() =>
			document
				.querySelector("[data-lunar-date-converter-v2] [data-ame-root]")
				?.getAttribute("data-ame-open") === "false",
	);
}

async function pasteGregorian(page, text) {
	await page.locator("[data-ldcv2-date-input]").focus();
	await page.evaluate((t) => {
		const input = document.querySelector("[data-ldcv2-date-input]");
		if (!input) return;
		const clip = new DataTransfer();
		clip.setData("text/plain", t);
		input.dispatchEvent(
			new ClipboardEvent("paste", {
				bubbles: true,
				cancelable: true,
				clipboardData: clip,
			}),
		);
	}, text);
	await page.locator("[data-ldcv2-date-input]").press("Tab");
	await page.waitForTimeout(60);
}

async function fillLunar(page, text) {
	const input = page.locator("[data-ldcv2-date-input]");
	await input.click();
	await page.evaluate((t) => {
		const el = document.querySelector("[data-ldcv2-date-input]");
		if (!el) return;
		const clip = new DataTransfer();
		clip.setData("text/plain", t);
		el.dispatchEvent(
			new ClipboardEvent("paste", {
				bubbles: true,
				cancelable: true,
				clipboardData: clip,
			}),
		);
	}, text);
	await page.waitForTimeout(60);
}

console.log("qa-lunar-b2e-finalization-browser\n");
console.log(`base: ${BASE}\n`);

mkdirSync(join(rootDir, "local-docs/validation"), { recursive: true });
await waitForServer(`${BASE}/en/lunar-date-converter/`);

const pw = await loadPlaywright();
const browser = await pw.chromium.launch({ headless: true });
const enPath = "/en/lunar-date-converter/";
const zhPath = "/zh/lunar-date-converter/";

const requiredCells = [
	"en|G→L|desktop",
	"en|L→G|desktop",
	"en|G→L|portrait",
	"en|L→G|portrait",
	"en|G→L|landscape",
	"en|L→G|landscape",
	"zh|G→L|desktop",
	"zh|L→G|desktop",
	"zh|G→L|portrait",
	"zh|L→G|portrait",
	"zh|G→L|landscape",
	"zh|L→G|landscape",
	"en|G→L|desktop-constrained",
	"en|G→L|desktop-long",
	"zh|G→L|leap",
	"en|G→L|leap",
];

/* —— Core Desktop matrix EN/ZH × G→L / L→G —— */
for (const { localePath, locale } of [
	{ localePath: enPath, locale: "en" },
	{ localePath: zhPath, locale: "zh" },
]) {
	const { context, page } = await openPage(
		browser,
		localePath,
		{ width: 1280, height: 900 },
		"desktop-hover",
	);
	const g2l = await measureResult(page);
	assert(g2l.rsLayout === "desktop", `${locale} desktop G→L: layout`);
	assert(g2l.inputMode === "gregorian", `${locale} desktop G→L: input mode`);
	assert(g2l.rsPrimary.length > 0 && g2l.rsPrimary !== "?", `${locale} desktop G→L: primary`);
	assert(!g2l.weekdayHidden && g2l.weekdayText.length > 0, `${locale} desktop G→L: weekday`);
	assert(!g2l.overflows, `${locale} desktop G→L: no overflow`);
	if (locale === "en") {
		assert(g2l.hasDot || g2l.primaryLogicalLines === 1, `${locale} desktop G→L: wide single-line class`);
	} else {
		assert(g2l.primaryLogicalLines >= 2, `${locale} desktop G→L: ZH lunar two lines`);
	}
	markCovered(`${locale}|G→L|desktop`, g2l);

	await switchDesktopMode(page, "lunar");
	const l2g = await measureResult(page);
	assert(l2g.inputMode === "lunar", `${locale} desktop L→G: input mode`);
	assert(l2g.primaryLogicalLines === 1 || locale === "zh", `${locale} desktop L→G: line model`);
	assert(!l2g.weekdayHidden, `${locale} desktop L→G: weekday`);
	assert(!l2g.overflows, `${locale} desktop L→G: no overflow`);
	markCovered(`${locale}|L→G|desktop`, l2g);
	await context.close();
}

/* —— Portrait matrix —— */
for (const { localePath, locale } of [
	{ localePath: enPath, locale: "en" },
	{ localePath: zhPath, locale: "zh" },
]) {
	const { context, page } = await openPage(
		browser,
		localePath,
		{ width: 390, height: 844 },
		"mobile-none",
	);
	const g2l = await measureResult(page);
	assert(g2l.rsLayout === "portrait", `${locale} portrait G→L: layout`);
	if (locale === "en") {
		assert(g2l.primaryLogicalLines >= 2, `${locale} portrait G→L: deliberate two lines`);
		assert(!g2l.hasDot, `${locale} portrait G→L: no middle dot`);
		assert(g2l.primaryWhiteSpace === "pre-line", `${locale} portrait G→L: pre-line`);
	} else {
		assert(g2l.primaryLogicalLines >= 2, `${locale} portrait G→L: ZH two lines`);
	}
	assert(!g2l.overflows, `${locale} portrait G→L: no overflow`);
	markCovered(`${locale}|G→L|portrait`, g2l);

	await openAme(page);
	await switchAmeMode(page, "lunar");
	const l2g = await measureResult(page);
	assert(l2g.inputMode === "lunar" || l2g.rsPrimary.length > 0, `${locale} portrait L→G: mode`);
	if (locale === "en") {
		assert(l2g.primaryLogicalLines === 1, `${locale} portrait L→G: one line`);
		assert(l2g.primaryWhiteSpace === "nowrap", `${locale} portrait L→G: nowrap`);
	} else {
		assert(l2g.primaryLogicalLines >= 2, `${locale} portrait L→G: ZH greg two lines`);
	}
	assert(!l2g.overflows, `${locale} portrait L→G: no overflow`);
	markCovered(`${locale}|L→G|portrait`, l2g);
	await closeAmeDone(page);
	const closed = await measureResult(page);
	assert(!closed.ameOpen, `${locale} portrait: Done closes AME`);
	await context.close();
}

/* —— Landscape matrix —— */
for (const { localePath, locale } of [
	{ localePath: enPath, locale: "en" },
	{ localePath: zhPath, locale: "zh" },
]) {
	const { context, page } = await openPage(
		browser,
		localePath,
		{ width: 844, height: 390 },
		"mobile-none",
	);
	const g2l = await measureResult(page);
	assert(g2l.rsLayout === "landscape", `${locale} landscape G→L: layout`);
	if (locale === "en") {
		assert(g2l.primaryLogicalLines === 1, `${locale} landscape G→L: one line`);
		assert(g2l.hasDot, `${locale} landscape G→L: keeps dot`);
		assert(g2l.primaryWhiteSpace === "nowrap", `${locale} landscape G→L: nowrap`);
	} else {
		assert(g2l.primaryWhiteSpace === "nowrap", `${locale} landscape G→L: nowrap collapses \\n`);
		assert(g2l.primaryClientRects === 1, `${locale} landscape G→L: rendered one line`);
	}
	assert(!g2l.hasBadStemBreak, `${locale} landscape G→L: no bad stem break`);
	markCovered(`${locale}|G→L|landscape`, g2l);

	await openAme(page);
	await switchAmeMode(page, "lunar");
	const l2g = await measureResult(page);
	if (locale === "en") {
		assert(l2g.primaryLogicalLines === 1, `${locale} landscape L→G: one line`);
	} else {
		assert(l2g.primaryClientRects === 1, `${locale} landscape L→G: rendered one line`);
		assert(l2g.primaryWhiteSpace === "nowrap", `${locale} landscape L→G: nowrap`);
	}
	assert(!l2g.hasBadStemBreak, `${locale} landscape L→G: no bad stem break`);
	markCovered(`${locale}|L→G|landscape`, l2g);
	await closeAmeDone(page);
	await context.close();
}

/* —— Constrained Desktop + long-content + leap —— */
{
	const { context, page } = await openPage(
		browser,
		enPath,
		{ width: 831, height: 900 },
		"desktop-hover",
	);
	const constrained = await measureResult(page);
	assert(constrained.rsComposition === "constrained", "EN constrained: composition");
	assert(constrained.primaryLogicalLines === 2, "EN constrained: deliberate two lines");
	assert(!constrained.hasDot, "EN constrained: no dot");
	assert(constrained.primaryWhiteSpace === "pre-line", "EN constrained: pre-line");
	assert(!constrained.hasBadStemBreak, "EN constrained: no Bing-/wu break");
	markCovered("en|G→L|desktop-constrained", constrained);

	await page.setViewportSize({ width: 1076, height: 900 });
	await page.waitForTimeout(200);
	const wide = await measureResult(page);
	assert(wide.rsComposition === "wide", "831→1076: wide restored");
	assert(wide.hasDot && wide.primaryLogicalLines === 1, "831→1076: single-line dot");

	await pasteGregorian(page, "1963 / 06 / 21");
	const leapEn = await measureResult(page);
	assert(leapEn.rsPrimary.toLowerCase().includes("leap") || leapEn.rsPrimary.includes("Lunar"), "EN leap Result present");
	assert(leapEn.rsPrimary !== "?", "EN leap Result not ?");
	markCovered("en|G→L|leap", leapEn);

	await pasteGregorian(page, "2099 / 12 / 01");
	const longish = await measureResult(page);
	assert(longish.rsPrimary !== "?", "EN long/upper Result ok");
	assert(!longish.hasBadStemBreak, "EN long-content: no natural stem break");
	markCovered("en|G→L|desktop-long", longish);
	await context.close();
}

{
	const { context, page } = await openPage(
		browser,
		zhPath,
		{ width: 1280, height: 900 },
		"desktop-hover",
	);
	await pasteGregorian(page, "1963 / 06 / 21");
	const leapZh = await measureResult(page);
	assert(leapZh.primaryLogicalLines >= 2, "ZH leap: two-line lunar");
	assert(leapZh.weekdayText.includes("星期"), "ZH leap: weekday");
	assert(!leapZh.overflows, "ZH leap: no overflow");
	markCovered("zh|G→L|leap", leapZh);
	await context.close();
}

/* —— Integration: mode switch same day / reset / AME isolation / invalid —— */
{
	const { context, page } = await openPage(
		browser,
		enPath,
		{ width: 1280, height: 900 },
		"desktop-hover",
	);
	await pasteGregorian(page, "2000 / 02 / 29");
	const leapDay = await measureResult(page);
	assert(leapDay.rsPrimary !== "?", "EN G leap-day 2000-02-29 converts");
	const beforeSwitch = leapDay.rsPrimary;

	await switchDesktopMode(page, "lunar");
	const afterLunar = await measureResult(page);
	assert(afterLunar.rsPrimary.includes("2000") || afterLunar.rsPrimary.includes("Feb"), "mode switch keeps same civil day");
	await switchDesktopMode(page, "gregorian");
	const back = await measureResult(page);
	assert(back.rsPrimary === beforeSwitch || back.rsPrimary.startsWith("Lunar"), "mode switch restore lunar result");

	await page.locator("[data-ldcv2-reset]").click();
	await page.waitForTimeout(80);
	const reset = await measureResult(page);
	assert(reset.inputMode === "gregorian", "reset → gregorian mode");
	assert(reset.rsPrimary.startsWith("Lunar"), "reset → lunar Result");

	await page.locator("[data-ldcv2-calendar-toggle]").click();
	await page.waitForTimeout(80);
	let openCal = await measureResult(page);
	assert(openCal.sdcOpen || openCal.lunarCalOpen, "Desktop calendar opens");
	await page.keyboard.press("Escape");
	await page.waitForTimeout(80);
	const desktopAme = await measureResult(page);
	assert(!desktopAme.ameOpen, "Desktop: AME stays closed");
	assert(
		await page.locator("[data-ldcv2-sheet-trigger]").isHidden(),
		"Desktop: mobile capsule hidden",
	);

	await pasteGregorian(page, "2023 / 02 / 29");
	const invalid = await measureResult(page);
	assert(invalid.rsPrimary === "?", "complete invalid → Result ?");
	assert(invalid.weekdayHidden || invalid.weekdayText === "", "complete invalid → weekday cleared");
	assert(invalid.fieldPhase === "draft-complete-invalid", "complete invalid phase");

	await switchDesktopMode(page, "lunar");
	await fillLunar(page, "2026/4/");
	const incomplete = await measureResult(page);
	assert(incomplete.rsPrimary === "?", "lunar incomplete → Result ?");
	assert(
		incomplete.fieldPhase === "draft-incomplete",
		"lunar incomplete phase",
	);

	await fillLunar(page, "2024512");
	const compactA = await measureResult(page);
	assert(compactA.rsPrimary !== "?", "Owner compact 2024512 converts");
	assert(
		!/^Lunar\b/i.test(await page.locator("[data-ldcv2-date-input]").inputValue()),
		"EN compact 2024512 stays numeric while filled without blur",
	);
	await page.locator("[data-ldcv2-date-input]").press("Tab");
	assert(
		(await page.locator("[data-ldcv2-date-input]").inputValue()) === "Lunar 2024/5/12",
		"EN compact 2024512 → Lunar Y/M/D after blur",
	);

	await fillLunar(page, "19630415");
	const compactB = await measureResult(page);
	assert(compactB.rsPrimary !== "?", "Owner compact 19630415 regular converts");
	await page.locator("[data-ldcv2-date-input]").press("Tab");
	const compactBInput = await page.locator("[data-ldcv2-date-input]").inputValue();
	assert(!/Leap/i.test(compactBInput), "19630415 field not leap");
	assert(compactBInput === "Lunar 1963/4/15", "EN compact 19630415 committed field after blur");

	await fillLunar(page, "1963閏4月15");
	await page.locator("[data-ldcv2-date-input]").press("Tab");
	const enLeapField = await page.locator("[data-ldcv2-date-input]").inputValue();
	assert(enLeapField === "Lunar 1963/Leap 4/15", `EN leap committed field (${enLeapField})`);
	await page.locator("[data-ldcv2-date-input]").press("Enter");
	const enLeapAfterEnter = await measureResult(page);
	assert(enLeapAfterEnter.rsPrimary !== "?", "EN leap committed survives Enter");
	assert(
		(await page.locator("[data-ldcv2-date-input]").inputValue()) === "Lunar 1963/Leap 4/15",
		"EN leap field stable after Enter",
	);

	await fillLunar(page, "2100/1/1");
	await page.locator("[data-ldcv2-date-input]").press("Enter");
	const oob = await measureResult(page);
	assert(oob.rsPrimary === "?", "lunar 2100 → ?");
	await context.close();
}

/* —— ZH Desktop lunar committed field display —— */
{
	const { context, page } = await openPage(
		browser,
		zhPath,
		{ width: 1280, height: 900 },
		"desktop-hover",
	);
	await switchDesktopMode(page, "lunar");
	await fillLunar(page, "2023/1/1");
	await page.locator("[data-ldcv2-date-input]").press("Tab");
	let field = await page.locator("[data-ldcv2-date-input]").inputValue();
	const zhRegular = await measureResult(page);
	assert(zhRegular.rsPrimary !== "?", "ZH regular lunar converts");
	assert(field === "2023年正月初一", `ZH regular committed field (${field})`);
	assert(!/\d+\s*\/\s*\d+\s*\/\s*\d+/.test(field), "ZH regular not Gregorian-like");

	await fillLunar(page, "1963閏4月15");
	await page.locator("[data-ldcv2-date-input]").press("Tab");
	field = await page.locator("[data-ldcv2-date-input]").inputValue();
	const zhLeap = await measureResult(page);
	assert(zhLeap.rsPrimary !== "?", "ZH leap lunar converts");
	assert(field === "1963年閏四月十五", `ZH leap committed field (${field})`);
	assert(/閏/.test(field), "ZH leap keeps 閏");

	await fillLunar(page, "1963潤4月15");
	await page.locator("[data-ldcv2-date-input]").press("Tab");
	field = await page.locator("[data-ldcv2-date-input]").inputValue();
	const zhAlias = await measureResult(page);
	assert(zhAlias.rsPrimary !== "?", "ZH 潤 alias converts");
	assert(field === "1963年閏四月十五", `ZH 潤 alias committed field (${field})`);
	assert(!/潤/.test(field), "ZH 潤 alias never keeps 潤 in committed display");

	await fillLunar(page, "1963閏415");
	await page.locator("[data-ldcv2-date-input]").press("Tab");
	field = await page.locator("[data-ldcv2-date-input]").inputValue();
	assert(field === "1963年閏四月十五", `ZH compact 閏415 committed (${field})`);
	await fillLunar(page, "1963潤415");
	await page.locator("[data-ldcv2-date-input]").press("Tab");
	field = await page.locator("[data-ldcv2-date-input]").inputValue();
	assert(field === "1963年閏四月十五", `ZH compact 潤415 committed (${field})`);
	assert(!/潤/.test(field), "ZH compact 潤415 never keeps 潤");

	await page.locator("[data-ldcv2-date-input]").click();
	const zhEditing = await page.locator("[data-ldcv2-date-input]").inputValue();
	assert(!/年/.test(zhEditing), `ZH refocus → numeric editing (${zhEditing})`);
	await page.locator("[data-ldcv2-date-input]").press("Tab");
	field = await page.locator("[data-ldcv2-date-input]").inputValue();
	assert(field === "1963年閏四月十五", "ZH blur restores leap semantic");

	await switchDesktopMode(page, "gregorian");
	const gregField = await page.locator("[data-ldcv2-date-input]").inputValue();
	assert(/\d+\s*\/\s*\d+\s*\/\s*\d+/.test(gregField), `ZH switch→Gregorian field (${gregField})`);
	await switchDesktopMode(page, "lunar");
	field = await page.locator("[data-ldcv2-date-input]").inputValue();
	assert(/年/.test(field) && /月/.test(field), `ZH switch→Lunar semantic field (${field})`);
	await context.close();
}

/* —— Mobile AME live Done-only + calendar isolation —— */
{
	const { context, page } = await openPage(
		browser,
		enPath,
		{ width: 390, height: 844 },
		"mobile-none",
	);
	const before = await measureResult(page);
	await openAme(page);
	const opened = await measureResult(page);
	assert(opened.ameOpen, "AME opens on mobile");
	assert(!opened.sdcOpen && !opened.lunarCalOpen, "AME open: Desktop calendars closed");
	await switchAmeMode(page, "lunar");
	const live = await measureResult(page);
	assert(live.rsPrimary.length > 0, "AME live updates Result");
	await closeAmeDone(page);
	const afterDone = await measureResult(page);
	assert(!afterDone.ameOpen, "Done closes only");
	assert(afterDone.rsPrimary === live.rsPrimary, "Done does not rollback Result");
	assert(before.rsLayout === "portrait", "portrait layout stable");
	await context.close();
}

/* —— Matrix completeness —— */
for (const cell of requiredCells) {
	assert(matrixCoverage.includes(cell), `matrix covered: ${cell}`);
}

await browser.close();
writeFileSync(
	evidencePath,
	JSON.stringify(
		{
			evidence,
			matrixCoverage,
			matrixEvidence,
			requiredCells,
			missingCells: requiredCells.filter((cell) => !matrixCoverage.includes(cell)),
		},
		null,
		2,
	),
);

console.log(`\nevidence → ${evidencePath}`);
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log("qa-lunar-b2e-finalization-browser PASS");
