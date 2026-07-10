/**
 * Deterministic validation for ageCalculatorMath — no extra test dependencies.
 * Run: node scripts/validate-age-calculator-math.mjs
 */
import {
	addCalendarMonths,
	applySegmentInputChange,
	birthdayInYear,
	calculateAge,
	compareCalendarDates,
	daysInMonth,
	emptyDateSegments,
	extractDateDigits,
	formatSegmentsDisplay,
	formatSegmentsNormalized,
	getTodayCalendarDate,
	isValidBirthDate,
	isValidCalendarDate,
	isSegmentsComplete,
	isSegmentsEmpty,
	MIN_BIRTH_YEAR,
	parseBirthDateSegments,
	resolveInvalidBirthField,
	resolveInvalidBirthFields,
	shouldAutoAdvanceMobileMonth,
	shouldAutoAdvanceMobileYear,
	isSelectableBirthCalendarDate,
	isSelectableAsOfCalendarDate,
	parseAsOfDateSegments,
	resolveInvalidAsOfFields,
	formatCalendarDateDisplay,
	calendarDatesEqual,
	segmentsFromCalendarDate,
	segmentsFromPastedText,
	segmentsFromStreamDigits,
	splitMonthDayDigits,
} from "../src/lib/ageCalculatorMath.ts";

let passed = 0;
let failed = 0;

const FIXED_TODAY = { year: 2026, month: 7, day: 10 };

function assert(condition, message) {
	if (condition) {
		passed += 1;
		return;
	}

	failed += 1;
	console.error(`FAIL: ${message}`);
}

function assertAge(birth, asOf, expected, label) {
	const outcome = calculateAge(birth, asOf);

	assert(outcome.status === "ok", `${label}: status ok`);

	if (outcome.status !== "ok") {
		return;
	}

	const { completedYears, months, days, daysLived } = outcome.result;

	assert(
		completedYears === expected.completedYears,
		`${label}: completedYears ${completedYears} !== ${expected.completedYears}`,
	);
	assert(months === expected.months, `${label}: months ${months} !== ${expected.months}`);
	assert(days === expected.days, `${label}: days ${days} !== ${expected.days}`);
	assert(
		daysLived === expected.daysLived,
		`${label}: daysLived ${daysLived} !== ${expected.daysLived}`,
	);
}

function typeDigitsForward(startSegments, digits) {
	let segments = { ...startSegments };
	let caret = formatSegmentsDisplay(segments).length;

	for (const digit of digits) {
		const result = applySegmentInputChange(
			segments,
			"insertText",
			digit,
			caret,
			caret,
		);
		segments = result.segments;
		caret = result.caret;
	}

	return segments;
}

console.log("validate-age-calculator-math");

// Segment display
assert(
	formatSegmentsDisplay({ year: "1966", month: "4", day: "4" }) === "1966 / 4 / 4",
	"single-digit month/day display",
);
assert(
	formatSegmentsNormalized({ year: "1966", month: "4", day: "4" }) === "1966 / 04 / 04",
	"normalized month/day padding",
);
	assert(
		segmentsFromPastedText("19950812").year === "1995",
		"paste stream populates year segment",
	);
assert(
	formatSegmentsDisplay(segmentsFromPastedText("19950812")) === "1995 / 08 / 12",
	"paste stream display",
);

// Forward typing from blank
{
	const segments = typeDigitsForward(emptyDateSegments(), "19950812");
	assert(formatSegmentsDisplay(segments) === "1995 / 08 / 12", "forward typing full date");
}

function assertStreamDigits(digits, expectedDisplay, label) {
	const segments = typeDigitsForward(emptyDateSegments(), digits);
	assert(
		formatSegmentsDisplay(segments) === expectedDisplay,
		`${label}: display ${formatSegmentsDisplay(segments)} !== ${expectedDisplay}`,
	);
}

function assertStreamValid(digits, label) {
	const segments = typeDigitsForward(emptyDateSegments(), digits);
	assert(
		parseBirthDateSegments(segments, FIXED_TODAY) !== null,
		`${label}: expected valid birth date`,
	);
}

