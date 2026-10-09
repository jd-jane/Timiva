/**
 * Taiwan Year & Age Reference — B2A math／format／state SSOT validator.
 * 不碰 DOM／CSS。Format 斷言只引用 i18n messages，不另寫文案表。
 *
 * Run: node scripts/validate-taiwan-year-age-reference-math.mjs
 */
import { en } from "../src/i18n/en.ts";
import { zh } from "../src/i18n/zh.ts";
import {
	fillTyarTemplate,
	formatTaiwanYearAge,
} from "../src/lib/taiwanYearAgeReferenceFormat.ts";
import {
	buildYearFacts,
	canonicalEraForGregorian,
	evaluateEraYear,
	evaluateGregorianYear,
	evaluateMinguoYear,
	evaluateReverseLookup,
	evaluateReverseTriplet,
	evaluateTaiwanYearAge,
	TYAR_MIN_YEAR,
} from "../src/lib/taiwanYearAgeReferenceMath.ts";
import {
	evaluateTyarState,
	setTyarQueryMode,
	setTyarReverseView,
	stateFromTyarQaFixture,
	switchTyarCalendarMode,
} from "../src/lib/taiwanYearAgeReferenceState.ts";
import { lookupThenTaiwan } from "../src/lib/taiwanYearAgeReferenceThenTaiwan.ts";

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
const OPT = { nowYear: NOW };
const zhCopy = zh.taiwanYearAgeReference;
const enCopy = en.taiwanYearAgeReference;

function fill(copy, key, vars) {
	return fillTyarTemplate(copy[key], vars);
}

function fmtGregorian(raw, localeCopy, locale) {
	return formatTaiwanYearAge(evaluateGregorianYear(raw, OPT), locale, localeCopy);
}

function fmtMinguo(raw, localeCopy, locale) {
	return formatTaiwanYearAge(evaluateMinguoYear(raw, OPT), locale, localeCopy);
}

function fmtEra(eraId, rawYear, localeCopy, locale) {
	return formatTaiwanYearAge(evaluateEraYear(eraId, rawYear, OPT), locale, localeCopy);
}

function exact(evaluation) {
	assert(evaluation.status === "valid", `expected valid, got ${evaluation.status}`);
	assert(evaluation.result?.kind === "exact", `expected exact, got ${evaluation.result?.kind}`);
	return evaluation.result;
}

function reverse(evaluation) {
	assert(evaluation.status === "valid", `expected valid reverse, got ${evaluation.status}`);
	assert(evaluation.result?.kind === "reverse", `expected reverse, got ${evaluation.result?.kind}`);
	return evaluation.result;
}

console.log("validate-taiwan-year-age-reference-math（B2A SSOT）\n");

/* —— 西元 1930 —— */
{
	const result = exact(evaluateGregorianYear("1930", OPT));
	assert(result.gregorianYear === 1930, "1930 gregorianYear");
	assert(result.minguo.type === "year" && result.minguo.year === 19, "1930 民國 19");
	assert(result.canonicalEra?.eraId === "showa" && result.canonicalEra.eraYear === 5, "1930 昭和 5");
	assert(result.showEraInPrimary === true, "1930 proactive era");
	assert(result.age === 96, "1930 age 96");
	assert(result.zodiacId === "horse", "1930 horse");
	assert(result.stemBranch.zh === "庚午", "1930 庚午");

	const zh = fmtGregorian("1930", zhCopy, "zh");
	const en = fmtGregorian("1930", enCopy, "en");
	assert(zh.primary === [fill(zhCopy, "formatMinguoYear", { n: 19 }), fill(zhCopy, "formatEraYear", { era: zhCopy.eraNames.showa, n: 5 })].join(zhCopy.formatPrimaryJoin), "ZH 1930 primary from i18n");
	assert(en.primary === [fill(enCopy, "formatMinguoYear", { n: 19 }), fill(enCopy, "formatEraYear", { era: enCopy.eraNames.showa, n: 5 })].join(enCopy.formatPrimaryJoin), "EN 1930 primary from i18n");
	assert(zh.secondary.includes(fill(zhCopy, "formatAgeAbout", { n: 96 })), "ZH 1930 age from i18n");
	assert(en.secondary.includes(fill(enCopy, "formatAgeAbout", { n: 96 })), "EN 1930 age from i18n");
	assert(zh.thenTaiwan === lookupThenTaiwan(1930, "zh"), "1930 thenTaiwan ZH lookup");
}

