/**
 * Date Range Calculator — Phase 1 Composition + Input Ownership (browser).
 *
 * Run after build:
 *   npx astro preview --host 127.0.0.1 --port 4387
 *   DRV2_QA_BASE=http://127.0.0.1:4387 node scripts/qa-date-range-calculator-responsive-ownership-browser.mjs
 *
 * Does not fail on known Phase 2 sheet chrome (double-wrapper / duplicate Clear / scroll).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.DRV2_QA_BASE ?? "http://127.0.0.1:4387";
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const evidencePath = join(
	rootDir,
	"local-docs/validation/date-range-calculator-responsive-ownership-phase1-evidence.json",
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

/**
 * @param {"desktop-hover"|"mobile-none"} hoverMode
 */
async function applyCssHoverMedia(page, hoverMode) {
	if (!page.__drCdp) {
		page.__drCdp = await page.context().newCDPSession(page);
	}
	const none = hoverMode === "mobile-none";
	await page.__drCdp.send("Emulation.setEmulatedMedia", {
		media: "screen",
		features: [
			{ name: "hover", value: none ? "none" : "hover" },
			{ name: "pointer", value: none ? "coarse" : "fine" },
		],
	});
	await page.evaluate(() => {
		document.documentElement.style.zoom = "1.0001";
		document.documentElement.offsetHeight;
		document.documentElement.style.zoom = "";
	});
}

/**
 * Compound-aware hover mock — only override hover clause when non-hover MQ parts match.
 * @param {"desktop-hover"|"mobile-none"} hoverMode
 */
function installHoverMatchMediaMock(hoverMode) {
	window.__timivaHoverMode = hoverMode;
	if (!window.__timivaNativeMatchMedia) {
		window.__timivaNativeMatchMedia = window.matchMedia.bind(window);
	}
	const original = window.__timivaNativeMatchMedia;
	const handlers = {
		addEventListener: () => {},
		removeEventListener: () => {},
		addListener: () => {},
		removeListener: () => {},
		onchange: null,
		dispatchEvent: () => true,
	};

	function stripHoverClauses(query) {
		return query
			.replace(/\s+and\s+\(\s*hover:\s*(?:hover|none)\s*\)/gi, "")
			.replace(/\(\s*hover:\s*(?:hover|none)\s*\)\s+and\s+/gi, "")
			.trim();
	}

	window.matchMedia = (query) => {
		const mode = window.__timivaHoverMode || hoverMode;
		const result = original(query);
		const hasHoverHover = /\(hover:\s*hover\)/.test(query);
		const hasHoverNone = /\(hover:\s*none\)/.test(query);
		if (!hasHoverHover && !hasHoverNone) {
			return result;
		}

		const baseQuery = stripHoverClauses(query);
		const baseMatches = baseQuery ? original(baseQuery).matches : true;
		if (!baseMatches) {
			return { ...result, matches: false, media: query, ...handlers };
		}

		if (mode === "desktop-hover") {
			if (hasHoverHover) {
				return { ...result, matches: true, media: query, ...handlers };
			}
			if (hasHoverNone) {
				return { ...result, matches: false, media: query, ...handlers };
			}
		} else {
			if (hasHoverNone) {
				return { ...result, matches: true, media: query, ...handlers };
			}
			if (hasHoverHover) {
				return { ...result, matches: false, media: query, ...handlers };
			}
		}
		return result;
	};
}

/**
 * @param {"desktop-hover"|"mobile-none"} hoverMode
 */
async function setHoverMode(page, hoverMode) {
	await applyCssHoverMedia(page, hoverMode);
	await page.evaluate((mode) => {
		window.__timivaHoverMode = mode;
		window.dispatchEvent(new Event("resize"));
		window.TimivaDateRangeLayout?.applyLayoutAttrs(document);
	}, hoverMode);
	await page.waitForTimeout(160);
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
	await applyCssHoverMedia(page, hoverMode);
	await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
	await applyCssHoverMedia(page, hoverMode);
	await page.waitForSelector("[data-date-range-v2]");
	return { context, page };
}

