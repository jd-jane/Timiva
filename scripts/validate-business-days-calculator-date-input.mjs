/**
 * Deterministic validation for Business Days Calculator — Smart Date Input:
 * - Parsing／editing（6/7/8 碼、slash/dash、segment edit、paste、range paste）
 * - empty / incomplete / complete valid / complete invalid（1900-01-01 … 2100-12-31）
 * - resolveOrderedRange 反向自動交換（僅 both complete valid）
 * - Mobile Y/M/D helpers（auto-advance；Start Day 不跨組跳 End Year）
 * - Wiring／regression：script 接 math、EN plural formatter、無 Clear／Calculate／LocalStorage
 * Run: node scripts/validate-business-days-calculator-date-input.mjs
 */
import {
	applySegmentInputChange,
	emptyDateSegments,
	formatCalendarDateCompact,
	formatDateRangeCompact,
	formatSegmentsDisplay,
	formatSegmentsNormalized,
	isEntryCompleteForAutoFocus,
	isSegmentsEmpty,
	mobileAutoAdvanceTarget,
	normalizeSegmentsForBlur,
	parseDateInputText,
	parseDateRangePaste,
	extractDateRangeTokens,
	resolveFieldStatus,
	resolveInvalidDateFields,
	resolveOrderedRange,
	segmentsFromCalendarDate,
	segmentsFromParts,
	segmentsFromPastedText,
	segmentsFromStreamDigits,
	shouldAutoAdvanceMobileMonth,
	shouldAutoAdvanceMobileYear,
	digitsOnly,
} from "../src/lib/businessDaysCalculatorDateInput.ts";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

let passed = 0;
let failed = 0;

function assert(condition, message) {
	if (condition) {
		passed += 1;
		return;
	}
	failed += 1;
	console.error(`FAIL: ${message}`);
}

function typeDigitsForward(startSegments, chars) {
	let segments = { ...startSegments };
	let caret = formatSegmentsDisplay(segments).length;

	for (const ch of chars) {
		const result = applySegmentInputChange(
			segments,
			"insertText",
			ch,
			caret,
			caret,
		);
		segments = result.segments;
		caret = result.caret;
	}

	return segments;
}

function assertParse(text, expected, label) {
	const { status, date } = parseDateInputText(text);
	if (expected === null) {
		assert(status === "invalid" || date === null, `${label}: expected invalid (${text}) got ${status}`);
		assert(date === null, `${label}: date should be null`);
		return;
	}
	assert(status === "valid", `${label}: expected valid (${text}) got ${status}`);
	assert(date !== null, `${label}: date present`);
	if (!date) return;
	assert(date.year === expected.year, `${label}: year ${date.year} !== ${expected.year}`);
	assert(date.month === expected.month, `${label}: month ${date.month} !== ${expected.month}`);
	assert(date.day === expected.day, `${label}: day ${date.day} !== ${expected.day}`);
}

function assertTypedAndPasted(raw, expectedDisplay, label) {
	const typed = formatSegmentsNormalized(typeDigitsForward(emptyDateSegments(), raw));
	const pasted = formatSegmentsNormalized(segmentsFromPastedText(raw));
	assert(typed === expectedDisplay, `${label} typed: ${typed} !== ${expectedDisplay}`);
	assert(pasted === expectedDisplay, `${label} paste: ${pasted} !== ${expectedDisplay}`);
	assert(typed === pasted, `${label}: typed/paste parity`);
}

console.log("validate-business-days-calculator-date-input");

// --- Pure numeric: paste + 逐鍵 parity（6 / 7 / 8 碼） ---
assertTypedAndPasted("199011", "1990 / 11", "6-digit 199011 → month 11 waiting for day");
assertTypedAndPasted("202011", "2020 / 11", "6-digit 202011 → month 11 waiting for day");
assertTypedAndPasted("1950820", "1950 / 08 / 20", "7-digit 1950820");
assertTypedAndPasted("1950102", "1950 / 10 / 02", "7-digit 1950102");
assertTypedAndPasted("1950131", "1950 / 01 / 31", "7-digit 1950131");
assertTypedAndPasted("19900101", "1990 / 01 / 01", "8-digit 19900101");
assertTypedAndPasted("19991122", "1999 / 11 / 22", "8-digit 19991122");
assertTypedAndPasted("19991231", "1999 / 12 / 31", "8-digit 19991231");
assertTypedAndPasted("20260713", "2026 / 07 / 13", "8-digit 20260713");
assertTypedAndPasted("202674", "2026 / 07 / 04", "6-digit 202674 → Jul 4");