/* —— 民國 19 / 昭和 5 —— */
{
	const minguo = exact(evaluateMinguoYear("19", OPT));
	const era = exact(evaluateEraYear("showa", "5", OPT));
	assert(minguo.gregorianYear === 1930 && era.gregorianYear === 1930, "民國 19／昭和 5 → 1930");
	const zhM = fmtMinguo("19", zhCopy, "zh");
	const zhE = fmtEra("showa", "5", zhCopy, "zh");
	assert(zhM.primary.includes(fill(zhCopy, "formatGregorianYear", { year: 1930 })), "民國查詢 primary 含西元");
	assert(!zhM.primary.includes(fill(zhCopy, "formatMinguoYear", { n: 19 })), "民國查詢不重複民國");
	assert(zhE.primary.includes(fill(zhCopy, "formatGregorianYear", { year: 1930 })), "和曆查詢 primary 含西元");
	assert(zhE.primary.includes(zhCopy.formatMinguoYearOne) === false, "昭和 5 不是元年");
	assert(zhE.primary.includes(fill(zhCopy, "formatMinguoYear", { n: 19 })), "和曆查詢含民國");
}

/* —— 西元 1986：不主動顯示和曆 —— */
{
	const result = exact(evaluateGregorianYear("1986", OPT));
	assert(result.minguo.type === "year" && result.minguo.year === 75, "1986 民國 75");
	assert(result.showEraInPrimary === false, "1986 no proactive era");
	assert(result.canonicalEra?.eraId === "showa", "1986 canonical era exists but hidden");
	assert(result.age === 40, "1986 age 40");
	assert(result.zodiacId === "tiger", "1986 tiger");
	const zh = fmtGregorian("1986", zhCopy, "zh");
	assert(zh.primary === fill(zhCopy, "formatMinguoYear", { n: 75 }), "1986 primary 只有民國");
	assert(!zh.primary.includes(zhCopy.eraNames.showa), "1986 primary 無昭和");
}

/* —— 西元 1895 —— */
{
	const result = exact(evaluateGregorianYear("1895", OPT));
	assert(result.minguo.type === "before" && result.minguo.years === 17, "1895 民國前 17");
	assert(result.canonicalEra?.eraId === "meiji" && result.canonicalEra.eraYear === 28, "1895 明治 28");
	assert(result.showEraInPrimary === true, "1895 proactive era");
	const zh = fmtGregorian("1895", zhCopy, "zh");
	assert(zh.primary === [fill(zhCopy, "formatMinguoBefore", { n: 17 }), fill(zhCopy, "formatEraYear", { era: zhCopy.eraNames.meiji, n: 28 })].join(zhCopy.formatPrimaryJoin), "ZH 1895 primary from i18n");
}

/* —— 民國 1 / 明治 45 / 大正 1 —— */
{
	const minguo1 = exact(evaluateMinguoYear("1", OPT));
	const meiji45 = exact(evaluateEraYear("meiji", "45", OPT));
	const taisho1 = exact(evaluateEraYear("taisho", "1", OPT));
	assert(minguo1.gregorianYear === 1912, "民國 1 = 1912");
	assert(meiji45.gregorianYear === 1912, "明治 45 = 1912");
	assert(taisho1.gregorianYear === 1912, "大正 1 = 1912");
	assert(minguo1.minguo.type === "year-one", "1912 結果民國元年");
	assert(canonicalEraForGregorian(1912, NOW)?.eraId === "meiji", "1912 canonical 明治 45");
	assert(canonicalEraForGregorian(1912, NOW)?.eraYear === 45, "1912 canonical year 45");
	const zhM = fmtMinguo("1", zhCopy, "zh");
	const zhE = fmtEra("meiji", "45", zhCopy, "zh");
	assert(zhM.primary.includes(fill(zhCopy, "formatGregorianYear", { year: 1912 })), "民國 1 primary 含 1912");
	assert(zhM.primary.includes(fill(zhCopy, "formatEraYear", { era: zhCopy.eraNames.meiji, n: 45 })), "民國 1 含明治 45");
	assert(zhE.primary.includes(zhCopy.formatMinguoYearOne), "明治 45 結果含民國元年");
	assert(fmtEra("taisho", "1", zhCopy, "zh").primary.includes(zhCopy.formatMinguoYearOne), "大正 1 結果含民國元年");
}

