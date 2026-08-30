/**
 * Date Range Calculator — Phase 2 Mobile Default MSB adoption (static).
 *
 * Run: node scripts/validate-date-range-calculator-mobile-sheet.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(rootDir, path), "utf8");

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

const astro = read(
	"src/components/tools/date-range-calculator-v2/DateRangeCalculatorV2.astro",
);
const script = read("public/scripts/date-range.js");
const css = read("src/styles/tools/date-range-calculator-v2.css");
const msbCss = read("src/styles/tools/tool-mobile-sheet-v2-baseline.css");

console.log("validate-date-range-calculator-mobile-sheet (Phase 2)\n");

assert(
	/tool-mobile-sheet-v2-baseline\.css/.test(astro),
	"DR component imports shared MSB baseline CSS",
);
assert(
	/data-drv2-sheet-portal/.test(astro) &&
		/data-mobile-sheet-baseline/.test(astro) &&
		/data-drv2-sheet-overlay/.test(astro) &&
		/data-drv2-sheet/.test(astro) &&
		/msb-sheet-handle/.test(astro) &&
		/msb-sheet-body/.test(astro) &&
		/msb-action-row/.test(astro),
	"DR portal uses production MSB shell structure",
);
assert(
	/id=["']range-sheet["']/.test(astro) &&
		/class=["'][^"']*msb-sheet[^"']*drv2-sheet/.test(astro),
	"range-sheet id preserved on msb-sheet root for aria-controls",
);
assert(
	!/#range-sheet-backdrop/.test(astro) &&
		!/range-sheet-backdrop/.test(astro) &&
		!/tool-bottom-sheet-content/.test(astro) &&
		!/tool-bottom-sheet-handle/.test(astro) &&
		!/tool-bottom-sheet-footer/.test(astro) &&
		!/clear-range-sheet-inline/.test(astro) &&
		!/calendar-card/.test(astro),
	"Legacy in-page portrait sheet chrome and double-wrapper removed",
);
assert(
	(astro.match(/data-drv2-sheet-clear/g) || []).length === 1,
	"Exactly one portrait Clear dates owner (msb-action-secondary)",
);
assert(
	(astro.match(/data-clear-dates/g) || []).length === 3,
	"Clear surfaces: desktop SDC + portrait sheet + landscape panel only",
);

assert(
	/function initDrv2SheetPortal/.test(script) &&
		/document\.body\.appendChild\(sheetPortal\)/.test(script),
	"Portal appended to document.body on init",
);
assert(
	script.includes("msb-scroll-lock") && script.includes("msb-sheet-open"),
	"Portrait sheet uses shared MSB scroll lock classes",
);
assert(
	!/document\.body\.style\.overflow\s*=\s*["']hidden["']/.test(script) &&
		!/document\.documentElement\.style\.overflow\s*=\s*["']hidden["']/.test(script),
	"Legacy inline overflow scroll lock removed from portrait sheet path",
);
assert(
	/\[data-drv2-sheet-clear\]/.test(script) &&
		!/data-drv2-calendar-clear/.test(script),
	"Portrait Clear wired through data-drv2-sheet-clear only",
);
assert(script.includes('DR_JS_VERSION = "dr-msb2"'), "date-range.js cache bust dr-msb2");

assert(
	/\[data-drv2-sheet-portal\][\s\S]*?\.msb-sheet-body[\s\S]*?overflow-y:\s*auto/.test(
		css,
	),
	"Single scroll owner: portal-scoped msb-sheet-body overflow-y auto",
);
assert(
	/\[data-drv2-sheet-portal\][\s\S]*?\.msb-sheet\.is-open[\s\S]*?overflow:\s*hidden/.test(
		css,
	),
	"MSB sheet shell does not scroll; body owns overflow",
);
assert(
	!/@media[\s\S]{0,1200}\.range-sheet\.tool-bottom-sheet/.test(css),
	"Legacy .range-sheet.tool-bottom-sheet presentation CSS removed from v2",
);
assert(
	/@media \(min-width: 768px\) and \(hover: hover\)[\s\S]*?\[data-drv2-sheet-portal\][\s\S]*?display:\s*none/.test(
		css,
	),
	"Desktop hides MSB portal",
);
assert(
	msbCss.includes("[data-mobile-sheet-baseline] .msb-sheet-body") &&
		msbCss.includes("[data-mobile-sheet-baseline] .msb-action-row"),
	"Shared baseline defines body scroll + action row shell",
);

assert(
	/:is\(\[data-date-range-v2\], \[data-drv2-sheet-portal\]\) \.drv2-portrait-month-grid[\s\S]*?repeat\(3/.test(
		css,
	),
	"Portrait month grid styles apply inside MSB portal (not only [data-date-range-v2])",
);
assert(
	/\[data-drv2-sheet-portal\][\s\S]*?\.calendar-panel[\s\S]*?padding:\s*0[\s\S]*?border:\s*0[\s\S]*?background:\s*transparent/.test(
		css,
	),
	"Portal calendar-panel has no inner card chrome (padding/border/background)",
);
assert(
	!/\[data-date-range-v2\] \[data-drv2-sheet-portal\] \.calendar-panel/.test(css),
	"No dead ancestor coupling [data-date-range-v2] [data-drv2-sheet-portal] .calendar-panel",
);
assert(
	/\[data-drv2-sheet-portal\][\s\S]*?\.msb-sheet-body[\s\S]*?padding-block:\s*0/.test(css),
	"MSB body has no extra inner padding around calendar",
);

assert(
	/date-range-layout-contract\.js\?v=dr-msb2/.test(astro) &&
		/date-range\.js\?v=dr-msb2/.test(astro),
	"Astro cache bust dr-msb2",
);

if (failed > 0) {
	console.error(`\nFAILED: ${failed}  passed: ${passed}`);
	process.exit(1);
}

console.log(`PASSED: ${passed}`);
