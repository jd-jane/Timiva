/**
 * Lunar Date Converter — Desktop interaction validator（B2B）.
 * Locks SSOT actualCivil, parser formats, ResultSummary derivation, mode switch contract.
 *
 * Run: node scripts/validate-lunar-converter-desktop.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
	deriveResultPresentation,
	formatEnGregorianPrimary,
	civilFromLunarInput,
} from "../src/lib/lunarDateConverterEvaluate.ts";
import {
	evaluateLunarInput,
	tryParseLunarStructure,
	formatLunarInputDisplayForLocale,
} from "../src/lib/lunarDateConverterLunarInput.ts";
import {
	MIN_GREGORIAN,
	MAX_GREGORIAN,
	parseDateSegments,
	resolveFieldStatus,
} from "../src/lib/lunarDateConverterGregorianInput.ts";
import { gregorianToLunar, lunarToGregorian } from "../src/lib/lunar/index.ts";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(rootDir, path), "utf8");
const exists = (path) => existsSync(join(rootDir, path));

const astro = read("src/components/tools/lunar-date-converter-v2/LunarDateConverterV2.astro");
const script = read("src/scripts/lunar-date-converter.ts");
const css = read("src/styles/tools/lunar-date-converter-v2.css");

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

function assertEq(actual, expected, message) {
	const ok = JSON.stringify(actual) === JSON.stringify(expected);
	assert(ok, `${message} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
}

console.log("validate-lunar-converter-desktop（B2B Desktop interaction）\n");

/* -------------------------------------------------------------------------- */
/* Foundation                                                                  */
/* -------------------------------------------------------------------------- */
assert(exists("src/lib/lunarDateConverterGregorianInput.ts"), "Gregorian input module tracked");
assert(exists("src/lib/lunarDateConverterLunarInput.ts"), "Lunar parser module tracked");
assert(exists("src/lib/lunarDateConverterEvaluate.ts"), "evaluate module tracked");
assert(exists("src/lib/lunarDateConverterCalendarAdapter.ts"), "calendar adapter tracked");
assert(exists("src/scripts/lunar-date-converter.ts"), "desktop script tracked");
assert(/deriveResultPresentation/.test(script), "script consumes deriveResultPresentation");
assert(/createGregorianDateController/.test(script), "script consumes Gregorian controller");
assert(/evaluateLunarInput/.test(script), "script consumes lunar parser");
assert(/createLunarCalendarAdapter/.test(script), "script consumes calendar adapter");
assert(/data-ldcv2-switch/.test(astro), "mode switch wired in Astro");
assert(/data-ldcv2-reset/.test(astro), "Reset wired in Astro");
assert(/DesktopCalendar/.test(astro), "Shared DesktopCalendar mounted");
assert(/data-ldcv2-calendar-host/.test(astro), "calendar host present");
assert(!/localStorage/.test(executableScript), "no LocalStorage");
assert(/420px/.test(css), "Standard 420px field declared in CSS");
assert(
	/data-ldcv2-input-mode/.test(astro + script),
	"input mode attribute on root",
);
assert(
	MIN_GREGORIAN.year === 1901 && MAX_GREGORIAN.year === 2099,
	"Gregorian public range 1901–2099",
);

/* -------------------------------------------------------------------------- */
/* EN Gregorian primary — Owner D6: Aug 17, 2026                              */
/* -------------------------------------------------------------------------- */
{
	const civil = { year: 2026, month: 8, day: 17 };
	assertEq(formatEnGregorianPrimary(civil), "Aug 17, 2026", "EN Aug 17, 2026 Intl format");

	const gregInputEn = deriveResultPresentation(civil, "gregorian", "en");
	assert(gregInputEn.primaryText.startsWith("Lunar"), "Gregorian input → EN lunar result");

	const lunarInputEn = deriveResultPresentation(civil, "lunar", "en");
	assertEq(lunarInputEn.primaryText, "Aug 17, 2026", "Lunar input → EN Aug 17, 2026");

	const lunarInputZh = deriveResultPresentation(civil, "lunar", "zh");
	assert(lunarInputZh.primaryText.includes("2026"), "Lunar input → ZH Gregorian primary");
	assert(lunarInputZh.primaryText.includes("8"), "ZH Gregorian includes month");
	assert(!lunarInputZh.primaryText.includes("\n"), "Lunar→Gregorian ZH is single line");
}

/* -------------------------------------------------------------------------- */
/* ZH lunar result — semantic two lines (Gregorian input mode)                */
/* -------------------------------------------------------------------------- */
{
	const civil = { year: 2026, month: 8, day: 17 };
	const zhLunarResult = deriveResultPresentation(civil, "gregorian", "zh");
	assert(zhLunarResult.primaryText.includes("\n"), "ZH lunar result uses two lines (\\n)");
	const lines = zhLunarResult.primaryText.split("\n");
	assertEq(lines.length, 2, "ZH lunar result exactly two lines");
	assert(lines[0].includes("農曆"), "first line is year stem-branch semantic");
	assert(zhLunarResult.weekday?.includes("星期") ?? false, "ZH weekday slot");
}

/* -------------------------------------------------------------------------- */
/* Invalid result → ?                                                         */
/* -------------------------------------------------------------------------- */
{
	const civil = { year: 2026, month: 8, day: 17 };
	const invalid = deriveResultPresentation(civil, "gregorian", "en", { invalid: true });
	assertEq(invalid.primaryText, "?", "invalid flag → ? primary");
	assertEq(invalid.weekday, null, "invalid clears weekday");
}

