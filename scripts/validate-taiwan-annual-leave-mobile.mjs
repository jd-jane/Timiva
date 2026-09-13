/**
 * TALC B2C Mobile AME validator — 3 labeled YMD fields＋shared keypad＋chrome Reset／Done.
 * Run: node --experimental-strip-types scripts/validate-taiwan-annual-leave-mobile.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
	emptyDateSegments,
	resolveFieldStatus,
	resolveInvalidHireFields,
	shouldAutoAdvanceMobileMonth,
	shouldAutoAdvanceMobileYear,
} from "../src/lib/taiwanAnnualLeaveDateInput.ts";
import {
	acceptTalcAmeNumericCandidate,
	draftFromSegments,
	emptyTalcAmeDraft,
	segmentsFromDraft,
	takeTalcAmePending,
	TALC_AME_NUMERIC_FIELDS,
	validateTalcAmeDraft,
} from "../src/scripts/taiwan-annual-leave-ame-adapter.ts";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(rootDir, rel), "utf8");

const astro = read(
	"src/components/tools/taiwan-annual-leave-calculator-v2/TaiwanAnnualLeaveCalculatorV2.astro",
);
const script = read("src/scripts/taiwan-annual-leave-calculator.ts");
const adapter = read("src/scripts/taiwan-annual-leave-ame-adapter.ts");
const css = read("src/styles/tools/taiwan-annual-leave-calculator-v2.css");
const ctrl = read("src/scripts/adaptive-mobile-editor-controller.ts");
const en = read("src/i18n/en.ts");
const zh = read("src/i18n/zh.ts");

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

console.log("validate-taiwan-annual-leave-mobile（B2C AME 3-field YMD）");

/* —— Mount —— */
assert(astro.includes("AdaptiveMobileEditor"), "imports AdaptiveMobileEditor");
assert(astro.includes('id="talc-ame"'), "AME id");
assert(astro.includes("data-talc-capsule"), "mobile capsule");
assert(astro.includes('data-ame-numeric-field="year"'), "year field");
assert(astro.includes('data-ame-numeric-field="month"'), "month field");
assert(astro.includes('data-ame-numeric-field="day"'), "day field");
assert(astro.includes("talc-ame-field-label"), "persistent field labels");
assert(astro.includes("data-talc-segment-value"), "value／placeholder spans");
assert(astro.includes("data-talc-ame-leave"), "leave in AME content");
assert(!/data-talc-ame-reset/.test(astro), "no content-area Reset");
assert(!/talc-ame-date-shell/.test(astro + css), "no shared YYYY/MM/DD mega-shell");
assert(astro.includes('data-talc-phase="b2c-mobile"'), "b2c phase");

/* —— No native keyboard in AME form —— */
{
	const formStart = astro.indexOf("data-talc-ame-form");
	const formChunk = formStart >= 0 ? astro.slice(formStart, formStart + 4500) : "";
	assert(formChunk.includes("talc-ame-ymd"), "AME form has ymd grid");
	assert(!/<input\b/.test(formChunk), "TALC AME form has no <input>");
	assert(!/inputmode=/.test(formChunk), "TALC AME form has no inputmode");
}
assert(
	!/talc-ame-ymd-input|ameYearInput|syncAmeFieldsFromSegments|shouldShowReset:\s*\(\)\s*=>\s*false/.test(
		executableScript,
	),
	"no native input wiring；chrome Reset not hidden",
);
assert(/TALC_AME_NUMERIC_FIELDS/.test(script), "numericFields wired");
assert(/acceptTalcAmeNumericCandidate/.test(script), "acceptNumericCandidate");
assert(/activateFirstNumericOnOpen:\s*\(\)\s*=>\s*false/.test(script), "keypad closed on open");
assert(/getResetDraft:\s*\(\)\s*=>\s*emptyTalcAmeDraft/.test(script), "shared Reset draft");
assert(/\[data-ame-reset\]/.test(script), "wires shared ame-reset chrome");
assert(/lifecycle:\s*"live"/.test(script), "live lifecycle");
assert(!/createOpenDraft\s*:/.test(executableScript), "no createOpenDraft override");
assert(/STORAGE_KEY = "timiva:talc:v1"/.test(script), "shared storage key");