/**
 * Event-sequence regression：模擬 mobile beforeinput stale caret
 *（顯示字尾落後 1～2 碼、或 openDay 空槽時 caret 停在 month 尾）。
 * continuous preferStream 必須仍整串 re-derive，不可寫成 2026 / 74 /。
 */
function typeDigitsWithCaretLag(chars, lag) {
	let segments = emptyDateSegments();

	for (const ch of chars) {
		const display = formatSegmentsDisplay(segments);
		const caret = Math.max(0, display.length - lag);
		const result = applySegmentInputChange(segments, "insertText", ch, caret, caret);
		segments = result.segments;
	}

	return segments;
}

{
	for (const lag of [0, 1, 2, 3]) {
		const typed = formatSegmentsNormalized(typeDigitsWithCaretLag("202674", lag));
		assert(
			typed === "2026 / 07 / 04",
			`202674 caret-lag=${lag} → 2026 / 07 / 04 (got ${typed})`,
		);
	}

	/* Year-only intermittent repros：30× × lag 0–3 */
	for (const year of ["1945", "2020", "1980", "2000"]) {
		for (const lag of [0, 1, 2, 3]) {
			for (let i = 0; i < 30; i += 1) {
				const typed = typeDigitsWithCaretLag(year, lag);
				assert(
					formatSegmentsDisplay(typed) === year && typed.year === year,
					`BDC year ${year} caret-lag=${lag} repeat=${i} (got ${formatSegmentsDisplay(typed)})`,
				);
			}
		}
	}

	// 輸入 20267，停頓後再輸入 4（中間狀態 preferStream 仍在）
	const paused = typeDigitsForward(emptyDateSegments(), "20267");
	assert(
		formatSegmentsDisplay(paused) === "2026 / 7" ||
			formatSegmentsDisplay(paused) === "2026 / 07",
		`20267 mid display (got ${formatSegmentsDisplay(paused)})`,
	);
	assert(paused.preferStream === true, "20267 mid keeps preferStream");
	const afterPause = applySegmentInputChange(
		paused,
		"insertText",
		"4",
		Math.max(0, formatSegmentsDisplay(paused).length - 2),
		Math.max(0, formatSegmentsDisplay(paused).length - 2),
	);
	assert(
		formatSegmentsNormalized(afterPause.segments) === "2026 / 07 / 04",
		`20267 pause then 4 with stale caret → 2026 / 07 / 04 (got ${formatSegmentsNormalized(afterPause.segments)})`,
	);

	// openDay 空槽 + caret 停在 month 尾（曾再現 2026 / 74 /）
	const openDayHole = {
		...segmentsFromStreamDigits("20267"),
		openDay: true,
	};
	const fromHole = applySegmentInputChange(openDayHole, "insertText", "4", 8, 8);
	assert(
		formatSegmentsNormalized(fromHole.segments) === "2026 / 07 / 04",
		`openDay hole + month-end caret → 2026 / 07 / 04 (got ${formatSegmentsNormalized(fromHole.segments)})`,
	);
	assert(
		formatSegmentsDisplay(fromHole.segments) !== "2026 / 74 / " &&
			fromHole.segments.month !== "74",
		"must not lock month as 74",
	);

	// 清除後重輸、與 paste 一致
	const cleared = applySegmentInputChange(
		segmentsFromPastedText("2026/07/13"),
		"clearAll",
		null,
		0,
		0,
	);
	assert(isSegmentsEmpty(cleared.segments), "clearAll returns empty");
	assertTypedAndPasted("202674", "2026 / 07 / 04", "retype 202674 after clear parity");
	assertTypedAndPasted("1950102", "1950 / 10 / 02", "retype 1950102 parity");
	assertTypedAndPasted("1950131", "1950 / 01 / 31", "retype 1950131 parity");
	assertTypedAndPasted("19991122", "1999 / 11 / 22", "retype 19991122 parity");
}

