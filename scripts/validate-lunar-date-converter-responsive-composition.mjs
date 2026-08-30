/**
 * Lunar Date Converter — Responsive Composition Contract validator (Batch 4).
 * Removes tool-local TPF／≤823 workaround; aligns with layout-system §6.0.3.
 *
 * Run: node scripts/validate-lunar-date-converter-responsive-composition.mjs
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

const LEGACY_823_LANDSCAPE =
	/@media[\s\S]*?max-width:\s*823px/;

console.log("validate-lunar-date-converter-responsive-composition\n");

const css = stripComments(read("src/styles/tools/lunar-date-converter-v2.css"));
const layoutJs = stripComments(
	read("public/scripts/lunar-date-converter-layout-contract.js"),
);
const astro = read(
	"src/components/tools/lunar-date-converter-v2/LunarDateConverterV2.astro",
);
const script = read("src/scripts/lunar-date-converter.ts");

/* —— Layout contract JS gates —— */
assert(
	layoutJs.includes('DESKTOP_MQ = "(min-width: 768px) and (hover: hover)"'),
	"Layout contract DESKTOP_MQ: min-width 768 + hover:hover",
);
assert(
	layoutJs.includes(
		"(orientation: landscape) and (max-height: 700px) and (max-width: 1200px) and (hover: none)",
	),
	"Layout contract LANDSCAPE_MQ includes hover: none + max-width 1200",
);
assert(
	!/900px\)\s+and\s*\(\s*min-height:\s*700px\s*\)\s+and\s*\(\s*hover:\s*hover\s*\)/.test(
		layoutJs,
	),
	"Layout contract does not use 900×700 as Desktop composition gate",
);
assert(
	!/max-width:\s*823px/.test(layoutJs) && !/DESKTOP_INPUT_MQ|PORTRAIT_MOBILE_MQ/.test(layoutJs),
	"Layout contract has no ≤823／DESKTOP_INPUT_MQ／PORTRAIT_MOBILE_MQ legacy gates",
);
assert(
	layoutJs.includes("resolveLayoutMode") &&
		layoutJs.includes("applyLayoutAttrs") &&
		layoutJs.includes("isDesktopInputComposition"),
	"Layout contract exposes resolveLayoutMode + applyLayoutAttrs + isDesktopInputComposition",
);

/* —— CSS Desktop continuity —— */
assert(
	css.includes("@media (min-width: 768px) and (hover: hover)"),
	"Lunar CSS Desktop continuity MQ: min-width 768 + hover:hover",
);
assert(
	/@media\s*\(\s*min-width:\s*768px\s*\)\s+and\s*\(\s*hover:\s*hover\s*\)/.test(css) &&
		css.includes(".ldcv2-input-cluster--desktop"),
	"Lunar Desktop continuity shows desktop input cluster",
);

/* —— Spacious Desktop gate remains separate —— */
assert(
	css.includes("@media (min-width: 900px) and (min-height: 700px) and (hover: hover)"),
	"Lunar Spacious Desktop gate (900×700+hover) remains for result cqi polish only",
);

/* —— Mobile Landscape full gate —— */
assert(MOBILE_LANDSCAPE_FULL.test(css), "Lunar Mobile Landscape gate includes hover: none");
assert(!BARE_LANDSCAPE_1200.test(css), "Lunar has no bare landscape+700+1200 rule");
assert(!LEGACY_823_LANDSCAPE.test(css), "Lunar CSS has no ≤823 landscape composition rule");

/* —— Mobile Default not bound to orientation: portrait only —— */
assert(
	/@media\s*\(\s*max-width:\s*767px\s*\)\s*\{/.test(css),
	"Lunar Mobile Default uses max-width 767 without orientation-only lock",
);
assert(
	!/@media\s*\(\s*max-width:\s*767px\s*\)\s+and\s*\(\s*orientation:\s*portrait\s*\)/.test(
		css,
	),
	"Lunar removed orientation:portrait-only Mobile Default gate",
);

/* —— Tool-local TPF workaround removed —— */
assert(
	!/\.tpf-desktop-controls|\.tpf-mobile-controls/.test(css),
	"Lunar CSS does not override .tpf-desktop-controls／.tpf-mobile-controls",
);
assert(
	!/反制 shared TPF|tool-local.*TPF|workaround/i.test(
		read("src/styles/tools/lunar-date-converter-v2.css"),
	),
	"Lunar CSS comments no longer describe TPF workaround",
);

/* —— Inline critical CSS aligned —— */
assert(
	MOBILE_LANDSCAPE_FULL.test(astro),
	"Lunar inline critical CSS Mobile Landscape includes hover: none",
);
assert(
	!BARE_LANDSCAPE_1200.test(stripComments(astro)),
	"Lunar inline critical CSS has no bare landscape+700+1200",
);
assert(
	!/max-width:\s*823px/.test(astro),
	"Lunar Astro has no ≤823 landscape composition gate",
);

/* —— Script cache bust + fallback MQs —— */
assert(
	/lunar-date-converter-layout-contract\.js\?v=ldc4/.test(astro),
	"Lunar layout contract script cache bust updated (ldc4)",
);
assert(
	/TimivaLunarDateConverterLayout/.test(script) &&
		script.includes("(min-width: 768px) and (hover: hover)") &&
		script.includes("DESKTOP_MQ") &&
		!script.includes("DESKTOP_INPUT_MQ") &&
		!script.includes("PORTRAIT_MOBILE_MQ"),
	"Lunar script composition listeners use canonical DESKTOP_MQ + LANDSCAPE_MQ",
);

console.log(`\nResult: ${passed} passed, ${failed} failed`);
if (failed > 0) {
	process.exit(1);
}
console.log("PASS");
