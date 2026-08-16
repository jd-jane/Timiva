/**
 * Japanese Era Converter — calculation SSOT validator（B2A）.
 * Locks product spec §9／§10／§11／§29. No DOM／CSS／i18n UI.
 *
 * Run: node scripts/validate-japanese-era-converter-math.mjs
 */
import {
	ERAS,
	GREGORIAN_MAX,
	GREGORIAN_MIN,
	TRANSITION_YEARS,
	eraYearToGregorian,
	getEra,
	getPartialYearRange,
	getTransition,
} from "../src/lib/japaneseEraConverterData.ts";
import {
	evaluateJapaneseEra,
	getCurrentGregorianYear,
	reiwaMaxEraYear,
} from "../src/lib/japaneseEraConverterEvaluate.ts";
import { formatJapaneseEraResult } from "../src/lib/japaneseEraConverterFormat.ts";

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

function gregorian(raw, nowYear = NOW) {
	return evaluateJapaneseEra({ mode: "gregorian", raw }, { nowYear });
}

function era(eraId, rawYear, nowYear = NOW) {
	return evaluateJapaneseEra({ mode: "era", eraId, rawYear }, { nowYear });
}

function fmt(evaluation, locale) {
	return formatJapaneseEraResult(evaluation, locale);
}

console.log("validate-japanese-era-converter-math（calculation SSOT）\n");

/* -------------------------------------------------------------------------- */
/* Data table                                                                 */
/* -------------------------------------------------------------------------- */
{
	assert(GREGORIAN_MIN === 1873 && GREGORIAN_MAX === 2100, "Gregorian range 1873–2100");
	assert(ERAS.length === 5, "five eras");
	assert(
		getEra("meiji").offset === 1867 &&
			getEra("taisho").offset === 1911 &&
			getEra("showa").offset === 1925 &&
			getEra("heisei").offset === 1988 &&
			getEra("reiwa").offset === 2018,
		"era offsets §9.1",
	);
	assert(
		getEra("meiji").minYear === 6 &&
			getEra("meiji").maxYear === 45 &&
			getEra("taisho").maxYear === 15 &&
			getEra("showa").maxYear === 64 &&
			getEra("heisei").maxYear === 31 &&
			reiwaMaxEraYear() === 82,
		"era year bounds；Reiwa max = 2100−2018",
	);
	assert(TRANSITION_YEARS.map((row) => row.gregorianYear).join(",") === "1912,1926,1989,2019", "four transition years");
	assert(eraYearToGregorian("meiji", 6) === 1873, "Meiji 6 = 1873");
	assert(eraYearToGregorian("reiwa", 82) === 2100, "Reiwa 82 = 2100");
}

/* -------------------------------------------------------------------------- */
/* Empty / incomplete                                                         */
/* -------------------------------------------------------------------------- */
{
	assert(gregorian("").status === "empty", "Gregorian empty");
	assert(gregorian("   ").status === "empty", "Gregorian whitespace empty");
	assert(gregorian("2").status === "incomplete", "Gregorian 1 digit incomplete");
	assert(gregorian("20").status === "incomplete", "Gregorian 2 digits incomplete");
	assert(gregorian("202").status === "incomplete", "Gregorian 3 digits incomplete");
	assert(era("reiwa", "").status === "incomplete", "Era year empty incomplete");
	assert(era("", "8").status === "incomplete", "Era id empty incomplete");
	assert(fmt(gregorian(""), "zh").primary === "?", "empty formats as ?");
	assert(fmt(gregorian("20"), "en").support === null, "incomplete has no support");
}

/* -------------------------------------------------------------------------- */
/* §29.1 Gregorian → Era                                                      */
/* -------------------------------------------------------------------------- */
{
	const cases = [
		["1873", "single", "明治6年", "Meiji 6"],
		["1911", "single", "明治44年", "Meiji 44"],
		["1913", "single", "大正2年", "Taisho 2"],
		["1927", "single", "昭和2年", "Showa 2"],
		["1990", "single", "平成2年", "Heisei 2"],
		["2020", "single", "令和2年", "Reiwa 2"],
		["2026", "single", "令和8年", "Reiwa 8"],
		["2100", "single", "令和82年", "Reiwa 82"],
	];
	for (const [raw, kind, zh, en] of cases) {
		const result = gregorian(raw);
		assert(
			result.status === "valid" && result.kind === kind && result.source === "gregorian",
			`G→E ${raw} valid ${kind}`,
		);
		assert(fmt(result, "zh").primary === zh, `G→E ${raw} ZH ${zh}`);
		assert(fmt(result, "en").primary === en, `G→E ${raw} EN ${en}`);
		assert(fmt(result, "zh").support === null, `G→E ${raw} no support`);
	}
}