// Continuous: 6-digit mid-state must NOT auto-focus（From → To 流程）
{
	const mid = typeDigitsForward(emptyDateSegments(), "199911");
	assert(
		isEntryCompleteForAutoFocus(mid) === false,
		"continuous 199911 must not auto-focus (6-digit mid)",
	);
	const full = typeDigitsForward(emptyDateSegments(), "19991122");
	assert(
		isEntryCompleteForAutoFocus(full) === true,
		"continuous 19991122 8-digit valid may auto-focus",
	);
	const pasted6 = segmentsFromPastedText("199011");
	assert(
		isEntryCompleteForAutoFocus(pasted6, { fromPaste: true }) === false,
		"paste 6-digit month-11 waiting for day is not complete",
	);
}

// --- Slash / dash: paste + 逐鍵 ---
assertTypedAndPasted("2021/1/1", "2021 / 01 / 01", "slash 2021/1/1");
assertTypedAndPasted("2021-1-1", "2021 / 01 / 01", "dash 2021-1-1");
assertTypedAndPasted("2000/1/23", "2000 / 01 / 23", "slash 2000/1/23");
assertTypedAndPasted("2000-1-23", "2000 / 01 / 23", "dash 2000-1-23");

assertParse("2021/1/1", { year: 2021, month: 1, day: 1 }, "parse slash");
assertParse("2021-1-1", { year: 2021, month: 1, day: 1 }, "parse dash");

// --- Segment-based editing regression ---
{
	let segments = {
		...emptyDateSegments(),
		year: "2000",
		month: "1",
		day: "",
		openMonth: true,
		openDay: true,
		preferStream: false,
	};
	segments = typeDigitsForward(segments, "23");
	assert(
		formatSegmentsNormalized(segments) === "2000 / 01 / 23",
		`segment 2000/1/23 → 2000 / 01 / 23 (got ${formatSegmentsNormalized(segments)})`,
	);
	assert(segments.preferStream === false, "segment keeps preferStream false");
}

// Segment mid-edit: changing month must not eat day
{
	const segs = segmentsFromPastedText("1990/04/04");
	const monthStart = segs.year.length + 3;
	const mid = applySegmentInputChange(segs, "insertText", "1", monthStart, monthStart + 1);
	assert(
		mid.segments.day === "04" || mid.segments.day === "4",
		`month edit keeps day (got ${mid.segments.day})`,
	);
}

// --- 狀態：empty / incomplete / valid / invalid + 1900–2100 ---
assert(resolveFieldStatus(emptyDateSegments()) === "empty", "empty status");
assert(resolveFieldStatus(segmentsFromStreamDigits("1990")) === "incomplete", "year-only incomplete");
assert(resolveFieldStatus(segmentsFromStreamDigits("19901")) === "incomplete", "year+month incomplete");

assertParse("2024/2/29", { year: 2024, month: 2, day: 29 }, "leap valid");
assertParse("2023/2/29", null, "non-leap Feb 29 invalid");
assertParse("2026/2/30", null, "nonexistent 02/30 invalid");
assertParse("1900/1/1", { year: 1900, month: 1, day: 1 }, "min bound 1900-01-01");
assertParse("2100/12/31", { year: 2100, month: 12, day: 31 }, "max bound 2100-12-31");
assertParse("1899/12/31", null, "below min invalid");
assertParse("2101/01/01", null, "above max invalid");
assertParse("2026/13/01", null, "month 13 invalid");
assertParse("2026/00/10", null, "month 00 invalid");
assertParse("2026/07/00", null, "day 00 invalid");

// valid → invalid → valid（同一欄位可往返；invalid 不吃掉 segments）
{
	let segments = segmentsFromPastedText("2026/07/13");
	assert(resolveFieldStatus(segments) === "valid", "valid before edit");

	// 把 day 改成 32 → complete invalid
	segments = segmentsFromParts("2026", "07", "32");
	assert(resolveFieldStatus(segments) === "invalid", "valid → invalid");

	// 改回 31 → valid
	segments = segmentsFromParts("2026", "07", "31");
	assert(resolveFieldStatus(segments) === "valid", "invalid → valid");
}

