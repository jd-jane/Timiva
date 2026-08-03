/**
 * Deterministic validation for dateCalculatorMath — B2.1 pure civil arithmetic.
 * No extra test dependencies. Does not exercise UI／DOM／i18n.
 *
 * Run: node scripts/validate-date-calculator-math.mjs
 */
import {
	DATE_CALCULATOR_MAX,
	DATE_CALCULATOR_MIN,
	calculateDate,
	civilToDayNumber,
	compareCivilDates,
	dayNumberToCivil,
	daysInMonth,
	isCivilDateInRange,
	isLeapYear,
	isValidCivilDate,
	isValidSupportedStartDate,
} from "../src/lib/dateCalculatorMath.ts";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const mathSourcePath = join(rootDir, "src/lib/dateCalculatorMath.ts");

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

function d(year, month, day) {
	return { year, month, day };
}

function duration(years = 0, months = 0, weeks = 0, days = 0) {
	return { years, months, weeks, days };
}

function assertSuccess(start, direction, dur, expected, label) {
	const result = calculateDate(start, direction, dur);
	assert(result.ok === true, `${label}: expected success`);
	if (!result.ok) {
		return;
	}
	assert(
		result.date.year === expected.year &&
			result.date.month === expected.month &&
			result.date.day === expected.day,
		`${label}: got ${result.date.year}-${result.date.month}-${result.date.day}, expected ${expected.year}-${expected.month}-${expected.day}`,
	);
}

function assertFailure(start, direction, dur, reason, unit, label) {
	const result = calculateDate(start, direction, dur);
	assert(result.ok === false, `${label}: expected failure`);
	if (result.ok) {
		return;
	}
	assert(result.reason === reason, `${label}: reason ${result.reason} !== ${reason}`);
	if (unit !== undefined) {
		assert(result.unit === unit, `${label}: unit ${result.unit} !== ${unit}`);
	}
}

console.log("validate-date-calculator-math");

// ---------------------------------------------------------------------------
// Static forbidden constructs（no Date／ms／user-sized loops as arithmetic core）
// ---------------------------------------------------------------------------
{
	const source = readFileSync(mathSourcePath, "utf8");
	const forbidden = [
		{ re: /\bDate\.UTC\b/, label: "Date.UTC" },
		{ re: /\bnew\s+Date\b/, label: "new Date" },
		{ re: /\bgetTime\b/, label: "getTime" },
		{ re: /\bsetTime\b/, label: "setTime" },
		{ re: /\b86400000\b/, label: "86400000" },
		{ re: /\b86_400_000\b/, label: "86_400_000" },
		{ re: /24\s*\*\s*60\s*\*\s*60\s*\*\s*1000/, label: "24*60*60*1000" },
	];

	for (const item of forbidden) {
		assert(!item.re.test(source), `math source must not use ${item.label}`);
	}

	// No duration-proportional day／week loops
	assert(
		!/\bfor\s*\([^)]*(days|weeks|amount|delta)/i.test(source),
		"math source must not loop over days／weeks by duration",
	);
	assert(
		!/\bwhile\s*\([^)]*(days|weeks)/i.test(source),
		"math source must not while-loop over days／weeks",
	);
}

// ---------------------------------------------------------------------------
// Leap／Gregorian helpers
// ---------------------------------------------------------------------------
assert(isLeapYear(1900) === false, "1900 is not a leap year");
assert(isLeapYear(2000) === true, "2000 is a leap year");
assert(isLeapYear(2100) === false, "2100 is not a leap year");
assert(isLeapYear(2200) === false, "2200 is not a leap year");
assert(isLeapYear(2024) === true, "2024 is a leap year");
assert(daysInMonth(2024, 2) === 29, "2024-02 has 29 days");
assert(daysInMonth(2025, 2) === 28, "2025-02 has 28 days");
assert(daysInMonth(2028, 2) === 29, "2028-02 has 29 days");
assert(daysInMonth(2026, 1) === 31, "2026-01 has 31 days");
assert(daysInMonth(2026, 4) === 30, "2026-04 has 30 days");

