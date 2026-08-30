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
	assertEq(
		resolveFieldStatus(mid6) === "valid",
		true,
		"6-digit 200011 temporarily valid but not entry-complete",
	);
	assertEq(
		formatSegmentsNormalized(normalizeSegmentsForBlur(mid6)),
		"2000 / 01 / 01",
		"6-digit blur normalize (must not apply during typing)",
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
		/if \(options\.commitAttempt\) \{[\s\S]*actualCivil = snapshot\.date/.test(script),
		"valid actualCivil only updates on commitAttempt",
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
/* Summary                                                                     */
/* -------------------------------------------------------------------------- */
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
	process.exit(1);
}
console.log("validate-lunar-converter-desktop PASS");