async function measureOwnership(page) {
	return page.evaluate(() => {
		function probe(el) {
			if (!el) {
				return {
					exists: false,
					display: null,
					visibility: null,
					pointerEvents: null,
					inert: false,
					hidden: false,
					disabled: false,
					rect: null,
					minHeight: null,
					active: false,
				};
			}
			const style = getComputedStyle(el);
			const rect = el.getBoundingClientRect();
			const hidden = el.hasAttribute("hidden") || el.hidden === true;
			const inert = Boolean(el.inert);
			const disabled = "disabled" in el && Boolean(el.disabled);
			const opacity = Number.parseFloat(style.opacity || "1");
			const visibleBox = rect.width > 0 && rect.height > 0;
			const shown =
				style.display !== "none" &&
				style.visibility !== "hidden" &&
				opacity > 0.01 &&
				!hidden;
			const pointerCapable =
				style.pointerEvents !== "none" && !inert && !disabled;
			return {
				exists: true,
				display: style.display,
				visibility: style.visibility,
				pointerEvents: style.pointerEvents,
				inert,
				hidden,
				disabled,
				rect: {
					x: Math.round(rect.x),
					y: Math.round(rect.y),
					width: Math.round(rect.width),
					height: Math.round(rect.height),
				},
				minHeight: style.minHeight,
				active: shown && visibleBox && pointerCapable,
			};
		}

		const pageEl = document.getElementById("date-range-page");
		const sdcHost = document.querySelector("[data-drc-desktop-sdc-host]");
		const sdcRoot = document.querySelector("#drc-sdc[data-desktop-calendar]");
		const trigger = document.getElementById("range-display-trigger");
		const ghost = document.querySelector(
			".tool-desktop-cluster .tool-input-card",
		);
		const sheet = document.getElementById("range-sheet");
		const panel = document.getElementById("range-landscape-panel");
		const result = document.querySelector(".preview-tool-result-group");
		const first = document.querySelector(".preview-tool-first-screen");
		const sdc = probe(sdcHost);
		const sdcCal = probe(sdcRoot);
		const capsule = probe(trigger);
		const ghostProbe = probe(ghost);
		const sheetOpen = Boolean(sheet?.classList.contains("is-open"));
		const panelOpen = Boolean(panel && !panel.hasAttribute("hidden"));
		const minH = Number.parseFloat(capsule.minHeight || "0");
		const capHeight = capsule.rect?.height ?? 0;
		const compactCapsule =
			capsule.active &&
			((Number.isFinite(minH) && minH > 0 && minH <= 36) ||
				(capHeight > 0 && capHeight <= 40));
		const fullCapsule =
			capsule.active &&
			((Number.isFinite(minH) && minH >= 52) || capHeight >= 52);
		const sdcClickable = sdc.active && sdcCal.exists && !sdcCal.hidden;
		const owners = [];
		if (sdcClickable) owners.push("desktop-sdc");
		if (capsule.active) owners.push("mobile-trigger");
		const resultRect = result?.getBoundingClientRect();
		const inputRect = sdcClickable ? sdcHost.getBoundingClientRect() : trigger?.getBoundingClientRect();
		const firstRect = first?.getBoundingClientRect();
		const resultInputGap =
			resultRect && inputRect
				? Math.round(inputRect.top - resultRect.bottom)
				: null;
		const cssDesktop =
			sdc.display === "block" &&
			(capsule.display === "none" || !capsule.active);
		const cssLandscape = compactCapsule;
		const cssDefault = fullCapsule;
		const jsMode = window.TimivaDateRangeLayout?.resolveLayoutMode?.(window) ?? null;
		const declared = pageEl?.dataset.rangeLayout ?? null;
		const scrollLock =
			document.documentElement.style.overflow === "hidden" ||
			document.body.style.overflow === "hidden" ||
			Boolean(pageEl?.classList.contains("date-range-scroll-lock")) ||
			Boolean(pageEl?.classList.contains("sheet-open")) ||
			Boolean(pageEl?.classList.contains("date-range-compact-open"));

		return {
			jsMode,
			declared,
			rsLayout: document
				.querySelector("[data-date-range-v2] [data-result-summary]")
				?.getAttribute("data-rs-layout"),
			sdc,
			sdcCal,
			capsule,
			ghost: ghostProbe,
			ownerCount: owners.length,
			owners,
			sdcClickable,
			compactCapsule,
			fullCapsule,
			cssDesktop,
			cssLandscape,
			cssDefault,
			sheetOpen,
			panelOpen,
			scrollLock,
			firstScreenHeight: firstRect ? Math.round(firstRect.height) : null,
			pageInnerHeight: window.innerHeight,
			documentScrollHeight: document.documentElement.scrollHeight,
			resultInputGap,
			innerWidth: window.innerWidth,
			innerHeight: window.innerHeight,
			triggerAriaControls: trigger?.getAttribute("aria-controls") ?? null,
		};
	});
}

