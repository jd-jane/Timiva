/**
 * Date Calculator B2.3 DesktopCalendar adapter validator.
 * Validates production component／adapter wiring without copying calendar logic.
 * Run: node scripts/validate-date-calculator-calendar.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DATE_CALCULATOR_CALENDAR_CONFIG } from "../src/lib/dateCalculatorCalendarAdapter.ts";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(rootDir, path), "utf8");

const astro = read(
	"src/components/tools/date-calculator-v2/DateCalculatorV2.astro",
);
const adapter = read("src/lib/dateCalculatorCalendarAdapter.ts");
const script = read("src/scripts/date-calculator.ts");
const css = read("src/styles/tools/date-calculator-v2.css");
const packageJson = read("package.json");
const stripComments = (source) =>
	source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
const executableAdapterAndScript = stripComments(adapter + script);
const cssWithoutComments = stripComments(css);

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

function count(source, pattern) {
	return [...source.matchAll(pattern)].length;
}

console.log("validate-date-calculator-calendar");

// Shared contract
assert(
	/import DesktopCalendar from "\.\.\/shared\/DesktopCalendar\.astro"/.test(
		astro,
	),
	"imports Shared DesktopCalendar",
);
assert(
	count(astro, /<DesktopCalendar\b/g) === 1,
	"mounts exactly one DesktopCalendar",
);
assert(
	/<DesktopCalendar[\s\S]*?variant="popover-compact"/.test(astro),
	"uses popover-compact variant",
);
assert(
	/idPrefix="dcv2-calendar-popover"/.test(astro),
	"uses unique idPrefix",
);
assert(
	DATE_CALCULATOR_CALENDAR_CONFIG.variant === "popover-compact",
	"adapter variant is popover-compact",
);
assert(
	DATE_CALCULATOR_CALENDAR_CONFIG.selectionMode === "single",
	"selection mode is single",
);
assert(
	DATE_CALCULATOR_CALENDAR_CONFIG.min.year === 1900 &&
		DATE_CALCULATOR_CALENDAR_CONFIG.min.month === 1 &&
		DATE_CALCULATOR_CALENDAR_CONFIG.min.day === 1,
	"minimum is 1900-01-01",
);
assert(
	DATE_CALCULATOR_CALENDAR_CONFIG.max.year === 2200 &&
		DATE_CALCULATOR_CALENDAR_CONFIG.max.month === 12 &&
		DATE_CALCULATOR_CALENDAR_CONFIG.max.day === 31,
	"maximum is 2200-12-31",
);
assert(
	DATE_CALCULATOR_CALENDAR_CONFIG.yearList.min === 1900 &&
		DATE_CALCULATOR_CALENDAR_CONFIG.yearList.max === 2200 &&
		DATE_CALCULATOR_CALENDAR_CONFIG.yearList.mode === "full",
	"full year list spans 1900–2200",
);
assert(
	/createDesktopCalendar\(\{/.test(adapter) &&
		/variant:\s*DATE_CALCULATOR_CALENDAR_CONFIG\.variant/.test(adapter),
	"thin adapter calls shared createDesktopCalendar",
);
assert(
	!/function renderMonth|function renderCalendar|createElement\(["']button["']\)/.test(
		adapter,
	),
	"adapter does not copy day／month／year rendering",
);
assert(
	!/<select\b/i.test(astro),
	"component does not add native month／year select",
);
assert(
	!/variant:\s*"(?!popover-compact|inline-large)[^"]+"/.test(adapter),
	"adapter does not add a third variant",
);

// Trigger and open lifecycle
assert(
	/data-dcv2-calendar-toggle[\s\S]{0,220}aria-haspopup="dialog"/.test(astro) ||
		/aria-haspopup="dialog"[\s\S]{0,220}data-dcv2-calendar-toggle/.test(astro),
	"calendar icon declares dialog popup",
);
assert(
	/aria-expanded="false"/.test(astro) &&
		/aria-controls="dcv2-calendar-popover"/.test(astro),
	"trigger has aria-expanded／aria-controls",
);
assert(
	!/data-dcv2-calendar-toggle[\s\S]{0,160}aria-disabled="true"/.test(astro),
	"calendar trigger is enabled",
);
assert(
	/trigger\.addEventListener\([\s\S]*?"click"/.test(adapter) &&
		/calendar\.isOpen\(\)[\s\S]*?calendar\.close\(\)[\s\S]*?calendar\.open\(\)/.test(
			adapter,
		),
	"icon click toggles shared calendar",
);
assert(
	!/(input|anchor)\.addEventListener\([\s\S]{0,40}"(click|focus)"[\s\S]{0,120}calendar\.open/.test(
		adapter + script,
	),
	"input click／focus does not open calendar",
);
assert(
	/calendarAdapters\.has\(root\)/.test(script) &&
		/boundRoots\.get\(root\)/.test(
			read("src/scripts/desktop-calendar-controller.ts"),
		),
	"tool and shared layers guard repeated initialization",
);
assert(
	/AbortController/.test(adapter) &&
		/unsubscribe\(\)/.test(adapter) &&
		/calendar\.destroy\(\)/.test(adapter),
	"destroy removes adapter listeners and shared controller",
);

// Empty／invalid／valid synchronization
assert(
	/getSelection:\s*\(\)\s*=>\s*\(\{[\s\S]*?start:\s*cloneDate\(dateSource\.getDate\(\)\)[\s\S]*?end:\s*null/.test(
		adapter,
	),
	"selection reads the current Smart Date state",
);
assert(
	/cloneDate\(date:\s*CivilDate\s*\|\s*null\)/.test(adapter) &&
		/return date \?/.test(adapter),
	"empty／invalid state maps to null selection",
);
assert(
	/onSelect:[\s\S]*?dateSource\.setDate\([\s\S]*?shouldClose:\s*true/.test(
		adapter,
	),
	"calendar selection writes through setDate and closes",
);
assert(
	/dateApi\.setDate\(date\)/.test(script) &&
		/controller\.setDate\(date\)/.test(script),
	"selection uses B2.2 controller setDate",
);
assert(
	/dateSource\.subscribe/.test(adapter) &&
		/calendar\.refresh\(\)/.test(adapter),
	"Smart Date changes refresh an open calendar",
);
assert(
	/getSelection[\s\S]*?dateSource\.getDate/.test(adapter) &&
		!/selectedDate\s*=/.test(adapter),
	"adapter has no stale selected-date cache",
);
assert(
	/getMinDate:[\s\S]*?DATE_CALCULATOR_CALENDAR_CONFIG\.min/.test(adapter) &&
		/getMaxDate:[\s\S]*?DATE_CALCULATOR_CALENDAR_CONFIG\.max/.test(adapter),
	"shared selectable bounds use 1900–2200 config",
);

// Shared close／focus／positioning contract
assert(
	/getTrigger:\s*\(\)\s*=>\s*trigger/.test(adapter),
	"shared controller owns focus return to trigger",
);
assert(
	/getPositionAnchor:\s*\(\)\s*=>\s*anchor/.test(adapter) &&
		/placement:\s*"right"/.test(adapter),
	"popover anchors near start field with right placement",
);
assert(
	/getAvoidRects:\s*config\.getAvoidRects/.test(adapter) &&
		/preview-tool-result-(block|group)/.test(script),
	"positioning avoids the result area",
);
assert(
	/resolvePopoverPosition:[\s\S]*?anchor\.getBoundingClientRect\(\)/.test(
		adapter,
	) &&
		/anchorRect\.right\s*\+\s*gap/.test(adapter) &&
		!/--sdc-pos-(left|top)|style\.transform/.test(
			executableAdapterAndScript + cssWithoutComments,
		),
	"public positioning contract places popover to the right of the start field",
);

// CSS ownership
assert(
	!/\.sdc(?:-|[\s\[{.:#])/.test(cssWithoutComments),
	"Date Calculator CSS has no .sdc-* internal selectors",
);
assert(
	/:not\(\[data-desktop-calendar\]\)/.test(css),
	"tool composition excludes shared fixed root from relative positioning",
);
assert(
	!/\[data-desktop-calendar\]\s+[^\{]+\{/.test(css),
	"tool CSS does not select DesktopCalendar descendants",
);

// Scope guards — calendar adapter stays math／Result free；script may wire B8 results
assert(
	!/calculateDate\(/.test(stripComments(adapter)),
	"calendar adapter does not call calculateDate",
);
assert(
	!/rs:update|ResultSummary|data-rs-value/.test(stripComments(adapter)),
	"calendar adapter does not update ResultSummary",
);
assert(
	!/data-dcv2-sheet-start|type="date"/.test(stripComments(adapter)),
	"calendar adapter does not bind Mobile native date",
);
assert(
	/createAdaptiveMobileEditor/.test(script) && /data-dcv2-ame-start/.test(astro),
	"B8 AME mobile native date stays outside calendar adapter",
);
assert(
	!/data-dcv2-duration|data-dcv2-sheet-duration/.test(stripComments(adapter)),
	"calendar adapter does not bind duration inputs",
);
assert(
	!/data-dcv2-direction/.test(stripComments(adapter)),
	"calendar adapter does not bind direction runtime",
);
assert(
	/initDirectionAndDuration/.test(script) &&
		!/initDirectionAndDuration/.test(adapter),
	"B2.5 direction／duration runtime stays outside the calendar adapter",
);
const packageData = JSON.parse(packageJson);
const dependencies = {
	...(packageData.dependencies ?? {}),
	...(packageData.devDependencies ?? {}),
};
assert(
	!["jsdom", "date-fns", "luxon", "dayjs"].some((name) => name in dependencies),
	"does not add calendar dependency",
);

console.log(`\nResult: ${passed} passed, ${failed} failed`);
if (failed > 0) {
	process.exitCode = 1;
	console.log("FAIL");
} else {
	console.log("PASS");
}
