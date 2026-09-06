/**
 * Lunar B2B — Desktop Browser QA gate（geometry + interaction matrix）.
 * Run after build: npx astro preview --port 4322 &
 *   node scripts/qa-lunar-b2b-desktop-browser.mjs
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

async function loadPlaywright() {
	try {
		return await import("playwright");
	} catch {
		return await import(
			/* webpackIgnore: true */ "playwright"
		).catch(async () => {
			throw new Error(
				"playwright not installed — run: npm install -D playwright && npx playwright install chromium",
			);
		});
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

async function measureGeometry(page) {
	return page.evaluate(() => {
		const cluster = document.querySelector(
			"[data-lunar-date-converter-v2] .ldcv2-input-cluster--desktop",
		);
		const capsule = document.querySelector(
			"[data-lunar-date-converter-v2] .ldcv2-date-capsule",
		);
		const parent = cluster?.parentElement;
		const clusterStyle = cluster ? getComputedStyle(cluster) : null;
		const parentStyle = parent ? getComputedStyle(parent) : null;
		return {
			clusterWidth: cluster?.getBoundingClientRect().width ?? 0,
			capsuleWidth: capsule?.getBoundingClientRect().width ?? 0,
			clusterDisplay: clusterStyle?.display ?? "",
			clusterDeclaredWidth: clusterStyle?.width ?? "",
			clusterMaxWidth: clusterStyle?.maxWidth ?? "",
			parentDisplay: parentStyle?.display ?? "",
			parentAlignItems: parentStyle?.alignItems ?? "",
			parentWidth: parent?.getBoundingClientRect().width ?? 0,
		};
	});
}

function assertNoDangerRed(color, label) {
	if (!color) return;
	assert(
		!color.includes("248, 113, 113") && !color.includes("239, 68, 68"),
		`${label}: no danger red (${color})`,
	);
}

async function readResult(page) {
	return page.evaluate(() => {
		const primary = document.querySelector(
			'[data-lunar-date-converter-v2] .rs-value[data-rs-value="primary"]',
		);
		const weekday = document.querySelector(
			'[data-lunar-date-converter-v2] [data-rs-weekday]',
		);
		const input = document.querySelector("[data-ldcv2-date-input]");
		const errorWrap = document.querySelector("[data-ldcv2-field-error-wrap]");
		const errorText = document.querySelector("[data-ldcv2-field-error-text]");
		const invalidMark = document.querySelector("[data-ldcv2-field-invalid]");
		const markColor = invalidMark
			? getComputedStyle(invalidMark).color
			: "";
		const errorTextColor = errorText
			? getComputedStyle(errorText.parentElement ?? errorText).color
			: "";
		return {
			primary: primary?.textContent?.trim() ?? "",
			weekday: weekday?.textContent?.trim() ?? "",
			weekdayHidden: weekday?.hasAttribute("hidden") ?? true,
			input: input?.value ?? "",
			error: errorText?.textContent?.trim() ?? "",
			errorWrapHidden: errorWrap?.hidden ?? true,
			invalidMarkColor: markColor,
			errorTextColor,
			fieldPhase: document
				.querySelector("[data-lunar-date-converter-v2]")
				?.getAttribute("data-ldcv2-field-phase"),
			inputMode: document
				.querySelector("[data-lunar-date-converter-v2]")
				?.getAttribute("data-ldcv2-input-mode"),
		};
	});
}