assertStreamDigits("1950820", "1950 / 8 / 20", "1950820 single-digit month");
assertStreamValid("1950820", "1950820");
assert(
	formatSegmentsNormalized(typeDigitsForward(emptyDateSegments(), "1950820")) ===
		"1950 / 08 / 20",
	"1950820 blur normalization",
);
assertStreamDigits("1950102", "1950 / 10 / 2", "1950102 month 10");
assertStreamValid("1950102", "1950102");
assertStreamDigits("1950131", "1950 / 1 / 31", "1950131 month 1 day 31");
assertStreamValid("1950131", "1950131");
assertStreamDigits("19500120", "1950 / 01 / 20", "19500120 month 01");
assertStreamValid("19500120", "19500120");
assertStreamDigits("199011", "1990 / 1 / 1", "199011 six-digit M/D");
assertStreamValid("199011", "199011");
assertStreamDigits("200055", "2000 / 5 / 5", "200055 single-digit month and day");
assertStreamValid("200055", "200055");
assertStreamDigits("2000131", "2000 / 1 / 31", "2000131 month 1 day 31");
assertStreamValid("2000131", "2000131");
assertStreamDigits("20001231", "2000 / 12 / 31", "20001231 month 12");
assertStreamValid("20001231", "20001231");
assertStreamDigits("19900101", "1990 / 01 / 01", "19900101 eight-digit MM/DD");
assertStreamValid("19900101", "19900101");
assertStreamDigits("19901101", "1990 / 11 / 01", "19901101 eight-digit month 11");
assertStreamValid("19901101", "19901101");

assert(
	splitMonthDayDigits("820", 1950).month === "8" &&
		splitMonthDayDigits("820", 1950).day === "20",
	"splitMonthDayDigits treats 8 as month not 82",
);
assert(
	splitMonthDayDigits("131", 2000).month === "1" &&
		splitMonthDayDigits("131", 2000).day === "31",
	"splitMonthDayDigits rejects month 13",
);
assert(
	splitMonthDayDigits("11", 1990).month === "1" &&
		splitMonthDayDigits("11", 1990).day === "1",
	"six-digit rest always M/D",
);
assert(
	splitMonthDayDigits("1101", 1990).month === "11" &&
		splitMonthDayDigits("1101", 1990).day === "01",
	"eight-digit rest always MM/DD",
);

// Mid-segment overwrite (collapsed caret and single-digit selection)
{
	const base = segmentsFromStreamDigits("19990104");

	const yearThirdCollapsed = applySegmentInputChange(base, "insertText", "5", 2, 2);
	assert(
		formatSegmentsDisplay(yearThirdCollapsed.segments) === "1959 / 01 / 04",
		"overwrite year digit 3 with collapsed caret",
	);

	const yearThirdSelected = applySegmentInputChange(base, "insertText", "5", 2, 3);
	assert(
		formatSegmentsDisplay(yearThirdSelected.segments) === "1959 / 01 / 04",
		"overwrite year digit 3 with single-digit selection",
	);

	const yearFourth = applySegmentInputChange(base, "insertText", "7", 3, 4);
	assert(
		formatSegmentsDisplay(yearFourth.segments) === "1997 / 01 / 04",
		"overwrite year digit 4 with selection",
	);

	const monthFirst = applySegmentInputChange(
		segmentsFromStreamDigits("19991204"),
		"insertText",
		"0",
		7,
		8,
	);
	assert(
		formatSegmentsDisplay(monthFirst.segments) === "1999 / 02 / 04",
		"overwrite month digit 1 keeps trailing digit",
	);

	const dayFirst = applySegmentInputChange(
		segmentsFromStreamDigits("19991224"),
		"insertText",
		"1",
		12,
		13,
	);
	assert(
		formatSegmentsDisplay(dayFirst.segments) === "1999 / 12 / 14",
		"overwrite day digit 1 keeps trailing digit",
	);
}

// Mid-delete then type must fill the hole, not eat trailing digits
{
	function deleteThenType(digits, deleteCaret, typedDigit) {
		const base = segmentsFromStreamDigits(digits);
		const afterDelete = applySegmentInputChange(
			base,
			"deleteContentBackward",
			null,
			deleteCaret,
			deleteCaret,
		);
		return applySegmentInputChange(
			afterDelete.segments,
			"insertText",
			typedDigit,
			afterDelete.caret,
			afterDelete.caret,
		);
	}

	assert(
		formatSegmentsDisplay(deleteThenType("19990104", 3, "5").segments) ===
			"1959 / 01 / 04",
		"delete year digit 3 then type 5 restores 1959",
	);
	assert(
		formatSegmentsDisplay(deleteThenType("19990104", 4, "7").segments) ===
			"1997 / 01 / 04",
		"delete year digit 4 then type 7 restores 1997",
	);
	assert(
		formatSegmentsDisplay(deleteThenType("19991204", 8, "0").segments) ===
			"1999 / 02 / 04",
		"delete month digit 1 then type 0 restores 02",
	);
	assert(
		formatSegmentsDisplay(deleteThenType("19991224", 13, "1").segments) ===
			"1999 / 12 / 14",
		"delete day digit 1 then type 1 restores 14",
	);
}

