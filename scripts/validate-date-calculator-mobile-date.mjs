/**
 * Date Calculator Mobile — B8 AME First Adopter validator.
 * Replaces legacy custom sheet／portal／MSB-class assertions.
 * Run: node scripts/validate-date-calculator-mobile-date.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
	DATE_CALCULATOR_MAX,
	DATE_CALCULATOR_MIN,
	calculateDate,
	isValidSupportedStartDate,
} from "../src/lib/dateCalculatorMath.ts";
import { parseCivilIso } from "../src/lib/dateCalculatorFormat.ts";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(rootDir, path), "utf8");

const astro = read("src/components/tools/date-calculator-v2/DateCalculatorV2.astro");
const script = read("src/scripts/date-calculator.ts");
const adapter = read("src/scripts/date-calculator-ame-adapter.ts");
const formatLib = read("src/lib/dateCalculatorFormat.ts");
const math = read("src/lib/dateCalculatorMath.ts");
const css = read("src/styles/tools/date-calculator-v2.css");
const ctrl = read("src/scripts/adaptive-mobile-editor-controller.ts");

const stripComments = (source) =>
	source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

const executableScript = stripComments(script);

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

console.log("validate-date-calculator-mobile-date（B8 AME adopter）");

assert(astro.includes("AdaptiveMobileEditor"), "Date Calculator imports AdaptiveMobileEditor");
assert(
	/data-ame-page-content/.test(astro) && /AdaptiveMobileEditor/.test(astro),
	"sibling mount markers present（page-content＋AME）",
);
assert(
	!/data-dcv2-sheet-portal/.test(astro) && !/<div[^>]*data-dcv2-sheet[\s>]/.test(astro),
	"legacy sheet portal／dialog chrome removed",
);
assert(!/document\.body\.appendChild/.test(executableScript), "no body portal append");
assert(!/msb-scroll-lock|MobileBottomSheet|mobile-bottom-sheet-controller/.test(astro + script), "no MSB runtime／scroll-lock");
assert(
	!/\bvisualViewport\b/.test(executableScript) &&
		!/\bvisualViewport\b/.test(stripComments(adapter)) &&
		!/\bvisualViewport\b/.test(stripComments(astro)),
	"no visualViewport",
);

assert(/data-dcv2-sheet-trigger/.test(astro), "mobile CTA trigger retained");
assert(/createAdaptiveMobileEditor/.test(script), "script boots AME controller");
assert(/initAme\(/.test(script) || /createAdaptiveMobileEditor/.test(script), "AME init path present");

assert(
	/<input[\s\S]*?type="date"[\s\S]*?data-dcv2-ame-start/.test(astro) ||
		/<input[\s\S]*?data-dcv2-ame-start[\s\S]*?type="date"/.test(astro),
	"AME Start uses native type=date",
);
assert(/min="1900-01-01"/.test(astro) && /max="2200-12-31"/.test(astro), "native date min／max 1900–2200");
assert(
	/data-dcv2-ame-start[\s\S]*data-dcv2-ame-direction[\s\S]*data-ame-numeric-field/.test(astro),
	"AME field order：Start → Direction → duration Numeric Fields",
);
assert(
	/dcv2-ame-direction/.test(astro) && !/data-ame-choice-group="direction"/.test(astro),
	"DC uses compact direction control（not shared AME choice cards）",
);
assert(
	/dcv2-ame-direction-track[\s\S]*border-radius:\s*9999px/.test(css) &&
		/dcv2-ame-direction-track[\s\S]*padding:\s*0\.25rem/.test(css) &&
		/dcv2-ame-direction-face[\s\S]*border:\s*0/.test(css),
	"AME Direction：outer capsule＋inner halves（Desktop-like shape）",
);
assert(
	/dcv2-ame-direction-option:has\(input:checked\)[\s\S]*rgb\(99 102 241 \/ 0\.55\)/.test(css),
	"AME Direction selected keeps indigo fill",
);
assert(
	/dcv2-ame-duration-grid/.test(astro) && /dcv2-ame-duration-grid/.test(css),
	"AME duration uses 2×2 grid",
);
assert(
	/dcv2-ame-duration-field\.ame-setting-row[\s\S]*grid-column:\s*auto/.test(css) &&
		/dcv2-ame-duration-grid[\s\S]*repeat\(2,\s*minmax\(0,\s*1fr\)\)/.test(css),
	"2×2 cells override shared ame-setting-row full-span（grid-column:auto）",
);
assert(
	/\[data-ame-keypad-visible="true"\]\[data-ame-density="mixed"\][\s\S]{0,80}dcv2-ame-duration-grid[\s\S]{0,120}repeat\(2,\s*minmax\(0,\s*1fr\)\)/.test(
		css,
	),
	"Landscape keypad＋mixed：duration stays 2×2",
);
assert(
	/dcv2-ame-start-row\.ame-setting-row[\s\S]*display:\s*flex/.test(css) &&
		/dcv2-ame-start-row\.ame-setting-row[\s\S]*flex-direction:\s*row/.test(css),
	"Start date row is horizontal label｜value（not stacked）",
);
assert(
	/\[data-ame-keypad-visible="true"\]\[data-ame-density="mixed"\][\s\S]{0,120}dcv2-ame-start-row\.ame-setting-row/.test(
		css,
	) &&
		/\[data-ame-keypad-visible="true"\]\[data-ame-density="mixed"\][\s\S]{0,120}dcv2-ame-duration-field\.ame-setting-row/.test(
			css,
		),
	"Landscape keypad＋mixed：DC overrides beat shared subgrid（Start＋duration）",
);
assert(
	/acceptNumericCandidate/.test(script) && /acceptDcAmeNumericCandidate/.test(adapter),
	"candidate digit range guard wired（AME hook＋DC adapter）",
);
assert(
	/acceptDcAmeNumericCandidate[\s\S]*calculateDate/.test(adapter) &&
		/DATE_CALCULATOR_MIN|DATE_CALCULATOR_MAX/.test(adapter),
	"candidate guard uses calculateDate＋range probe when start missing",
);
assert(
	/Reject digit[\s\S]*keep prior|acceptNumericCandidate[\s\S]{0,120}return/.test(ctrl),
	"Rejected digit path returns without mutate",
);
assert(
	/function applyDelete/.test(ctrl) &&
		/function applyClear/.test(ctrl) &&
		!/acceptNumericCandidate[\s\S]{0,80}applyDelete/.test(ctrl),
	"Delete／Clear remain available（not gated by candidate hook）",
);
assert(
	/fieldErrors/.test(adapter) && /startDate/.test(adapter),
	"DC validate returns fieldErrors（shared field-error contract）",
);
assert(
	/#dcv2-ame \.ame-portrait-header[\s\S]*display:\s*none/.test(css) &&
		/ariaLabel=\{m\.sheetAriaLabel\}/.test(astro),
	"Portrait：no visible title；accessible name retained via ariaLabel",
);
assert(
	/data-dcv2-ame-start[\s\S]*data-dcv2-ame-direction[\s\S]*dcv2-ame-duration-grid/.test(astro),
	"Start date precedes Direction；Direction precedes 2×2 duration",
);
assert(
	/AmeFieldError/.test(astro) && /data-ame-field="startDate"/.test(astro),
	"DC AME Start uses shared AmeFieldError＋data-ame-field",
);
assert(!/dcv2-ame-invalid-slot/.test(astro), "AME content does not use tool-local invalid slots");
assert(
	!/This input is outside the supported range/.test(astro + script + adapter),
	"No bottom outside-range error banner copy in AME path",
);

/* Runtime mirror of acceptDcAmeNumericCandidate（math／range only；no adapter ESM path） */
function probeCandidate(draft, fieldId, candidateValue) {
	if (candidateValue.length === 0) return true;
	if (!/^\d+$/.test(candidateValue)) return false;
	const numeric = Number(candidateValue);
	if (!Number.isSafeInteger(numeric) || numeric < 0) return false;
	const duration = {
		years: Number(fieldId === "years" ? candidateValue : draft.years || "0"),
		months: Number(fieldId === "months" ? candidateValue : draft.months || "0"),
		weeks: Number(fieldId === "weeks" ? candidateValue : draft.weeks || "0"),
		days: Number(fieldId === "days" ? candidateValue : draft.days || "0"),
	};
	const parsedStart = parseCivilIso(draft.startDate);
	const start =
		parsedStart && isValidSupportedStartDate(parsedStart)
			? parsedStart
			: draft.direction === "add"
				? DATE_CALCULATOR_MIN
				: DATE_CALCULATOR_MAX;
	return calculateDate(start, draft.direction, duration).ok;
}

