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
	resolveEnLunarDesktopRsComposition,
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
	classifyGregorianInvalid,
	createGregorianDateController,
} from "../src/lib/lunarDateConverterGregorianInput.ts";
import {
	applySegmentInputChange,
	emptyDateSegments,
	formatSegmentsDisplay,
	formatSegmentsNormalized,
	isEntryCompleteForAutoFocus,
	isSegmentsEmpty,
	normalizeSegmentsForBlur,
	segmentsFromPastedText,
} from "../src/lib/daysBetweenDatesDateInput.ts";
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
	const enLunarPortrait = deriveResultPresentation(civil, "gregorian", "en", {
		rsLayout: "portrait",
	});
	assert(enLunarPortrait.primaryText.includes("\n"), "EN lunar portrait uses two-line \\n");
	assert(!enLunarPortrait.primaryText.includes("·"), "EN lunar portrait omits middle dot");
	const enLunarLandscape = deriveResultPresentation(civil, "gregorian", "en", {
		rsLayout: "landscape",
	});
	assert(enLunarLandscape.primaryText.includes("·"), "EN lunar landscape keeps canonical dot line");
	const enLunarDesktopConstrained = deriveResultPresentation(civil, "gregorian", "en", {
		rsLayout: "desktop",
		rsComposition: "constrained",
	});
	assert(enLunarDesktopConstrained.primaryText.includes("\n"), "EN lunar desktop constrained uses \\n");
	assert(!enLunarDesktopConstrained.primaryText.includes("·"), "EN lunar desktop constrained omits dot");
	const enLunarDesktopWide = deriveResultPresentation(civil, "gregorian", "en", {
		rsLayout: "desktop",
		rsComposition: "wide",
	});
	assert(enLunarDesktopWide.primaryText.includes("·"), "EN lunar desktop wide keeps dot");
	assert(!enLunarDesktopWide.primaryText.includes("\n"), "EN lunar desktop wide single line");
	assert(
		resolveEnLunarDesktopRsComposition({ hostWidthPx: 400, textWidthPx: 420 }) === "constrained",
		"EN lunar desktop composition flips constrained when text wider than host",
	);
	assert(
		resolveEnLunarDesktopRsComposition({ hostWidthPx: 500, textWidthPx: 420 }) === "wide",
		"EN lunar desktop composition stays wide when text fits host",
	);

	const lunarInputEn = deriveResultPresentation(civil, "lunar", "en");
	assertEq(lunarInputEn.primaryText, "Aug 17, 2026", "Lunar input → EN Aug 17, 2026");

	const lunarInputZh = deriveResultPresentation(civil, "lunar", "zh");
	assert(lunarInputZh.primaryText.includes("2026"), "Lunar input → ZH Gregorian primary");
	assert(lunarInputZh.primaryText.includes("8"), "ZH Gregorian includes month");
	assert(lunarInputZh.primaryText.includes("\n"), "Lunar→Gregorian ZH uses deliberate two-line \\n");
	const zhGregLines = lunarInputZh.primaryText.split("\n");
	assertEq(zhGregLines.length, 2, "Lunar→Gregorian ZH exactly two lines");
	assert(zhGregLines[0]?.endsWith("年"), "ZH Gregorian line 1 ends with 年");
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

	/* Owner alias：潤 → 閏 at parse boundary；committed display never keeps 潤 */
	const aliasNum = evaluateLunarInput("1963潤4月15", { commit: true });
	assertEq(aliasNum.status, "valid", "1963潤4月15 accepted as leap alias");
	assertEq(aliasNum.lunar?.isLeapMonth, true, "1963潤4月15 is leap");
	assertEq(
		aliasNum.lunar,
		evaluateLunarInput("1963閏4月15", { commit: true }).lunar,
		"潤 alias matches 閏 parse",
	);
	assertEq(
		formatLunarInputDisplayForLocale(aliasNum.lunar, "zh"),
		"1963年閏四月十五",
		"潤 input commits as 閏 display",
	);
	assert(
		!formatLunarInputDisplayForLocale(aliasNum.lunar, "zh").includes("潤"),
		"committed ZH display never keeps 潤",
	);

	const aliasZh = evaluateLunarInput("1963潤四月15", { commit: true });
	assertEq(aliasZh.status, "valid", "1963潤四月15 accepted");
	assertEq(aliasZh.lunar?.isLeapMonth, true, "1963潤四月15 is leap");

	const aliasIncomplete = evaluateLunarInput("1963潤", { commit: true });
	assertEq(aliasIncomplete.status, "incomplete", "1963潤 incomplete (not typo-error)");
	assertEq(aliasIncomplete.errorCode, null, "1963潤 no error code");

	const aliasInvalidLeap = evaluateLunarInput("2023潤4月15", { commit: true });
	assertEq(aliasInvalidLeap.status, "invalid", "潤 + invalid leap year still invalid");
	assertEq(
		aliasInvalidLeap.errorCode,
		"invalid-leap-month",
		"潤 alias still uses invalid-leap-month (not unsupported-leap-typo)",
	);

	/* Owner compact leap：閏／潤 + digits，不強制「月」 */
	const compactLeap = evaluateLunarInput("1963閏415", { commit: true });
	assertEq(compactLeap.status, "valid", "1963閏415 valid leap");
	assertEq(
		compactLeap.lunar,
		{ year: 1963, month: 4, day: 15, isLeapMonth: true },
		"1963閏415 → leap 4/15",
	);
	assertEq(
		formatLunarInputDisplayForLocale(compactLeap.lunar, "zh"),
		"1963年閏四月十五",
		"1963閏415 commits as 閏 display",
	);

	const compactAlias = evaluateLunarInput("1963潤415", { commit: true });
	assertEq(compactAlias.status, "valid", "1963潤415 valid leap");
	assertEq(compactAlias.lunar, compactLeap.lunar, "1963潤415 matches 閏415");
	assertEq(
		formatLunarInputDisplayForLocale(compactAlias.lunar, "zh"),
		"1963年閏四月十五",
		"1963潤415 commits as 閏 display",
	);

	assertEq(
		evaluateLunarInput("1963閏", { commit: true }).status,
		"incomplete",
		"1963閏 incomplete",
	);
	assertEq(
		evaluateLunarInput("1963閏4", { commit: true }).status,
		"incomplete",
		"1963閏4 incomplete",
	);
	assertEq(
		evaluateLunarInput("1963潤4", { commit: true }).status,
		"incomplete",
		"1963潤4 incomplete",
	);

	const compactNoLeapYear = evaluateLunarInput("2024閏415", { commit: true });
	assertEq(compactNoLeapYear.status, "invalid", "2024閏415 invalid (no leap)");
	assertEq(
		compactNoLeapYear.errorCode,
		"invalid-leap-month",
		"2024閏415 → invalid-leap-month not unrecognized-format",
	);

	const compactWrongLeap = evaluateLunarInput("1963閏515", { commit: true });
	assertEq(compactWrongLeap.status, "invalid", "1963閏515 wrong leap month");
	assertEq(
		compactWrongLeap.errorCode,
		"invalid-leap-month",
		"1963閏515 → invalid-leap-month",
	);

	const compactBadDay = evaluateLunarInput("1963閏430", { commit: true });
	assertEq(compactBadDay.status, "invalid", "1963閏430 day out of range");
	assertEq(
		compactBadDay.errorCode,
		"invalid-lunar-day",
		"1963閏430 → invalid-lunar-day not unrecognized-format",
	);

	const compact = evaluateLunarInput("1980414", { commit: true });
	assertEq(compact.status, "valid", "compact 1980414 → regular 1980/4/14");
	assertEq(
		compact.lunar,
		{ year: 1980, month: 4, day: 14, isLeapMonth: false },
		"compact 1980414 never invents leap",
	);

	const ownerCompact = evaluateLunarInput("2024512", { commit: true });
	assertEq(ownerCompact.status, "valid", "Owner: 2024512 → 2024/5/12");
	assertEq(
		ownerCompact.lunar,
		{ year: 2024, month: 5, day: 12, isLeapMonth: false },
		"2024512 regular month",
	);

	const regularApril = evaluateLunarInput("19630415", { commit: true });
	assertEq(regularApril.status, "valid", "Owner: 19630415 → regular April 15");
	assertEq(regularApril.lunar?.isLeapMonth, false, "19630415 never invents leap");

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
	assert(enField.startsWith("Lunar "), "EN lunar field uses Lunar prefix");
	assert(enField.includes("2026"), "EN lunar field repopulate from actualCivil");
	assert(!/^\d{4}\/\d/.test(enField), "EN committed field is not bare Y/M/D");
	const zhField = formatLunarInputDisplayForLocale(lunar.value, "zh");
	assert(zhField.includes("年"), "ZH committed field includes 年");
	assert(zhField.includes("初五"), "ZH field repopulate uses Chinese day name (初五 for 7/5)");
	assert(!/\d+\/\d+\/\d+/.test(zhField), "ZH field must not look like Gregorian Y/M/D");
	assert(!/7\/5|7月5|月初5|月5日/.test(zhField), "ZH field must not use Arabic day digits");
	assertEq(
		formatLunarInputDisplayForLocale(
			{ year: 2023, month: 1, day: 1, isLeapMonth: false },
			"zh",
		),
		"2023年正月初一",
		"Owner ZH regular committed display",
	);
	assertEq(
		formatLunarInputDisplayForLocale(
			{ year: 1963, month: 4, day: 15, isLeapMonth: true },
			"zh",
		),
		"1963年閏四月十五",
		"Owner ZH leap committed display",
	);
	assertEq(
		formatLunarInputDisplayForLocale(
			{ year: 2023, month: 1, day: 1, isLeapMonth: false },
			"en",
		),
		"Lunar 2023/1/1",
		"Owner EN regular committed display",
	);
	assertEq(
		formatLunarInputDisplayForLocale(
			{ year: 1963, month: 4, day: 15, isLeapMonth: true },
			"en",
		),
		"Lunar 1963/Leap 4/15",
		"Owner EN leap committed display",
	);
	assertEq(
		evaluateLunarInput("2023年正月初一", { commit: true }).status,
		"valid",
		"Owner ZH regular re-parses",
	);
	assertEq(
		evaluateLunarInput("1963年閏四月十五", { commit: true }).lunar?.isLeapMonth,
		true,
		"Owner ZH leap re-parses with 閏",
	);
	assertEq(
		evaluateLunarInput("Lunar 2023/1/1", { commit: true }).status,
		"valid",
		"Owner EN regular re-parses",
	);
	assertEq(
		evaluateLunarInput("Lunar 1963/Leap 4/15", { commit: true }).lunar?.isLeapMonth,
		true,
		"Owner EN leap re-parses with Leap month segment",
	);
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
	assertEq(
		classifyGregorianInvalid({ year: "1986", month: "04", day: "71" }),
		"invalid-date",
		"Apr 71 → Pattern A invalid-date",
	);
	assertEq(
		classifyGregorianInvalid({ year: "1900", month: "01", day: "01" }),
		"out-of-range",
		"1900 → Pattern B out-of-range",
	);
}

