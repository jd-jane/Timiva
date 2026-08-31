/**
 * Lunar B2D — Mobile AME Browser QA.
 *
 * Run after build:
 *   LDC_QA_BASE=http://127.0.0.1:4340 node scripts/qa-lunar-b2d-ame-browser.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.LDC_QA_BASE ?? "http://localhost:4340";
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const evidencePath = join(
	rootDir,
	"local-docs/validation/lunar-b2d-ame-browser-evidence.json",
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
				return true;
			},
		};
		const notify = () => {
			const event = { matches: api.matches, media: query };
			for (const listener of listeners) listener(event);
			if (typeof api.onchange === "function") api.onchange(event);
		};
		if (baseMql?.addEventListener) baseMql.addEventListener("change", notify);
		return api;
	};
}

async function applyCssHoverMedia(page, hoverMode) {
	if (!page.__ldcAmeCdp) {
		page.__ldcAmeCdp = await page.context().newCDPSession(page);
	}
	const none = hoverMode === "mobile-none";
	await page.__ldcAmeCdp.send("Emulation.setEmulatedMedia", {
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

async function openPage(browser, path, viewport, hoverMode) {
	const context = await browser.newContext({
		viewport,
		hasTouch: hoverMode === "mobile-none",
		isMobile: hoverMode === "mobile-none" && viewport.width < 768,
	});
	await context.addInitScript(installHoverMatchMediaMock, hoverMode);
	const page = await context.newPage();
	await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
	await applyCssHoverMedia(page, hoverMode);
	await page.waitForSelector("[data-lunar-date-converter-v2]");
	return { context, page };
}

async function measureAme(page) {
	return page.evaluate(() => {
		const root = document.querySelector(
			"[data-lunar-date-converter-v2] [data-ame-root]",
		);
		const shell = root?.querySelector(".ame-shell");
		const underlay = root?.querySelector(".ame-underlay");
		const topbar = root?.querySelector(".ame-topbar");
		const portraitHeader = root?.querySelector(".ame-portrait-header");
		const handle = root?.querySelector(".ame-handle");
		const lock = document.documentElement.classList.contains("ame-scroll-lock");
		const pageContent = document.querySelector("[data-ame-page-content]");
		const desktop = document.querySelector(".ldcv2-input-cluster--desktop");
		const mobile = document.querySelector(
			"[data-tool-page-frame] .tpf-mobile-controls",
		);
		const capsule = document.querySelector("[data-ldcv2-sheet-trigger]");
		const dStyle = desktop ? getComputedStyle(desktop) : null;
		const mStyle = mobile ? getComputedStyle(mobile) : null;
		const s = shell ? getComputedStyle(shell) : null;
		const u = underlay ? getComputedStyle(underlay) : null;
		const t = topbar ? getComputedStyle(topbar) : null;
		const p = portraitHeader ? getComputedStyle(portraitHeader) : null;
		const h = handle ? getComputedStyle(handle) : null;
		const radius = parseFloat(s?.borderTopLeftRadius || "0");
		const underlayHidden = !underlay || u.display === "none";
		const topbarShown =
			Boolean(topbar) && t && t.display !== "none" && t.display !== "contents";
		const portraitChromeHidden =
			(!portraitHeader || p.display === "none") && (!handle || h.display === "none");
		const fullscreen =
			root?.getAttribute("data-ame-open") === "true" &&
			underlayHidden &&
			radius === 0 &&
			topbarShown &&
			portraitChromeHidden &&
			(s.height === "100dvh" ||
				(shell &&
					shell.getBoundingClientRect().height >= window.innerHeight * 0.85));
		const rs = document.querySelector(
			"[data-lunar-date-converter-v2] [data-result-summary]",
		);
		const form = document.querySelector("[data-ldcv2-ame-form]");
		const picker = document.querySelector(
			"[data-ldcv2-ame-gregorian]:not([hidden]) [data-ldcv2-ame-picker], [data-ldcv2-ame-lunar]:not([hidden]) [data-ldcv2-ame-picker]",
		);
		const pickerStyle = picker ? getComputedStyle(picker) : null;
		const daySelect = document.querySelector(
			"[data-ldcv2-ame-gregorian]:not([hidden]) [data-ldcv2-ame-g-day], [data-ldcv2-ame-lunar]:not([hidden]) [data-ldcv2-ame-l-day]",
		);
		const monthSelect = document.querySelector(
			"[data-ldcv2-ame-lunar]:not([hidden]) [data-ldcv2-ame-l-month]",
		);
		const active = document.activeElement;
		const row = picker?.querySelector(".ldcv2-ame-picker-row");
		const label = row?.querySelector(".ame-setting-label");
		const control = row?.querySelector(".ame-setting-control");
		const nativeSelect = row?.querySelector("select");
		const rowStyle = row ? getComputedStyle(row) : null;
		const labelBox = label?.getBoundingClientRect();
		const controlBox = control?.getBoundingClientRect();
		const primary = rs?.querySelector('[data-rs-value="primary"]');
		let primaryLines = 0;
		if (primary) {
			const range = document.createRange();
			range.selectNodeContents(primary);
			primaryLines = range.getClientRects().length;
		}
		const cancelVisible = [...document.querySelectorAll("[data-ame-cancel]")].some(
			(el) => {
				const style = getComputedStyle(el);
				const box = el.getBoundingClientRect();
				return (
					style.display !== "none" &&
					style.visibility !== "hidden" &&
					box.height > 1
				);
			},
		);
		return {
			open: root?.getAttribute("data-ame-open") === "true",
			lifecycle: root?.getAttribute("data-ame-lifecycle") ?? null,
			ameCount: document.querySelectorAll("[data-ame-root]").length,
			fullscreen,
			bottomSheet:
				root?.getAttribute("data-ame-open") === "true" && !fullscreen,
			scrollLock: lock,
			inert: Boolean(pageContent?.inert),
			desktopVisible:
				Boolean(desktop) &&
				dStyle.display !== "none" &&
				desktop.getBoundingClientRect().height > 0,
			mobileVisible:
				Boolean(mobile) &&
				mStyle.display !== "none" &&
				mobile.getBoundingClientRect().height > 0,
			capsuleHeight: capsule?.getBoundingClientRect().height ?? 0,
			rsPrimary:
				rs?.querySelector('[data-rs-value="primary"]')?.textContent?.trim() ?? "",
			mode: document
				.querySelector("[data-lunar-date-converter-v2]")
				?.getAttribute("data-ldcv2-ame"),
			ameGregorianHidden: document.querySelector("[data-ldcv2-ame-gregorian]")
				?.hidden,
			ameLunarHidden: document.querySelector("[data-ldcv2-ame-lunar]")?.hidden,
			pickerDisplay: pickerStyle?.display ?? null,
			pickerFlex: pickerStyle?.flexDirection ?? null,
			pickerColumns: pickerStyle?.gridTemplateColumns ?? null,
			pickerRows: picker?.querySelectorAll(".ldcv2-ame-picker-row").length ?? 0,
			nativeInputs: form?.querySelectorAll("input, textarea").length ?? -1,
			calendarToggle: form?.querySelectorAll("[data-ldcv2-ame-calendar-toggle]").length ?? -1,
			errorSlot: form?.querySelectorAll("[data-ame-field-error], [data-ldcv2-ame-error]").length ?? -1,
			focusTag: active instanceof HTMLElement ? active.tagName : null,
			focusIsEditable:
				active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement,
			focusInShell: Boolean(
				shell && active instanceof Node && shell.contains(active),
			),
			focusOnCapsule: Boolean(
				capsule && active instanceof Node && (active === capsule || capsule.contains(active)),
			),
			dayValues: daySelect
				? [...daySelect.options].map((option) => option.value)
				: [],
			monthLabels: monthSelect
				? [...monthSelect.options].map((option) => option.textContent ?? "")
				: [],
			sdcOpen:
				document
					.querySelector("[data-desktop-calendar]")
					?.getAttribute("data-sdc-open") === "true",
			cancelVisible,
			pickerRowFlex: rowStyle?.flexDirection ?? null,
			fieldLabelLeft:
				Boolean(labelBox && controlBox) &&
				labelBox.x < controlBox.x &&
				Math.abs(labelBox.y - controlBox.y) < 16,
			primaryLines,
			primaryWhiteSpace: primary ? getComputedStyle(primary).whiteSpace : null,
			primaryFontSize: primary ? parseFloat(getComputedStyle(primary).fontSize) : 0,
			weekdayFontSize: (() => {
				const weekday = rs?.querySelector(".rs-weekday");
				return weekday ? parseFloat(getComputedStyle(weekday).fontSize) : 0;
			})(),
			rsLayout: rs?.getAttribute("data-rs-layout") ?? null,
			weekdayTop: rs?.querySelector(".rs-weekday")?.getBoundingClientRect().top ?? 0,
			primaryBottom: primary?.getBoundingClientRect().bottom ?? 0,
			rowOutline:
				rowStyle?.outlineStyle !== "none" && parseFloat(rowStyle?.outlineWidth || "0") > 0,
			selectOutline: nativeSelect
				? (() => {
						const style = getComputedStyle(nativeSelect);
						return style.outlineStyle !== "none" && parseFloat(style.outlineWidth || "0") > 0;
					})()
				: false,
		};
	});
}

function visible(page, selector) {
	return page.locator(selector).filter({ visible: true });
}

async function openAme(page) {
	await visible(page, "[data-ldcv2-sheet-trigger]").click();
	await page.waitForFunction(
		() =>
			document
				.querySelector("[data-lunar-date-converter-v2] [data-ame-root]")
				?.getAttribute("data-ame-open") === "true",
	);
}

async function waitAmeClosed(page) {
	await page.waitForFunction(
		() =>
			document
				.querySelector("[data-lunar-date-converter-v2] [data-ame-root]")
				?.getAttribute("data-ame-open") === "false",
	);
}

console.log("qa-lunar-b2d-ame-browser\n");
console.log(`base: ${BASE}\n`);

mkdirSync(join(rootDir, "local-docs/validation"), { recursive: true });
await waitForServer(`${BASE}/en/lunar-date-converter/`);

const pw = await loadPlaywright();
const browser = await pw.chromium.launch({ headless: true });
const enPath = "/en/lunar-date-converter/";
const zhPath = "/zh/lunar-date-converter/";

/* Desktop must not open AME */
for (const { width, height, label } of [
	{ width: 823, height: 800, label: "823×800" },
	{ width: 799, height: 800, label: "799×800" },
]) {
	const { context, page } = await openPage(
		browser,
		enPath,
		{ width, height },
		"desktop-hover",
	);
	const before = await measureAme(page);
	assert(before.desktopVisible, `${label}: Desktop cluster visible`);
	assert(!before.mobileVisible, `${label}: mobile capsule hidden`);
	assert(!before.open, `${label}: AME stays closed`);
	await context.close();
}

