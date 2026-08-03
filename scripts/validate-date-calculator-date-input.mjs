/**
 * Deterministic validation for Date Calculator B2.2 Desktop Smart Date adapter.
 * Imports the thin adapter（which reuses DBD engine + DC 1900–2200 range）.
 * Does not copy a second parser implementation.
 *
 * Run: node scripts/validate-date-calculator-date-input.mjs
 */
import {
	applySegmentInputChange,
	createCompositionGuard,
	createStartDateController,
	emptyDateSegments,
	formatSegmentsDisplay,
	formatSegmentsNormalized,
	isDateInAllowedRange,
	isEntryCompleteForCommit,
	MAX_DATE_YEAR,
	MIN_DATE_YEAR,
	normalizeSegmentsForBlur,
	parseDateInputText,
	resolveFieldStatus,
	segmentsFromPastedText,
	segmentsFromStreamDigits,
	setCompositionActive,
	shouldDeferInputWhileComposing,
} from "../src/lib/dateCalculatorDateInput.ts";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const adapterPath = join(rootDir, "src/lib/dateCalculatorDateInput.ts");
const scriptPath = join(rootDir, "src/scripts/date-calculator.ts");
const astroPath = join(
	rootDir,
	"src/components/tools/date-calculator-v2/DateCalculatorV2.astro",
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
		assert(
			status === "invalid" || date === null,
			`${label}: expected invalid (${text}) got ${status}`,
		);
		assert(date === null, `${label}: date should be null`);
		return;
	}
	assert(status === "valid", `${label}: expected valid (${text}) got ${status}`);
	assert(date !== null, `${label}: date present`);
	if (!date) return;
	assert(date.year === expected.year, `${label}: year`);
	assert(date.month === expected.month, `${label}: month`);
	assert(date.day === expected.day, `${label}: day`);
}

function assertTypedAndPasted(raw, expectedDisplay, label) {
	const typed = formatSegmentsNormalized(
		typeDigitsForward(emptyDateSegments(), raw),
	);
	const pasted = formatSegmentsNormalized(segmentsFromPastedText(raw));
	assert(typed === expectedDisplay, `${label} typed: ${typed} !== ${expectedDisplay}`);
	assert(pasted === expectedDisplay, `${label} paste: ${pasted} !== ${expectedDisplay}`);
	assert(typed === pasted, `${label}: typed/paste parity`);
}

console.log("validate-date-calculator-date-input");