function expectDesktop(ops, label) {
	assert(ops.jsMode === "desktop" && ops.declared === "desktop", `${label}: JS/declared Desktop`);
	assert(ops.rsLayout === "desktop", `${label}: data-rs-layout desktop`);
	assert(ops.cssDesktop, `${label}: CSS Desktop composition`);
	assert(ops.sdcClickable, `${label}: SDC visible + pointer-capable`);
	assert(ops.sdc.rect && ops.sdc.rect.y < ops.pageInnerHeight * 0.9, `${label}: SDC in first-screen region`);
	assert(ops.sdc.rect && ops.sdc.rect.height > 80, `${label}: SDC has rendered height`);
	assert(!ops.capsule.active, `${label}: mobile trigger not active`);
	assert(!ops.compactCapsule, `${label}: no partial/compact capsule`);
	assert(ops.ownerCount === 1 && ops.owners[0] === "desktop-sdc", `${label}: owner count = 1 (SDC)`);
	assert(!ops.sheetOpen && !ops.panelOpen, `${label}: editors closed`);
	assert(
		ops.ghost.pointerEvents === "none" || !ops.ghost.active,
		`${label}: decorative ghost is not an input owner`,
	);
}

function expectMobileDefault(ops, label) {
	assert(ops.jsMode === "portrait" && ops.declared === "portrait", `${label}: JS/declared Mobile Default`);
	assert(ops.rsLayout === "portrait", `${label}: data-rs-layout portrait`);
	assert(!ops.sdcClickable, `${label}: Desktop SDC hidden`);
	assert(ops.fullCapsule, `${label}: full Primary Capsule (not 38px partial)`);
	assert(!ops.compactCapsule, `${label}: landscape compact CTA not active`);
	assert(ops.ownerCount === 1 && ops.owners[0] === "mobile-trigger", `${label}: owner count = 1 (capsule)`);
	assert(ops.triggerAriaControls === "range-sheet", `${label}: capsule controls range-sheet`);
}

function expectLandscape(ops, label) {
	assert(
		ops.jsMode === "landscape-date" && ops.declared === "landscape-date",
		`${label}: JS/declared Mobile Landscape`,
	);
	assert(ops.rsLayout === "landscape", `${label}: data-rs-layout landscape`);
	assert(!ops.sdcClickable, `${label}: Desktop SDC hidden`);
	assert(ops.compactCapsule, `${label}: compact CTA is the active input`);
	assert(!ops.fullCapsule, `${label}: portrait capsule geometry not active`);
	assert(ops.ownerCount === 1 && ops.owners[0] === "mobile-trigger", `${label}: owner count = 1 (compact CTA)`);
	assert(ops.triggerAriaControls === "range-landscape-panel", `${label}: CTA controls landscape panel`);
}

console.log("qa-date-range-calculator-responsive-ownership-browser (Phase 1)\n");
console.log(`base: ${BASE}\n`);

mkdirSync(join(rootDir, "local-docs/validation"), { recursive: true });
await waitForServer(`${BASE}/en/date-range-calculator/`);

const pw = await loadPlaywright();
const browser = await pw.chromium.launch({ headless: true });
const enPath = "/en/date-range-calculator/";
const zhPath = "/zh/date-range-calculator/";

const desktopViewports = [
	{ width: 823, height: 800, label: "823×800 BLOCKING" },
	{ width: 768, height: 800, label: "768×800" },
	{ width: 799, height: 800, label: "799×800" },
	{ width: 899, height: 800, label: "899×800" },
	{ width: 900, height: 800, label: "900×800" },
];

for (const localePath of [enPath, zhPath]) {
	const locale = localePath.includes("/zh/") ? "zh" : "en";
	for (const vp of desktopViewports) {
		const { context, page } = await openPage(
			browser,
			localePath,
			{ width: vp.width, height: vp.height },
			"desktop-hover",
		);
		await page.waitForSelector("#drc-sdc [data-sdc-day]", { timeout: 8000, state: "attached" });
		const ops = await measureOwnership(page);
		note(
			`${locale} ${vp.label}: mode=${ops.jsMode} owners=${ops.owners.join(",")} sdcY=${ops.sdc.rect?.y} capH=${ops.capsule.rect?.height} minH=${ops.capsule.minHeight} gap=${ops.resultInputGap} firstH=${ops.firstScreenHeight} scrollH=${ops.documentScrollHeight}`,
		);
		expectDesktop(ops, `${locale} ${vp.label}`);
		if (vp.width === 823) {
			const day = page.locator("#drc-sdc [data-sdc-day]").first();
			await day.click();
			await page.waitForTimeout(80);
			const selected = await page.locator("#drc-sdc [data-sdc-day].is-range-start, #drc-sdc [data-sdc-day].is-range-single, #drc-sdc [data-sdc-day].is-selected").count();
			assert(selected > 0, `${locale} 823×800: SDC day click updates calendar`);
		}
		await context.close();
	}
}

