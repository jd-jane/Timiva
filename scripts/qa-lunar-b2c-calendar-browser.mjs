/**
 * Lunar B2C — Desktop Lunar Calendar Browser QA.
 * Run after build: npx astro preview --port 4322 &
 *   node scripts/qa-lunar-b2c-calendar-browser.mjs
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.LDC_QA_BASE ?? "http://localhost:4322";
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

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

function assertEqCells(actual, expected, message) {
	assert(actual === expected, `${message} (${actual})`);
}

async function loadPlaywright() {
	try {
		return await import("playwright");
	} catch {
		throw new Error(
			"playwright not installed — run: npm install -D playwright && npx playwright install chromium",
		);
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

async function setupDesktopPage(browser, path, viewport = { width: 1280, height: 900 }) {
	const context = await browser.newContext({ viewport });
	await context.addInitScript(() => {
		const original = window.matchMedia.bind(window);
		window.matchMedia = (query) => {
			const result = original(query);
			if (
				query.includes("hover: hover") ||
				query.includes("min-width: 900px") ||
				query.includes("min-height: 700px")
			) {
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
	const page = await context.newPage();
	await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
	await page.waitForSelector("[data-ldcv2-date-input]");
	await page.waitForFunction(() => {
		const primary = document.querySelector(
			'[data-lunar-date-converter-v2] .rs-value[data-rs-value="primary"]',
		);
		return primary && primary.textContent && primary.textContent !== "…";
	});
	return { context, page };
}

async function switchToLunar(page) {
	await page.locator('[data-ldcv2-switch="lunar"]').click();
	await page.waitForFunction(
		() =>
			document
				.querySelector("[data-lunar-date-converter-v2]")
				?.getAttribute("data-ldcv2-input-mode") === "lunar",
	);
}

async function switchToGregorian(page) {
	await page.locator('[data-ldcv2-switch="gregorian"]').click();
	await page.waitForFunction(
		() =>
			document
				.querySelector("[data-lunar-date-converter-v2]")
				?.getAttribute("data-ldcv2-input-mode") === "gregorian",
	);
}

async function waitLunarCalendarOpen(page, open) {
	await page.waitForFunction((shouldOpen) => {
		const lc = document.querySelector("[data-lunar-calendar]");
		return lc?.getAttribute("data-ldc-lc-open") === (shouldOpen ? "true" : "false");
	}, open);
}

async function openLunarCalendar(page) {
	await page.locator("[data-ldcv2-calendar-toggle]").click();
	await waitLunarCalendarOpen(page, true);
}

async function openGregorianCalendar(page) {
	await page.locator("[data-ldcv2-calendar-toggle]").click();
	await page.waitForSelector('[data-desktop-calendar][data-sdc-open="true"]');
}

async function readState(page) {
	return page.evaluate(() => {
		const root = document.querySelector("[data-lunar-date-converter-v2]");
		const input = document.querySelector("[data-ldcv2-date-input]");
		const primary = document.querySelector(
			'[data-lunar-date-converter-v2] .rs-value[data-rs-value="primary"]',
		);
		const lc = document.querySelector("[data-lunar-calendar]");
		const sdc = document.querySelector('[data-desktop-calendar][data-sdc-variant="popover-compact"]');
		return {
			input: input?.value ?? "",
			primary: primary?.textContent?.trim() ?? "",
			inputMode: root?.getAttribute("data-ldcv2-input-mode") ?? "",
			lcOpen: lc?.getAttribute("data-ldc-lc-open") === "true",
			sdcOpen: sdc?.getAttribute("data-sdc-open") === "true",
			lcBoundary: lc?.getAttribute("data-ldc-lc-boundary") ?? "",
			lcYear: lc?.querySelector("[data-ldc-lc-year-label]")?.textContent?.trim() ?? "",
			lcMonth: lc?.querySelector("[data-ldc-lc-month-label]")?.textContent?.trim() ?? "",
			monthOptions: [...(lc?.querySelectorAll("[data-ldc-lc-month-option]") ?? [])].map(
				(el) => ({
					text: el.textContent?.trim() ?? "",
					disabled: el.disabled,
					selected: el.classList.contains("is-selected"),
				}),
			),
			dayCells: [...(lc?.querySelectorAll(".ldc-lc-day") ?? [])].map((el) => ({
				text: el.textContent?.trim() ?? "",
				disabled: el.disabled,
				selected: el.classList.contains("is-selected"),
				sentinel: el.classList.contains("is-sentinel-locked"),
				today: el.classList.contains("is-today"),
			})),
			lcWidth: lc?.getBoundingClientRect().width ?? 0,
			dayFontSize: lc?.querySelector(".ldc-lc-day")
				? getComputedStyle(lc.querySelector(".ldc-lc-day")).fontSize
				: "",
		};
	});
}

async function setGregorianViaCalendar(page, dayText) {
	await openGregorianCalendar(page);
	await page.locator(`[data-sdc-day="${dayText}"]`).click();
	await page.waitForSelector('[data-desktop-calendar][data-sdc-open="false"]');
}

async function pasteLunar(page, text) {
	const input = page.locator("[data-ldcv2-date-input]");
	await input.click();
	await input.fill(text);
	await input.press("Enter");
	await page.waitForFunction((expected) => {
		const value = document.querySelector("[data-ldcv2-date-input]")?.value ?? "";
		return value.includes(String(expected));
	}, text.slice(0, 4));
}

async function pasteGregorian(page, text) {
	await page.locator("[data-ldcv2-date-input]").focus();
	await page.evaluate((t) => {
		const input = document.querySelector("[data-ldcv2-date-input]");
		if (!input) return;
		const clip = new DataTransfer();
		clip.setData("text/plain", t);
		input.dispatchEvent(
			new ClipboardEvent("paste", {
				bubbles: true,
				cancelable: true,
				clipboardData: clip,
			}),
		);
	}, text);
	await page.locator("[data-ldcv2-date-input]").press("Tab");
}

console.log("qa-lunar-b2c-calendar-browser\n");
console.log(`base: ${BASE}\n`);

mkdirSync(join(rootDir, "local-docs", "validation"), { recursive: true });

await waitForServer(`${BASE}/en/lunar-date-converter/`);

const pw = await loadPlaywright();
const browser = await pw.chromium.launch({ headless: true });

/* —— EN: open lunar calendar —— */
{
	const { context, page } = await setupDesktopPage(browser, "/en/lunar-date-converter/");
	await switchToLunar(page);
	await openLunarCalendar(page);
	await page.locator("[data-ldc-lc-month-trigger]").click();
	const state = await readState(page);
	assert(state.lcOpen, "EN lunar calendar opens");
	assert(state.monthOptions.length === 12, "EN 12-month year month panel count");
	note(`EN lc width=${state.lcWidth}px dayFont=${state.dayFontSize}`);
	await context.close();
}