assert(isValidCivilDate(d(2024, 2, 29)) === true, "2024-02-29 valid");
assert(isValidCivilDate(d(2025, 2, 29)) === false, "2025-02-29 invalid");
assert(isValidCivilDate(d(2026, 13, 1)) === false, "month 13 invalid");
assert(isValidCivilDate(d(2026, 0, 1)) === false, "month 0 invalid");
assert(isValidSupportedStartDate(d(1899, 12, 31)) === false, "below min start");
assert(isValidSupportedStartDate(d(2201, 1, 1)) === false, "above max start");
assert(isValidSupportedStartDate(DATE_CALCULATOR_MIN) === true, "min start ok");
assert(isValidSupportedStartDate(DATE_CALCULATOR_MAX) === true, "max start ok");
assert(isCivilDateInRange(DATE_CALCULATOR_MIN) === true, "min in range");
assert(isCivilDateInRange(DATE_CALCULATOR_MAX) === true, "max in range");

// Ordinal round-trip（civil arithmetic primitive）
{
	const samples = [
		d(1900, 1, 1),
		d(1970, 1, 1),
		d(2000, 2, 29),
		d(2026, 7, 26),
		d(2200, 12, 31),
	];
	for (const sample of samples) {
		const back = dayNumberToCivil(civilToDayNumber(sample));
		assert(
			compareCivilDates(sample, back) === 0,
			`ordinal round-trip ${sample.year}-${sample.month}-${sample.day}`,
		);
	}
	assert(
		civilToDayNumber(d(1970, 1, 2)) - civilToDayNumber(d(1970, 1, 1)) === 1,
		"adjacent day numbers differ by 1",
	);
}

// ---------------------------------------------------------------------------
// Basic／representative results
// ---------------------------------------------------------------------------
assertSuccess(
	d(2024, 2, 29),
	"add",
	duration(1, 0, 0, 0),
	d(2025, 2, 28),
	"2024-02-29 + 1 year",
);
assertSuccess(
	d(2024, 2, 29),
	"add",
	duration(1, 1, 0, 0),
	d(2025, 3, 28),
	"2024-02-29 + 1 year + 1 month",
);
assertSuccess(
	d(2026, 1, 31),
	"add",
	duration(0, 1, 0, 0),
	d(2026, 2, 28),
	"2026-01-31 + 1 month",
);
assertSuccess(
	d(2028, 1, 31),
	"add",
	duration(0, 1, 0, 0),
	d(2028, 2, 29),
	"2028-01-31 + 1 month leap",
);
assertSuccess(
	d(2026, 3, 31),
	"subtract",
	duration(0, 1, 0, 0),
	d(2026, 2, 28),
	"2026-03-31 - 1 month",
);
assertSuccess(
	d(2026, 7, 12),
	"add",
	duration(0, 0, 3, 0),
	d(2026, 8, 2),
	"2026-07-12 + 3 weeks",
);
assertSuccess(
	d(2026, 7, 12),
	"add",
	duration(0, 0, 0, 0),
	d(2026, 7, 12),
	"zero duration returns start",
);
assertSuccess(
	d(2024, 2, 29),
	"subtract",
	duration(1, 0, 0, 0),
	d(2023, 2, 28),
	"2024-02-29 - 1 year",
);

// Mixed order Year → Month → Week → Day
assertSuccess(
	d(2024, 1, 31),
	"add",
	duration(1, 1, 1, 1),
	d(2025, 3, 8),
	"mixed +1y +1m +1w +1d from 2024-01-31",
);
// Step trace: 2024-01-31 +1y → 2025-01-31; +1m → 2025-02-28; +1w → 2025-03-07; +1d → 2025-03-08

assertSuccess(
	d(2026, 6, 15),
	"subtract",
	duration(0, 0, 2, 3),
	d(2026, 5, 29),
	"subtract 2 weeks 3 days",
);

// Months > 11 as single month step
assertSuccess(
	d(2026, 1, 15),
	"add",
	duration(0, 18, 0, 0),
	d(2027, 7, 15),
	"18 months stays one month step",
);

// Weeks > 52
assertSuccess(
	d(2026, 1, 1),
	"add",
	duration(0, 0, 53, 0),
	d(2027, 1, 7),
	"53 weeks",
);

// Days > 365
assertSuccess(
	d(2026, 1, 1),
	"add",
	duration(0, 0, 0, 400),
	d(2027, 2, 5),
	"400 days",
);

