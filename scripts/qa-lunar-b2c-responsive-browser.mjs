/**
 * Lunar B2C — Responsive Composition QA (A/B/C scenarios).
 *
 * A. Desktop browser resize — no mobile-landscape flat capsule when merely narrowed
 * B. Mobile portrait — canonical Primary Capsule geometry
 * C. Mobile landscape — compact capsule only under canonical mobile + landscape contract
 *
 * Run after build: npx astro preview --port 4340 &
 *   node scripts/qa-lunar-b2c-responsive-browser.mjs
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

async function setupPage(browser, path, viewport, { mockHover = false } = {}) {
	const context = await browser.newContext({ viewport });
	if (mockHover) {
		await context.addInitScript(() => {
			const original = window.matchMedia.bind(window);
			window.matchMedia = (query) => {
				const result = original(query);
				if (query.includes("hover: hover")) {
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
				return result;
			};
		});
	}
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
		const desktop = document.querySelector(".ldcv2-input-cluster--desktop");
		const mobile = document.querySelector(
			"[data-tool-page-frame] .tpf-mobile-controls",
		);
		const capsule = document.querySelector(".ldcv2-mobile-capsule");
		const dStyle = desktop ? getComputedStyle(desktop) : null;
		const mStyle = mobile ? getComputedStyle(mobile) : null;
		const cStyle = capsule ? getComputedStyle(capsule) : null;
		const capsuleRect = capsule?.getBoundingClientRect();
		return {
			desktopDisplay: dStyle?.display ?? "missing",
			mobileDisplay: mStyle?.display ?? "missing",
			desktopVisible:
				desktop &&
				dStyle.display !== "none" &&
				desktop.getBoundingClientRect().height > 0,
			mobileVisible:
				mobile &&
				mStyle.display !== "none" &&
				mobile.getBoundingClientRect().height > 0,
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
			rsLayout: document
				.querySelector("[data-lunar-date-converter-v2] [data-result-summary]")
				?.getAttribute("data-rs-layout"),
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

/** Flat landscape capsule ≈ min-height 2rem / padding 6px — not portrait 3.5rem */
function isFlatLandscapeCapsule(ops) {
	if (!ops.mobileVisible && !ops.capsuleHeight) return false;
	const minH = parseFloat(ops.capsuleMinHeight ?? "0");
	return minH > 0 && minH <= 36;
}

console.log("qa-lunar-b2c-responsive-browser\n");
console.log(`base: ${BASE}\n`);

mkdirSync(join(rootDir, "local-docs/validation"), { recursive: true });
await waitForServer(`${BASE}/en/lunar-date-converter/`);

const pw = await loadPlaywright();
const browser = await pw.chromium.launch({ headless: true });
const geometryLog = {};

