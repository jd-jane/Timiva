/**
 * Deterministic validation for taiwanAnnualLeaveMath — B2A Gate.
 * Run: node --experimental-strip-types scripts/validate-taiwan-annual-leave-math.mjs
 *
 * Checks per fixture:
 * - rawDays (internal)
 * - officialDays (RestDays / statutory expected)
 * - display (≤1 decimal; integers without .0)
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
	evaluateAnniversary,
	evaluateCalendarYear,
	evaluateTaiwanAnnualLeave,
	formatLeaveDisplay,
	restDaysRound,
} from "../src/lib/taiwanAnnualLeaveMath.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtures = JSON.parse(
	readFileSync(join(__dirname, "fixtures/taiwan-annual-leave-math.json"), "utf8"),
);

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

function assertClose(actual, expected, label, eps = 1e-9) {
	assert(
		typeof actual === "number" && Math.abs(actual - expected) < eps,
		`${label}: got ${actual} !== ${expected}`,
	);
}

console.log("validate-taiwan-annual-leave-math");

// --- Rounding lock ---
for (const sample of fixtures.rounding.samples) {
	assertClose(
		restDaysRound(sample.input),
		sample.official,
		`restDaysRound(${sample.input})`,
	);
}

assert(formatLeaveDisplay(6.8) === "6.8", 'display 6.8 → "6.8"');
assert(formatLeaveDisplay(6.5) === "6.5", 'display 6.5 → "6.5"');
assert(formatLeaveDisplay(7) === "7", 'display 7 → "7" (no .0)');
assert(formatLeaveDisplay(0) === "0", 'display 0 → "0"');
assert(formatLeaveDisplay(30) === "30", 'display 30 → "30"');

// --- Anniversary fixtures ---
for (const fx of fixtures.anniversary) {
	const r = evaluateAnniversary(fx.hire, fx.asOf);
	assertClose(r.rawDays, fx.rawDays, `${fx.id} rawDays`);
	assertClose(r.officialDays, fx.officialDays, `${fx.id} officialDays`);
	assert(r.display === fx.display, `${fx.id} display got "${r.display}" !== "${fx.display}"`);
	assert(Array.isArray(r.formulaLines) && r.formulaLines.length > 0, `${fx.id} formulaLines`);

	if (fx.nextDays === null) {
		assert(r.next === null, `${fx.id} next null`);
	} else {
		assert(r.next !== null && r.next.days === fx.nextDays, `${fx.id} nextDays`);
	}

	const via = evaluateTaiwanAnnualLeave({
		hire: fx.hire,
		asOf: fx.asOf,
		leaveSystem: "anniversary",
	});
	assert(via.status === "anniversary", `${fx.id} evaluate status`);
	assertClose(via.officialDays, fx.officialDays, `${fx.id} evaluate official`);
	assert(via.primaryDisplay === fx.display, `${fx.id} evaluate display`);
}

// --- Calendar-year fixtures ---
for (const fx of fixtures.calendarYear) {
	const r = evaluateCalendarYear(fx.hire, fx.leaveYear);
	assertClose(r.rawDays, fx.rawDays, `${fx.id} rawDays`);
	assertClose(r.officialDays, fx.officialDays, `${fx.id} officialDays`);
	assert(r.display === fx.display, `${fx.id} display got "${r.display}" !== "${fx.display}"`);
	assert(r.leavePeriod.start.month === 1 && r.leavePeriod.start.day === 1, `${fx.id} period start`);
	assert(r.leavePeriod.end.month === 12 && r.leavePeriod.end.day === 31, `${fx.id} period end`);
	assert(Array.isArray(r.formulaLines) && r.formulaLines.length > 0, `${fx.id} formulaLines`);

	const via = evaluateTaiwanAnnualLeave({
		hire: fx.hire,
		asOf: { year: fx.leaveYear, month: 6, day: 15 },
		leaveSystem: "calendar-year",
	});
	assert(via.status === "calendar-year", `${fx.id} evaluate status`);
	assert(via.leaveYear === fx.leaveYear, `${fx.id} leaveYear = asOf.year`);
	assertClose(via.officialDays, fx.officialDays, `${fx.id} evaluate official`);
	assert(via.primaryDisplay === fx.display, `${fx.id} evaluate display`);
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
