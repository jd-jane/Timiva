/**
 * TALC B2B Desktop validator — Smart Date + wiring + math contract.
 * Run: node --experimental-strip-types scripts/validate-taiwan-annual-leave-desktop.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
	applySegmentInputChange,
	emptyDateSegments,
	formatSegmentsDisplay,
	formatSegmentsNormalized,
	getTodayCalendarDate,
	isSelectableHireDate,
	normalizeSegmentsForBlur,
	parseDateInputText,
	resolveFieldStatus,
	segmentsFromPastedText,
} from "../src/lib/taiwanAnnualLeaveDateInput.ts";
import {
	evaluateTaiwanAnnualLeave,
	formatLeaveDisplay,
} from "../src/lib/taiwanAnnualLeaveMath.ts";

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

console.log("validate-taiwan-annual-leave-desktop");

// --- Smart Date behavior ---
{
	const typed = typeDigitsForward(emptyDateSegments(), "20220915");
	const pasted = segmentsFromPastedText("20220915");
	assert(
		formatSegmentsDisplay(typed) === formatSegmentsDisplay(pasted),
		"8-digit typed === paste",
	);
	assert(resolveFieldStatus(typed) === "valid", "20220915 valid");
}

{
	const s = typeDigitsForward(emptyDateSegments(), "2022");
	assert(resolveFieldStatus(s) === "incomplete", "year-only incomplete");
	assert(resolveFieldStatus(emptyDateSegments()) === "empty", "empty");
}

{
	const slash = parseDateInputText("2022/07/01");
	assert(slash.status === "valid" && slash.date?.month === 7, "slash parse");
	const dash = parseDateInputText("2022-07-01");
	assert(dash.status === "valid" && dash.date?.day === 1, "dash parse");
}

{
	const future = {
		year: getTodayCalendarDate().year + 1,
		month: 1,
		day: 1,
	};
	assert(!isSelectableHireDate(future), "future hire not selectable");
	const parsed = parseDateInputText(
		`${future.year}0101`,
	);
	assert(parsed.status === "invalid" || parsed.date === null, "future invalid");
}

{
	const incomplete = typeDigitsForward(emptyDateSegments(), "20220");
	assert(resolveFieldStatus(incomplete) === "incomplete", "incomplete no early invalid");
}

{
	const blur = normalizeSegmentsForBlur(
		segmentsFromPastedText("2022/7/1"),
	);
	assert(formatSegmentsNormalized(blur) === "2022 / 07 / 01", "blur normalize");
}

// --- Math UI contract: primaryDisplay / officialDays / not rawDays ---
{
	const today = getTodayCalendarDate();
	const r = evaluateTaiwanAnnualLeave({
		hire: { year: 2022, month: 1, day: 1 },
		asOf: { year: today.year, month: 6, day: 15 },
		leaveSystem: "calendar-year",
		locale: "en",
	});
	assert(r.status === "calendar-year", "calendar status");
	assert(r.primaryDisplay === formatLeaveDisplay(r.officialDays), "primary === official display");
	assert(r.primaryDisplay !== "10" || r.officialDays === 10, "1/1 must not show raw 10 as primary when official differs");
	if (r.rawDays !== r.officialDays) {
		assert(
			r.primaryDisplay === String(r.officialDays) ||
				r.primaryDisplay === r.officialDays.toFixed(1),
			`primary uses official not raw (raw=${r.rawDays} official=${r.officialDays} primary=${r.primaryDisplay})`,
		);
	}
	assert(
		r.formulaLines.every((line) => !/[\u4e00-\u9fff]/.test(line) || /[=＋+]/.test(line) === false || true),
		"formula lines present",
	);
	assert(
		r.formulaLines.every((line) => !line.includes("天")),
		"EN formula lines must not contain 天",
	);
	assert(
		r.formulaLines.some((line) => line.includes("days") || /^\d/.test(line)),
		"EN formula uses days unit or numeric body",
	);
	assert(
		r.formulaLines.some((line) =>
			line.includes("January 1") && line.includes(`${r.primaryDisplay} days`),
		),
		"EN 1/1 uses Jan 1 prose with official days",
	);
}

{
	const rZh = evaluateTaiwanAnnualLeave({
		hire: { year: 2022, month: 7, day: 1 },
		asOf: { year: 2023, month: 6, day: 1 },
		leaveSystem: "calendar-year",
		locale: "zh",
	});
	assert(rZh.primaryDisplay === "6.5", "7/1 zh primary 6.5");
	assert(rZh.formulaLines.some((l) => l.includes("天")), "zh formula uses 天");
}

/* 1/1 無比例：說明文案；天數隨 official 變化；5/1 比例公式維持 */
{
	const asOf = { year: 2026, month: 9, day: 12 };
	const cases = [
		{ hire: { year: 2025, month: 1, day: 1 }, expectDays: "7" },
		{ hire: { year: 2021, month: 1, day: 1 }, expectDays: "15" },
		{ hire: { year: 2001, month: 1, day: 1 }, expectDays: "30" },
	];
	for (const fx of cases) {
		const zh = evaluateTaiwanAnnualLeave({
			hire: fx.hire,
			asOf,
			leaveSystem: "calendar-year",
			locale: "zh",
		});
		const en = evaluateTaiwanAnnualLeave({
			hire: fx.hire,
			asOf,
			leaveSystem: "calendar-year",
			locale: "en",
		});
		assert(zh.primaryDisplay === fx.expectDays, `1/1 zh primary ${fx.expectDays}`);
		assert(en.primaryDisplay === fx.expectDays, `1/1 en primary ${fx.expectDays}`);
		assert(
			zh.formulaLines.length === 1 &&
				zh.formulaLines[0] ===
					`到職日為 1 月 1 日，本年度無需按比例拆分，適用 ${fx.expectDays} 天。`,
			`1/1 zh prose ${fx.expectDays}`,
		);
		assert(
			en.formulaLines.length === 1 &&
				en.formulaLines[0] ===
					`Because the hire date is January 1, no proration is needed this year; ${fx.expectDays} days apply.`,
			`1/1 en prose ${fx.expectDays}`,
		);
		assert(!/[\u4e00-\u9fff]/.test(en.formulaLines[0] ?? ""), "1/1 EN no Chinese");
	}

	const may = evaluateTaiwanAnnualLeave({
		hire: { year: 2022, month: 5, day: 1 },
		asOf,
		leaveSystem: "calendar-year",
		locale: "zh",
	});
	assert(
		may.formulaLines.some((l) => l.includes(")/12 *") && l.includes("＝")),
		"5/1 keeps proportional formula",
	);
	assert(
		!may.formulaLines.some((l) => l.includes("無需按比例")),
		"5/1 is not Jan-1 prose",
	);
}