/* -------------------------------------------------------------------------- */
/* Smart Date Input — canonical DBD engine via Lunar wrapper                   */
/* -------------------------------------------------------------------------- */
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

function assertTypedAndPasted(raw, expectedDisplay, label) {
	const typed = formatSegmentsDisplay(typeDigitsForward(emptyDateSegments(), raw));
	const pasted = formatSegmentsDisplay(segmentsFromPastedText(raw));
	assertEq(typed, expectedDisplay, `${label} typed`);
	assertEq(pasted, expectedDisplay, `${label} pasted`);
	assertEq(typed, pasted, `${label} typed/paste parity`);
}

{
	assertTypedAndPasted("20001111", "2000 / 11 / 11", "8-digit 20001111");
	assertTypedAndPasted("19991122", "1999 / 11 / 22", "8-digit 19991122");

	const mid6 = typeDigitsForward(emptyDateSegments(), "200011");
	assertEq(
		isEntryCompleteForAutoFocus(mid6) === false,
		true,
		"6-digit stream not complete while typing",
	);
	assertEq(formatSegmentsDisplay(mid6), "2000 / 11", "6-digit 200011 → month 11 waiting for day");
	assertEq(
		resolveFieldStatus(mid6) === "incomplete",
		true,
		"6-digit 200011 incomplete until day",
	);
	assertEq(
		formatSegmentsNormalized(normalizeSegmentsForBlur(mid6)),
		"2000 / 11",
		"6-digit blur keeps month-only incomplete",
	);
	const mid7 = typeDigitsForward(emptyDateSegments(), "2000111");
	assertEq(formatSegmentsDisplay(mid7), "2000 / 11 / 1", "7-digit 2000111 mid-stream display");
	assertEq(
		isEntryCompleteForAutoFocus(mid7) === false,
		true,
		"7-digit stream not complete while typing",
	);

	const controller = createGregorianDateController();
	let caret = 0;
	for (const ch of "20001111") {
		({ caret } = controller.applyInputChange("insertText", ch, caret, caret));
	}
	const typing = controller.getSnapshot();
	assertEq(typing.display, "2000 / 11 / 11", "controller typing 20001111 display");
	assertEq(typing.status, "valid", "controller typing 20001111 valid");
	const committed = controller.commitNormalize();
	assertEq(committed.normalizedDisplay, "2000 / 11 / 11", "controller blur normalize");

	controller.applyPaste("20001111");
	const pasted = controller.commitNormalize();
	assertEq(pasted.normalizedDisplay, "2000 / 11 / 11", "controller paste parity");
	controller.destroy();

	const clearController = createGregorianDateController();
	clearController.applyPaste("20001111");
	clearController.commitNormalize();
	const formatted = clearController.getSnapshot().normalizedDisplay;
	let backCaret = formatted.length;
	for (let i = 0; i < 30; i += 1) {
		const { snapshot, caret: nextCaret } = clearController.applyInputChange(
			"deleteContentBackward",
			null,
			backCaret,
			backCaret,
		);
		backCaret = nextCaret;
		if (isSegmentsEmpty(snapshot.segments)) {
			break;
		}
	}
	assertEq(isSegmentsEmpty(clearController.getSnapshot().segments), true, "backspace to empty");
	assertEq(clearController.getSnapshot().display, "", "backspace leaves empty display");
	const cleared = clearController.applyInputChange(
		"deleteContentBackward",
		null,
		0,
		formatted.length,
	);
	assertEq(cleared.snapshot.status, "empty", "full selection delete → empty");
	clearController.destroy();
}

