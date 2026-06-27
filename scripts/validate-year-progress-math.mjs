/**
 * Deterministic validation for yearProgressMath — no extra test dependencies.
 * Run: node scripts/validate-year-progress-math.mjs
 * TZ-specific: TZ=America/New_York node scripts/validate-year-progress-math.mjs
 */
import {
	calculateSegmentFills,
	calculateYearProgress,
	daysBetweenLocalDates,
	getTotalDaysInYear,
	isLeapYear,
	localDateOrdinal,
} from "../src/lib/yearProgressMath.ts";

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

function approxEqual(a, b, epsilon = 0.0001) {
	return Math.abs(a - b) <= epsilon;
}

function snapshotAt(year, monthIndex, day, hour = 12, minute = 0, second = 0, ms = 0) {
	return calculateYearProgress(new Date(year, monthIndex, day, hour, minute, second, ms));
}

function assertDstCivilDateBoundary(
	label,
	y1,
	m1,
	d1,
	y2,
	m2,
	d2,
	expectedBefore,
	expectedAfter,
) {
	const ordinalStep = daysBetweenLocalDates(y1, m1, d1, y2, m2, d2);
	assert(ordinalStep === 1, `${label}: ordinal step is exactly 1 calendar day`);

	const beforeSnap = snapshotAt(y1, m1, d1, 12);
	const afterSnap = snapshotAt(y2, m2, d2, 12);
	assert(
		afterSnap.daysPassed - beforeSnap.daysPassed === 1,
		`${label}: daysPassed increases by 1`,
	);
	assert(
		beforeSnap.daysRemaining - afterSnap.daysRemaining === 1,
		`${label}: daysRemaining decreases by 1`,
	);
	assert(beforeSnap.daysPassed === expectedBefore, `${label}: before boundary daysPassed`);
	assert(afterSnap.daysPassed === expectedAfter, `${label}: after boundary daysPassed`);
	assert(
		beforeSnap.year === afterSnap.year && beforeSnap.year === y1,
		`${label}: calculateYearProgress year consistent`,
	);
}

console.log(`validate-year-progress-math (TZ=${process.env.TZ ?? "system"})`);

// Leap year
assert(isLeapYear(2024), "2024 is leap");
assert(!isLeapYear(2025), "2025 is not leap");
assert(isLeapYear(2000), "2000 is leap century");
assert(!isLeapYear(2100), "2100 is not leap century");
assert(getTotalDaysInYear(2024) === 366, "2024 has 366 days");
assert(getTotalDaysInYear(2025) === 365, "2025 has 365 days");

// Calendar boundaries
{
	const jan1 = snapshotAt(2025, 0, 1, 0, 0, 0, 0);
	assert(jan1.daysPassed === 0, "Jan 1 → 0 days passed");
	assert(jan1.daysRemaining === 365, "Jan 1 normal year → 365 remaining");
	assert(jan1.percent === 0, "Jan 1 00:00 → 0%");

	const jan2 = snapshotAt(2025, 0, 2, 0, 0, 0, 0);
	assert(jan2.daysPassed === 1, "Jan 2 → 1 day passed");
	assert(jan2.daysRemaining === 364, "Jan 2 → 364 remaining");

	const dec31 = snapshotAt(2025, 11, 31, 23, 59, 59, 999);
	assert(dec31.daysPassed === 364, "Dec 31 normal year → 364 passed");
	assert(dec31.daysRemaining === 1, "Dec 31 normal year → 1 remaining");
	assert(dec31.percent <= 99, "Dec 31 before year end → max 99%");
	assert(dec31.percent >= 99, "Dec 31 late → at least 99%");

	const dec31Leap = snapshotAt(2024, 11, 31, 12);
	assert(dec31Leap.daysPassed === 365, "Dec 31 leap year → 365 passed");
	assert(dec31Leap.daysRemaining === 1, "Dec 31 leap year → 1 remaining");

	const rollover = snapshotAt(2026, 0, 1, 0, 0, 0, 0);
	assert(rollover.year === 2026, "New year rollover uses new year");
	assert(rollover.percent === 0, "New year rollover → 0%");
}