/* —— ZH: open lunar calendar —— */
{
	const { context, page } = await setupDesktopPage(browser, "/zh/lunar-date-converter/");
	await switchToLunar(page);
	await openLunarCalendar(page);
	const state = await readState(page);
	assert(state.lcOpen, "ZH lunar calendar opens");
	assert(state.dayCells.some((c) => c.text === "初一" || c.text === "十五"), "ZH day labels present");
	note(`ZH lc width=${state.lcWidth}px dayFont=${state.dayFontSize}`);
	await context.close();
}

/* —— 2020 leap year 13 months —— */
{
	const { context, page } = await setupDesktopPage(browser, "/en/lunar-date-converter/");
	await switchToLunar(page);
	await pasteGregorian(page, "2020/5/23");
	await openLunarCalendar(page);
	await page.locator("[data-ldc-lc-month-trigger]").click();
	const state = await readState(page);
	assert(state.monthOptions.length === 13, "2020 has 13 month options");
	assert(
		state.monthOptions.some((o) => o.text === "Leap 4"),
		"Leap 4 month option present",
	);
	const leapIdx = state.monthOptions.findIndex((o) => o.text === "Leap 4");
	const regIdx = state.monthOptions.findIndex((o) => o.text === "4");
	assert(regIdx >= 0 && leapIdx === regIdx + 1, "Leap 4 follows regular 4");
	await context.close();
}

/* —— 29-day leap month —— */
{
	const { context, page } = await setupDesktopPage(browser, "/en/lunar-date-converter/");
	await switchToLunar(page);
	await pasteGregorian(page, "2020/5/23");
	await openLunarCalendar(page);
	await page.locator("[data-ldc-lc-month-trigger]").click();
	await page.locator('[data-ldc-lc-month-option="4"]').click();
	const state = await readState(page);
	assertEqCells(state.dayCells.length, 29, "2020 leap 4 has 29 day cells");
	await context.close();
}

/* —— 30-day regular month —— */
{
	const { context, page } = await setupDesktopPage(browser, "/en/lunar-date-converter/");
	await switchToLunar(page);
	await pasteGregorian(page, "2020/5/23");
	await openLunarCalendar(page);
	await page.locator("[data-ldc-lc-month-trigger]").click();
	await page.locator('[data-ldc-lc-month-option="3"]').click();
	const state = await readState(page);
	assertEqCells(state.dayCells.length, 30, "2020 regular 4 has 30 day cells");
	await context.close();
}

