/**
 * Japanese Era Converter — Desktop interaction validator（B2B）.
 * Locks mode switch／Reset／invalid hint／popover contract.
 * Calculation still comes from B2A evaluate／format；UI must not duplicate formulas.
 *
 * Run: node scripts/validate-japanese-era-converter-desktop.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ERAS } from "../src/lib/japaneseEraConverterData.ts";
import {
	applyYearInputInsert,
	capYearInput,
	createInitialDesktopState,
	ERA_INPUT_MAX_DIGITS,
	evaluateDesktopState,
	GREGORIAN_INPUT_MAX_DIGITS,
	resetDesktopState,
	setDesktopEraId,
	setEraYearRaw,
	setGregorianRaw,
	switchDesktopMode,
} from "../src/lib/japaneseEraConverterDesktopState.ts";
import { formatInvalidHint, formatJapaneseEraResult } from "../src/lib/japaneseEraConverterFormat.ts";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(rootDir, path), "utf8");
const exists = (path) => existsSync(join(rootDir, path));

const astro = read("src/components/tools/japanese-era-converter-v2/JapaneseEraConverterV2.astro");
const script = read("src/scripts/japanese-era-converter.ts");
const css = read("src/styles/tools/japanese-era-converter-v2.css");
const desktopState = read("src/lib/japaneseEraConverterDesktopState.ts");
const formatSource = read("src/lib/japaneseEraConverterFormat.ts");

const stripComments = (source) =>
	source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

const executableScript = stripComments(script);
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

console.log("validate-japanese-era-converter-desktop（B2B Desktop interaction）\n");

/* -------------------------------------------------------------------------- */
/* Foundation                                                                  */
/* -------------------------------------------------------------------------- */
assert(exists("src/lib/japaneseEraConverterDesktopState.ts"), "desktop state module tracked");
assert(exists("src/lib/japaneseEraConverterEvaluate.ts"), "evaluate SSOT tracked");
assert(exists("src/lib/japaneseEraConverterFormat.ts"), "format SSOT tracked");
assert(/evaluateJapaneseEra|evaluateDesktopState/.test(script), "script consumes evaluate");
assert(/formatJapaneseEraResult/.test(script), "script consumes formatter");
assert(/formatInvalidHint/.test(script), "script consumes invalid hint formatter");
assert(/switchDesktopMode/.test(script), "script consumes mode-switch helper");
assert(/resetDesktopState/.test(script), "script consumes Reset helper");
assert(!/DesktopCalendar|createDesktopCalendar|data-desktop-calendar/.test(astro + script), "no DesktopCalendar");
assert(!/localStorage/.test(executableScript), "no LocalStorage");
assert(/JEC_AME_NUMERIC_FIELDS/.test(script), "Desktop script mounts AME via shared numericFields config");
assert(
	!/initNumericKeypad/.test(executableScript),
	"no tool-local Numeric Keypad constructor",
);
assert(/lifecycle:\s*"live"/.test(script), "AME live lifecycle opted in at mount");
assert(
	!/rollback|data-ame-close="cancel"[\s\S]{0,80}rollback/.test(executableScript),
	"script does not add Cancel rollback",
);

/* -------------------------------------------------------------------------- */
/* No duplicated calculation constants in UI                                   */
/* -------------------------------------------------------------------------- */
{
	const uiSources = executableScript + executableAstro + stripComments(desktopState);
	assert(!/\b1867\b/.test(uiSources), "UI does not hardcode Meiji offset 1867");
	assert(!/\b1911\b/.test(uiSources), "UI does not hardcode Taisho offset 1911");
	assert(!/\b1925\b/.test(uiSources), "UI does not hardcode Showa offset 1925");
	assert(!/\b1988\b/.test(uiSources), "UI does not hardcode Heisei offset 1988");
	assert(
		!/\bcurrentYear\s*-\s*2018\b/.test(executableAstro),
		"placeholder uses B2A Reiwa offset, not hardcoded 2018",
	);
	assert(/getEra\("reiwa"\)\.offset/.test(astro), "placeholder consumes getEra('reiwa').offset");
	assert(!/function findEraForGregorianYear/.test(script), "script does not reimplement era lookup");
	assert(!/GREGORIAN_MIN|GREGORIAN_MAX/.test(executableScript), "script does not copy Gregorian bounds");
}