// Blur normalize
assert(
	formatSegmentsNormalized(normalizeSegmentsForBlur(segmentsFromPastedText("2021/1/1"))) ===
		"2021 / 01 / 01",
	"blur normalize",
);

// --- Desktop whole-range paste auto-split ---
{
	const assertRange = (text, fromExpected, toExpected, label) => {
		const range = parseDateRangePaste(text);
		assert(range !== null, `${label}: range detected`);
		if (!range) return;
		assert(
			formatSegmentsNormalized(normalizeSegmentsForBlur(range.from)) === fromExpected,
			`${label} from: ${formatSegmentsNormalized(normalizeSegmentsForBlur(range.from))} !== ${fromExpected}`,
		);
		assert(
			formatSegmentsNormalized(normalizeSegmentsForBlur(range.to)) === toExpected,
			`${label} to: ${formatSegmentsNormalized(normalizeSegmentsForBlur(range.to))} !== ${toExpected}`,
		);
	};

	assertRange("2026/07/08-2026/09/17", "2026 / 07 / 08", "2026 / 09 / 17", "hyphen range");
	assertRange("2026-07-08 — 2026-09-17", "2026 / 07 / 08", "2026 / 09 / 17", "em-dash ISO range");
	assertRange("2026-07-08 – 2026-09-17", "2026 / 07 / 08", "2026 / 09 / 17", "en-dash range");
	assertRange("2026/7/8 至 2026/9/17", "2026 / 07 / 08", "2026 / 09 / 17", "zh 至 range");
	assertRange("2026/07/08 到 2026/09/17", "2026 / 07 / 08", "2026 / 09 / 17", "zh 到 range");
	assertRange("2026-07-08 to 2026-09-17", "2026 / 07 / 08", "2026 / 09 / 17", "to range");
	assertRange("2026/07/08 ~ 2026/09/17", "2026 / 07 / 08", "2026 / 09 / 17", "tilde range");
	assertRange("20260708 20260917", "2026 / 07 / 08", "2026 / 09 / 17", "8-digit pair range");

	assert(parseDateRangePaste("2026-07-08") === null, "single ISO date not split");
	assert(parseDateRangePaste("2026/7/8") === null, "single slash date not split");
	assert(parseDateRangePaste("19991122") === null, "single 8-digit not split");
	assert(extractDateRangeTokens("2026-07-08") === null, "extract single ISO → null");

	// Range paste 內含 invalid token：欄位進 invalid、不產生 valid range
	const invalidRange = parseDateRangePaste("2023/02/29-2023/03/01");
	assert(invalidRange !== null, "invalid range still extracts two tokens");
	if (invalidRange) {
		assert(resolveFieldStatus(invalidRange.from) === "invalid", "invalid range from status");
		assert(resolveFieldStatus(invalidRange.to) === "valid", "invalid range to still valid");
		assert(
			resolveOrderedRange(invalidRange.from, invalidRange.to) === null,
			"invalid range → resolveOrderedRange null（結果維持 0）",
		);
	}

	assert(
		formatSegmentsNormalized(normalizeSegmentsForBlur(segmentsFromPastedText("2026-07-08"))) ===
			"2026 / 07 / 08",
		"single ISO paste still works via single-field parser",
	);
}

