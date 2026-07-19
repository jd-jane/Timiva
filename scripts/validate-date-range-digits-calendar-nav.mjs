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
	const maxDigits = Math.max(
		String(Math.abs(totalDays)).length,
		String(Math.abs(workdays)).length,
		String(Math.abs(weekends)).length
	);
	if (maxDigits <= 2) return "1-2";
	if (maxDigits === 3) return "3";
	if (maxDigits === 4) return "4";
	if (maxDigits === 5) return "5";
	return "6+";
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

/* Digit buckets */
assert(/data-drv2-result-digits=["']1-2["']/.test(astro), "digit attr init");
assert(
	/function resolveResultDigitBucket/.test(script) &&
		script.includes('return "6+"'),
	"digit buckets exist"
);
assert(/repeat\(3,\s*minmax\(0,\s*1fr\)\)/.test(css), "landscape 3-col shrink");
assert(/--drv2-landscape-result-number-size:\s*5rem/.test(css), "1-2 keeps 5rem");
assert(
	/--drv2-landscape-result-number-size-3:\s*3\.5rem/.test(css) &&
		/\[data-drv2-result-digits=["']3["']\]/.test(css),
	"3-digit landscape size avoids clip"
);
assert(resolveResultDigitBucket(0, 0, 0) === "1-2", "zeros → 1-2");
assert(resolveResultDigitBucket(100, 100, 100) === "3", "3 digits → 3");
assert(resolveResultDigitBucket(100000, 1, 1) === "6+", "6+ bucket");

/* Portrait digit buckets — numbers only */
assert(
	/--drv2-portrait-main-number-size:/.test(css) &&
		/--drv2-portrait-secondary-number-size:/.test(css) &&
		/\[data-drv2-result-digits=["']4["']\][\s\S]*?--drv2-portrait-main-number-size:/.test(
			css
		) &&
		/\[data-drv2-result-digits=["']5["']\][\s\S]*?--drv2-portrait-main-number-size:/.test(
			css
		) &&
		/\[data-drv2-result-digits=["']6\+["']\][\s\S]*?--drv2-portrait-main-number-size:/.test(
			css
		),
	"Portrait digit bucket CSS variables for 4 / 5 / 6+"
);
assert(
	/\.preview-tool-result-number[\s\S]*?var\(--drv2-portrait-main-number-size\)/.test(
		css
	) &&
		/\.tool-result-secondary-number[\s\S]*?var\(--drv2-portrait-secondary-number-size\)/.test(
			css
		),
	"Portrait applies digit vars only to result numbers"
);
assert(
	/overflow-x:\s*clip/.test(css),
	"Portrait locks horizontal overflow to avoid page shrink"
);
assert(
	!/\[data-drv2-result-digits=["'](?:4|5|6\+)["']\][\s\S]{0,400}?\.preview-tool-control-btn[\s\S]{0,200}?font-size:/.test(
		css
	) &&
		!/\[data-drv2-result-digits=["'](?:4|5|6\+)["']\][\s\S]{0,400}?\.drv2-tool-name[\s\S]{0,120}?font-size:/.test(
			css
		) &&
		!/\[data-drv2-result-digits=["'](?:4|5|6\+)["']\][\s\S]{0,400}?\.preview-tool-result-label[\s\S]{0,120}?font-size:/.test(
			css
		),
	"Digit buckets do not resize button, tool name, or labels"
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
