/**
 * Validates shared Utility Capsule Control baseline adoption.
 * Run: node scripts/validate-tool-utility-control-baseline.mjs
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

function countMatches(text, pattern) {
	const matches = text.match(pattern);
	return matches ? matches.length : 0;
}

console.log("validate-tool-utility-control-baseline");

const baselinePath = "src/styles/tools/tool-utility-control-v2-baseline.css";
const resultBaselinePath = "src/styles/tools/tool-result-v2-baseline.css";
const ecCssPath = "src/styles/tools/event-countdown-v2.css";
const ypCssPath = "src/styles/tools/year-progress-v2.css";
const ecAstroPath = "src/components/tools/event-countdown-v2/EventCountdownV2.astro";
const ypAstroPath = "src/components/tools/year-progress-v2/YearProgressV2.astro";
const drAstroPath = "src/components/tools/date-range-calculator-v2/DateRangeCalculatorV2.astro";
const ctAstroPath = "src/components/tools/countdown-timer-v2/CountdownTimerV2.astro";

assert(existsSync(join(root, baselinePath)), "shared baseline file exists");

const baseline = read(baselinePath);
const resultBaseline = read(resultBaselinePath);
const ecCss = read(ecCssPath);
const ypCss = read(ypCssPath);
const ecAstro = read(ecAstroPath);
const ypAstro = read(ypAstroPath);
const drAstro = read(drAstroPath);
const ctAstro = read(ctAstroPath);

assert(
	resultBaseline.includes('@import "./tool-utility-control-v2-baseline.css";'),
	"tool-result-v2-baseline.css imports shared baseline",
);

assert(baseline.includes(".tool-utility-control"), "baseline defines .tool-utility-control");

const transitionBlock =
	/\.tool-utility-control\s*\{[^}]*transition:\s*[^}]*background-color\s+180ms\s+ease[^}]*border-color\s+180ms\s+ease[^}]*color\s+180ms\s+ease[^}]*transform\s+180ms\s+ease[^}]*box-shadow\s+180ms\s+ease/s;

assert(transitionBlock.test(baseline), "base rule contains complete five-property 180ms ease transition");

assert(
	baseline.includes("@media (hover: hover) and (pointer: fine)"),
	"fine-pointer guard present",
);

assert(
	baseline.includes("transform: translateY(-2px)") &&
		baseline.includes("box-shadow: 0 10px 28px rgb(0 0 0 / 0.18)"),
	"hover contains accepted transform and shadow",
);

assert(
	baseline.includes("transform: translateY(0)") &&
		baseline.includes("box-shadow: 0 4px 14px rgb(0 0 0 / 0.12)"),
	"active contains accepted transform reset and shadow",
);

assert(
	baseline.includes("@media (prefers-reduced-motion: reduce)") &&
		baseline.includes("transition-duration: 0s") &&
		baseline.includes("transform: none"),
	"reduced-motion disables transform movement",
);

assert(
	!baseline.includes("box-shadow: none"),
	"reduced-motion does not erase hover hierarchy with box-shadow:none",
);

assert(
	!baseline.includes("cursor: pointer"),
	".tool-utility-control must not declare cursor:pointer",
);

function buttonHasUtilityClass(astroSource, dataAttr) {
	const buttonPattern = new RegExp(
		`<button[\\s\\S]*?${dataAttr}[\\s\\S]*?class="([^"]*)"`,
	);
	const match = astroSource.match(buttonPattern);
	return Boolean(match && match[1].includes("tool-utility-control"));
}

assert(
	buttonHasUtilityClass(ecAstro, "data-ecv2-edit-button"),
	"Event Countdown Edit includes .tool-utility-control",
);
assert(
	buttonHasUtilityClass(ecAstro, "data-ecv2-theme-button"),
	"Event Countdown Theme includes .tool-utility-control",
);
assert(
	buttonHasUtilityClass(ecAstro, "data-ecv2-share-button"),
	"Event Countdown Share includes .tool-utility-control",
);
assert(
	buttonHasUtilityClass(ypAstro, "data-ypv2-theme-button"),
	"Year Progress Theme includes .tool-utility-control",
);
assert(
	buttonHasUtilityClass(ypAstro, "data-ypv2-share-button"),
	"Year Progress Share includes .tool-utility-control",
);

function stripComments(css) {
	return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function utilityControlBlocks(css) {
	const stripped = stripComments(css);
	const blocks = [];
	const selectorPattern = /\[data-[^\]]+\]\s*\.tool-utility-control[^{]*\{/g;
	let match;

	while ((match = selectorPattern.exec(stripped)) !== null) {
		const start = match.index + match[0].length;
		let depth = 1;
		let i = start;

		while (i < stripped.length && depth > 0) {
			if (stripped[i] === "{") depth += 1;
			if (stripped[i] === "}") depth -= 1;
			i += 1;
		}

		blocks.push(stripped.slice(start, i - 1));
	}

	return blocks;
}

function blocksContainForbiddenInteraction(blocks) {
	return blocks.some(
		(block) =>
			/translateY\s*\(\s*-2px\s*\)/.test(block) ||
			/box-shadow:\s*0\s+10px\s+28px/.test(block) ||
			/box-shadow:\s*0\s+4px\s+14px/.test(block),
	);
}

function blocksContainTransition(blocks) {
	return blocks.some((block) => /\btransition(?:-[a-z]+)?\s*:/.test(block));
}

const ecUtilityBlocks = utilityControlBlocks(ecCss);
const ypUtilityBlocks = utilityControlBlocks(ypCss);

assert(
	!blocksContainForbiddenInteraction(ecUtilityBlocks),
	"Event Countdown has no local utility transform/shadow interaction",
);
assert(
	!blocksContainForbiddenInteraction(ypUtilityBlocks),
	"Year Progress has no local utility transform/shadow interaction",
);
assert(
	!blocksContainTransition(ecUtilityBlocks),
	"Event Countdown migrated controls contain no local transition declaration",
);
assert(
	!blocksContainTransition(ypUtilityBlocks),
	"Year Progress migrated controls contain no local transition declaration",
);

function fileDeclaresUtilityCursorPointer(css) {
	const stripped = stripComments(css);
	const blockPattern = /([^{}]+)\{([^{}]*)\}/g;
	let match;

	while ((match = blockPattern.exec(stripped)) !== null) {
		const selector = match[1];
		const body = match[2];

		if (!selector.includes(".tool-utility-control")) {
			continue;
		}

		if (/\bcursor\s*:\s*pointer\b/.test(body)) {
			return true;
		}
	}

	return false;
}

assert(
	!fileDeclaresUtilityCursorPointer(ecCss),
	"Event Countdown local utility selectors do not declare cursor:pointer",
);
assert(
	!fileDeclaresUtilityCursorPointer(ypCss),
	"Year Progress local utility selectors do not declare cursor:pointer",
);

assert(
	!/\[data-year-progress-v2\][^{]*\.ypv2-control-btn[^{]*\{[^}]*\btransition(?:-[a-z]+)?\s*:/s.test(
		stripComments(ypCss),
	),
	"Year Progress has no transition on .ypv2-control-btn blocks",
);

assert(
	!ecCss.includes("preview-tool-control-btn") ||
		!/\[data-event-countdown-v2\][^{]*\.preview-tool-control-btn[^{]*\{[^}]*\btransition(?:-[a-z]+)?\s*:/s.test(
			stripComments(ecCss),
		),
	"Event Countdown has no transition on .preview-tool-control-btn blocks",
);

const excludedSources = [
	{ label: "Date Range", source: drAstro },
	{ label: "Countdown Timer", source: ctAstro },
];

for (const { label, source } of excludedSources) {
	assert(
		!source.includes("tool-utility-control"),
		`${label} does not include .tool-utility-control`,
	);
}

console.log(`Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
