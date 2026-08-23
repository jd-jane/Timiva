/**
 * Lightweight contract validator for tool-component-style-baseline.css
 * Run: node scripts/validate-component-style-baseline.mjs
 */
import { readFileSync, existsSync } from "node:fs";
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

console.log("validate-component-style-baseline");

const baselinePath = "src/styles/tools/tool-component-style-baseline.css";
const resultBaselinePath = "src/styles/tools/tool-result-v2-baseline.css";

assert(existsSync(join(root, baselinePath)), "baseline stylesheet exists");

const baseline = read(baselinePath);
const primaryCapsulePath = "src/styles/tools/tool-primary-entry-capsule-baseline.css";

assert(
	baseline.includes('@import "./tool-primary-entry-capsule-baseline.css";'),
	"component style baseline imports primary entry capsule baseline",
);

assert(existsSync(join(root, primaryCapsulePath)), "primary entry capsule baseline file exists");

const primaryCapsuleClasses = [
	".tool-primary-entry-capsule",
	".tool-primary-entry-capsule__icon",
	".tool-primary-entry-capsule--content-driven",
];

for (const className of primaryCapsuleClasses) {
	assert(read(primaryCapsulePath).includes(className), `primary capsule class present: ${className}`);
}

const resultBaseline = read(resultBaselinePath);
const baselineCode = baseline.replace(/\/\*[\s\S]*?\*\//g, "");

const requiredClasses = [
	".tool-standard-pill-field",
	".tool-standard-pill-field-cluster",
	".tool-textual-result-support-divider",
	".tool-text-action--muted",
	".tool-text-action--accent",
	".tool-mode-switch",
	".tool-mode-switch-icon",
	".tool-field-error-block",
	".tool-field-error-message",
];

for (const className of requiredClasses) {
	assert(baseline.includes(className), `recipe class present: ${className}`);
}

assert(
	resultBaseline.includes('@import "./tool-component-style-baseline.css";'),
	"tool-result-v2-baseline.css imports component style baseline",
);

assert(
	!baselineCode.includes(".tool-utility-control"),
	"mode switch recipe does not reference .tool-utility-control",
);

for (const forbidden of [".jecv2-", ".hcv2-", ".dcv2-", ".acv2-"]) {
	assert(!baselineCode.includes(forbidden), `baseline does not depend on ${forbidden}* tool classes`);
}

for (const forbiddenSelector of [".rs-", ".ame-", ".tpf-", ".sdc-"]) {
	assert(
		!new RegExp(`\\${forbiddenSelector.replace(".", "\\.")}`).test(baselineCode),
		`baseline does not select shared internals ${forbiddenSelector}*`,
	);
}

assert(
	!/\bbutton\s*\{/.test(baselineCode) &&
		!/\binput\s*\{/.test(baselineCode) &&
		!/\ba\s*\{/.test(baselineCode) &&
		!/\[data-rs-/.test(baselineCode) &&
		!/\[data-ame-/.test(baselineCode),
	"baseline avoids bare element / auto data-attribute selectors",
);

assert(
	baseline.includes(".tool-textual-result-support-divider::before"),
	"textual support divider uses opt-in ::before recipe",
);

assert(
	!baselineCode.includes("tool-mode-switch--desktop") &&
		!baselineCode.includes("desktop-cluster"),
	"mode switch has no desktop formal variant in shared baseline",
);

console.log(`\nResult: ${passed} passed, ${failed} failed`);

if (failed > 0) {
	process.exitCode = 1;
} else {
	console.log("PASS");
}
