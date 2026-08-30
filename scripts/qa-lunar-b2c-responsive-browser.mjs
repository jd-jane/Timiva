/**
 * Lunar B2C + Batch 4 — Responsive Composition Browser QA.
 *
 * Blocking fixtures（§6.0.3）:
 *   823×800 / 799×800 hover:hover → Desktop
 *   700×500 hover:hover → Mobile Default
 *   390×844 hover:none → Mobile Default
 *   667×375 / 844×390 / 932×430 hover:none → Mobile Landscape
 *
 * Also: B2C calendar geometry stability；short-height Desktop continuity.
 *
 * Run after build: npx astro preview --port 4340 &
 *   LDC_QA_BASE=http://localhost:4340 node scripts/qa-lunar-b2c-responsive-browser.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.LDC_QA_BASE ?? "http://localhost:4340";
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const evidencePath = join(
	rootDir,
	"local-docs/validation/lunar-b2c-responsive-geometry.json",
);

let passed = 0;
let failed = 0;
const evidence = [];

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

async function loadPlaywright() {
	try {
		return await import("playwright");
	} catch {
		throw new Error("playwright not installed");
	}
}

async function waitForServer(url, timeoutMs = 15000) {
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

/**
 * Compound-aware hover mock: override hover clause when non-hover MQ parts match.
 * Forwards change events from the stripped base MediaQueryList so resize listeners work.
 * @param {"desktop-hover"|"mobile-none"} hoverMode
 */