/* —— 明治 1 = 1868 —— */
{
	const result = exact(evaluateEraYear("meiji", "1", OPT));
	assert(result.gregorianYear === 1868, "明治 1 = 1868");
	assert(evaluateEraYear("meiji", "5", OPT).status === "valid", "明治 5 合法（不套 JEC minYear=6）");
}

/* —— 邊界／invalid／incomplete —— */
{
	assert(evaluateGregorianYear("1862", OPT).status === "valid", "1862 valid");
	assert(exact(evaluateGregorianYear("2026", OPT)).age === 0, "今年 age 0");
	assert(evaluateGregorianYear("1861", OPT).status === "invalid", "1861 invalid");
	assert(evaluateGregorianYear("2027", OPT).status === "invalid", "2027 invalid");
	assert(evaluateGregorianYear("193", OPT).status === "incomplete", "西元 1–3 位 incomplete");
	assert(evaluateGregorianYear("19", OPT).status === "incomplete", "西元 2 位 incomplete");
	assert(evaluateGregorianYear("1", OPT).status === "incomplete", "西元 1 位 incomplete");
	assert(evaluateGregorianYear("0", OPT).status === "invalid", "西元 0 invalid");
	assert(evaluateGregorianYear("-1", OPT).status === "invalid", "negative invalid");
	assert(evaluateMinguoYear("0", OPT).status === "invalid", "民國 0 invalid");
	assert(evaluateMinguoYear("", OPT).status === "empty", "民國 empty");
	assert(evaluateGregorianYear("", OPT).status === "empty", "西元 empty");
}

/* —— 改元兩側 + canonical 較早側 —— */
{
	assert(exact(evaluateEraYear("taisho", "15", OPT)).gregorianYear === 1926, "大正 15 → 1926");
	assert(exact(evaluateEraYear("showa", "1", OPT)).gregorianYear === 1926, "昭和 1 → 1926");
	assert(canonicalEraForGregorian(1926, NOW)?.eraId === "taisho" && canonicalEraForGregorian(1926, NOW)?.eraYear === 15, "1926 canonical 大正 15");

	assert(exact(evaluateEraYear("showa", "64", OPT)).gregorianYear === 1989, "昭和 64 → 1989");
	assert(exact(evaluateEraYear("heisei", "1", OPT)).gregorianYear === 1989, "平成 1 → 1989");
	assert(canonicalEraForGregorian(1989, NOW)?.eraId === "showa" && canonicalEraForGregorian(1989, NOW)?.eraYear === 64, "1989 canonical 昭和 64");

	assert(exact(evaluateEraYear("heisei", "31", OPT)).gregorianYear === 2019, "平成 31 → 2019");
	assert(exact(evaluateEraYear("reiwa", "1", OPT)).gregorianYear === 2019, "令和 1 → 2019");
	assert(canonicalEraForGregorian(2019, NOW)?.eraId === "heisei" && canonicalEraForGregorian(2019, NOW)?.eraYear === 31, "2019 canonical 平成 31");

	const zh1912 = fmtGregorian("1912", zhCopy, "zh");
	assert(zh1912.primary.includes(zhCopy.eraNames.meiji), "西元 1912 顯示較早年號明治");
	assert(!zh1912.primary.includes(zhCopy.eraNames.taisho), "西元 1912 不顯示大正");
}

/* —— 主動顯示 1945／1946 —— */
{
	assert(exact(evaluateGregorianYear("1945", OPT)).showEraInPrimary === true, "1945 proactive 和曆");
	assert(exact(evaluateGregorianYear("1946", OPT)).showEraInPrimary === false, "1946 不主動顯示和曆");
	const zh1946 = fmtGregorian("1946", zhCopy, "zh");
	assert(!zh1946.primary.includes(zhCopy.eraNames.showa), "1946 primary 無昭和");
	const eraHeisei = exact(evaluateEraYear("heisei", "1", OPT));
	assert(eraHeisei.showEraInPrimary === true, "和曆輸入不受 1895–1945 限制（仍輸出西元+民國）");
	assert(fmtEra("heisei", "1", zhCopy, "zh").primary.includes(fill(zhCopy, "formatGregorianYear", { year: 1989 })), "平成 1 primary 含 1989");
}