/* —— Calendar geometry ×20 (desktop composition) —— */
for (const viewport of [
	{ name: "1280x900", width: 1280, height: 900 },
	{ name: "1000x800", width: 1000, height: 800 },
	{ name: "900x800", width: 900, height: 800 },
]) {
	const { context, page } = await setupPage(
		browser,
		"/en/lunar-date-converter/",
		viewport,
		{ mockHover: true },
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

/* —— A. Desktop browser resize —— */
const desktopResizeCases = [
	{ width: 1280, height: 900 },
	{ width: 1000, height: 800 },
	{ width: 900, height: 800 },
	{ width: 899, height: 800 },
	{ width: 824, height: 800 },
	{ width: 769, height: 800 },
	{ width: 768, height: 800 },
];

for (const { width, height } of desktopResizeCases) {
	const { context, page } = await setupPage(
		browser,
		"/en/lunar-date-converter/",
		{ width, height },
	);
	const ops = await measureOps(page);
	note(
		`A ${width}×${height}: desktop=${ops.desktopDisplay} mobile=${ops.mobileDisplay} capsuleH=${ops.capsuleHeight}`,
	);
	assert(ops.desktopVisible, `A ${width}×${height}: desktop cluster visible (not mobile gap)`);
	assert(!ops.mobileVisible, `A ${width}×${height}: mobile controls hidden at md+`);
	assert(
		!isFlatLandscapeCapsule(ops),
		`A ${width}×${height}: no flat mobile-landscape Primary Capsule`,
	);
	await context.close();
}

/* A: drag-narrow round-trip — calendar stays in desktop composition at 824 */
{
	const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
	const page = await context.newPage();
	await page.goto(`${BASE}/en/lunar-date-converter/`, { waitUntil: "networkidle" });
	await page.waitForSelector("[data-lunar-date-converter-v2]");
	await switchToLunar(page);
	await clickCalendarToggle(page);
	await waitLunarOpen(page);

	await page.setViewportSize({ width: 824, height: 800 });
	await page.waitForTimeout(150);
	const at824 = await measureOps(page);
	assert(at824.desktopVisible, "A resize 1280→824: desktop cluster still visible");
	assert(
		!isFlatLandscapeCapsule(at824),
		"A resize 1280→824: no flat landscape capsule",
	);
	note(`A resize 824: lcOpen=${at824.lcOpen} (desktop composition keeps calendar)`);

	await page.setViewportSize({ width: 767, height: 800 });
	await page.waitForTimeout(150);
	const at767 = await measureOps(page);
	assert(!at767.lcOpen && !at767.sdcOpen, "A resize →767: calendars safely closed");
	assert(at767.mobileVisible, "A resize →767: mobile controls visible");

	await page.setViewportSize({ width: 1280, height: 900 });
	await page.waitForTimeout(150);
	await clickCalendarToggle(page);
	await waitLunarOpen(page);
	const reopened = await measureLc(page);
	assert(reopened.width > 350, `A resize back: calendar reopen width ok (${reopened.width})`);
	await context.close();
}

/* —— B. Mobile portrait —— */
for (const locale of ["en", "zh"]) {
	const path =
		locale === "en" ? "/en/lunar-date-converter/" : "/zh/lunar-date-converter/";
	const { context, page } = await setupPage(browser, path, {
		width: 390,
		height: 844,
	});
	const ops = await measureOps(page);
	assert(!ops.desktopVisible, `B ${locale} portrait: desktop hidden`);
	assert(ops.mobileVisible, `B ${locale} portrait: mobile visible`);
	const minH = parseFloat(ops.capsuleMinHeight ?? "0");
	assert(
		minH >= 48,
		`B ${locale} portrait: capsule min-height ≥3rem (${ops.capsuleMinHeight})`,
	);
	await context.close();
}

/* —— C. Mobile landscape (canonical) —— */
for (const locale of ["en", "zh"]) {
	const path =
		locale === "en" ? "/en/lunar-date-converter/" : "/zh/lunar-date-converter/";
	const { context, page } = await setupPage(browser, path, {
		width: 667,
		height: 375,
	});
	const ops = await measureOps(page);
	note(
		`C ${locale} 667×375: desktop=${ops.desktopDisplay} mobile=${ops.mobileDisplay} minH=${ops.capsuleMinHeight}`,
	);
	assert(!ops.desktopVisible, `C ${locale} landscape: desktop hidden`);
	assert(ops.mobileVisible, `C ${locale} landscape: mobile visible`);
	assert(
		isFlatLandscapeCapsule(ops) || ops.capsuleHeight <= 40,
		`C ${locale} landscape: compact capsule geometry`,
	);
	await context.close();
}

/* C: 824×650 must NOT enter mobile landscape (desktop resize) */
{
	const { context, page } = await setupPage(
		browser,
		"/en/lunar-date-converter/",
		{ width: 824, height: 650 },
	);
	const ops = await measureOps(page);
	assert(ops.desktopVisible, "C guard 824×650: desktop cluster (not mobile landscape)");
	assert(!isFlatLandscapeCapsule(ops), "C guard 824×650: no flat capsule");
	await context.close();
}

/* —— Composition boundary calendar close (767) —— */
{
	const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
	const page = await context.newPage();
	await page.goto(`${BASE}/en/lunar-date-converter/`, { waitUntil: "networkidle" });
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
	const { context, page } = await setupPage(
		browser,
		"/zh/lunar-date-converter/",
		{ width: 824, height: 800 },
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
