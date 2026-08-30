/**
 * Date Range Calculator — Phase 3 Mobile Landscape ownership (static).
 *
 * Canonical: orientation:landscape + max-height:700 + max-width:1200 + hover:none
 *
 * Run: node scripts/validate-date-range-calculator-landscape-ownership.mjs
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

const LANDSCAPE_FULL =
	/orientation:\s*landscape[\s\S]*max-height:\s*700px[\s\S]*max-width:\s*1200px[\s\S]*hover:\s*none/;
const BARE_LANDSCAPE =
	/@media\s*\(\s*orientation:\s*landscape\s*\)\s*\{/;
const BARE_LANDSCAPE_1200 =
	/@media\s*\(\s*orientation:\s*landscape\s*\)\s+and\s*\(\s*max-height:\s*700px\s*\)\s+and\s*\(\s*max-width:\s*1200px\s*\)\s*\{/;

console.log("validate-date-range-calculator-landscape-ownership (Phase 3)\n");

const css = stripComments(read("src/styles/tools/date-range-calculator-v2.css"));
const legacyCss = stripComments(read("src/styles/tools/date-range.css"));
const layoutJs = stripComments(read("public/scripts/date-range-layout-contract.js"));
const script = read("public/scripts/date-range.js");
const astro = read(
	"src/components/tools/date-range-calculator-v2/DateRangeCalculatorV2.astro",
);

assert(
	layoutJs.includes(
		"(orientation: landscape) and (max-height: 700px) and (max-width: 1200px) and (hover: none)",
	),
	"Layout contract LANDSCAPE_MQ is the canonical Phase 3 gate",
);
assert(!BARE_LANDSCAPE.test(css) && !BARE_LANDSCAPE.test(legacyCss), "No bare orientation:landscape composition MQ");
assert(!BARE_LANDSCAPE_1200.test(css) && !BARE_LANDSCAPE_1200.test(legacyCss), "No bare landscape+700+1200 without hover:none");

const landscapeBlocks = mediaBlocks(css).filter((block) =>
	/orientation:\s*landscape/.test(block.query),
);
assert(
	landscapeBlocks.every((block) => /hover:\s*none/.test(block.query)),
	"Every v2 landscape MQ includes hover: none",
);

const canonical = landscapeBlocks.filter((block) =>
	/max-width:\s*1200px/.test(block.query) && /hover:\s*none/.test(block.query),
);
assert(canonical.length >= 1, "Canonical 1200+hover:none landscape block exists");
assert(
	canonical.some((block) =>
		/\.drc-desktop-sdc-host[\s\S]*display:\s*none/.test(block.body) &&
			/\[data-drv2-sheet-portal\][\s\S]*display:\s*none/.test(block.body) &&
			/\.preview-tool-control-btn/.test(block.body) &&
			/\.range-landscape-panel/.test(block.body),
	),
	"Canonical landscape hides SDC + MSB portal and owns compact CTA + panel",
);

const polish823 = landscapeBlocks.filter((block) => /max-width:\s*823px/.test(block.query));
assert(polish823.length === 1, "Exactly one ≤823 landscape polish block");
assert(
	polish823.every(
		(block) =>
			/hover:\s*none/.test(block.query) &&
			!/\.drc-desktop-sdc-host/.test(block.body) &&
			!/\[data-drv2-sheet-portal\]/.test(block.body) &&
			!/\.range-landscape-panel/.test(block.body) &&
			!/\.tool-desktop-cluster[\s\S]*display:/.test(block.body) &&
			!/\.preview-tool-controls[\s\S]*display:\s*(none|flex|block)/.test(block.body),
	),
	"≤823 landscape is CTA geometry polish only — does not switch owners",
);

const polish824 = mediaBlocks(css).filter((block) =>
	/min-width:\s*824px/.test(block.query) && /max-width:\s*899px/.test(block.query),
);
assert(
	polish824.every(
		(block) =>
			/hover:\s*none/.test(block.query) &&
			/orientation:\s*portrait/.test(block.query) &&
			!/\.drc-desktop-sdc-host/.test(block.body) &&
			!/\.range-landscape-panel/.test(block.body),
	),
	"824–899 remains portrait Mobile Default capsule polish only",
);

assert(
	/:not\(\[data-range-layout="landscape-date"\]\)[\s\S]*?\.range-landscape-panel/.test(css),
	"Landscape panel is CSS-hidden unless declared landscape-date",
);
assert(
	/id=["']range-landscape-panel["']/.test(astro) &&
		!/data-drv2-sheet-portal/.test(astro.split("range-landscape-panel")[0].slice(-80) || ""),
	"Landscape editor remains #range-landscape-panel (not MSB)",
);
assert(
	/lastLayoutMode !== "landscape-date"/.test(script) &&
		/closeCompactDatePanel\(\)/.test(script) &&
		/closeRangeSheetFully\(\)/.test(script),
	"Entering landscape closes MSB; leaving other modes closes panel via formal paths",
);
assert(
	!/@media\s*\(\s*max-width:\s*600px\s*\),\s*\(\(orientation:\s*landscape/.test(legacyCss),
	"Legacy CSS no longer ORs max-width 600 with landscape composition",
);
assert(LANDSCAPE_FULL.test(css) && LANDSCAPE_FULL.test(legacyCss), "v2 + legacy keep full landscape gate with hover:none");
assert(script.includes('DR_JS_VERSION = "dr-p3"'), "cache bust dr-p3");

if (failed > 0) {
	console.error(`\nFAILED: ${failed}  passed: ${passed}`);
	process.exit(1);
}

console.log(`PASSED: ${passed}`);
