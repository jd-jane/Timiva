/**
 * Hours Calculator — Responsive Composition Contract validator (Batch 3A).
 * Canonical: docs/standards/layout-system.md §6.0.3
 *
 * Run: node scripts/validate-hours-calculator-responsive-composition.mjs
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

console.log("validate-hours-calculator-responsive-composition\n");

const css = stripComments(read("src/styles/tools/hours-calculator-v2.css"));
const layoutJs = stripComments(read("public/scripts/hours-calculator-layout-contract.js"));
const astro = read("src/components/tools/hours-calculator-v2/HoursCalculatorV2.astro");

/* —— Layout contract JS gates —— */
assert(
	layoutJs.includes('DESKTOP_MQ = "(min-width: 768px) and (hover: hover)"'),
	"Layout contract DESKTOP_MQ: min-width 768 + hover:hover",
);
assert(
	layoutJs.includes(
		'LANDSCAPE_MQ =\n\t\t"(orientation: landscape) and (max-height: 700px) and (max-width: 1200px) and (hover: none)"',
	) ||
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
	"Hours CSS Desktop continuity MQ: min-width 768 + hover:hover",
);
assert(
	/@media\s*\(\s*min-width:\s*768px\s*\)\s+and\s*\(\s*hover:\s*hover\s*\)/.test(css) &&
		css.includes(".hcv2-input-cluster--desktop") &&
		css.includes(".hcv2-mobile-controls"),
	"Hours Desktop continuity toggles desktop cluster + mobile controls",
);

/* —— General stage fluid 640；L2 landscape 32rem；not 768／900／height —— */
assert(
	/\[data-hours-calculator-v2\]\s+\.hcv2-tool-stage\.preview-tool-stage\s*\{[^}]*max-width:\s*640px/s.test(
		css,
	),
	"Hours general stage is fluid max-width 640px",
);
assert(
	!/max-w-md|md:max-w-lg/.test(astro),
	"Hours stage markup has no general 448／512 Tailwind tier",
);
assert(
	!/@media\s*\(\s*min-width:\s*900px\s*\)[^{]*\{[^}]*max-width:\s*640px/.test(css),
	"Hours must not gate stage 640px behind min-width 900",
);
assert(
	!/@media\s*\(\s*min-width:\s*900px\s*\)\s+and\s*\(\s*min-height:\s*700px\s*\)\s+and\s*\(\s*hover:\s*hover\s*\)\s*\{[^}]*max-width:\s*640px/.test(
		css,
	),
	"Hours must not couple stage 640px to min-height:700",
);
assert(
	/max-width:\s*min\(100%,\s*32rem\)/.test(css),
	"Hours Mobile Landscape compact stage cap is 32rem",
);

/* —— Mobile Landscape full gate —— */
assert(
	MOBILE_LANDSCAPE_FULL.test(css),
	"Hours Mobile Landscape gate includes hover: none",
);
assert(
	!BARE_LANDSCAPE_1200.test(css),
	"Hours has no bare landscape+700+1200 rule",
);
assert(
	/place-items:\s*center/.test(css) &&
		/grid-template-rows:\s*none/.test(css) &&
		/\.preview-tool-stage\s*\{[^}]*min-height:\s*0/s.test(css),
	"Hours Mobile Landscape overrides Default stage 100dvh／1fr recipe",
);

/* —— Mobile Default not bound to orientation: portrait only —— */
assert(
	/@media\s*\(\s*max-width:\s*767px\s*\)\s*\{/.test(css),
	"Hours Mobile Default uses max-width 767 without orientation-only lock",
);
assert(
	!/@media\s*\(\s*max-width:\s*767px\s*\)\s+and\s*\(\s*orientation:\s*portrait\s*\)/.test(
		css,
	),
	"Hours removed orientation:portrait-only Mobile Default gate",
);

/* —— Script cache bust —— */
assert(
	/hours-calculator-layout-contract\.js\?v=hc2/.test(astro),
	"Hours layout contract script cache bust updated",
);

/* —— hours-calculator.ts listens to contract MQs —— */
const script = read("src/scripts/hours-calculator.ts");
assert(
	/TimivaHoursCalculatorLayout/.test(script) &&
		/api\.DESKTOP_MQ/.test(script) &&
		/api\.LANDSCAPE_MQ/.test(script),
	"Hours script syncs layout attrs via contract DESKTOP_MQ + LANDSCAPE_MQ",
);

console.log(`\nResult: ${passed} passed, ${failed} failed`);
if (failed > 0) {
	process.exit(1);
}
console.log("PASS");