// Feb leap boundaries
{
	const feb28 = snapshotAt(2025, 1, 28);
	assert(feb28.daysPassed === 58, "2025 Feb 28 days passed");

	const feb29 = snapshotAt(2024, 1, 29);
	assert(feb29.daysPassed === 59, "2024 Feb 29 days passed");

	const mar1 = snapshotAt(2024, 2, 1);
	assert(mar1.daysPassed === 60, "2024 Mar 1 days passed");
}

// Percentage integer range
{
	for (let month = 0; month < 12; month++) {
		const snap = snapshotAt(2025, month, 15, 12);
		assert(Number.isInteger(snap.percent), `percent is integer for month ${month + 1}`);
		assert(snap.percent >= 0 && snap.percent <= 99, `percent in 0..99 for month ${month + 1}`);
	}
}

// Segment fills
{
	const monthStart = new Date(2025, 5, 1, 0, 0, 0, 0);
	const fillsAtStart = calculateSegmentFills(monthStart);
	assert(fillsAtStart.length === 12, "exactly 12 segment values");
	assert(fillsAtStart[4] === 1, "past month May → 1");
	assert(fillsAtStart[5] === 0, "June 1 00:00 current fill → 0");
	assert(fillsAtStart[6] === 0, "future month July → 0");

	const monthMid = new Date(2025, 5, 15, 12, 0, 0, 0);
	const fillsMid = calculateSegmentFills(monthMid);
	assert(fillsMid[5] > 0 && fillsMid[5] < 1, "mid June → partial fill");

	const monthEnd = new Date(2025, 5, 30, 23, 59, 59, 999);
	const fillsEnd = calculateSegmentFills(monthEnd);
	assert(approxEqual(fillsEnd[5], 1, 0.001), "end of June approaches 1");

	for (const fill of fillsMid) {
		assert(fill >= 0 && fill <= 1, "segment fill clamped 0..1");
	}
}

// DST-safe ordinal (component-based; independent of 86_400_000 local midnight subtraction)
{
	assert(
		daysBetweenLocalDates(2024, 2, 9, 2024, 2, 10) === 1,
		"America/New_York spring ordinal 2024-03-09→2024-03-10 is 1",
	);
	assert(
		daysBetweenLocalDates(2024, 10, 2, 2024, 10, 3) === 1,
		"America/New_York fall ordinal 2024-11-02→2024-11-03 is 1",
	);
	assert(
		daysBetweenLocalDates(2024, 2, 30, 2024, 2, 31) === 1,
		"Europe/Berlin spring ordinal 2024-03-30→2024-03-31 is 1",
	);
	assert(
		daysBetweenLocalDates(2024, 9, 26, 2024, 9, 27) === 1,
		"Europe/Berlin fall ordinal 2024-10-26→2024-10-27 is 1",
	);

	const springForwardOrdinal = localDateOrdinal(2024, 2, 10) - localDateOrdinal(2024, 2, 9);
	assert(springForwardOrdinal === 1, "localDateOrdinal spring-forward step is 1");

	const fallBackOrdinal = localDateOrdinal(2024, 10, 3) - localDateOrdinal(2024, 10, 2);
	assert(fallBackOrdinal === 1, "localDateOrdinal fall-back step is 1");
}

// TZ wall-clock DST civil-date boundaries (run with TZ=…)
if (process.env.TZ === "America/New_York") {
	assertDstCivilDateBoundary(
		"America/New_York spring-forward 2024-03-09→2024-03-10",
		2024,
		2,
		9,
		2024,
		2,
		10,
		68,
		69,
	);
	assertDstCivilDateBoundary(
		"America/New_York fall-back 2024-11-02→2024-11-03",
		2024,
		10,
		2,
		2024,
		10,
		3,
		306,
		307,
	);
}

if (process.env.TZ === "Europe/Berlin") {
	assertDstCivilDateBoundary(
		"Europe/Berlin spring-forward 2024-03-30→2024-03-31",
		2024,
		2,
		30,
		2024,
		2,
		31,
		89,
		90,
	);
	assertDstCivilDateBoundary(
		"Europe/Berlin fall-back 2024-10-26→2024-10-27",
		2024,
		9,
		26,
		2024,
		9,
		27,
		299,
		300,
	);
}

console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
	process.exit(1);
}