// ---------------------------------------------------------------------------
// Static inspection — thin adapter, no second parser／no B2.3+ wiring
// ---------------------------------------------------------------------------
{
	const adapter = readFileSync(adapterPath, "utf8");
	const script = readFileSync(scriptPath, "utf8");
	const astro = readFileSync(astroPath, "utf8");

	assert(
		adapter.includes('from "./daysBetweenDatesDateInput.ts"'),
		"adapter must import DBD date-input engine",
	);
	assert(
		!adapter.includes("function segmentsFromStreamDigits"),
		"adapter must not redefine segmentsFromStreamDigits",
	);
	assert(
		!adapter.includes("function applySegmentInputChange"),
		"adapter must not redefine applySegmentInputChange",
	);
	assert(
		adapter.includes("2200") || adapter.includes("DATE_CALCULATOR_MAX"),
		"adapter must use DC max year 2200",
	);
	assert(MAX_DATE_YEAR === 2200, "MAX_DATE_YEAR === 2200");
	assert(MIN_DATE_YEAR === 1900, "MIN_DATE_YEAR === 1900");

	assert(script.includes("calculateDate("), "script wires calculateDate（B8）");
	assert(script.includes("rs:update"), "script updates ResultSummary（B8）");
	assert(
		script.includes("createDateCalculatorCalendarAdapter") &&
			!script.includes("createDesktopCalendar(") &&
			!adapter.includes("DesktopCalendar") &&
			!adapter.includes("desktop-calendar"),
		"B2.3 calendar wiring stays behind its thin adapter and outside date parsing",
	);
	assert(
		!adapter.includes("[data-dcv2-sheet-start]") &&
			!adapter.includes("initMobileStartDate") &&
			!adapter.includes("data-dcv2-ame-start"),
		"date-input adapter stays free of Mobile DOM wiring",
	);
	assert(
		script.includes("createAdaptiveMobileEditor") &&
			astro.includes("data-dcv2-ame-start"),
		"B8 AME wires Mobile native date；shared StartDateApi remains Desktop＋commit source",
	);
	assert(
		!adapter.includes("data-dcv2-duration") &&
			!adapter.includes("data-dcv2-sheet-duration") &&
			!adapter.includes("data-dcv2-direction"),
		"date-input adapter stays free of duration／direction wiring",
	);
	assert(
		script.includes("initDirectionAndDuration") &&
			script.includes("createDurationController"),
		"B2.5 duration runtime lives in the script layer, not the date parser",
	);
	assert(
		script.includes("initDesktopStartDateInput"),
		"script mounts desktop start adapter",
	);
	assert(
		astro.includes("data-dcv2-desktop-start"),
		"astro keeps desktop start hook",
	);
	assert(
		!/\breadonly\b/.test(
			astro.slice(
				astro.indexOf("data-dcv2-desktop-start") - 80,
				astro.indexOf("data-dcv2-desktop-start") + 200,
			),
		),
		"desktop start input is editable (no readonly)",
	);

	// Adapter file stays thin relative to a copied parser family
	assert(
		adapter.split("\n").length < 400,
		`adapter should stay thin (lines=${adapter.split("\n").length})`,
	);
}

// ---------------------------------------------------------------------------
// Numeric inference
// ---------------------------------------------------------------------------
assertTypedAndPasted("199011", "1990 / 01 / 01", "6-digit 199011");
assertTypedAndPasted("1950820", "1950 / 08 / 20", "7-digit 1950820");
assertTypedAndPasted("1950102", "1950 / 10 / 02", "7-digit 1950102");
assertTypedAndPasted("1950131", "1950 / 01 / 31", "7-digit 1950131");
assertTypedAndPasted("19900101", "1990 / 01 / 01", "8-digit 19900101");
assertTypedAndPasted("19991122", "1999 / 11 / 22", "8-digit 19991122");
assertTypedAndPasted("20000229", "2000 / 02 / 29", "leap 2000-02-29");

assertParse("20260230", null, "invalid Gregorian 2026-02-30");
assertParse("18991231", null, "below min 1899-12-31");
assertParse("22010101", null, "above max 2201-01-01");
assertParse("22001231", { year: 2200, month: 12, day: 31 }, "DC max 2200-12-31");
assertParse("19000101", { year: 1900, month: 1, day: 1 }, "DC min 1900-01-01");

// ---------------------------------------------------------------------------
// Continuous input
// ---------------------------------------------------------------------------
{
	const mid6 = typeDigitsForward(emptyDateSegments(), "199911");
	assert(
		isEntryCompleteForCommit(mid6) === false,
		"continuous 199911 must not commit mid-stream",
	);
	const mid7 = typeDigitsForward(emptyDateSegments(), "1999112");
	assert(
		isEntryCompleteForCommit(mid7) === false,
		"continuous 1999112 must not commit mid-stream",
	);
	const full = typeDigitsForward(emptyDateSegments(), "19991122");
	assert(
		formatSegmentsNormalized(full) === "1999 / 11 / 22",
		"continuous 19991122 → 1999 / 11 / 22",
	);
	assert(
		isEntryCompleteForCommit(full) === true,
		"8-digit continuous valid may commit",
	);
	assert(
		formatSegmentsNormalized(full) !== "1999 / 01 / 12",
		"must not mis-infer 1999 / 01 / 12",
	);
}

