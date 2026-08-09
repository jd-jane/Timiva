/**
 * Hours Calculator — AME／segment adopter validator（B2B）.
 *
 * Scope：Hours ↔ Adaptive Mobile Editor wiring／6 numeric segments／
 * HH／MM digit rules／same-group auto-advance／Clear／live lifecycle.
 * Does NOT validate duration math、overnight、ResultSummary live results（B2C）.
 *
 * Run: node scripts/validate-hours-calculator-adopter.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
	evaluateHoursSegmentDigit,
	hoursGroupHasInvalidSegment,
	hoursPairMmField,
	hoursSegmentStatus,
	parseBreakDurationSegments,
	completeMobileClockPair,
} from "../src/lib/hoursCalculatorSegmentInput.ts";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(rootDir, path), "utf8");
const exists = (path) => existsSync(join(rootDir, path));

const astro = read("src/components/tools/hours-calculator-v2/HoursCalculatorV2.astro");
const script = read("src/scripts/hours-calculator.ts");
const adapter = read("src/scripts/hours-calculator-ame-adapter.ts");
const segmentLib = read("src/lib/hoursCalculatorSegmentInput.ts");
const ctrl = read("src/scripts/adaptive-mobile-editor-controller.ts");
const ameShell = read("src/components/tools/shared/AdaptiveMobileEditor.astro");
const enRoute = read("src/pages/en/hours-calculator/index.astro");
const zhRoute = read("src/pages/zh/hours-calculator/index.astro");

const stripComments = (source) =>
	source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

const executableScript = stripComments(script);
const executableAdapter = stripComments(adapter);

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

console.log("validate-hours-calculator-adopter（Hours AME／segment contract）\n");

/* -------------------------------------------------------------------------- */
/* Foundation                                                                  */
/* -------------------------------------------------------------------------- */
assert(exists("src/scripts/hours-calculator-ame-adapter.ts"), "Hours AME adapter tracked");
assert(exists("src/lib/hoursCalculatorSegmentInput.ts"), "Hours segment digit lib tracked");
assert(astro.includes("AdaptiveMobileEditor"), "Hours imports AdaptiveMobileEditor");
assert(
	(astro.match(/<AdaptiveMobileEditor/g) || []).length === 1,
	"Exactly one AdaptiveMobileEditor instance",
);
assert(/id="hcv2-ame"/.test(astro), "AME instance id is hcv2-ame");
assert(/createAdaptiveMobileEditor/.test(script), "Script boots shared AME controller");
assert(/ameSessions\.has\(root\)/.test(script), "Single-session guard per tool root");
assert(
	/querySelectorAll<HTMLElement>\("\[data-hours-calculator-v2\]"\)/.test(script) ||
		/querySelectorAll[\s\S]*\[data-hours-calculator-v2\]/.test(script),
	"Boot walks Hours roots only",
);
assert(
	!/document\.body\.appendChild/.test(executableScript),
	"No body portal append",
);
assert(
	!/msb-scroll-lock|MobileBottomSheet|mobile-bottom-sheet-controller/.test(astro + script),
	"No MSB runtime",
);
assert(
	!/\bvisualViewport\b/.test(executableScript) &&
		!/\bvisualViewport\b/.test(executableAdapter),
	"No visualViewport",
);
assert(
	!/contenteditable|clipboard|navigator\.clipboard|paste/i.test(executableScript + executableAdapter),
	"No Mobile paste／clipboard／contenteditable workaround",
);
assert(
	!/inputmode|type=["']tel["']|type=["']number["']/.test(
		astro.slice(astro.indexOf("data-hcv2-ame-form"), astro.indexOf("</AdaptiveMobileEditor>")),
	),
	"No native numeric keyboard on AME segments",
);

/* -------------------------------------------------------------------------- */
/* Six numeric fields                                                          */
/* -------------------------------------------------------------------------- */
assert(
	/data-ame-numeric-field=\{`\$\{row\.key\}-hh`\}/.test(astro) &&
		/data-ame-numeric-field=\{`\$\{row\.key\}-mm`\}/.test(astro),
	"AME numeric fields for HH and MM per row（6 fields via 3 rows）",
);
assert(
	(astro.match(/data-ame-numeric-field=/g) || []).length === 2 &&
		/ameRows\.map/.test(astro),
	"HH＋MM numeric markers in ameRows map（renders 6 fields）",
);
assert(
	/HOURS_AME_NUMERIC_FIELDS/.test(adapter) &&
		/maxLength:\s*2/.test(adapter) &&
		/allowEmpty:\s*true/.test(adapter),
	"numericFields：maxLength 2＋allowEmpty true",
);
assert(
	/"start-hh"[\s\S]*"start-mm"[\s\S]*"end-hh"[\s\S]*"end-mm"[\s\S]*"break-hh"[\s\S]*"break-mm"/.test(
		segmentLib,
	),
	"Six field ids listed in segment lib",
);

