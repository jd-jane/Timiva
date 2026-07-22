/**
 * Date Range Calculator — landscape digit buckets + Calendar month/year nav
 * Desktop: Month/Year panels + nearby list
 * Mobile Portrait: title period trigger + back/year/3×4 month screen (no far-year entry)
 * Mobile Landscape: native type=date
 *
 * Run: node scripts/validate-date-range-digits-calendar-nav.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { computeRsDigits } from "../src/scripts/result-summary-controller.ts";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

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

function read(relPath) {
	return readFileSync(join(rootDir, relPath), "utf8");
}

function createLocalDate(year, monthIndex, day) {
	const date = new Date(2000, 0, 1, 12, 0, 0);
	date.setFullYear(year, monthIndex, day);
	return date;
}

function cloneDateOnly(date) {
	return createLocalDate(date.getFullYear(), date.getMonth(), date.getDate());
}

function countTotalDays(start, end) {
	const diff = cloneDateOnly(end).getTime() - cloneDateOnly(start).getTime();
	return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

function resolveResultDigitBucket(totalDays, workdays, weekends) {
	return computeRsDigits([totalDays, workdays, weekends]);
}

function parseCalendarYearInput(raw) {
	if (typeof raw !== "string" || !/^\d{4}$/.test(raw)) {
		return null;
	}
	const year = Number(raw);
	if (!Number.isInteger(year) || year < 1 || year > 9999) {
		return null;
	}
	return year;
}

const astro = read(
	"src/components/tools/date-range-calculator-v2/DateRangeCalculatorV2.astro"
);
const script = read("public/scripts/date-range.js");
const css = read("src/styles/tools/date-range-calculator-v2.css");
const rsCss = read("src/styles/tools/result-summary.css");

const portraitScreen = (() => {
	const start = astro.indexOf('data-drv2-portrait-period-screen');
	const end = astro.indexOf("data-drv2-calendar-clear");
	return start >= 0 && end > start ? astro.slice(start, end) : "";
})();

console.log("Date Range — digits + calendar nav validator\n");

/* Bounds withdrawn */
assert(
	!existsSync(join(rootDir, "scripts/validate-date-range-digits-desktop-nav.mjs")),
	"old desktop-nav validator must not exist"
);
assert(
	!/min\s*=\s*["']1900-01-01["']/.test(astro) &&
		!/max\s*=\s*["']2100-12-31["']/.test(astro),
	"no Timiva 1900/2100 min/max on inputs"
);
assert(
	!/MIN_SUPPORTED|isDateInSupportedRange|1900-01-01|2100-12-31/.test(script),
	"no withdrawn bounds helpers/ISO in script"
);

/* ResultSummary — Phase E cleanup complete */
assert(/import ResultSummary/.test(astro), "ResultSummary component imported");
assert(/\<ResultSummary/.test(astro), "ResultSummary rendered");
assert(/variant="standard"/.test(astro), "DRC uses standard variant");
assert(/key: "workdays"/.test(astro) && /key: "weekends"/.test(astro), "secondary keys");
assert(
	(astro.match(/\<ResultSummary\b/g) || []).length === 1,
	"exactly one ResultSummary in DRC astro",
);
assert(!/#stat-total|#stat-workdays|#stat-weekends/.test(astro), "legacy stat ids removed from DOM");
assert(!/data-drv2-result-digits/.test(astro), "root drv2 digit attr removed from astro");

assert(/rs:update/.test(script), "date-range.js dispatches rs:update");
assert(!/Phase E TODO/.test(script), "no temporary adapter TODO");
assert(!/dispatchResultSummaryUpdate/.test(script), "no temporary adapter function");
assert(!/data-rs-digits/.test(script), "DRC script does not write data-rs-digits");
assert(/syncResultSummaryLayout/.test(script), "layout gate syncs data-rs-layout");
assert(/mapResultSummaryLayout/.test(script), "landscape-date maps to landscape");
assert(!/function resolveResultDigitBucket/.test(script), "no local bucket ladder in script");
assert(!/syncResultDigitBucket/.test(script), "no syncResultDigitBucket in script");
assert(!/data-drv2-result-digits/.test(script), "script does not write drv2 digit attr");
assert(/initResultSummary/.test(astro), "shared controller init before date-range.js");
assert(script.includes('DR_JS_VERSION = "dr21"'), "dr21 script version");

/* Initial layout bootstrap — before first paint, shared contract with layout gate */
const contract = read("public/scripts/date-range-layout-contract.js");
assert(/TimivaDateRangeLayout/.test(contract), "layout contract exposes TimivaDateRangeLayout");
assert(
	contract.includes('"(min-width: 900px) and (min-height: 700px) and (hover: hover)"') &&
		contract.includes('"(orientation: landscape) and (max-height: 700px) and (max-width: 1200px)"'),
	"layout contract media queries match DRC gate",
);
assert(
	/layoutContract\?\.DESKTOP_MQ/.test(script) && /layoutContract\?\.resolveLayoutMode/.test(script),
	"date-range.js consumes layout contract for layout gate",
);
assert(
	/date-range-layout-contract\.js/.test(astro) &&
		!/<script[^>]*date-range-layout-contract[^>]*defer/.test(astro) &&
		!/<script[^>]*date-range-layout-contract[^>]*async/.test(astro),
	"layout contract loaded synchronously in astro",
);
assert(
	/TimivaDateRangeLayout\?\.applyLayoutAttrs\(document\)/.test(astro),
	"inline initial layout bootstrap after ResultSummary",
);
assert(
	!/(applyLayoutAttrs|Initial layout bootstrap)[\s\S]{0,400}rs:update/.test(astro + contract),
	"initial bootstrap does not dispatch rs:update",
);
assert(
	!/applyLayoutAttrs[\s\S]{0,300}data-rs-digits/.test(contract),
	"layout contract applyLayoutAttrs does not write data-rs-digits",
);
assert(
	!/applyLayoutAttrs[\s\S]{0,300}rs-status/.test(contract),
	"layout contract applyLayoutAttrs does not touch live region",
);

assert(
	/data-rs-layout="landscape"[\s\S]*grid-template-columns:\s*repeat\(3,\s*max-content\)/.test(
		rsCss,
	),
	"shared landscape 3-col max-content layout"
);
assert(
	/\[data-rs-layout="portrait"\]\[data-rs-digits="1-2"\][\s\S]*?\[data-rs-digits="3"\][\s\S]*?clamp\(7\.5rem,\s*38vw,\s*10\.5rem\)/.test(
		rsCss,
	),
	"shared portrait 1–3 uses BDC production clamp",
);
assert(
	/\[data-rs-layout="portrait"\]\[data-rs-digits="4"\][\s\S]*?clamp\(6\.5rem,\s*33vw,\s*9rem\)/.test(
		rsCss,
	) &&
		/\[data-rs-layout="portrait"\]\[data-rs-digits="5"\][\s\S]*?clamp\(5\.5rem,\s*27vw,\s*7rem\)/.test(
			rsCss,
		),
	"shared portrait 4／5 use BDC production clamps",
);
assert(
	/\[data-rs-layout="desktop"\]\[data-rs-variant="standard"\][\s\S]*?--rs-desktop-primary-size:\s*11rem/.test(
		rsCss,
	) &&
		!/--rs-desktop-primary-size-3/.test(rsCss),
	"shared desktop standard: 1–5 flat 11rem（no mid-bucket tokens）",
);
assert(
	/\[data-rs-layout="landscape"\][\s\S]*?--rs-landscape-number-size:\s*5rem/.test(rsCss) &&
		/\[data-rs-layout="landscape"\] \.rs-value[\s\S]*?overflow:\s*visible/.test(rsCss),
	"shared landscape 5rem ladder with overflow visible",
);
assert(
	!/\.rs-value[\s\S]{0,80}font-size:/.test(css) ||
		!/\[data-date-range-v2\][^{]*\.rs-/.test(css),
	"DRC tool CSS does not override .rs-* internals",
);
assert(/\.drv2-result-summary/.test(css), "DRC external placement hook for ResultSummary");
assert(!/preview-tool-result-number/.test(css), "no legacy preview-tool-result-number in DRC CSS");
assert(!/tool-result-secondary-number/.test(css), "no legacy tool-result-secondary-number in DRC CSS");
assert(!/data-drv2-result-digits/.test(css), "no data-drv2-result-digits rules in DRC CSS");
assert(!/tool-result--multi/.test(css), "no legacy tool-result--multi rules in DRC CSS");
assert(!/--drv2-portrait-main-number-size/.test(css), "no legacy portrait digit CSS vars");
assert(!/--drv2-landscape-result-number-size/.test(css), "no legacy landscape digit CSS vars");

/* Digit buckets — shared SSOT via controller */
assert(resolveResultDigitBucket(0, 0, 0) === "1-2", "zeros → 1-2");
assert(resolveResultDigitBucket(100, 100, 100) === "3", "3 digits → 3");
assert(resolveResultDigitBucket(100000, 1, 1) === "6+", "6+ bucket");

assert(
	/\[data-rs-layout="portrait"\]\[data-rs-digits="4"\]/.test(rsCss) &&
		/\[data-rs-layout="portrait"\]\[data-rs-digits="5"\]/.test(rsCss) &&
		/\[data-rs-layout="portrait"\]\[data-rs-digits="6\+"\]/.test(rsCss),
	"shared portrait digit buckets 4 / 5 / 6+"
);
assert(
	/\[data-result-summary\][\s\S]*overflow-x:\s*clip/.test(rsCss),
	"shared portrait overflow guard"
);
assert(
	/\[data-date-range-v2\] \.preview-tool-result-group[\s\S]*?padding-inline:\s*0\.75rem/.test(
		css,
	),
	"DRC portrait result-group padding-inline aligns BDC (0.75rem)",
);
assert(
	/\[data-date-range-v2\] \.date-range-page \.tool-hero-preview \.tool-hero-content[\s\S]*?padding-inline:\s*0/.test(
		css,
	),
	"DRC portrait tool-hero-content horizontal padding removed",
);
assert(
	/\.preview-tool-control-btn[\s\S]*?min-height:\s*var\(--tool-mobile-portrait-control-min-height\)/.test(
		css
	),
	"Portrait date button keeps fixed primary control height"
);

/* Desktop nav retained */
assert(
	/data-drv2-desktop-nav/.test(astro) &&
		/data-drv2-month-trigger/.test(astro) &&
		/data-drv2-year-trigger/.test(astro) &&
		/data-drv2-year-list/.test(astro),
	"Desktop Month/Year triggers + nearby list markup retained"
);
assert(
	/function setDesktopToolbarPanel/.test(script) &&
		/function renderNearbyYearList/.test(script) &&
		/isDesktopLayout/.test(script),
	"Desktop panel + nearby list logic retained"
);
assert(!/<select\b/i.test(astro), "no native select");

/* Portrait: title trigger + period screen (back / year / 3×4 months only) */
assert(
	/data-drv2-portrait-period-trigger/.test(astro) &&
		/data-drv2-portrait-period-label/.test(astro) &&
		/data-drv2-portrait-period-screen/.test(astro) &&
		/data-drv2-portrait-period-back/.test(astro),
	"Portrait title trigger + period screen + back"
);
assert(
	/data-drv2-portrait-prev-year/.test(astro) &&
		/data-drv2-portrait-next-year/.test(astro) &&
		/data-drv2-portrait-month-grid/.test(astro),
	"Portrait year steppers + 3×4 month grid"
);
assert(
	portraitScreen.includes("data-drv2-portrait-period-back") &&
		portraitScreen.includes("data-drv2-portrait-prev-year") &&
		portraitScreen.includes("data-drv2-portrait-next-year") &&
		portraitScreen.includes("data-drv2-portrait-month-grid") &&
		!/data-drv2-portrait-year-entry/.test(portraitScreen) &&
		!/data-drv2-portrait-year-input/.test(portraitScreen) &&
		!/year-list/.test(portraitScreen),
	"Portrait period screen only has back, year steppers, and month grid"
);
assert(
	!/data-drv2-portrait-year-entry-link/.test(astro) &&
		!/data-drv2-portrait-year-input/.test(astro) &&
		!/Enter another year|輸入其他年份/.test(astro),
	"Portrait has no far-year input/link markup"
);
assert(
	!/data-drv2-portrait-year-list/.test(astro),
	"Portrait has no nearby year list markup"
);
assert(
	/function openPortraitPeriodScreen/.test(script) &&
		/function closePortraitPeriodScreen/.test(script) &&
		/function applyPortraitMonth/.test(script) &&
		/function stepPortraitPickerYear/.test(script) &&
		/function syncPortraitChromeVisibility/.test(script) &&
		!/portraitYearEntryOpen/.test(script) &&
		!/setPortraitYearEntryOpen/.test(script) &&
		!/applyPortraitYearInputIfValid/.test(script),
	"Portrait period helpers exist; year-entry helpers removed"
);
assert(
	/portraitPeriodBack/.test(script) &&
		/calendarClearButtons/.test(script) &&
		/calendarToolbar\.hidden\s*=\s*period/.test(script) &&
		/prevMonthButton\.hidden\s*=\s*period/.test(script) &&
		/sheetFooter\.hidden\s*=\s*period/.test(script),
	"Portrait period mode hides toolbar, month arrows, Clear, and sheet footer"
);
assert(
	/\.drv2-portrait-month-grid\s*\{[\s\S]*?repeat\(3/.test(css),
	"Portrait month grid is 3 columns"
);
assert(
	/\.drv2-portrait-month-option-label/.test(css) &&
		/\.drv2-portrait-month-option\.is-selected\s+\.drv2-portrait-month-option-label/.test(
			css
		),
	"Selected month uses capsule/label highlight, not full-cell fill alone"
);
assert(
	/\.drv2-calendar-period-trigger[\s\S]*?background:\s*transparent/.test(css) &&
		!/\.drv2-calendar-period-trigger[\s\S]*?background-image:\s*linear-gradient/.test(
			css
		),
	"Portrait period trigger is title-like (no form/select chevron fill)"
);
assert(
	/data-range-layout=["']portrait["'][\s\S]*?overflow-y:\s*hidden/.test(css) ||
		/\[data-range-layout=["']portrait["']\][\s\S]*?\.range-sheet[\s\S]*?overflow-y:\s*hidden/.test(
			css
		),
	"Portrait sheet calendar avoids inner vertical scroll"
);
assert(
	/\.drv2-portrait-period-screen[\s\S]*?overflow:\s*hidden/.test(css) &&
		/\.drv2-portrait-month-grid[\s\S]*?overflow:\s*hidden/.test(css),
	"Portrait period screen/grid overflow hidden (no nested list scroll)"
);
assert(
	/calendar-panel\[data-drv2-toolbar-panel=["']portrait-period["']\][\s\S]*?\.calendar-toolbar/.test(
		css
	) &&
		/calendar-panel\[data-drv2-toolbar-panel=["']portrait-period["']\][\s\S]*?\.calendar-clear-btn/.test(
			css
		),
	"CSS hides date toolbar and Clear while Portrait period mode is open"
);

/* Mode isolation */
assert(
	/calendarQuickNav\.hidden\s*=\s*!desktop/.test(script) &&
		/portraitPeriodTrigger\.hidden\s*=\s*!portrait\s*\|\|\s*portraitPeriodOpen/.test(
			script
		),
	"Desktop nav vs Portrait trigger visibility split"
);
assert(
	/function closeRangeSheetFully[\s\S]*?closeAllCalendarNavPanels/.test(script),
	"Sheet close resets Portrait period screen"
);
assert(
	/function resetDateRangeLayoutOnModeChange[\s\S]*?closeRangeSheetFully/.test(
		script
	),
	"Portrait→Landscape layout change closes sheet/period mode"
);
assert(
	/id=["']range-landscape-start["']/.test(astro) && /type=["']date["']/.test(astro),
	"Landscape native date retained"
);

/* View/range separation */
const applyPortraitStart = script.indexOf("function applyPortraitMonth");
const applyPortraitEnd = script.indexOf("function applyDesktopYearInputIfValid");
const applyPortrait = script.slice(applyPortraitStart, applyPortraitEnd);
assert(
	applyPortraitStart >= 0 &&
		/viewMonth\s*=/.test(applyPortrait) &&
		/viewYear\s*=/.test(applyPortrait) &&
		!/rangeStart\s*=/.test(applyPortrait) &&
		!/rangeEnd\s*=/.test(applyPortrait) &&
		!/updateStats\(/.test(applyPortrait),
	"Portrait month apply only updates view (range state untouched)"
);

assert(parseCalendarYearInput("0001") === 1, "year 0001");
assert(parseCalendarYearInput("9999") === 9999, "year 9999");
assert(parseCalendarYearInput("0000") === null, "reject 0000");
assert(parseCalendarYearInput("999") === null, "reject 3 digits");

assert(
	countTotalDays(createLocalDate(2026, 0, 1), createLocalDate(2026, 0, 3)) === 3,
	"inclusive sample"
);

console.log(`\nPassed: ${passed}`);
console.log(`Failed: ${failed}`);
if (failed > 0) process.exit(1);
console.log("OK");