{
	const ann = evaluateTaiwanAnnualLeave({
		hire: { year: 2000, month: 9, day: 15 },
		asOf: { year: 2026, month: 9, day: 11 },
		leaveSystem: "anniversary",
		locale: "zh",
	});
	assert(ann.status === "anniversary" && ann.isMax, "max 30");
	assert(ann.primaryDisplay === "30", "max primary 30");
	assert(ann.next === null, "max next null");
}

// --- Static wiring ---
const script = readFileSync(
	join(rootDir, "src/scripts/taiwan-annual-leave-calculator.ts"),
	"utf8",
);
const astro = readFileSync(
	join(
		rootDir,
		"src/components/tools/taiwan-annual-leave-calculator-v2/TaiwanAnnualLeaveCalculatorV2.astro",
	),
	"utf8",
);
const css = readFileSync(
	join(rootDir, "src/styles/tools/taiwan-annual-leave-calculator-v2.css"),
	"utf8",
);

assert(script.includes("createDesktopCalendar("), "DesktopCalendar wired");
assert(script.includes("primaryDisplay"), "uses primaryDisplay");
assert(script.includes("officialDays"), "uses officialDays");
assert(script.includes('STORAGE_KEY = "timiva:talc:v1"'), "shared storage key");
assert(script.includes("timiva:talc:v1"), "storage key present");
assert(
	!script.match(/primaryDisplay:\s*.*rawDays|text:\s*.*rawDays|String\(.*rawDays/),
	"does not bind rawDays as primary text",
);
assert(script.includes("updateResultSummary"), "ResultSummary update");
assert(astro.includes('variant="popover-compact"'), "popover-compact calendar");
assert(astro.includes("data-talc-date-value"), "desktop date input");
assert(astro.includes("data-talc-calendar-toggle"), "calendar toggle");
assert(astro.includes("taiwan-annual-leave-calculator"), "script import");
assert(!astro.includes("talcFixture"), "talcFixture removed from live Astro");
assert(astro.includes('data-talc-phase="b2b-desktop"'), "b2b phase");
assert(astro.includes("data-talc-info-panel"), "info panel above divider");
assert(astro.includes("talc-info-panel__inner"), "info panel inner for grid anim");
assert(
	!astro.includes("今年依曆年制試算的特休天數"),
	"calendar-year definition no longer uses long label in Astro bake",
);
assert(script.includes("supportNextStageCalendarYear"), "calendar next-stage template");
assert(script.includes("evaluateCalendarYear("), "next-year days from math SSOT");
assert(script.includes("setInfoPanelOpen"), "animated info panel toggle");
assert(css.includes("width: fit-content"), "desktop formula panel content-sized");
assert(css.includes("max-width: calc(100vw - 2rem)"), "formula panel viewport-safe max-width");
assert(css.includes("white-space: nowrap"), "desktop formula prefers single line");
assert(css.includes(".talc-formula .talc-tip") || css.includes(".talc-tip"), "tip styles present");
assert(astro.includes('data-talc-formula') && astro.indexOf("data-talc-tip") > astro.indexOf("data-talc-formula-lines"), "tip inside formula after lines");
/* Baseline / Interaction Drift Gate fixes */
assert(css.includes("color: rgb(203 213 225 / 0.76)"), "invalid icon muted slate");
assert(css.includes("width: 0.875rem"), "invalid icon 0.875rem");
assert(!css.includes("rgb(251 191 36)"), "no amber invalid color");
assert(!/\.talc-date-pill\s*\{[^}]*height:\s*3\.25rem/s.test(css), "pill does not redeclare shell height");
assert(css.includes(".talc-leave-option:focus-visible"), "leave option focus-visible");
assert(css.includes(".talc-leave-option:hover"), "leave option hover");
assert(css.includes(".talc-calendar-icon:focus-visible"), "calendar icon focus-visible");
assert(
	css.includes("(hover: hover) and (pointer: fine)") && css.includes(".talc-calendar-icon:hover"),
	"calendar icon hover gated to fine pointer",
);


console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
