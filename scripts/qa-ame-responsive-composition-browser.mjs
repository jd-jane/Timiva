/**
 * AME Responsive Composition — Browser QA (Batch 2).
 * Fixture: Adaptive Mobile Editor Lab（shared AME；CSS-only landscape presentation）.
 *
 * Run after build: npx astro preview --port 4352 &
 *   AME_QA_BASE=http://localhost:4352 node scripts/qa-ame-responsive-composition-browser.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.AME_QA_BASE ?? "http://localhost:4352";
const LAB = "/preview/tool-component-lab/adaptive-mobile-editor/";
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const evidencePath = join(
	rootDir,
	"local-docs/validation/ame-responsive-composition-batch2-evidence.json",
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
	if (!page.__ameCdp) {
		page.__ameCdp = await page.context().newCDPSession(page);
	}
	const none = hoverMode === "mobile-none";
	await page.__ameCdp.send("Emulation.setEmulatedMedia", {
		media: "screen",
		features: [
			{ name: "hover", value: none ? "none" : "hover" },
			{ name: "pointer", value: none ? "coarse" : "fine" },
		],
	});
	/* Force style recalc after feature change */
	await page.evaluate(() => {
		document.documentElement.style.zoom = "1.0001";
		document.documentElement.offsetHeight;
		document.documentElement.style.zoom = "";
	});
}

/**
 * @param {"desktop-hover"|"mobile-none"} hoverMode
 */
async function openLab(browser, viewport, hoverMode) {
	const context = await browser.newContext({
		viewport,
		hasTouch: hoverMode === "mobile-none",
		isMobile: hoverMode === "mobile-none" && viewport.width <= 500,
	});
	await context.addInitScript((mode) => {
		const original = window.matchMedia.bind(window);
		const forceHover = mode === "desktop-hover";
		window.matchMedia = (query) => {
			const normalized = query.replace(/\s+/g, " ").trim();
			/* Only exact hover queries — never short-circuit compound MQs. */
			if (
				normalized === "(hover: hover)" ||
				normalized === "hover: hover"
			) {
				return {
					matches: forceHover,
					media: query,
					addEventListener: () => {},
					removeEventListener: () => {},
					addListener: () => {},
					removeListener: () => {},
					onchange: null,
					dispatchEvent: () => true,
				};
			}
			if (
				normalized === "(hover: none)" ||
				normalized === "hover: none"
			) {
				return {
					matches: !forceHover,
					media: query,
					addEventListener: () => {},
					removeEventListener: () => {},
					addListener: () => {},
					removeListener: () => {},
					onchange: null,
					dispatchEvent: () => true,
				};
			}
			return original(query);
		};
	}, hoverMode);
	const page = await context.newPage();
	await page.goto(`${BASE}${LAB}`, { waitUntil: "networkidle" });
	await applyCssHoverMedia(page, hoverMode);
	await page.waitForSelector("[data-ame-root]", { state: "attached" });
	await page.waitForSelector("[data-ame-lab-open][data-ame-trigger-ready='true']");
	return { context, page };
}

async function openAme(page) {
	await page.locator("[data-ame-lab-open]").click();
	await page.waitForFunction(
		() =>
			document
				.querySelector("[data-ame-root]")
				?.getAttribute("data-ame-open") === "true",
	);
}

async function closeAmeViaEscape(page) {
	await page.keyboard.press("Escape");
	await page.waitForFunction(
		() =>
			document
				.querySelector("[data-ame-root]")
				?.getAttribute("data-ame-open") !== "true",
		{ timeout: 10000 },
	);
}