/* —— Reverse 鼠 + 90 —— */
{
	const result = reverse(evaluateReverseLookup("rat", "90", "closest", OPT));
	assert(result.target === 1936, "鼠+90 target 1936");
	assert(result.closestYear === 1936, "closest 1936");
	assert(result.previousYear === 1924, "previous 1924");
	assert(result.nextYear === 1948, "next 1948");
	assert(result.reverseView === "closest", "initial reverseView closest");
	assert(result.viewedYear === 1936, "viewed closest 1936");

	const zh = formatTaiwanYearAge(evaluateReverseLookup("rat", "90", "closest", OPT), "zh", zhCopy);
	const en = formatTaiwanYearAge(evaluateReverseLookup("rat", "90", "closest", OPT), "en", enCopy);
	assert(zh.primary === fill(zhCopy, "formatReverseClosest", { year: 1936 }), "ZH closest primary");
	assert(en.primary === fill(enCopy, "formatReverseClosest", { year: 1936 }), "EN closest primary");
	assert(zh.thenTaiwan === null && en.thenTaiwan === null, "Reverse 無 thenTaiwan");
	assert(zh.eraLine.includes(fill(zhCopy, "formatMinguoYear", { n: 25 })), "closest era line 民國 25");
	assert(zh.stemLine.includes(zhCopy.zodiacNames.rat), "closest stem 鼠");
}

/* —— reverseView 切換不改三元組 —— */
{
	let state = stateFromTyarQaFixture("reverse");
	const closestEval = reverse(evaluateTyarState(state, OPT));
	state = setTyarReverseView(state, "previous", OPT);
	const prevEval = reverse(evaluateTyarState(state, OPT));
	assert(prevEval.closestYear === 1936 && prevEval.previousYear === 1924 && prevEval.nextYear === 1948, "previous view 三元組不變");
	assert(prevEval.viewedYear === 1924 && prevEval.reverseView === "previous", "viewed 1924");
	const zhPrev = formatTaiwanYearAge(evaluateTyarState(state, OPT), "zh", zhCopy);
	assert(zhPrev.primary === fill(zhCopy, "formatReverseYear", { year: 1924 }), "previous primary 1924 年");
	assert(zhPrev.primary !== fill(zhCopy, "formatReverseClosest", { year: 1924 }), "不得寫成最接近 1924 年");

	state = setTyarReverseView(state, "closest", OPT);
	assert(reverse(evaluateTyarState(state, OPT)).viewedYear === 1936, "回 closest");

	state = setTyarReverseView(state, "next", OPT);
	const nextEval = reverse(evaluateTyarState(state, OPT));
	assert(nextEval.closestYear === closestEval.closestYear, "next view closest 仍 1936");
	assert(nextEval.viewedYear === 1948, "viewed 1948");
	assert(nextEval.previousYear === 1924 && nextEval.nextYear === 1948, "仍無 1912／1960");
	const zhNext = formatTaiwanYearAge(evaluateTyarState(state, OPT), "zh", zhCopy);
	assert(zhNext.primary === fill(zhCopy, "formatReverseYear", { year: 1948 }), "next primary 1948 年");
	assert(!zhNext.primary.includes("最接近"), "next 不含最接近");
}

/* —— tie 1942 → 1948 —— */
{
	const triplet = evaluateReverseTriplet("rat", NOW - 1942, NOW);
	assert(triplet.target === 1942, "tie target 1942");
	assert(triplet.closestYear === 1948, "tie 選較新 1948");
	assert(triplet.previousYear === 1936, "tie previous 1936");
	assert(triplet.nextYear === 1960, "tie next 1960");
}

/* —— ±12 出界 null —— */
{
	const triplet = evaluateReverseTriplet("rat", 6, NOW);
	assert(triplet.closestYear === 2020, "rat+6 closest 2020");
	assert(triplet.nextYear === null, "2020+12 出界 → next null");
	assert(triplet.previousYear === 2008, "previous 2008 in range");

	const early = evaluateReverseTriplet("rat", 6, 1870);
	assert(early.closestYear === 1864, "injected nowYear 1870 closest 1864");
	assert(early.previousYear === null, "1864-12 出界 → previous null");
	assert(early.nextYear === null || early.nextYear === 1876, "1870 範圍 next 出界或恰界");
	assert(early.nextYear === null, "1876 > 1870 → next null");

	let state = { ...stateFromTyarQaFixture("reverse"), ageRaw: "6" };
	const before = state.reverseView;
	const blocked = setTyarReverseView(state, "next", OPT);
	assert(blocked.reverseView === before, "next 為 null 時不得進入 reverseView=next");
}