// Deleting one segment must not clear siblings
{
	const base = segmentsFromStreamDigits("19990104");

	let caret = 4;
	let segments = base;
	for (let index = 0; index < 4; index += 1) {
		const result = applySegmentInputChange(
			segments,
			"deleteContentBackward",
			null,
			caret,
			caret,
		);
		segments = result.segments;
		caret = result.caret;
	}

	assert(
		formatSegmentsDisplay(segments) === " / 01 / 04",
		"deleting year keeps month/day visible",
	);
	assert(segments.month === "01" && segments.day === "04", "year delete preserves month/day values");
	assert(!isSegmentsComplete(segments), "empty year is incomplete");

	const clearYearSelection = applySegmentInputChange(base, "deleteContentBackward", null, 0, 4);
	assert(
		formatSegmentsDisplay(clearYearSelection.segments) === " / 01 / 04",
		"select-all year delete keeps month/day",
	);

	const clearMonth = applySegmentInputChange(base, "deleteContentBackward", null, 7, 9);
	assert(
		formatSegmentsDisplay(clearMonth.segments) === "1999 /  / 04",
		"deleting month keeps year/day",
	);

	const clearDay = applySegmentInputChange(base, "deleteContentBackward", null, 12, 14);
	assert(
		formatSegmentsDisplay(clearDay.segments) === "1999 / 01 / ",
		"deleting day keeps year/month slot",
	);
}

// Editing year digit should not shift month/day
{
	let segments = segmentsFromStreamDigits("19950812");
	const result = applySegmentInputChange(segments, "insertText", "0", 1, 1);
	segments = result.segments;
	assert(
		formatSegmentsDisplay(segments) === "1095 / 08 / 12",
		"replace year digit without shifting other segments",
	);
}

// Flexible month/day parsing
assert(
	parseBirthDateSegments({ year: "1966", month: "4", day: "4" }, FIXED_TODAY)?.month === 4,
	"1966/4/4 valid",
);
assert(
	parseBirthDateSegments({ year: "1966", month: "04", day: "4" }, FIXED_TODAY)?.day === 4,
	"1966/04/4 valid",
);
assert(
	parseBirthDateSegments({ year: "1966", month: "4", day: "04" }, FIXED_TODAY)?.day === 4,
	"1966/4/04 valid",
);

// Birth year range
assert(MIN_BIRTH_YEAR === 1900, "minimum birth year is 1900");
assert(isValidBirthDate(1900, 1, 1, FIXED_TODAY), "1900-01-01 valid");
assert(!isValidBirthDate(1899, 12, 31, FIXED_TODAY), "1899-12-31 invalid");
assert(parseBirthDateSegments({ year: "0001", month: "01", day: "01" }, FIXED_TODAY) === null, "0001 rejected");
assert(parseBirthDateSegments({ year: "1899", month: "12", day: "31" }, FIXED_TODAY) === null, "1899 rejected");
assert(parseBirthDateSegments({ year: "1900", month: "01", day: "01" }, FIXED_TODAY)?.year === 1900, "1900 accepted");
assert(parseBirthDateSegments({ year: "9999", month: "01", day: "01" }, FIXED_TODAY) === null, "9999 rejected");
assert(parseBirthDateSegments({ year: "2030", month: "01", day: "01" }, FIXED_TODAY) === null, "future rejected");

// Invalid calendar dates
assert(!isValidCalendarDate(2025, 2, 30), "Feb 30 fails validation");
assert(
	parseBirthDateSegments({ year: "2025", month: "02", day: "30" }, FIXED_TODAY) === null,
	"Feb 30 rejected",
);
assert(daysInMonth(2025, 2) === 28, "Feb 2025 has 28 days");

