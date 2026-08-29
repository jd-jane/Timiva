/**
 * Hours Calculator — Responsive Composition Browser QA (Batch 3A).
 *
 * Run after build: npx astro preview --port 4352 &
 *   HCV2_QA_BASE=http://localhost:4352 node scripts/qa-hours-calculator-responsive-composition-browser.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.HCV2_QA_BASE ?? process.env.LDC_QA_BASE ?? "http://localhost:4352";
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const evidencePath = join(
	rootDir,
	"local-docs/validation/hours-calculator-responsive-composition-batch3a-evidence.json",
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
	await page.waitForSelector("[data-hours-calculator-v2]");
	return { context, page };
}

async function measureHoursComposition(page) {
	return page.evaluate(() => {
		const api = window.TimivaHoursCalculatorLayout;
		const desktop = document.querySelector(
			"[data-hours-calculator-v2] .hcv2-input-cluster--desktop",
		);
		const mobile = document.querySelector(
			"[data-hours-calculator-v2] .hcv2-mobile-controls",
		);
		const capsule = document.querySelector(
			"[data-hours-calculator-v2] .hcv2-mobile-capsule",
		);
		const rs = document.querySelector(
			"[data-hours-calculator-v2] [data-result-summary]",
		);
		const dStyle = desktop ? getComputedStyle(desktop) : null;
		const mStyle = mobile ? getComputedStyle(mobile) : null;
		const cStyle = capsule ? getComputedStyle(capsule) : null;
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
		const flatLandscape =
			mobileVisible && minH > 0 && minH <= 36 && padY <= 8 && fontSize > 0 && fontSize <= 13;
		const mode = api?.resolveLayoutMode?.(window) ?? null;
		const rsLayout = rs?.getAttribute("data-rs-layout") ?? null;
		return {
			desktopVisible,
			mobileVisible,
			flatLandscape,
			rsLayout,
			resolveMode: mode,
			capsuleMinHeight: cStyle?.minHeight ?? null,
			capsuleFontSize: cStyle?.fontSize ?? null,
			innerWidth: window.innerWidth,
			innerHeight: window.innerHeight,
		};
	});
}

async function measureAmeShell(page) {
	return page.evaluate(() => {
		const root = document.querySelector("[data-hours-calculator-v2] [data-ame-root]");
		const shell = root?.querySelector(".ame-shell");
		const underlay = root?.querySelector(".ame-underlay");
		const topbar = root?.querySelector(".ame-topbar");
		const portraitHeader = root?.querySelector(".ame-portrait-header");
		if (!root || !shell) return null;
		const s = getComputedStyle(shell);
		const u = underlay ? getComputedStyle(underlay) : null;
		const t = topbar ? getComputedStyle(topbar) : null;
		const p = portraitHeader ? getComputedStyle(portraitHeader) : null;
		const radius = parseFloat(s.borderTopLeftRadius || "0");
		const underlayHidden = !underlay || u.display === "none";
		const topbarShown = Boolean(topbar) && t.display !== "none" && t.display !== "contents";
		const portraitChromeHidden = !portraitHeader || p.display === "none";
		const fullscreenLandscape =
			underlayHidden &&
			radius === 0 &&
			topbarShown &&
			portraitChromeHidden &&
			(s.height === "100dvh" || shell.getBoundingClientRect().height >= window.innerHeight * 0.9);
		return {
			fullscreenLandscape,
			bottomSheetLike:
				!fullscreenLandscape &&
				root.getAttribute("data-ame-open") === "true" &&
				(!underlay || u.display !== "none" || radius > 0 || (portraitHeader && p.display !== "none")),
		};
	});
}

console.log("qa-hours-calculator-responsive-composition-browser\n");
console.log(`base: ${BASE}\n`);

mkdirSync(join(rootDir, "local-docs/validation"), { recursive: true });
await waitForServer(`${BASE}/en/hours-calculator/`);

const pw = await loadPlaywright();
const browser = await pw.chromium.launch({ headless: true });
const enPath = "/en/hours-calculator/";
const zhPath = "/zh/hours-calculator/";

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
		const ops = await measureHoursComposition(page);
		note(
			`${locale} ${label}: desktop=${ops.desktopVisible} mobile=${ops.mobileVisible} rs=${ops.rsLayout} mode=${ops.resolveMode}`,
		);
		assert(ops.desktopVisible, `A ${locale} ${label}: desktop cluster visible`);
		assert(!ops.mobileVisible, `A ${locale} ${label}: mobile controls hidden`);
		assert(!ops.flatLandscape, `A ${locale} ${label}: NOT Mobile Landscape compact`);
		assert(
			ops.rsLayout === "desktop" && ops.resolveMode === "desktop",
			`A ${locale} ${label}: layout-contract + data-rs-layout = desktop`,
		);
		await context.close();
	}
}

/* —— B. Narrow desktop 700×500 —— */
for (const localePath of [enPath, zhPath]) {
	const locale = localePath.includes("/zh/") ? "zh" : "en";
	const { context, page } = await openPage(
		browser,
		localePath,
		{ width: 700, height: 500 },
		"desktop-hover",
	);
	const ops = await measureHoursComposition(page);
	note(
		`${locale} 700×500: rs=${ops.rsLayout} mode=${ops.resolveMode} flat=${ops.flatLandscape} minH=${ops.capsuleMinHeight}`,
	);
	assert(!ops.desktopVisible, `B ${locale} 700×500: desktop cluster hidden`);
	assert(ops.mobileVisible, `B ${locale} 700×500: mobile controls visible`);
	assert(!ops.flatLandscape, `B ${locale} 700×500: NOT landscape compact`);
	assert(
		ops.rsLayout === "portrait" && ops.resolveMode === "portrait",
		`B ${locale} 700×500: Mobile Default / Portrait-style layout attrs`,
	);
	await context.close();
}