function installHoverMatchMediaMock(hoverMode) {
	const original = window.matchMedia.bind(window);

	function stripHoverClauses(query) {
		return query
			.replace(/\s+and\s+\(\s*hover:\s*(?:hover|none)\s*\)/gi, "")
			.replace(/\(\s*hover:\s*(?:hover|none)\s*\)\s+and\s+/gi, "")
			.trim();
	}

	function resolveMatches(query, baseMatches) {
		const hasHoverHover = /\(hover:\s*hover\)/.test(query);
		const hasHoverNone = /\(hover:\s*none\)/.test(query);
		if (!baseMatches) return false;
		if (hoverMode === "desktop-hover") {
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
		if (!hasHoverHover && !hasHoverNone) {
			return original(query);
		}

		const baseQuery = stripHoverClauses(query);
		const baseMql = baseQuery ? original(baseQuery) : null;
		const listeners = new Set();

		const api = {
			get matches() {
				const baseMatches = baseMql ? baseMql.matches : true;
				return resolveMatches(query, baseMatches);
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
				return true;
			},
		};

		const notify = () => {
			const event = { matches: api.matches, media: query };
			for (const listener of listeners) listener(event);
			if (typeof api.onchange === "function") api.onchange(event);
		};

		if (baseMql && typeof baseMql.addEventListener === "function") {
			baseMql.addEventListener("change", notify);
		} else if (baseMql && typeof baseMql.addListener === "function") {
			baseMql.addListener(notify);
		}

		return api;
	};
}

/**
 * @param {"desktop-hover"|"mobile-none"} hoverMode
 */
async function openPage(browser, path, viewport, hoverMode) {
	const context = await browser.newContext({
		viewport,
		hasTouch: hoverMode === "mobile-none",
		isMobile: hoverMode === "mobile-none" && viewport.width < 768,
	});
	await context.addInitScript(installHoverMatchMediaMock, hoverMode);
	const page = await context.newPage();
	await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
	await page.waitForSelector("[data-lunar-date-converter-v2]");
	return { context, page };
}

async function switchToLunar(page) {
	await page.waitForFunction(() => {
		const cluster = document.querySelector(".ldcv2-input-cluster--desktop");
		return cluster && getComputedStyle(cluster).display !== "none";
	});
	await page.evaluate(() => {
		const btn = document.querySelector('[data-ldcv2-switch="lunar"]');
		if (btn instanceof HTMLElement && !btn.hidden) btn.click();
	});
	await page.waitForFunction(
		() =>
			document
				.querySelector("[data-lunar-date-converter-v2]")
				?.getAttribute("data-ldcv2-input-mode") === "lunar",
	);
}

async function clickCalendarToggle(page) {
	await page.evaluate(() => {
		const btn = document.querySelector("[data-ldcv2-calendar-toggle]");
		if (btn instanceof HTMLElement) btn.click();
	});
}

async function measureLc(page) {
	return page.evaluate(() => {
		const lc = document.querySelector("[data-lunar-calendar]");
		if (!lc) return null;
		const rect = lc.getBoundingClientRect();
		const style = getComputedStyle(lc);
		return {
			open: lc.getAttribute("data-ldc-lc-open") === "true",
			width: rect.width,
			height: rect.height,
			computedWidth: style.width,
			posWidth: lc.style.getPropertyValue("--ldc-lc-pos-width").trim(),
		};
	});
}

async function measureOps(page) {
	return page.evaluate(() => {
		const api = window.TimivaLunarDateConverterLayout;
		const desktop = document.querySelector(".ldcv2-input-cluster--desktop");
		const mobile = document.querySelector(
			"[data-tool-page-frame] .tpf-mobile-controls",
		);
		const capsule = document.querySelector(".ldcv2-mobile-capsule");
		const rs = document.querySelector(
			"[data-lunar-date-converter-v2] [data-result-summary]",
		);
		const dStyle = desktop ? getComputedStyle(desktop) : null;
		const mStyle = mobile ? getComputedStyle(mobile) : null;
		const cStyle = capsule ? getComputedStyle(capsule) : null;
		const capsuleRect = capsule?.getBoundingClientRect();
		const desktopVisible =
			Boolean(desktop) &&
			dStyle.display !== "none" &&
			desktop.getBoundingClientRect().height > 0;
		const mobileVisible =
			Boolean(mobile) &&
			mStyle.display !== "none" &&
			mobile.getBoundingClientRect().height > 0;
		const minH = parseFloat(cStyle?.minHeight ?? "0");
		const padY = parseFloat(cStyle?.paddingTop ?? "0");
		const landscapeCompact =
			mobileVisible &&
			!desktopVisible &&
			minH > 0 &&
			minH <= 36 &&
			padY <= 8;
		const activeOwners =
			(desktopVisible ? 1 : 0) + (mobileVisible ? 1 : 0);
		return {
			desktopDisplay: dStyle?.display ?? "missing",
			mobileDisplay: mStyle?.display ?? "missing",
			desktopVisible,
			mobileVisible,
			landscapeCompact,
			activeOwners,
			capsuleMinHeight: cStyle?.minHeight ?? null,
			capsuleHeight: capsuleRect?.height ?? 0,
			capsulePaddingTop: cStyle?.paddingTop ?? null,
			lcOpen:
				document
					.querySelector("[data-lunar-calendar]")
					?.getAttribute("data-ldc-lc-open") === "true",
			sdcOpen:
				document
					.querySelector("[data-desktop-calendar]")
					?.getAttribute("data-sdc-open") === "true",
			rsLayout: rs?.getAttribute("data-rs-layout") ?? null,
			resolveMode: api?.resolveLayoutMode?.(window) ?? null,
		};
	});
}

async function waitLunarOpen(page) {
	await page.waitForFunction(() => {
		const lc = document.querySelector("[data-lunar-calendar]");
		return (
			lc?.getAttribute("data-ldc-lc-open") === "true" &&
			Boolean(lc.style.getPropertyValue("--ldc-lc-pos-width")?.trim())
		);
	});
}

async function waitLunarClosed(page) {
	await page.waitForFunction(
		() =>
			document
				.querySelector("[data-lunar-calendar]")
				?.getAttribute("data-ldc-lc-open") === "false",
	);
}

async function openCloseCycle(page, times) {
	const widths = [];
	for (let i = 0; i < times; i += 1) {
		await clickCalendarToggle(page);
		await waitLunarOpen(page);
		const m = await measureLc(page);
		widths.push(m);
		await clickCalendarToggle(page);
		await waitLunarClosed(page);
	}
	return widths;
}

console.log("qa-lunar-b2c-responsive-browser\n");
console.log(`base: ${BASE}\n`);

mkdirSync(join(rootDir, "local-docs/validation"), { recursive: true });
await waitForServer(`${BASE}/en/lunar-date-converter/`);

const pw = await loadPlaywright();
const browser = await pw.chromium.launch({ headless: true });
const geometryLog = {};
const enPath = "/en/lunar-date-converter/";
const zhPath = "/zh/lunar-date-converter/";

/* —— Calendar geometry ×20 (desktop composition) —— */
for (const viewport of [
	{ name: "1280x900", width: 1280, height: 900 },
	{ name: "1000x800", width: 1000, height: 800 },
	{ name: "900x800", width: 900, height: 800 },
]) {
	const { context, page } = await openPage(
		browser,
		enPath,
		viewport,
		"desktop-hover",
	);
	await switchToLunar(page);
	const samples = await openCloseCycle(page, 20);
	const openWidths = samples.map((s) => Math.round(s.width * 100) / 100);
	const first = openWidths[0];
	const maxDelta = Math.max(...openWidths.map((w) => Math.abs(w - first)));
	geometryLog[viewport.name] = { widths: openWidths, first, maxDelta };
	assert(maxDelta < 1, `${viewport.name}: open width stable ×20 (Δ=${maxDelta})`);
	assert(first > 350 && first < 400, `${viewport.name}: width ≈376px (${first})`);
	await context.close();
}

/* —— A. Desktop continuity（含 blocking 823／799／短高度） —— */
for (const localePath of [enPath, zhPath]) {
	const locale = localePath.includes("/zh/") ? "zh" : "en";
	for (const { width, height, label } of [
		{ width: 1280, height: 900, label: "1280×900" },
		{ width: 900, height: 800, label: "900×800" },
		{ width: 899, height: 800, label: "899×800" },
		{ width: 824, height: 800, label: "824×800" },
		{ width: 823, height: 800, label: "823×800" },
		{ width: 799, height: 800, label: "799×800" },
		{ width: 768, height: 800, label: "768×800" },
		{ width: 900, height: 650, label: "900×650 short" },
		{ width: 824, height: 650, label: "824×650 short" },
	]) {
		const { context, page } = await openPage(
			browser,
			localePath,
			{ width, height },
			"desktop-hover",
		);
		const ops = await measureOps(page);
		note(
			`A ${locale} ${label}: desktop=${ops.desktopVisible} mobile=${ops.mobileVisible} rs=${ops.rsLayout} mode=${ops.resolveMode} owners=${ops.activeOwners}`,
		);
		assert(ops.desktopVisible, `A ${locale} ${label}: desktop cluster visible`);
		assert(!ops.mobileVisible, `A ${locale} ${label}: mobile controls hidden`);
		assert(!ops.landscapeCompact, `A ${locale} ${label}: NOT Mobile Landscape compact`);
		assert(ops.activeOwners === 1, `A ${locale} ${label}: active primary input owner = 1`);
		assert(
			ops.rsLayout === "desktop" && ops.resolveMode === "desktop",
			`A ${locale} ${label}: layout-contract + data-rs-layout = desktop`,
		);
		await context.close();
	}
}

/* A: drag-narrow round-trip — calendar stays in desktop composition at 824 */
{
	const { context, page } = await openPage(
		browser,
		enPath,
		{ width: 1280, height: 900 },
		"desktop-hover",
	);
	await switchToLunar(page);
	await clickCalendarToggle(page);
	await waitLunarOpen(page);

	await page.setViewportSize({ width: 824, height: 800 });
	await page.waitForTimeout(150);
	const at824 = await measureOps(page);
	assert(at824.desktopVisible, "A resize 1280→824: desktop cluster still visible");
	assert(!at824.landscapeCompact, "A resize 1280→824: no flat landscape capsule");
	note(`A resize 824: lcOpen=${at824.lcOpen} (desktop composition keeps calendar)`);

	await page.setViewportSize({ width: 767, height: 800 });
	await page.waitForTimeout(150);
	const at767 = await measureOps(page);
	assert(!at767.lcOpen && !at767.sdcOpen, "A resize →767: calendars safely closed");
	assert(at767.mobileVisible, "A resize →767: mobile controls visible");
	assert(at767.activeOwners === 1, "A resize →767: active owner = 1");

	await page.setViewportSize({ width: 1280, height: 900 });
	await page.waitForTimeout(150);
	await clickCalendarToggle(page);
	await waitLunarOpen(page);
	const reopened = await measureLc(page);
	assert(reopened.width > 350, `A resize back: calendar reopen width ok (${reopened.width})`);
	await context.close();
}

/* —— B. Mobile Default —— */
for (const localePath of [enPath, zhPath]) {
	const locale = localePath.includes("/zh/") ? "zh" : "en";
	for (const { width, height, label, hoverMode } of [
		{ width: 390, height: 844, label: "390×844", hoverMode: "mobile-none" },
		{ width: 700, height: 500, label: "700×500", hoverMode: "desktop-hover" },
		/* Corrective：767–733 窄窗必須完整 56px Default capsule */
		{ width: 767, height: 800, label: "767×800", hoverMode: "desktop-hover" },
		{ width: 760, height: 800, label: "760×800", hoverMode: "desktop-hover" },
		{ width: 750, height: 800, label: "750×800", hoverMode: "desktop-hover" },
		{ width: 740, height: 800, label: "740×800", hoverMode: "desktop-hover" },
		{ width: 733, height: 800, label: "733×800", hoverMode: "desktop-hover" },
	]) {
		const { context, page } = await openPage(
			browser,
			localePath,
			{ width, height },
			hoverMode,
		);
		const ops = await measureOps(page);
		const minH = parseFloat(ops.capsuleMinHeight ?? "0");
		note(
			`B ${locale} ${label}: desktop=${ops.desktopVisible} mobile=${ops.mobileVisible} minH=${ops.capsuleMinHeight} h=${ops.capsuleHeight} rs=${ops.rsLayout}`,
		);
		assert(!ops.desktopVisible, `B ${locale} ${label}: desktop hidden`);
		assert(ops.mobileVisible, `B ${locale} ${label}: mobile visible`);
		assert(!ops.landscapeCompact, `B ${locale} ${label}: NOT landscape compact`);
		assert(ops.activeOwners === 1, `B ${locale} ${label}: active owner = 1`);
		assert(
			ops.rsLayout === "portrait" && ops.resolveMode === "portrait",
			`B ${locale} ${label}: layout-contract + data-rs-layout = portrait`,
		);
		assert(
			minH >= 56 || ops.capsuleHeight >= 52,
			`B ${locale} ${label}: Mobile Default capsule ≥56px (minH=${ops.capsuleMinHeight}, h=${ops.capsuleHeight})`,
		);
		await context.close();
	}
}

/* —— C. Mobile Landscape —— */
for (const localePath of [enPath, zhPath]) {
	const locale = localePath.includes("/zh/") ? "zh" : "en";
	for (const { width, height, label } of [
		{ width: 667, height: 375, label: "667×375" },
		{ width: 844, height: 390, label: "844×390" },
		{ width: 932, height: 430, label: "932×430" },
	]) {
		const { context, page } = await openPage(
			browser,
			localePath,
			{ width, height },
			"mobile-none",
		);
		const ops = await measureOps(page);
		note(
			`C ${locale} ${label}: desktop=${ops.desktopVisible} mobile=${ops.mobileVisible} minH=${ops.capsuleMinHeight} rs=${ops.rsLayout}`,
		);
		assert(!ops.desktopVisible, `C ${locale} ${label}: desktop hidden`);
		assert(ops.mobileVisible, `C ${locale} ${label}: mobile visible`);
		assert(ops.landscapeCompact, `C ${locale} ${label}: landscape compact capsule`);
		assert(ops.activeOwners === 1, `C ${locale} ${label}: active owner = 1`);
		assert(
			ops.rsLayout === "landscape" && ops.resolveMode === "landscape-lunar",
			`C ${locale} ${label}: layout-contract + data-rs-layout = landscape`,
		);
		await context.close();
	}
}

/* —— Composition boundary calendar close (767) —— */
{
	const { context, page } = await openPage(
		browser,
		enPath,
		{ width: 1280, height: 900 },
		"desktop-hover",
	);
	await switchToLunar(page);
	await clickCalendarToggle(page);
	await waitLunarOpen(page);
	await page.setViewportSize({ width: 767, height: 800 });
	await page.waitForTimeout(200);
	const closed = await measureOps(page);
	assert(!closed.lcOpen, "boundary 1280→767: lunar calendar closed");
	await context.close();
}

/* —— Gregorian + Lunar modes at 824 desktop resize —— */
{
	const { context, page } = await openPage(
		browser,
		zhPath,
		{ width: 824, height: 800 },
		"desktop-hover",
	);
	let ops = await measureOps(page);
	assert(ops.desktopVisible, "ZH 824: gregorian desktop visible");
	await switchToLunar(page);
	ops = await measureOps(page);
	assert(ops.desktopVisible, "ZH 824 lunar mode: desktop still visible");
	await context.close();
}

await browser.close();

writeFileSync(evidencePath, JSON.stringify({ geometryLog, evidence }, null, 2));
console.log(`\nevidence → ${evidencePath}`);
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log("qa-lunar-b2c-responsive-browser PASS");