async function setupDesktopPage(browser, path) {
	const context = await browser.newContext({
		viewport: { width: 1280, height: 900 },
	});
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

async function pasteIntoField(page, text) {
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
}

async function commitField(page) {
	await page.locator("[data-ldcv2-date-input]").press("Tab");
}

async function fillLunar(page, text) {
	const input = page.locator("[data-ldcv2-date-input]");
	await input.click();
	/* Use paste path（full replace）— Playwright fill can race focus→semantic expand. */
	await page.evaluate((t) => {
		const el = document.querySelector("[data-ldcv2-date-input]");
		if (!el) return;
		const clip = new DataTransfer();
		clip.setData("text/plain", t);
		el.dispatchEvent(
			new ClipboardEvent("paste", {
				bubbles: true,
				cancelable: true,
				clipboardData: clip,
			}),
		);
	}, text);
	await input.press("Enter");
}

async function typeDigitViaBeforeInput(page, digit, staleLag = 0) {
	return page.evaluate(
		({ digit, staleLag }) => {
			const input = document.querySelector("[data-ldcv2-date-input]");
			const root = document.querySelector("[data-lunar-date-converter-v2]");
			const display = input?.value ?? "";
			const caret = Math.max(0, display.length - staleLag);
			input?.focus();
			input?.setSelectionRange(caret, caret);
			input?.dispatchEvent(
				new InputEvent("beforeinput", {
					bubbles: true,
					cancelable: true,
					inputType: "insertText",
					data: digit,
				}),
			);
			return {
				display: input?.value ?? "",
				caret: input?.selectionStart ?? 0,
				end: input?.selectionEnd ?? 0,
				phase: root?.getAttribute("data-ldcv2-field-phase") ?? "",
			};
		},
		{ digit, staleLag },
	);
}

async function typeDigitsSlow(page, text, delayMs = 5) {
	const input = page.locator("[data-ldcv2-date-input]");
	await input.click();
	await input.fill("");
	for (const ch of text) {
		await page.keyboard.type(ch, { delay: delayMs });
	}
}

async function typeDigitsIntoField(page, text) {
	await typeDigitsSlow(page, text, 5);
}

async function backspaceUntilEmpty(page) {
	const input = page.locator("[data-ldcv2-date-input]");
	await input.focus();
	await input.evaluate((el) => {
		el.setSelectionRange(el.value.length, el.value.length);
	});
	for (let i = 0; i < 40; i += 1) {
		const value = await input.inputValue();
		if (!value) {
			break;
		}
		await input.press("Backspace");
	}
}

console.log("qa-lunar-b2b-desktop-browser\n");
console.log(`base: ${BASE}\n`);
console.log("(Run npm run build before this script if preview serves stale assets.)\n");

mkdirSync(join(rootDir, "local-docs"), { recursive: true });

await waitForServer(`${BASE}/en/lunar-date-converter/`);

let chromium;
try {
	const pw = await loadPlaywright();
	chromium = pw.chromium;
} catch (err) {
	console.error(String(err));
	process.exit(1);
}

const browser = await chromium.launch({ headless: true });

/* —— Geometry EN —— */
{
	const { context, page } = await setupDesktopPage(
		browser,
		"/en/lunar-date-converter/",
	);
	const geo = await measureGeometry(page);
	note(
		`EN geometry: cluster=${geo.clusterWidth}px declared=${geo.clusterDeclaredWidth} max=${geo.clusterMaxWidth} parent=${geo.parentDisplay}/${geo.parentAlignItems} parentW=${geo.parentWidth}`,
	);
	assert(Math.abs(geo.clusterWidth - 420) < 0.5, `EN cluster rendered width ≈ 420px (got ${geo.clusterWidth})`);
	assert(
		geo.clusterDeclaredWidth === "420px" || geo.clusterDeclaredWidth.includes("420"),
		`EN cluster declared width references 420px (${geo.clusterDeclaredWidth})`,
	);
	assert(geo.clusterDisplay === "flex", "EN cluster display:flex (not shrink-wrapped inline)");
	assert(
		Math.abs(geo.capsuleWidth - geo.clusterWidth) < 2,
		`EN capsule fills cluster width (${geo.capsuleWidth} vs ${geo.clusterWidth})`,
	);
	note(`EN parent slot class context: tpf-desktop-controls (layout host, not width driver)`);
	await page.screenshot({
		path: join(rootDir, "local-docs/qa-lunar-b2b-en-initial.png"),
		fullPage: false,
	});
	await context.close();
}

/* —— Geometry ZH —— */
{
	const { context, page } = await setupDesktopPage(
		browser,
		"/zh/lunar-date-converter/",
	);
	const geo = await measureGeometry(page);
	note(
		`ZH geometry: cluster=${geo.clusterWidth}px capsule=${geo.capsuleWidth}px`,
	);
	assert(Math.abs(geo.clusterWidth - 420) < 0.5, `ZH cluster rendered width ≈ 420px (got ${geo.clusterWidth})`);
	const zh = await readResult(page);
	assert(zh.primary.includes("農曆"), "ZH initial lunar result line 1");
	assert(/初|一|二|三|四|五|六|七|八|九|十|廿|正/.test(zh.primary), "ZH result uses Chinese day/month names");
	assert(!/七月11日|七月\d+日/.test(zh.primary), "ZH result must not use Arabic day in month/day line");
	await page.screenshot({
		path: join(rootDir, "local-docs/qa-lunar-b2b-zh-initial.png"),
		fullPage: false,
	});
	await context.close();
}

/* —— EN interaction matrix —— */
{
	const { context, page } = await setupDesktopPage(
		browser,
		"/en/lunar-date-converter/",
	);
	const input = page.locator("[data-ldcv2-date-input]");
	const today = new Date();

	let r = await readResult(page);
	assert(r.primary.startsWith("Lunar"), "EN initial: lunar result");
	assert(r.input.includes(String(today.getFullYear())), "EN initial: today in field");

	/* Continuous raw stream — per-keypress with simulated stale DOM caret */
	await input.fill("");
	const step190 = [
		["1", "1"],
		["9", "19"],
		["0", "190"],
	];
	for (const [digit, expected] of step190) {
		const snap = await typeDigitViaBeforeInput(page, digit, 1);
		assert(snap.display === expected, `EN 190 step ${digit} stale-lag1 (${snap.display})`);
		assert(snap.caret === expected.length, `EN 190 step ${digit} caret at end (${snap.caret})`);
		assert(snap.phase === "draft-incomplete", `EN 190 step ${digit} draft-incomplete`);
	}
	r = await readResult(page);
	assert(r.primary === "?", "EN 190 steps: Result ? while incomplete");
	assert(r.errorWrapHidden, "EN 190 steps: no error wrap");
	assert(r.error.length === 0, "EN 190 steps: no error text");

	/* Real keyboard：2→20→202→2020 must not desync to 220/0 */
	await input.fill("");
	await input.click();
	const yearSteps = [];
	for (const ch of "2020") {
		await page.keyboard.type(ch, { delay: 15 });
		yearSteps.push(
			await page.evaluate(() => {
				const el = document.querySelector("[data-ldcv2-date-input]");
				return {
					value: el?.value ?? "",
					digits: (el?.value ?? "").replace(/\D/g, ""),
					caret: el?.selectionStart ?? -1,
				};
			}),
		);
	}
	assert(yearSteps[0].value === "2" && yearSteps[0].digits === "2", `EN real 2 (${yearSteps[0].value})`);
	assert(yearSteps[1].value === "20" && yearSteps[1].digits === "20", `EN real 20 (${yearSteps[1].value})`);
	assert(yearSteps[2].value === "202" && yearSteps[2].digits === "202", `EN real 202 (${yearSteps[2].value})`);
	assert(
		yearSteps[3].value === "2020" && yearSteps[3].digits === "2020",
		`EN real 2020 (${yearSteps[3].value})`,
	);
	assert(!yearSteps.some((s) => /220/.test(s.value)), "EN real 2020 never renders 220/0");

	/* Month wait：20241 → 202410/11/12；2024121；2024512 */
	const monthCases = [
		["20241", "2024 / 1", "?", true],
		["202410", "2024 / 10", "?", true],
		["202411", "2024 / 11", "?", true],
		["202412", "2024 / 12", "?", true],
		["2024121", "2024 / 12 / 1", null, false],
		["2024512", "2024 / 5 / 12", null, false],
	];
	for (const [digits, expectedInput, primaryOrNull, expectIncomplete] of monthCases) {
		await input.fill("");
		await typeDigitsIntoField(page, digits);
		r = await readResult(page);
		assert(r.input === expectedInput, `EN month-wait ${digits} → ${expectedInput} (got ${r.input})`);
		if (expectIncomplete) {
			assert(r.primary === "?", `EN month-wait ${digits}: Result ?`);
			assert(r.errorWrapHidden, `EN month-wait ${digits}: no error`);
		} else {
			assert(r.primary !== "?", `EN month-wait ${digits}: Result updates while focused`);
			assert(!/^Lunar\b/i.test(r.input), `EN month-wait ${digits}: still numeric while focused`);
		}
		void primaryOrNull;
	}
	await commitField(page);
	r = await readResult(page);
	assert(r.input.includes("2024 / 05 / 12") || r.input.includes("2024 / 5 / 12"), `EN blur gregorian pad (${r.input})`);

	/* Smart Date Input — continuous digits / paste parity / delete to empty */
	await input.fill("");
	await typeDigitsIntoField(page, "20001");
	r = await readResult(page);
	assert(r.input === "2000 / 1", `EN type 20001 incomplete mid-stream (${r.input})`);
	assert(r.errorWrapHidden, "EN incomplete mid-stream: no error wrap");
	assert(r.primary === "?", "EN incomplete mid-stream: Result ?");

	await typeDigitsIntoField(page, "20001111");
	r = await readResult(page);
	assert(r.input === "2000 / 11 / 11", `EN type 20001111 (${r.input})`);
	assert(r.errorWrapHidden, "EN 8-digit typing: no error wrap");
	assert(r.primary.includes("Lunar"), "EN 8-digit typing: immediate Result (no blur)");
	assert(!/^Lunar\b/i.test(r.input), "EN 8-digit focused field stays numeric");
	await commitField(page);
	r = await readResult(page);
	assert(r.input.includes("2000 / 11 / 11"), "EN type 20001111 blur normalized");
	assert(r.primary.includes("Lunar"), "EN type 20001111 still valid after blur");

	await input.fill("");
	await typeDigitsSlow(page, "19991122", 0);
	r = await readResult(page);
	assert(r.input === "1999 / 11 / 22", `EN type fast 19991122 (${r.input})`);
	await commitField(page);
	r = await readResult(page);
	assert(r.input.includes("1999 / 11 / 22"), "EN type fast 19991122 blur normalized");

	await input.fill("");
	await pasteIntoField(page, "19991122");
	await commitField(page);
	r = await readResult(page);
	assert(r.input.includes("1999 / 11 / 22"), `EN paste 19991122 (${r.input})`);
	assert(r.primary.includes("Lunar"), "EN paste 19991122 updates result");

	await pasteIntoField(page, "20001111");
	await commitField(page);
	await backspaceUntilEmpty(page);
	r = await readResult(page);
	assert(r.input === "", `EN backspace to empty (${JSON.stringify(r.input)})`);
	assert(r.errorWrapHidden, "EN empty after backspace: no error wrap");
	assert(r.error.length === 0, "EN empty after backspace: no error text");

	await pasteIntoField(page, "20001111");
	await commitField(page);
	await input.click({ clickCount: 3 });
	await page.keyboard.press("Backspace");
	r = await readResult(page);
	assert(r.input === "", "EN select-all delete → empty");

	/* incomplete gregorian draft — Result ? + no error */
	await pasteIntoField(page, "2026 / 08 / 1");
	const phase = await page.evaluate(() =>
		document
			.querySelector("[data-lunar-date-converter-v2]")
			?.getAttribute("data-ldcv2-field-phase"),
	);
	r = await readResult(page);
	assert(
		phase === "draft-incomplete" || phase === "committed-valid",
		`EN greg partial paste phase (${phase})`,
	);
	if (phase === "draft-incomplete") {
		assert(r.errorWrapHidden, "EN greg incomplete: no error wrap");
		assert(r.error.length === 0, "EN greg incomplete: no error text");
		assert(r.primary === "?", "EN greg incomplete: Result ?");
	} else {
		note("EN greg partial paste auto-normalized in headless; verified via lunar incomplete path");
	}

	/* Pattern A — obvious complete invalid (icon only, no visible error text) */
	await pasteIntoField(page, "1986 / 04 / 71");
	await commitField(page);
	r = await readResult(page);
	assert(!r.errorWrapHidden, "EN greg obvious invalid: inline error wrap visible");
	assert(r.error.length === 0, "EN greg obvious invalid: no visible error text");
	assertNoDangerRed(r.invalidMarkColor, "EN greg obvious invalid: icon color");
	assert(r.primary === "?", "EN greg obvious invalid: result ?");
	assert(r.weekdayHidden || !r.weekday, "EN greg obvious invalid: weekday cleared");

	await pasteIntoField(page, "2026 / 02 / 30");
	await commitField(page);
	r = await readResult(page);
	assert(!r.errorWrapHidden, "EN greg Feb 30: inline error wrap visible");
	assert(r.error.length === 0, "EN greg Feb 30: no visible error text");
	assertNoDangerRed(r.invalidMarkColor, "EN greg Feb 30: icon color");
	assert(r.primary === "?", "EN greg Feb 30: result ?");

	/* complete valid */
	await pasteIntoField(page, "2026 / 08 / 17");
	await commitField(page);
	r = await readResult(page);
	assert(r.primary.includes("Lunar 7/5"), "EN greg valid: lunar result updated");
	assert(r.weekday === "Monday", "EN greg valid: weekday Monday");

	/* calendar open / select / close */
	await page.locator("[data-ldcv2-calendar-toggle]").click();
	const calOpen = await page.locator("#ldc-sdc[data-sdc-open='true']").count();
	assert(calOpen === 1, "EN calendar opens (data-sdc-open=true)");
	await page.evaluate(() => {
		document.querySelector('#ldc-sdc [data-sdc-grid] button[data-sdc-day="20"]')?.click();
	});
	await page.waitForTimeout(100);
	r = await readResult(page);
	const calClosed = await page.locator("#ldc-sdc[data-desktop-calendar]").isHidden();
	assert(calClosed, "EN calendar closes after select");
	assert(r.input.includes("20"), "EN calendar select updates field");

	/* lunar regular */
	await page.locator('[data-ldcv2-switch="lunar"]').click();
	await fillLunar(page, "2026/7/5");
	r = await readResult(page);
	assert(r.primary === "Aug 17, 2026", "EN lunar→gregorian Aug 17, 2026");
	assert(r.weekday === "Monday", "EN lunar result weekday");
	assert(r.input === "Lunar 2026/7/5", `EN lunar committed field (${r.input})`);

	/* focus again → numeric editing；blur → semantic */
	await input.click();
	r = await readResult(page);
	assert(!/^Lunar\b/i.test(r.input), `EN lunar refocus → numeric (${r.input})`);
	assert(/\d/.test(r.input), "EN lunar refocus has digits");
	const primaryWhileFocused = r.primary;
	await commitField(page);
	r = await readResult(page);
	assert(r.input === "Lunar 2026/7/5", `EN lunar blur → semantic again (${r.input})`);
	assert(r.primary === primaryWhileFocused, "EN lunar focus/blur keeps actual date Result");

	/* leap valid */
	await fillLunar(page, "1963閏4月15");
	r = await readResult(page);
	assert(r.primary.includes("1963"), "EN leap: gregorian result year");
	assert(r.primary !== "?", "EN leap: valid conversion");
	assert(r.errorWrapHidden, "EN leap: no error wrap");
	assert(r.error.length === 0, "EN leap: no error text");
	assert(r.input === "Lunar 1963/Leap 4/15", `EN leap committed field (${r.input})`);
	await input.click();
	r = await readResult(page);
	assert(!/^Lunar\b/i.test(r.input), `EN leap refocus drops Lunar prefix (${r.input})`);
	await commitField(page);
	r = await readResult(page);
	assert(r.input === "Lunar 1963/Leap 4/15", "EN leap blur restores Leap semantic");

	/* lunar incomplete draft → Result ? + no error */
	await page.evaluate(() => {
		const el = document.querySelector("[data-ldcv2-date-input]");
		if (!el) return;
		el.focus();
		const clip = new DataTransfer();
		clip.setData("text/plain", "1980/4/");
		el.dispatchEvent(
			new ClipboardEvent("paste", {
				bubbles: true,
				cancelable: true,
				clipboardData: clip,
			}),
		);
	});
	r = await readResult(page);
	assert(r.errorWrapHidden, "EN lunar incomplete: no error wrap");
	assert(r.error.length === 0, "EN lunar incomplete: no error text");
	assert(r.primary === "?", "EN lunar incomplete: Result ?");

	/* Pattern B — invalid lunar day (muted ! + neutral explanation) */
	await fillLunar(page, "1980/4/31");
	r = await readResult(page);
	assert(r.primary === "?", "EN lunar invalid day → ?");
	assert(!r.errorWrapHidden, "EN lunar invalid day: error wrap visible");
	assert(r.error.length > 0, "EN lunar invalid day: explanation shown");
	assertNoDangerRed(r.invalidMarkColor, "EN lunar invalid day: icon color");
	assertNoDangerRed(r.errorTextColor, "EN lunar invalid day: text color");

	/* Pattern B — out of range */
	await fillLunar(page, "2100/1/1");
	r = await readResult(page);
	assert(r.primary === "?", "EN lunar out of range → ?");
	assert(r.error.length > 0, "EN lunar out of range: explanation shown");
	assertNoDangerRed(r.errorTextColor, "EN lunar out of range: text color");

	/* Owner compact digits — regular month, never invent leap */
	await fillLunar(page, "2024512");
	r = await readResult(page);
	assert(r.primary !== "?", "EN compact 2024512 converts");
	assert(r.errorWrapHidden, "EN compact 2024512: no error");
	assert(r.input === "Lunar 2024/5/12", `EN compact 2024512 committed field (${r.input})`);

	await fillLunar(page, "19630415");
	r = await readResult(page);
	assert(r.primary !== "?", "EN compact 19630415 converts as regular");
	assert(!/Leap/i.test(r.input), "EN compact 19630415 field not leap-marked");
	assert(r.input === "Lunar 1963/4/15", `EN compact 19630415 committed field (${r.input})`);

	await fillLunar(page, "1980414");
	r = await readResult(page);
	assert(r.primary !== "?", "EN compact 1980414 converts as regular");
	assert(r.error.length === 0, "EN compact 1980414: no error text");
	assert(r.input === "Lunar 1980/4/14", `EN compact 1980414 committed field (${r.input})`);

	/* Pattern B — 潤 alias accepted；committed display uses 閏 only */
	await fillLunar(page, "1963潤4月15");
	r = await readResult(page);
	assert(r.primary !== "?", "EN 潤 alias accepted as leap");
	assert(r.error.length === 0, "EN 潤 alias: no error text");
	assert(r.errorWrapHidden, "EN 潤 alias: no error wrap");
	assert(/Leap/i.test(r.input) || /Leap/i.test(r.primary), "EN 潤 alias yields leap result");
	assert(!/潤/.test(r.input), "EN field never keeps 潤");

	/* Compact leap：1963閏415／1963潤415 */
	await fillLunar(page, "1963閏415");
	r = await readResult(page);
	assert(r.primary !== "?", "EN compact 閏415 converts");
	assert(r.error.length === 0, "EN compact 閏415: no error");
	assert(/Leap/i.test(r.input) || /Leap/i.test(r.primary), "EN compact 閏415 is leap");
	assert(r.input === "Lunar 1963/Leap 4/15", `EN compact 閏415 field (${r.input})`);

	await fillLunar(page, "1963潤415");
	r = await readResult(page);
	assert(r.primary !== "?", "EN compact 潤415 converts");
	assert(r.error.length === 0, "EN compact 潤415: no error");
	assert(r.input === "Lunar 1963/Leap 4/15", `EN compact 潤415 field (${r.input})`);
	assert(!/潤/.test(r.input), "EN compact 潤415 never keeps 潤");

	await fillLunar(page, "2024閏415");
	r = await readResult(page);
	assert(r.primary === "?", "EN compact leap no-leap-year → ?");
	assert(r.error.length > 0, "EN compact leap no-leap-year: explanation");
	assertNoDangerRed(r.errorTextColor, "EN compact leap no-leap-year: text color");

	/* switch preserves actualCivil */
	await fillLunar(page, "2026/7/5");
	await page.locator('[data-ldcv2-switch="gregorian"]').click();
	r = await readResult(page);
	assert(r.input.includes("08 / 17"), "EN switch: gregorian field from actualCivil");
	assert(r.primary.includes("Lunar 7/5"), "EN switch: lunar result from actualCivil");

	/* draft discard on switch — incomplete shows ? then switch restores committed */
	await page.locator('[data-ldcv2-switch="lunar"]').click();
	await page.evaluate(() => {
		const el = document.querySelector("[data-ldcv2-date-input]");
		if (!el) return;
		el.focus();
		const clip = new DataTransfer();
		clip.setData("text/plain", "1980/4/");
		el.dispatchEvent(
			new ClipboardEvent("paste", {
				bubbles: true,
				cancelable: true,
				clipboardData: clip,
			}),
		);
	});
	r = await readResult(page);
	assert(r.primary === "?", "EN draft lunar incomplete → Result ?");
	await page.locator('[data-ldcv2-switch="gregorian"]').click();
	r = await readResult(page);
	assert(r.input.includes("08 / 17"), "EN switch discards draft, keeps committed");
	assert(r.primary.includes("Lunar 7/5"), "EN switch no invalid result flicker");

	/* reset */
	await page.locator("[data-ldcv2-reset]").click();
	r = await readResult(page);
	assert(r.input.includes(String(today.getFullYear())), "EN reset: today");
	assert(r.primary.startsWith("Lunar"), "EN reset: lunar result");

	await page.screenshot({
		path: join(rootDir, "local-docs/qa-lunar-b2b-en-matrix.png"),
		fullPage: false,
	});
	await context.close();
}

/* —— ZH interaction subset —— */
{
	const { context, page } = await setupDesktopPage(
		browser,
		"/zh/lunar-date-converter/",
	);
	const input = page.locator("[data-ldcv2-date-input]");

	await page.locator('[data-ldcv2-switch="lunar"]').click();
	let r = await readResult(page);
	assert(
		/[初十廿三]?[一二三四五六七八九十]+日?/.test(r.input) ||
			/初|廿|年/.test(r.input),
		`ZH lunar field Chinese day on switch (${r.input})`,
	);

	await fillLunar(page, "2026/7/5");
	r = await readResult(page);
	assert(r.primary.includes("2026"), "ZH lunar→gregorian");
	assert(r.weekday.length > 0, "ZH lunar result weekday slot");
	assert(
		/年/.test(r.input) && /[正一二三四五六七八九十]+月/.test(r.input),
		`ZH lunar complete → semantic field (${r.input})`,
	);
	assert(!/\d+\s*\/\s*\d+\s*\/\s*\d+/.test(r.input), "ZH lunar complete: not Gregorian-like Y/M/D");

	await fillLunar(page, "1963閏4月15");
	r = await readResult(page);
	assert(/閏/.test(r.input), `ZH leap complete keeps 閏 (${r.input})`);
	assert(r.primary !== "?", "ZH leap converts");
	assert(!/\d+\s*\/\s*\d+\s*\/\s*\d+/.test(r.input), "ZH leap complete: not Gregorian-like Y/M/D");

	await fillLunar(page, "1963潤4月15");
	r = await readResult(page);
	assert(r.primary !== "?", "ZH 潤 alias converts");
	assert(r.error.length === 0, "ZH 潤 alias: no error");
	assert(/閏/.test(r.input) && !/潤/.test(r.input), `ZH 潤 → committed 閏 (${r.input})`);
	assert(r.input === "1963年閏四月十五", `ZH 潤 committed display (${r.input})`);

	await fillLunar(page, "1963潤四月15");
	r = await readResult(page);
	assert(r.primary !== "?", "ZH 潤四月15 converts");
	assert(r.input === "1963年閏四月十五", `ZH 潤四月15 committed (${r.input})`);

	await fillLunar(page, "1963閏415");
	r = await readResult(page);
	assert(r.primary !== "?", "ZH compact 閏415 converts");
	assert(r.error.length === 0, "ZH compact 閏415: no error");
	assert(r.input === "1963年閏四月十五", `ZH compact 閏415 committed (${r.input})`);

	await fillLunar(page, "1963潤415");
	r = await readResult(page);
	assert(r.primary !== "?", "ZH compact 潤415 converts");
	assert(r.input === "1963年閏四月十五", `ZH compact 潤415 committed (${r.input})`);
	assert(!/潤/.test(r.input), "ZH compact 潤415 never keeps 潤");

	await page.locator('[data-ldcv2-switch="gregorian"]').click();
	r = await readResult(page);
	assert(r.primary.includes("農曆"), "ZH greg result line1");
	const lines = r.primary.split("\n");
	assert(lines.length >= 2, "ZH greg result two lines");
	assert(/初|十一|廿|十/.test(lines[1] ?? ""), `ZH greg result Chinese day (${lines[1]})`);
	assert(!/七月11日|七月\d+日/.test(lines[1] ?? ""), "ZH greg result no Arabic day");

	/* Pattern B — gregorian out of range (already in gregorian mode) */
	await pasteIntoField(page, "1900 / 01 / 01");
	await commitField(page);
	r = await readResult(page);
	assert(r.primary === "?", "ZH greg out of range → ?");
	assert(r.error.length > 0, "ZH greg out of range: explanation shown");
	assertNoDangerRed(r.errorTextColor, "ZH greg out of range: text color");

	await page.locator('[data-ldcv2-switch="lunar"]').click();
	await fillLunar(page, "1980/4/31");
	r = await readResult(page);
	assert(r.primary === "?", "ZH lunar invalid day → ?");
	assert(r.error.length > 0, "ZH lunar invalid: explanation shown");
	assertNoDangerRed(r.invalidMarkColor, "ZH lunar invalid: icon color");

	await page.screenshot({
		path: join(rootDir, "local-docs/qa-lunar-b2b-zh-matrix.png"),
		fullPage: false,
	});
	await context.close();
}

await browser.close();

console.log("\n--- Evidence ---");
for (const line of evidence) {
	console.log(line);
}
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log("qa-lunar-b2b-desktop-browser PASS");
