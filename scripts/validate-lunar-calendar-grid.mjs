/**
 * Lunar B2C — pure lunar calendar grid / navigation validator.
 * Run: node scripts/validate-lunar-calendar-grid.mjs
 */
import {
	buildDayCells,
	findMonthIndex,
	firstDayOffsetForMonth,
	formatLunarMonthOptionEn,
	isDayCellSelectable,
	isPublicSelectableLunar,
	lunarDatesEqual,
	monthCountForYear,
	navigateMonth,
	resolveOpenView,
	selectYearFromPublicRange,
} from "../src/lib/lunarCalendarGrid.ts";
import { lunarToGregorian } from "../src/lib/lunar/index.ts";
import { gregorianToLunarFromDataset } from "../src/lib/lunar/lunarConvert.ts";

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
	assert(ok, `${message} — got ${JSON.stringify(actual)} expected ${JSON.stringify(expected)}`);
}

assertEq(monthCountForYear(2026), 12, "2026 has 12 months");
assertEq(monthCountForYear(2020), 13, "2020 leap year has 13 months");

const idx2020Leap4 = findMonthIndex(2020, 4, true);
assertEq(idx2020Leap4, 4, "2020 leap 4 at index 4 after regular 4");
assertEq(findMonthIndex(2020, 4, false), 3, "2020 regular 4 at index 3");
assertEq(findMonthIndex(2020, 5, false), 5, "2020 regular 5 at index 5");

{
	const offset = firstDayOffsetForMonth(2020, 5);
	assert(typeof offset === "number" && offset >= 0 && offset <= 6, "2020 leap 4 offset valid");
	const civil = lunarToGregorian({ year: 2020, month: 5, day: 23, isLeapMonth: false });
	assert(civil.ok, "2020-05-23 civil ok");
}

{
	const leapCells = buildDayCells({
		viewYear: 2020,
		viewMonthIndex: 4,
		committedLunar: null,
		todayLunar: null,
		boundaryView: null,
		locale: "en",
	});
	assert(leapCells !== null, "2020 leap 4 grid");
	assertEq(leapCells.cells.length, 29, "2020 leap 4 has 29 cells");

	const regCells = buildDayCells({
		viewYear: 2020,
		viewMonthIndex: 3,
		committedLunar: null,
		todayLunar: null,
		boundaryView: null,
		locale: "en",
	});
	assert(regCells !== null, "2020 regular 4 grid");
	assertEq(regCells.cells.length, 30, "2020 regular 4 has 30 cells");
}

assertEq(formatLunarMonthOptionEn({ month: 4, isLeapMonth: false, days: 30 }), "4", "EN month 4");
assertEq(
	formatLunarMonthOptionEn({ month: 4, isLeapMonth: true, days: 29 }),
	"Leap 4",
	"EN leap 4",
);

assert(
	isPublicSelectableLunar({ year: 2099, month: 12, day: 1, isLeapMonth: false }),
	"L 2099-12-01 is public selectable",
);
{
	const civil = lunarToGregorian({ year: 2099, month: 12, day: 1, isLeapMonth: false });
	assert(civil.ok && civil.value.year === 2100, "L 2099-12-01 → G 2100");
	assert(
		isDayCellSelectable({ year: 2099, month: 12, day: 1, isLeapMonth: false }, null),
		"2099-12-01 cell selectable despite G 2100",
	);
}

assert(
	!isPublicSelectableLunar({ year: 1900, month: 11, day: 11, isLeapMonth: false }),
	"L 1900 not public selectable",
);

{
	const open = resolveOpenView({ year: 1901, month: 1, day: 1 });
	assert(open.boundaryView === "lower-sentinel", "G 1901-01-01 → lower sentinel");
	assertEq(
		open.committedLunar,
		{ year: 1900, month: 11, day: 11, isLeapMonth: false },
		"committed L 1900-11-11",
	);
	assertEq(open.viewYear, 1900, "view year 1900 in sentinel");
}

{
	const sentinel = buildDayCells({
		viewYear: 1900,
		viewMonthIndex: findMonthIndex(1900, 11, false),
		committedLunar: { year: 1900, month: 11, day: 11, isLeapMonth: false },
		todayLunar: null,
		boundaryView: "lower-sentinel",
		locale: "zh",
	});
	assert(sentinel !== null, "sentinel grid");
	const committed = sentinel.cells.find((c) => c.lunar.day === 11);
	const other = sentinel.cells.find((c) => c.lunar.day === 10);
	assert(committed?.isSelected === true, "committed day selected");
	assert(committed?.isSentinelLocked === true, "committed sentinel locked");
	assert(committed?.selectable === false, "committed non-interactive");
	assert(other?.selectable === false, "other 1900 days not selectable");
}

assert(
	navigateMonth(1900, findMonthIndex(1900, 11, false), -1, "lower-sentinel") === null,
	"prev disabled in sentinel",
);
{
	const exit = navigateMonth(1900, findMonthIndex(1900, 11, false), 1, "lower-sentinel");
	assertEq(exit, { year: 1901, monthIndex: 0, boundaryView: null }, "next exits sentinel to 1901");
}

assert(selectYearFromPublicRange(1900, 0) === null, "year picker excludes 1900");

assert(
	lunarDatesEqual(
		{ year: 2020, month: 4, day: 1, isLeapMonth: true },
		{ year: 2020, month: 4, day: 1, isLeapMonth: true },
	),
	"lunarDatesEqual leap match",
);

{
	const back = gregorianToLunarFromDataset({ year: 2100, month: 1, day: 10 });
	assert(back.ok, "G 2100-01-10 fromDataset ok");
	assertEq(
		back.value,
		{ year: 2099, month: 12, day: 1, isLeapMonth: false },
		"G 2100-01-10 → L 2099-12-01",
	);
}

if (failed > 0) {
	process.exit(1);
}
console.log("validate-lunar-calendar-grid PASS");
