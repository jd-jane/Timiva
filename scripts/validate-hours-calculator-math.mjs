/**
 * Hours Calculator — calculation SSOT validator（B3）.
 *
 * Locks: same-day／overnight／equal→0／max 23h59m／break 0／deduction／
 * break===gross／break>gross keep gross／decimal＋total minutes.
 * Does NOT change product contract — asserts existing lib behavior.
 *
 * Run: node scripts/validate-hours-calculator-math.mjs
 */
import {
	computeGrossDuration,
	formatBreakDeduction,
	formatDecimalHours,
	formatNaturalDuration,
	formatSupportLine1,
	parseBreakInput,
	parseRangeInput,
} from "../src/lib/hoursCalculatorTimeInput.ts";
import { evaluateHoursResult } from "../src/lib/hoursCalculatorEvaluate.ts";
import {
	completeMobileClockPair,
	parseBreakDurationSegments,
} from "../src/lib/hoursCalculatorSegmentInput.ts";

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

function t(hours, minutes) {
	return { hours, minutes };
}

console.log("validate-hours-calculator-math（calculation SSOT）\n");

/* -------------------------------------------------------------------------- */
/* Gross：same-day／overnight／equal／max                                     */
/* -------------------------------------------------------------------------- */
{
	const same = computeGrossDuration(t(9, 0), t(18, 0));
	assert(same.minutes === 9 * 60 && same.nextDay === false, "same-day 09:00→18:00 = 9h");
}
{
	const overnight = computeGrossDuration(t(22, 0), t(6, 0));
	assert(
		overnight.minutes === 8 * 60 && overnight.nextDay === true,
		"overnight 22:00→06:00 = 8h＋nextDay",
	);
}
{
	const equal = computeGrossDuration(t(9, 0), t(9, 0));
	assert(equal.minutes === 0 && equal.nextDay === false, "start===end → 0，非 24h");
}
{
	const max = computeGrossDuration(t(0, 1), t(0, 0));
	assert(
		max.minutes === 23 * 60 + 59 && max.nextDay === true,
		"max gross 00:01→00:00 = 23h59m",
	);
}
{
	const almost = computeGrossDuration(t(0, 0), t(23, 59));
	assert(
		almost.minutes === 23 * 60 + 59 && almost.nextDay === false,
		"same-day max span 00:00→23:59 = 23h59m",
	);
}

/* -------------------------------------------------------------------------- */
/* evaluateHoursResult：break 0／deduct／===／>                                */
/* -------------------------------------------------------------------------- */
const emptyCapsule = "Start time — End time";

function evalRange(start, end, breakParsed, locale = "en") {
	return evaluateHoursResult({
		locale,
		range: {
			status: "valid",
			start,
			end,
			normalized: "x",
		},
		breakParsed,
		capsuleEmptyLabel: emptyCapsule,
	});
}

{
	const view = evalRange(t(9, 0), t(17, 0), { status: "empty" });
	assert(
		view.primary === "8 hr" &&
			!view.supportLine2 &&
			view.breakExceedsGross === false &&
			view.capsuleNextDay === false,
		"break empty → gross 8h，無 deduction",
	);
}
{
	const view = evalRange(t(9, 0), t(17, 0), {
		status: "valid",
		totalMinutes: 0,
		normalized: "00:00",
	});
	assert(
		view.primary === "8 hr" && !view.supportLine2,
		"break 00:00 → 不扣除",
	);
}
{
	const view = evalRange(t(9, 0), t(17, 0), {
		status: "valid",
		totalMinutes: 30,
		normalized: "00:30",
	});
	assert(
		view.primary === "7 hr 30 min" &&
			view.supportLine2 === formatBreakDeduction(30, "en") &&
			view.breakExceedsGross === false,
		"valid break 30 → net 7h30＋deduction line",
	);
}
{
	const view = evalRange(t(9, 0), t(17, 0), {
		status: "valid",
		totalMinutes: 8 * 60,
		normalized: "08:00",
	});
	assert(
		view.primary === "0 hr 0 min" &&
			Boolean(view.supportLine2) &&
			view.breakExceedsGross === false,
		"break === gross → net 0＋仍顯示 deduction",
	);
}
{
	const view = evalRange(t(9, 0), t(17, 0), {
		status: "valid",
		totalMinutes: 9 * 60,
		normalized: "09:00",
	});
	assert(
		view.primary === "8 hr" &&
			!view.supportLine2 &&
			view.breakExceedsGross === true &&
			view.breakInvalid === true,
		"break > gross → 保留 gross、無 deduction、breakExceedsGross",
	);
}
{
	const view = evalRange(t(22, 0), t(6, 0), { status: "empty" }, "zh");
	assert(
		view.primary === "8 小時" &&
			view.capsuleNextDay === true &&
			view.supportLine1.includes("隔天"),
		"ZH overnight primary＋隔天",
	);
}

/* -------------------------------------------------------------------------- */
/* Format／support decimal · minutes                                           */
/* -------------------------------------------------------------------------- */
assert(formatNaturalDuration(0, "en") === "0 hr 0 min", "EN zero primary");
assert(formatNaturalDuration(0, "zh") === "0 小時 0 分鐘", "ZH zero primary");
assert(formatNaturalDuration(500, "en") === "8 hr 20 min", "EN 500 min primary");
assert(formatDecimalHours(500, "en") === "8.33 hours", "decimal 500 → 8.33 hours");
assert(formatDecimalHours(480, "en") === "8 hours", "decimal 480 → 8 hours");
assert(
	formatSupportLine1(480, true, "en") === "8 hours · 480 minutes · Next day",
	"support overnight EN",
);
assert(
	formatSupportLine1(480, true, "zh") === "8 小時 · 480 分鐘 · 隔天",
	"support overnight ZH",
);

/* -------------------------------------------------------------------------- */
/* Desktop parse smoke（contract lock，不改規則）                               */
/* -------------------------------------------------------------------------- */
assert(parseRangeInput("09:00-18:00").status === "valid", "range 09:00-18:00 valid");
assert(parseRangeInput("09001800").status === "invalid", "range 09001800 invalid");
assert(
	parseBreakInput("30").status === "valid" && parseBreakInput("30").totalMinutes === 30,
	"break 30 → 30 min",
);
assert(parseBreakInput("0130").normalized === "01:30", "break 0130 normalize");

/* -------------------------------------------------------------------------- */
/* Mobile completion helpers（與 B2C contract 對齊）                             */
/* -------------------------------------------------------------------------- */
{
	const c = completeMobileClockPair("9", "");
	assert(c.status === "complete" && c.hh === "09" && c.mm === "00", "clock 9:__ → 09:00");
}
assert(completeMobileClockPair("", "30").status === "incomplete", "clock __:30 incomplete");
assert(
	parseBreakDurationSegments("", "30").status === "valid" &&
		parseBreakDurationSegments("", "30").totalMinutes === 30,
	"break duration __:30 → 30",
);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
	process.exit(1);
}
