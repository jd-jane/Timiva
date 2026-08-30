/**
 * Primary Entry Capsule baseline contract validator.
 * Run: node scripts/validate-primary-entry-capsule-baseline.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;

function read(relPath) {
	return readFileSync(join(root, relPath), "utf8");
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

console.log("validate-primary-entry-capsule-baseline");

const baselinePath = "src/styles/tools/tool-primary-entry-capsule-baseline.css";
const componentBaselinePath = "src/styles/tools/tool-component-style-baseline.css";

assert(existsSync(join(root, baselinePath)), "primary entry capsule baseline exists");

const css = read(baselinePath);
const code = css.replace(/\/\*[\s\S]*?\*\//g, "");

const requiredClasses = [
	".tool-primary-entry-capsule",
	".tool-primary-entry-capsule__icon",
	".tool-primary-entry-capsule--content-driven",
];

for (const className of requiredClasses) {
	assert(code.includes(className), `class present: ${className}`);
}

assert(
	componentBaselinePath &&
		read(componentBaselinePath).includes('@import "./tool-primary-entry-capsule-baseline.css";'),
	"tool-component-style-baseline imports primary entry capsule baseline",
);

assert(code.includes("display: inline-flex"), "shell uses inline-flex");
assert(code.includes("border-radius: 9999px"), "shell uses pill radius");
assert(code.includes("border: 1px solid"), "shell has border");
assert(code.includes("background: rgb(255 255 255 / 0.05)"), "shell has translucent background");
assert(code.includes("backdrop-filter: blur(8px)"), "shell has backdrop blur");
assert(code.includes("white-space: nowrap"), "shell enforces nowrap");
assert(code.includes(":focus-visible"), "focus-visible baseline exists");
assert(code.includes(":disabled"), "disabled baseline exists");
assert(code.includes("opacity: 0.92"), "disabled opacity baseline exists");

assert(
	code.includes("--tool-mobile-portrait-control-icon-size") ||
		code.includes("1.125rem"),
	"icon size uses shared token or 1.125rem",
);
assert(
	code.includes("--tool-mobile-portrait-control-gap") || code.includes("0.5rem"),
	"icon gap uses shared token or 0.5rem",
);

assert(code.includes("min-width: 5.5rem"), "content-driven min-width 88px (5.5rem)");
assert(code.includes("padding-inline: 1.25rem"), "portrait content-driven padding 20px");
assert(
	/\[data-tool-page-frame\]\s+\.tool-primary-entry-capsule\.preview-tool-control-btn\s*\{[^}]*min-height:\s*var\(--tool-mobile-portrait-control-min-height/s.test(
		code,
	),
	"Frame Primary Entry Default geometry includes 56px min-height token",
);
assert(
	/@media\s*\(\s*orientation:\s*landscape\s*\)\s+and\s*\(\s*max-height:\s*700px\s*\)\s+and\s*\(\s*max-width:\s*1200px\s*\)\s+and\s*\(\s*hover:\s*none\s*\)/.test(
		css,
	),
	"Mobile Landscape gate: orientation + max-height 700 + max-width 1200 + hover: none",
);
assert(
	!/@media\s*\(\s*orientation:\s*landscape\s*\)\s+and\s*\(\s*max-height:\s*700px\s*\)\s+and\s*\(\s*max-width:\s*1200px\s*\)\s*\{/.test(
		code,
	),
	"capsule baseline must not use bare landscape+700+1200 without hover: none",
);
assert(code.includes("min-height: 2rem"), "landscape min-height 32px (2rem)");
assert(code.includes("padding-block: 0.375rem"), "landscape vertical padding 6px");
assert(code.includes("padding-inline: 1rem"), "landscape horizontal padding 16px");
assert(code.includes("font-size: 0.75rem"), "landscape font-size 12px");

assert(!code.includes(".tool-utility-control"), "baseline does not reference utility-control");
assert(!/\[data-tool-page-frame\]\s+\.tpf-mobile-capsule\s*\{/.test(code), "baseline does not own Frame wrapper layout");
assert(!/\[data-tool-page-frame\]\s+\.tpf-stage/.test(code), "baseline does not own stage layout");

for (const forbidden of [".tpf-", ".rs-", ".ame-", ".sdc-"]) {
	const pattern = new RegExp(`\\${forbidden.replace(".", "\\.")}[\\w-]*\\s*\\{`);
	assert(!pattern.test(code), `baseline does not define layout contract ${forbidden}*`);
}

console.log(`\nResult: ${passed} passed, ${failed} failed`);

if (failed > 0) {
	process.exitCode = 1;
} else {
	console.log("PASS");
}
