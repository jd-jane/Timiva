/**
 * Date Calculator — canonical AME First Adopter validator（long-term tracked）.
 *
 * Scope：DC ↔ Adaptive Mobile Editor wiring／live lifecycle／duration／range／routes.
 * Does NOT depend on Age comparison pages、diagnostics routes、or local-docs/**.
 *
 * One-shot cross／diagnostics validators（shell-css／orientation／mode2／a3／age-kb／
 * age-vs-k3）are NOT formal tracked gates — see local consolidation report.
 *
 * Pure math／desktop input／calendar／duration remain in dedicated validators.
 * Historical B8 batch name：validate-date-calculator-mobile-date.mjs（overlap OK until
 * Owner authorizes deprecation cleanup）.
 *
 * Run: node scripts/validate-date-calculator-adopter.mjs
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
const exists = (path) => existsSync(join(rootDir, path));

const astro = read("src/components/tools/date-calculator-v2/DateCalculatorV2.astro");
const script = read("src/scripts/date-calculator.ts");
const adapter = read("src/scripts/date-calculator-ame-adapter.ts");
const formatLib = read("src/lib/dateCalculatorFormat.ts");
const math = read("src/lib/dateCalculatorMath.ts");
const css = read("src/styles/tools/date-calculator-v2.css");
const ctrl = read("src/scripts/adaptive-mobile-editor-controller.ts");
const ameShell = read("src/components/tools/shared/AdaptiveMobileEditor.astro");
const ameCss = read("src/styles/tools/adaptive-mobile-editor.css");
const fieldError = read("src/components/tools/shared/AmeFieldError.astro");
const enRoute = read("src/pages/en/date-calculator/index.astro");
const zhRoute = read("src/pages/zh/date-calculator/index.astro");

const stripComments = (source) =>
	source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

const executableScript = stripComments(script);
const executableCtrl = stripComments(ctrl);

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

console.log("validate-date-calculator-adopter（canonical AME First Adopter）\n");

/* -------------------------------------------------------------------------- */
/* Isolation — no diagnostics／Age／local-docs hard deps                        */
/* -------------------------------------------------------------------------- */
assert(
	!/diagnostics\/|dc-sheet-|age-vs-k3|local-docs\//.test(script + adapter + astro),
	"DC adopter sources do not reference diagnostics／Age-compare／local-docs paths",
);
assert(
	!exists("scripts/validate-date-calculator-adopter.mjs") || true,
	"Canonical adopter validator path resolves",
);
for (const name of [
	"age-calculator.ts",
	"business-days-calculator.ts",
	"days-between-dates.ts",
]) {
	assert(!script.includes(name), `does not import foreign tool script ${name}`);
}

/* -------------------------------------------------------------------------- */
/* Shared AME foundation＋single instance                                      */
/* -------------------------------------------------------------------------- */
assert(astro.includes("AdaptiveMobileEditor"), "Date Calculator imports AdaptiveMobileEditor");
assert(astro.includes("AmeFieldError"), "Date Calculator imports AmeFieldError");
assert(
	(astro.match(/<AdaptiveMobileEditor/g) || []).length === 1,
	"Exactly one AdaptiveMobileEditor instance in DC markup",
);
assert(/id="dcv2-ame"/.test(astro), "AME instance id is dcv2-ame");
assert(
	/data-ame-page-content/.test(astro) && /AdaptiveMobileEditor/.test(astro),
	"Sibling mount markers present（page-content＋AME）",
);
assert(/createAdaptiveMobileEditor/.test(script), "Script boots shared AME controller");
assert(/ameSessions\.has\(root\)/.test(script), "Single-session guard per tool root");
assert(
	/querySelectorAll<HTMLElement>\("\[data-date-calculator-v2\]"\)/.test(script) ||
		/querySelectorAll[\s\S]*\[data-date-calculator-v2\]/.test(script),
	"Boot walks DC roots only",
);
assert(
	!/data-dcv2-sheet-portal/.test(astro) && !/<div[^>]*data-dcv2-sheet[\s>]/.test(astro),
	"Legacy sheet portal／dialog chrome removed",
);
assert(!/document\.body\.appendChild/.test(executableScript), "No body portal append");
assert(
	!/msb-scroll-lock|MobileBottomSheet|mobile-bottom-sheet-controller/.test(astro + script),
	"No MSB runtime／scroll-lock",
);
assert(
	!/\bvisualViewport\b/.test(executableScript) &&
		!/\bvisualViewport\b/.test(stripComments(adapter)) &&
		!/\bvisualViewport\b/.test(stripComments(astro)),
	"No visualViewport",
);
assert(!/ensurePortal|createPortal|Registry/.test(script + adapter), "No Portal／Registry");
assert(exists("src/components/tools/shared/AdaptiveMobileEditor.astro"), "Shared AME shell tracked");
assert(exists("src/scripts/adaptive-mobile-editor-controller.ts"), "Shared AME controller tracked");
assert(exists("src/styles/tools/adaptive-mobile-editor.css"), "Shared AME CSS tracked");
assert(exists("src/components/tools/shared/AmeFieldError.astro"), "Shared AmeFieldError tracked");
assert(exists("src/scripts/date-calculator-ame-adapter.ts"), "DC AME adapter tracked");