/* Portrait Bottom Sheet + live update / Done / picker / no keyboard */
{
	const { context, page } = await openPage(
		browser,
		enPath,
		{ width: 390, height: 844 },
		"mobile-none",
	);
	const closed = await measureAme(page);
	assert(!closed.open, "390×844: AME starts closed");
	assert(closed.capsuleHeight >= 52, "390×844: capsule ≥56px class");
	const initialPrimary = closed.rsPrimary;

	await openAme(page);
	const opened = await measureAme(page);
	assert(opened.open, "390×844: AME opens");
	assert(opened.lifecycle === "live", "390×844: lifecycle=live");
	assert(opened.bottomSheet, "390×844: Bottom Sheet presentation");
	assert(!opened.fullscreen, "390×844: not Full-screen");
	assert(opened.scrollLock, "390×844: scroll lock on open");
	assert(opened.inert, "390×844: page content inert");
	assert(opened.focusInShell, "390×844: focus moves into AME");
	assert(!opened.focusIsEditable, "390×844: AME open does not focus a native input");
	assert(opened.ameCount === 1, "390×844: single AME DOM");
	assert(opened.pickerRows === 3, "390×844: three picker rows");
	assert(opened.pickerDisplay === "flex", "390×844: stacked picker");
	assert(opened.pickerRowFlex === "row", "390×844: field is Label | Value row");
	assert(opened.fieldLabelLeft, "390×844: Label left / Value right");
	assert(!opened.cancelVisible, "390×844: Cancel chrome hidden");
	assert(opened.nativeInputs === 0, "390×844: no text inputs in AME form");
	assert(opened.calendarToggle === 0, "390×844: no calendar toggle");
	assert(opened.errorSlot === 0, "390×844: no error-icon slot");
	assert(!opened.sdcOpen, "390×844: DesktopCalendar stays closed");

	await visible(page, "[data-ldcv2-ame-g-year]").selectOption("1999");
	await visible(page, "[data-ldcv2-ame-g-month]").selectOption("11");
	await visible(page, "[data-ldcv2-ame-g-day]").selectOption("22");
	const liveEdited = await measureAme(page);
	assert(liveEdited.open, "Live edit keeps AME open");
	assert(
		liveEdited.rsPrimary !== initialPrimary,
		"Picker change updates Result immediately",
	);
	const livePrimary = liveEdited.rsPrimary;

	await page.locator("[data-ldcv2-ame-g-year]").focus();
	const focused = await measureAme(page);
	assert(focused.rowOutline, "390×844: focus ring is on the field shell");
	assert(!focused.selectOutline, "390×844: native select has no own focus ring");

	await page.keyboard.press("Escape");
	await waitAmeClosed(page);
	await page.waitForFunction(() => {
		const cap = document.querySelector("[data-ldcv2-sheet-trigger]");
		return Boolean(cap) && document.activeElement === cap;
	});
	const afterEsc = await measureAme(page);
	assert(!afterEsc.open, "Escape closes AME");
	assert(afterEsc.rsPrimary === livePrimary, "Escape does not rollback live Result");
	assert(!afterEsc.scrollLock, "Escape releases scroll lock");
	assert(afterEsc.focusOnCapsule, "Escape restores focus to capsule");

	await openAme(page);
	await visible(page, "[data-ldcv2-ame-g-year]").selectOption("2001");
	await visible(page, "[data-ldcv2-ame-g-month]").selectOption("5");
	await visible(page, "[data-ldcv2-ame-g-day]").selectOption("6");
	const beforeDone = await measureAme(page);
	await visible(page, "[data-ame-submit]").click();
	await waitAmeClosed(page);
	const afterDone = await measureAme(page);
	assert(!afterDone.open, "Done closes AME");
	assert(afterDone.rsPrimary === beforeDone.rsPrimary, "Done does not extra-commit");
	assert(!afterDone.scrollLock, "Done releases scroll lock");
	await context.close();
}