/* -------------------------------------------------------------------------- */
/* Continuous raw stream — stale DOM caret (BDC production regression)        */
/* -------------------------------------------------------------------------- */
function typeViaControllerWithLag(controller, chars, lag) {
	for (const ch of chars) {
		const display = controller.getSnapshot().display;
		const domCaret = Math.max(0, display.length - lag);
		controller.applyInputChange("insertText", ch, domCaret, domCaret);
	}
	return controller.getSnapshot();
}

{
	const steps = [
		["1", "1"],
		["9", "19"],
		["0", "190"],
	];
	const stepCtrl = createGregorianDateController();
	for (const [ch, expected] of steps) {
		stepCtrl.applyInputChange("insertText", ch, 0, 0);
		assertEq(stepCtrl.getSnapshot().display, expected, `190 step ${ch} (stale dom caret 0)`);
		assertEq(
			stepCtrl.getSnapshot().segments.preferStream,
			true,
			`190 step ${ch} keeps preferStream`,
		);
	}
	stepCtrl.destroy();

	for (const lag of [0, 1, 2]) {
		const lagCtrl = createGregorianDateController();
		typeViaControllerWithLag(lagCtrl, "190", lag);
		assertEq(lagCtrl.getSnapshot().display, "190", `190 full lag ${lag}`);
		lagCtrl.destroy();

		const longCtrl = createGregorianDateController();
		typeViaControllerWithLag(longCtrl, "20001111", lag);
		assertEq(longCtrl.getSnapshot().display, "2000 / 11 / 11", `20001111 lag ${lag}`);
		longCtrl.destroy();

		const altCtrl = createGregorianDateController();
		typeViaControllerWithLag(altCtrl, "19991122", lag);
		assertEq(altCtrl.getSnapshot().display, "1999 / 11 / 22", `19991122 lag ${lag}`);
		altCtrl.destroy();
	}

	const segmentCtrl = createGregorianDateController();
	segmentCtrl.applyPaste("2000/11/11");
	segmentCtrl.commitNormalize();
	const monthStart = segmentCtrl.getSnapshot().display.indexOf("11");
	segmentCtrl.applyInputChange("deleteContentBackward", null, monthStart + 2, monthStart + 2);
	const edited = segmentCtrl.applyInputChange("insertText", "0", monthStart + 1, monthStart + 1);
	assertEq(
		edited.snapshot.display.includes("2000 / 10 / 11"),
		true,
		"segment middle-edit month after stream complete",
	);
	segmentCtrl.destroy();
}

