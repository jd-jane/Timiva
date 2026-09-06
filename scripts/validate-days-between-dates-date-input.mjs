/**
 * Deterministic validation for Days Between Dates:
 * - B2A Smart Date Input
 * - B2B day-difference / weeks-and-days / Include both
 * Run: node scripts/validate-days-between-dates-date-input.mjs
 */
import {
	applySegmentInputChange,
	emptyDateSegments,
	formatCalendarDateCompact,
	formatSegmentsDisplay,
	formatSegmentsNormalized,
	isEntryCompleteForAutoFocus,
	normalizeSegmentsForBlur,
	parseDateInputText,
	parseDateRangePaste,
	extractDateRangeTokens,
	resolveFieldStatus,
	segmentsFromPastedText,
	segmentsFromStreamDigits,
} from "../src/lib/daysBetweenDatesDateInput.ts";
import {
	absoluteDayDifference,
	computeDaysBetweenResult,
	computeDisplayedDays,
	formatPrimaryDayUnit,
	formatWeeksAndDaysLine,
	splitWeeksAndDays,
} from "../src/lib/daysBetweenDatesMath.ts";
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

console.log("validate-days-between-dates-date-input");

// --- Pure numeric: paste + 逐鍵 parity ---
assertTypedAndPasted("199011", "1990 / 11", "6-digit 199011 → month 11 waiting for day");
assertTypedAndPasted("202011", "2020 / 11", "6-digit 202011 → month 11 waiting for day");
assertTypedAndPasted("202451", "2024 / 05 / 01", "6-digit 202451 → M/D when month not 01–12 ambiguous");
assertTypedAndPasted("1950820", "1950 / 08 / 20", "7-digit 1950820");
assertTypedAndPasted("1950102", "1950 / 10 / 02", "7-digit 1950102");
assertTypedAndPasted("1950131", "1950 / 01 / 31", "7-digit 1950131");
assertTypedAndPasted("19900101", "1990 / 01 / 01", "8-digit 19900101");
assertTypedAndPasted("19991122", "1999 / 11 / 22", "8-digit 19991122");
assertTypedAndPasted("19991231", "1999 / 12 / 31", "8-digit 19991231");
assertTypedAndPasted("20001102", "2000 / 11 / 02", "8-digit 20001102");

// Continuous: 6-digit mid-state must NOT auto-focus
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

{
	let segments = {
		...emptyDateSegments(),
		year: "2000",
		month: "12",
		day: "",
		openMonth: true,
		openDay: true,
		preferStream: false,
	};
	segments = typeDigitsForward(segments, "3");
	assert(
		formatSegmentsNormalized(segments) === "2000 / 12 / 03",
		`segment 2000/12/3 (got ${formatSegmentsNormalized(segments)})`,
	);
}

assertParse("2024/2/29", { year: 2024, month: 2, day: 29 }, "leap valid");
assertParse("2023/2/29", null, "non-leap invalid");
assertParse("1900/1/1", { year: 1900, month: 1, day: 1 }, "min bound");
assertParse("2100/12/31", { year: 2100, month: 12, day: 31 }, "max bound");
assertParse("1899/12/31", null, "below min");
assertParse("2101/01/01", null, "above max");

// Incomplete should not be invalid
assert(resolveFieldStatus(segmentsFromStreamDigits("1990")) === "incomplete", "year-only incomplete");
assert(resolveFieldStatus(emptyDateSegments()) === "empty", "empty");

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

assert(
	formatCalendarDateCompact({ year: 1990, month: 1, day: 1 }) === "1990/01/01",
	"compact format",
);

assert(
	formatSegmentsNormalized(normalizeSegmentsForBlur(segmentsFromPastedText("2021/1/1"))) ===
		"2021 / 01 / 01",
	"blur normalize",
);

