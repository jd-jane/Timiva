/**
 * Lunar Date Converter — AME adopter validator（B2D Corrective）.
 *
 * Scope：sibling AME mount／live lifecycle／structured Year-Month-Day picker／
 * no text input／no native keyboard／no DesktopCalendar／leap-month options／day clamp.
 *
 * Run: node scripts/validate-lunar-date-converter-adopter.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
	applyLdcAmeGregorianChange,
	applyLdcAmeLunarChange,
	cloneLdcAmeDraft,
	draftFromCommitted,
	ldcAmeResetDraft,
	lunarDayOptions,
	lunarMonthOptions,
	lunarMonthValue,
	resolveLdcAmeDraft,
	switchLdcAmeDraft,
	validateLdcAmeDraft,
} from "../src/scripts/lunar-date-converter-ame-adapter.ts";
import { daysInLunarMonth, listLunarMonths } from "../src/lib/lunar/index.ts";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(rootDir, path), "utf8");
const exists = (path) => existsSync(join(rootDir, path));

const astro = read(
	"src/components/tools/lunar-date-converter-v2/LunarDateConverterV2.astro",
);
const script = read("src/scripts/lunar-date-converter.ts");
const adapter = read("src/scripts/lunar-date-converter-ame-adapter.ts");
const css = read("src/styles/tools/lunar-date-converter-v2.css");
const ctrl = read("src/scripts/adaptive-mobile-editor-controller.ts");
const convert = read("src/lib/lunar/lunarConvert.ts");

const stripComments = (source) =>
	source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

const executableScript = stripComments(script);
const executableAdapter = stripComments(adapter);
const ameSlot = astro.match(/<AdaptiveMobileEditor[\s\S]*?<\/AdaptiveMobileEditor>/)?.[0] ?? "";

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

console.log("validate-lunar-date-converter-adopter（B2D structured picker）\n");

assert(exists("src/scripts/lunar-date-converter-ame-adapter.ts"), "Lunar AME adapter tracked");
assert(astro.includes('import "../../../styles/tools/adaptive-mobile-editor.css"'), "Lunar imports shared AME CSS");
assert(astro.includes("AdaptiveMobileEditor"), "Lunar imports AdaptiveMobileEditor");
assert(
	(astro.match(/<AdaptiveMobileEditor/g) || []).length === 1,
	"Exactly one AdaptiveMobileEditor instance",
);
assert(/slot="ame"/.test(astro) && /id="ldcv2-ame"/.test(astro), "AME uses ToolPageFrame slot=ame");
assert(/data-ldcv2-sheet-trigger/.test(astro), "Mobile capsule is AME trigger");
assert(!/\bdisabled\b/.test(astro.match(/slot="mobilePrimaryControl"[\s\S]*?<\/button>/)[0]), "Capsule is enabled");
assert(/createAdaptiveMobileEditor/.test(script), "Script boots shared AME controller");
assert(/ameSessions/.test(script), "Single-session guard per tool root");
assert(!/document\.body\.appendChild/.test(executableScript), "No body portal append");
assert(
	!/msb-scroll-lock|MobileBottomSheet|mobile-bottom-sheet-controller/.test(astro + script),
	"No MSB runtime",
);
assert(!/\bvisualViewport\b/.test(executableScript + executableAdapter), "No visualViewport");
assert(!/localStorage/.test(executableScript + executableAdapter), "No LocalStorage");

assert(/lifecycle:\s*"live"/.test(script), "Lunar AME opts into lifecycle live");
assert(/applyLiveSyncFromDraft/.test(ctrl), "Live sync remains in shared AME controller");
assert(/onCommit/.test(script), "Live path writes page state via onCommit");
assert(
	/\[data-ame-lifecycle="live"\] \[data-ame-cancel\]/.test(css),
	"Live hides Cancel chrome",
);
assert(/ldcAmeResetDraft/.test(script + adapter), "Reset uses Lunar default draft");
assert(/data-ldcv2-ame-switch/.test(astro), "AME has direction switch");
assert(/data-ldcv2-ame-gregorian/.test(astro) && /data-ldcv2-ame-lunar/.test(astro), "Dual AME panels");
assert(/data-ldcv2-ame-picker="gregorian"/.test(astro), "Gregorian structured picker");
assert(/data-ldcv2-ame-picker="lunar"/.test(astro), "Lunar structured picker");
assert(/data-ldcv2-ame-g-year/.test(astro) && /data-ldcv2-ame-g-month/.test(astro) && /data-ldcv2-ame-g-day/.test(astro), "Gregorian Year／Month／Day selects");
assert(/data-ldcv2-ame-l-year/.test(astro) && /data-ldcv2-ame-l-month/.test(astro) && /data-ldcv2-ame-l-day/.test(astro), "Lunar Year／Month／Day selects");
assert(!/<input/.test(ameSlot), "AME content has no text input");
assert(!/inputmode/.test(ameSlot), "AME content has no inputmode");
assert(!/data-ldcv2-ame-calendar-toggle/.test(ameSlot), "AME has no calendar toggle");
assert(!/AmeFieldError/.test(ameSlot), "AME has no error-icon slot");
assert(!/data-ldcv2-ame-error/.test(ameSlot), "AME has no trailing error text slot");
assert(!/openAmeCalendar/.test(script), "AME does not open DesktopCalendar");
	const onOpen = script.match(/onOpen:\s*\(\)\s*=>\s*\{[\s\S]*?\},/);
	assert(Boolean(onOpen), "AME onOpen hook exists");
	assert(!/\.focus\(/.test(onOpen?.[0] ?? ""), "AME onOpen does not focus an input");
assert(
	!/gregorianToLunarFromDataset|lunarToGregorianFromDataset/.test(adapter),
	"Adapter does not fork dataset conversion helpers",
);
assert(
	/listLunarMonths/.test(adapter) && /daysInGregorianMonth/.test(adapter),
	"Adapter reuses existing month-length helpers",
);
assert(
	!css.includes(".ame-shell {") && !css.includes(".ame-underlay {"),
	"Lunar CSS does not fork AME shell chrome",
);
assert(
	/\[data-ame-root\] \.ame-portrait-header/.test(css),
	"Lunar hides portrait AME title header like JEC／DC",
);
assert(/grid-template-columns:\s*repeat\(3/.test(css), "Landscape picker is three columns");
assert(
	!/@media[\s\S]*ldcv2-ame-picker-row[\s\S]*flex-direction:\s*column/.test(css),
	"Landscape field rows stay Label-left／Value-right（not stacked）",
);
assert(/ldcv2-ame-picker-row:focus-within/.test(css), "Focus ring is on the field shell");
assert(
	/\.ame-native-control:focus-visible[\s\S]*outline:\s*none/.test(css),
	"Native select focus ring is neutralized",
);
const cssExecutable = stripComments(css);
const cssBeforeLandscape = cssExecutable.split(
	"@media (orientation: landscape) and (max-height: 700px) and (max-width: 1200px) and (hover: none)",
)[0];
assert(
	!/\[data-ldcv2-input-mode="lunar"\][\s\S]*?--rs-textual-primary-size:\s*clamp\(1\.5rem/.test(
		cssExecutable,
	),
	"No B2D lunar-input primary shrink clamp",
);
assert(
	/@media \(max-width: 767px\)[\s\S]*?\[data-ldcv2-locale="en"\][\s\S]*?white-space:\s*nowrap/.test(
		cssExecutable,
	),
	"EN portrait uses scoped nowrap only",
);
assert(
	/@media \(min-width: 768px\) and \(hover: hover\)[\s\S]*?\[data-ldcv2-input-mode="lunar"\][\s\S]*?white-space:\s*nowrap/.test(
		cssExecutable,
	),
	"ZH desktop gregorian result uses scoped nowrap only",
);
assert(
	/\[data-rs-layout="landscape"\][\s\S]*flex-direction:\s*column/.test(cssExecutable),
	"Landscape Result stacks primary above weekday",
);
assert(
	/\[data-ldcv2-input-mode="lunar"\][\s\S]*?--rs-textual-primary-size:\s*4\.125rem/.test(cssExecutable),
	"ZH Portrait Gregorian keeps 4.125rem",
);
assert(
	/\[data-ldcv2-input-mode="gregorian"\][\s\S]*?--rs-textual-primary-size:\s*3\.5rem/.test(cssExecutable),
	"ZH Portrait Lunar primary slightly reduced",
);
assert(
	/\[data-ldcv2-input-mode="lunar"\][\s\S]*?clamp\(2\.75rem,\s*18cqi,\s*4rem\)/.test(cssExecutable),
	"EN Portrait Gregorian uses balanced max clamp",
);
assert(
	/\[data-ldcv2-input-mode="gregorian"\][\s\S]*?clamp\(3\.125rem,\s*18cqi,\s*4\.125rem\)/.test(
		cssExecutable,
	),
	"EN Portrait Lunar two-line primary sizing",
);
assert(
	/\[data-rs-layout="portrait"\][\s\S]*?\[data-ldcv2-input-mode="gregorian"\][\s\S]*?white-space:\s*pre-line/.test(
		cssBeforeLandscape,
	),
	"EN Portrait Lunar primary uses portrait-scoped pre-line",
);
assert(/rsLayout/.test(script), "Result dispatch reads rs-layout for presentation");
assert(/rsComposition/.test(script), "Result dispatch reads rs-composition for EN desktop lunar");
assert(/data-ldcv2-rs-composition/.test(script), "Tool root stores EN desktop rs-composition marker");
assert(/resolveEnLunarDesktopRsComposition/.test(script), "Dispatch uses host-width composition resolver");
assert(/ResizeObserver/.test(script), "Result host ResizeObserver refreshes desktop composition");
assert(
	/\[data-ldcv2-rs-composition="constrained"\][\s\S]*white-space:\s*pre-line/.test(cssExecutable),
	"EN desktop constrained lunar uses deliberate pre-line",
);
assert(
	/\[data-ldcv2-rs-composition="wide"\][\s\S]*white-space:\s*nowrap/.test(cssExecutable),
	"EN desktop wide lunar uses nowrap single line",
);
assert(
	/\[data-ldcv2-input-mode="lunar"\][\s\S]*\[data-rs-layout="desktop"\][\s\S]*clamp\(4\.25rem,\s*13cqi,\s*5rem\)/.test(
		cssExecutable,
	),
	"EN desktop gregorian result has spacious primary bump",
);
assert(
	/\[data-rs-layout="landscape"\][\s\S]*\.rs-value\[data-rs-value="primary"\][\s\S]*white-space:\s*nowrap/.test(
		cssExecutable,
	),
	"Landscape primary uses nowrap single line",
);
assert(
	/\[data-rs-layout="landscape"\][\s\S]*--rs-textual-weekday-size:\s*clamp\(0\.9375rem,\s*2\.8vw,\s*1\.125rem\)/.test(
		cssExecutable,
	),
	"Landscape weekday uses shared RS clamp token",
);
assert(
	!/\[data-ldcv2-input-mode="lunar"\][\s\S]*?--rs-textual-primary-size:\s*clamp\(1\.5rem/.test(astro),
	"Astro inline has no B2D lunar-input shrink clamp",
);
assert(/numericFields:\s*\[\]/.test(script), "No Lunar-local keypad；empty numericFields");

/* —— Adapter behavior —— */
const todayDraft = ldcAmeResetDraft();
assert(todayDraft.mode === "gregorian" && todayDraft.gregorian.year >= 1901, "Reset draft is Gregorian today");
const switched = switchLdcAmeDraft(todayDraft, "lunar");
assert(switched.mode === "lunar" && switched.lunar.year >= 1900, "Switch to lunar converts current valid draft");
assert(switched.gregorian.year === todayDraft.gregorian.year, "Switch keeps Gregorian parts when converting");
const valid = validateLdcAmeDraft(todayDraft);
assert(valid.ok === true, "Today Gregorian draft validates");

