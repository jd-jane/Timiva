/**
 * Date Range Calculator — Phase 1 Composition + Input Ownership (static).
 * Canonical Desktop: min-width 768 + hover:hover
 * Canonical Mobile Landscape: landscape + max-height 700 + max-width 1200 + hover:none
 *
 * Run: node scripts/validate-date-range-calculator-responsive-composition.mjs
 *
 * Phase 1 only — does not assert Bottom Sheet chrome or landscape panel visuals.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(rootDir, path), "utf8");

function stripComments(source) {
	return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

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

function mediaBlocks(css) {
	const blocks = [];
	const re = /@media\s+/g;
	let match;
	while ((match = re.exec(css)) !== null) {
		const queryStart = match.index + match[0].length;
		let i = queryStart;
		let depth = 0;
		let queryEnd = -1;
		for (; i < css.length; i += 1) {
			if (css[i] === "{") {
				if (depth === 0) {
					queryEnd = i;
				}
				depth += 1;
			} else if (css[i] === "}") {
				depth -= 1;
				if (depth === 0) {
					blocks.push({
						query: css.slice(queryStart, queryEnd).trim(),
						body: css.slice(queryEnd + 1, i),
					});
					break;
				}
			}
		}
	}
	return blocks;
}

function braceBalance(css) {
	let n = 0;
	for (const ch of css) {
		if (ch === "{") n += 1;
		if (ch === "}") n -= 1;
		if (n < 0) return false;
	}
	return n === 0;
}

const MOBILE_LANDSCAPE_FULL =
	/@media\s*\(\s*orientation:\s*landscape\s*\)\s+and\s*\(\s*max-height:\s*700px\s*\)\s+and\s*\(\s*max-width:\s*1200px\s*\)\s+and\s*\(\s*hover:\s*none\s*\)/;

const BARE_LANDSCAPE_1200 =
	/@media\s*\(\s*orientation:\s*landscape\s*\)\s+and\s*\(\s*max-height:\s*700px\s*\)\s+and\s*\(\s*max-width:\s*1200px\s*\)\s*\{/;

const BARE_LANDSCAPE_823 =
	/@media\s*\(\s*orientation:\s*landscape\s*\)\s+and\s*\(\s*max-height:\s*700px\s*\)\s+and\s*\(\s*max-width:\s*823px\s*\)\s*\{/;

const LEGACY_899_OR =
	/@media\s*\(\s*max-width:\s*899px\s*\)\s*,\s*\(\s*max-height:\s*699px\s*\)\s*,\s*\(\s*hover:\s*none\s*\)/;

const PORTRAIT_ORIENTATION_OR =
	/@media\s*\(\s*orientation:\s*portrait\s*\)\s+and\s*\(\s*max-width:\s*899px\s*\)/;

console.log("validate-date-range-calculator-responsive-composition (Phase 1)\n");

const css = stripComments(read("src/styles/tools/date-range-calculator-v2.css"));
const legacyCss = stripComments(read("src/styles/tools/date-range.css"));
const layoutJs = stripComments(read("public/scripts/date-range-layout-contract.js"));
const script = read("public/scripts/date-range.js");
const astro = read(
	"src/components/tools/date-range-calculator-v2/DateRangeCalculatorV2.astro",
);

assert(braceBalance(css), "date-range-calculator-v2.css braces balanced");
assert(braceBalance(legacyCss), "date-range.css braces balanced");

/* —— Layout contract JS gates —— */
assert(
	layoutJs.includes('DESKTOP_MQ = "(min-width: 768px) and (hover: hover)"'),
	"Layout contract DESKTOP_MQ: min-width 768 + hover:hover",
);
assert(
	layoutJs.includes(
		"(orientation: landscape) and (max-height: 700px) and (max-width: 1200px) and (hover: none)",
	),
	"Layout contract LANDSCAPE_MQ includes hover: none",
);
assert(
	!/900px\)\s+and\s*\(\s*min-height:\s*700px\s*\)\s+and\s*\(\s*hover:\s*hover\s*\)/.test(
		layoutJs,
	),
	"Layout contract does not use 900×700 as Desktop composition gate",
);

/* —— JS runtime gates —— */
assert(
	script.includes("(min-width: 768px) and (hover: hover)") &&
		script.includes(
			"(orientation: landscape) and (max-height: 700px) and (max-width: 1200px) and (hover: none)",
		),
	"date-range.js fallbacks match canonical Desktop + Mobile Landscape",
);
assert(
	script.includes("syncEditorsToDesktopComposition") &&
		script.includes("closeRangeSheet()") &&
		script.includes("closeCompactDatePanel()"),
	"Desktop transition reuses formal sheet／panel close paths",
);
assert(script.includes('DR_JS_VERSION = "dr-msb2"'), "date-range.js cache bust dr-msb2");