/* 430×615 Bottom Sheet content reachable */
{
	const { context, page } = await openPage(
		browser,
		zhPath,
		{ width: 430, height: 615 },
		"mobile-none",
	);
	await openAme(page);
	const m = await measureAme(page);
	assert(m.bottomSheet, "430×615: Bottom Sheet");
	assert(m.pickerRows === 3, "430×615: three picker rows");
	assert(m.pickerRowFlex === "row", "430×615: field is Label | Value row");
	assert(m.fieldLabelLeft, "430×615: Label left / Value right");
	assert(!m.cancelVisible, "430×615: Cancel chrome hidden");
	const yearBox = await visible(page, "[data-ldcv2-ame-g-year]").boundingBox();
	const doneBox = await visible(page, "[data-ame-submit]").boundingBox();
	assert(
		Boolean(yearBox) && yearBox.y >= 0 && yearBox.y + yearBox.height <= 615 + 1,
		"430×615: year picker reachable in viewport",
	);
	assert(
		Boolean(doneBox) && doneBox.y >= 0 && doneBox.y + doneBox.height <= 615 + 1,
		"430×615: Done reachable in viewport",
	);
	await context.close();
}

/* Landscape Full-screen */
for (const { width, height, label } of [
	{ width: 667, height: 375, label: "667×375" },
	{ width: 844, height: 390, label: "844×390" },
	{ width: 932, height: 430, label: "932×430" },
]) {
	const { context, page } = await openPage(
		browser,
		enPath,
		{ width, height },
		"mobile-none",
	);
	await openAme(page);
	const m = await measureAme(page);
	note(`${label}: fs=${m.fullscreen} open=${m.open} topbar lifecycle=${m.lifecycle}`);
	assert(m.open, `${label}: AME open`);
	assert(m.fullscreen, `${label}: Full-screen AME`);
	assert(m.lifecycle === "live", `${label}: live lifecycle`);
	assert(m.scrollLock, `${label}: scroll lock`);
	assert(m.pickerRows === 3, `${label}: three picker fields`);
	assert(m.pickerDisplay === "grid", `${label}: landscape picker is three columns`);
	assert(m.pickerRowFlex === "row", `${label}: field internal layout stays row`);
	assert(m.fieldLabelLeft, `${label}: Label left / Value right inside column`);
	assert(!m.cancelVisible, `${label}: Cancel hidden`);
	assert(m.nativeInputs === 0, `${label}: no text inputs`);
	const yearBox = await visible(page, "[data-ldcv2-ame-g-year]").boundingBox();
	const monthBox = await visible(page, "[data-ldcv2-ame-g-month]").boundingBox();
	const dayBox = await visible(page, "[data-ldcv2-ame-g-day]").boundingBox();
	assert(
		Boolean(yearBox && monthBox && dayBox) &&
			yearBox.x < monthBox.x &&
			monthBox.x < dayBox.x,
		`${label}: Year／Month／Day sit in three columns`,
	);
	await visible(page, "[data-ldcv2-ame-g-year]").selectOption("1999");
	const liveLand = await measureAme(page);
	assert(liveLand.rsPrimary !== m.rsPrimary, `${label}: picker live-updates Result`);
	await visible(page, "[data-ame-submit]").click();
	await waitAmeClosed(page);
	await context.close();
}

