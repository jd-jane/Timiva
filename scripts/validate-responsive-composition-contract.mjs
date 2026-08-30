/**
 * Responsive Composition Contract — shared foundation static validator.
 * Canonical: docs/standards/layout-system.md §6.0.3
 *
 * Foundation-level only（Batch 1）. Does not fail DR／BDC／Hours／JEC legacy
 * adopter CSS — those migrate in Batch 3.
 *
 * Run: node scripts/validate-responsive-composition-contract.mjs
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;

function read(relPath) {
	return readFileSync(join(root, relPath), "utf8");
}

function stripComments(css) {
	return css.replace(/\/\*[\s\S]*?\*\//g, "");
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

console.log("validate-responsive-composition-contract\n");

const frameCss = stripComments(read("src/styles/tools/tool-page-frame.css"));
const capsuleCss = stripComments(
	read("src/styles/tools/tool-primary-entry-capsule-baseline.css"),
);

/* —— Desktop continuity —— */
assert(
	frameCss.includes("@media (min-width: 768px) and (hover: hover)"),
	"TPF Desktop continuity MQ: min-width 768 + hover:hover",
);
assert(
	/@media\s*\(\s*min-width:\s*768px\s*\)\s+and\s*\(\s*hover:\s*hover\s*\)\s*\{[^}]*tpf-desktop-controls[^}]*display:\s*contents/s.test(
		frameCss,
	) ||
		(/@media\s*\(\s*min-width:\s*768px\s*\)\s+and\s*\(\s*hover:\s*hover\s*\)/.test(
			frameCss,
		) &&
			frameCss.includes(".tpf-desktop-controls") &&
			frameCss.includes("display: contents")),
	"TPF Desktop continuity shows desktop controls",
);
assert(
	/@media\s*\(\s*min-width:\s*768px\s*\)\s+and\s*\(\s*hover:\s*hover\s*\)/.test(
		frameCss,
	) && frameCss.includes(".tpf-mobile-controls"),
	"TPF Desktop continuity references mobile controls hide",
);

/* —— Spacious ≠ composition —— */
assert(
	frameCss.includes(
		"@media (min-width: 900px) and (min-height: 700px) and (hover: hover)",
	),
	"TPF Spacious Desktop gate (900×700+hover) remains separate",
);

/* —— Mobile Landscape full gate —— */
assert(
	MOBILE_LANDSCAPE_FULL.test(frameCss),
	"TPF Mobile Landscape gate includes hover: none",
);
assert(
	MOBILE_LANDSCAPE_FULL.test(capsuleCss),
	"Primary Capsule Mobile Landscape gate includes hover: none",
);
assert(
	!BARE_LANDSCAPE_1200.test(frameCss),
	"TPF has no bare landscape+700+1200 rule opening brace",
);
assert(
	!BARE_LANDSCAPE_1200.test(capsuleCss),
	"Capsule has no bare landscape+700+1200 rule opening brace",
);

/* —— Mobile Default not locked to orientation:portrait —— */
assert(
	/@media\s*\(\s*max-width:\s*767px\s*\)\s*\{/.test(frameCss) &&
		!/@media\s*\(\s*max-width:\s*767px\s*\)\s+and\s*\(\s*orientation:\s*portrait\s*\)/.test(
			frameCss,
		),
	"TPF Mobile Default uses max-width 767 without orientation:portrait lock",
);
assert(
	/\[data-tool-page-frame\]\s+\.tool-primary-entry-capsule\.preview-tool-control-btn\s*\{[^}]*min-height:\s*var\(--tool-mobile-portrait-control-min-height/s.test(
		capsuleCss,
	),
	"Primary Capsule provides Frame Default 56px geometry without portrait lock",
);

/* —— Compact geometry only under gated block (presence check) —— */
assert(
	frameCss.includes("min-height: 2rem") &&
		frameCss.includes("font-size: 0.75rem"),
	"TPF still defines landscape compact geometry tokens",
);
assert(
	capsuleCss.includes("min-height: 2rem") &&
		capsuleCss.includes("font-size: 0.75rem"),
	"Capsule still defines landscape compact geometry tokens",
);

/* —— Docs lock present —— */
const layoutDoc = read("docs/standards/layout-system.md");
assert(
	layoutDoc.includes("### 6.0.3 Responsive Composition Contract"),
	"layout-system §6.0.3 contract section exists",
);
assert(
	layoutDoc.includes("Mobile Default / Portrait-style"),
	"layout-system names Mobile Default / Portrait-style fallback",
);
assert(
	layoutDoc.includes("hover: none") || layoutDoc.includes("hover:none"),
	"layout-system requires hover: none for Mobile Landscape",
);

/* —— AME shared Full-screen triggers（presentation；≠ Page composition） —— */
const ameCss = stripComments(read("src/styles/tools/adaptive-mobile-editor.css"));
assert(
	MOBILE_LANDSCAPE_FULL.test(ameCss),
	"AME Full-screen Mobile Landscape gate includes hover: none",
);
assert(
	/\(\s*max-width:\s*767px\s*\)\s+and\s*\(\s*orientation:\s*landscape\s*\)\s+and\s*\(\s*max-height:\s*700px\s*\)\s+and\s*\(\s*hover:\s*hover\s*\)/.test(
		ameCss,
	),
	"AME Constrained Viewport Full-screen gate: max-width 767 + landscape + max-height 700 + hover: hover",
);
{
	const collapsed = ameCss.replace(/\s+/g, " ");
	assert(
		/@media \(orientation: landscape\) and \(max-height: 700px\) and \(max-width: 1200px\) and \(hover: none\), \(max-width: 767px\) and \(orientation: landscape\) and \(max-height: 700px\) and \(hover: hover\) \{/.test(
			collapsed,
		),
		"AME Full-screen A∨B share one @media presentation block",
	);
}
assert(
	!BARE_LANDSCAPE_1200.test(ameCss) &&
		!/@media\s*\(\s*orientation:\s*landscape\s*\)\s+and\s*\(\s*max-height:\s*700px\s*\)\s*\{/.test(
			ameCss,
		),
	"AME has no bare landscape+700 shell gate",
);
assert(
	layoutDoc.includes("AME Presentation Policy") ||
		layoutDoc.includes("Constrained Viewport Full-screen"),
	"layout-system documents AME Constrained Viewport / Presentation Policy",
);

console.log(`\nResult: ${passed} passed, ${failed} failed`);
if (failed > 0) {
	process.exitCode = 1;
} else {
	console.log("PASS");
}