async function measureAmeShell(page) {
	return page.evaluate(() => {
		const root = document.querySelector("[data-ame-root]");
		const shell = root?.querySelector(".ame-shell");
		const underlay = root?.querySelector(".ame-underlay");
		const topbar = root?.querySelector(".ame-topbar");
		const portraitHeader = root?.querySelector(".ame-portrait-header");
		const handle = root?.querySelector(".ame-handle");
		if (!root || !shell) {
			return null;
		}
		const s = getComputedStyle(shell);
		const u = underlay ? getComputedStyle(underlay) : null;
		const t = topbar ? getComputedStyle(topbar) : null;
		const p = portraitHeader ? getComputedStyle(portraitHeader) : null;
		const h = handle ? getComputedStyle(handle) : null;
		const radius = parseFloat(s.borderTopLeftRadius || "0");
		const underlayHidden = !underlay || u.display === "none";
		const topbarShown = Boolean(topbar) && t.display !== "none" && t.display !== "contents";
		const portraitChromeHidden =
			(!portraitHeader || p.display === "none") && (!handle || h.display === "none");
		const fullscreenLandscape =
			underlayHidden &&
			radius === 0 &&
			topbarShown &&
			portraitChromeHidden &&
			(s.height === "100dvh" || shell.getBoundingClientRect().height >= window.innerHeight * 0.9);
		const bottomSheetLike =
			!fullscreenLandscape &&
			root.getAttribute("data-ame-open") === "true" &&
			(!underlay || u.display !== "none" || radius > 0 || (portraitHeader && p.display !== "none"));
		return {
			open: root.getAttribute("data-ame-open") === "true",
			shellDisplay: s.display,
			borderRadius: s.borderTopLeftRadius,
			height: s.height,
			underlayDisplay: u?.display ?? "missing",
			topbarDisplay: t?.display ?? "missing",
			portraitHeaderDisplay: p?.display ?? "missing",
			handleDisplay: h?.display ?? "missing",
			fullscreenLandscape,
			bottomSheetLike,
			innerWidth: window.innerWidth,
			innerHeight: window.innerHeight,
		};
	});
}

console.log("qa-ame-responsive-composition-browser\n");
console.log(`base: ${BASE}\n`);

mkdirSync(join(rootDir, "local-docs/validation"), { recursive: true });
await waitForServer(`${BASE}${LAB}`);

const pw = await loadPlaywright();
const browser = await pw.chromium.launch({ headless: true });

/* —— Desktop protection —— */
for (const viewport of [
	{ width: 1280, height: 900, label: "1280×900" },
	{ width: 900, height: 650, label: "900×650 short" },
	{ width: 824, height: 650, label: "824×650 short" },
	{ width: 768, height: 650, label: "768×650 short" },
]) {
	const { context, page } = await openLab(browser, viewport, "desktop-hover");
	await openAme(page);
	const m = await measureAmeShell(page);
	note(`${viewport.label}: fs=${m?.fullscreenLandscape} radius=${m?.borderRadius} underlay=${m?.underlayDisplay}`);
	assert(m?.open, `A ${viewport.label}: AME opens`);
	assert(!m?.fullscreenLandscape, `A ${viewport.label}: NOT Constrained／ML Full-screen`);
	await closeAmeViaEscape(page);
	await context.close();
}

/* —— Constrained Viewport Full-screen（Page stays Mobile Default；AME presentation only） —— */
for (const { viewport, label, expectFs } of [
	{ viewport: { width: 749, height: 701 }, label: "749×701", expectFs: false },
	{ viewport: { width: 749, height: 700 }, label: "749×700", expectFs: true },
	{ viewport: { width: 749, height: 650 }, label: "749×650", expectFs: true },
	{ viewport: { width: 700, height: 500 }, label: "700×500", expectFs: true },
]) {
	const { context, page } = await openLab(browser, viewport, "desktop-hover");
	await openAme(page);
	const m = await measureAmeShell(page);
	note(
		`B ${label}: fs=${m?.fullscreenLandscape} sheet=${m?.bottomSheetLike} radius=${m?.borderRadius} topbar=${m?.topbarDisplay}`,
	);
	assert(m?.open, `B ${label}: AME opens`);
	assert(
		Boolean(m) && m.fullscreenLandscape === expectFs,
		`B ${label}: Full-screen=${expectFs}（Constrained Viewport）`,
	);
	if (expectFs) {
		assert(m?.underlayDisplay === "none", `B ${label}: underlay hidden`);
		assert(parseFloat(m?.borderRadius || "1") === 0, `B ${label}: radius 0`);
		assert(m?.topbarDisplay !== "none", `B ${label}: landscape topbar visible`);
	} else {
		assert(
			m?.bottomSheetLike || (m && parseFloat(m.borderRadius) > 0),
			`B ${label}: Bottom Sheet chrome`,
		);
	}
	await closeAmeViaEscape(page);
	await context.close();
}