// --- resolveOrderedRange：反向自動交換（僅 both complete valid） ---
{
	const from = segmentsFromPastedText("2026/07/20");
	const to = segmentsFromPastedText("2026/07/13");
	const range = resolveOrderedRange(from, to);
	assert(range !== null, "reverse range resolves");
	if (range) {
		assert(range.swapped === true, "reverse range marked swapped");
		assert(
			formatCalendarDateCompact(range.start) === "2026/07/13",
			`swap start (got ${formatCalendarDateCompact(range.start)})`,
		);
		assert(
			formatCalendarDateCompact(range.end) === "2026/07/20",
			`swap end (got ${formatCalendarDateCompact(range.end)})`,
		);
		// 交換後回寫 segments（Desktop 與 Mobile 同步同一份 state）
		assert(
			formatSegmentsNormalized(segmentsFromCalendarDate(range.start)) === "2026 / 07 / 13",
			"swapped start segments round-trip",
		);
		assert(
			formatSegmentsNormalized(segmentsFromCalendarDate(range.end)) === "2026 / 07 / 20",
			"swapped end segments round-trip",
		);
	}

	const forward = resolveOrderedRange(
		segmentsFromPastedText("2026/07/13"),
		segmentsFromPastedText("2026/07/20"),
	);
	assert(forward !== null && forward.swapped === false, "forward range not swapped");

	const same = resolveOrderedRange(
		segmentsFromPastedText("2026/07/13"),
		segmentsFromPastedText("2026/07/13"),
	);
	assert(same !== null && same.swapped === false, "same-day range not swapped");

	// 跨年反向
	const crossYear = resolveOrderedRange(
		segmentsFromPastedText("2027/01/02"),
		segmentsFromPastedText("2026/12/30"),
	);
	assert(
		crossYear !== null &&
			crossYear.swapped === true &&
			formatCalendarDateCompact(crossYear.start) === "2026/12/30",
		"cross-year reverse swap",
	);

	// empty / incomplete / invalid：一律 null → 不交換、結果維持 0
	assert(
		resolveOrderedRange(emptyDateSegments(), segmentsFromPastedText("2026/07/13")) === null,
		"empty from → null",
	);
	assert(
		resolveOrderedRange(segmentsFromStreamDigits("2026"), segmentsFromPastedText("2026/07/13")) ===
			null,
		"incomplete from → null",
	);
	assert(
		resolveOrderedRange(
			segmentsFromPastedText("2023/02/29"),
			segmentsFromPastedText("2026/07/13"),
		) === null,
		"invalid from → null",
	);
	assert(
		resolveOrderedRange(
			segmentsFromPastedText("1899/12/31"),
			segmentsFromPastedText("2026/07/13"),
		) === null,
		"below-min from → null",
	);

	assert(
		formatDateRangeCompact({ year: 2026, month: 7, day: 13 }, { year: 2026, month: 7, day: 20 }) ===
			"2026/07/13 — 2026/07/20",
		"capsule range compact format",
	);
}

// --- Mobile Y/M/D helpers ---
{
	assert(digitsOnly("20a26", 4) === "2026", "digitsOnly strips non-digits");
	assert(digitsOnly("123456", 4) === "1234", "digitsOnly clamps length");

	assert(shouldAutoAdvanceMobileYear("2026") === true, "year 4 digits advances");
	assert(shouldAutoAdvanceMobileYear("202") === false, "year 3 digits waits");

	assert(shouldAutoAdvanceMobileMonth("07") === true, "month 07 advances");
	assert(shouldAutoAdvanceMobileMonth("7") === true, "month 7 (2–9) advances");
	assert(shouldAutoAdvanceMobileMonth("1") === false, "month 1 waits for 10–12");
	assert(shouldAutoAdvanceMobileMonth("0") === false, "month 0 waits");
	assert(shouldAutoAdvanceMobileMonth("12") === true, "month 12 advances");

	// Start Day 不自動跨組跳到 End Year（Day 無 advance 目標）
	assert(mobileAutoAdvanceTarget("year") === "month", "year → month");
	assert(mobileAutoAdvanceTarget("month") === "day", "month → day");
	assert(mobileAutoAdvanceTarget("day") === null, "day → null（不跨組跳 End Year）");

	// segmentsFromParts：segment 模式，不重跑 6/7/8 推斷
	const parts = segmentsFromParts("2000", "1", "23");
	assert(parts.preferStream === false, "segmentsFromParts is segment mode");
	assert(
		formatSegmentsNormalized(parts) === "2000 / 01 / 23",
		`segmentsFromParts 2000/1/23 (got ${formatSegmentsNormalized(parts)})`,
	);
	assert(
		resolveFieldStatus(segmentsFromParts("2026", "", "13")) === "incomplete",
		"missing month is incomplete",
	);
	assert(
		resolveFieldStatus(segmentsFromParts("", "", "")) === "empty",
		"all-empty parts is empty",
	);
}