// Mobile invalid field targeting
assert(
	resolveInvalidBirthField({ year: "199", month: "1", day: "4" }, FIXED_TODAY) === null,
	"incomplete year has no invalid field",
);
assert(
	resolveInvalidBirthField({ year: "1899", month: "01", day: "04" }, FIXED_TODAY) === "year",
	"year below 1900 targets year field",
);
assert(
	resolveInvalidBirthField({ year: "1999", month: "13", day: "04" }, FIXED_TODAY) === "month",
	"month 13 targets month field",
);
assert(
	resolveInvalidBirthField({ year: "1999", month: "01", day: "32" }, FIXED_TODAY) === "day",
	"day 32 targets day field",
);
assert(
	resolveInvalidBirthField({ year: "2025", month: "02", day: "30" }, FIXED_TODAY) === "day",
	"impossible date targets day field",
);
assert(
	resolveInvalidBirthField({ year: "2026", month: "12", day: "31" }, FIXED_TODAY) === "day",
	"future date targets day field",
);
assert(
	resolveInvalidBirthField({ year: "2030", month: "01", day: "01" }, FIXED_TODAY) === "year",
	"future year targets year field",
);
assert(
	resolveInvalidBirthField({ year: "1999", month: "1", day: "4" }, FIXED_TODAY) === null,
	"valid unpadded date has no invalid field",
);

{
	const multi = resolveInvalidBirthFields(
		{ year: "1500", month: "66", day: "35" },
		FIXED_TODAY,
	);
	assert(
		multi.includes("year") && multi.includes("month") && multi.includes("day"),
		"1500/66/35 marks year+month+day invalid",
	);
}

assert(
	JSON.stringify(
		resolveInvalidBirthFields({ year: "1999", month: "13", day: "4" }, FIXED_TODAY),
	) === JSON.stringify(["month"]),
	"1999/13/4 marks only month invalid",
);
assert(
	JSON.stringify(
		resolveInvalidBirthFields({ year: "1999", month: "2", day: "30" }, FIXED_TODAY),
	) === JSON.stringify(["day"]),
	"1999/2/30 marks only day invalid",
);

assert(shouldAutoAdvanceMobileYear("1999"), "year 1999 auto-advances");
assert(!shouldAutoAdvanceMobileYear("199"), "year 199 does not auto-advance");
assert(shouldAutoAdvanceMobileMonth("8"), "month 8 auto-advances");
assert(!shouldAutoAdvanceMobileMonth("1"), "month 1 waits for second digit");
assert(!shouldAutoAdvanceMobileMonth("0"), "month 0 waits for second digit");
assert(shouldAutoAdvanceMobileMonth("10"), "month 10 auto-advances");
assert(shouldAutoAdvanceMobileMonth("12"), "month 12 auto-advances");

assert(
	isSelectableBirthCalendarDate({ year: 1999, month: 1, day: 4 }, FIXED_TODAY),
	"1999-01-04 selectable",
);
assert(
	!isSelectableBirthCalendarDate({ year: 1899, month: 12, day: 31 }, FIXED_TODAY),
	"1899 not selectable",
);
assert(
	!isSelectableBirthCalendarDate({ year: 2026, month: 12, day: 31 }, FIXED_TODAY),
	"future date not selectable",
);
assert(
	isSelectableBirthCalendarDate(FIXED_TODAY, FIXED_TODAY),
	"today is selectable",
);
assert(
	formatSegmentsNormalized(
		segmentsFromCalendarDate({ year: 1999, month: 1, day: 4 }),
	) === "1999 / 01 / 04",
	"calendar date formats as YYYY / MM / DD",
);

assert(
	isSelectableAsOfCalendarDate({ year: 2020, month: 1, day: 1 }, FIXED_TODAY),
	"as-of past date selectable",
);
assert(
	!isSelectableAsOfCalendarDate({ year: 2026, month: 12, day: 31 }, FIXED_TODAY),
	"as-of future not selectable",
);
assert(
	parseAsOfDateSegments({ year: "2020", month: "06", day: "15" }, FIXED_TODAY)?.day === 15,
	"as-of parse accepts past date",
);
assert(
	parseAsOfDateSegments({ year: "2030", month: "01", day: "01" }, FIXED_TODAY) === null,
	"as-of parse rejects future",
);
assert(
	JSON.stringify(
		resolveInvalidAsOfFields(
			{ year: "1990", month: "01", day: "01" },
			FIXED_TODAY,
			{ year: 1999, month: 1, day: 4 },
		),
	) === JSON.stringify(["day"]),
	"as-of before birth marks day invalid",
);
assert(
	formatCalendarDateDisplay({ year: 1999, month: 1, day: 4 }) === "1999 / 01 / 04",
	"formatCalendarDateDisplay pads segments",
);
assert(
	calendarDatesEqual(FIXED_TODAY, { year: 2026, month: 7, day: 10 }),
	"calendarDatesEqual matches",
);