// Paste month-only 6-digit（10–12）is incomplete — not auto-focus complete
{
	const pasted6 = segmentsFromPastedText("199011");
	assert(
		isEntryCompleteForAutoFocus(pasted6, { fromPaste: true }) === false,
		"paste 6-digit month-11 waiting for day is not complete",
	);
	const pasted8 = segmentsFromPastedText("19901101");
	assert(
		isEntryCompleteForAutoFocus(pasted8, { fromPaste: true }) === true,
		"paste 8-digit valid may auto-focus",
	);
}

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

	assertRange(
		"2026/07/08-2026/09/17",
		"2026 / 07 / 08",
		"2026 / 09 / 17",
		"hyphen range",
	);
	assertRange(
		"2026-07-08 — 2026-09-17",
		"2026 / 07 / 08",
		"2026 / 09 / 17",
		"en-dash ISO range",
	);
	assertRange(
		"2026-07-08 – 2026-09-17",
		"2026 / 07 / 08",
		"2026 / 09 / 17",
		"en dash range",
	);
	assertRange(
		"2026/7/8 至 2026/9/17",
		"2026 / 07 / 08",
		"2026 / 09 / 17",
		"zh 至 range",
	);
	assertRange(
		"2026/07/08 到 2026/09/17",
		"2026 / 07 / 08",
		"2026 / 09 / 17",
		"zh 到 range",
	);
	assertRange(
		"2026-07-08 to 2026-09-17",
		"2026 / 07 / 08",
		"2026 / 09 / 17",
		"to range",
	);
	assertRange(
		"2026/07/08 ~ 2026/09/17",
		"2026 / 07 / 08",
		"2026 / 09 / 17",
		"tilde range",
	);
	assertRange(
		"2026/07/08 ～ 2026/09/17",
		"2026 / 07 / 08",
		"2026 / 09 / 17",
		"fullwidth tilde range",
	);
	assertRange(
		"2026/09/17-2026/07/08",
		"2026 / 09 / 17",
		"2026 / 07 / 08",
		"reverse range tokens",
	);

	const daysOff = absoluteDayDifference(
		{ year: 2026, month: 7, day: 8 },
		{ year: 2026, month: 9, day: 17 },
	);
	assert(daysOff === 71, `range day diff off = 71 (got ${daysOff})`);
	assert(computeDisplayedDays(71, true) === 72, "range include on = 72");
	assert(
		formatWeeksAndDaysLine(71, "en") === "10 weeks and 1 day",
		"71 → 10 weeks and 1 day",
	);
	assert(
		formatWeeksAndDaysLine(72, "en") === "10 weeks and 2 days",
		"72 → 10 weeks and 2 days",
	);

	assert(parseDateRangePaste("2026-07-08") === null, "single ISO date not split");
	assert(parseDateRangePaste("2026/7/8") === null, "single slash date not split");
	assert(parseDateRangePaste("19991122") === null, "single 8-digit not split");
	assert(extractDateRangeTokens("2026-07-08") === null, "extract single ISO → null");

	{
		const invalidRange = parseDateRangePaste("2023/02/29-2023/03/01");
		assert(invalidRange !== null, "invalid range still extracts two tokens");
		if (invalidRange) {
			assert(
				resolveFieldStatus(invalidRange.from) === "invalid",
				"invalid range from status",
			);
			assert(
				resolveFieldStatus(invalidRange.to) === "valid",
				"invalid range to still valid",
			);
			assert(
				computeDaysBetweenResult(
					parseDateInputText("2023/02/29").date,
					parseDateInputText("2023/03/01").date,
					false,
				) === 0,
				"invalid range result stays 0",
			);
		}
	}

	assert(
		formatSegmentsNormalized(normalizeSegmentsForBlur(segmentsFromPastedText("2026-07-08"))) ===
			"2026 / 07 / 08",
		"single ISO paste still works via single-field parser",
	);
	assert(
		formatSegmentsNormalized(normalizeSegmentsForBlur(segmentsFromPastedText("19991122"))) ===
			"1999 / 11 / 22",
		"single 8-digit paste still works",
	);
}

