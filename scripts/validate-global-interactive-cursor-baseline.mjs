/**
 * Validates Global Interactive Cursor Baseline in src/styles/global.css.
 * Run: node scripts/validate-global-interactive-cursor-baseline.mjs
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("..", import.meta.url).pathname;

function read(relPath) {
	return readFileSync(join(root, relPath), "utf8");
}

function walkFiles(dir, matcher, files = []) {
	for (const entry of readdirSync(dir)) {
		const fullPath = join(dir, entry);
		const stat = statSync(fullPath);

		if (stat.isDirectory()) {
			walkFiles(fullPath, matcher, files);
			continue;
		}

		if (matcher(fullPath)) {
			files.push(fullPath);
		}
	}

	return files;
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

console.log("validate-global-interactive-cursor-baseline");

const globalPath = "src/styles/global.css";
const utilityBaselinePath = "src/styles/tools/tool-utility-control-v2-baseline.css";
const ecCssPath = "src/styles/tools/event-countdown-v2.css";
const ypCssPath = "src/styles/tools/year-progress-v2.css";

const knownToolCssFiles = [
	"src/styles/tools/event-countdown-v2.css",
	"src/styles/tools/year-progress-v2.css",
	"src/styles/tools/date-range-calculator-v2.css",
	"src/styles/tools/countdown-timer-v2.css",
	"src/styles/tools/tool-mobile-sheet-v2-baseline.css",
	"src/styles/tools/tool-drawer-v2-baseline.css",
	"src/styles/tools/tool-result-v2-baseline.css",
	"src/styles/tools/date-range.css",
	"src/styles/tools/countdown.css",
	"src/styles/tools/tool-design-system.css",
	"src/styles/tools/reset.css",
];

const specialCursorTokens = [
	"grab",
	"grabbing",
	"text",
	"ew-resize",
	"ns-resize",
	"col-resize",
	"row-resize",
	"not-allowed",
	"progress",
	"wait",
	"move",
	"crosshair",
	"default",
];

const allowedOrdinaryPointerPatterns = [
	/::-webkit-calendar-picker-indicator/,
	/-date-field\b/,
	/-date-input\b/,
	/date-input\b/,
	/range-landscape-input\b/,
	/input\[type=["']date["']\]/,
	/sheet-content input\[type=["']date["']\]/,
];

assert(existsSync(join(root, globalPath)), "global stylesheet exists");

const globalCss = read(globalPath);
const utilityBaseline = read(utilityBaselinePath);
const ecCss = read(ecCssPath);
const ypCss = read(ypCssPath);

assert(globalCss.includes("@layer base"), "cursor rule lives in global base layer context");

const baseLayerMatch = globalCss.match(/@layer base\s*\{([\s\S]*?)\n\}/);
const baseLayer = baseLayerMatch ? baseLayerMatch[1] : "";

assert(baseLayer.includes("cursor: pointer"), "enabled interactive elements use pointer in base layer");
assert(baseLayer.includes("button:not(:disabled):not([aria-disabled=\"true\"])"), "enabled native buttons covered");
assert(baseLayer.includes("button:disabled"), "disabled native buttons excluded from pointer");
assert(baseLayer.includes("button[aria-disabled=\"true\"]"), "aria-disabled buttons excluded from pointer");
assert(baseLayer.includes('a[href]:not([aria-disabled="true"])'), "anchors with href covered");
assert(baseLayer.includes("summary"), "summary covered");
assert(baseLayer.includes('[role="button"]:not([aria-disabled="true"])'), 'role="button" covered');
assert(baseLayer.includes('[role="link"]:not([aria-disabled="true"])'), 'role="link" covered');
assert(baseLayer.includes('input[type="button"]:not(:disabled)'), "input button types covered");
assert(baseLayer.includes("cursor: default"), "disabled controls resolve to default in base layer");

assert(
	!baseLayer.includes('input[type="text"]') || !baseLayer.match(/input\[type="text"\][^{]*cursor:\s*pointer/),
	"text inputs are not globally assigned pointer",
);

assert(!globalCss.includes("* {\n\tcursor: pointer") && !globalCss.includes("* {\n  cursor: pointer"), "no universal * { cursor: pointer }");
assert(!globalCss.includes("!important"), "no forbidden !important in global stylesheet");

assert(!utilityBaseline.includes("cursor: pointer"), ".tool-utility-control does not own cursor:pointer");

function stripComments(css) {
	return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function utilityBlocks(css) {
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

const ecUtilityBlocks = utilityBlocks(ecCss);
const ypUtilityBlocks = utilityBlocks(ypCss);

assert(
	!ecUtilityBlocks.some((block) => /\bcursor\s*:\s*pointer/.test(block)),
	"Event Countdown has no redundant local cursor on migrated Utility Capsule Controls",
);
assert(
	!ypUtilityBlocks.some((block) => /\bcursor\s*:\s*pointer/.test(block)),
	"Year Progress has no redundant local cursor on migrated Utility Capsule Controls",
);

function isAllowedOrdinaryPointerContext(selectorAndDeclaration) {
	if (allowedOrdinaryPointerPatterns.some((pattern) => pattern.test(selectorAndDeclaration))) {
		return true;
	}

	return specialCursorTokens.some((token) => new RegExp(`cursor\\s*:\\s*${token}\\b`).test(selectorAndDeclaration));
}

function findRedundantPointerDeclarations(css, relPath) {
	const stripped = stripComments(css);
	const findings = [];
	const blockPattern = /([^{}]+)\{([^{}]*)\}/g;
	let match;

	while ((match = blockPattern.exec(stripped)) !== null) {
		const selector = match[1].trim();
		const body = match[2];

		if (!/\bcursor\s*:\s*pointer\b/.test(body)) {
			continue;
		}

		const context = `${selector} { ${body} }`;

		if (isAllowedOrdinaryPointerContext(context)) {
			continue;
		}

		findings.push({ relPath, selector });
	}

	return findings;
}

const redundantCssFindings = [];

for (const relPath of knownToolCssFiles) {
	if (!existsSync(join(root, relPath))) {
		continue;
	}

	redundantCssFindings.push(...findRedundantPointerDeclarations(read(relPath), relPath));
}

assert(
	redundantCssFindings.length === 0,
	`no redundant cursor:pointer in known tool/shared CSS (${redundantCssFindings.map((f) => `${f.relPath} :: ${f.selector}`).join("; ") || "none"})`,
);

const astroFiles = walkFiles(join(root, "src"), (filePath) => filePath.endsWith(".astro"));
const redundantAstroFindings = [];

for (const filePath of astroFiles) {
	const relPath = relative(root, filePath).replace(/\\/g, "/");
	const source = read(relPath);
	const lines = source.split("\n");

	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index];

		if (!line.includes("cursor-pointer")) {
			continue;
		}

		const isSemanticInteractive =
			/<summary\b/.test(line) ||
			/<button\b/.test(line) ||
			/<a\b[^>]*href=/.test(line) ||
			/<select\b/.test(line);

		if (isSemanticInteractive) {
			redundantAstroFindings.push(`${relPath}:${index + 1}`);
		}
	}
}

assert(
	redundantAstroFindings.length === 0,
	`no redundant cursor-pointer on semantic controls in Astro (${redundantAstroFindings.join(", ") || "none"})`,
);

console.log(`Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
