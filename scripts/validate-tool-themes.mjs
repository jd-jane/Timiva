/**
 * Deterministic validation for toolThemes registry — no extra dependencies.
 * Run: node scripts/validate-tool-themes.mjs
 */
import {
	DEFAULT_TOOL_THEME,
	getNextToolTheme,
	normalizeToolTheme,
	TOOL_THEMES,
} from "../src/lib/toolThemes.ts";

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

console.log("validate-tool-themes");

assert(TOOL_THEMES.length === 5, "exactly five themes");
assert(DEFAULT_TOOL_THEME === "mist", "default is mist");
assert(
	TOOL_THEMES.join(",") === "mist,forest,aurora,sunset,midnight",
	"theme order is exact",
);

for (const theme of TOOL_THEMES) {
	assert(normalizeToolTheme(theme) === theme, `${theme} is valid`);
}

assert(normalizeToolTheme("invalid") === "mist", "unknown normalizes to mist");
assert(normalizeToolTheme(null) === "mist", "null normalizes to mist");
assert(normalizeToolTheme(undefined) === "mist", "undefined normalizes to mist");

let current = DEFAULT_TOOL_THEME;
const cycle = [current];

for (let step = 0; step < TOOL_THEMES.length; step++) {
	current = getNextToolTheme(current);
	cycle.push(current);
}

assert(
	cycle.join("→") === "mist→forest→aurora→sunset→midnight→mist",
	"full cycle returns to mist",
);

let rapid = "mist";
for (let i = 0; i < TOOL_THEMES.length * 2; i++) {
	rapid = getNextToolTheme(rapid);
}
assert(rapid === "mist", "two full cycles return to mist");

assert(getNextToolTheme("midnight") === "mist", "midnight cycles to mist");

console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
	process.exit(1);
}