/* —— thenTaiwan lookup —— */
{
	assert(typeof lookupThenTaiwan(2009, "zh") === "string" && lookupThenTaiwan(2009, "zh").length > 0, "2009 有 thenTaiwan");
	assert(lookupThenTaiwan(2010, "zh") === null, "2010 thenTaiwan null");
	assert(lookupThenTaiwan(1861, "en") === null, "1861 thenTaiwan null");
	assert(lookupThenTaiwan(1930, "zh") === lookupThenTaiwan(1920, "zh"), "1930 與 1920 同桶");
}

/* —— state：空白切和曆＝令和；Reset／Year mode 回 closest —— */
{
	const switched = switchTyarCalendarMode(stateFromTyarQaFixture("initial"), "era", OPT);
	assert(switched.eraId === "reiwa" && switched.eraYearRaw === "", "空白切和曆預設令和");
	const yearMode = setTyarQueryMode(stateFromTyarQaFixture("reverse"), "year");
	assert(yearMode.queryMode === "year" && yearMode.reverseView === "closest" && yearMode.zodiacId === "", "切回 Year 清 Reverse");
}

/* —— 1862–1911 切民國：mode=minguo、raw 空、empty／Initial，非 invalid —— */
{
	function assertPre1912ToMinguo(fromState, label) {
		const switched = switchTyarCalendarMode(fromState, "minguo", OPT);
		assert(switched.calendarMode === "minguo", `${label} calendarMode minguo`);
		assert(switched.minguoRaw === "", `${label} minguoRaw empty`);
		assert(!/民國前|before Minguo/i.test(switched.minguoRaw), `${label} 不把民國前塞進 input`);
		const evaluation = evaluateTyarState(switched, OPT);
		assert(evaluation.status === "empty", `${label} evaluate empty（非 invalid）`);
		const zhOut = formatTaiwanYearAge(evaluation, "zh", zhCopy);
		assert(zhOut.primary === zhCopy.resultPlaceholder, `${label} Initial ?`);
	}

	assertPre1912ToMinguo(stateFromTyarQaFixture("gregorian-1895"), "1895 Gregorian→Minguo");
	assertPre1912ToMinguo({ ...stateFromTyarQaFixture("initial"), gregorianRaw: "1911" }, "1911 Gregorian→Minguo");
	assertPre1912ToMinguo(
		{ ...stateFromTyarQaFixture("initial"), calendarMode: "era", eraId: "meiji", eraYearRaw: "30" },
		"明治 30→Minguo",
	);

	const from1912 = switchTyarCalendarMode(
		{ ...stateFromTyarQaFixture("initial"), gregorianRaw: "1912" },
		"minguo",
		OPT,
	);
	assert(from1912.calendarMode === "minguo" && from1912.minguoRaw === "1", "1912 Gregorian→Minguo raw 1");
	assert(evaluateTyarState(from1912, OPT).status === "valid", "1912→Minguo 仍 valid");
}

/* —— QA fixture 走同一 evaluate —— */
{
	const mapped = reverse(evaluateTyarState(stateFromTyarQaFixture("reverse"), OPT));
	const manual = reverse(evaluateReverseLookup("rat", "90", "closest", OPT));
	assert(mapped.closestYear === manual.closestYear && mapped.previousYear === manual.previousYear, "fixture reverse = 真實 evaluate");
	assert(exact(evaluateTyarState(stateFromTyarQaFixture("year-1930"), OPT)).gregorianYear === 1930, "fixture year-1930");
	assert(exact(evaluateTyarState(stateFromTyarQaFixture("era-meiji-45"), OPT)).gregorianYear === 1912, "fixture era-meiji-45");
}

/* —— 今年 facts —— */
{
	const facts = buildYearFacts(NOW, NOW);
	assert(facts?.age === 0, "buildYearFacts 今年 age 0");
	assert(evaluateTaiwanYearAge({ mode: "gregorian", raw: String(NOW) }, OPT).status === "valid", "evaluate 今年 valid");
}

assert(TYAR_MIN_YEAR === 1862, "min year 1862");

console.log(`\npassed=${passed} failed=${failed}`);
if (failed > 0) {
	process.exitCode = 1;
} else {
	console.log("PASS");
}