// --- 逐欄 invalid icon 對應 ---
{
	assert(
		JSON.stringify(resolveInvalidDateFields(segmentsFromParts("1899", "12", "31"))) ===
			JSON.stringify(["year"]),
		"below-min year → year icon",
	);
	assert(
		JSON.stringify(resolveInvalidDateFields(segmentsFromParts("2101", "01", "01"))) ===
			JSON.stringify(["year"]),
		"above-max year → year icon",
	);
	assert(
		JSON.stringify(resolveInvalidDateFields(segmentsFromParts("2026", "13", "01"))) ===
			JSON.stringify(["month"]),
		"month 13 → month icon",
	);
	assert(
		JSON.stringify(resolveInvalidDateFields(segmentsFromParts("2023", "02", "29"))) ===
			JSON.stringify(["day"]),
		"non-leap Feb 29 → day icon",
	);
	assert(
		JSON.stringify(resolveInvalidDateFields(segmentsFromParts("2026", "07", "32"))) ===
			JSON.stringify(["day"]),
		"day 32 → day icon",
	);
	assert(
		resolveInvalidDateFields(segmentsFromParts("2026", "", "13")).length === 0,
		"incomplete → no icons",
	);
	assert(
		resolveInvalidDateFields(segmentsFromParts("2026", "07", "13")).length === 0,
		"valid → no icons",
	);
}