/* Constrained Viewport（shared AME presentation B） */
{
	const { context, page } = await openPage(
		browser,
		enPath,
		{ width: 600, height: 400 },
		"desktop-hover",
	);
	await openAme(page);
	const m = await measureAme(page);
	note(`600×400 hover:hover: fs=${m.fullscreen} sheet=${m.bottomSheet}`);
	assert(m.open, "600×400: AME open");
	assert(m.fullscreen, "600×400 Constrained Viewport: Full-screen AME");
	await context.close();
}

/* Direction switch + leap + day clamp + Reset */
{
	const { context, page } = await openPage(
		browser,
		zhPath,
		{ width: 390, height: 844 },
		"mobile-none",
	);
	await openAme(page);
	await visible(page, "[data-ldcv2-ame-g-year]").selectOption("2024");
	await visible(page, "[data-ldcv2-ame-g-month]").selectOption("2");
	let leapYear = await measureAme(page);
	assert(leapYear.dayValues.includes("29"), "Gregorian leap year Feb includes Day 29");
	await visible(page, "[data-ldcv2-ame-g-year]").selectOption("2023");
	const nonLeap = await measureAme(page);
	assert(!nonLeap.dayValues.includes("29"), "Non-leap Feb has no Day 29");
	assert(!nonLeap.dayValues.includes("30"), "Feb has no Day 30");

	await visible(page, "[data-ldcv2-ame-g-year]").selectOption("2023");
	await visible(page, "[data-ldcv2-ame-g-month]").selectOption("1");
	await visible(page, "[data-ldcv2-ame-g-day]").selectOption("31");
	await visible(page, "[data-ldcv2-ame-g-month]").selectOption("2");
	const clamped = await page.locator("[data-ldcv2-ame-g-day]").inputValue();
	assert(clamped === "28", "Jan 31 clamps to Feb 28");

	await visible(page, '[data-ldcv2-ame-switch="lunar"]').click();
	const switched = await measureAme(page);
	assert(switched.mode === "lunar", "Switch to lunar panel");
	assert(switched.ameGregorianHidden === true, "Gregorian panel hidden");
	assert(switched.ameLunarHidden === false, "Lunar panel visible");

	await visible(page, "[data-ldcv2-ame-l-year]").selectOption("1963");
	const months = await measureAme(page);
	assert(months.monthLabels.includes("四月"), "1963 month options include 四月");
	assert(months.monthLabels.includes("閏四月"), "1963 month options include 閏四月");
	await visible(page, "[data-ldcv2-ame-l-month]").selectOption("4:1");
	await visible(page, "[data-ldcv2-ame-l-day]").selectOption("15");
	const leapLive = await measureAme(page);
	assert(leapLive.rsPrimary.includes("1963"), "Leap-month picker live-updates Gregorian year");
	assert(leapLive.open, "Leap-month live update keeps AME open");

	await visible(page, "[data-ame-submit]").click();
	await waitAmeClosed(page);
	const afterLeap = await measureAme(page);
	assert(afterLeap.rsPrimary.includes("1963"), "Leap-month Result remains after Done");

	await openAme(page);
	const shortMonth = await page.evaluate(() => {
		const month = document.querySelector("[data-ldcv2-ame-l-month]");
		if (!(month instanceof HTMLSelectElement)) return null;
		for (const option of month.options) {
			month.value = option.value;
			month.dispatchEvent(new Event("change", { bubbles: true }));
			const day = document.querySelector("[data-ldcv2-ame-l-day]");
			if (!(day instanceof HTMLSelectElement)) return null;
			const values = [...day.options].map((item) => item.value);
			if (!values.includes("30")) {
				return { month: option.textContent, days: values.length };
			}
		}
		return null;
	});
	assert(
		Boolean(shortMonth) && shortMonth.days === 29,
		"29-day lunar month does not offer Day 30",
	);

	await visible(page, "[data-ame-reset]").click();
	const resetYear = await visible(page, "[data-ldcv2-ame-g-year]").inputValue();
	const resetUi = await measureAme(page);
	assert(resetYear.length === 4, "Reset restores Gregorian year picker");
	assert(resetUi.open, "Reset keeps AME open");
	assert(resetUi.mode === "gregorian", "Reset returns to Gregorian mode");
	assert(resetUi.rsPrimary !== afterLeap.rsPrimary, "Reset live-updates Result");
	await context.close();
}