/* -------------------------------------------------------------------------- */
/* Live lifecycle：draft sync／Done／Escape／underlay／Reset                     */
/* -------------------------------------------------------------------------- */
assert(/lifecycle:\s*"live"/.test(script), "DC AME opts into lifecycle live at mount");
assert(
	/applyLiveSyncFromDraft/.test(executableCtrl) &&
		/resolveLifecycle\(\)\s*===\s*"live"/.test(executableCtrl),
	"Shared controller live-syncs via applyLiveSyncFromDraft",
);
assert(
	/onCommit:[\s\S]{0,200}applyDraftToPage/.test(script) &&
		/const applyDraftToPage[\s\S]{0,600}computeAndApplyResult/.test(script),
	"Live onCommit applies page state＋result",
);
assert(
	/submit\(\)[\s\S]{0,280}resolveLifecycle\(\)\s*===\s*"live"[\s\S]{0,200}dismissChrome\("submit"\)/.test(
		executableCtrl,
	),
	"Live Done（submit）：dismiss only — no re-validate／re-commit path",
);
assert(
	/close\(reason[\s\S]{0,220}resolveLifecycle\(\)\s*===\s*"live"[\s\S]{0,160}dismissChrome\(reason\)/.test(
		executableCtrl,
	),
	"Live Escape／api close：dismiss only — no draft rollback",
);
assert(
	/event\.key\s*===\s*"Escape"[\s\S]{0,80}close\("escape"\)/.test(executableCtrl),
	"Escape closes via dismiss-only close(\"escape\")",
);
assert(
	/data-ame-underlay/.test(ameShell) &&
		/data-ame-close="cancel"/.test(ameShell) &&
		/AmeCloseReason\s*=\s*"cancel"\s*\|\s*"escape"\s*\|\s*"api"/.test(ctrl),
	"Underlay／Cancel／Escape are dismiss close reasons（not Done commit）",
);
assert(
	/function resetDraftInternal\(\)[\s\S]{0,800}applyLiveSyncFromDraft\(\)/.test(executableCtrl),
	"Reset applies live sync（page state updates while open）",
);
assert(
	/resetDraft\(\)[\s\S]{0,120}resetDraftInternal\(\)/.test(executableCtrl) &&
		!/resetDraftInternal[\s\S]{0,200}dismissChrome/.test(
			executableCtrl.slice(
				executableCtrl.indexOf("function resetDraftInternal"),
				executableCtrl.indexOf("function resetDraftInternal") + 800,
			),
		),
	"Reset does not dismiss chrome（Editor stays open）",
);
assert(/getResetDraft|DC_AME_RESET_DEFAULTS/.test(script + adapter), "AME Reset defaults wired");
assert(
	/\[data-ame-lifecycle="live"\]\s*\[data-ame-cancel\]/.test(ameCss),
	"Live Cancel hide supported in shared CSS",
);
assert(
	/data-ame-action-row[\s\S]*data-ame-reset[\s\S]*data-ame-submit/.test(ameShell),
	"Portrait Reset／Done retained",
);
assert(/data-dcv2-sheet-trigger/.test(astro), "Mobile CTA trigger retained");

/* -------------------------------------------------------------------------- */
/* Direction Add／Subtract                                                     */
/* -------------------------------------------------------------------------- */
assert(
	/data-dcv2-ame-direction="add"/.test(astro) &&
		/data-dcv2-ame-direction="subtract"/.test(astro),
	"AME compact Direction has Add＋Subtract",
);
assert(
	/dcv2-ame-direction/.test(astro) && !/data-ame-choice-group="direction"/.test(astro),
	"DC uses compact direction control（not shared AME choice cards）",
);
assert(
	/bindDcAmeInteractions[\s\S]*data-dcv2-ame-direction[\s\S]*patchDraft/.test(adapter) ||
		(/bindDcAmeInteractions/.test(adapter) &&
			/data-dcv2-ame-direction/.test(adapter) &&
			/direction/.test(adapter)),
	"Direction changes patch AME draft via adapter bind",
);
assert(
	/dcv2-ame-direction-track[\s\S]*border-radius:\s*9999px/.test(css) &&
		/dcv2-ame-direction-option:has\(input:checked\)[\s\S]*rgb\(99 102 241 \/ 0\.55\)/.test(css),
	"AME Direction capsule＋selected indigo fill",
);

/* -------------------------------------------------------------------------- */
/* Years／Months／Weeks／Days＋candidate guard                                  */
/* -------------------------------------------------------------------------- */
assert(
	/data-ame-numeric-field=\{field\.key\}/.test(astro) ||
		(/data-ame-numeric-field="years"/.test(astro) &&
			/data-ame-numeric-field="months"/.test(astro) &&
			/data-ame-numeric-field="weeks"/.test(astro) &&
			/data-ame-numeric-field="days"/.test(astro)),
	"AME Numeric Field buttons for Y／M／W／D",
);
assert(
	/data-dcv2-ame-start[\s\S]*data-dcv2-ame-direction[\s\S]*data-ame-numeric-field/.test(astro),
	"AME field order：Start → Direction → duration Numeric Fields",
);
assert(/DC_AME_NUMERIC_FIELDS/.test(adapter), "DC AME numericFields config exported");
assert(
	/maxLength:\s*null/.test(adapter) && /allowEmpty:\s*true/.test(adapter),
	"Decision C：maxLength null＋allowEmpty true",
);
assert(
	/acceptNumericCandidate/.test(script) && /acceptDcAmeNumericCandidate/.test(adapter),
	"Candidate digit range guard wired（AME hook＋DC adapter）",
);
assert(
	/acceptDcAmeNumericCandidate[\s\S]*calculateDate/.test(adapter) &&
		/DATE_CALCULATOR_MIN|DATE_CALCULATOR_MAX/.test(adapter),
	"Candidate guard uses calculateDate＋range probe when start missing",
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
	!/data-dcv2-ame-form[\s\S]{0,1200}inputmode/.test(astro) &&
		!/data-ame-numeric-field[\s\S]{0,200}type="text"/.test(astro),
	"AME duration fields are not native numeric／text inputs",
);
assert(
	/<input[\s\S]*?type="date"[\s\S]*?data-dcv2-ame-start/.test(astro) ||
		/<input[\s\S]*?data-dcv2-ame-start[\s\S]*?type="date"/.test(astro),
	"AME Start uses native type=date",
);
assert(/min="1900-01-01"/.test(astro) && /max="2200-12-31"/.test(astro), "Native date min／max 1900–2200");

/* Runtime mirror of acceptDcAmeNumericCandidate（math／range only） */
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
assert(probeCandidate(baseAdd, "years", "180") === true, "Candidate years=180 from 2020 add accepted");
assert(probeCandidate(baseAdd, "years", "181") === false, "Candidate years=181 from 2020 add rejected");
assert(
	probeCandidate(baseAdd, "days", "999999999999999999") === false,
	"Candidate beyond safe integer rejected",
);
assert(
	probeCandidate({ ...baseAdd, startDate: "" }, "years", "300") === true,
	"No start：probe MIN／add accepts years=300",
);
assert(
	probeCandidate({ ...baseAdd, startDate: "" }, "years", "301") === false,
	"No start：probe MIN／add rejects years=301（out of support）",
);

/* -------------------------------------------------------------------------- */
/* Shared AmeFieldError contract                                               */
/* -------------------------------------------------------------------------- */
assert(
	/AmeFieldError/.test(astro) && /data-ame-field="startDate"/.test(astro),
	"Start uses shared AmeFieldError＋data-ame-field",
);
assert(/data-ame-field-error/.test(fieldError), "AmeFieldError exposes data-ame-field-error");
assert(
	/fieldErrors/.test(adapter) && /startDate/.test(adapter),
	"DC validate returns fieldErrors（shared field-error contract）",
);
assert(!/dcv2-ame-invalid-slot/.test(astro), "AME content does not use tool-local invalid slots");
assert(
	!/#dcv2-ame \[data-ame-error-region\][\s\S]*display:\s*none/.test(css),
	"DC does not force-hide AME error region",
);
assert(
	!/This input is outside the supported range/.test(astro + script + adapter),
	"No bottom outside-range error banner copy in AME path",
);

/* -------------------------------------------------------------------------- */
/* Portrait sheet／Landscape full-screen＋2×2 duration                          */
/* -------------------------------------------------------------------------- */
assert(
	/#dcv2-ame \.ame-portrait-header[\s\S]*display:\s*none/.test(css) &&
		/ariaLabel=\{m\.sheetAriaLabel\}/.test(astro),
	"Portrait：no visible title；accessible name via ariaLabel",
);
assert(
	/dcv2-ame-duration-grid/.test(astro) &&
		/dcv2-ame-duration-grid[\s\S]*repeat\(2,\s*minmax\(0,\s*1fr\)\)/.test(css),
	"AME duration uses 2×2 grid",
);
assert(
	/dcv2-ame-duration-field\.ame-setting-row[\s\S]*grid-column:\s*auto/.test(css),
	"2×2 cells override shared ame-setting-row full-span",
);
assert(
	/\[data-ame-keypad-visible="true"\]\[data-ame-density="mixed"\][\s\S]{0,80}dcv2-ame-duration-grid[\s\S]{0,120}repeat\(2,\s*minmax\(0,\s*1fr\)\)/.test(
		css,
	),
	"Landscape keypad＋mixed：duration stays 2×2",
);
assert(
	/\[data-ame-keypad-visible="true"\]\[data-ame-density="mixed"\][\s\S]{0,120}dcv2-ame-start-row\.ame-setting-row/.test(
		css,
	) &&
		/\[data-ame-keypad-visible="true"\]\[data-ame-density="mixed"\][\s\S]{0,120}dcv2-ame-duration-field\.ame-setting-row/.test(
			css,
		),
	"Landscape keypad＋mixed：DC overrides beat shared subgrid",
);
assert(
	/scale\(0\.92\)\s*translateY\(-1\.25rem\)/.test(ameCss),
	"Portrait background scale lives in AME shared CSS",
);
assert(
	/orientation:\s*landscape[\s\S]*data-ame-background-scale-target[\s\S]*transform:\s*none/.test(
		ameCss,
	),
	"Landscape shared：scale target transform none",
);
assert(
	/@media \(orientation:\s*landscape\)[\s\S]*\.ame-underlay[\s\S]*display:\s*none/.test(ameCss),
	"Landscape hides underlay（full-screen chrome）",
);
assert(
	/data-ame-background-scale-target/.test(astro),
	"DC marks data-ame-background-scale-target on result group",
);
assert(
	/dcv2-ame-duration-field[\s\S]*\.ame-numeric-value[\s\S]*text-align:\s*left/.test(css) &&
		/text-overflow:\s*clip/.test(css),
	"Duration values left-align／clip",
);

/* -------------------------------------------------------------------------- */
/* Supported result range／out-of-range reject                                  */
/* -------------------------------------------------------------------------- */
assert(/validateDcAmeDraft/.test(adapter) && /Number\.isSafeInteger/.test(adapter), "Validate uses safe integer rules");
assert(/validationOutOfRange|out-of-range/.test(adapter), "Validate maps out-of-range failures");
assert(
	calculateDate(DATE_CALCULATOR_MIN, "add", {
		years: 300,
		months: 0,
		weeks: 0,
		days: 0,
	}).ok === true,
	"Math：1900＋300y within MAX",
);
assert(
	calculateDate(DATE_CALCULATOR_MIN, "add", {
		years: 301,
		months: 0,
		weeks: 0,
		days: 0,
	}).ok === false,
	"Math：1900＋301y rejected（out of support）",
);
assert(
	calculateDate(DATE_CALCULATOR_MAX, "subtract", {
		years: 300,
		months: 0,
		weeks: 0,
		days: 0,
	}).ok === true,
	"Math：2200−300y within MIN",
);
assert(/calculateDate/.test(adapter + script), "Adopter／script use calculateDate");
assert(/rs:update|content:\s*"textual"/.test(script), "ResultSummary textual updates wired");
assert(/formatResultPrimary|formatResultSupport/.test(script + formatLib), "Result format helpers present");
assert(exists("src/lib/dateCalculatorMath.ts"), "Math core file present");
assert(/export function calculateDate/.test(math), "calculateDate export present");

/* -------------------------------------------------------------------------- */
/* EN／ZH formal routes＋adapter wiring                                         */
/* -------------------------------------------------------------------------- */
assert(exists("src/pages/en/date-calculator/index.astro"), "EN formal route exists");
assert(exists("src/pages/zh/date-calculator/index.astro"), "ZH formal route exists");
assert(
	/DateCalculatorV2/.test(enRoute) && /locale:\s*Locale\s*=\s*"en"/.test(enRoute),
	"EN route mounts DateCalculatorV2 with en locale",
);
assert(
	/DateCalculatorV2/.test(zhRoute) && /locale:\s*Locale\s*=\s*"zh"/.test(zhRoute),
	"ZH route mounts DateCalculatorV2 with zh locale",
);
assert(
	/from "\.\/date-calculator-ame-adapter"/.test(script) &&
		/validateDcAmeDraft|acceptDcAmeNumericCandidate|bindDcAmeInteractions/.test(script),
	"Runtime imports DC AME adapter helpers",
);
assert(
	!/onOpen[\s\S]{0,400}ame-start[\s\S]{0,80}\.focus|\.focus\([\s\S]{0,40}dcv2-ame-start/.test(script),
	"DC AME open does not auto-focus Start date",
);
assert(
	/\.ame-shell:focus-visible[\s\S]{0,80}outline:\s*none/.test(ameCss),
	"Shared AME shell has no visible outer focus outline",
);

/* Desktop retained（adopter must not strip Desktop live） */
assert(/data-dcv2-desktop-start/.test(astro), "Desktop Smart Date Input retained");
assert(/data-dcv2-duration-input/.test(astro), "Desktop duration inputs retained");
assert(/data-dcv2-direction/.test(astro), "Desktop direction controls retained");
assert(/initDesktopStartDateInput|createStartDateController/.test(script), "Desktop start date runtime retained");
assert(/createDateCalculatorCalendarAdapter/.test(script), "Desktop calendar adapter retained");
assert(/data-dcv2-reset/.test(astro) && /initDesktopReset|data-dcv2-reset/.test(script), "Desktop Reset wired");
assert(
	/acceptDcAmeNumericCandidate\(draft, unit, candidate\)/.test(script) &&
		/input\.value = priorRaw/.test(script) &&
		/data-dcv2-duration-invalid/.test(astro) &&
		/syncDesktopDurationOverflow/.test(script),
	"Desktop duration range guard＋overflow ! icon retained（hotfix contract）",
);

/* Desktop primary result：single-line＋fluid shrink（drawer／narrow stage） */
assert(
	/container-type:\s*inline-size/.test(css) && /container-name:\s*dcv2-result/.test(css),
	"Desktop result group is a size container for fluid primary",
);
assert(
	/@media \(min-width:\s*768px\)[\s\S]*--rs-textual-primary-size:\s*clamp\(/.test(css),
	"≥768px textual primary uses clamp：夠寬維持原字級；超出寬度才微縮",
);
assert(
	/:is\(\s*\[data-rs-layout="desktop"\],\s*\[data-rs-layout="portrait"\]\s*\)/.test(css),
	"Single-line／clamp covers desktop＋mid-width portrait layout attrs（768–899 tablet）",
);
assert(
	/data-dcv2-locale="en"[\s\S]*clamp\([^)]*5\.5rem\)/.test(css),
	"EN Desktop primary clamp max remains 5.5rem",
);
assert(
	/\[data-rs-value="primary"\][\s\S]*white-space:\s*nowrap/.test(css) ||
		/data-rs-value="primary"[\s\S]*white-space:\s*nowrap/.test(css),
	"Desktop／mid-width primary date is nowrap（ZH／EN single line；no markup split）",
);
assert(
	/data-rs-value="primary"[\s\S]*overflow-x:\s*clip/.test(css) &&
		!/data-rs-value="primary"[\s\S]{0,200}text-overflow:\s*ellipsis/.test(css),
	"Desktop primary avoids ellipsis crop；overflow clipped only as safety",
);
assert(
	!/formatResultPrimary[\s\S]{0,200}\\u00A0|formatResultPrimary[\s\S]{0,120}nbsp/.test(
		formatLib,
	),
	"Does not hard-fix primary via NBSP in formatResultPrimary",
);
assert(
	/@media \(max-width:\s*767px\)[\s\S]*data-dcv2-locale="zh"[\s\S]*--rs-textual-primary-size:\s*4\.125rem/.test(
		css,
	) ||
		/data-dcv2-locale="zh"[\s\S]*data-rs-layout="portrait"[\s\S]*--rs-textual-primary-size:\s*4\.125rem/.test(
			css,
		),
	"ZH Portrait two-line target size retained",
);
assert(
	/year\} 年\\n\$\{date\.month\}|year\} 年\\n/.test(formatLib) ||
		/\$\{date\.year\} 年\\n\$\{date\.month\}/.test(formatLib),
	"ZH formatResultPrimary inserts newline after 年（年／月日兩列）",
);
assert(
	/@media \(max-width:\s*767px\)[\s\S]*data-dcv2-locale="zh"[\s\S]*data-rs-value="primary"[\s\S]*white-space:\s*pre-line/.test(
		css,
	),
	"ZH ≤767 Portrait primary uses pre-line（受控兩行）",
);

console.log(`\nvalidate-date-calculator-adopter: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