/* —— Portrait short-height：不得 Constrained Full-screen —— */
for (const viewport of [
	{ width: 390, height: 700 },
	{ width: 430, height: 650 },
]) {
	const { context, page } = await openLab(browser, viewport, "desktop-hover");
	await openAme(page);
	const m = await measureAmeShell(page);
	assert(m?.open, `Bp ${viewport.width}×${viewport.height}: AME opens`);
	assert(
		!m?.fullscreenLandscape,
		`Bp ${viewport.width}×${viewport.height}: portrait short → Bottom Sheet`,
	);
	await closeAmeViaEscape(page);
	await context.close();
}

/* —— Mobile Default —— */
for (const viewport of [
	{ width: 390, height: 844 },
	{ width: 430, height: 932 },
]) {
	const { context, page } = await openLab(browser, viewport, "mobile-none");
	await openAme(page);
	const m = await measureAmeShell(page);
	assert(m?.open, `C ${viewport.width}×${viewport.height}: AME opens`);
	assert(!m?.fullscreenLandscape, `C ${viewport.width}×${viewport.height}: Bottom Sheet not Full-screen`);
	await page.locator("[data-ame-root] .ame-action-reset, [data-ame-root] [data-ame-reset]").first().click({ trial: true }).catch(() => {});
	await closeAmeViaEscape(page);
	await context.close();
}

/* —— Mobile Landscape —— */
for (const viewport of [
	{ width: 667, height: 375 },
	{ width: 844, height: 390 },
]) {
	const { context, page } = await openLab(browser, viewport, "mobile-none");
	await openAme(page);
	const m = await measureAmeShell(page);
	note(
		`D ${viewport.width}×${viewport.height}: fs=${m?.fullscreenLandscape} topbar=${m?.topbarDisplay} underlay=${m?.underlayDisplay}`,
	);
	assert(m?.open, `D ${viewport.width}×${viewport.height}: AME opens`);
	assert(m?.fullscreenLandscape, `D ${viewport.width}×${viewport.height}: Full-screen landscape`);
	assert(m?.underlayDisplay === "none", `D ${viewport.width}×${viewport.height}: underlay hidden`);
	await closeAmeViaEscape(page);
	await context.close();
}

/* —— Transitions: open across composition —— */
{
	/* E1: closed → open directly on Mobile Landscape */
	{
		const { context, page } = await openLab(
			browser,
			{ width: 667, height: 375 },
			"mobile-none",
		);
		await openAme(page);
		const m = await measureAmeShell(page);
		assert(m?.fullscreenLandscape, "E closed→open on landscape: Full-screen");
		await closeAmeViaEscape(page);
		await context.close();
	}

	/* E2: open on landscape → portrait/default → short desktop (CSS-only; stays open) */
	{
		const { context, page } = await openLab(
			browser,
			{ width: 667, height: 375 },
			"mobile-none",
		);
		await openAme(page);
		await page.setViewportSize({ width: 390, height: 844 });
		await applyCssHoverMedia(page, "mobile-none");
		await page.waitForTimeout(120);
		let m = await measureAmeShell(page);
		assert(m?.open, "E open landscape→portrait: stays open (CSS-only swap)");
		assert(!m?.fullscreenLandscape, "E open landscape→portrait: Bottom Sheet presentation");

		await page.setViewportSize({ width: 1280, height: 800 });
		await applyCssHoverMedia(page, "mobile-none");
		await page.waitForTimeout(120);
		m = await measureAmeShell(page);
		assert(m?.open, "E open mobile→wide desktop: stays open");
		assert(
			!m?.fullscreenLandscape,
			"E open mobile→wide desktop: NOT Full-screen (max-width 1200 gate)",
		);
		await closeAmeViaEscape(page);
		await context.close();
	}

	/* E3: reopen on Mobile Landscape after desktop */
	{
		const { context, page } = await openLab(
			browser,
			{ width: 667, height: 375 },
			"mobile-none",
		);
		await openAme(page);
		const m = await measureAmeShell(page);
		assert(m?.fullscreenLandscape, "E reopen on mobile landscape: Full-screen");
		await closeAmeViaEscape(page);
		await context.close();
	}
}

/* —— Draft Cancel lifecycle smoke（portrait） —— */
{
	const { context, page } = await openLab(
		browser,
		{ width: 390, height: 844 },
		"mobile-none",
	);
	await openAme(page);
	await page.keyboard.press("Escape");
	await page.waitForFunction(
		() =>
			document
				.querySelector("[data-ame-root]")
				?.getAttribute("data-ame-open") !== "true",
	);
	assert(true, "F Escape closes AME on Mobile Default");
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
console.log("qa-ame-responsive-composition-browser PASS");