/* DesktopCalendar must not open from AME */
{
	const { context, page } = await openPage(
		browser,
		enPath,
		{ width: 390, height: 844 },
		"mobile-none",
	);
	await openAme(page);
	const cal = await measureAme(page);
	assert(cal.calendarToggle === 0, "AME has no calendar toggle");
	assert(!cal.sdcOpen, "DesktopCalendar does not open with AME");
	await context.close();
}

/* ZH Portrait 國曆：deliberate 兩行 + 大字 */
{
	const { context, page } = await openPage(
		browser,
		zhPath,
		{ width: 390, height: 844 },
		"mobile-none",
	);
	await openAme(page);
	await visible(page, "[data-ldcv2-ame-g-year]").selectOption("2030");
	await visible(page, "[data-ldcv2-ame-g-month]").selectOption("9");
	await visible(page, "[data-ldcv2-ame-g-day]").selectOption("21");
	await visible(page, '[data-ldcv2-ame-switch="lunar"]').click();
	const wrap = await measureAme(page);
	const lines = wrap.rsPrimary.split("\n");
	assert(wrap.rsPrimary.includes("2030"), "ZH Gregorian result includes 2030");
	assert(wrap.primaryWhiteSpace === "pre-line", "ZH Portrait Gregorian result uses pre-line");
	assert(lines.length === 2, "ZH Portrait Gregorian is deliberate two-line");
	assert(lines[0]?.endsWith("年"), "ZH Portrait Gregorian line 1 ends with 年");
	assert(wrap.primaryLines >= 2, "ZH Portrait Gregorian renders two visual lines");
	assert(wrap.primaryFontSize >= 60, "ZH Portrait Gregorian uses 4.125rem class size");
	await context.close();
}

/* Resize / orientation: no stale overlay */
{
	const { context, page } = await openPage(
		browser,
		enPath,
		{ width: 390, height: 844 },
		"mobile-none",
	);
	await openAme(page);
	await page.setViewportSize({ width: 667, height: 375 });
	await applyCssHoverMedia(page, "mobile-none");
	await page.waitForTimeout(80);
	const landscape = await measureAme(page);
	assert(landscape.open, "Resize portrait→landscape keeps AME open");
	assert(landscape.fullscreen, "Resize portrait→landscape becomes Full-screen");
	assert(landscape.ameCount === 1, "Resize does not spawn a second AME");
	assert(landscape.scrollLock, "Resize keeps scroll lock");

	await page.setViewportSize({ width: 390, height: 844 });
	await applyCssHoverMedia(page, "mobile-none");
	await page.waitForTimeout(80);
	const back = await measureAme(page);
	assert(back.open, "Resize landscape→portrait keeps AME open");
	assert(back.bottomSheet, "Resize landscape→portrait returns Bottom Sheet");
	assert(!back.fullscreen, "Resize back is not Full-screen");

	await page.setViewportSize({ width: 823, height: 800 });
	await page.evaluate(() => {
		window.__timivaHoverMode = "desktop-hover";
	});
	await applyCssHoverMedia(page, "desktop-hover");
	await page.evaluate(() => window.dispatchEvent(new Event("resize")));
	await page.waitForTimeout(120);
	const desktop = await measureAme(page);
	assert(!desktop.open, "Resize into Desktop closes AME");
	assert(!desktop.scrollLock, "Desktop close releases scroll lock");
	await context.close();
}

const compositionEvidence = [];

