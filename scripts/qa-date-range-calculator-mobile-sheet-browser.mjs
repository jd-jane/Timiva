/**
 * Date Range Calculator — Phase 2 Mobile Default MSB (browser).
 *
 * Run after build:
 *   npx astro preview --host 127.0.0.1 --port 4387
 *   DRV2_MSB_QA_BASE=http://127.0.0.1:4387 node scripts/qa-date-range-calculator-mobile-sheet-browser.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.DRV2_MSB_QA_BASE ?? "http://127.0.0.1:4387";
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const evidencePath = join(
	rootDir,
	"local-docs/validation/date-range-calculator-mobile-sheet-phase2-evidence.json",
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

async function openPage(browser, path, viewport) {
	const context = await browser.newContext({
		viewport,
		hasTouch: true,
		isMobile: viewport.width < 768,
	});
	await context.addInitScript(installHoverMatchMediaMock, "mobile-none");
	const page = await context.newPage();
	await applyCssHoverMedia(page, "mobile-none");
	await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
	await applyCssHoverMedia(page, "mobile-none");
	await page.waitForSelector("[data-date-range-v2]");
	return { context, page };
}

async function measureSheet(page) {
	return page.evaluate(() => {
		const portal = document.querySelector("[data-drv2-sheet-portal]");
		const sheet = document.getElementById("range-sheet");
		const overlay = document.querySelector("[data-drv2-sheet-overlay]");
		const body = portal?.querySelector(".msb-sheet-body");
		const action = portal?.querySelector("[data-drv2-sheet-footer]");
		const clearButtons = portal
			? [...portal.querySelectorAll("[data-drv2-sheet-clear]")]
			: [];
		const visibleClears = clearButtons.filter((btn) => {
			const style = getComputedStyle(btn);
			const rect = btn.getBoundingClientRect();
			return (
				style.display !== "none" &&
				style.visibility !== "hidden" &&
				rect.width > 0 &&
				rect.height > 0 &&
				!btn.hidden
			);
		});
		const gridCells = portal?.querySelectorAll(".calendar-grid .calendar-day, .calendar-grid .calendar-cell--empty");
		const scrollLock =
			document.documentElement.classList.contains("msb-scroll-lock") ||
			document.body.classList.contains("msb-scroll-lock");
		const sheetOpen = Boolean(sheet?.classList.contains("is-open"));
		const overlayVisible = Boolean(
			overlay?.classList.contains("is-visible") && !overlay.hidden,
		);
		const sheetRect = sheet?.getBoundingClientRect();
		const actionRect = action?.getBoundingClientRect();
		const sheetOnScreen =
			sheetOpen &&
			sheetRect &&
			sheetRect.height > 120 &&
			sheetRect.top < window.innerHeight - 48 &&
			sheetRect.bottom > window.innerHeight * 0.35;
		const bodyScroll =
			body && body.scrollHeight > body.clientHeight + 1
				? {
						scrollHeight: body.scrollHeight,
						clientHeight: body.clientHeight,
						canScroll: body.scrollTop >= 0,
					}
				: null;
		const panel = portal?.querySelector(".calendar-panel");
		const panelStyle = panel ? getComputedStyle(panel) : null;
		const grid = portal?.querySelector(".calendar-grid");
		const gridStyle = grid ? getComputedStyle(grid) : null;
		const bodyStyle = body ? getComputedStyle(body) : null;
		const innerCard =
			panelStyle &&
			(Number.parseFloat(panelStyle.paddingTop) > 1 ||
				Number.parseFloat(panelStyle.paddingLeft) > 1 ||
				Number.parseFloat(panelStyle.borderTopWidth) > 0.5 ||
				Number.parseFloat(panelStyle.borderRadius) > 0.5 ||
				(panelStyle.backgroundImage !== "none" && panelStyle.backgroundImage !== "") ||
				(panelStyle.backgroundColor !== "rgba(0, 0, 0, 0)" &&
					panelStyle.backgroundColor !== "transparent"));
		return {
			portalOnBody: portal?.parentElement === document.body,
			sheetOpen,
			overlayVisible,
			hasMsbHandle: Boolean(portal?.querySelector(".msb-sheet-handle")),
			hasLegacyWrapper: Boolean(portal?.querySelector(".tool-bottom-sheet-content")),
			clearCount: visibleClears.length,
			gridCellCount: gridCells?.length ?? 0,
			gridColumns: /repeat\(\s*7/.test(gridStyle?.gridTemplateColumns ?? "")
				? 7
				: (gridStyle?.gridTemplateColumns?.split(" ").filter(Boolean).length ?? 0),
			innerCard: Boolean(innerCard),
			bodyPaddingTop: bodyStyle ? Number.parseFloat(bodyStyle.paddingTop) : null,
			scrollLock,
			sheetVisible: sheetOnScreen,
			actionReachable:
				sheetOpen &&
				actionRect &&
				actionRect.height > 0 &&
				actionRect.bottom <= window.innerHeight + 2,
			bodyScroll,
			mode: window.TimivaDateRangeLayout?.resolveLayoutMode?.(window) ?? null,
		};
	});
}

mkdirSync(join(rootDir, "local-docs/validation"), { recursive: true });
await waitForServer(`${BASE}/en/date-range-calculator/`);

const pw = await loadPlaywright();
const browser = await pw.chromium.launch({ headless: true });
const path = "/en/date-range-calculator/";

for (const vp of [
	{ width: 390, height: 844, label: "390×844 BLOCKING" },
	{ width: 645, height: 749, label: "645×749 BLOCKING" },
	{ width: 430, height: 615, label: "430×615 BLOCKING" },
]) {
	const { context, page } = await openPage(browser, path, vp);
	await page.locator("#range-display-trigger").click();
	await page.waitForTimeout(220);
	const ops = await measureSheet(page);
	note(`${vp.label}: ${JSON.stringify(ops)}`);

	assert(ops.mode === "portrait", `${vp.label}: Mobile Default portrait mode`);
	assert(ops.portalOnBody, `${vp.label}: MSB portal appended to body`);
	assert(ops.sheetOpen && ops.sheetVisible, `${vp.label}: sheet fully open`);
	assert(ops.overlayVisible, `${vp.label}: overlay visible`);
	assert(ops.hasMsbHandle, `${vp.label}: single MSB visual shell (handle present)`);
	assert(!ops.hasLegacyWrapper, `${vp.label}: no legacy tool-bottom-sheet-content wrapper`);
	assert(ops.clearCount === 1, `${vp.label}: single visible Clear dates owner`);
	assert(ops.gridCellCount >= 28, `${vp.label}: calendar grid rendered`);
	assert(ops.gridColumns === 7, `${vp.label}: calendar view uses 7-column grid`);
	assert(!ops.innerCard, `${vp.label}: calendar has no inner card chrome`);
	assert(ops.bodyPaddingTop === 0, `${vp.label}: no extra inner padding on sheet body`);

	if (ops.bodyScroll) {
		const before = await page.evaluate(() => {
			const body = document.querySelector("[data-drv2-sheet-portal] .msb-sheet-body");
			return body?.scrollTop ?? 0;
		});
		await page.evaluate(() => {
			const body = document.querySelector("[data-drv2-sheet-portal] .msb-sheet-body");
			if (body) body.scrollTop = body.scrollHeight;
		});
		const after = await page.evaluate(() => {
			const body = document.querySelector("[data-drv2-sheet-portal] .msb-sheet-body");
			return body?.scrollTop ?? 0;
		});
		assert(after > before, `${vp.label}: sheet body scrolls when overflow`);
	}

	assert(ops.actionReachable, `${vp.label}: footer/action reachable in viewport`);

	await page.locator("[data-drv2-portrait-period-trigger]").click();
	await page.waitForTimeout(120);
	const picker = await page.evaluate(() => {
		const grid = document.querySelector("[data-drv2-portrait-month-grid]");
		if (!grid) {
			return null;
		}
		const style = getComputedStyle(grid);
		const options = [...grid.querySelectorAll(".drv2-portrait-month-option")];
		const xs = [...new Set(options.map((el) => Math.round(el.getBoundingClientRect().x)))];
		return {
			display: style.display,
			columns: /repeat\(\s*3/.test(style.gridTemplateColumns)
				? 3
				: style.gridTemplateColumns.split(" ").filter(Boolean).length,
			optionCount: options.length,
			distinctX: xs.length,
		};
	});
	note(`${vp.label} month picker: ${JSON.stringify(picker)}`);
	assert(picker && picker.display === "grid", `${vp.label}: month/year picker grid display`);
	assert(picker.columns === 3, `${vp.label}: month/year picker is 3-column grid`);
	assert(picker.optionCount === 12 && picker.distinctX >= 3, `${vp.label}: months are not glued into one text run`);

	const overlayBox = await page.locator("[data-drv2-sheet-overlay]").boundingBox();
	if (overlayBox) {
		await page.mouse.click(
			overlayBox.x + overlayBox.width / 2,
			overlayBox.y + Math.min(24, overlayBox.height / 2),
		);
	} else {
		await page.locator("[data-drv2-sheet-overlay]").click({ force: true, position: { x: 8, y: 8 } });
	}
	await page.waitForTimeout(180);
	const closed = await measureSheet(page);
	assert(!closed.sheetOpen, `${vp.label}: overlay close dismisses sheet`);
	assert(!closed.overlayVisible, `${vp.label}: overlay hidden after close`);
	assert(!closed.scrollLock, `${vp.label}: msb scroll lock cleared after close`);

	const focusTarget = await page.evaluate(() => document.activeElement?.id ?? null);
	assert(focusTarget === "range-display-trigger", `${vp.label}: focus returns to capsule trigger`);

	await context.close();
}

await browser.close();

writeFileSync(evidencePath, `${JSON.stringify({ passed, failed, evidence }, null, 2)}\n`);

console.log(`\nPhase 2 MSB browser QA: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