/* -------------------------------------------------------------------------- */
/* Lunar single-field parser — explicit formats only                          */
/* -------------------------------------------------------------------------- */
{
	const numeric = evaluateLunarInput("1980/4/14", { commit: true });
	assertEq(numeric.status, "valid", "1980/4/14 valid");
	assertEq(numeric.lunar, { year: 1980, month: 4, day: 14, isLeapMonth: false }, "1980/4/14 parse");

	const dashed = evaluateLunarInput("1980-4-14", { commit: true });
	assertEq(dashed.status, "valid", "1980-4-14 valid");

	const leapNum = evaluateLunarInput("1963閏4月15", { commit: true });
	assertEq(leapNum.status, "valid", "1963閏4月15 valid");
	assertEq(leapNum.lunar?.isLeapMonth, true, "1963閏4月15 is leap");

	const leapZh = evaluateLunarInput("1963閏四月15", { commit: true });
	assertEq(leapZh.status, "valid", "1963閏四月15 valid");

	const zhRegular = evaluateLunarInput("1980四月15日", { commit: true });
	assertEq(zhRegular.status, "valid", "1980四月15日 valid");

	const typo = evaluateLunarInput("1963潤4月15", { commit: true });
	assertEq(typo.status, "invalid", "潤 typo rejected on commit");
	assertEq(typo.errorCode, "unsupported-leap-typo", "潤 typo error code");

	const compact = evaluateLunarInput("1980414", { commit: true });
	assertEq(compact.status, "invalid", "compact 1980414 not supported");

	const incomplete = evaluateLunarInput("1980/4/", { commit: false });
	assertEq(incomplete.status, "incomplete", "incomplete draft no error");

	const outOfRange = evaluateLunarInput("2100/1/1", { commit: true });
	assertEq(outOfRange.status, "invalid", "2100 out of public range");

	const badDay = evaluateLunarInput("1980/4/31", { commit: true });
	assertEq(badDay.status, "invalid", "invalid lunar day rejected");
}

/* -------------------------------------------------------------------------- */
/* Round-trip via civilFromLunarInput                                           */
/* -------------------------------------------------------------------------- */
{
	const leap = tryParseLunarStructure("1963閏4月15");
	assert(leap !== null, "structural parse leap");
	const civil = civilFromLunarInput(leap);
	assert(civil !== null, "leap lunar converts to civil");
	const back = gregorianToLunar(civil);
	assert(back.ok && back.value.isLeapMonth === true, "round-trip preserves leap");
}

/* -------------------------------------------------------------------------- */
/* Mode switch SSOT — same actualCivil, opposite presentation                 */
/* -------------------------------------------------------------------------- */
{
	const civil = { year: 2026, month: 8, day: 17 };
	const gregMode = deriveResultPresentation(civil, "gregorian", "en");
	const lunarMode = deriveResultPresentation(civil, "lunar", "en");
	assert(gregMode.primaryText !== lunarMode.primaryText, "mode switch changes result text");
	assertEq(formatEnGregorianPrimary(civil), lunarMode.primaryText, "lunar mode EN = Aug 17, 2026");

	const lunar = gregorianToLunar(civil);
	assert(lunar.ok, "lunar for repopulate");
	const enField = formatLunarInputDisplayForLocale(lunar.value, "en");
	assert(enField.includes("2026"), "EN lunar field repopulate from actualCivil");
	const zhField = formatLunarInputDisplayForLocale(lunar.value, "zh");
	assert(zhField.includes("初五"), "ZH field repopulate uses Chinese day name (初五 for 7/5)");
	assert(!/7\/5|7月5|月初5|月5日/.test(zhField), "ZH field must not use Arabic day digits");
}

/* -------------------------------------------------------------------------- */
/* Gregorian segment engine range                                             */
/* -------------------------------------------------------------------------- */
{
	const valid = parseDateSegments({ year: "2026", month: "08", day: "17" });
	assertEq(valid, { year: 2026, month: 8, day: 17 }, "Gregorian segments parse");
	const low = resolveFieldStatus({ year: "1900", month: "01", day: "01" });
	assertEq(low, "invalid", "1900 below public range invalid when complete");
	const high = resolveFieldStatus({ year: "2100", month: "01", day: "01" });
	assertEq(high, "invalid", "2100 above public range invalid when complete");
}

/* -------------------------------------------------------------------------- */
/* UI contract snippets                                                        */
/* -------------------------------------------------------------------------- */
assert(/data-ldcv2-field-phase/.test(astro), "field phase attribute");
assert(/data-ldcv2-field-error/.test(astro), "field error element");
assert(/data-ldcv2-field-invalid/.test(astro), "invalid icon element");
assert(/ldcv2-date-input/.test(astro), "single primary field");
assert(!/ldcv2-lunar-year|ldcv2-lunar-month|ldcv2-lunar-day/.test(astro), "no lunar Y/M/D selectors");
assert(/aria-controls="ldc-sdc"/.test(astro), "calendar aria-controls matches idPrefix");
assert(/idPrefix="ldc-sdc"/.test(astro), "calendar idPrefix ldc-sdc");
assert(/\[data-desktop-calendar\]/.test(read("src/lib/lunarDateConverterCalendarAdapter.ts")), "adapter queries calendar root");

/* -------------------------------------------------------------------------- */
/* Summary                                                                     */
/* -------------------------------------------------------------------------- */
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
	process.exit(1);
}
console.log("validate-lunar-converter-desktop PASS");