async function measureResult(page) {
	return page.evaluate(() => {
		const rs = document.querySelector(
			"[data-lunar-date-converter-v2] [data-result-summary]",
		);
		const primary = rs?.querySelector('[data-rs-value="primary"]');
		const weekday = rs?.querySelector(".rs-weekday");
		let primaryLines = 0;
		if (primary) {
			const range = document.createRange();
			range.selectNodeContents(primary);
			primaryLines = range.getClientRects().length;
		}
		const primaryBox = primary?.getBoundingClientRect();
		const weekdayBox = weekday?.getBoundingClientRect();
		const host = document.querySelector(
			"[data-lunar-date-converter-v2] .ldcv2-result-host",
		);
		const root = document.querySelector("[data-lunar-date-converter-v2]");
		const viewportWidth = window.innerWidth;
		return {
			rsLayout: rs?.getAttribute("data-rs-layout") ?? null,
			rsComposition: root?.getAttribute("data-ldcv2-rs-composition") ?? null,
			inputMode: root?.getAttribute("data-ldcv2-input-mode"),
			rsPrimary: primary?.textContent?.trim() ?? "",
			primaryLines,
			primaryWhiteSpace: primary ? getComputedStyle(primary).whiteSpace : null,
			primaryFontSize: primary ? parseFloat(getComputedStyle(primary).fontSize) : 0,
			weekdayFontSize: weekday ? parseFloat(getComputedStyle(weekday).fontSize) : 0,
			weekdayBelowPrimary:
				Boolean(primaryBox && weekdayBox) && weekdayBox.top >= primaryBox.bottom - 1,
			rsDisplay: rs ? getComputedStyle(rs).display : null,
			rsFlexDirection: rs ? getComputedStyle(rs).flexDirection : null,
			primaryWidth: primaryBox?.width ?? 0,
			primaryHeight: primaryBox?.height ?? 0,
			primaryLeft: primaryBox?.left ?? 0,
			primaryRight: primaryBox?.right ?? 0,
			hostWidth: host?.getBoundingClientRect().width ?? 0,
			primaryScrollWidth: primary?.scrollWidth ?? 0,
			primaryClientWidth: primary?.clientWidth ?? 0,
			hasBadStemBreak:
				Boolean(primary) &&
				!String(primary?.textContent ?? "").includes("\n") &&
				/\w-\s*$/.test(primary?.textContent ?? "") &&
				primaryLines > 1,
			marginLeft: primaryBox?.left ?? 0,
			marginRight: viewportWidth - (primaryBox?.right ?? viewportWidth),
			centerOffset:
				primaryBox && viewportWidth
					? Math.abs(
							primaryBox.left + primaryBox.width / 2 - viewportWidth / 2,
						)
					: 0,
			viewportWidth,
			weekdayTop: weekdayBox?.top ?? 0,
			primaryBottom: primaryBox?.bottom ?? 0,
		};
	});
}

function recordComposition(label, sample) {
	compositionEvidence.push({ label, ...sample });
	note(
		`${label}: primary=${sample.primaryFontSize}px weekday=${sample.weekdayFontSize}px lines=${sample.primaryLines} ml=${Math.round(sample.marginLeft)} mr=${Math.round(sample.marginRight)} centerΔ=${Math.round(sample.centerOffset)}`,
	);
}

const portraitPolishEvidence = {};
const landscapeLockEvidence = {};
const desktopPolishEvidence = {};

async function waitResultReady(page) {
	await page.waitForFunction(() => {
		const primary = document.querySelector(
			'[data-lunar-date-converter-v2] .rs-value[data-rs-value="primary"]',
		);
		return primary && primary.textContent && primary.textContent !== "…";
	});
}

/* B2D Portrait Result Polish — four locale/result cases */
for (const { localePath, locale, width, height, label } of [
	{ localePath: zhPath, locale: "zh", width: 390, height: 844, label: "390×844" },
	{ localePath: zhPath, locale: "zh", width: 430, height: 615, label: "430×615" },
	{ localePath: enPath, locale: "en", width: 390, height: 844, label: "390×844" },
	{ localePath: enPath, locale: "en", width: 430, height: 615, label: "430×615" },
]) {
	const { context, page } = await openPage(
		browser,
		localePath,
		{ width, height },
		"mobile-none",
	);
	await waitResultReady(page);
	const zhLunar = await measureResult(page);
	recordComposition(`${locale} ${label} portrait zh-lunar`, zhLunar);
	if (locale === "zh") {
		assert(zhLunar.primaryLines >= 2, `${label} ZH lunar two lines`);
		assert(zhLunar.primaryFontSize >= 52 && zhLunar.primaryFontSize <= 58, `${label} ZH lunar slightly reduced`);
		assert(zhLunar.primaryWidth < zhLunar.viewportWidth - 48, `${label} ZH lunar has side breathing room`);
	}

	await openAme(page);
	await visible(page, '[data-ldcv2-ame-switch="lunar"]').click();
	await page.waitForTimeout(80);
	const zhGreg = await measureResult(page);
	recordComposition(`${locale} ${label} portrait zh-gregorian`, zhGreg);
	if (locale === "zh") {
		assert(zhGreg.primaryLines >= 2, `${label} ZH greg two lines`);
		assert(zhGreg.primaryFontSize >= 64, `${label} ZH greg unchanged 4.125rem class`);
		assert(zhGreg.primaryFontSize > zhLunar.primaryFontSize + 4, `${label} ZH greg larger than lunar`);
		portraitPolishEvidence[`zh-${label}`] = { lunar: zhLunar, gregorian: zhGreg };
	}

	await visible(page, '[data-ldcv2-ame-switch="gregorian"]').click();
	await page.waitForTimeout(80);
	const enLunar = await measureResult(page);
	recordComposition(`${locale} ${label} portrait en-lunar`, enLunar);
	if (locale === "en") {
		assert(enLunar.primaryLines >= 2, `${label} EN lunar portrait two lines`);
		assert(enLunar.primaryWhiteSpace === "pre-line", `${label} EN lunar pre-line`);
		assert(enLunar.rsPrimary.includes("\n"), `${label} EN lunar deliberate \\n`);
		assert(!enLunar.rsPrimary.includes("·"), `${label} EN lunar portrait no dot`);
		assert(enLunar.primaryFontSize >= 48, `${label} EN lunar portrait primary size`);
	}

	await visible(page, '[data-ldcv2-ame-switch="lunar"]').click();
	await page.waitForTimeout(80);
	const enGreg = await measureResult(page);
	recordComposition(`${locale} ${label} portrait en-gregorian`, enGreg);
	if (locale === "en") {
		assert(enGreg.primaryLines === 1, `${label} EN greg one line`);
		assert(enGreg.primaryWhiteSpace === "nowrap", `${label} EN greg nowrap`);
		assert(enGreg.marginLeft >= 20, `${label} EN greg left safe margin`);
		assert(enGreg.marginRight >= 20, `${label} EN greg right safe margin`);
		assert(enGreg.centerOffset <= 12, `${label} EN greg visually centered`);
		assert(enGreg.primaryFontSize >= 48 && enGreg.primaryFontSize <= 66, `${label} EN greg balanced size`);
		assert(enGreg.primaryFontSize < 68, `${label} EN greg not oversized to edges`);
		portraitPolishEvidence[`en-${label}`] = { lunar: enLunar, gregorian: enGreg };
	}
	await context.close();
}