// Cross year／month
assertSuccess(
	d(2025, 12, 31),
	"add",
	duration(0, 0, 0, 1),
	d(2026, 1, 1),
	"cross year +1 day",
);
assertSuccess(
	d(2026, 1, 1),
	"subtract",
	duration(0, 0, 0, 1),
	d(2025, 12, 31),
	"cross year -1 day",
);

// ---------------------------------------------------------------------------
// Boundary success
// ---------------------------------------------------------------------------
assertSuccess(
	d(1900, 1, 2),
	"subtract",
	duration(0, 0, 0, 1),
	d(1900, 1, 1),
	"result exactly 1900-01-01",
);
assertSuccess(
	d(2200, 12, 30),
	"add",
	duration(0, 0, 0, 1),
	d(2200, 12, 31),
	"result exactly 2200-12-31",
);
assertSuccess(
	d(2199, 12, 31),
	"add",
	duration(1, 0, 0, 0),
	d(2200, 12, 31),
	"2199-12-31 + 1 year",
);
assertSuccess(
	d(2200, 12, 24),
	"add",
	duration(0, 0, 1, 0),
	d(2200, 12, 31),
	"2200-12-24 + 1 week",
);
assertSuccess(
	DATE_CALCULATOR_MIN,
	"add",
	duration(0, 0, 0, 0),
	DATE_CALCULATOR_MIN,
	"zero at min",
);
assertSuccess(
	DATE_CALCULATOR_MAX,
	"add",
	duration(0, 0, 0, 0),
	DATE_CALCULATOR_MAX,
	"zero at max",
);

// ---------------------------------------------------------------------------
// Per-step overflow — upper bound
// ---------------------------------------------------------------------------
assertFailure(
	d(2199, 12, 31),
	"add",
	duration(2, 3, 0, 0),
	"out-of-range",
	"years",
	"upper year step overflow stops before months",
);
assertFailure(
	d(2200, 11, 30),
	"add",
	duration(0, 2, 0, 0),
	"out-of-range",
	"months",
	"upper month step overflow",
);
assertFailure(
	d(2200, 12, 25),
	"add",
	duration(0, 0, 1, 0),
	"out-of-range",
	"weeks",
	"upper week step overflow",
);
assertFailure(
	d(2200, 12, 31),
	"add",
	duration(0, 0, 0, 1),
	"out-of-range",
	"days",
	"upper day step overflow",
);

// Year succeeds, month overflows — unit must be months
assertFailure(
	d(2200, 11, 15),
	"add",
	duration(0, 2, 1, 1),
	"out-of-range",
	"months",
	"month overflow before week／day",
);

// ---------------------------------------------------------------------------
// Per-step overflow — lower bound
// ---------------------------------------------------------------------------
assertFailure(
	d(1901, 1, 1),
	"subtract",
	duration(2, 0, 0, 0),
	"out-of-range",
	"years",
	"lower year step overflow",
);
assertFailure(
	d(1900, 2, 1),
	"subtract",
	duration(0, 2, 0, 0),
	"out-of-range",
	"months",
	"lower month step overflow",
);
assertFailure(
	d(1900, 1, 5),
	"subtract",
	duration(0, 0, 1, 0),
	"out-of-range",
	"weeks",
	"lower week step overflow",
);
assertFailure(
	d(1900, 1, 1),
	"subtract",
	duration(0, 0, 0, 1),
	"out-of-range",
	"days",
	"lower day step overflow",
);

// Year ok, later unit overflows
assertFailure(
	d(1900, 1, 10),
	"subtract",
	duration(0, 0, 0, 15),
	"out-of-range",
	"days",
	"day overflow after zero year／month／week",
);

// ---------------------------------------------------------------------------
// Invalid／safe-integer guards
// ---------------------------------------------------------------------------
assertFailure(
	d(2026, 13, 1),
	"add",
	duration(0, 0, 0, 0),
	"invalid-start-date",
	undefined,
	"invalid start month",
);
assertFailure(
	d(2026, 2, 30),
	"add",
	duration(0, 0, 0, 0),
	"invalid-start-date",
	undefined,
	"invalid start day",
);
assertFailure(
	d(1899, 12, 31),
	"add",
	duration(0, 0, 0, 0),
	"invalid-start-date",
	undefined,
	"start below min",
);
assertFailure(
	d(2201, 1, 1),
	"add",
	duration(0, 0, 0, 0),
	"invalid-start-date",
	undefined,
	"start above max",
);
assertFailure(
	{ year: 2026.5, month: 1, day: 1 },
	"add",
	duration(0, 0, 0, 0),
	"invalid-start-date",
	undefined,
	"non-integer start year",
);
assertFailure(
	null,
	"add",
	duration(0, 0, 0, 0),
	"invalid-start-date",
	undefined,
	"null start",
);