/* -------------------------------------------------------------------------- */
/* UI contract snippets                                                        */
/* -------------------------------------------------------------------------- */
assert(/data-ldcv2-field-phase/.test(astro), "field phase attribute");
assert(/data-ldcv2-field-error-wrap/.test(astro), "inline field error wrap");
assert(/data-ldcv2-field-error-text/.test(astro), "inline field error text");
assert(/data-ldcv2-field-invalid/.test(astro), "invalid icon mark");
assert(/ldcv2-inline-error/.test(astro), "JEC-like inline error structure");
assert(!/248\s+113\s+113/.test(css), "no danger red field error color");
assert(/203\s+213\s+225/.test(css), "muted invalid icon color");
assert(/classifyGregorianInvalid/.test(script), "Gregorian invalid classification");
assert(/errorPresentationPattern/.test(script), "lunar error pattern classification");
assert(
	/segments\.preferStream[\s\S]*formatted\.length/.test(
		read("src/lib/lunarDateConverterGregorianInput.ts"),
	),
	"preferStream stale-caret guard in Gregorian controller",
);
{
	const beforeinputBlock = script.match(/addEventListener\("beforeinput"[\s\S]*?\n\t\}\);/);
	assert(beforeinputBlock, "beforeinput handler present");
	assert(
		!beforeinputBlock[0].includes("commitNormalize"),
		"beforeinput must not commitNormalize during typing",
	);
	assert(
		/if \(snapshot\.status === "valid" && snapshot\.date\) \{[\s\S]*actualCivil = snapshot\.date/.test(
			script,
		),
		"Gregorian complete valid writes actualCivil immediately",
	);
	assert(
		!/commitAttempt/.test(script),
		"Gregorian no longer gates commit on commitAttempt",
	);
}
assert(/ldcv2-date-input/.test(astro), "single primary field");
assert(!/ldcv2-lunar-year|ldcv2-lunar-month|ldcv2-lunar-day/.test(astro), "no lunar Y/M/D selectors");
assert(/aria-controls="ldc-sdc"/.test(astro), "calendar aria-controls matches idPrefix");
assert(/idPrefix="ldc-sdc"/.test(astro), "calendar idPrefix ldc-sdc");
assert(/LunarCalendar/.test(astro), "lunar calendar component in astro");
assert(/data-lunar-calendar/.test(read("src/components/tools/lunar-date-converter-v2/LunarCalendar.astro")), "lunar calendar root");
assert(/idPrefix="ldc-lc"/.test(astro), "lunar calendar idPrefix ldc-lc");
assert(/data-ldcv2-calendar-host-lunar/.test(astro), "lunar calendar host");
assert(/data-ldcv2-calendar-host-gregorian/.test(astro), "gregorian calendar host");
assert(/createLunarPickerAdapter/.test(script), "lunar picker adapter wired");
assert(/closeAllCalendars/.test(script), "close all calendars on mode switch");
assert(
	!/calendarToggle\.hidden = mode !== "gregorian"/.test(executableScript),
	"calendar toggle visible in lunar mode",
);
assert(
	exists("src/lib/lunarCalendarGrid.ts"),
	"lunar calendar grid helpers exist",
);
assert(
	exists("src/scripts/lunar-calendar-controller.ts"),
	"lunar calendar controller exists",
);
assert(
	!read("src/styles/tools/desktop-calendar.css").includes("ldc-lc"),
	"shared desktop-calendar.css untouched",
);
assert(
	!/gregorianToLunarFromDataset|lunarToGregorianFromDataset/.test(
		read("src/lib/lunar/index.ts"),
	),
	"dataset sentinel helpers not in public lunar/index API",
);
assert(
	/min-width:\s*768px/.test(css) &&
		/hover:\s*hover/.test(css) &&
		/max-width:\s*1200px/.test(css) &&
		/hover:\s*none/.test(css) &&
		!/tpf-desktop-controls/.test(css) &&
		!/max-width:\s*823px/.test(css),
	"canonical desktop + landscape gates; no tool-local TPF／≤823 workaround",
);
assert(
	!/\(max-width:\s*899px\)[^{]*\{[^}]*tpf-mobile-controls[^}]*display:\s*flex/s.test(
		css,
	),
	"no non-desktop TPF mobile force-show override",
);
assert(
	/POPOVER_BASE_WIDTH_PX|23\.5\s*\*\s*16/.test(
		read("src/scripts/lunar-calendar-controller.ts"),
	),
	"lunar calendar uses canonical width (no rect.width feedback)",
);
assert(
	/clearPositionVars/.test(read("src/scripts/lunar-calendar-controller.ts")),
	"lunar calendar clears position vars on close",
);
assert(
	/isDesktopInputComposition|onDesktopInputCompositionChange|compositionMedia/.test(
		script,
	),
	"leaving desktop input composition closes calendars",
);
assert(
	/DESKTOP_MQ|isDesktopInputComposition/.test(
		read("public/scripts/lunar-date-converter-layout-contract.js"),
	),
	"layout contract exposes desktop input composition gate",
);