/* Landscape lock — geometry/typography unchanged by Portrait polish */
for (const { localePath, locale, width, height, label } of [
	{ localePath: zhPath, locale: "zh", width: 667, height: 375, label: "667×375" },
	{ localePath: zhPath, locale: "zh", width: 844, height: 390, label: "844×390" },
	{ localePath: zhPath, locale: "zh", width: 932, height: 430, label: "932×430" },
	{ localePath: enPath, locale: "en", width: 667, height: 375, label: "667×375" },
	{ localePath: enPath, locale: "en", width: 844, height: 390, label: "844×390" },
	{ localePath: enPath, locale: "en", width: 932, height: 430, label: "932×430" },
]) {
	const { context, page } = await openPage(
		browser,
		localePath,
		{ width, height },
		"mobile-none",
	);
	await waitResultReady(page);
	const lunar = await measureResult(page);
	recordComposition(`${locale} ${label} landscape lunar-result`, lunar);
	landscapeLockEvidence[`${locale}-${label}-lunar`] = lunar;
	assert(lunar.rsLayout === "landscape", `${locale} ${label}: rs-layout landscape`);
	assert(lunar.primaryLines === 1, `${locale} ${label}: lunar primary one line`);
	assert(lunar.primaryWhiteSpace === "nowrap", `${locale} ${label}: lunar primary nowrap`);
	assert(lunar.weekdayBelowPrimary, `${locale} ${label}: lunar weekday below primary`);
	assert(
		lunar.primaryFontSize > lunar.weekdayFontSize * 1.5,
		`${locale} ${label}: primary/weekday hierarchy`,
	);
	assert(lunar.weekdayFontSize <= 18.5, `${locale} ${label}: landscape weekday uses shared clamp`);
	assert(lunar.rsDisplay === "flex" && lunar.rsFlexDirection === "column", `${locale} ${label}: stacked landscape layout`);
	if (locale === "en") {
		assert(lunar.rsPrimary.includes("·"), `${locale} ${label}: EN landscape keeps dot single line`);
	}

	await openAme(page);
	await visible(page, '[data-ldcv2-ame-switch="lunar"]').click();
	await page.waitForTimeout(80);
	const greg = await measureResult(page);
	recordComposition(`${locale} ${label} landscape gregorian-result`, greg);
	landscapeLockEvidence[`${locale}-${label}-greg`] = greg;
	assert(greg.primaryLines === 1, `${locale} ${label}: greg primary one line`);
	assert(greg.primaryWhiteSpace === "nowrap", `${locale} ${label}: greg primary nowrap`);
	assert(greg.weekdayBelowPrimary, `${locale} ${label}: greg weekday below primary`);
	await context.close();
}

for (const key of Object.keys(landscapeLockEvidence)) {
	const sample = landscapeLockEvidence[key];
	assert(sample.rsLayout === "landscape", `Landscape lock ${key}: still landscape`);
	assert(sample.weekdayBelowPrimary, `Landscape lock ${key}: weekday below primary`);
}

