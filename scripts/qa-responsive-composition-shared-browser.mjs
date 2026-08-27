/**
 * Shared Responsive Composition — Browser QA (Batch 1).
 * Uses Lunar TPF adopter as rendered fixture. Does not remove Lunar workaround.
 *
 * Run after build: npx astro preview --port 4351 &
 *   COMP_QA_BASE=http://localhost:4351 node scripts/qa-responsive-composition-shared-browser.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.COMP_QA_BASE ?? process.env.LDC_QA_BASE ?? "http://localhost:4351";
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const evidencePath = join(
	rootDir,
	"local-docs/validation/responsive-composition-batch1-evidence.json",
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
async function openPage(browser, path, viewport, hoverMode) {
	const context = await browser.newContext({
		viewport,
		hasTouch: hoverMode === "mobile-none",
		isMobile: hoverMode === "mobile-none" && viewport.width < 768,
	});
	if (hoverMode === "desktop-hover") {
		await context.addInitScript(() => {
			const original = window.matchMedia.bind(window);
			window.matchMedia = (query) => {
				const result = original(query);
				if (/\(hover:\s*hover\)/.test(query) || query.includes("hover: hover")) {
					return {
						matches: true,
						media: query,
						addEventListener: () => {},
						removeEventListener: () => {},
						addListener: () => {},
						removeListener: () => {},
						onchange: null,
						dispatchEvent: () => true,
					};
				}
				if (/\(hover:\s*none\)/.test(query) || query.includes("hover: none")) {
					return {
						matches: false,
						media: query,
						addEventListener: () => {},
						removeEventListener: () => {},
						addListener: () => {},
						removeListener: () => {},
						onchange: null,
						dispatchEvent: () => true,
					};
				}
				return result;
			};
		});
	} else {
		await context.addInitScript(() => {
			const original = window.matchMedia.bind(window);
			window.matchMedia = (query) => {
				const result = original(query);
				if (/\(hover:\s*none\)/.test(query) || query.includes("hover: none")) {
					return {
						matches: true,
						media: query,
						addEventListener: () => {},
						removeEventListener: () => {},
						addListener: () => {},
						removeListener: () => {},
						onchange: null,
						dispatchEvent: () => true,
					};
				}
				if (/\(hover:\s*hover\)/.test(query) || query.includes("hover: hover")) {
					return {
						matches: false,
						media: query,
						addEventListener: () => {},
						removeEventListener: () => {},
						addListener: () => {},
						removeListener: () => {},
						onchange: null,
						dispatchEvent: () => true,
					};
				}
				return result;
			};
		});
	}
	const page = await context.newPage();
	await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
	await page.waitForSelector("[data-tool-page-frame]");
	return { context, page };
}

async function measureComposition(page) {
	return page.evaluate(() => {
		const desktop = document.querySelector(
			"[data-tool-page-frame] .tpf-desktop-controls",
		);
		const mobile = document.querySelector(
			"[data-tool-page-frame] .tpf-mobile-controls",
		);
		const capsule =
			document.querySelector(
				"[data-tool-page-frame] .tpf-mobile-capsule > *",
			) || document.querySelector(".ldcv2-mobile-capsule");
		const dStyle = desktop ? getComputedStyle(desktop) : null;
		const mStyle = mobile ? getComputedStyle(mobile) : null;
		const cStyle = capsule ? getComputedStyle(capsule) : null;
		const cRect = capsule?.getBoundingClientRect();
		const desktopVisible =
			Boolean(desktop) &&
			dStyle.display !== "none" &&
			(desktop.getBoundingClientRect().height > 0 || dStyle.display === "contents");
		const mobileVisible =
			Boolean(mobile) &&
			mStyle.display !== "none" &&
			mobile.getBoundingClientRect().height > 0;
		const minH = parseFloat(cStyle?.minHeight ?? "0");
		const padY = parseFloat(cStyle?.paddingTop ?? "0");
		const fontSize = parseFloat(cStyle?.fontSize ?? "0");
		const flatLandscape =
			mobileVisible && minH > 0 && minH <= 36 && padY <= 8 && fontSize > 0 && fontSize <= 13;
		return {
			desktopDisplay: dStyle?.display ?? "missing",
			mobileDisplay: mStyle?.display ?? "missing",
			desktopVisible,
			mobileVisible,
			capsuleMinHeight: cStyle?.minHeight ?? null,
			capsulePaddingTop: cStyle?.paddingTop ?? null,
			capsuleFontSize: cStyle?.fontSize ?? null,
			capsuleHeight: cRect?.height ?? 0,
			flatLandscape,
			innerWidth: window.innerWidth,
			innerHeight: window.innerHeight,
		};
	});
}

console.log("qa-responsive-composition-shared-browser\n");
console.log(`base: ${BASE}\n`);

mkdirSync(join(rootDir, "local-docs/validation"), { recursive: true });
await waitForServer(`${BASE}/en/lunar-date-converter/`);

const pw = await loadPlaywright();
const browser = await pw.chromium.launch({ headless: true });
const path = "/en/lunar-date-converter/";
const zhPath = "/zh/lunar-date-converter/";

/* —— A. Desktop continuity + short desktop —— */
for (const { width, height, label } of [
	{ width: 1280, height: 900, label: "1280×900" },
	{ width: 1000, height: 800, label: "1000×800" },
	{ width: 900, height: 800, label: "900×800" },
	{ width: 899, height: 800, label: "899×800" },
	{ width: 824, height: 800, label: "824×800" },
	{ width: 769, height: 800, label: "769×800" },
	{ width: 768, height: 800, label: "768×800" },
	{ width: 900, height: 650, label: "900×650 short" },
	{ width: 824, height: 650, label: "824×650 short" },
]) {
	const { context, page } = await openPage(
		browser,
		path,
		{ width, height },
		"desktop-hover",
	);
	const ops = await measureComposition(page);
	note(`${label}: desktop=${ops.desktopDisplay} mobile=${ops.mobileDisplay} flat=${ops.flatLandscape}`);
	assert(ops.desktopVisible, `A ${label}: desktop slot visible`);
	assert(!ops.mobileVisible, `A ${label}: mobile slot hidden`);
	assert(!ops.flatLandscape, `A ${label}: not Mobile Landscape flat capsule`);
	await context.close();
}