/* -------------------------------------------------------------------------- */
/* Gregorian live                                                              */
/* -------------------------------------------------------------------------- */
{
	const evaluation = evaluateDesktopState(gregorianState("2026"), { nowYear: NOW });
	const zh = formatJapaneseEraResult(evaluation, "zh");
	const en = formatJapaneseEraResult(evaluation, "en");
	assert(evaluation.status === "valid" && evaluation.kind === "single", "Gregorian 2026 valid single");
	assert(zh.primary === "令和8年" && en.primary === "Reiwa 8", "Gregorian 2026 formats Reiwa 8");
	assert(zh.support === null && zh.futureReiwaAssumption === false, "current Reiwa has no support/note");

	const empty = evaluateDesktopState(gregorianState(""), { nowYear: NOW });
	assert(empty.status === "empty", "empty Gregorian is empty");
	assert(formatJapaneseEraResult(empty, "zh").primary === "?", "empty Gregorian formats ?");
	assert(formatInvalidHint(empty, "zh") === null, "empty has no invalid hint");

	const incomplete = evaluateDesktopState(gregorianState("20"), { nowYear: NOW });
	assert(incomplete.status === "incomplete", "short Gregorian is incomplete");
	assert(formatJapaneseEraResult(incomplete, "en").primary === "?", "incomplete formats ?");
	assert(formatInvalidHint(incomplete, "en") === null, "incomplete has no ! hint");
}

{
	const years = ["1912", "1926", "1989", "2019"];
	for (const year of years) {
		const evaluation = evaluateDesktopState(gregorianState(year), { nowYear: NOW });
		assert(
			evaluation.status === "valid" && evaluation.kind === "gregorian-transition",
			`Gregorian ${year} is transition`,
		);
		const zh = formatJapaneseEraResult(evaluation, "zh");
		const en = formatJapaneseEraResult(evaluation, "en");
		assert(zh.primary.includes("｜") && Boolean(zh.support), `ZH ${year} dual primary + support`);
		assert(en.primary.includes(" | ") && Boolean(en.support), `EN ${year} dual primary + support`);
		assert(zh.futureReiwaAssumption === false, `${year} has no future note`);
	}
}

{
	const invalids = [
		["1872", "gregorian-below-min"],
		["2101", "gregorian-above-max"],
		["0", "zero"],
		["-3", "negative"],
		["2026.5", "decimal"],
		["abc", "non-numeric"],
	];
	for (const [raw, reason] of invalids) {
		const evaluation = evaluateDesktopState(gregorianState(raw), { nowYear: NOW });
		assert(evaluation.status === "invalid" && evaluation.reason === reason, `Gregorian ${raw} → ${reason}`);
		assert(formatJapaneseEraResult(evaluation, "zh").primary === "?", `Gregorian ${raw} formats ?`);
		const hintZh = formatInvalidHint(evaluation, "zh");
		const hintEn = formatInvalidHint(evaluation, "en");
		assert(Boolean(hintZh) && Boolean(hintEn), `Gregorian ${raw} has ZH/EN hint`);
	}

	const rangeHint = formatInvalidHint(
		evaluateDesktopState(gregorianState("1872"), { nowYear: NOW }),
		"zh",
	);
	assert(rangeHint === "西元年份請輸入 1873 至 2100", "Gregorian range hint uses evaluate range");
	assert(
		formatInvalidHint(evaluateDesktopState(gregorianState("2101"), { nowYear: NOW }), "en") ===
			"Gregorian year: 1873–2100",
		"EN Gregorian range hint",
	);
	assert(
		formatInvalidHint(evaluateDesktopState(gregorianState("0"), { nowYear: NOW }), "zh") ===
			"請輸入 1 以上的年份",
		"zero hint",
	);
	assert(
		formatInvalidHint(evaluateDesktopState(gregorianState("9999"), { nowYear: NOW }), "zh") ===
			"西元年份請輸入 1873 至 2100",
		"Gregorian 9999 stays invalid after 4-digit cap",
	);
}

