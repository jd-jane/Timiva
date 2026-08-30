/**
 * Date Range Calculator — Phase 3 Mobile Landscape ownership (browser).
 *
 * Run after build:
 *   npx astro preview --host 127.0.0.1 --port 4387
 *   DRV2_LAND_QA_BASE=http://127.0.0.1:4387 node scripts/qa-date-range-calculator-landscape-ownership-browser.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.DRV2_LAND_QA_BASE ?? process.env.DRV2_QA_BASE ?? "http://127.0.0.1:4387";
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const evidencePath = join(
	rootDir,
	"local-docs/validation/date-range-calculator-landscape-ownership-phase3-evidence.json",
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
}

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
			if (hasHoverHover) return { ...result, matches: true, media: query, ...handlers };
			if (hasHoverNone) return { ...result, matches: false, media: query, ...handlers };
		} else {
			if (hasHoverNone) return { ...result, matches: true, media: query, ...handlers };
			if (hasHoverHover) return { ...result, matches: false, media: query, ...handlers };
		}
		return result;
	};
}

async function setHoverMode(page, hoverMode) {
	await applyCssHoverMedia(page, hoverMode);
	await page.evaluate((mode) => {
		window.__timivaHoverMode = mode;
		window.dispatchEvent(new Event("resize"));
		window.TimivaDateRangeLayout?.applyLayoutAttrs(document);
	}, hoverMode);
	await page.waitForTimeout(160);
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
	await applyCssHoverMedia(page, hoverMode);
	await page.waitForSelector("[data-date-range-v2]");
	return { context, page };
}

async function measureLandscape(page) {
	return page.evaluate(() => {
		const pageEl = document.getElementById("date-range-page");
		const trigger = document.getElementById("range-display-trigger");
		const sdcHost = document.querySelector("[data-drc-desktop-sdc-host]");
		const portal = document.querySelector("[data-drv2-sheet-portal]");
		const sheet = document.getElementById("range-sheet");
		const panel = document.getElementById("range-landscape-panel");
		const overlay = document.getElementById("range-compact-overlay");
		const result = document.querySelector(".preview-tool-result-group");
		const first = document.querySelector(".preview-tool-first-screen");
		const trigStyle = trigger ? getComputedStyle(trigger) : null;
		const trigRect = trigger?.getBoundingClientRect();
		const sdcStyle = sdcHost ? getComputedStyle(sdcHost) : null;
		const portalStyle = portal ? getComputedStyle(portal) : null;
		const minH = Number.parseFloat(trigStyle?.minHeight || "0");
		const capH = trigRect?.height ?? 0;
		const compact =
			trigStyle?.display !== "none" &&
			trigRect &&
			trigRect.width > 0 &&
			trigRect.height > 0 &&
			trigStyle.pointerEvents !== "none" &&
			((Number.isFinite(minH) && minH > 0 && minH <= 36) || capH <= 40);
		const scrollLock =
			document.documentElement.classList.contains("msb-scroll-lock") ||
			document.body.classList.contains("msb-scroll-lock") ||
			Boolean(pageEl?.classList.contains("date-range-scroll-lock")) ||
			Boolean(pageEl?.classList.contains("date-range-compact-open"));
		const resultRect = result?.getBoundingClientRect();
		const firstRect = first?.getBoundingClientRect();
		const bottomGap = trigRect ? Math.round(window.innerHeight - trigRect.bottom) : null;
		return {
			jsMode: window.TimivaDateRangeLayout?.resolveLayoutMode?.(window) ?? null,
			declared: pageEl?.dataset.rangeLayout ?? null,
			rsLayout: document
				.querySelector("[data-date-range-v2] [data-result-summary]")
				?.getAttribute("data-rs-layout"),
			compact,
			minH,
			capH,
			sdcDisplay: sdcStyle?.display ?? null,
			portalDisplay: portalStyle?.display ?? null,
			sheetOpen: Boolean(sheet?.classList.contains("is-open")),
			panelOpen: Boolean(panel && !panel.hasAttribute("hidden")),
			overlayVisible: Boolean(overlay?.classList.contains("is-visible") && !overlay.hidden),
			scrollLock,
			triggerAria: trigger?.getAttribute("aria-controls") ?? null,
			ctaInView: Boolean(trigRect && trigRect.bottom <= window.innerHeight + 2 && trigRect.top >= -2),
			resultInView: Boolean(resultRect && resultRect.top < window.innerHeight && resultRect.bottom > 0),
			firstH: firstRect ? Math.round(firstRect.height) : null,
			innerH: window.innerHeight,
			bottomGap,
		};
	});
}

mkdirSync(join(rootDir, "local-docs/validation"), { recursive: true });
await waitForServer(`${BASE}/en/date-range-calculator/`);

const pw = await loadPlaywright();
const browser = await pw.chromium.launch({ headless: true });
const path = "/en/date-range-calculator/";

for (const vp of [
	{ width: 667, height: 375, label: "667×375 BLOCKING" },
	{ width: 844, height: 390, label: "844×390 BLOCKING" },
	{ width: 932, height: 430, label: "932×430 BLOCKING" },
]) {
	const { context, page } = await openPage(browser, path, vp, "mobile-none");
	const ops = await measureLandscape(page);
	note(`${vp.label} closed: ${JSON.stringify(ops)}`);

	assert(ops.jsMode === "landscape-date" && ops.declared === "landscape-date", `${vp.label}: JS/declared landscape-date`);
	assert(ops.rsLayout === "landscape", `${vp.label}: ResultSummary landscape`);
	assert(ops.compact, `${vp.label}: compact CTA is the input owner`);
	assert(ops.sdcDisplay === "none", `${vp.label}: Desktop SDC hidden`);
	assert(ops.portalDisplay === "none", `${vp.label}: Mobile Default MSB portal hidden`);
	assert(!ops.sheetOpen, `${vp.label}: MSB sheet closed`);
	assert(!ops.panelOpen, `${vp.label}: panel starts closed`);
	assert(ops.triggerAria === "range-landscape-panel", `${vp.label}: CTA controls #range-landscape-panel`);
	assert(ops.ctaInView, `${vp.label}: compact CTA reachable in viewport`);
	assert(ops.resultInView, `${vp.label}: result in first-screen`);
	assert((ops.bottomGap ?? 0) >= 0, `${vp.label}: CTA has bottom clearance`);

	await page.locator("#range-display-trigger").click();
	await page.waitForTimeout(180);
	const open = await measureLandscape(page);
	note(`${vp.label} open: panel=${open.panelOpen} overlay=${open.overlayVisible} lock=${open.scrollLock}`);
	assert(open.panelOpen, `${vp.label}: panel opens`);
	assert(open.overlayVisible, `${vp.label}: compact overlay visible`);
	assert(!open.sheetOpen, `${vp.label}: MSB stays closed while panel open`);
	assert(open.portalDisplay === "none", `${vp.label}: MSB portal stays hidden while panel open`);

	const overlayBox = await page.locator("#range-compact-overlay").boundingBox();
	const panelBox = await page.locator("#range-landscape-panel").boundingBox();
	if (overlayBox && panelBox) {
		await page.mouse.click(
			overlayBox.x + overlayBox.width / 2,
			Math.max(overlayBox.y + 72, panelBox.y - 24),
		);
	} else {
		await page.keyboard.press("Escape");
	}
	await page.waitForTimeout(180);
	const closed = await measureLandscape(page);
	assert(!closed.panelOpen, `${vp.label}: overlay closes panel`);
	assert(!closed.overlayVisible, `${vp.label}: overlay hidden after close`);
	assert(!closed.scrollLock, `${vp.label}: scroll lock cleared after close`);

	await context.close();
}

{
	const { context, page } = await openPage(
		browser,
		path,
		{ width: 667, height: 375 },
		"mobile-none",
	);
	await page.locator("#range-display-trigger").click();
	await page.waitForTimeout(160);
	assert((await measureLandscape(page)).panelOpen, "T-land→desk: panel open before transition");
	await page.setViewportSize({ width: 823, height: 800 });
	await setHoverMode(page, "desktop-hover");
	await page.waitForTimeout(200);
	const after = await measureLandscape(page);
	note(`T-land→desk: ${JSON.stringify(after)}`);
	assert(after.jsMode === "desktop" && after.declared === "desktop", "T-land→desk: Desktop mode");
	assert(!after.panelOpen && !after.overlayVisible, "T-land→desk: panel/overlay formally closed");
	assert(!after.sheetOpen && !after.scrollLock, "T-land→desk: no stale sheet/scroll lock");
	note("T-land→desk: same-context hover CSS restore is Owner Visual QA (Phase 1 T1/T2)");
	await context.close();
}

{
	const { context, page } = await openPage(
		browser,
		path,
		{ width: 667, height: 375 },
		"mobile-none",
	);
	await page.locator("#range-display-trigger").click();
	await page.waitForTimeout(160);
	assert((await measureLandscape(page)).panelOpen, "T-land→default: panel open before transition");
	await page.setViewportSize({ width: 747, height: 800 });
	await setHoverMode(page, "mobile-none");
	await page.waitForTimeout(200);
	const after = await measureLandscape(page);
	note(`T-land→default: ${JSON.stringify(after)}`);
	assert(after.jsMode === "portrait" && after.declared === "portrait", "T-land→default: Mobile Default mode");
	assert(!after.compact && after.capH >= 52, "T-land→default: full capsule, not compact CTA");
	assert(!after.panelOpen && !after.overlayVisible, "T-land→default: panel/overlay formally closed");
	assert(!after.scrollLock, "T-land→default: no stale scroll lock");
	assert(after.triggerAria === "range-sheet", "T-land→default: capsule controls range-sheet");
	await context.close();
}

await browser.close();
writeFileSync(evidencePath, `${JSON.stringify({ passed, failed, evidence }, null, 2)}\n`);

console.log(`\nPhase 3 landscape browser QA: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