const leapMonths = lunarMonthOptions(1963, "zh");
assert(
	leapMonths.some((option) => option.value === lunarMonthValue(4, false) && option.label === "四月"),
	"1963 lunar months include 四月",
);
assert(
	leapMonths.some((option) => option.value === lunarMonthValue(4, true) && option.label === "閏四月"),
	"1963 lunar months include 閏四月",
);
const leapDays = lunarDayOptions(1963, 4, true, "zh");
assert(
	leapDays.some((option) => option.value === "15" && option.label === "十五"),
	"1963 閏四月 includes 十五",
);

const leapDraft = applyLdcAmeLunarChange(ldcAmeResetDraft(), {
	year: 1963,
	month: 4,
	isLeapMonth: true,
	day: 15,
});
const leapResolved = resolveLdcAmeDraft({ ...leapDraft, mode: "lunar" });
assert(leapResolved.ok === true && leapResolved.civil.year === 1963, "Leap-month picker resolves via existing convert");

const jan31 = applyLdcAmeGregorianChange(ldcAmeResetDraft(), {
	year: 2023,
	month: 1,
	day: 31,
});
const febFromJan = applyLdcAmeGregorianChange(jan31, { month: 2 });
assert(febFromJan.gregorian.month === 2 && febFromJan.gregorian.day === 28, "Gregorian day clamps when month shrinks");