/* —— CSS Desktop continuity —— */
assert(
	css.includes("@media (min-width: 768px) and (hover: hover)"),
	"DR CSS Desktop composition MQ: min-width 768 + hover:hover",
);
assert(
	/@media\s*\(\s*min-width:\s*768px\s*\)\s+and\s*\(\s*hover:\s*hover\s*\)[\s\S]*?\.drc-desktop-sdc-host[\s\S]*?display:\s*block/s.test(
		css,
	),
	"768+hover shows Shared DesktopCalendar host",
);
assert(
	/@media\s*\(\s*min-width:\s*768px\s*\)\s+and\s*\(\s*hover:\s*hover\s*\)[\s\S]*?\.preview-tool-controls[\s\S]*?display:\s*none/s.test(
		css,
	),
	"768+hover hides mobile／landscape trigger cluster",
);

const spaciousBlocks = mediaBlocks(css).filter((block) =>
	/min-width:\s*900px/.test(block.query),
);
assert(
	spaciousBlocks.every((block) => !/\.drc-desktop-sdc-host/.test(block.body)),
	"900×700 v2 blocks do not toggle SDC visibility",
);
assert(
	spaciousBlocks.every(
		(block) => !/\.preview-tool-controls[\s\S]*display:\s*(none|flex|block)/.test(block.body),
	),
	"900×700 v2 blocks do not toggle mobile trigger visibility",
);
assert(
	spaciousBlocks.every((block) => !/\.tool-desktop-cluster[\s\S]*display:/.test(block.body)),
	"900×700 v2 blocks do not toggle desktop cluster visibility",
);

/* —— Mobile Landscape full gate —— */
assert(MOBILE_LANDSCAPE_FULL.test(css), "DR Mobile Landscape gate includes hover: none");
assert(!BARE_LANDSCAPE_1200.test(css), "DR v2 has no bare landscape+700+1200 composition rule");
assert(
	!BARE_LANDSCAPE_823.test(css),
	"DR ≤823 landscape capsule polish includes hover: none",
);
assert(!LEGACY_899_OR.test(css), "DR v2 removed 899 OR-gate as composition owner");
assert(
	!PORTRAIT_ORIENTATION_OR.test(css),
	"DR v2 no longer uses orientation:portrait OR-gate as composition owner",
);
assert(
	/\[data-range-layout="portrait"\][\s\S]*?\.preview-tool-control-btn[\s\S]*?min-height:\s*var\(--tool-mobile-portrait-control-min-height\)/s.test(
		css,
	),
	"Mobile Default capsule geometry is owned by JS portrait layout attr",
);

/* —— Legacy date-range.css composition neutralization —— */
assert(
	!BARE_LANDSCAPE_1200.test(legacyCss),
	"legacy date-range.css landscape+700+1200 requires hover: none",
);
assert(
	/orientation:\s*landscape[\s\S]*hover:\s*none/.test(legacyCss),
	"legacy date-range.css landscape composition includes hover: none",
);

/* —— 824–899 is capsule polish only —— */
assert(
	/@media\s*\(\s*min-width:\s*824px\s*\)\s+and\s*\(\s*max-width:\s*899px\s*\)\s+and\s*\(\s*hover:\s*none\s*\)\s+and\s*\(\s*orientation:\s*portrait\s*\)/.test(
		css,
	),
	"824–899 polish scoped to portrait Mobile Default only",
);
assert(
	!/@media\s*\(\s*min-width:\s*824px\s*\)\s+and\s*\(\s*max-width:\s*899px\s*\)\s*\{[^}]*tool-desktop-cluster/s.test(
		css,
	),
	"824–899 does not toggle desktop cluster composition",
);

/* —— Markup / cache bust —— */
assert(
	/date-range-layout-contract\.js\?v=dr-msb2/.test(astro) &&
		/date-range\.js\?v=dr-msb2/.test(astro),
	"DR scripts cache-bust dr-msb2",
);
assert(
	/tool-input-card tool-date-card" aria-hidden="true"/.test(astro) ||
		/tool-input-card tool-date-card[\s\S]{0,80}aria-hidden="true"/.test(astro),
	"Decorative ghost date card is aria-hidden",
);
assert(
	script.includes("msb-scroll-lock") &&
		script.includes("initDrv2SheetPortal") &&
		/data-drv2-sheet-portal/.test(astro),
	"Phase 2: Mobile Default uses shared MSB portal + scroll lock",
);
assert(!/!important/.test(css), "Phase 1 v2 CSS does not use !important");

if (failed > 0) {
	console.error(`\nFAILED: ${failed}  passed: ${passed}`);
	process.exit(1);
}

console.log(`PASSED: ${passed}`);