assertFailure(
	d(2026, 7, 1),
	"ADD",
	duration(0, 0, 0, 0),
	"invalid-direction",
	undefined,
	"invalid direction runtime",
);
assertFailure(
	d(2026, 7, 1),
	null,
	duration(0, 0, 0, 0),
	"invalid-direction",
	undefined,
	"null direction",
);

assertFailure(
	d(2026, 7, 1),
	"add",
	{ years: -1, months: 0, weeks: 0, days: 0 },
	"invalid-duration",
	"years",
	"negative years",
);
assertFailure(
	d(2026, 7, 1),
	"add",
	{ years: 0, months: 1.5, weeks: 0, days: 0 },
	"invalid-duration",
	"months",
	"decimal months",
);
assertFailure(
	d(2026, 7, 1),
	"add",
	{ years: 0, months: 0, weeks: Number.NaN, days: 0 },
	"invalid-duration",
	"weeks",
	"NaN weeks",
);
assertFailure(
	d(2026, 7, 1),
	"add",
	{ years: 0, months: 0, weeks: 0, days: Number.POSITIVE_INFINITY },
	"invalid-duration",
	"days",
	"Infinity days",
);
assertFailure(
	d(2026, 7, 1),
	"add",
	{
		years: Number.MAX_SAFE_INTEGER + 1,
		months: 0,
		weeks: 0,
		days: 0,
	},
	"invalid-duration",
	"years",
	"unsafe integer years",
);

// First invalid unit in Years → Months → Weeks → Days order
assertFailure(
	d(2026, 7, 1),
	"add",
	{ years: -1, months: -2, weeks: -3, days: -4 },
	"invalid-duration",
	"years",
	"first invalid unit is years",
);
assertFailure(
	d(2026, 7, 1),
	"add",
	{ years: 0, months: -1, weeks: Number.NaN, days: 1.5 },
	"invalid-duration",
	"months",
	"first invalid unit is months",
);

// Huge safe integers → out-of-range quickly（no hang）
{
	const started = Date.now();
	assertFailure(
		d(2026, 7, 1),
		"add",
		duration(Number.MAX_SAFE_INTEGER, 0, 0, 0),
		"out-of-range",
		"years",
		"huge safe years",
	);
	assertFailure(
		d(2026, 7, 1),
		"add",
		duration(0, Number.MAX_SAFE_INTEGER, 0, 0),
		"out-of-range",
		"months",
		"huge safe months",
	);
	assertFailure(
		d(2026, 7, 1),
		"add",
		duration(0, 0, Number.MAX_SAFE_INTEGER, 0),
		"out-of-range",
		"weeks",
		"weeks × 7 overflow／out-of-range",
	);
	assertFailure(
		d(2026, 7, 1),
		"add",
		duration(0, 0, 0, Number.MAX_SAFE_INTEGER),
		"out-of-range",
		"days",
		"huge safe days",
	);
	const elapsed = Date.now() - started;
	assert(elapsed < 500, `huge-input suite finished quickly (${elapsed}ms)`);
}

// ---------------------------------------------------------------------------
// DST-neighbor calendar days（civil +1 day; TZ-invariant）
// ---------------------------------------------------------------------------
assertSuccess(
	d(2026, 3, 8),
	"add",
	duration(0, 0, 0, 1),
	d(2026, 3, 9),
	"2026-03-08 + 1 day（DST spring neighbor）",
);
assertSuccess(
	d(2026, 11, 1),
	"add",
	duration(0, 0, 0, 1),
	d(2026, 11, 2),
	"2026-11-01 + 1 day（DST fall neighbor）",
);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log("");
console.log(`Result: ${passed} passed, ${failed} failed`);

if (failed > 0) {
	console.log("FAIL");
	process.exitCode = 1;
} else {
	console.log("PASS");
}