{
	const transitions = [
		{
			year: "1912",
			zh: "明治45年｜大正元年",
			en: "Meiji 45 | Taisho 1",
			zhSupport: "明治45年 1月1日－7月29日 / 大正元年 7月30日－12月31日",
			enSupport: "Meiji 45: Jan 1–Jul 29 / Taisho 1: Jul 30–Dec 31",
			before: ["meiji", 45],
			after: ["taisho", 1],
		},
		{
			year: "1926",
			zh: "大正15年｜昭和元年",
			en: "Taisho 15 | Showa 1",
			zhSupport: "大正15年 1月1日－12月24日 / 昭和元年 12月25日－12月31日",
			enSupport: "Taisho 15: Jan 1–Dec 24 / Showa 1: Dec 25–Dec 31",
			before: ["taisho", 15],
			after: ["showa", 1],
		},
		{
			year: "1989",
			zh: "昭和64年｜平成元年",
			en: "Showa 64 | Heisei 1",
			zhSupport: "昭和64年 1月1日－1月7日 / 平成元年 1月8日－12月31日",
			enSupport: "Showa 64: Jan 1–Jan 7 / Heisei 1: Jan 8–Dec 31",
			before: ["showa", 64],
			after: ["heisei", 1],
		},
		{
			year: "2019",
			zh: "平成31年｜令和元年",
			en: "Heisei 31 | Reiwa 1",
			zhSupport: "平成31年 1月1日－4月30日 / 令和元年 5月1日－12月31日",
			enSupport: "Heisei 31: Jan 1–Apr 30 / Reiwa 1: May 1–Dec 31",
			before: ["heisei", 31],
			after: ["reiwa", 1],
		},
	];

	for (const row of transitions) {
		const result = gregorian(row.year);
		assert(
			result.status === "valid" &&
				result.kind === "gregorian-transition" &&
				result.gregorianYear === Number(row.year) &&
				result.transitionParts[0].eraId === row.before[0] &&
				result.transitionParts[0].eraYear === row.before[1] &&
				result.transitionParts[1].eraId === row.after[0] &&
				result.transitionParts[1].eraYear === row.after[1] &&
				result.futureReiwaAssumption === false,
			`G→E ${row.year} transition parts`,
		);
		const zh = fmt(result, "zh");
		const en = fmt(result, "en");
		assert(zh.primary === row.zh, `G→E ${row.year} ZH primary`);
		assert(en.primary === row.en, `G→E ${row.year} EN primary`);
		assert(zh.support === row.zhSupport, `G→E ${row.year} ZH support`);
		assert(en.support === row.enSupport, `G→E ${row.year} EN support`);
	}
}

/* -------------------------------------------------------------------------- */
/* §29.2 Era → Gregorian + partial-year                                       */
/* -------------------------------------------------------------------------- */
{
	const singles = [
		["meiji", "6", 1873, "1873年", "1873"],
		["taisho", "2", 1913, "1913年", "1913"],
		["showa", "2", 1927, "1927年", "1927"],
		["heisei", "2", 1990, "1990年", "1990"],
		["reiwa", "2", 2020, "2020年", "2020"],
		["reiwa", "8", 2026, "2026年", "2026"],
		["reiwa", "82", 2100, "2100年", "2100"],
	];
	for (const [id, year, gregorianYear, zh, en] of singles) {
		const result = era(id, year);
		assert(
			result.status === "valid" &&
				result.kind === "single" &&
				result.source === "era" &&
				result.gregorianYear === gregorianYear,
			`E→G ${id} ${year} = ${gregorianYear}`,
		);
		assert(fmt(result, "zh").primary === zh && fmt(result, "en").primary === en, `E→G ${id} ${year} format`);
		assert(fmt(result, "zh").support === null, `E→G ${id} ${year} no support`);
	}
}