/* -------------------------------------------------------------------------- */
/* Japanese-era live                                                           */
/* -------------------------------------------------------------------------- */
{
	const evaluation = evaluateDesktopState(eraState("reiwa", "8"), { nowYear: NOW });
	assert(evaluation.status === "valid" && evaluation.kind === "single", "Reiwa 8 valid");
	assert(formatJapaneseEraResult(evaluation, "zh").primary === "2026年", "Reiwa 8 → 2026年");
	assert(formatJapaneseEraResult(evaluation, "en").primary === "2026", "Reiwa 8 → 2026");
	assert(evaluation.futureReiwaAssumption === false, "current Reiwa era year has no note");
}

{
	const boundaries = [
		["meiji", "45"],
		["taisho", "1"],
		["taisho", "15"],
		["showa", "1"],
		["showa", "64"],
		["heisei", "1"],
		["heisei", "31"],
		["reiwa", "1"],
	];
	for (const [eraId, year] of boundaries) {
		const evaluation = evaluateDesktopState(eraState(eraId, year), { nowYear: NOW });
		assert(
			evaluation.status === "valid" && evaluation.kind === "era-partial-year",
			`${eraId} ${year} is partial-year`,
		);
		const formatted = formatJapaneseEraResult(evaluation, "zh");
		assert(Boolean(formatted.support) && formatted.primary !== "?", `${eraId} ${year} has date support`);
	}
}

{
	const invalids = [
		["meiji", "5", "era-below-min"],
		["heisei", "32", "era-above-max"],
		["taisho", "16", "era-above-max"],
		["showa", "65", "era-above-max"],
		["reiwa", "83", "era-above-max"],
		["meiji", "0", "zero"],
		["showa", "-1", "negative"],
		["heisei", "1.5", "decimal"],
		["reiwa", "x", "non-numeric"],
	];
	for (const [eraId, year, reason] of invalids) {
		const evaluation = evaluateDesktopState(eraState(eraId, year), { nowYear: NOW });
		assert(evaluation.status === "invalid" && evaluation.reason === reason, `${eraId} ${year} → ${reason}`);
		const hint = formatInvalidHint(evaluation, "zh", eraId);
		assert(Boolean(hint), `${eraId} ${year} has hint`);
	}

	assert(
		formatInvalidHint(evaluateDesktopState(eraState("meiji", "5"), { nowYear: NOW }), "zh", "meiji") ===
			"明治年份請輸入 6 至 45",
		"Meiji range hint",
	);
	assert(
		formatInvalidHint(evaluateDesktopState(eraState("heisei", "32"), { nowYear: NOW }), "zh", "heisei") ===
			"平成年份請輸入 1 至 31",
		"Heisei above-max hint",
	);
	assert(
		formatInvalidHint(evaluateDesktopState(eraState("reiwa", "83"), { nowYear: NOW }), "en", "reiwa") ===
			"Reiwa year: 1–82",
		"Reiwa above-max EN hint",
	);
	assert(
		formatInvalidHint(evaluateDesktopState(eraState("showa", "65"), { nowYear: NOW }), "zh", "showa") ===
			"昭和年份請輸入 1 至 64",
		"Showa 65 inline hint",
	);
	assert(
		formatInvalidHint(evaluateDesktopState(eraState("heisei", "99"), { nowYear: NOW }), "en", "heisei") ===
			"Heisei year: 1–31",
		"Heisei 99 stays invalid after 2-digit cap",
	);
}

{
	const future = evaluateDesktopState(eraState("reiwa", "82"), { nowYear: NOW });
	assert(future.status === "valid" && future.futureReiwaAssumption === true, "Reiwa 82 is future assumption");
	assert(
		formatJapaneseEraResult(future, "zh").assumptionNote === "此結果假設令和年號持續使用",
		"future ZH assumption copy",
	);
	const current = evaluateDesktopState(eraState("reiwa", "8"), { nowYear: NOW });
	assert(current.futureReiwaAssumption === false, "Reiwa 8 is not future");
	const pastGregorian = evaluateDesktopState(gregorianState("2026"), { nowYear: NOW });
	assert(pastGregorian.futureReiwaAssumption === false, "Gregorian 2026 is not future");
}