// Completion rules
assert(!isSegmentsComplete({ year: "1995", month: "8", day: "" }), "missing day is incomplete");
assert(isSegmentsComplete({ year: "1995", month: "8", day: "12" }), "1-digit month with day is complete");

// Delete backward from end clears progressively
{
	let segments = segmentsFromStreamDigits("19950812");
	let caret = formatSegmentsDisplay(segments).length;

	for (let index = 0; index < 20; index += 1) {
		const result = applySegmentInputChange(
			segments,
			"deleteContentBackward",
			null,
			caret,
			caret,
		);
		segments = result.segments;
		caret = result.caret;

		if (isSegmentsEmpty(segments)) {
			break;
		}
	}

	assert(isSegmentsEmpty(segments), "backspace from end clears to empty");
}

// Clear all selection
{
	const segments = segmentsFromStreamDigits("19950812");
	const formatted = formatSegmentsDisplay(segments);
	const result = applySegmentInputChange(
		segments,
		"clearAll",
		null,
		0,
		formatted.length,
	);
	assert(isSegmentsEmpty(result.segments), "clear all empties segments");
}

// General birthday
assertAge(
	{ year: 1995, month: 8, day: 12 },
	FIXED_TODAY,
	{ completedYears: 30, months: 10, days: 28, daysLived: 11290 },
	"general birthday",
);

// Birthday same day
assertAge(
	{ year: 2000, month: 1, day: 15 },
	{ year: 2026, month: 1, day: 15 },
	{ completedYears: 26, months: 0, days: 0, daysLived: 9497 },
	"birthday same day",
);

// Day after birth
assertAge(
	{ year: 2000, month: 1, day: 15 },
	{ year: 2000, month: 1, day: 16 },
	{ completedYears: 0, months: 0, days: 1, daysLived: 1 },
	"day after birth",
);

// Leap year Feb 29 birthday
assertAge(
	{ year: 2000, month: 2, day: 29 },
	{ year: 2024, month: 2, day: 29 },
	{ completedYears: 24, months: 0, days: 0, daysLived: 8766 },
	"leap year anniversary on Feb 29",
);

// Non-leap year Feb 29 birthday uses Mar 1 anniversary
assertAge(
	{ year: 2000, month: 2, day: 29 },
	{ year: 2023, month: 2, day: 28 },
	{ completedYears: 22, months: 11, days: 27, daysLived: 8400 },
	"non-leap Feb 28 before Mar 1 anniversary",
);

assertAge(
	{ year: 2000, month: 2, day: 29 },
	{ year: 2023, month: 3, day: 1 },
	{ completedYears: 23, months: 0, days: 0, daysLived: 8401 },
	"non-leap Mar 1 anniversary",
);

// Birthday anniversary helper
{
	const anniv = birthdayInYear({ year: 2000, month: 2, day: 29 }, 2023);
	assert(anniv.month === 3 && anniv.day === 1, "Feb 29 non-leap anniversary is Mar 1");
}

// addCalendarMonths end-of-month clamp
{
	const next = addCalendarMonths({ year: 2025, month: 1, day: 31 }, 1);
	assert(next.month === 2 && next.day === 28, "Jan 31 + 1 month clamps to Feb 28");
}

// compareCalendarDates ordering
assert(
	compareCalendarDates(
		{ year: 2025, month: 1, day: 1 },
		{ year: 2025, month: 1, day: 2 },
	) < 0,
	"compare dates ascending",
);

// getTodayCalendarDate uses local components
{
	const today = getTodayCalendarDate(new Date(2026, 6, 5, 15, 30, 0));
	assert(today.year === 2026 && today.month === 7 && today.day === 5, "today local date");
}

// Paste slash-separated flexible widths
assert(
	formatSegmentsDisplay(segmentsFromPastedText("1966/4/4")) === "1966 / 4 / 4",
	"paste slash-separated flexible segments",
);

assert(extractDateDigits("1995/08/12") === "19950812", "extract slashes");

console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
	process.exit(1);
}