{
	const partials = [
		["meiji", "45", 1912, "1月1日－7月29日", "Jan 1–Jul 29"],
		["taisho", "1", 1912, "7月30日－12月31日", "Jul 30–Dec 31"],
		["taisho", "15", 1926, "1月1日－12月24日", "Jan 1–Dec 24"],
		["showa", "1", 1926, "12月25日－12月31日", "Dec 25–Dec 31"],
		["showa", "64", 1989, "1月1日－1月7日", "Jan 1–Jan 7"],
		["heisei", "1", 1989, "1月8日－12月31日", "Jan 8–Dec 31"],
		["heisei", "31", 2019, "1月1日－4月30日", "Jan 1–Apr 30"],
		["reiwa", "1", 2019, "5月1日－12月31日", "May 1–Dec 31"],
	];
	for (const [id, year, gregorianYear, zhRange, enRange] of partials) {
		const result = era(id, year);
		assert(
			result.status === "valid" &&
				result.kind === "era-partial-year" &&
				result.gregorianYear === gregorianYear &&
				result.partialYearRange !== null,
			`E→G ${id} ${year} partial-year ${gregorianYear}`,
		);
		assert(fmt(result, "zh").primary === `${gregorianYear}年`, `E→G ${id} ${year} ZH primary`);
		assert(fmt(result, "en").primary === String(gregorianYear), `E→G ${id} ${year} EN primary`);
		assert(fmt(result, "zh").support === zhRange, `E→G ${id} ${year} ZH range`);
		assert(fmt(result, "en").support === enRange, `E→G ${id} ${year} EN range`);
		assert(getPartialYearRange(id, Number(year)) !== null, `data partial ${id} ${year}`);
	}
}

/* -------------------------------------------------------------------------- */
/* Era first / last valid years（非 partial 的全年）                           */
/* -------------------------------------------------------------------------- */
{
	assert(era("meiji", "6").kind === "single", "Meiji first valid is full year");
	assert(era("taisho", "2").kind === "single", "Taisho 2 full year");
	assert(era("showa", "2").kind === "single", "Showa 2 full year");
	assert(era("heisei", "2").kind === "single", "Heisei 2 full year");
	assert(era("reiwa", "2").kind === "single", "Reiwa 2 full year");
	assert(era("meiji", "44").kind === "single" && era("meiji", "44").gregorianYear === 1911, "Meiji 44 = 1911");
	assert(era("heisei", "30").gregorianYear === 2018, "Heisei 30 = 2018");
}

/* -------------------------------------------------------------------------- */
/* Future Reiwa — runtime current year                                        */
/* -------------------------------------------------------------------------- */
{
	const nowYear = getCurrentGregorianYear();
	const current = gregorian(String(nowYear), nowYear);
	if (nowYear >= 2019 && nowYear <= 2100) {
		assert(
			current.status === "valid" &&
				current.kind === "single" &&
				current.era.eraId === "reiwa" &&
				current.era.eraYear === nowYear - 2018 &&
				current.futureReiwaAssumption === false,
			"current Gregorian year → current Reiwa, no assumption",
		);
		const eraCurrent = era("reiwa", String(nowYear - 2018), nowYear);
		assert(
			eraCurrent.status === "valid" &&
				eraCurrent.gregorianYear === nowYear &&
				eraCurrent.futureReiwaAssumption === false,
			"current Reiwa → current Gregorian, no assumption",
		);
	}

	const past = gregorian("2020", nowYear);
	assert(past.status === "valid" && past.futureReiwaAssumption === false, "past Reiwa Gregorian no assumption");
	assert(era("reiwa", "2", nowYear).futureReiwaAssumption === false, "past Reiwa era no assumption");

	const futureYear = Math.min(nowYear + 1, 2100);
	if (futureYear > nowYear) {
		const futureG = gregorian(String(futureYear), nowYear);
		assert(
			futureG.status === "valid" &&
				futureG.era.eraId === "reiwa" &&
				futureG.futureReiwaAssumption === true,
			"future Gregorian → Reiwa + assumption",
		);
		assert(fmt(futureG, "zh").assumptionNote === "此結果假設令和年號持續使用", "ZH assumption copy");
		assert(
			fmt(futureG, "en").assumptionNote === "Assuming the Reiwa era remains in use.",
			"EN assumption copy",
		);
		const futureE = era("reiwa", String(futureYear - 2018), nowYear);
		assert(futureE.futureReiwaAssumption === true, "future Reiwa → Gregorian + assumption");
	}

	assert(gregorian("2026", 2026).futureReiwaAssumption === false, "injected now=2026, 2026 no assumption");
	assert(gregorian("2027", 2026).futureReiwaAssumption === true, "injected now=2026, 2027 assumption");
	assert(era("reiwa", "8", 2026).futureReiwaAssumption === false, "Reiwa 8 in 2026 no assumption");
	assert(era("reiwa", "9", 2026).futureReiwaAssumption === true, "Reiwa 9 in 2026 assumption");
	assert(gregorian("2019", 2026).futureReiwaAssumption === false, "2019 transition never assumption");
}