/* —— C. Mobile Default —— */
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
		const ops = await measureHoursComposition(page);
		assert(!ops.desktopVisible, `C ${locale} ${viewport.width}×${viewport.height}: desktop hidden`);
		assert(ops.mobileVisible, `C ${locale} ${viewport.width}×${viewport.height}: mobile visible`);
		assert(
			!ops.flatLandscape,
			`C ${locale} ${viewport.width}×${viewport.height}: not landscape compact`,
		);
		assert(
			ops.rsLayout === "portrait" && ops.resolveMode === "portrait",
			`C ${locale} ${viewport.width}×${viewport.height}: portrait layout attrs`,
		);
		await context.close();
	}
}

/* —— D. Mobile Landscape —— */
for (const localePath of [enPath, zhPath]) {
	const locale = localePath.includes("/zh/") ? "zh" : "en";
	for (const viewport of [
		{ width: 667, height: 375 },
		{ width: 844, height: 390 },
	]) {
		const { context, page } = await openPage(
			browser,
			localePath,
			viewport,
			"mobile-none",
		);
		const ops = await measureHoursComposition(page);
		note(
			`D ${locale} ${viewport.width}×${viewport.height}: rs=${ops.rsLayout} flat=${ops.flatLandscape}`,
		);
		assert(!ops.desktopVisible, `D ${locale} ${viewport.width}×${viewport.height}: desktop hidden`);
		assert(ops.mobileVisible, `D ${locale} ${viewport.width}×${viewport.height}: mobile visible`);
		assert(
			ops.flatLandscape,
			`D ${locale} ${viewport.width}×${viewport.height}: landscape compact capsule`,
		);
		assert(
			ops.rsLayout === "landscape" && ops.resolveMode === "landscape-hours",
			`D ${locale} ${viewport.width}×${viewport.height}: landscape layout attrs`,
		);
		await context.close();
	}
}

/* —— E. Transition chain (desktop-hover continuity) —— */
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
		const ops = await measureHoursComposition(page);
		if (step.expect === "desktop") {
			assert(
				ops.desktopVisible && ops.rsLayout === "desktop",
				`E ${step.width}×${step.height}: desktop continuity`,
			);
		} else {
			assert(
				ops.mobileVisible && !ops.desktopVisible && !ops.flatLandscape && ops.rsLayout === "portrait",
				`E ${step.width}×${step.height}: Mobile Default / Portrait-style`,
			);
		}
	}
	await context.close();
}

/* —— F. AME presentation smoke (mobile-style entry only) —— */
for (const { viewport, hover, label, expectFs } of [
	{ viewport: { width: 700, height: 500 }, hover: "desktop-hover", label: "700×500", expectFs: false },
	{ viewport: { width: 390, height: 844 }, hover: "mobile-none", label: "390×844", expectFs: false },
	{ viewport: { width: 667, height: 375 }, hover: "mobile-none", label: "667×375", expectFs: true },
]) {
	const { context, page } = await openPage(browser, enPath, viewport, hover);
	await page.locator("[data-hcv2-sheet-trigger]").click();
	await page.waitForFunction(
		() =>
			document
				.querySelector("[data-hours-calculator-v2] [data-ame-root]")
				?.getAttribute("data-ame-open") === "true",
	);
	const m = await measureAmeShell(page);
	note(`F AME ${label}: fs=${m?.fullscreenLandscape}`);
	assert(
		Boolean(m) && m.fullscreenLandscape === expectFs,
		`F AME ${label}: Full-screen=${expectFs}`,
	);
	await page.keyboard.press("Escape");
	await context.close();
}

await browser.close();

writeFileSync(
	evidencePath,
	JSON.stringify({ evidence, passed, failed }, null, 2),
);
console.log(`\nevidence → ${evidencePath}`);
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log("qa-hours-calculator-responsive-composition-browser PASS");