const leapFeb = applyLdcAmeGregorianChange(ldcAmeResetDraft(), {
	year: 2024,
	month: 2,
	day: 29,
});
assert(leapFeb.gregorian.day === 29, "Gregorian leap year keeps Feb 29");
const nonLeapFeb = applyLdcAmeGregorianChange(leapFeb, { year: 2023 });
assert(nonLeapFeb.gregorian.day === 28, "Feb 29 clamps to 28 in non-leap year");

const months1963 = listLunarMonths(1963) ?? [];
const shortMonth = months1963.find((item) => item.days === 29);
assert(Boolean(shortMonth), "1963 has a 29-day lunar month");
if (shortMonth) {
	const days = lunarDayOptions(1963, shortMonth.month, shortMonth.isLeapMonth, "zh");
	assert(
		days.length === 29 && !days.some((option) => option.value === "30"),
		"29-day lunar month has no Day 30 option",
	);
	assert(daysInLunarMonth(1963, shortMonth.month, shortMonth.isLeapMonth) === 29, "Day count matches dataset");
}

const cloned = cloneLdcAmeDraft(todayDraft);
assert(cloned.gregorian.year === todayDraft.gregorian.year && cloned !== todayDraft, "clone is a copy");
const fromCivil = draftFromCommitted({ year: 2026, month: 8, day: 17 }, "gregorian");
assert(fromCivil.gregorian.year === 2026 && fromCivil.gregorian.month === 8, "Committed Gregorian 2026 appears in draft");

assert(
	/createLunarCalendarAdapter/.test(script) && /createLunarPickerAdapter/.test(script),
	"Desktop calendar adapters remain wired",
);
assert(
	convert.includes("export function gregorianToLunar") &&
		convert.includes("export function lunarToGregorian"),
	"Conversion core exports unchanged",
);

console.log(`\nResult: ${passed} passed, ${failed} failed`);
if (failed > 0) {
	process.exit(1);
}
console.log("PASS");