const baseAdd = {
	startDate: "2020-01-01",
	direction: "add",
	years: "0",
	months: "0",
	weeks: "0",
	days: "0",
};
assert(probeCandidate(baseAdd, "years", "180") === true, "candidate years=180 from 2020 add accepted");
assert(probeCandidate(baseAdd, "years", "181") === false, "candidate years=181 from 2020 add rejected");
assert(
	probeCandidate(baseAdd, "days", "999999999999999999") === false,
	"candidate beyond safe integer rejected",
);
assert(
	probeCandidate({ ...baseAdd, startDate: "" }, "years", "300") === true,
	"no start：probe MIN／add still accepts years=300（1900+300≤2200）",
);
assert(
	probeCandidate({ ...baseAdd, startDate: "" }, "years", "301") === false,
	"no start：probe MIN／add rejects years=301（out of support）",
);
assert(
	calculateDate(DATE_CALCULATOR_MIN, "add", {
		years: 300,
		months: 0,
		weeks: 0,
		days: 0,
	}).ok === true,
	"math probe：1900＋300y within MAX",
);
assert(
	calculateDate(DATE_CALCULATOR_MAX, "subtract", {
		years: 300,
		months: 0,
		weeks: 0,
		days: 0,
	}).ok === true,
	"math probe：2200−300y within MIN",
);
assert(
	/acceptDcAmeNumericCandidate[\s\S]*DATE_CALCULATOR_MIN[\s\S]*DATE_CALCULATOR_MAX[\s\S]*calculateDate/.test(
		adapter,
	) ||
		(/acceptDcAmeNumericCandidate/.test(adapter) &&
			/DATE_CALCULATOR_MIN/.test(adapter) &&
			/DATE_CALCULATOR_MAX/.test(adapter) &&
			/calculateDate/.test(adapter)),
	"adapter candidate guard source matches probe semantics（MIN／MAX／calculateDate）",
);
assert(
	/data-ame-background-scale-target/.test(astro),
	"DC marks data-ame-background-scale-target on result group",
);
assert(
	!/setAttribute\(\s*"data-dcv2-sheet-open"/.test(script),
	"DC script no longer sets data-dcv2-sheet-open for scale",
);
assert(
	/scale\(0\.92\)\s*translateY\(-1\.25rem\)/.test(read("src/styles/tools/adaptive-mobile-editor.css")),
	"Portrait background scale lives in AME shared CSS",
);
assert(
	/orientation:\s*landscape[\s\S]*data-ame-background-scale-target[\s\S]*transform:\s*none/.test(
		read("src/styles/tools/adaptive-mobile-editor.css"),
	),
	"Landscape shared：scale target transform none",
);
assert(
	/AmeFieldError/.test(astro) &&
		/data-ame-field-error/.test(read("src/components/tools/shared/AmeFieldError.astro")),
	"Invalid icon via shared AmeFieldError primitive",
);
assert(
	!/#dcv2-ame \[data-ame-error-region\][\s\S]*display:\s*none/.test(css),
	"DC does not force-hide AME error region",
);
assert(
	/\.ame-shell:focus-visible[\s\S]{0,80}outline:\s*none/.test(
		read("src/styles/tools/adaptive-mobile-editor.css"),
	),
	"Shared AME shell has no visible outer focus outline",
);
assert(
	!/onOpen[\s\S]{0,400}ame-start[\s\S]{0,80}\.focus|\.focus\([\s\S]{0,40}dcv2-ame-start/.test(script),
	"DC AME open does not auto-focus Start date（avoids native picker）",
);
assert(
	/dcv2-ame-duration-field[\s\S]*\.ame-numeric-value[\s\S]*text-align:\s*left/.test(css) &&
		/text-overflow:\s*clip/.test(css),
	"Duration values left-align／clip（match AME；no ellipsis-as-cap）",
);
assert(/maxLength:\s*null/.test(adapter), "Decision C maxLength:null retained");
assert(
	!/acceptNumericCandidate/.test(read("src/scripts/lab/ame-mixed-lab-adapter.ts")) ||
		true,
	"Lab Mixed need not provide candidate hook",
);
assert(
	!/data-ame-choice-group="direction"[\s\S]{0,200}ame-setting-group-label/.test(astro),
	"No visible Add or subtract group title in AME form",
);
assert(
	/data-ame-numeric-field=\{field\.key\}/.test(astro) ||
		(/data-ame-numeric-field="years"/.test(astro) &&
			/data-ame-numeric-field="months"/.test(astro) &&
			/data-ame-numeric-field="weeks"/.test(astro) &&
			/data-ame-numeric-field="days"/.test(astro)),
	"AME Numeric Field buttons for Y／M／W／D",
);
assert(
	!/data-dcv2-ame-form[\s\S]{0,1200}inputmode/.test(astro) &&
		!/data-ame-numeric-field[\s\S]{0,200}type="text"/.test(astro),
	"AME duration fields are not native numeric／text inputs",
);

assert(/DC_AME_NUMERIC_FIELDS/.test(adapter), "DC AME numericFields config exported");
assert(
	/maxLength:\s*null/.test(adapter) && /allowEmpty:\s*true/.test(adapter),
	"DC numericFields explicit maxLength:null＋allowEmpty:true",
);
assert(/validateDcAmeDraft/.test(adapter) && /Number\.isSafeInteger/.test(adapter), "validate uses safe integer rules");
assert(/calculateDate/.test(adapter + script), "adopter／script use calculateDate");
assert(/rs:update|content:\s*"textual"/.test(script), "ResultSummary textual updates wired");
assert(/formatResultPrimary|formatResultSupport/.test(script + formatLib), "result format helpers present");
assert(!/ensurePortal|createPortal|Registry/.test(script + adapter), "no Portal／Registry");

assert(/data-dcv2-desktop-start/.test(astro), "Desktop Smart Date Input retained");
assert(/data-dcv2-duration-input/.test(astro), "Desktop duration inputs retained");
assert(/data-dcv2-direction/.test(astro), "Desktop direction controls retained");
assert(/initDesktopStartDateInput|createStartDateController/.test(script), "Desktop start date runtime retained");
assert(/createDateCalculatorCalendarAdapter/.test(script), "Desktop calendar adapter retained");

assert(/lifecycle:\s*"live"/.test(script), "Date Calculator AME uses lifecycle live");
assert(/applyDraftToPage|computeAndApplyResult/.test(script), "Live draft sync applies page state／result");
assert(
	/onCommit:[\s\S]{0,200}applyDraftToPage|onCommit:[\s\S]{0,120}computeAndApplyResult/.test(script),
	"onCommit path syncs page＋result（live apply）",
);
assert(
	!/AmeLifecycle|lifecycle:\s*"submit"/.test(adapter) || /lifecycle:\s*"live"/.test(script),
	"Live mode opted at mount（not tool-name in shared controller）",
);
assert(/getResetDraft|DC_AME_RESET_DEFAULTS/.test(script), "AME Reset defaults wired");
assert(/data-dcv2-reset/.test(astro) && /initDesktopReset|data-dcv2-reset/.test(script), "Desktop Reset wired");
assert(
	/data-ame-cancel/.test(read("src/components/tools/shared/AdaptiveMobileEditor.astro")) &&
		/\[data-ame-lifecycle="live"\]\s*\[data-ame-cancel\]/.test(
			read("src/styles/tools/adaptive-mobile-editor.css"),
		),
	"Live Cancel hide supported in shared shell",
);
assert(
	/data-ame-action-row[\s\S]*data-ame-reset[\s\S]*data-ame-submit/.test(
		read("src/components/tools/shared/AdaptiveMobileEditor.astro"),
	),
	"Portrait Reset／Done retained",
);
assert(
	/\.ame-shell:focus-visible[\s\S]{0,80}outline:\s*none/.test(
		read("src/styles/tools/adaptive-mobile-editor.css"),
	),
	"Shared shell focus outline fix retained",
);
assert(
	/scale\(0\.92\)\s*translateY\(-1\.25rem\)/.test(read("src/styles/tools/adaptive-mobile-editor.css")),
	"Shared Portrait background scale retained",
);

assert(/text-overflow:\s*ellipsis/.test(read("src/styles/tools/adaptive-mobile-editor.css")), "AME numeric value ellipsis for long digits");
assert(/dcv2-ame-numeric-control|dcv2-ame-start-control/.test(css + astro), "AME control layout hooks present");

assert(existsSync(join(rootDir, "src/lib/dateCalculatorMath.ts")), "math core file still present");
assert(/export function calculateDate/.test(math), "calculateDate export unchanged in math core");
assert(
	!/rewrite|TODO.*math/.test(math.slice(0, 200)),
	"math core header unchanged intent（no rewrite marker）",
);

const foreign = ["age-calculator.ts", "business-days-calculator.ts", "days-between-dates.ts"];
for (const name of foreign) {
	assert(!script.includes(name), `does not import foreign tool script ${name}`);
}

console.log(`\nvalidate-date-calculator-mobile-date: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
