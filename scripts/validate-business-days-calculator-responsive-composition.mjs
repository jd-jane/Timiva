/**
 * Business Days Calculator — Responsive Composition Contract validator (Batch 3D).
 * Canonical: docs/standards/layout-system.md §6.0.3
 *
 * Run: node scripts/validate-business-days-calculator-responsive-composition.mjs
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

const BARE_LANDSCAPE_823 =
	/@media\s*\(\s*orientation:\s*landscape\s*\)\s+and\s*\(\s*max-height:\s*700px\s*\)\s+and\s*\(\s*max-width:\s*823px\s*\)\s*\{/;

console.log("validate-business-days-calculator-responsive-composition\n");

const css = stripComments(read("src/styles/tools/business-days-calculator-v2.css"));
const layoutJs = stripComments(read("public/scripts/business-days-layout-contract.js"));
const astro = read(
	"src/components/tools/business-days-calculator-v2/BusinessDaysCalculatorV2.astro",
);
const script = read("src/scripts/business-days-calculator.ts");

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
assert(
	layoutJs.includes("resolveLayoutMode") && layoutJs.includes("applyLayoutAttrs"),
	"Layout contract exposes resolveLayoutMode + applyLayoutAttrs",
);

/* —— CSS Desktop continuity —— */
assert(
	css.includes("@media (min-width: 768px) and (hover: hover)"),
	"BDC CSS Desktop continuity MQ: min-width 768 + hover:hover",
);
assert(
	/@media\s*\(\s*min-width:\s*768px\s*\)\s+and\s*\(\s*hover:\s*hover\s*\)/.test(css) &&
		css.includes(".bdcv2-input-cluster--desktop") &&
		css.includes(".bdcv2-mobile-controls"),
	"BDC Desktop continuity toggles desktop cluster + mobile controls",
);

/* —— Mobile Landscape full gate —— */
assert(
	MOBILE_LANDSCAPE_FULL.test(css),
	"BDC Mobile Landscape gate includes hover: none",
);
assert(!BARE_LANDSCAPE_1200.test(css), "BDC has no bare landscape+700+1200 rule");
assert(
	!BARE_LANDSCAPE_823.test(css),
	"BDC legacy ≤823 capsule polish includes hover: none",
);
assert(
	/\.preview-tool-stage\s*\{[^}]*min-height:\s*0[^}]*height:\s*100%/s.test(css),
	"BDC Mobile Landscape overrides Default stage min-height 100dvh",
);
assert(
	/\.bdcv2-mobile-capsule\s*\{[^}]*min-height:\s*2rem[^}]*padding:\s*0\.375rem\s+1rem[^}]*font-size:\s*0\.75rem/s.test(
		css,
	),
	"BDC Mobile Landscape declares compact CTA that beats Default／824–899",
);

/* —— Mobile Default not bound to orientation: portrait only —— */
assert(
	/@media\s*\(\s*max-width:\s*767px\s*\)\s*\{/.test(css),
	"BDC Mobile Default uses max-width 767 without orientation-only lock",
);
assert(
	!/@media\s*\(\s*max-width:\s*767px\s*\)\s+and\s*\(\s*orientation:\s*portrait\s*\)\s*\{[^}]*preview-tool-first-screen/s.test(
		css,
	),
	"BDC first-screen Default gate is not orientation:portrait-only",
);
assert(
	/@media\s*\(\s*max-width:\s*767px\s*\)\s+and\s*\(\s*orientation:\s*portrait\s*\)/.test(css),
	"BDC may keep portrait-only for legacy sheet portal chrome（not composition）",
);

/* —— 824–899 is capsule polish only —— */
assert(
	!/@media\s*\(\s*min-width:\s*824px\s*\)\s+and\s*\(\s*max-width:\s*899px\s*\)\s*\{[^}]*bdcv2-input-cluster--desktop/s.test(
		css,
	),
	"BDC 824–899 does not toggle desktop／mobile composition",
);

/* —— Script cache bust + TS fallbacks —— */
assert(
	/business-days-layout-contract\.js\?v=bdc3d/.test(astro),
	"BDC layout contract script cache bust updated",
);
assert(
	/TimivaBusinessDaysLayout/.test(script) &&
		script.includes('(min-width: 768px) and (hover: hover)') &&
		script.includes("hover: none"),
	"BDC script fallbacks match contract DESKTOP_MQ + LANDSCAPE_MQ",
);
assert(
	script.includes("syncSheetToDesktopComposition") &&
		script.includes("closeSheet()") &&
		/isDesktop\s*&&\s*isSheetOpen/.test(script),
	"BDC closes MSB via formal path when Desktop composition matches",
);

/* —— Shared MSB baseline landscape gate（Batch 3D corrective） —— */
const msbCss = stripComments(read("src/styles/tools/tool-mobile-sheet-v2-baseline.css"));
assert(
	MOBILE_LANDSCAPE_FULL.test(msbCss),
	"Shared MSB baseline landscape gate includes hover: none",
);
assert(
	!BARE_LANDSCAPE_1200.test(msbCss),
	"Shared MSB baseline has no bare landscape+700+1200 rule",
);

console.log(`\nResult: ${passed} passed, ${failed} failed`);
if (failed > 0) {
	process.exit(1);
}
console.log("PASS");