{
	const typed = typeDigitsForward(emptyDateSegments(), "19991122");
	const pasted = segmentsFromPastedText("19991122");
	assert(
		formatSegmentsNormalized(typed) === formatSegmentsNormalized(pasted),
		"typed／paste 19991122 parity",
	);
}

{
	const six = segmentsFromStreamDigits("199011");
	assert(isEntryCompleteForCommit(six) === false, "6-digit stream not commit while typing");
	assert(
		isEntryCompleteForCommit(six, { fromBlurOrEnter: true }) === true,
		"6-digit blur／Enter may commit when valid",
	);
	assert(
		isEntryCompleteForCommit(six, { fromPaste: true }) === true,
		"6-digit paste complete may commit when valid",
	);
	const normalized = formatSegmentsNormalized(normalizeSegmentsForBlur(six));
	assert(normalized === "1990 / 01 / 01", "6-digit blur normalize");
}

// ---------------------------------------------------------------------------
// Separator input
// ---------------------------------------------------------------------------
assertTypedAndPasted("2026/7/4", "2026 / 07 / 04", "slash 2026/7/4");
assertTypedAndPasted("2026 / 07 / 04", "2026 / 07 / 04", "slash spaced");
assertTypedAndPasted("2026-7-4", "2026 / 07 / 04", "dash 2026-7-4");
assertTypedAndPasted("2026-07-04", "2026 / 07 / 04", "dash padded");
assertParse("2026/7/4", { year: 2026, month: 7, day: 4 }, "parse slash");
assertParse("2026-7-4", { year: 2026, month: 7, day: 4 }, "parse dash");

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------
assert(resolveFieldStatus(emptyDateSegments()) === "empty", "empty state");
{
	const yearOnly = {
		...emptyDateSegments(),
		year: "2026",
		preferStream: false,
	};
	assert(resolveFieldStatus(yearOnly) === "incomplete", "incomplete year");
}
{
	const noMonth = {
		...emptyDateSegments(),
		year: "2026",
		month: "",
		day: "04",
		openMonth: true,
		openDay: true,
		preferStream: false,
	};
	assert(resolveFieldStatus(noMonth) === "incomplete", "incomplete month");
}
{
	const noDay = {
		...emptyDateSegments(),
		year: "2026",
		month: "07",
		day: "",
		openMonth: true,
		openDay: true,
		preferStream: false,
	};
	assert(resolveFieldStatus(noDay) === "incomplete", "incomplete day");
}
assert(
	resolveFieldStatus(segmentsFromPastedText("20260712")) === "valid",
	"complete valid",
);
assert(
	resolveFieldStatus(segmentsFromPastedText("20260230")) === "invalid",
	"complete invalid",
);

{
	const controller = createStartDateController();
	controller.setDate({ year: 2026, month: 7, day: 12 });
	assert(controller.getSnapshot().status === "valid", "setDate valid");
	assert(controller.getSnapshot().date?.day === 12, "setDate keeps civil day");
	controller.applyPaste("20260230");
	const afterInvalid = controller.commitNormalize();
	assert(afterInvalid.status === "invalid", "valid → invalid");
	assert(afterInvalid.date === null, "valid → invalid clears date");
	controller.destroy();
}

{
	const controller = createStartDateController();
	controller.applyPaste("20260712");
	controller.commitNormalize();
	const formatted = controller.getSnapshot().normalizedDisplay;
	const { snapshot } = controller.applyInputChange(
		"deleteContentBackward",
		null,
		0,
		formatted.length,
	);
	assert(snapshot.status === "empty", "full selection delete → empty");
	controller.destroy();
}