/* EN Desktop / RWD Result polish — wide vs constrained composition */
for (const { width, height, label, expectComposition } of [
	{ width: 1076, height: 900, label: "1076×900", expectComposition: "wide" },
	{ width: 831, height: 900, label: "831×900", expectComposition: "constrained" },
	{ width: 950, height: 900, label: "950×900", expectComposition: null },
]) {
	const { context, page } = await openPage(
		browser,
		enPath,
		{ width, height },
		"desktop-hover",
	);
	await waitResultReady(page);
	const lunarWideCase = await measureResult(page);
	recordComposition(`en ${label} desktop en-lunar`, lunarWideCase);
	desktopPolishEvidence[`en-${label}-lunar`] = lunarWideCase;
	assert(lunarWideCase.rsLayout === "desktop", `${label} EN lunar: rs-layout desktop`);
	assert(lunarWideCase.inputMode === "gregorian", `${label} EN lunar: gregorian input mode`);
	if (expectComposition === "wide") {
		assert(lunarWideCase.rsComposition === "wide", `${label} EN lunar: wide composition`);
		assert(lunarWideCase.primaryLines === 1, `${label} EN lunar: single line`);
		assert(lunarWideCase.rsPrimary.includes("·"), `${label} EN lunar: canonical dot line`);
		assert(lunarWideCase.primaryWhiteSpace === "nowrap", `${label} EN lunar: nowrap`);
	}
	if (expectComposition === "constrained") {
		assert(
			lunarWideCase.rsComposition === "constrained",
			`${label} EN lunar: constrained composition`,
		);
		assert(lunarWideCase.rsPrimary.split("\n").length === 2, `${label} EN lunar: deliberate two logical lines`);
		assert(
			lunarWideCase.primaryHeight <= lunarWideCase.primaryFontSize * 1.15 * 2.35,
			`${label} EN lunar: rendered as two-line block`,
		);
		assert(lunarWideCase.rsPrimary.includes("\n"), `${label} EN lunar: deliberate \\n`);
		assert(!lunarWideCase.rsPrimary.includes("·"), `${label} EN lunar: no dot`);
		assert(lunarWideCase.primaryWhiteSpace === "pre-line", `${label} EN lunar: pre-line`);
		assert(!lunarWideCase.hasBadStemBreak, `${label} EN lunar: no Bing-/wu natural break`);
		assert(lunarWideCase.primaryFontSize >= 48, `${label} EN lunar: still substantial size`);
	}
	assert(!lunarWideCase.hasBadStemBreak, `${label} EN lunar: never bad stem break`);

	await page.locator('[data-ldcv2-switch="lunar"]').click();
	await page.waitForTimeout(120);
	const greg = await measureResult(page);
	recordComposition(`en ${label} desktop en-gregorian`, greg);
	desktopPolishEvidence[`en-${label}-greg`] = greg;
	assert(greg.inputMode === "lunar", `${label} EN greg: lunar input mode`);
	assert(greg.primaryLines === 1, `${label} EN greg: single line`);
	assert(greg.primaryWhiteSpace === "nowrap", `${label} EN greg: nowrap`);
	assert(greg.centerOffset <= 24, `${label} EN greg: centered`);
	assert(greg.primaryFontSize >= 64, `${label} EN greg: larger desktop primary`);
	if (label === "1076×900") {
		assert(greg.primaryFontSize >= 74, `${label} EN greg: spacious bump vs prior ~70px`);
	}

	const { context: zhContext, page: zhPage } = await openPage(
		browser,
		zhPath,
		{ width, height },
		"desktop-hover",
	);
	await waitResultReady(zhPage);
	const zhDesktop = await measureResult(zhPage);
	recordComposition(`zh ${label} desktop lunar-result`, zhDesktop);
	desktopPolishEvidence[`zh-${label}-lunar`] = zhDesktop;
	assert(zhDesktop.primaryLines >= 2, `${label} ZH desktop: still two-line semantic`);
	assert(zhDesktop.primaryFontSize >= 52, `${label} ZH desktop: typography unchanged class`);
	await zhContext.close();
	await context.close();
}

{
	const { context, page } = await openPage(
		browser,
		enPath,
		{ width: 831, height: 900 },
		"desktop-hover",
	);
	await waitResultReady(page);
	const constrained = await measureResult(page);
	assert(constrained.rsComposition === "constrained", "831 resize start: constrained");
	await page.setViewportSize({ width: 1076, height: 900 });
	await page.waitForTimeout(200);
	const wide = await measureResult(page);
	recordComposition("en 831→1076 resize lunar", wide);
	assert(wide.rsComposition === "wide", "831→1076 resize: restores wide composition");
	assert(wide.primaryLines === 1, "831→1076 resize: single line lunar");
	assert(wide.rsPrimary.includes("·"), "831→1076 resize: dot line restored");
	await page.setViewportSize({ width: 831, height: 900 });
	await page.waitForTimeout(200);
	const back = await measureResult(page);
	assert(back.rsComposition === "constrained", "1076→831 resize: constrained again");
	assert(back.rsPrimary.split("\n").length === 2, "1076→831 resize: deliberate two logical lines again");
	await context.close();
}

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
	await waitResultReady(page);
	const desktop = await measureResult(page);
	recordComposition(`${locale} desktop lunar-result`, desktop);
	assert(desktop.rsLayout === "desktop", `${locale} desktop: rs-layout desktop`);
	assert(
		locale === "zh" ? desktop.primaryLines >= 2 : desktop.primaryLines === 1,
		`${locale} desktop: primary line count`,
	);
	assert(desktop.weekdayBelowPrimary, `${locale} desktop: weekday below primary`);
	await context.close();
}

await browser.close();
writeFileSync(
	evidencePath,
	JSON.stringify(
		{
			evidence,
			compositionEvidence,
			portraitPolishEvidence,
			landscapeLockEvidence,
			desktopPolishEvidence,
		},
		null,
		2,
	),
);
console.log(`\nevidence → ${evidencePath}`);
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log("qa-lunar-b2d-ame-browser PASS");
