/**
 * Date Calculator — Responsive Composition Contract validator (Batch 3B).
 * Canonical: docs/standards/layout-system.md §6.0.3
 *
 * Run: node scripts/validate-date-calculator-responsive-composition.mjs
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

const MOBILE_LANDSCAPE_FULL =
	/@media\s*\(\s*orientation:\s*landscape\s*\)\s+and\s*\(\s*max-height:\s*700px\s*\)\s+and\s*\(\s*max-width:\s*1200px\s*\)\s+and\s*\(\s*hover:\s*none\s*\)/;

const BARE_LANDSCAPE_1200 =
	/@media\s*\(\s*orientation:\s*landscape\s*\)\s+and\s*\(\s*max-height:\s*700px\s*\)\s+and\s*\(\s*max-width:\s*1200px\s*\)\s*\{/;

console.log("validate-date-calculator-responsive-composition\n");

const css = stripComments(read("src/styles/tools/date-calculator-v2.css"));
const layoutJs = stripComments(read("public/scripts/date-calculator-layout-contract.js"));
const astro = read("src/components/tools/date-calculator-v2/DateCalculatorV2.astro");

/* —— Layout contract JS gates —— */
assert(
	layoutJs.includes('DESKTOP_MQ = "(min-width: 768px) and (hover: hover)"'),
	"Layout contract DESKTOP_MQ: min-width 768 + hover:hover",
);
assert(
	layoutJs.includes(
		'(orientation: landscape) and (max-height: 700px) and (max-width: 1200px) and (hover: none)',
	),
	"Layout contract LANDSCAPE_MQ includes hover: none",
);
assert(
	!/900px\)\s+and\s*\(\s*min-height:\s*700px\s*\)\s+and\s*\(\s*hover:\s*hover\s*\)/.test(
		layoutJs,
	),
	"Layout contract does not use 900×700 as Desktop composition gate",
);
assert(
	layoutJs.includes("resolveLayoutMode") && layoutJs.includes("applyLayoutAttrs"),
	"Layout contract exposes resolveLayoutMode + applyLayoutAttrs",
);

/* —— CSS Desktop continuity —— */
assert(
	css.includes("@media (min-width: 768px) and (hover: hover)"),
	"DC CSS Desktop continuity MQ: min-width 768 + hover:hover",
);
assert(
	/@media\s*\(\s*min-width:\s*768px\s*\)\s+and\s*\(\s*hover:\s*hover\s*\)/.test(css) &&
		css.includes(".dcv2-input-cluster--desktop") &&
		css.includes(".dcv2-mobile-controls"),
	"DC Desktop continuity toggles desktop cluster + mobile controls",
);

/* —— Spacious Desktop gate remains separate —— */
assert(
	css.includes("@media (min-width: 900px) and (min-height: 700px) and (hover: hover)"),
	"DC Spacious Desktop gate (900×700+hover) remains for stage 640 only",
);

/* —— Mobile Landscape full gate —— */
assert(
	MOBILE_LANDSCAPE_FULL.test(css),
	"DC Mobile Landscape gate includes hover: none",
);
assert(
	!BARE_LANDSCAPE_1200.test(css),
	"DC has no bare landscape+700+1200 rule",
);

/* —— Mobile Default not bound to orientation: portrait only —— */
assert(
	/@media\s*\(\s*max-width:\s*767px\s*\)\s*\{/.test(css),
	"DC Mobile Default uses max-width 767 without orientation-only lock",
);
assert(
	!/@media\s*\(\s*max-width:\s*767px\s*\)\s+and\s*\(\s*orientation:\s*portrait\s*\)/.test(
		css,
	),
	"DC removed orientation:portrait-only Mobile Default gate",
);

/* —— 824–899 is capsule polish only, not composition switch —— */
assert(
	!/@media\s*\(\s*min-width:\s*824px\s*\)\s+and\s*\(\s*max-width:\s*899px\s*\)\s*\{[^}]*dcv2-input-cluster--desktop/s.test(
		css,
	),
	"DC 824–899 does not toggle desktop／mobile composition",
);

/* —— Script cache bust —— */
assert(
	/date-calculator-layout-contract\.js\?v=dc2/.test(astro),
	"DC layout contract script cache bust updated",
);

/* —— date-calculator.ts listens to contract MQs —— */
const script = read("src/scripts/date-calculator.ts");
assert(
	/TimivaDateCalculatorLayout/.test(script) &&
		(/DESKTOP_MQ/.test(script) || /api\.DESKTOP_MQ/.test(script)) &&
		(/LANDSCAPE_MQ/.test(script) || /api\.LANDSCAPE_MQ/.test(script)),
	"DC script syncs layout attrs via contract DESKTOP_MQ + LANDSCAPE_MQ",
);

console.log(`\nResult: ${passed} passed, ${failed} failed`);
if (failed > 0) {
	process.exit(1);
}
console.log("PASS");
