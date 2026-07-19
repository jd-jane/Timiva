/**
 * Deterministic validation for Business Days Calculator — B2B math:
 * UTC calendar ordinal · O(n) weekend walk · inclusive start/end
 * No local midnight / wall-clock ms / browser locale.
 *
 * Run:
 *   node scripts/validate-business-days-calculator-math.mjs
 *   TZ=UTC node scripts/validate-business-days-calculator-math.mjs
 *   TZ=America/Los_Angeles node scripts/validate-business-days-calculator-math.mjs
 *   TZ=Asia/Taipei node scripts/validate-business-days-calculator-math.mjs
 */
import {
	ZERO_BUSINESS_DAYS_COUNT,
	calculateBusinessDaysRange,
	utcCalendarOrdinal,
	utcWeekdayFromOrdinal,
} from "../src/lib/businessDaysCalculatorMath.ts";
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

function d(year, month, day) {
	return { year, month, day };
}

function assertCount(start, end, expected, label) {
	const result = calculateBusinessDaysRange(start, end);
	assert(
		result.totalDays === expected.totalDays,
		`${label}: totalDays ${result.totalDays} !== ${expected.totalDays}`,
	);
	assert(
		result.weekendDays === expected.weekendDays,
		`${label}: weekendDays ${result.weekendDays} !== ${expected.weekendDays}`,
	);
	assert(
		result.businessDays === expected.businessDays,
		`${label}: businessDays ${result.businessDays} !== ${expected.businessDays}`,
	);
	assert(
		result.totalDays === result.businessDays + result.weekendDays,
		`${label}: totalDays === businessDays + weekendDays`,
	);
}

console.log(
	`validate-business-days-calculator-math (TZ=${process.env.TZ ?? "system"})`,
);

// --- Ordinal / weekday primitives stay TZ-stable ---
{
	const monday = d(2026, 7, 13);
	assert(utcCalendarOrdinal(monday) === 20647, "2026-07-13 ordinal (known UTC day)");
	assert(utcWeekdayFromOrdinal(utcCalendarOrdinal(monday)) === 1, "2026-07-13 is Monday UTC");
	assert(utcWeekdayFromOrdinal(utcCalendarOrdinal(d(2026, 7, 18))) === 6, "2026-07-18 Saturday UTC");
	assert(utcWeekdayFromOrdinal(utcCalendarOrdinal(d(2026, 7, 19))) === 0, "2026-07-19 Sunday UTC");
}

// --- Product-spec examples (2026-07 week) ---
assertCount(d(2026, 7, 13), d(2026, 7, 17), { totalDays: 5, weekendDays: 0, businessDays: 5 }, "Mon→Fri");
assertCount(d(2026, 7, 17), d(2026, 7, 20), { totalDays: 4, weekendDays: 2, businessDays: 2 }, "Fri→next Mon");
assertCount(d(2026, 7, 13), d(2026, 7, 13), { totalDays: 1, weekendDays: 0, businessDays: 1 }, "same weekday");
assertCount(d(2026, 7, 18), d(2026, 7, 18), { totalDays: 1, weekendDays: 1, businessDays: 0 }, "same weekend day");
assertCount(d(2026, 7, 18), d(2026, 7, 19), { totalDays: 2, weekendDays: 2, businessDays: 0 }, "Sat→Sun");

// --- Cross month / year / leap ---
assertCount(d(2026, 1, 30), d(2026, 2, 2), { totalDays: 4, weekendDays: 2, businessDays: 2 }, "cross-month Fri→Mon");
assertCount(d(2025, 12, 31), d(2026, 1, 2), { totalDays: 3, weekendDays: 0, businessDays: 3 }, "cross-year Wed→Fri");
assertCount(d(2024, 2, 28), d(2024, 3, 1), { totalDays: 3, weekendDays: 0, businessDays: 3 }, "leap Feb 29 included Wed→Fri");
assertCount(d(2024, 2, 29), d(2024, 2, 29), { totalDays: 1, weekendDays: 0, businessDays: 1 }, "leap day alone (Thu)");
assertCount(d(2023, 2, 28), d(2023, 3, 1), { totalDays: 2, weekendDays: 0, businessDays: 2 }, "non-leap Feb 28→Mar 1");

// --- Range extremes ---
{
	const wd = utcWeekdayFromOrdinal(utcCalendarOrdinal(d(1900, 1, 1)));
	assert(wd === 1, `1900-01-01 weekday is Monday UTC (got ${wd})`);
}
assertCount(d(1900, 1, 1), d(1900, 1, 1), { totalDays: 1, weekendDays: 0, businessDays: 1 }, "min date alone");
{
	const wd = utcWeekdayFromOrdinal(utcCalendarOrdinal(d(2100, 12, 31)));
	assert(wd === 5, `2100-12-31 weekday is Friday UTC (got ${wd})`);
}
assertCount(d(2100, 12, 31), d(2100, 12, 31), { totalDays: 1, weekendDays: 0, businessDays: 1 }, "max date alone");