/* —— select day syncs input + result —— */
{
	const { context, page } = await setupDesktopPage(browser, "/en/lunar-date-converter/");
	await switchToLunar(page);
	/* Anchor away from “today” so day-15 select always changes state（e.g. 2026-08-27 = L7/15）. */
	await pasteGregorian(page, "2020/5/23");
	await openLunarCalendar(page);
	const before = await readState(page);
	await page.locator('[data-ldc-lc-day="15"]').first().click();
	await waitLunarCalendarOpen(page, false);
	const after = await readState(page);
	assert(!after.lcOpen, "calendar closes after select");
	assert(after.input.includes("15"), "input updated after lunar select");
	assert(after.primary.length > 0 && after.primary !== "…", "result updated after lunar select");
	assert(before.primary !== after.primary || before.input !== after.input, "state changed on select");
	await context.close();
}

/* —— navigation without commit —— */
{
	const { context, page } = await setupDesktopPage(browser, "/en/lunar-date-converter/");
	await switchToLunar(page);
	await pasteGregorian(page, "2020/5/23");
	const committed = await readState(page);
	await openLunarCalendar(page);
	await page.locator("[data-ldc-lc-next]").click();
	const nav = await readState(page);
	assert(nav.lcOpen, "calendar stays open after next");
	assert(nav.input === committed.input, "input unchanged after month nav");
	assert(nav.primary === committed.primary, "result unchanged after month nav");
	await page.keyboard.press("Escape");
	await waitLunarCalendarOpen(page, false);
	const closed = await readState(page);
	assert(closed.input === committed.input, "input unchanged after Esc close");
	await context.close();
}

/* —— outside click no commit —— */
{
	const { context, page } = await setupDesktopPage(browser, "/en/lunar-date-converter/");
	await switchToLunar(page);
	const committed = await readState(page);
	await openLunarCalendar(page);
	await page.locator("[data-ldcv2-date-capsule]").click({ position: { x: 8, y: 8 } });
	await waitLunarCalendarOpen(page, false);
	const after = await readState(page);
	assert(after.input === committed.input, "outside click does not commit");
	await context.close();
}

/* —— Boundary: G 1901-01-01 → L sentinel —— */
{
	const { context, page } = await setupDesktopPage(browser, "/en/lunar-date-converter/");
	await pasteGregorian(page, "1901/1/1");
	await switchToLunar(page);
	const inputBefore = (await readState(page)).input;
	assert(inputBefore.includes("1900") || inputBefore.includes("11"), "lunar input shows 1900-11 sentinel");
	await openLunarCalendar(page);
	const state = await readState(page);
	assert(state.lcBoundary === "lower-sentinel", "lower sentinel boundary attr");
	assert(state.lcYear === "1900", "calendar shows year 1900");
	const selected = state.dayCells.filter((c) => c.selected);
	assert(selected.length === 1, "one selected day in sentinel");
	assert(selected[0]?.sentinel === true, "selected day is sentinel locked");
	assert(selected.every((c) => c.disabled), "selected sentinel day non-interactive");
	assert(state.dayCells.every((c) => c.disabled), "all 1900 days disabled");
	await context.close();
}

/* —— Boundary: L 2099-12-01 selectable → G 2100 —— */
{
	const { context, page } = await setupDesktopPage(browser, "/en/lunar-date-converter/");
	await switchToLunar(page);
	await pasteLunar(page, "2099/12/15");
	await openLunarCalendar(page);
	await page.waitForFunction(() => {
		return document.querySelector("[data-ldc-lc-year-label]")?.textContent?.trim() === "2099";
	});
	const openState = await readState(page);
	const dec1 = page.locator('[data-ldc-lc-day="1"]');
	assert(!(await dec1.isDisabled()), "2099-12-01 cell not disabled");
	await dec1.click();
	await waitLunarCalendarOpen(page, false);
	const afterLunar = await readState(page);
	assert(
		afterLunar.input.includes("2099") && afterLunar.input.includes("12"),
		"lunar input shows 2099-12 after select",
	);
	assert(
		afterLunar.primary.includes("2100"),
		"Gregorian ResultSummary shows 2100 after L 2099-12-01 select",
	);
	await context.close();
}

/* —— Gregorian calendar regression —— */
{
	const { context, page } = await setupDesktopPage(browser, "/en/lunar-date-converter/");
	await openGregorianCalendar(page);
	const state = await readState(page);
	assert(state.sdcOpen, "Gregorian calendar still opens");
	await page.keyboard.press("Escape");
	await switchToLunar(page);
	assert((await readState(page)).inputMode === "lunar", "mode switch works");
	await context.close();
}

/* —— Stress viewport 900×700 —— */
{
	const { context, page } = await setupDesktopPage(
		browser,
		"/zh/lunar-date-converter/",
		{ width: 900, height: 800 },
	);
	await switchToLunar(page);
	await openLunarCalendar(page);
	const state = await readState(page);
	assert(state.lcOpen, "ZH calendar opens at 900×700");
	assert(state.lcWidth > 0 && state.lcWidth <= 900, "calendar fits stress viewport");
	note(`stress viewport lc width=${state.lcWidth}px`);
	await context.close();
}

await browser.close();

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
	process.exit(1);
}
console.log("qa-lunar-b2c-calendar-browser PASS");