// --- B2B day difference / weeks and days / Include both ---
{
	const d = (year, month, day) => ({ year, month, day });

	assert(computeDaysBetweenResult(null, null, false) === 0, "empty → 0");
	assert(computeDaysBetweenResult(d(2026, 7, 11), null, false) === 0, "one-sided → 0");

	assert(
		absoluteDayDifference(d(2026, 7, 11), d(2026, 7, 11)) === 0,
		"same day base 0",
	);
	assert(
		computeDisplayedDays(0, false) === 0 && computeDisplayedDays(0, true) === 1,
		"same day include off/on → 0 / 1",
	);

	const normal = absoluteDayDifference(d(2026, 7, 1), d(2026, 7, 10));
	const reverse = absoluteDayDifference(d(2026, 7, 10), d(2026, 7, 1));
	assert(normal === 9 && reverse === 9, "normal/reverse absolute 9");
	assert(computeDisplayedDays(9, false) === 9, "normal include off 9");
	assert(computeDisplayedDays(9, true) === 10, "normal include on 10");

	const exactWeeks = absoluteDayDifference(d(2026, 7, 1), d(2026, 7, 15));
	assert(exactWeeks === 14, "exact weeks base 14");
	assert(computeDisplayedDays(14, true) === 15, "exact weeks include on 15");

	assert(
		absoluteDayDifference(d(2024, 2, 28), d(2024, 3, 1)) === 2,
		"leap 2024-02-28 → 03-01 = 2",
	);
	assert(
		absoluteDayDifference(d(2023, 2, 28), d(2023, 3, 1)) === 1,
		"non-leap 2023-02-28 → 03-01 = 1",
	);

	assert(
		absoluteDayDifference(d(2026, 7, 11), d(2100, 12, 31)) > 0,
		"future 2100-12-31 computable",
	);

	assert(
		JSON.stringify(splitWeeksAndDays(9)) === JSON.stringify({ weeks: 1, remainingDays: 2 }),
		"9 → 1w 2d",
	);
	assert(
		JSON.stringify(splitWeeksAndDays(10)) === JSON.stringify({ weeks: 1, remainingDays: 3 }),
		"10 → 1w 3d",
	);
	assert(
		JSON.stringify(splitWeeksAndDays(14)) === JSON.stringify({ weeks: 2, remainingDays: 0 }),
		"14 → 2w 0d",
	);
	assert(
		JSON.stringify(splitWeeksAndDays(1)) === JSON.stringify({ weeks: 0, remainingDays: 1 }),
		"1 → 0w 1d",
	);

	assert(formatPrimaryDayUnit(0, "en") === "days", "EN 0 days");
	assert(formatPrimaryDayUnit(1, "en") === "day", "EN 1 day");
	assert(formatPrimaryDayUnit(2, "en") === "days", "EN 2 days");
	assert(formatPrimaryDayUnit(1, "zh") === "天", "ZH unit 天");

	assert(formatWeeksAndDaysLine(0, "en") === "0 weeks and 0 days", "EN 0w 0d");
	assert(formatWeeksAndDaysLine(1, "en") === "0 weeks and 1 day", "EN 0w 1d");
	assert(formatWeeksAndDaysLine(7, "en") === "1 week and 0 days", "EN 1w 0d");
	assert(formatWeeksAndDaysLine(8, "en") === "1 week and 1 day", "EN 1w 1d");
	assert(formatWeeksAndDaysLine(17, "en") === "2 weeks and 3 days", "EN 2w 3d");
	assert(formatWeeksAndDaysLine(0, "zh") === "0 週又 0 天", "ZH 0w 0d");
	assert(formatWeeksAndDaysLine(8, "zh") === "1 週又 1 天", "ZH 1w 1d");
	assert(formatWeeksAndDaysLine(17, "zh") === "2 週又 3 天", "ZH 2w 3d");

	// Invalid date input still invalid; result path uses both-valid gate in UI
	assertParse("2023/2/29", null, "invalid reset source 2023/2/29");
}