/* -------------------------------------------------------------------------- */
/* Mode switch                                                                 */
/* -------------------------------------------------------------------------- */
{
	const filled = switchDesktopMode(gregorianState("2026"), { nowYear: NOW });
	assert(filled.mode === "era" && filled.eraId === "reiwa" && filled.eraYearRaw === "8", "G→E autofill Reiwa 8");

	for (const year of ["1912", "1926", "1989", "2019"]) {
		const next = switchDesktopMode(gregorianState(year), { nowYear: NOW });
		assert(
			next.mode === "era" && next.eraId === "reiwa" && next.eraYearRaw === "",
			`G→E transition ${year} does not guess era`,
		);
		assert(evaluateDesktopState(next, { nowYear: NOW }).status === "incomplete", `G→E ${year} result stays empty`);
	}

	const fromEmpty = switchDesktopMode(gregorianState(""), { nowYear: NOW });
	assert(fromEmpty.mode === "era" && fromEmpty.eraId === "reiwa" && fromEmpty.eraYearRaw === "", "G→E empty → Reiwa empty");

	const fromInvalid = switchDesktopMode(gregorianState("1872"), { nowYear: NOW });
	assert(fromInvalid.eraId === "reiwa" && fromInvalid.eraYearRaw === "", "G→E invalid → Reiwa empty");
	assert(evaluateDesktopState(fromInvalid, { nowYear: NOW }).status !== "invalid", "G→E invalid does not carry invalid");

	const back = switchDesktopMode(eraState("reiwa", "8"), { nowYear: NOW });
	assert(back.mode === "gregorian" && back.gregorianRaw === "2026", "E→G autofill 2026");

	const fromPartial = switchDesktopMode(eraState("heisei", "31"), { nowYear: NOW });
	assert(fromPartial.gregorianRaw === "2019", "E→G Heisei 31 autofill 2019");
	const after = evaluateDesktopState(fromPartial, { nowYear: NOW });
	assert(after.kind === "gregorian-transition", "E→G onto transition year shows dual Gregorian result");

	const fromEraInvalid = switchDesktopMode(eraState("meiji", "5"), { nowYear: NOW });
	assert(fromEraInvalid.mode === "gregorian" && fromEraInvalid.gregorianRaw === "", "E→G invalid → Gregorian empty");
	assert(evaluateDesktopState(fromEraInvalid, { nowYear: NOW }).status === "empty", "E→G invalid clears result");
}

/* -------------------------------------------------------------------------- */
/* Reset                                                                       */
/* -------------------------------------------------------------------------- */
{
	const dirty = switchDesktopMode(eraState("heisei", "31"), { nowYear: NOW });
	const reset = resetDesktopState(dirty);
	assert(reset.mode === "gregorian", "Reset mode Gregorian");
	assert(reset.gregorianRaw === "" && reset.eraYearRaw === "", "Reset clears years");
	assert(reset.eraId === "reiwa", "Reset era default Reiwa");
	assert(evaluateDesktopState(reset, { nowYear: NOW }).status === "empty", "Reset result empty");
	assert(formatInvalidHint(evaluateDesktopState(reset, { nowYear: NOW }), "zh") === null, "Reset clears invalid");
}

/* -------------------------------------------------------------------------- */
/* Digit cap                                                                   */
/* -------------------------------------------------------------------------- */
{
	assert(GREGORIAN_INPUT_MAX_DIGITS === 4, "Gregorian cap is 4 digits");
	assert(ERA_INPUT_MAX_DIGITS === 2, "era cap is 2 digits");
	assert(applyYearInputInsert("2026", "1", 4, 4, 4) === "2026", "5th Gregorian digit is ignored");
	assert(applyYearInputInsert("", "20261", 0, 0, 4) === "2026", "Gregorian paste keeps first 4 chars");
	assert(applyYearInputInsert("", "99999", 0, 0, 4) === "9999", "long paste is not range-clamped");
	assert(applyYearInputInsert("", "9999", 0, 0, 4) === "9999", "9999 remains 9999");
	assert(setGregorianRaw(createInitialDesktopState(), "9999").gregorianRaw === "9999", "setter does not clamp 9999 to 2100");
	assert(
		evaluateDesktopState(gregorianState("9999"), { nowYear: NOW }).status === "invalid",
		"9999 still invalid via B2A",
	);
	assert(applyYearInputInsert("31", "2", 2, 2, 2) === "31", "3rd era digit is ignored");
	assert(applyYearInputInsert("", "991", 0, 0, 2) === "99", "era paste keeps first 2 chars");
	assert(setEraYearRaw(eraState("heisei", ""), "99").eraYearRaw === "99", "Heisei 99 is not clamped to 31");
	assert(
		evaluateDesktopState(eraState("heisei", "99"), { nowYear: NOW }).status === "invalid",
		"Heisei 99 still invalid via B2A",
	);
	assert(capYearInput("65", 2) === "65", "Showa 65 stays two digits");
}