/* -------------------------------------------------------------------------- */
/* Invalid — Gregorian                                                        */
/* -------------------------------------------------------------------------- */
{
	assert(gregorian("1872").status === "invalid" && gregorian("1872").reason === "gregorian-below-min", "1872 invalid");
	assert(gregorian("2101").status === "invalid" && gregorian("2101").reason === "gregorian-above-max", "2101 invalid");
	assert(gregorian("0").reason === "zero", "0 invalid");
	assert(gregorian("-1").reason === "negative", "negative invalid");
	assert(gregorian("2026.5").reason === "decimal", "decimal invalid");
	assert(gregorian("abc").reason === "non-numeric", "letters invalid");
	assert(gregorian("20a6").reason === "non-numeric", "mixed non-numeric");
	assert(fmt(gregorian("1872"), "zh").primary === "?", "invalid formats as ?");
	assert(gregorian("1872").range.min === 1873 && gregorian("1872").range.max === 2100, "gregorian invalid range");
}

/* -------------------------------------------------------------------------- */
/* Invalid — Era                                                              */
/* -------------------------------------------------------------------------- */
{
	assert(era("meiji", "5").reason === "era-below-min", "Meiji 5 invalid");
	assert(era("meiji", "46").reason === "era-above-max", "Meiji 46 invalid");
	assert(era("taisho", "16").reason === "era-above-max", "Taisho 16 invalid");
	assert(era("showa", "65").reason === "era-above-max", "Showa 65 invalid");
	assert(era("heisei", "32").reason === "era-above-max", "Heisei 32 invalid");
	assert(era("reiwa", "83").reason === "era-above-max", "Reiwa 83 > 2100 invalid");
	assert(era("meiji", "0").reason === "zero", "era year 0 invalid");
	assert(era("reiwa", "-1").reason === "negative", "era negative invalid");
	assert(era("reiwa", "1.5").reason === "decimal", "era decimal invalid");
	assert(era("reiwa", "x").reason === "non-numeric", "era non-numeric invalid");
	assert(era("keio", "1").reason === "era-unknown", "unknown era invalid");
	assert(era("meiji", "5").range.min === 6 && era("meiji", "5").range.max === 45, "Meiji invalid range");
	assert(era("heisei", "32").range.max === 31, "Heisei invalid max 31");
}

/* -------------------------------------------------------------------------- */
/* Bidirectional transition years                                             */
/* -------------------------------------------------------------------------- */
{
	for (const row of TRANSITION_YEARS) {
		const fromG = gregorian(String(row.gregorianYear));
		assert(fromG.kind === "gregorian-transition", `${row.gregorianYear} G→E dual`);
		const before = era(row.before.eraId, String(row.before.eraYear));
		const after = era(row.after.eraId, String(row.after.eraYear));
		assert(
			before.kind === "era-partial-year" && before.gregorianYear === row.gregorianYear,
			`${row.before.eraId} ${row.before.eraYear} → ${row.gregorianYear} partial`,
		);
		assert(
			after.kind === "era-partial-year" && after.gregorianYear === row.gregorianYear,
			`${row.after.eraId} ${row.after.eraYear} → ${row.gregorianYear} partial`,
		);
		assert(
			before.partialYearRange.start.month === row.before.start.month &&
				before.partialYearRange.end.day === row.before.end.day,
			`${row.gregorianYear} before range matches table`,
		);
		assert(
			after.partialYearRange.start.day === row.after.start.day &&
				after.partialYearRange.end.month === row.after.end.month,
			`${row.gregorianYear} after range matches table`,
		);
		assert(getTransition(row.gregorianYear)?.gregorianYear === row.gregorianYear, `lookup ${row.gregorianYear}`);
	}
}

/* -------------------------------------------------------------------------- */
/* Formatter does not re-validate                                             */
/* -------------------------------------------------------------------------- */
{
	const invalid = { status: "invalid", reason: "decimal" };
	assert(fmt(invalid, "zh").primary === "?" && fmt(invalid, "en").assumptionNote === null, "formatter trusts invalid");
	const empty = { status: "empty" };
	assert(fmt(empty, "en").primary === "?", "formatter trusts empty");
}

/* -------------------------------------------------------------------------- */
/* Trimmed numeric input                                                      */
/* -------------------------------------------------------------------------- */
{
	assert(gregorian(" 2026 ").kind === "single" && gregorian(" 2026 ").era.eraYear === 8, "trim Gregorian");
	assert(era("reiwa", " 8 ").gregorianYear === 2026, "trim era year");
}

console.log(`\nResult: ${passed} passed, ${failed} failed`);
if (failed > 0) {
	process.exit(1);
}
console.log("PASS");