for (const localePath of [enPath, zhPath]) {
	const locale = localePath.includes("/zh/") ? "zh" : "en";
	for (const vp of [
		{ width: 747, height: 800, label: "747×800 BLOCKING" },
		{ width: 430, height: 615, label: "430×615" },
	]) {
		const { context, page } = await openPage(
			browser,
			localePath,
			{ width: vp.width, height: vp.height },
			"mobile-none",
		);
		const ops = await measureOwnership(page);
		note(
			`${locale} ${vp.label}: mode=${ops.jsMode} owners=${ops.owners.join(",")} cap=${JSON.stringify(ops.capsule.rect)} minH=${ops.capsule.minHeight} gap=${ops.resultInputGap}`,
		);
		expectMobileDefault(ops, `${locale} ${vp.label}`);
		if (vp.width === 747 && locale === "en") {
			await page.locator("#range-display-trigger").click();
			await page.waitForTimeout(180);
			const after = await measureOwnership(page);
			assert(after.sheetOpen, "en 747×800: capsule opens existing range-sheet");
			note("Phase 2: sheet chrome / duplicate Clear / scroll not asserted");
		}
		await context.close();
	}
}

for (const localePath of [enPath, zhPath]) {
	const locale = localePath.includes("/zh/") ? "zh" : "en";
	for (const vp of [
		{ width: 667, height: 375, label: "667×375" },
		{ width: 844, height: 390, label: "844×390" },
		{ width: 932, height: 430, label: "932×430" },
	]) {
		const { context, page } = await openPage(
			browser,
			localePath,
			{ width: vp.width, height: vp.height },
			"mobile-none",
		);
		const ops = await measureOwnership(page);
		note(
			`${locale} ${vp.label}: mode=${ops.jsMode} owners=${ops.owners.join(",")} cap=${JSON.stringify(ops.capsule.rect)} minH=${ops.capsule.minHeight}`,
		);
		expectLandscape(ops, `${locale} ${vp.label}`);
		if (vp.width === 667 && locale === "en") {
			await page.locator("#range-display-trigger").click();
			await page.waitForTimeout(180);
			const after = await measureOwnership(page);
			assert(after.panelOpen, "en 667×375: compact CTA opens range-landscape-panel");
			assert(!after.sheetOpen, "en 667×375: range-sheet stays closed");
		}
		await context.close();
	}
}

/* —— Transitions —— */
/* T1/T2 same-context sheet/panel → Desktop：Playwright 無法在 sheet 後恢復 native hover CSS；Owner Visual QA 驗證。 */
{
	const { context, page } = await openPage(
		browser,
		enPath,
		{ width: 823, height: 800 },
		"desktop-hover",
	);
	await page.waitForSelector("#drc-sdc [data-sdc-day]", { timeout: 8000 });
	await page.setViewportSize({ width: 747, height: 800 });
	await setHoverMode(page, "mobile-none");
	const ops = await measureOwnership(page);
	note(`T3 Desktop → 747: mode=${ops.jsMode} owners=${ops.owners.join(",")}`);
	expectMobileDefault(ops, "T3 Desktop → 747 Mobile Default");
	await context.close();
}

{
	const { context, page } = await openPage(
		browser,
		enPath,
		{ width: 823, height: 800 },
		"desktop-hover",
	);
	await page.waitForSelector("#drc-sdc [data-sdc-day]", { timeout: 8000 });
	await page.setViewportSize({ width: 667, height: 375 });
	await setHoverMode(page, "mobile-none");
	const ops = await measureOwnership(page);
	note(`T4 Desktop → 667: mode=${ops.jsMode} owners=${ops.owners.join(",")}`);
	expectLandscape(ops, "T4 Desktop → true Mobile Landscape");
	await context.close();
}

await browser.close();
writeFileSync(evidencePath, `${JSON.stringify({ passed, failed, evidence }, null, 2)}\n`);

if (failed > 0) {
	console.error(`\nFAILED: ${failed}  passed: ${passed}`);
	process.exit(1);
}

console.log(`PASSED: ${passed}`);
console.log(`evidence: ${evidencePath}`);
