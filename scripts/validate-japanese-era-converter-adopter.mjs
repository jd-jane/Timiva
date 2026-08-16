/**
 * Japanese Era Converter — AME adopter validator（B2C）.
 *
 * Scope：Mobile AME live lifecycle／Gregorian＋Era fields／native select／
 * digit cap／mode switch／Reset stays open／shared keypad contract.
 * Calculation still comes from B2A evaluate／format；adapter must not duplicate math.
 *
 * Run: node scripts/validate-japanese-era-converter-adopter.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ERAS } from "../src/lib/japaneseEraConverterData.ts";
import {
	ERA_INPUT_MAX_DIGITS,
	evaluateDesktopState,
	GREGORIAN_INPUT_MAX_DIGITS,
	switchDesktopMode,
} from "../src/lib/japaneseEraConverterDesktopState.ts";
import { formatInvalidHint, formatJapaneseEraResult } from "../src/lib/japaneseEraConverterFormat.ts";
import {
	acceptJecAmeNumericCandidate,
	draftFromState,
	jecAmeResetDraft,
	JEC_AME_NUMERIC_FIELDS,
	JEC_AME_RESET_DEFAULTS,
	stateFromDraft,
	switchJecAmeDraft,
	validateJecAmeDraft,
	jecAmeInvalidPresentation,
} from "../src/scripts/japanese-era-converter-ame-adapter.ts";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(rootDir, path), "utf8");
const exists = (path) => existsSync(join(rootDir, path));

const astro = read("src/components/tools/japanese-era-converter-v2/JapaneseEraConverterV2.astro");
const script = read("src/scripts/japanese-era-converter.ts");
const adapter = read("src/scripts/japanese-era-converter-ame-adapter.ts");
const css = read("src/styles/tools/japanese-era-converter-v2.css");
const ctrl = read("src/scripts/adaptive-mobile-editor-controller.ts");
const ameShell = read("src/components/tools/shared/AdaptiveMobileEditor.astro");
const ameCss = read("src/styles/tools/adaptive-mobile-editor.css");
const evaluateSource = read("src/lib/japaneseEraConverterEvaluate.ts");
const formatSource = read("src/lib/japaneseEraConverterFormat.ts");
const desktopState = read("src/lib/japaneseEraConverterDesktopState.ts");

const stripComments = (source) =>
	source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

const executableScript = stripComments(script);
const executableAdapter = stripComments(adapter);
const executableAstro = stripComments(astro);

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

const NOW = 2026;

function gregorianState(raw) {
	return { mode: "gregorian", gregorianRaw: raw, eraId: "reiwa", eraYearRaw: "" };
}

function eraState(eraId, rawYear) {
	return { mode: "era", gregorianRaw: "", eraId, eraYearRaw: rawYear };
}

console.log("validate-japanese-era-converter-adopter（B2C AME live）\n");

/* -------------------------------------------------------------------------- */
/* Foundation                                                                  */
/* -------------------------------------------------------------------------- */
assert(exists("src/scripts/japanese-era-converter-ame-adapter.ts"), "JEC AME adapter tracked");
assert(astro.includes("AdaptiveMobileEditor"), "JEC imports AdaptiveMobileEditor");
assert(
	(astro.match(/<AdaptiveMobileEditor/g) || []).length === 1,
	"Exactly one AdaptiveMobileEditor instance",
);
assert(/id="jecv2-ame"/.test(astro), "AME instance id is jecv2-ame");
assert(/createAdaptiveMobileEditor/.test(script), "Script boots shared AME controller");
assert(/ameSessions\.has\(root\)/.test(script), "Single-session guard per tool root");
assert(
	/querySelectorAll<HTMLElement>\("\[data-japanese-era-converter-v2\]"\)/.test(script) ||
		/querySelectorAll[\s\S]*\[data-japanese-era-converter-v2\]/.test(script),
	"Boot walks JEC roots only",
);
assert(!/document\.body\.appendChild/.test(executableScript), "No body portal append");
assert(
	!/msb-scroll-lock|MobileBottomSheet|mobile-bottom-sheet-controller/.test(astro + script),
	"No MSB runtime",
);
assert(
	!/\bvisualViewport\b/.test(executableScript) && !/\bvisualViewport\b/.test(executableAdapter),
	"No visualViewport",
);
assert(!/localStorage/.test(executableScript + executableAdapter), "No LocalStorage");
assert(
	!/history\.(pushState|replaceState)|URLSearchParams[\s\S]{0,40}set\(/.test(executableScript),
	"No URL state writes",
);

/* -------------------------------------------------------------------------- */
/* Live lifecycle — consume shared AME, do not fork it                         */
/* -------------------------------------------------------------------------- */
assert(/lifecycle:\s*"live"/.test(script), "JEC AME opts into lifecycle live");
assert(
	/function applyLiveSyncFromDraft\(\)/.test(ctrl) &&
		/resolveLifecycle\(\) !== "live"/.test(ctrl),
	"Live sync remains in shared AME controller",
);
assert(
	/Live：Done = dismiss only/.test(ctrl) ||
		/lifecycle\(\) === "live"[\s\S]{0,180}dismissChrome\("submit"\)/.test(stripComments(ctrl)),
	"Shared Done in live is dismiss only",
);
assert(
	/Live：dismiss only — do not rollback/.test(ctrl) ||
		/do not rollback already-applied page state/.test(ctrl),
	"Shared close in live does not rollback",
);
assert(
	/function resetDraftInternal\(\)[\s\S]{0,800}applyLiveSyncFromDraft\(\)/.test(stripComments(ctrl)),
	"Shared Reset applies live sync while open",
);
assert(
	/\[data-ame-lifecycle="live"\]\s*\[data-ame-cancel\]/.test(ameCss),
	"Shared live chrome hides Cancel",
);
assert(
	!/adapter\.lifecycle\s*=/.test(executableAdapter) &&
		!/function createAdaptiveMobileEditor/.test(executableAdapter),
	"Adapter does not reimplement AME controller",
);
assert(
	!/onCommit:[\s\S]{0,80}ameApi\.close/.test(executableScript),
	"onCommit does not close AME（Reset stays open）",
);
assert(/getResetDraft:[\s\S]{0,80}jecAmeResetDraft/.test(script), "Reset draft uses jecAmeResetDraft");
assert(
	jecAmeResetDraft().mode === "gregorian" &&
		jecAmeResetDraft().gregorianYear === "" &&
		jecAmeResetDraft().eraId === "reiwa" &&
		jecAmeResetDraft().eraYear === "",
	"Mobile Reset payload：Gregorian empty＋Reiwa default",
);
assert(
	JEC_AME_RESET_DEFAULTS.mode === "gregorian" && JEC_AME_RESET_DEFAULTS.eraId === "reiwa",
	"Reset defaults match Gregorian／Reiwa",
);
assert(/data-ame-reset/.test(ameShell), "Reset uses shared AME slot");
assert(/data-ame-submit/.test(ameShell), "Done uses shared AME slot");
assert(
	/createOpenDraft:[\s\S]{0,80}cloneJecAmeDraft\(committed\)/.test(script),
	"Reopen uses committed draft（same-page state）",
);

/* -------------------------------------------------------------------------- */
/* No duplicated math                                                          */
/* -------------------------------------------------------------------------- */
{
	const mobileSources = executableScript + executableAdapter + executableAstro;
	assert(!/\b1867\b/.test(mobileSources), "Mobile does not hardcode Meiji offset");
	assert(!/\b1911\b/.test(mobileSources), "Mobile does not hardcode Taisho offset");
	assert(!/\b1925\b/.test(mobileSources), "Mobile does not hardcode Showa offset");
	assert(!/\b1988\b/.test(mobileSources), "Mobile does not hardcode Heisei offset");
	assert(!/GREGORIAN_MIN|GREGORIAN_MAX/.test(executableAdapter), "Adapter does not copy Gregorian bounds");
	assert(!/function findEraForGregorianYear/.test(adapter + script), "No second era lookup");
	assert(/evaluateDesktopState/.test(adapter), "Adapter evaluates via desktop-state helper");
	assert(/formatInvalidHint/.test(adapter), "Adapter formats invalid via B2A formatter");
	assert(/formatJapaneseEraResult/.test(script), "Result strings still come from B2A formatter");
	assert(
		/evaluateJapaneseEra/.test(evaluateSource) && /formatJapaneseEraResult/.test(formatSource),
		"B2A evaluate／format modules remain SSOT",
	);
	assert(/switchDesktopMode/.test(adapter), "Mode switch reuses Desktop helper");
	assert(/resetDesktopState/.test(adapter + desktopState), "Reset reuses Desktop helper");
}

/* -------------------------------------------------------------------------- */
/* Gregorian AME                                                               */
/* -------------------------------------------------------------------------- */
assert(/data-ame-numeric-field="gregorianYear"/.test(astro), "Gregorian Numeric Field present");
assert(/ameGregorianLabel/.test(astro), "Gregorian AME label wired");
assert(
	JEC_AME_NUMERIC_FIELDS.some(
		(field) => field.id === "gregorianYear" && field.maxLength === GREGORIAN_INPUT_MAX_DIGITS,
	),
	"Gregorian maxLength is 4",
);
assert(
	!/data-jecv2-ame-gregorian[\s\S]{0,800}inputmode/.test(astro) &&
		!/data-ame-numeric-field="gregorianYear"[\s\S]{0,200}type="text"/.test(astro),
	"Gregorian AME is not a native text／numeric input",
);

{
	const empty = validateJecAmeDraft(draftFromState(gregorianState("")), "zh");
	assert(empty.ok === true, "Empty Gregorian is not invalid");
	assert(formatJapaneseEraResult(evaluateDesktopState(gregorianState("")), "zh").primary === "?", "Empty → ?");
}
{
	const incomplete = validateJecAmeDraft(draftFromState(gregorianState("20")), "en");
	assert(incomplete.ok === true, "Incomplete Gregorian is not invalid");
}
{
	const valid = validateJecAmeDraft(draftFromState(gregorianState("2026")), "zh");
	assert(valid.ok === true, "Gregorian 2026 validates");
	const formatted = formatJapaneseEraResult(
		evaluateDesktopState(gregorianState("2026"), { nowYear: NOW }),
		"zh",
	);
	assert(formatted.primary === "令和8年", "Gregorian 2026 live result Reiwa 8");
}
{
	const transition = evaluateDesktopState(gregorianState("2019"), { nowYear: NOW });
	assert(transition.status === "valid" && transition.kind === "gregorian-transition", "2019 is transition");
	assert(validateJecAmeDraft(draftFromState(gregorianState("2019")), "zh").ok === true, "Transition is not invalid");
}
{
	const invalid = validateJecAmeDraft(draftFromState(gregorianState("1872")), "zh");
	assert(invalid.ok === false && Boolean(invalid.fieldErrors?.gregorianYear), "Invalid Gregorian sets fieldErrors");
	assert(
		invalid.fieldErrors?.gregorianYear ===
			formatInvalidHint(evaluateDesktopState(gregorianState("1872")), "zh"),
		"Invalid Gregorian message stays formatted SSOT",
	);
}

/* -------------------------------------------------------------------------- */
/* Japanese-era AME + native picker                                            */
/* -------------------------------------------------------------------------- */
assert(/data-jecv2-ame-era-select/.test(astro), "Native era select present");
assert(/<select[\s\S]*data-jecv2-ame-era-select/.test(astro), "Era picker is native select");
assert(!/jecv2-era-wheel|custom-wheel|era-wheel/.test(astro + css + script), "No custom era wheel");
assert(/data-ame-numeric-field="eraYear"/.test(astro), "Era year Numeric Field present");
assert(
	JEC_AME_NUMERIC_FIELDS.some(
		(field) => field.id === "eraYear" && field.maxLength === ERA_INPUT_MAX_DIGITS,
	),
	"Era year maxLength is 2",
);

{
	assert(/eraEntries = \[/.test(astro), "Era options come from chronological eraEntries");
	const ids = [...astro.matchAll(/id: "(meiji|taisho|showa|heisei|reiwa)"/g)].map((m) => m[1]);
	assert(
		ids.join(",") === "meiji,taisho,showa,heisei,reiwa",
		"Era order Meiji → Taisho → Showa → Heisei → Reiwa",
	);
	assert(ERAS.map((era) => era.id).join(",") === "meiji,taisho,showa,heisei,reiwa", "Data order matches picker");
	assert(/eraEntries\.map\(\(era\) =>/.test(astro), "Options render from eraEntries map");
}
assert(/era\.id === "reiwa"[\s\S]{0,40}selected/.test(astro), "Blank era mode defaults Reiwa selected");

{
	const valid = validateJecAmeDraft(draftFromState(eraState("reiwa", "8")), "en");
	assert(valid.ok === true, "Reiwa 8 validates");
	assert(
		formatJapaneseEraResult(evaluateDesktopState(eraState("reiwa", "8"), { nowYear: NOW }), "en")
			.primary === "2026",
		"Era valid → Gregorian year",
	);
}
{
	const partial = evaluateDesktopState(eraState("heisei", "31"), { nowYear: NOW });
	assert(partial.status === "valid" && partial.kind === "era-partial-year", "Heisei 31 is partial-year");
	assert(validateJecAmeDraft(draftFromState(eraState("heisei", "31")), "zh").ok === true, "Partial-year is not invalid");
}
{
	const invalid = validateJecAmeDraft(draftFromState(eraState("heisei", "99")), "en");
	assert(invalid.ok === false && Boolean(invalid.fieldErrors?.eraYear), "Invalid era year sets fieldErrors");
	assert(
		invalid.fieldErrors?.eraYear ===
			formatInvalidHint(evaluateDesktopState(eraState("heisei", "99")), "en", "heisei"),
		"Invalid era message stays formatted SSOT",
	);
}
{
	const future = evaluateDesktopState(eraState("reiwa", "82"), { nowYear: NOW });
	assert(future.futureReiwaAssumption === true, "Reiwa 82 future note");
	assert(validateJecAmeDraft(draftFromState(eraState("reiwa", "82")), "zh").ok === true, "Future Reiwa is valid");
}

/* -------------------------------------------------------------------------- */
/* Mode switch                                                                 */
/* -------------------------------------------------------------------------- */
{
	const filled = switchJecAmeDraft(draftFromState(gregorianState("2026")));
	assert(filled.mode === "era" && filled.eraId === "reiwa" && filled.eraYear === "8", "G→E autofill Reiwa 8");
}
{
	for (const year of ["1912", "1926", "1989", "2019"]) {
		const next = switchJecAmeDraft(draftFromState(gregorianState(year)));
		assert(
			next.mode === "era" && next.eraId === "reiwa" && next.eraYear === "",
			`G→E transition ${year} does not guess era`,
		);
		assert(validateJecAmeDraft(next, "zh").ok === true, `G→E ${year} does not keep invalid`);
		assert(evaluateDesktopState(stateFromDraft(next)).status !== "valid", `G→E ${year} result is ?`);
	}
}
{
	const fromEmpty = switchJecAmeDraft(draftFromState(gregorianState("")));
	assert(fromEmpty.eraId === "reiwa" && fromEmpty.eraYear === "", "G→E empty → Reiwa empty");
}
{
	const fromInvalid = switchJecAmeDraft(draftFromState(gregorianState("1872")));
	assert(fromInvalid.eraYear === "" && fromInvalid.eraId === "reiwa", "G→E invalid → Reiwa empty");
	assert(validateJecAmeDraft(fromInvalid, "zh").ok === true, "G→E invalid does not carry invalid");
}
{
	const back = switchJecAmeDraft(draftFromState(eraState("reiwa", "8")));
	assert(back.mode === "gregorian" && back.gregorianYear === "2026", "E→G autofill 2026");
}
{
	const fromPartial = switchJecAmeDraft(draftFromState(eraState("heisei", "31")));
	assert(fromPartial.gregorianYear === "2019", "E→G Heisei 31 autofill 2019");
	assert(
		evaluateDesktopState(stateFromDraft(fromPartial), { nowYear: NOW }).kind === "gregorian-transition",
		"E→G onto transition year keeps dual Gregorian result",
	);
}
{
	const fromEraInvalid = switchJecAmeDraft(draftFromState(eraState("meiji", "5")));
	assert(fromEraInvalid.gregorianYear === "", "E→G invalid → Gregorian empty");
	assert(validateJecAmeDraft(fromEraInvalid, "en").ok === true, "E→G invalid does not carry invalid");
}
assert(/bindJecAmeInteractions/.test(script + adapter), "AME mode switch／select bound in adapter");
assert(/data-jecv2-ame-switch="era"/.test(astro) && /data-jecv2-ame-switch="gregorian"/.test(astro), "AME mode switch buttons present");
assert(/jecv2-mode-switch-icon/.test(astro), "Mode switch keeps line SVG");

/* -------------------------------------------------------------------------- */
/* Digit cap / keypad / paste contract                                         */
/* -------------------------------------------------------------------------- */
assert(
	JEC_AME_NUMERIC_FIELDS.every((field) => field.allowEmpty === true),
	"Numeric fields allow empty",
);
assert(
	acceptJecAmeNumericCandidate({
		fieldId: "gregorianYear",
		candidateValue: "2026",
		draft: draftFromState(gregorianState("202")),
	}) === true,
	"Gregorian 4th digit accepted",
);
assert(
	acceptJecAmeNumericCandidate({
		fieldId: "gregorianYear",
		candidateValue: "20261",
		draft: draftFromState(gregorianState("2026")),
	}) === false,
	"Gregorian 5th digit rejected",
);
assert(
	acceptJecAmeNumericCandidate({
		fieldId: "gregorianYear",
		candidateValue: "9999",
		draft: draftFromState(gregorianState("999")),
	}) === true,
	"Gregorian cap does not rewrite 9999 into a valid year",
);
assert(
	acceptJecAmeNumericCandidate({
		fieldId: "eraYear",
		candidateValue: "31",
		draft: draftFromState(eraState("heisei", "3")),
	}) === true,
	"Era 2nd digit accepted",
);
assert(
	acceptJecAmeNumericCandidate({
		fieldId: "eraYear",
		candidateValue: "310",
		draft: draftFromState(eraState("heisei", "31")),
	}) === false,
	"Era 3rd digit rejected",
);
assert(
	acceptJecAmeNumericCandidate({
		fieldId: "eraYear",
		candidateValue: "99",
		draft: draftFromState(eraState("heisei", "9")),
	}) === true,
	"Era cap does not rewrite 99 into a valid year",
);
assert(
	acceptJecAmeNumericCandidate({
		fieldId: "eraYear",
		candidateValue: "8",
		draft: draftFromState(gregorianState("2026")),
	}) === false,
	"Gregorian mode rejects era-year keypad digits",
);
assert(
	acceptJecAmeNumericCandidate({
		fieldId: "gregorianYear",
		candidateValue: "2",
		draft: draftFromState(eraState("reiwa", "")),
	}) === false,
	"Era mode rejects Gregorian keypad digits",
);
assert(/acceptNumericCandidate/.test(script), "Shared keypad candidate hook wired");
assert(
	/appendAmeDigit/.test(ctrl) && /maxLength/.test(ctrl),
	"Digit cap uses shared AME appendAmeDigit",
);
assert(
	!/contenteditable|navigator\.clipboard|\bpaste\b/i.test(executableAdapter),
	"No tool-local AME paste／clipboard path",
);
assert(
	!/initNumericKeypad|jecv2-keypad|tool-local keypad/.test(executableScript + executableAdapter),
	"No JEC tool-local keypad",
);
assert(/data-ame-keypad/.test(ameShell), "Shared keypad host remains in AME shell");

/* -------------------------------------------------------------------------- */
/* Mobile invalid — persistent icon + visible range message                    */
/* -------------------------------------------------------------------------- */
assert(/AmeFieldError/.test(astro), "Shared AmeFieldError used for in-field icon");
assert(/data-jecv2-ame-error="gregorianYear"/.test(astro), "Visible Gregorian error slot below field");
assert(/data-jecv2-ame-error="eraYear"/.test(astro), "Visible Era error slot below field");
assert(/jecv2-ame-error-message/.test(css), "Visible Mobile error message styles exist");
assert(/jecv2-ame-field-block/.test(astro + css), "Field + message stacked in tool-owned block");
assert(/fieldId="gregorianYear"/.test(astro) && /fieldId="eraYear"/.test(astro), "Field errors for both year fields");
assert(/aria-invalid="false"/.test(astro), "Numeric fields expose aria-invalid");
assert(/aria-describedby="ame-field-error-gregorianYear"/.test(astro), "Gregorian describedby wired");
assert(/aria-describedby="ame-field-error-eraYear"/.test(astro), "Era year describedby wired");
assert(
	!/jecv2-inline-error/.test(astro.slice(astro.indexOf("jecv2-ame-form"))),
	"AME does not copy Desktop inline error layout",
);
assert(!/title=|tooltip/.test(executableAdapter), "No Mobile tooltip error UI");
assert(/jecAmeInvalidPresentation/.test(adapter), "Invalid presentation helper is adapter-owned");
assert(
	/syncJecAmeUi[\s\S]*jecAmeInvalidPresentation/.test(executableAdapter),
	"onDraftChange／onSyncUi re-apply invalid via syncJecAmeUi",
);
assert(
	/syncJecAmeUi\(root, draft, locale\(\)\)/.test(script),
	"Script passes locale into AME UI sync",
);
assert(
	!/GREGORIAN_MIN|GREGORIAN_MAX|1873|2100/.test(
		executableAdapter.replace(/formatInvalidHint[\s\S]*$/, ""),
	) || /formatInvalidHint/.test(adapter),
	"Adapter does not duplicate range rules；messages come from formatInvalidHint",
);
assert(!/setTimeout|setInterval/.test(executableAdapter), "No timer workaround for error persistence");

{
	const empty = jecAmeInvalidPresentation(draftFromState(gregorianState("")), "zh");
	assert(empty.gregorianYear === null && empty.eraYear === null, "Empty Gregorian has no range error");
	const incomplete = jecAmeInvalidPresentation(draftFromState(gregorianState("175")), "zh");
	assert(incomplete.gregorianYear === null, "Incomplete Gregorian has no range error");
}

{
	const invalid1753 = jecAmeInvalidPresentation(draftFromState(gregorianState("1753")), "zh");
	assert(
		invalid1753.gregorianYear === "西元年份請輸入 1873 至 2100" && invalid1753.eraYear === null,
		"1753 keeps ZH Gregorian range message",
	);
	const stillInvalid = jecAmeInvalidPresentation(draftFromState(gregorianState("1753")), "zh");
	assert(
		stillInvalid.gregorianYear === invalid1753.gregorianYear,
		"Invalid presentation persists while value stays 1753",
	);
}

{
	const invalid1872 = jecAmeInvalidPresentation(draftFromState(gregorianState("1872")), "zh");
	assert(invalid1872.gregorianYear === "西元年份請輸入 1873 至 2100", "1872 ZH Gregorian range message");
	const invalid9999 = jecAmeInvalidPresentation(draftFromState(gregorianState("9999")), "en");
	assert(invalid9999.gregorianYear === "Gregorian year: 1873–2100", "9999 EN Gregorian range message");
	const valid1873 = jecAmeInvalidPresentation(draftFromState(gregorianState("1873")), "zh");
	assert(valid1873.gregorianYear === null, "1873 clears Gregorian error");
}

{
	const cleared = jecAmeInvalidPresentation(draftFromState(gregorianState("")), "en");
	assert(cleared.gregorianYear === null, "Clear／empty removes error");
	const reset = jecAmeInvalidPresentation(jecAmeResetDraft(), "zh");
	assert(reset.gregorianYear === null && reset.eraYear === null, "Reset draft has no error");
}

{
	const heisei32 = jecAmeInvalidPresentation(draftFromState(eraState("heisei", "32")), "zh");
	assert(heisei32.eraYear === "平成年份請輸入 1 至 31", "Heisei 32 ZH range message");
	const showa65 = jecAmeInvalidPresentation(draftFromState(eraState("showa", "65")), "zh");
	assert(showa65.eraYear === "昭和年份請輸入 1 至 64", "Showa 65 ZH range message");
	const meiji5 = jecAmeInvalidPresentation(draftFromState(eraState("meiji", "5")), "zh");
	assert(meiji5.eraYear === "明治年份請輸入 6 至 45", "Meiji 5 ZH range message");
	const taisho16 = jecAmeInvalidPresentation(draftFromState(eraState("taisho", "16")), "en");
	assert(taisho16.eraYear === "Taisho year: 1–15", "Taisho 16 EN range message");
	const reiwa83 = jecAmeInvalidPresentation(draftFromState(eraState("reiwa", "83")), "en");
	assert(reiwa83.eraYear === "Reiwa year: 1–82", "Reiwa 83 EN range message");
	const heisei31 = jecAmeInvalidPresentation(draftFromState(eraState("heisei", "31")), "zh");
	assert(heisei31.eraYear === null, "Heisei 31 clears era error");
}

{
	const fromHeisei = draftFromState(eraState("heisei", "32"));
	assert(
		jecAmeInvalidPresentation(fromHeisei, "zh").eraYear === "平成年份請輸入 1 至 31",
		"Heisei 32 starts invalid",
	);
	const toTaisho = { ...fromHeisei, eraId: "taisho" };
	assert(
		jecAmeInvalidPresentation(toTaisho, "zh").eraYear === "大正年份請輸入 1 至 15",
		"Era change updates error range",
	);
	const toReiwa = { ...fromHeisei, eraId: "reiwa" };
	assert(jecAmeInvalidPresentation(toReiwa, "zh").eraYear === null, "Reiwa 32 is valid so error clears");
}

{
	const invalidG = draftFromState(gregorianState("1753"));
	const switched = switchJecAmeDraft(invalidG);
	assert(
		jecAmeInvalidPresentation(switched, "zh").gregorianYear === null &&
			jecAmeInvalidPresentation(switched, "zh").eraYear === null,
		"Mode switch from invalid Gregorian does not keep error",
	);
}

{
	const zhCopy = [
		jecAmeInvalidPresentation(draftFromState(gregorianState("1753")), "zh").gregorianYear,
		jecAmeInvalidPresentation(draftFromState(eraState("meiji", "5")), "zh").eraYear,
		jecAmeInvalidPresentation(draftFromState(eraState("taisho", "16")), "zh").eraYear,
		jecAmeInvalidPresentation(draftFromState(eraState("showa", "65")), "zh").eraYear,
		jecAmeInvalidPresentation(draftFromState(eraState("heisei", "32")), "zh").eraYear,
		jecAmeInvalidPresentation(draftFromState(eraState("reiwa", "83")), "zh").eraYear,
	];
	assert(
		zhCopy.join("|") ===
			"西元年份請輸入 1873 至 2100|明治年份請輸入 6 至 45|大正年份請輸入 1 至 15|昭和年份請輸入 1 至 64|平成年份請輸入 1 至 31|令和年份請輸入 1 至 82",
		"ZH range copy covers Gregorian + five eras",
	);
}

/* -------------------------------------------------------------------------- */
/* Closed state / first-screen / scale                                         */
/* -------------------------------------------------------------------------- */
assert(/primaryActionLabel/.test(astro), "Closed capsule uses primaryActionLabel");
assert(
	/preview-tool-result-group[\s\S]*data-ame-background-scale-target/.test(astro) &&
		/preview-tool-controls[\s\S]*data-jecv2-sheet-trigger/.test(astro),
	"Main action button is in controls, not ResultSummary scale group",
);
assert(/data-ame-background-scale-target/.test(astro), "Portrait background scale target present");
assert(/data-ame-density="mixed"/.test(ameShell), "Shared AME default density is mixed");
assert(/preview-tool-controls/.test(astro) && /jecv2-mobile-capsule/.test(astro), "Closed-state capsule class retained");

/* -------------------------------------------------------------------------- */
/* Portrait / landscape contract                                               */
/* -------------------------------------------------------------------------- */
assert(/LANDSCAPE_MQ/.test(script), "Landscape layout contract still applied");
assert(/applyLayoutAttrs/.test(script), "Responsive layout attrs remain");
assert(
	/data-ame-keypad-visible/.test(ameCss) && /orientation:\s*landscape/.test(ameCss),
	"Shared AME owns landscape keypad／full-screen presentation",
);
assert(
	!/visualViewport|msb-sheet-open/.test(executableScript + executableAdapter),
	"No tool-local keyboard lift／MSB landscape path",
);

console.log(`\nResult: ${passed} passed, ${failed} failed`);
if (failed > 0) {
	process.exit(1);
}
console.log("PASS");