/* —— B. Narrow desktop browser 700×500 —— */
{
	const { context, page } = await openPage(
		browser,
		path,
		{ width: 700, height: 500 },
		"desktop-hover",
	);
	const ops = await measureComposition(page);
	note(
		`700×500: desktop=${ops.desktopDisplay} mobile=${ops.mobileDisplay} minH=${ops.capsuleMinHeight} flat=${ops.flatLandscape}`,
	);
	assert(!ops.desktopVisible, "B 700×500: desktop slot hidden (Mobile-style)");
	assert(ops.mobileVisible, "B 700×500: mobile slot visible");
	assert(!ops.flatLandscape, "B 700×500: NOT Mobile Landscape compact / flat");
	await context.close();
}

/* —— C. Mobile Default / Portrait-style —— */
for (const localePath of [path, zhPath]) {
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
		const ops = await measureComposition(page);
		assert(!ops.desktopVisible, `C ${locale} ${viewport.width}×${viewport.height}: desktop hidden`);
		assert(ops.mobileVisible, `C ${locale} ${viewport.width}×${viewport.height}: mobile visible`);
		assert(
			!ops.flatLandscape,
			`C ${locale} ${viewport.width}×${viewport.height}: not flat landscape compact`,
		);
		await context.close();
	}
}

/* —— D. Mobile Landscape —— */
for (const localePath of [path, zhPath]) {
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
		const ops = await measureComposition(page);
		note(
			`D ${locale} ${viewport.width}×${viewport.height}: minH=${ops.capsuleMinHeight} h=${ops.capsuleHeight} flat=${ops.flatLandscape}`,
		);
		assert(!ops.desktopVisible, `D ${locale} ${viewport.width}×${viewport.height}: desktop hidden`);
		assert(ops.mobileVisible, `D ${locale} ${viewport.width}×${viewport.height}: mobile visible`);
		assert(
			ops.flatLandscape || ops.capsuleHeight <= 44,
			`D ${locale} ${viewport.width}×${viewport.height}: compact landscape geometry`,
		);
		await context.close();
	}
}

/* —— E. Transition chain —— */
{
	const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
	await context.addInitScript(() => {
		const original = window.matchMedia.bind(window);
		window.matchMedia = (query) => {
			const result = original(query);
			if (/\(hover:\s*hover\)/.test(query) || query.includes("hover: hover")) {
				return {
					matches: true,
					media: query,
					addEventListener: () => {},
					removeEventListener: () => {},
					addListener: () => {},
					removeListener: () => {},
					onchange: null,
					dispatchEvent: () => true,
				};
			}
			if (/\(hover:\s*none\)/.test(query) || query.includes("hover: none")) {
				return {
					matches: false,
					media: query,
					addEventListener: () => {},
					removeEventListener: () => {},
					addListener: () => {},
					removeListener: () => {},
					onchange: null,
					dispatchEvent: () => true,
				};
			}
			return result;
		};
	});
	const page = await context.newPage();
	await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });

	const steps = [
		{ width: 1280, height: 900, expect: "desktop" },
		{ width: 824, height: 800, expect: "desktop" },
		{ width: 700, height: 500, expect: "default" },
	];
	for (const step of steps) {
		await page.setViewportSize({ width: step.width, height: step.height });
		await page.waitForTimeout(80);
		const ops = await measureComposition(page);
		if (step.expect === "desktop") {
			assert(ops.desktopVisible && !ops.flatLandscape, `E ${step.width}×${step.height}: desktop continuity`);
		} else {
			assert(
				ops.mobileVisible && !ops.desktopVisible && !ops.flatLandscape,
				`E ${step.width}×${step.height}: Mobile Default / Portrait-style`,
			);
		}
	}
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
console.log("qa-responsive-composition-shared-browser PASS");