/* -------------------------------------------------------------------------- */
/* B2E — unified bidirectional input contract（Owner corrective）              */
/* -------------------------------------------------------------------------- */
assert(
	!/commitAttempt/.test(executableScript),
	"B2E corrective: Gregorian commitAttempt gate removed",
);
assert(
	/createLunarNumericFieldController/.test(executableScript),
	"B2E corrective: Lunar numeric Smart Date controller wired",
);
assert(
	/syncDraftUnknownResult/.test(executableScript),
	"B2E corrective: incomplete／editing → Result ? helper",
);
assert(
	/if \(snapshot\.status === "valid" && snapshot\.date\) \{[\s\S]*actualCivil = snapshot\.date/.test(
		executableScript,
	),
	"B2E corrective: Gregorian complete valid updates actualCivil immediately",
);
assert(
	/commitLunarNumericSnapshot[\s\S]*if \(snapshot\.status === "valid" && snapshot\.lunar\) \{[\s\S]*actualCivil = civil/.test(
		executableScript,
	),
	"B2E corrective: Lunar numeric complete valid updates actualCivil immediately",
);
assert(
	/if \(evaluated\.status === "valid" && evaluated\.lunar\) \{[\s\S]*actualCivil = civil/.test(
		executableScript,
	),
	"B2E corrective: Lunar explicit-format complete valid updates actualCivil",
);
assert(
	/case "out-of-public-range":[\s\S]*case "invalid-leap-month":[\s\S]*case "invalid-lunar-day":[\s\S]*return "with-message"/.test(
		executableScript,
	),
	"B2E: Lunar Pattern B codes locked (range / leap / day)",
);
assert(
	!/evaluateLunarInput[\s\S]{0,200}unsupported-leap-typo/.test(
		read("src/lib/lunarDateConverterLunarInput.ts"),
	),
	"B2E: 潤 is alias — evaluate must not emit unsupported-leap-typo",
);
assert(
	/invalidKind === "out-of-range" \? "with-message" : "indicator-only"/.test(executableScript),
	"B2E: Gregorian Pattern A/B classification locked",
);
{
	const evalSrc = read("src/lib/lunarDateConverterEvaluate.ts");
	assert(
		/primaryText:\s*"\?"/.test(evalSrc) && /weekday:\s*null/.test(evalSrc),
		"B2E: invalid Result is ? with weekday null",
	);
}
{
	const compact = evaluateLunarInput("1980414", { commit: true });
	assertEq(compact.status, "valid", "B2E corrective: compact 1980414 supported as regular");
	assertEq(compact.lunar?.isLeapMonth, false, "B2E corrective: compact never invents leap");
	const ownerA = evaluateLunarInput("2024512", { commit: true });
	assertEq(ownerA.status, "valid", "B2E corrective: 2024512 valid");
	const ownerB = evaluateLunarInput("19630415", { commit: true });
	assertEq(ownerB.status, "valid", "B2E corrective: 19630415 valid regular");
	assertEq(ownerB.lunar?.isLeapMonth, false, "B2E corrective: 19630415 not leap");
}
assert(
	/normalizeField:\s*false/.test(executableScript) &&
		/normalizeField:\s*true/.test(executableScript),
	"B2E lifecycle: lunar normalizeField false while focused / true on blur",
);
assert(
	/expandLunarCommittedToEditingDisplay/.test(executableScript),
	"B2E lifecycle: focus expands committed semantic → numeric editing",
);
assert(
	/addEventListener\("focus"/.test(executableScript),
	"B2E lifecycle: focus listener present",
);
assert(
	/formatLunarInputDisplayForLocale\(lunar,\s*locale\)/.test(executableScript),
	"B2E committed-display: field uses formatLunarInputDisplayForLocale",
);
{
	const leapDisplay = formatLunarInputDisplayForLocale(
		{ year: 1963, month: 4, day: 15, isLeapMonth: true },
		"en",
	);
	assertEq(leapDisplay, "Lunar 1963/Leap 4/15", "B2E: EN leap committed = Lunar Y/Leap M/D");
	assert(!/\(leap\)/i.test(leapDisplay), "B2E: EN committed display does not use (leap) suffix");
	const reparse = evaluateLunarInput(leapDisplay, { commit: true });
	assertEq(reparse.status, "valid", "B2E: EN leap committed display re-parses");
	assertEq(reparse.lunar?.isLeapMonth, true, "B2E: EN Leap month segment parses as leap");
	const regularDisplay = formatLunarInputDisplayForLocale(
		{ year: 2023, month: 1, day: 1, isLeapMonth: false },
		"en",
	);
	assertEq(regularDisplay, "Lunar 2023/1/1", "B2E: EN regular committed = Lunar Y/M/D");
	assertEq(
		evaluateLunarInput(regularDisplay, { commit: true }).status,
		"valid",
		"B2E: EN regular committed re-parses",
	);
}
assert(
	/syncCommittedResult\(fieldPhase !== "committed-valid"\)/.test(executableScript),
	"B2E corrective: responsive refresh keeps Result ? for incomplete + invalid",
);
assert(
	!/syncCommittedResult\(fieldPhase === "draft-complete-invalid"\)/.test(executableScript),
	"B2E corrective: incomplete must not restore last committed Result on resize",
);
assertEq(
	resolveFieldStatus({ year: "2000", month: "02", day: "29" }),
	"valid",
	"B2E: Gregorian leap-day 2000-02-29 is valid field status",
);
assertEq(
	resolveFieldStatus({ year: "2023", month: "02", day: "29" }),
	"invalid",
	"B2E: non-leap Feb 29 is invalid field status",
);
assertEq(
	classifyGregorianInvalid({ year: "2023", month: "02", day: "29" }),
	"invalid-date",
	"B2E: non-leap Feb 29 → Pattern A invalid-date",
);
assertEq(
	classifyGregorianInvalid({ year: "2100", month: "01", day: "01" }),
	"out-of-range",
	"B2E: G 2100 → Pattern B out-of-range",
);
{
	const leapCivil = lunarToGregorian({
		year: 1963,
		month: 4,
		day: 15,
		isLeapMonth: true,
	});
	assert(leapCivil.ok, "B2E: leap lunar 1963-閏4-15 converts");
	if (leapCivil.ok) {
		const en = deriveResultPresentation(leapCivil.value, "gregorian", "en");
		const zh = deriveResultPresentation(leapCivil.value, "gregorian", "zh");
		assert(/leap|Lunar/i.test(en.primaryText), "B2E: EN leap Result mentions lunar");
		assert(zh.primaryText.includes("\n"), "B2E: ZH leap Result stays two-line");
		assert(zh.weekday != null, "B2E: ZH leap Result keeps weekday");
	}
}

/* -------------------------------------------------------------------------- */
/* Summary                                                                     */
/* -------------------------------------------------------------------------- */
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
	process.exit(1);
}
console.log("validate-lunar-converter-desktop PASS");