/* -------------------------------------------------------------------------- */
/* Live lifecycle＋Clear                                                       */
/* -------------------------------------------------------------------------- */
assert(/lifecycle:\s*"live"/.test(script), "Hours AME opts into lifecycle live");
assert(
	/getResetDraft:[\s\S]{0,80}HOURS_AME_RESET_DEFAULTS/.test(executableScript) ||
		/getResetDraft:[\s\S]{0,120}HOURS_AME_RESET_DEFAULTS/.test(script),
	"Clear／Reset uses HOURS_AME_RESET_DEFAULTS",
);
assert(
	/data-ame-reset/.test(ameShell) && /data-hcv2-clear-times-label/.test(astro),
	"Clear uses shared data-ame-reset＋Hours label",
);
assert(
	/function resetDraftInternal\(\)[\s\S]{0,800}applyLiveSyncFromDraft\(\)/.test(
		stripComments(ctrl),
	),
	"Shared Reset applies live sync while open",
);
assert(
	/evaluateHoursResult/.test(script) &&
		exists("src/lib/hoursCalculatorEvaluate.ts"),
	"B2C shared evaluateHoursResult wired",
);
assert(
	/breakExceedsGross/.test(adapter + script + read("src/lib/hoursCalculatorEvaluate.ts")),
	"break > gross semantic flag retained for Mobile !",
);
assert(
	/publishEvaluation|data-hcv2-capsule-range/.test(script),
	"ResultSummary／capsule sync from shared evaluation",
);
assert(
	!/contenteditable|clipboard|navigator\.clipboard|\bpaste\b/i.test(
		executableScript + executableAdapter,
	),
	"Still no Mobile paste workaround",
);

/* -------------------------------------------------------------------------- */
/* Digit rules＋auto-advance（runtime）                                         */
/* -------------------------------------------------------------------------- */
assert(hoursPairMmField("start-hh") === "start-mm", "HH pairs to same-group MM");
assert(hoursPairMmField("end-hh") === "end-mm", "end-hh → end-mm");
assert(hoursPairMmField("break-mm") === null, "MM field has no pair advance");

{
	const firstLow = evaluateHoursSegmentDigit("hh", "", "1", "start-hh");
	assert(
		firstLow.accept === true && !firstLow.padTo && !firstLow.advanceTo,
		"HH first 0–2 waits",
	);
}
{
	const pad = evaluateHoursSegmentDigit("hh", "", "9", "start-hh");
	assert(
		pad.accept === true && pad.padTo === "09" && pad.advanceTo === "start-mm",
		"HH first 3–9 pads and advances to same-group MM",
	);
}
{
	const complete = evaluateHoursSegmentDigit("hh", "1", "5", "end-hh");
	assert(
		complete.accept === true && complete.advanceTo === "end-mm",
		"HH legal two digits advance to same-group MM only",
	);
}
{
	const block = evaluateHoursSegmentDigit("hh", "2", "4", "start-hh");
	assert(block.accept === false, "HH impossible second digit blocked");
}
{
	const mmWait = evaluateHoursSegmentDigit("mm", "", "4", "start-mm");
	assert(mmWait.accept === true && !mmWait.advanceTo, "MM first 0–5 waits；no cross-group advance");
}
{
	const mmPad = evaluateHoursSegmentDigit("mm", "", "7", "end-mm");
	assert(
		mmPad.accept === true && mmPad.padTo === "07" && !mmPad.advanceTo,
		"MM first 6–9 pads；does not advance to next group",
	);
}
{
	const mmOk = evaluateHoursSegmentDigit("mm", "5", "9", "break-mm");
	assert(mmOk.accept === true && !mmOk.advanceTo, "MM legal two digits complete without advance");
}
{
	const mmBlock = evaluateHoursSegmentDigit("mm", "5", "a", "start-mm");
	assert(mmBlock.accept === false, "Non-digit rejected");
}

assert(hoursSegmentStatus("hh", "24") === "invalid", "HH 24 invalid");
assert(hoursSegmentStatus("mm", "60") === "invalid", "MM 60 invalid");
assert(hoursSegmentStatus("hh", "2") === "incomplete", "Single HH digit incomplete（no !）");
assert(
	hoursGroupHasInvalidSegment("24", "00") === true &&
		hoursGroupHasInvalidSegment("09", "00") === false &&
		hoursGroupHasInvalidSegment("0", "00") === false,
	"Row ! only for complete invalid segments",
);