// --- Static checks：單一 state、Desktop/Mobile 同步、結果維持 0、隔離 ---
{
	const script = readFileSync(join(rootDir, "src/scripts/business-days-calculator.ts"), "utf8");
	const component = readFileSync(
		join(rootDir, "src/components/tools/business-days-calculator-v2/BusinessDaysCalculatorV2.astro"),
		"utf8",
	);

	assert(
		script.includes("../lib/businessDaysCalculatorDateInput"),
		"script uses BDC date-input lib（not DBD source）",
	);
	assert(
		!script.includes("daysBetweenDatesDateInput"),
		"script does not import DBD date-input lib",
	);
	assert(
		script.includes("businessDaysCalculatorMath") &&
			script.includes("calculateBusinessDaysRange"),
		"B2B: math wired for live results",
	);
	assert(
		script.includes("syncResultDisplay") &&
			script.includes("rs:update") &&
			script.includes("[data-result-summary]"),
		"B2B: script updates ResultSummary via syncResultDisplay + rs:update",
	);
	assert(
		script.includes("formatPrimaryUnit") &&
			script.includes("business day") &&
			script.includes("business days"),
		"B2B: EN plural formatter in UI layer（not math-only）",
	);
	assert(
		script.includes("resolveOrderedRange") && script.includes("maybeApplyOrderedSwap"),
		"ordered swap wired in script",
	);
	assert(
		script.includes("data-bdcv2-desktop-from") &&
			script.includes("data-bdcv2-desktop-to") &&
			script.includes("data-bdcv2-sheet-from") &&
			script.includes("data-bdcv2-sheet-to"),
		"desktop + sheet Smart Date fields all bound to shared state",
	);
	assert(
		script.includes("syncFieldViews") && script.includes("bindSmartInput"),
		"Desktop/Mobile Smart Date views synced from single state",
	);
	assert(
		script.includes('classList.add("is-open")') &&
			script.includes('classList.remove("is-open")') &&
			script.includes('classList.add("is-visible")'),
		"sheet open/close toggles MSB baseline is-open / is-visible（B1B 漏掛修正）",
	);

	// mobile-sheet.md §12：landscape + keyboard 不抬升；portrait 可 keyboard-sync
	const css = readFileSync(
		join(rootDir, "src/styles/tools/business-days-calculator-v2.css"),
		"utf8",
	);
	assert(
		script.includes("stabilizePageScroll"),
		"sheet script keeps stabilizePageScroll (prevent lower-content jump)",
	);
	assert(
		script.includes("msb-scroll-lock") && script.includes("msb-sheet-open"),
		"sheet uses MSB scroll-lock classes（not body position:fixed alone）",
	);
	assert(
		/if\s*\(\s*landscapeMq\.matches\s*\)\s*\{[\s\S]*?clearKeyboardSync\(\)/.test(script),
		"landscape keyboard must clearKeyboardSync (no whole-sheet lift; Age/DBD-aligned)",
	);

	const landscapeBlock =
		script.match(/if\s*\(\s*landscapeMq\.matches\s*\)\s*\{[\s\S]*?\n\t\t\}/)?.[0] ?? "";
	assert(landscapeBlock.length > 0, "landscapeMq early-return block present");
	assert(
		!landscapeBlock.includes("sheet.style.bottom"),
		"landscape keyboard block must not set sheet.style.bottom",
	);
	assert(
		!landscapeBlock.includes("sheet.style.maxHeight") &&
			!landscapeBlock.includes("sheet.style.height"),
		"landscape keyboard block must not force sheet height/maxHeight",
	);
	assert(
		css.includes("max-height: min(40dvh, 9.75rem)") ||
			css.includes("max-height:min(40dvh, 9.75rem)"),
		"BDC landscape compact max-height override present",
	);
	assert(
		css.includes("height: fit-content") || css.includes("height:fit-content"),
		"BDC landscape compact uses content-driven height",
	);
	assert(
		script.includes("syncResultSummaryLayout") &&
			script.includes("data-rs-layout") &&
			script.includes("TimivaBusinessDaysLayout"),
		"layout gate syncs data-rs-layout via shared contract",
	);
	const layoutGateBlock =
		script.match(/const syncResultSummaryLayout = \(\) => \{[\s\S]*?\n\t\};/)?.[0] ?? "";
	assert(layoutGateBlock.length > 0, "syncResultSummaryLayout block present");
	assert(!layoutGateBlock.includes("rs:update"), "layout gate does not dispatch rs:update");
	assert(
		!/syncResultSummaryLayout[\s\S]{0,200}rs-status/.test(script),
		"layout gate does not update live region",
	);
	assert(
		script.includes("total-days") && script.includes("weekend-days"),
		"B2B: secondary keys match ResultSummary markup",
	);
	assert(
		script.includes("rs:update") &&
			script.includes("syncResultDisplay") &&
			!script.includes("dispatchResultSummaryUpdate"),
		"Phase H: syncResultDisplay dispatches rs:update directly（no adapter）",
	);
	assert(
		!script.includes("Phase H") && !script.includes("Phase H delete"),
		"Phase H: no Phase H TODO／adapter comments",
	);
	assert(
		!script.includes("data-bdcv2-result-digits") &&
			!script.includes("data-bdcv2-result-days") &&
			!script.includes("data-bdcv2-result-total") &&
			!script.includes("data-bdcv2-result-weekend") &&
			!script.includes("data-bdcv2-result-unit"),
		"Phase H: no legacy result DOM hooks in script",
	);
	assert(
		!script.includes("data-rs-digits") ||
			!/setAttribute\(\s*["']data-rs-digits/.test(script),
		"BDC script does not write data-rs-digits",
	);
	assert(
		!css.includes("data-bdcv2-result-digits") &&
			!css.includes("preview-tool-result-number") &&
			!css.includes("bdcv2-result-secondary") &&
			!css.includes("bdcv2-result-main") &&
			!css.includes("result-number-size"),
		"Phase H: no legacy result typography／digit ladder in BDC CSS",
	);
assert(
		css.includes(".bdcv2-result-summary") &&
			!css.includes("[data-rs-digits") &&
			!/--bdcv2-landscape-result-column-gap/.test(css) &&
			!/\.preview-tool-result-block[\s\S]{0,220}?grid-template-columns:\s*repeat\(3/.test(css) &&
			!/\.bdcv2-result-summary[\s\S]{0,220}?grid-template-columns:\s*repeat\(3/.test(css),
		"Phase H: BDC keeps external placement only；no ResultSummary internal grid／digit gap",
	);
	assert(
		!css.includes(".rs-value") &&
			!css.includes(".rs-label") &&
			!css.includes(".rs-primary") &&
			!css.includes(".rs-secondary") &&
			!css.includes(".rs-status"),
		"BDC CSS has no .rs-* internal overrides",
	);
	assert(
		css.includes("padding-inline: 0.75rem") || css.includes("padding-inline:0.75rem"),
		"Portrait result-group approved width inset retained",
	);
	assert(
		css.includes("--bdcv2-landscape-title-result-gap") &&
			css.includes("--bdcv2-landscape-stage-controls-gap"),
		"Landscape stage／controls external composition retained",
	);

	assert(
		/import ResultSummary/.test(component),
		"ResultSummary component imported",
	);
	assert(
		/<ResultSummary/.test(component),
		"ResultSummary rendered",
	);
	assert(
		(component.match(/<ResultSummary\b/g) || []).length === 1,
		"exactly one ResultSummary in BDC astro",
	);
	assert(
		!component.includes("data-bdcv2-result-days") &&
			!component.includes("data-bdcv2-result-digits") &&
			!component.includes("preview-tool-result-number") &&
			!component.includes("bdcv2-result-main") &&
			!component.includes("bdcv2-result-secondary"),
		"Phase H: legacy result subtree removed from markup",
	);
	assert(
		/business-days-layout-contract\.js/.test(component),
		"blocking layout contract script present",
	);
	assert(
		/TimivaBusinessDaysLayout\?\.applyLayoutAttrs\(document\)/.test(component),
		"inline initial layout bootstrap after ResultSummary",
	);
	assert(
		/initResultSummary/.test(component),
		"shared controller init in astro",
	);
	assert(
		component.includes('variant="spacious"'),
		"BDC uses spacious variant",
	);

	const rsCss = readFileSync(
		join(rootDir, "src/styles/tools/result-summary.css"),
		"utf8",
	);
	assert(
		/\[data-rs-layout="desktop"\] \.rs-secondary[\s\S]*?column-gap:\s*1\.875rem/.test(rsCss) &&
			/\[data-rs-layout="portrait"\] \.rs-secondary[\s\S]*?column-gap:\s*1\.875rem/.test(rsCss),
		"shared Desktop／Portrait secondary gap remains 1.875rem",
	);
	assert(
		/\[data-rs-layout="landscape"\][\s\S]*?grid-template-columns:\s*repeat\(3,\s*max-content\)/.test(
			rsCss,
		) &&
			/--rs-landscape-column-gap:\s*1\.75rem/.test(rsCss) &&
			/\[data-rs-digits="4"\][\s\S]*?--rs-landscape-column-gap:\s*2\.25rem/.test(rsCss) &&
			/\[data-rs-digits="5"\][\s\S]*?--rs-landscape-column-gap:\s*2\.75rem/.test(rsCss),
		"shared Landscape owns max-content grid + digit-aware column-gap",
	);

	const contract = readFileSync(
		join(rootDir, "public/scripts/business-days-layout-contract.js"),
		"utf8",
	);
	assert(/TimivaBusinessDaysLayout/.test(contract), "layout contract exposes TimivaBusinessDaysLayout");
	assert(
		/applyLayoutAttrs[\s\S]*?data-rs-layout/.test(contract),
		"contract applyLayoutAttrs sets data-rs-layout only",
	);
	assert(
		!/(applyLayoutAttrs|Initial layout bootstrap)[\s\S]{0,400}rs:update/.test(
			component + contract,
		),
		"initial bootstrap does not dispatch rs:update",
	);
	assert(
		!component.includes("readonly"),
		"B2A: inputs are no longer readonly",
	);
	assert(
		!component.includes("data-bdcv2-sheet-start-year") &&
			!component.includes("bdcv2-sheet-ymd-row"),
		"sheet no longer uses dual Y/M/D rows",
	);
	for (const marker of [
		"data-bdcv2-desktop-from-invalid",
		"data-bdcv2-desktop-to-invalid",
		"data-bdcv2-sheet-from-invalid",
		"data-bdcv2-sheet-to-invalid",
		"data-bdcv2-sheet-from",
		"data-bdcv2-sheet-to",
	]) {
		assert(component.includes(marker), `sheet/desktop marker present: ${marker}`);
	}

	// DBD 原檔未被修改為 BDC 專用（不含 bdcv2 標記）
	const dbdLib = readFileSync(join(rootDir, "src/lib/daysBetweenDatesDateInput.ts"), "utf8");
	const dbdScript = readFileSync(join(rootDir, "src/scripts/days-between-dates.ts"), "utf8");
	assert(!dbdLib.includes("bdcv2"), "DBD lib untouched by BDC");
	assert(!dbdScript.includes("bdcv2"), "DBD script untouched by BDC");
}

console.log(`passed=${passed} failed=${failed}`);
process.exit(failed === 0 ? 0 : 1);