/* -------------------------------------------------------------------------- */
/* Markup / popover / invalid UI                                               */
/* -------------------------------------------------------------------------- */
{
	assert(/data-jecv2-era-popover/.test(astro), "era popover markup exists");
	assert(/role="listbox"/.test(astro), "popover is listbox");
	assert(/role="option"/.test(astro), "era options are option");
	assert(/data-jecv2-era-option=\{era\.id\}/.test(astro), "era options rendered from eraEntries");
	assert(
		/id: "meiji"[\s\S]*id: "taisho"[\s\S]*id: "showa"[\s\S]*id: "heisei"[\s\S]*id: "reiwa"/.test(
			astro,
		),
		"eraEntries chronological Meiji→Reiwa",
	);
	assert(ERAS.map((era) => era.id).join(",") === "meiji,taisho,showa,heisei,reiwa", "data era order chronological");
	assert(/aria-haspopup="listbox"/.test(astro), "prefix has listbox popup");
	assert(/aria-controls="jecv2-era-listbox"/.test(astro), "prefix controls popover");
	assert(/Escape/.test(script), "Esc closes popover");
	assert(/pointerdown/.test(script), "outside pointerdown closes popover");
	assert(/ArrowDown/.test(script) && /ArrowUp/.test(script), "arrow key navigation");
	assert(/data-placement/.test(script) && /above/.test(script), "popover can flip above");
	assert(!/<select[\s\S]*data-jecv2-era-prefix/.test(astro), "desktop era is not native select");
	assert(/data-jecv2-ame-era-select/.test(astro), "AME native select remains for later B2C");
}

{
	assert(/data-jecv2-desktop-gregorian-error/.test(astro), "Gregorian inline error");
	assert(/data-jecv2-desktop-era-error/.test(astro), "era inline error");
	assert(/role="status"/.test(astro), "inline error status role");
	assert(!/role="tooltip"/.test(astro), "hover tooltip removed");
	assert(!/jecv2-invalid-tooltip/.test(css + astro), "tooltip styles removed");
	assert(!/jecv2-invalid-icon/.test(css + astro), "invalid icon removed");
	assert(/jecv2-inline-error/.test(css), "inline error styles exist");
	assert(/formatInvalidHint/.test(formatSource), "invalid copy lives in formatter");
	assert(!/\.jecv2-year-input\.is-invalid/.test(css), "no invalid input class restyle");
	assert(!/border-color:\s*(red|#f|#ef|#dc|#e11)/i.test(css), "no red field border");
	assert(/maxlength="4"/.test(astro), "Gregorian maxlength 4 on text input");
	assert(/maxlength="2"/.test(astro), "era maxlength 2 on text input");
	assert(/type="text"/.test(astro) && !/type="number"/.test(astro), "year fields stay type=text");
	assert(/applyYearInputInsert/.test(script), "script uses shared digit-cap helper");
	assert(/beforeinput/.test(script) && /paste/.test(script), "keyboard and paste share digit cap");
	assert(
		!/data-jecv2-desktop-switch="era"[\s\S]{0,80}tabindex="-1"/.test(astro),
		"desktop mode switch is focusable",
	);
	assert(!/data-jecv2-reset tabindex="-1"/.test(astro), "desktop Reset is focusable");
	assert(/data-jecv2-ame-switch="era"[\s\S]*tabindex="-1"/.test(astro), "AME switch stays non-live tabindex");
}

{
	assert(/params\.get\("jecv2Fixture"\)/.test(script), "fixture query still readable");
	assert(
		/rawFixture && isFixture\(rawFixture\) \? rawFixture : null/.test(script) ||
			/fixture = rawFixture && isFixture/.test(script),
		"official page is not fixture-controlled without query",
	);
	assert(!/applyFixtureResult/.test(script), "static fixture result copy is not live SSOT");
}

console.log(`\nResult: ${passed} passed, ${failed} failed`);
if (failed > 0) {
	process.exit(1);
}
console.log("PASS");
