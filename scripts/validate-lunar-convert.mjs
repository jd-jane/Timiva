/**
 * Lunar domain conversion validator（B2A）.
 * Run: node scripts/validate-lunar-convert.mjs
 *
 * Covers public 1901–2099 edges, leap months, 29/30-day months,
 * HKO official samples, and bidirectional round-trips.
 * No UI. No test framework.
 */
import {
	assertLunarDatasetIntegrity,
	buildLunarResultParts,
	civilWeekday,
	daysInLunarMonth,
	getLunarYearInfo,
	gregorianToLunar,
	isGregorianLeapYear,
	daysInGregorianMonth,
	isValidCivilDate,
	validatePublicGregorian,
	LUNAR_DATASET_PROVENANCE,
	LUNAR_DATASET_YEAR_MAX,
	LUNAR_DATASET_YEAR_MIN,
	LUNAR_PUBLIC_YEAR_MAX,
	LUNAR_PUBLIC_YEAR_MIN,
	LUNAR_YEAR_PACKED,
	leapMonthOfYear,
	lunarToGregorian,
	yearStemBranch,
} from "../src/lib/lunar/index.ts";

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

function assertEq(actual, expected, message) {
	const ok = JSON.stringify(actual) === JSON.stringify(expected);
	assert(ok, `${message} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
}

console.log("validate-lunar-convert");
console.log(`provenance: ${LUNAR_DATASET_PROVENANCE.baseline}`);

assertLunarDatasetIntegrity();
assert(LUNAR_YEAR_PACKED.length === 201, "packed table covers 1900–2100 (201 years)");
assert(LUNAR_DATASET_YEAR_MIN === 1900 && LUNAR_DATASET_YEAR_MAX === 2100, "dataset sentinel years");
assert(LUNAR_PUBLIC_YEAR_MIN === 1901 && LUNAR_PUBLIC_YEAR_MAX === 2099, "public years 1901–2099");

/* —— Stem-branch —— */
assertEq(yearStemBranch(1901).zh, "辛丑", "1901 Xin-chou / 辛丑");
assertEq(yearStemBranch(1901).en, "Xin-chou", "1901 EN stem-branch");
assertEq(yearStemBranch(2020).zh, "庚子", "2020 Geng-zi");
assertEq(yearStemBranch(2026).zh, "丙午", "2026 Bing-wu");
assertEq(yearStemBranch(2026).en, "Bing-wu", "2026 EN Bing-wu");
assertEq(yearStemBranch(2099).zh, "己未", "2099 Ji-wei");
assertEq(yearStemBranch(2100).zh, "庚申", "2100 Geng-shen");

/* —— HKO official fixtures（Gregorian → Lunar） —— */
const hkoG2L = [
	[{ year: 1901, month: 1, day: 1 }, { year: 1900, month: 11, day: 11, isLeapMonth: false }],
	[{ year: 1901, month: 2, day: 19 }, { year: 1901, month: 1, day: 1, isLeapMonth: false }],
	[{ year: 1963, month: 4, day: 24 }, { year: 1963, month: 4, day: 1, isLeapMonth: false }],
	[{ year: 1963, month: 5, day: 23 }, { year: 1963, month: 4, day: 1, isLeapMonth: true }],
	[{ year: 2020, month: 1, day: 25 }, { year: 2020, month: 1, day: 1, isLeapMonth: false }],
	[{ year: 2020, month: 4, day: 23 }, { year: 2020, month: 4, day: 1, isLeapMonth: false }],
	[{ year: 2020, month: 5, day: 23 }, { year: 2020, month: 4, day: 1, isLeapMonth: true }],
	[{ year: 2026, month: 2, day: 17 }, { year: 2026, month: 1, day: 1, isLeapMonth: false }],
	[{ year: 2026, month: 8, day: 17 }, { year: 2026, month: 7, day: 5, isLeapMonth: false }],
	[{ year: 2099, month: 1, day: 21 }, { year: 2099, month: 1, day: 1, isLeapMonth: false }],
	[{ year: 2099, month: 3, day: 22 }, { year: 2099, month: 2, day: 1, isLeapMonth: true }],
];

for (const [g, expected] of hkoG2L) {
	const r = gregorianToLunar(g);
	assert(r.ok, `G→L ok ${g.year}-${g.month}-${g.day}`);
	if (r.ok) assertEq(r.value, expected, `HKO G→L ${g.year}-${g.month}-${g.day}`);
}

/* —— Leap month metadata —— */
assertEq(leapMonthOfYear(2020), 4, "2020 leap month = 4");
assertEq(leapMonthOfYear(1963), 4, "1963 leap month = 4");
assertEq(leapMonthOfYear(2099), 2, "2099 leap month = 2");
assertEq(leapMonthOfYear(2026), null, "2026 no leap");
assertEq(daysInLunarMonth(2020, 4, true), 29, "2020 leap 4 has 29 days");
assertEq(daysInLunarMonth(2020, 4, false), 30, "2020 regular 4 has 30 days");

/* —— 29 / 30 day months —— */
assertEq(daysInLunarMonth(2026, 1, false), 30, "2026 month 1 = 30");
assertEq(daysInLunarMonth(2026, 7, false), 29, "2026 month 7 = 29");

/* —— Invalid leap / day 30 —— */
{
	const badLeap = lunarToGregorian({
		year: 2026,
		month: 4,
		day: 1,
		isLeapMonth: true,
	});
	assert(!badLeap.ok && badLeap.code === "invalid-leap-month", "2026 has no leap 4");

	const badDay = lunarToGregorian({
		year: 2020,
		month: 4,
		day: 30,
		isLeapMonth: true,
	});
	assert(!badDay.ok && badDay.code === "invalid-lunar-day", "2020 leap 4 has no day 30");
}

/* —— Public range gates —— */
{
	const below = gregorianToLunar({ year: 1900, month: 12, day: 31 });
	assert(!below.ok && below.code === "out-of-public-range", "Gregorian 1900 rejected");

	const above = gregorianToLunar({ year: 2100, month: 1, day: 1 });
	assert(!above.ok && above.code === "out-of-public-range", "Gregorian 2100 input rejected");

	const lunarBelow = lunarToGregorian({
		year: 1900,
		month: 11,
		day: 11,
		isLeapMonth: false,
	});
	assert(
		!lunarBelow.ok && lunarBelow.code === "out-of-public-range",
		"Lunar year 1900 input rejected（sentinel only）",
	);
}

/* —— Boundary spill：合法 public input → sentinel-side output —— */
{
	const lower = gregorianToLunar({ year: 1901, month: 1, day: 1 });
	assert(lower.ok && lower.value.year === 1900, "G 1901-01-01 → lunar year 1900");

	const late2099 = lunarToGregorian({
		year: 2099,
		month: 12,
		day: 1,
		isLeapMonth: false,
	});
	assert(late2099.ok, "L 2099-12-01 converts");
	if (late2099.ok) {
		assert(
			late2099.value.year === 2099 || late2099.value.year === 2100,
			"L 2099-12 may land in G 2099 or 2100",
		);
		/* From HKO：12th month of lunar 2099 starts 2100-01-10 */
		const l2099_12_1 = lunarToGregorian({
			year: 2099,
			month: 12,
			day: 1,
			isLeapMonth: false,
		});
		assert(l2099_12_1.ok && l2099_12_1.value.year === 2100, "L 2099-12-01 → G 2100");
		assertEq(
			l2099_12_1.ok ? l2099_12_1.value : null,
			{ year: 2100, month: 1, day: 10 },
			"HKO L 2099-12-01 = 2100-01-10",
		);
	}
}

/* —— Round-trips Gregorian → Lunar → Gregorian —— */
const roundTripGregorian = [
	{ year: 1901, month: 1, day: 1 },
	{ year: 1901, month: 2, day: 19 },
	{ year: 1963, month: 5, day: 23 },
	{ year: 2020, month: 5, day: 23 },
	{ year: 2026, month: 8, day: 17 },
	{ year: 2099, month: 12, day: 31 },
	{ year: 2099, month: 1, day: 21 },
];

for (const g of roundTripGregorian) {
	const l = gregorianToLunar(g);
	assert(l.ok, `round-trip G start ok ${g.year}-${g.month}-${g.day}`);
	if (!l.ok) continue;
	/* Lunar year 1900 is not a public *input*; round-trip via internal path:
	   use convert only when lunar year is public, else check reverse through day equality
	   by temporarily using lunarToGregorian only for public years. */
	if (l.value.year >= LUNAR_PUBLIC_YEAR_MIN && l.value.year <= LUNAR_PUBLIC_YEAR_MAX) {
		const back = lunarToGregorian(l.value);
		assert(back.ok, `round-trip L→G ok for ${g.year}-${g.month}-${g.day}`);
		if (back.ok) assertEq(back.value, g, `G→L→G ${g.year}-${g.month}-${g.day}`);
	} else {
		assert(
			l.value.year === 1900,
			`non-public lunar year at edge is 1900 for ${g.year}-${g.month}-${g.day}`,
		);
	}
}

/* —— Round-trips Lunar → Gregorian → Lunar（public lunar years） —— */
const roundTripLunar = [
	{ year: 1901, month: 1, day: 1, isLeapMonth: false },
	{ year: 1963, month: 4, day: 1, isLeapMonth: true },
	{ year: 2020, month: 4, day: 15, isLeapMonth: true },
	{ year: 2020, month: 4, day: 15, isLeapMonth: false },
	{ year: 2026, month: 7, day: 5, isLeapMonth: false },
	{ year: 2099, month: 2, day: 1, isLeapMonth: true },
	{ year: 2099, month: 12, day: 1, isLeapMonth: false },
];

for (const l of roundTripLunar) {
	const g = lunarToGregorian(l);
	assert(g.ok, `round-trip L start ok ${l.year}-${l.month}-${l.day} leap=${l.isLeapMonth}`);
	if (!g.ok) continue;
	/* If Gregorian spills to 2100, G→L public gate rejects 2100 input —
	   verify by converting with internal expectation: public G max is 2099,
	   so for G 2100 we only assert lunarToGregorian succeeded and matches HKO. */
	if (g.value.year >= LUNAR_PUBLIC_YEAR_MIN && g.value.year <= LUNAR_PUBLIC_YEAR_MAX) {
		const back = gregorianToLunar(g.value);
		assert(back.ok, `round-trip G→L ok`);
		if (back.ok) assertEq(back.value, l, `L→G→L ${l.year}-${l.month}-${l.day} leap=${l.isLeapMonth}`);
	} else {
		assert(g.value.year === 2100, "upper spill Gregorian year is 2100");
	}
}

/* —— Year info / new year —— */
{
	const info = getLunarYearInfo(2020);
	assert(info !== null && info.leapMonth === 4, "year info 2020 leap 4");
	assert(info.months.some((m) => m.isLeapMonth && m.month === 4), "months list includes leap 4");
	assertEq(info.newYearCivil, { year: 2020, month: 1, day: 25 }, "2020 lunar NY");
}

/* —— Format parts（structured；B1B fixture） —— */
{
	const lunar = { year: 2026, month: 7, day: 5, isLeapMonth: false };
	const civil = { year: 2026, month: 8, day: 17 };
	const parts = buildLunarResultParts(lunar, civil);
	assertEq(parts.zhYearLine, "農曆丙午年", "ZH year line");
	assertEq(parts.zhMonthDayLine, "七月初五日", "ZH month-day line");
	assertEq(parts.enPrimary, "Lunar 7/5 · Bing-wu", "EN primary");
	assertEq(parts.weekdayEn, "Monday", "weekday EN");
	assertEq(parts.weekdayZh, "星期一", "weekday ZH");
	assertEq(civilWeekday(civil), 1, "2026-08-17 is Monday");
}

/* —— Dense sample round-trips across decades（public G years） —— */
let denseOk = 0;
for (let y = 1901; y <= 2099; y += 7) {
	for (const md of [
		[1, 1],
		[2, 19],
		[6, 15],
		[12, 31],
	]) {
		const g = { year: y, month: md[0], day: md[1] };
		/* skip invalid civil like Feb 30 — none here */
		const l = gregorianToLunar(g);
		if (!l.ok) {
			assert(false, `dense G→L failed ${y}-${md[0]}-${md[1]}: ${l.message}`);
			continue;
		}
		if (l.value.year < LUNAR_PUBLIC_YEAR_MIN || l.value.year > LUNAR_PUBLIC_YEAR_MAX) {
			denseOk += 1;
			continue;
		}
		const back = lunarToGregorian(l.value);
		assert(back.ok && JSON.stringify(back.value) === JSON.stringify(g), `dense round-trip ${y}-${md[0]}-${md[1]}`);
		denseOk += 1;
	}
}
assert(denseOk > 100, `dense samples exercised (${denseOk})`);

/* —— Gregorian leap-year civil（B2E boundary） —— */
{
	assert(isGregorianLeapYear(2000), "2000 is Gregorian leap year");
	assert(!isGregorianLeapYear(1900), "1900 is not Gregorian leap year");
	assert(!isGregorianLeapYear(2100), "2100 is not Gregorian leap year");
	assert(isGregorianLeapYear(2024), "2024 is Gregorian leap year");
	assertEq(daysInGregorianMonth(2000, 2), 29, "2000-02 has 29 days");
	assertEq(daysInGregorianMonth(1900, 2), 28, "1900-02 has 28 days");
	assert(isValidCivilDate({ year: 2000, month: 2, day: 29 }), "2000-02-29 valid civil");
	assert(!isValidCivilDate({ year: 1900, month: 2, day: 29 }), "1900-02-29 invalid civil");
	assert(!isValidCivilDate({ year: 2023, month: 2, day: 29 }), "2023-02-29 invalid civil");

	const leapOk = validatePublicGregorian({ year: 2000, month: 2, day: 29 });
	assert(leapOk.status === "valid", "public G 2000-02-29 accepted");
	const nonLeap = validatePublicGregorian({ year: 2023, month: 2, day: 29 });
	assert(nonLeap.status === "invalid", "public G 2023-02-29 rejected");

	const g2000 = gregorianToLunar({ year: 2000, month: 2, day: 29 });
	assert(g2000.ok, "G 2000-02-29 → lunar ok");
	if (g2000.ok) {
		const back = lunarToGregorian(g2000.value);
		assert(
			back.ok &&
				back.value.year === 2000 &&
				back.value.month === 2 &&
				back.value.day === 29,
			"L←G 2000-02-29 round-trip",
		);
	}
}

console.log(`Result: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log("PASS");