// Full allowed span 1900-01-01 … 2100-12-31 = 73,414 days
{
	const full = calculateBusinessDaysRange(d(1900, 1, 1), d(2100, 12, 31));
	assert(full.totalDays === 73414, `full span totalDays ${full.totalDays} !== 73414`);
	assert(
		full.totalDays === full.businessDays + full.weekendDays,
		"full span identity total = business + weekend",
	);
	// Rough sanity: weekends ≈ 2/7 of days
	const weekendRatio = full.weekendDays / full.totalDays;
	assert(
		weekendRatio > 0.28 && weekendRatio < 0.3,
		`full span weekend ratio ~2/7 (got ${weekendRatio.toFixed(4)})`,
	);
}

// Mixed week sample
assertCount(d(2026, 7, 15), d(2026, 7, 21), { totalDays: 7, weekendDays: 2, businessDays: 5 }, "Wed→Tue full week+");

// ZERO constant
assert(
	ZERO_BUSINESS_DAYS_COUNT.totalDays === 0 &&
		ZERO_BUSINESS_DAYS_COUNT.weekendDays === 0 &&
		ZERO_BUSINESS_DAYS_COUNT.businessDays === 0,
	"ZERO_BUSINESS_DAYS_COUNT is all zeros",
);

// DST civil-date steps remain 1 day via UTC ordinal (not wall-clock)
{
	const spring = utcCalendarOrdinal(d(2024, 3, 11)) - utcCalendarOrdinal(d(2024, 3, 10));
	const fall = utcCalendarOrdinal(d(2024, 11, 4)) - utcCalendarOrdinal(d(2024, 11, 3));
	assert(spring === 1, "UTC ordinal spring-forward civil step is 1");
	assert(fall === 1, "UTC ordinal fall-back civil step is 1");
	assert(utcWeekdayFromOrdinal(utcCalendarOrdinal(d(2024, 3, 10))) === 0, "2024-03-10 Sunday");
	assert(utcWeekdayFromOrdinal(utcCalendarOrdinal(d(2024, 3, 11))) === 1, "2024-03-11 Monday");
	assertCount(d(2024, 3, 10), d(2024, 3, 11), { totalDays: 2, weekendDays: 1, businessDays: 1 }, "Sun→Mon around DST");
}

// --- Static isolation / wiring checks ---
{
	const math = readFileSync(join(rootDir, "src/lib/businessDaysCalculatorMath.ts"), "utf8");
	const script = readFileSync(join(rootDir, "src/scripts/business-days-calculator.ts"), "utf8");
	const en = readFileSync(join(rootDir, "src/i18n/en.ts"), "utf8");
	const zh = readFileSync(join(rootDir, "src/i18n/zh.ts"), "utf8");

	assert(!math.includes("business day"), "math has no English plural copy");
	assert(!math.includes("個工作日"), "math has no Chinese unit copy");
	assert(!math.includes("textContent"), "math does not touch DOM");
	assert(
		math.includes("Date.UTC") && math.includes("getUTCDay"),
		"math uses Date.UTC + getUTCDay",
	);
	assert(
		!math.includes("getDay()") || math.includes("getUTCDay"),
		"math must not rely on local getDay alone",
	);
	assert(
		!math.includes("getTimezoneOffset") && !math.includes(".getDay()"),
		"math avoids local timezone weekday / offset APIs",
	);

	assert(
		script.includes("calculateBusinessDaysRange") &&
			script.includes("businessDaysCalculatorMath"),
		"script wires B2B math",
	);
	assert(
		script.includes("syncResultDisplay") || script.includes("data-bdcv2-result-days"),
		"script updates result DOM",
	);
	assert(
		script.includes("resolveOrderedRange"),
		"script still uses B2A ordered range before math",
	);
	assert(
		!script.includes("daysBetweenDatesMath"),
		"script does not import DBD math",
	);

	assert(
		script.includes("formatPrimaryUnit") &&
			script.includes("business day") &&
			script.includes("business days"),
		"EN primary unit singular/plural live in UI formatter",
	);
	assert(
		script.includes("day total") && script.includes("days total"),
		"EN day(s) total live in UI formatter",
	);
	assert(
		script.includes("weekend day") && script.includes("weekend days"),
		"EN weekend day(s) live in UI formatter",
	);
	assert(en.includes("business days") && en.includes("days total") && en.includes("weekend days"), "en SSR result labels present");
	assert(zh.includes("個工作日") && zh.includes("總天數") && zh.includes("週末天數"), "zh SSR result labels present");
}

if (failed > 0) {
	console.error(`validate-business-days-calculator-math\npassed=${passed} failed=${failed}`);
	process.exit(1);
}

console.log(`validate-business-days-calculator-math\npassed=${passed} failed=${failed}`);