/* —— Adapter —— */
assert(TALC_AME_NUMERIC_FIELDS.length === 3, "3 numeric configs");
{
	const empty = emptyTalcAmeDraft();
	assert(validateTalcAmeDraft(empty, "bad").ok, "empty ok");
}
{
	const incomplete = draftFromSegments(
		{ ...emptyDateSegments(), year: "2022", month: "", day: "" },
		"anniversary",
	);
	assert(resolveFieldStatus(segmentsFromDraft(incomplete)) === "incomplete", "incomplete");
	assert(validateTalcAmeDraft(incomplete, "bad").ok, "incomplete ok");
}
{
	const valid = draftFromSegments(
		{
			...emptyDateSegments(),
			year: "2022",
			month: "9",
			day: "15",
			openMonth: true,
			openDay: true,
		},
		"anniversary",
	);
	assert(resolveFieldStatus(segmentsFromDraft(valid)) === "valid", "valid");
}
{
	const invalid = draftFromSegments(
		{
			...emptyDateSegments(),
			year: "2099",
			month: "13",
			day: "40",
			openMonth: true,
			openDay: true,
		},
		"anniversary",
	);
	assert(resolveFieldStatus(segmentsFromDraft(invalid)) === "invalid", "invalid");
	assert(!validateTalcAmeDraft(invalid, "bad").ok, "invalid fails");
	assert(resolveInvalidHireFields(segmentsFromDraft(invalid)).length > 0, "field errors");
}
assert(shouldAutoAdvanceMobileYear("2022"), "year advance");
assert(shouldAutoAdvanceMobileMonth("9"), "month advance");
{
	acceptTalcAmeNumericCandidate({
		fieldId: "year",
		currentValue: "202",
		candidateValue: "2022",
	});
	assert(takeTalcAmePending()?.advanceTo === "month", "year→month");
}

/* —— CSS：3-field＋focus owner＋landscape first screen —— */
assert(
	/\.talc-ame-ymd[\s\S]*repeat\(3,\s*minmax\(0,\s*1fr\)\)/.test(css),
	"YMD 3-column grid",
);
assert(/\.talc-ame-field:focus-visible/.test(css), "focus owner = field");
assert(/\.talc-ame-field-label/.test(css), "persistent label style");
assert(
	/\.talc-ame-field\[data-ame-active="true"\]/.test(css),
	"active styles whole field",
);
assert(
	/@media \(orientation: landscape\) and \(max-height: 700px\) and \(max-width: 1200px\) and \(hover: none\)[\s\S]*grid-template-rows:\s*minmax\(0,\s*1fr\)\s+auto/.test(
		css,
	),
	"landscape Age-style stage grid (result 1fr / capsule auto)",
);
assert(
	/@media \(orientation: landscape\) and \(max-height: 700px\) and \(max-width: 1200px\) and \(hover: none\)[\s\S]*height:\s*100dvh/.test(
		css,
	),
	"landscape locks first screen to 100dvh",
);
assert(
	/@media \(orientation: landscape\) and \(max-height: 700px\) and \(max-width: 1200px\) and \(hover: none\)[\s\S]*talc-mobile-capsule/.test(
		css,
	),
	"landscape first-screen capsule compact",
);
assert(
	/@media \(orientation: landscape\) and \(max-height: 700px\) and \(max-width: 1200px\) and \(hover: none\)[\s\S]*tool-textual-result-support-divider::before[\s\S]*margin-block:\s*0\.75rem/.test(
		css,
	),
	"landscape divider equal compact (Age-style, correct selector)",
);
assert(
	/@media \(orientation: landscape\) and \(max-height: 700px\) and \(max-width: 1200px\) and \(hover: none\)[\s\S]*\.talc-result-meta\s*\{[^}]*gap:\s*0/.test(
		css,
	),
	"landscape meta gap 0 so divider stays symmetric",
);
/* Frame Mobile：.tpf-result-group { pointer-events: none } → ⓘ 必須恢復可點 */
assert(
	/@media \(orientation: landscape\) and \(max-height: 700px\) and \(max-width: 1200px\) and \(hover: none\)[\s\S]*talc-support__join[\s\S]*display:\s*inline/.test(
		css,
	),
	"landscape support join inline (single-line secondary)",
);
assert(/data-talc-support-line="1"/.test(astro) && /data-talc-support-line="2"/.test(astro), "support dual-line markup");
assert(/setSupportLines/.test(script), "setSupportLines helper");
assert(!/\.talc-ame-date-shell:focus-within/.test(css), "no group-level date shell focus");
assert(/dismiss only/.test(ctrl), "shared live dismiss");

/* —— i18n —— */
assert(/capsulePlaceholder:/.test(en) && /capsulePlaceholder:/.test(zh), "capsule i18n");
assert(/ameYearLabel:/.test(en) && /ameYearLabel:/.test(zh), "field labels");

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