// ---------------------------------------------------------------------------
// Segment editing
// ---------------------------------------------------------------------------
{
	let segments = {
		...emptyDateSegments(),
		year: "1990",
		month: "04",
		day: "04",
		openMonth: true,
		openDay: true,
		preferStream: false,
	};
	const yearStart = 0;
	const yearEnd = 4;
	({ segments } = applySegmentInputChange(
		segments,
		"deleteContentBackward",
		null,
		yearStart,
		yearEnd,
	));
	assert(segments.year === "", "delete year segment");
	assert(segments.month === "04", "month preserved after year delete");
	assert(segments.day === "04", "day preserved after year delete");
	assert(segments.preferStream === false, "preferStream stays false");
}

{
	let segments = {
		...emptyDateSegments(),
		year: "1990",
		month: "04",
		day: "04",
		openMonth: true,
		openDay: true,
		preferStream: false,
	};
	const monthStart = formatSegmentsDisplay(segments).indexOf("04");
	({ segments } = applySegmentInputChange(
		segments,
		"deleteContentBackward",
		null,
		monthStart,
		monthStart + 2,
	));
	assert(segments.year === "1990", "year preserved after month delete");
	assert(segments.month === "", "month deleted");
	assert(segments.day === "04", "day preserved after month delete");
}

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
		"segment 2000/1/23 stays 2000 / 01 / 23",
	);
	assert(segments.preferStream === false, "formatted segments do not re-stream");
}

// ---------------------------------------------------------------------------
// Boundaries
// ---------------------------------------------------------------------------
assert(isDateInAllowedRange({ year: 1900, month: 1, day: 1 }), "min valid");
assert(isDateInAllowedRange({ year: 2200, month: 12, day: 31 }), "max valid");
assert(!isDateInAllowedRange({ year: 1899, month: 12, day: 31 }), "below min");
assert(!isDateInAllowedRange({ year: 2201, month: 1, day: 1 }), "above max");
assertParse("19000229", null, "1900-02-29 invalid");
assertParse("20000229", { year: 2000, month: 2, day: 29 }, "2000-02-29 valid");
assertParse("21000229", null, "2100-02-29 invalid");
assertParse("22000229", null, "2200-02-29 invalid");
assertParse("21001231", { year: 2100, month: 12, day: 31 }, "2100 still in DC range");

// ---------------------------------------------------------------------------
// Safety
// ---------------------------------------------------------------------------
{
	const long = "1".repeat(40);
	const { status, date } = parseDateInputText(long);
	assert(date === null, "overlong digits → no valid date");
	assert(status === "invalid" || status === "incomplete", "overlong safe status");
}
assertParse("abcdef", null, "illegal letters");
assertParse("2026/13/01", null, "invalid month with slash");
assertParse("2026--01", null, "mixed invalid separators");

{
	const guard = createCompositionGuard();
	assert(shouldDeferInputWhileComposing(guard) === false, "composition idle");
	setCompositionActive(guard, true);
	assert(shouldDeferInputWhileComposing(guard) === true, "composition active defers");
	setCompositionActive(guard, false);
	assert(shouldDeferInputWhileComposing(guard) === false, "composition ended");
}

{
	const a = createStartDateController();
	const b = createStartDateController();
	a.setDate({ year: 2020, month: 1, day: 1 });
	b.setDate({ year: 2021, month: 2, day: 2 });
	assert(a.getSnapshot().date?.year === 2020, "controllers are independent");
	assert(b.getSnapshot().date?.year === 2021, "second controller independent");
	a.destroy();
	b.clear();
	assert(b.getSnapshot().status === "empty", "clear → empty");
	b.destroy();
}

{
	const started = Date.now();
	for (let i = 0; i < 200; i += 1) {
		parseDateInputText("19991122");
		parseDateInputText("not-a-date");
	}
	assert(Date.now() - started < 500, "parser suite stays fast");
}

// ---------------------------------------------------------------------------
console.log("");
console.log(`Result: ${passed} passed, ${failed} failed`);
if (failed > 0) {
	console.log("FAIL");
	process.exitCode = 1;
} else {
	console.log("PASS");
}