assert(
	/acceptHoursAmeNumericCandidate/.test(adapter) &&
		/acceptNumericCandidate/.test(script),
	"Candidate gate wired（adapter＋script）",
);
assert(
	/takeHoursAmePending|peekHoursAmePending/.test(adapter) &&
		/focusHoursAmeField/.test(adapter + script),
	"Pad／advance pending＋field focus without shared setActiveField API",
);
assert(
	/advanceTo[\s\S]{0,40}start-mm|hoursPairMmField/.test(segmentLib),
	"Auto-advance only via same-group HH→MM helper",
);
assert(
	/hoursPairMmField/.test(segmentLib) &&
		!/advanceTo:\s*["']end-hh["']/.test(segmentLib) &&
		!/advanceTo:\s*["']break-hh["']/.test(segmentLib),
	"No cross-group advance targets in segment lib",
);

/* -------------------------------------------------------------------------- */
/* Mobile Break duration partial-pair（B2C contract fix）                       */
/* -------------------------------------------------------------------------- */
{
	const cases = [
		{ hh: "", mm: "30", minutes: 30, label: "__ : 30 → 30 min" },
		{ hh: "0", mm: "30", minutes: 30, label: "0 : 30 → 30 min" },
		{ hh: "1", mm: "30", minutes: 90, label: "1 : 30 → 90 min" },
		{ hh: "01", mm: "30", minutes: 90, label: "01 : 30 → 90 min" },
		{ hh: "1", mm: "", minutes: 60, label: "1 : __ → 60 min" },
		{ hh: "00", mm: "00", minutes: 0, label: "00 : 00 → 0" },
	];
	for (const c of cases) {
		const parsed = parseBreakDurationSegments(c.hh, c.mm);
		assert(
			parsed.status === "valid" && parsed.totalMinutes === c.minutes,
			`Mobile Break ${c.label}`,
		);
	}
	assert(
		parseBreakDurationSegments("", "").status === "empty",
		"Mobile Break __ : __ → empty（不扣除）",
	);
	assert(
		hoursSegmentStatus("hh", "") === "empty" &&
			hoursSegmentStatus("mm", "30") === "valid" &&
			hoursSegmentStatus("hh", "1") === "incomplete" &&
			hoursSegmentStatus("hh", "09") === "valid" &&
			hoursSegmentStatus("mm", "00") === "valid",
		"Start／End segment status still requires 2 digits for valid（Break duration is separate）",
	);
	assert(
		/parseAmeDraftToRange[\s\S]{0,200}parseSegmentPair/.test(adapter) &&
			!/parseAmeDraftToRange[\s\S]{0,200}parseBreakDurationSegments/.test(adapter),
		"Start／End still use parseSegmentPair（complete HH:MM）",
	);
	assert(
		/parseBreakDurationSegments/.test(segmentLib) &&
			/parseAmeDraftToBreak[\s\S]{0,200}parseBreakDurationSegments/.test(adapter),
		"parseAmeDraftToBreak uses duration partial-pair parser",
	);
}

/* -------------------------------------------------------------------------- */
/* Mobile Start／End clock completion（離開時間組）                              */
/* -------------------------------------------------------------------------- */
{
	const clockCases = [
		{ hh: "9", mm: "", out: { hh: "09", mm: "00" }, label: "9:__ → 09:00" },
		{ hh: "9", mm: "5", out: { hh: "09", mm: "05" }, label: "9:5 → 09:05" },
		{ hh: "18", mm: "", out: { hh: "18", mm: "00" }, label: "18:__ → 18:00" },
	];
	for (const c of clockCases) {
		const result = completeMobileClockPair(c.hh, c.mm);
		assert(
			result.status === "complete" &&
				result.hh === c.out.hh &&
				result.mm === c.out.mm,
			`Mobile Start／End ${c.label}`,
		);
	}
	assert(
		completeMobileClockPair("", "30").status === "incomplete",
		"Mobile Start／End __:30 → incomplete（不猜測 HH）",
	);
	assert(
		completeMobileClockPair("", "").status === "empty",
		"Mobile Start／End empty → empty",
	);
	assert(
		/completeMobileClockPair/.test(script) &&
			/completeClockGroup|onLeaveClockGroup/.test(script),
		"Start／End completion wired on leave group／Done",
	);
	assert(
		!/completeMobileClockPair/.test(adapter) ||
			!/parseAmeDraftToBreak[\s\S]{0,80}completeMobileClockPair/.test(adapter),
		"Break path does not use clock completion",
	);
}

/* -------------------------------------------------------------------------- */
/* Row error slots＋routes                                                     */
/* -------------------------------------------------------------------------- */
assert(
	/data-hcv2-ame-invalid=\{row\.key\}/.test(astro) ||
		/data-hcv2-ame-invalid/.test(astro),
	"Fixed row ! slots present",
);
assert(/syncHoursAmeRowErrors/.test(adapter + script), "Row ! sync wired");
assert(
	enRoute.includes("HoursCalculatorV2") && zhRoute.includes("HoursCalculatorV2"),
	"EN／ZH routes mount HoursCalculatorV2",
);

/* -------------------------------------------------------------------------- */
/* Shared AME untouched by Hours batch                                         */
/* -------------------------------------------------------------------------- */
assert(
	!script.includes("adaptive-mobile-editor-controller.ts") ||
		/from ["']\.\/adaptive-mobile-editor-controller["']/.test(script),
	"Hours imports shared controller（does not vendor）",
);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
	process.exit(1);
}
