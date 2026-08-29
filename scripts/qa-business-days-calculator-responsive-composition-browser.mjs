/**
 * Business Days Calculator — Responsive Composition Browser QA (Batch 3D).
 *
 * Run after build: npx astro preview --host 127.0.0.1 --port 4380 &
 *   BDCV2_QA_BASE=http://127.0.0.1:4380 node scripts/qa-business-days-calculator-responsive-composition-browser.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE =
	process.env.BDCV2_QA_BASE ?? process.env.LDC_QA_BASE ?? "http://localhost:4380";
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const evidencePath = join(
	rootDir,
	"local-docs/validation/business-days-calculator-responsive-composition-batch3d-evidence.json",
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
 * Compound-aware hover mock: only override hover clause when non-hover MQ parts match.
 * @param {"desktop-hover"|"mobile-none"} hoverMode
 */
function installHoverMatchMediaMock(hoverMode) {
	const original = window.matchMedia.bind(window);
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

		if (hoverMode === "desktop-hover") {
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
async function openPage(browser, path, viewport, hoverMode) {
	const context = await browser.newContext({
		viewport,
		hasTouch: hoverMode === "mobile-none",
		isMobile: hoverMode === "mobile-none" && viewport.width < 768,
	});
	await context.addInitScript(installHoverMatchMediaMock, hoverMode);
	const page = await context.newPage();
	await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
	await page.waitForSelector("[data-business-days-calculator-v2]");
	return { context, page };
}

async function measureBdcComposition(page) {
	return page.evaluate(() => {
		const api = window.TimivaBusinessDaysLayout;
		const root = document.querySelector("[data-business-days-calculator-v2]");
		const desktop = document.querySelector(
			"[data-business-days-calculator-v2] .bdcv2-input-cluster--desktop",
		);
		const mobile = document.querySelector(
			"[data-business-days-calculator-v2] .bdcv2-mobile-controls",
		);
		const capsule = document.querySelector(
			"[data-business-days-calculator-v2] .bdcv2-mobile-capsule",
		);
		const rs = document.querySelector(
			"[data-business-days-calculator-v2] [data-result-summary]",
		);
		const first = root?.querySelector(".preview-tool-first-screen");
		const stage = root?.querySelector(".preview-tool-stage");
		const result = root?.querySelector(".preview-tool-result-group");
		const dStyle = desktop ? getComputedStyle(desktop) : null;
		const mStyle = mobile ? getComputedStyle(mobile) : null;
		const cStyle = capsule ? getComputedStyle(capsule) : null;
		const firstStyle = first ? getComputedStyle(first) : null;
		const stageStyle = stage ? getComputedStyle(stage) : null;
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
		const fontSize = parseFloat(cStyle?.fontSize ?? "0");
		const whiteSpace = cStyle?.whiteSpace ?? "";
		/* BDC landscape compact（含 ≤823 legacy 28px 與 full-ML 32px） */
		const landscapeCompact =
			mobileVisible &&
			!desktopVisible &&
			minH > 0 &&
			minH <= 36 &&
			padY <= 8 &&
			fontSize > 0 &&
			fontSize <= 13;
		const stageMinH = stageStyle?.minHeight ?? "";
		const stageGtr = stageStyle?.gridTemplateRows ?? "";
		const stageMinHPx = Number.parseFloat(stageMinH);
		/* Default leak：stage 仍吃 portrait min-height 100dvh；BDC landscape 正確時為 0 */
		const defaultStageMinHeightLeak =
			stageMinH.includes("dvh") ||
			(!Number.isNaN(stageMinHPx) && stageMinHPx >= window.innerHeight * 0.9);
		/*
		 * BDC landscape recipe：flex first-screen + grid stage（1fr／auto 會 compute 成 px），
		 * 且不得殘留 Default 100dvh stage min-height。
		 */
		const landscapeStageRecipe =
			stageStyle?.display === "grid" &&
			firstStyle?.display === "flex" &&
			!defaultStageMinHeightLeak &&
			stageGtr !== "none" &&
			stageGtr.split(" ").filter(Boolean).length >= 2;
		const ctaRect = capsule?.getBoundingClientRect();
		const resultRect = result?.getBoundingClientRect();
		const ctaBottomGap =
			ctaRect != null ? Math.round(window.innerHeight - ctaRect.bottom) : null;
		const ctaFullyVisible =
			Boolean(ctaRect) &&
			ctaRect.top >= -0.5 &&
			ctaRect.bottom <= window.innerHeight + 0.5;
		const mode = api?.resolveLayoutMode?.(window) ?? null;
		const rsLayout = rs?.getAttribute("data-rs-layout") ?? null;
		const hasAme = Boolean(root?.querySelector("[data-ame-root]"));
		const sheet = document.querySelector("[data-bdcv2-sheet]");
		const sheetStyle = sheet ? getComputedStyle(sheet) : null;
		const sheetRect = sheet?.getBoundingClientRect();
		const sheetOpen = Boolean(sheet?.classList.contains("is-open"));
		const sheetVisible =
			sheetOpen &&
			sheetStyle?.visibility === "visible" &&
			sheetStyle?.display !== "none" &&
			(sheetRect?.height ?? 0) > 8 &&
			(sheetRect?.top ?? 9999) < window.innerHeight;
		const scrollLock =
			document.documentElement.classList.contains("msb-scroll-lock") ||
			document.body.classList.contains("msb-scroll-lock") ||
			document.documentElement.classList.contains("msb-sheet-open") ||
			document.body.classList.contains("msb-sheet-open");
		const sharedLandscapeChrome =
			sheetVisible &&
			sheetStyle != null &&
			(sheetStyle.maxHeight === "224px" ||
				sheetStyle.height === "224px" ||
				(parseFloat(sheetStyle.maxHeight) > 0 &&
					parseFloat(sheetStyle.maxHeight) <= 224 &&
					parseFloat(cStyle?.minHeight ?? "99") <= 36 &&
					mobileVisible === false));
		return {
			desktopVisible,
			mobileVisible,
			landscapeCompact,
			rsLayout,
			resolveMode: mode,
			capsuleMinHeight: cStyle?.minHeight ?? null,
			capsulePaddingTop: cStyle?.paddingTop ?? null,
			capsuleFontSize: cStyle?.fontSize ?? null,
			capsuleWhiteSpace: whiteSpace || null,
			firstDisplay: firstStyle?.display ?? null,
			stageDisplay: stageStyle?.display ?? null,
			stageMinHeight: stageMinH || null,
			stageGridTemplateRows: stageGtr || null,
			defaultStageMinHeightLeak,
			landscapeStageRecipe,
			resultTop: resultRect ? Math.round(resultRect.top) : null,
			ctaBottomGap,
			ctaFullyVisible,
			hasAme,
			sheetOpen,
			sheetVisible,
			scrollLock,
			rootSheetOpenAttr: root?.getAttribute("data-bdcv2-sheet-open"),
			sheetMaxHeight: sheetStyle?.maxHeight ?? null,
			sheetHeight: sheetStyle?.height ?? null,
			sharedLandscapeChrome,
			innerWidth: window.innerWidth,
			innerHeight: window.innerHeight,
		};
	});
}

console.log("qa-business-days-calculator-responsive-composition-browser\n");
console.log(`base: ${BASE}\n`);

mkdirSync(join(rootDir, "local-docs/validation"), { recursive: true });
await waitForServer(`${BASE}/en/business-days-calculator/`);

const pw = await loadPlaywright();
const browser = await pw.chromium.launch({ headless: true });
const enPath = "/en/business-days-calculator/";
const zhPath = "/zh/business-days-calculator/";

/* —— A. Desktop continuity —— */
for (const localePath of [enPath, zhPath]) {
	const locale = localePath.includes("/zh/") ? "zh" : "en";
	for (const { width, height, label } of [
		{ width: 1280, height: 900, label: "1280×900" },
		{ width: 1000, height: 800, label: "1000×800" },
		{ width: 900, height: 800, label: "900×800" },
		{ width: 899, height: 800, label: "899×800" },
		{ width: 824, height: 800, label: "824×800" },
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
		const ops = await measureBdcComposition(page);
		note(
			`${locale} ${label}: desktop=${ops.desktopVisible} mobile=${ops.mobileVisible} rs=${ops.rsLayout} mode=${ops.resolveMode}`,
		);
		assert(ops.desktopVisible, `A ${locale} ${label}: desktop cluster visible`);
		assert(!ops.mobileVisible, `A ${locale} ${label}: mobile controls hidden`);
		assert(!ops.landscapeCompact, `A ${locale} ${label}: NOT Mobile Landscape compact`);
		assert(
			ops.rsLayout === "desktop" && ops.resolveMode === "desktop",
			`A ${locale} ${label}: layout-contract + data-rs-layout = desktop`,
		);
		await context.close();
	}
}

/* —— B. Narrow desktop → Mobile Default —— */
for (const localePath of [enPath, zhPath]) {
	const locale = localePath.includes("/zh/") ? "zh" : "en";
	const { context, page } = await openPage(
		browser,
		localePath,
		{ width: 700, height: 500 },
		"desktop-hover",
	);
	const ops = await measureBdcComposition(page);
	note(
		`${locale} 700×500: rs=${ops.rsLayout} mode=${ops.resolveMode} compact=${ops.landscapeCompact} minH=${ops.capsuleMinHeight}`,
	);
	assert(!ops.desktopVisible, `B ${locale} 700×500: desktop hidden`);
	assert(ops.mobileVisible, `B ${locale} 700×500: mobile visible`);
	assert(!ops.landscapeCompact, `B ${locale} 700×500: NOT landscape compact`);
	assert(
		ops.rsLayout === "portrait" && ops.resolveMode === "portrait",
		`B ${locale} 700×500: Mobile Default / Portrait-style attrs`,
	);
	assert(
		ops.defaultStageMinHeightLeak,
		`B ${locale} 700×500: Default stage still uses 100dvh recipe`,
	);
	await context.close();
}

/* —— C. Mobile portrait —— */
for (const localePath of [enPath, zhPath]) {
	const locale = localePath.includes("/zh/") ? "zh" : "en";
	for (const viewport of [
		{ width: 390, height: 844 },
		{ width: 430, height: 932 },
	]) {
		const { context, page } = await openPage(
			browser,
			localePath,
			viewport,
			"mobile-none",
		);
		const ops = await measureBdcComposition(page);
		assert(!ops.desktopVisible, `C ${locale} ${viewport.width}×${viewport.height}: desktop hidden`);
		assert(ops.mobileVisible, `C ${locale} ${viewport.width}×${viewport.height}: mobile visible`);
		assert(
			!ops.landscapeCompact,
			`C ${locale} ${viewport.width}×${viewport.height}: not landscape compact`,
		);
		assert(
			ops.rsLayout === "portrait" && ops.resolveMode === "portrait",
			`C ${locale} ${viewport.width}×${viewport.height}: portrait layout attrs`,
		);
		await context.close();
	}
}

/* —— D. Mobile Landscape（含 rendered geometry） —— */
for (const localePath of [enPath, zhPath]) {
	const locale = localePath.includes("/zh/") ? "zh" : "en";
	for (const viewport of [
		{ width: 667, height: 375 },
		{ width: 844, height: 390 },
		{ width: 932, height: 430 },
	]) {
		const { context, page } = await openPage(
			browser,
			localePath,
			viewport,
			"mobile-none",
		);
		const ops = await measureBdcComposition(page);
		note(
			`D ${locale} ${viewport.width}×${viewport.height}: rs=${ops.rsLayout} compact=${ops.landscapeCompact} stageMinH=${ops.stageMinHeight} gap=${ops.ctaBottomGap} resultY=${ops.resultTop} ctaMinH=${ops.capsuleMinHeight}`,
		);
		assert(!ops.desktopVisible, `D ${locale} ${viewport.width}×${viewport.height}: desktop hidden`);
		assert(ops.mobileVisible, `D ${locale} ${viewport.width}×${viewport.height}: mobile visible`);
		assert(
			ops.landscapeCompact,
			`D ${locale} ${viewport.width}×${viewport.height}: landscape compact capsule`,
		);
		assert(
			ops.rsLayout === "landscape" && ops.resolveMode === "landscape-date",
			`D ${locale} ${viewport.width}×${viewport.height}: landscape layout attrs`,
		);
		assert(
			!ops.defaultStageMinHeightLeak,
			`D ${locale} ${viewport.width}×${viewport.height}: stage not Default 100dvh leak`,
		);
		assert(
			ops.landscapeStageRecipe,
			`D ${locale} ${viewport.width}×${viewport.height}: BDC landscape stage recipe active`,
		);
		assert(
			ops.ctaFullyVisible,
			`D ${locale} ${viewport.width}×${viewport.height}: CTA fully in viewport`,
		);
		assert(
			typeof ops.ctaBottomGap === "number" && ops.ctaBottomGap >= 12,
			`D ${locale} ${viewport.width}×${viewport.height}: CTA bottom gap ≥12 near production (~20; got ${ops.ctaBottomGap})`,
		);
		assert(
			parseFloat(ops.capsuleMinHeight ?? "99") <= 36,
			`D ${locale} ${viewport.width}×${viewport.height}: CTA min-height ≤36`,
		);
		assert(
			parseFloat(ops.capsulePaddingTop ?? "99") <= 8,
			`D ${locale} ${viewport.width}×${viewport.height}: CTA padding-block ≤8`,
		);
		if (viewport.width === 667 && viewport.height === 375) {
			assert(
				typeof ops.resultTop === "number" && ops.resultTop >= 8 && ops.resultTop <= 60,
				`D ${locale} 667×375: result Y near production (~24; got ${ops.resultTop})`,
			);
			assert(
				parseFloat(ops.capsuleMinHeight ?? "99") <= 30,
				`D ${locale} 667×375: ≤823 legacy compact capsule (~28px)`,
			);
			assert(
				ops.ctaBottomGap >= 16 && ops.ctaBottomGap <= 40,
				`D ${locale} 667×375: CTA bottom gap near production (~20; got ${ops.ctaBottomGap})`,
			);
		}
		if (viewport.width === 844) {
			assert(
				parseFloat(ops.capsuleMinHeight ?? "99") <= 36,
				`D ${locale} 844×390: ML compact beats 824–899 56px (got ${ops.capsuleMinHeight})`,
			);
		}
		await context.close();
	}
}

/* —— E. Transition chain —— */
{
	const { context, page } = await openPage(
		browser,
		enPath,
		{ width: 1280, height: 900 },
		"desktop-hover",
	);
	const steps = [
		{ width: 1280, height: 900, expect: "desktop" },
		{ width: 824, height: 800, expect: "desktop" },
		{ width: 700, height: 500, expect: "default" },
		{ width: 1280, height: 900, expect: "desktop" },
	];
	for (const step of steps) {
		await page.setViewportSize({ width: step.width, height: step.height });
		await page.waitForTimeout(120);
		const ops = await measureBdcComposition(page);
		if (step.expect === "desktop") {
			assert(
				ops.desktopVisible && ops.rsLayout === "desktop",
				`E ${step.width}×${step.height}: desktop continuity`,
			);
		} else {
			assert(
				ops.mobileVisible &&
					!ops.desktopVisible &&
					!ops.landscapeCompact &&
					ops.rsLayout === "portrait",
				`E ${step.width}×${step.height}: Mobile Default / Portrait-style`,
			);
		}
	}
	await context.close();
}

/* —— F. BDC uses legacy MSB（no AME root）；shared AME policy not owned here —— */
{
	const { context, page } = await openPage(
		browser,
		enPath,
		{ width: 390, height: 844 },
		"mobile-none",
	);
	const ops = await measureBdcComposition(page);
	assert(!ops.hasAme, "F BDC page has no AME root（legacy MSB sheet）");
	const sheetCount = await page.locator(".bdcv2-sheet, [data-bdcv2-sheet-portal]").count();
	assert(sheetCount > 0, "F BDC retains legacy sheet markup");
	await context.close();
}

/* —— G. Desktop short-height closed：no hybrid MSB —— */
for (const viewport of [
	{ width: 900, height: 650 },
	{ width: 824, height: 650 },
	{ width: 900, height: 700 },
	{ width: 900, height: 500 },
]) {
	const { context, page } = await openPage(browser, enPath, viewport, "desktop-hover");
	const ops = await measureBdcComposition(page);
	note(
		`G ${viewport.width}×${viewport.height}: mode=${ops.resolveMode} sheetOpen=${ops.sheetOpen} sheetVis=${ops.sheetVisible}`,
	);
	assert(ops.desktopVisible, `G ${viewport.width}×${viewport.height}: Desktop controls`);
	assert(!ops.mobileVisible, `G ${viewport.width}×${viewport.height}: mobile capsule hidden`);
	assert(
		ops.rsLayout === "desktop" && ops.resolveMode === "desktop",
		`G ${viewport.width}×${viewport.height}: Desktop composition attrs`,
	);
	assert(!ops.sheetOpen, `G ${viewport.width}×${viewport.height}: MSB not is-open`);
	assert(!ops.sheetVisible, `G ${viewport.width}×${viewport.height}: MSB not visible`);
	assert(!ops.scrollLock, `G ${viewport.width}×${viewport.height}: no msb scroll lock`);
	assert(
		ops.rootSheetOpenAttr !== "true",
		`G ${viewport.width}×${viewport.height}: data-bdcv2-sheet-open cleared`,
	);
	assert(
		!ops.sharedLandscapeChrome,
		`G ${viewport.width}×${viewport.height}: no shared landscape MSB chrome`,
	);
	await context.close();
}

/* —— G2. Desktop height sweep closed（701→700→650）—— */
{
	const { context, page } = await openPage(
		browser,
		enPath,
		{ width: 900, height: 701 },
		"desktop-hover",
	);
	for (const height of [701, 700, 650]) {
		await page.setViewportSize({ width: 900, height });
		await page.waitForTimeout(120);
		const ops = await measureBdcComposition(page);
		assert(
			ops.desktopVisible && !ops.mobileVisible && !ops.sheetVisible && !ops.sheetOpen,
			`G2 900×${height}: Desktop closed, MSB absent`,
		);
	}
	await context.close();
}

/* —— H. Mobile Default open → Desktop：safe close —— */
{
	const context = await browser.newContext({
		viewport: { width: 390, height: 844 },
		deviceScaleFactor: 1,
	});
	const page = await context.newPage();
	const client = await context.newCDPSession(page);
	await client.send("Emulation.setEmulatedMedia", {
		media: "screen",
		features: [
			{ name: "hover", value: "none" },
			{ name: "pointer", value: "coarse" },
		],
	});
	await context.addInitScript(installHoverMatchMediaMock, "mobile-none");
	await page.goto(`${BASE}${enPath}`, { waitUntil: "networkidle" });
	await page.locator("[data-bdcv2-sheet-open]").click();
	await page.waitForTimeout(180);
	let ops = await measureBdcComposition(page);
	assert(ops.sheetOpen && ops.sheetVisible, "H mobile open confirmed");
	await page.evaluate(() => {
		const original = window.__timivaOriginalMatchMedia || window.matchMedia.bind(window);
		window.__timivaOriginalMatchMedia = original;
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
			const result = original(query);
			const hasHoverHover = /\(hover:\s*hover\)/.test(query);
			const hasHoverNone = /\(hover:\s*none\)/.test(query);
			if (!hasHoverHover && !hasHoverNone) return result;
			const baseQuery = stripHoverClauses(query);
			const baseMatches = baseQuery ? original(baseQuery).matches : true;
			if (!baseMatches) return { ...result, matches: false, media: query, ...handlers };
			if (hasHoverHover) return { ...result, matches: true, media: query, ...handlers };
			if (hasHoverNone) return { ...result, matches: false, media: query, ...handlers };
			return result;
		};
	});
	await client.send("Emulation.setEmulatedMedia", {
		media: "screen",
		features: [
			{ name: "hover", value: "hover" },
			{ name: "pointer", value: "fine" },
		],
	});
	await page.setViewportSize({ width: 900, height: 650 });
	await page.evaluate(() => window.dispatchEvent(new Event("resize")));
	await page.waitForTimeout(300);
	ops = await measureBdcComposition(page);
	note(
		`H after Desktop: mode=${ops.resolveMode} desk=${ops.desktopVisible} mob=${ops.mobileVisible} sheetOpen=${ops.sheetOpen} lock=${ops.scrollLock}`,
	);
	assert(ops.desktopVisible, "H→Desktop: desktop controls visible");
	assert(!ops.mobileVisible, "H→Desktop: mobile capsule hidden");
	assert(
		ops.rsLayout === "desktop" && ops.resolveMode === "desktop",
		"H→Desktop: composition attrs",
	);
	assert(!ops.sheetOpen, "H→Desktop: MSB is-open false");
	assert(!ops.sheetVisible, "H→Desktop: MSB not visible");
	assert(!ops.scrollLock, "H→Desktop: scroll lock cleared");
	assert(ops.rootSheetOpenAttr !== "true", "H→Desktop: sheet-open attr cleared");
	assert(!ops.sharedLandscapeChrome, "H→Desktop: no hybrid shared landscape chrome");
	await context.close();
}

/* —— I. Mobile Landscape open → Desktop：safe close —— */
{
	const context = await browser.newContext({
		viewport: { width: 667, height: 375 },
		deviceScaleFactor: 1,
	});
	const page = await context.newPage();
	const client = await context.newCDPSession(page);
	await client.send("Emulation.setEmulatedMedia", {
		media: "screen",
		features: [
			{ name: "hover", value: "none" },
			{ name: "pointer", value: "coarse" },
		],
	});
	await context.addInitScript(installHoverMatchMediaMock, "mobile-none");
	await page.goto(`${BASE}${enPath}`, { waitUntil: "networkidle" });
	await page.locator("[data-bdcv2-sheet-open]").click();
	await page.waitForTimeout(180);
	let ops = await measureBdcComposition(page);
	assert(ops.sheetOpen && ops.sheetVisible, "I ML open confirmed");
	await page.evaluate(() => {
		const original = window.__timivaOriginalMatchMedia || window.matchMedia.bind(window);
		window.__timivaOriginalMatchMedia = original;
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
			const result = original(query);
			const hasHoverHover = /\(hover:\s*hover\)/.test(query);
			const hasHoverNone = /\(hover:\s*none\)/.test(query);
			if (!hasHoverHover && !hasHoverNone) return result;
			const baseQuery = stripHoverClauses(query);
			const baseMatches = baseQuery ? original(baseQuery).matches : true;
			if (!baseMatches) return { ...result, matches: false, media: query, ...handlers };
			if (hasHoverHover) return { ...result, matches: true, media: query, ...handlers };
			if (hasHoverNone) return { ...result, matches: false, media: query, ...handlers };
			return result;
		};
	});
	await client.send("Emulation.setEmulatedMedia", {
		media: "screen",
		features: [
			{ name: "hover", value: "hover" },
			{ name: "pointer", value: "fine" },
		],
	});
	await page.setViewportSize({ width: 900, height: 650 });
	await page.evaluate(() => window.dispatchEvent(new Event("resize")));
	await page.waitForTimeout(300);
	ops = await measureBdcComposition(page);
	assert(
		ops.desktopVisible && !ops.sheetOpen && !ops.sheetVisible && !ops.scrollLock,
		"I ML→Desktop: safe close + Desktop UI",
	);
	await context.close();
}

/* —— J. Mobile Default / Landscape MSB presentation smoke（open）—— */
{
	const { context, page } = await openPage(
		browser,
		enPath,
		{ width: 390, height: 844 },
		"mobile-none",
	);
	await page.locator("[data-bdcv2-sheet-open]").click();
	await page.waitForTimeout(150);
	const ops = await measureBdcComposition(page);
	assert(ops.sheetVisible && ops.sheetOpen, "J Default sheet opens");
	assert(ops.scrollLock, "J Default scroll lock");
	await page.keyboard.press("Escape");
	await page.waitForTimeout(120);
	const closed = await measureBdcComposition(page);
	assert(!closed.sheetOpen && !closed.sheetVisible, "J Default Escape closes");
	await context.close();
}
{
	const { context, page } = await openPage(
		browser,
		enPath,
		{ width: 667, height: 375 },
		"mobile-none",
	);
	await page.locator("[data-bdcv2-sheet-open]").click();
	await page.waitForTimeout(150);
	const ops = await measureBdcComposition(page);
	assert(ops.sheetVisible && ops.sheetOpen, "J Landscape sheet opens");
	/* Landscape sheet should be compact — height well under viewport */
	assert(
		parseFloat(ops.sheetHeight ?? "999") < ops.innerHeight * 0.55 ||
			parseFloat(ops.sheetMaxHeight ?? "999") <= 224,
		`J Landscape sheet compact geometry (h=${ops.sheetHeight} max=${ops.sheetMaxHeight})`,
	);
	await page.keyboard.press("Escape");
	await context.close();
}

await browser.close();

writeFileSync(
	evidencePath,
	JSON.stringify({ passed, failed, evidence, base: BASE, at: new Date().toISOString() }, null, 2),
);

console.log(`\nevidence → ${evidencePath}\n`);
console.log(`${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log("qa-business-days-calculator-responsive-composition-browser PASS");