// --- Mobile sheet / landscape keyboard anti-regression (static) ---
{
	const script = readFileSync(join(rootDir, "src/scripts/days-between-dates.ts"), "utf8");
	const css = readFileSync(join(rootDir, "src/styles/tools/days-between-dates-v2.css"), "utf8");

	assert(
		script.includes("stabilizePageScroll"),
		"sheet script keeps stabilizePageScroll (prevent lower-content jump)",
	);
	assert(
		/if\s*\(\s*landscapeMq\.matches\s*\)\s*\{[\s\S]*?clearKeyboardSync\(\)/.test(script),
		"landscape keyboard must clearKeyboardSync (no whole-sheet lift; Age-aligned)",
	);

	const landscapeBlock = script.match(
		/if\s*\(\s*landscapeMq\.matches\s*\)\s*\{[\s\S]*?\n\t\t\}/,
	)?.[0] ?? "";
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
		"DBD landscape compact max-height override present",
	);
	assert(
		css.includes("height: fit-content") || css.includes("height:fit-content"),
		"DBD landscape compact uses content-driven height",
	);
	assert(
		script.includes("computeDaysBetweenResult") && script.includes("syncResultDisplay"),
		"B2B result sync wired",
	);
	assert(
		script.includes("includeBothDates") && script.includes("data-dbdv2-include-toggle"),
		"B2B Include both dates toggle wired",
	);
	assert(
		script.includes("data-dbdv2-result-digits") && script.includes("digitBucket"),
		"digit-aware result scale attribute wired",
	);
	assert(
		css.includes('data-dbdv2-result-digits="5"') &&
			css.includes("clamp(5.5rem, 27vw, 7rem)"),
		"portrait 5-digit result scale CSS present",
	);
}

/**
 * Typing stability：preferStream + stale DOM caret 不得反向重排 digits。
 * 對應真人快速輸入偶發 2020→220/0、1945→145/9。
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
	const yearCases = ["1945", "2020", "1980", "2000"];
	for (const year of yearCases) {
		for (const lag of [0, 1, 2, 3]) {
			for (let i = 0; i < 30; i += 1) {
				const typed = typeDigitsWithCaretLag(year, lag);
				assert(
					formatSegmentsDisplay(typed) === year && typed.year === year,
					`DBD year ${year} caret-lag=${lag} repeat=${i} (got ${formatSegmentsDisplay(typed)})`,
				);
				assert(typed.preferStream === true, `DBD ${year} lag=${lag} keeps preferStream`);
			}
		}
	}

	const paused = typeDigitsForward(emptyDateSegments(), "202");
	assert(paused.preferStream === true, "202 mid keeps preferStream");
	const afterStale = applySegmentInputChange(
		paused,
		"insertText",
		"0",
		Math.max(0, formatSegmentsDisplay(paused).length - 2),
		Math.max(0, formatSegmentsDisplay(paused).length - 2),
	);
	assert(
		formatSegmentsDisplay(afterStale.segments) === "2020",
		`202 then 0 with stale caret → 2020 (got ${formatSegmentsDisplay(afterStale.segments)})`,
	);

	/* End-Backspace 必須保持 preferStream，續打不得跳 month */
	{
		let year = typeDigitsForward(emptyDateSegments(), "1945");
		assert(year.preferStream === true, "1945 keeps preferStream");
		const afterBs = applySegmentInputChange(
			year,
			"deleteContentBackward",
			null,
			formatSegmentsDisplay(year).length,
			formatSegmentsDisplay(year).length,
		);
		assert(
			formatSegmentsDisplay(afterBs.segments) === "194" &&
				afterBs.segments.preferStream === true,
			`end-backspace keeps stream (got ${formatSegmentsDisplay(afterBs.segments)} prefer=${afterBs.segments.preferStream})`,
		);
		const resumed = applySegmentInputChange(
			afterBs.segments,
			"insertText",
			"5",
			afterBs.caret,
			afterBs.caret,
		);
		assert(
			formatSegmentsDisplay(resumed.segments) === "1945",
			`backspace then 5 → 1945 (got ${formatSegmentsDisplay(resumed.segments)})`,
		);
	}
}

console.log(`passed=${passed} failed=${failed}`);
process.exit(failed === 0 ? 0 : 1);
