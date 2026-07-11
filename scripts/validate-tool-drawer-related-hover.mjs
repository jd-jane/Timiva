/**
 * Validates Tool Drawer Related Tools hover contract (tool-page-qa §11A).
 *
 * - Sidebar / drawer related cards must not hover-lift / translateY
 * - Shared drawer baseline must cover all frosted drawers (no per-tool allowlist)
 * - Home ToolCard hover lift must remain intact
 * - V2 tool pages with a related drawer must load the drawer baseline
 *
 * Run: node scripts/validate-tool-drawer-related-hover.mjs
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("..", import.meta.url).pathname;

function read(relPath) {
	return readFileSync(join(root, relPath), "utf8");
}

function walkFiles(dir, matcher, files = []) {
	if (!existsSync(dir)) {
		return files;
	}

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

console.log("validate-tool-drawer-related-hover");

const baselinePath = "src/styles/tools/tool-drawer-v2-baseline.css";
const resultBaselinePath = "src/styles/tools/tool-result-v2-baseline.css";
const toolCardPath = "src/components/ToolCard.astro";
const toolsComponentsDir = join(root, "src/components/tools");
const toolPagesDir = join(root, "src/pages");

assert(existsSync(join(root, baselinePath)), "drawer baseline stylesheet exists");
assert(existsSync(join(root, toolCardPath)), "ToolCard.astro exists");

const baseline = read(baselinePath);
const resultBaseline = read(resultBaselinePath);
const toolCard = read(toolCardPath);

assert(
	resultBaseline.includes('@import "./tool-drawer-v2-baseline.css";'),
	"tool-result-v2-baseline.css imports drawer baseline",
);

assert(
	baseline.includes(".preview-tool-drawer-frosted a:hover"),
	"baseline targets shared frosted drawer anchors (not a per-tool allowlist)",
);

assert(
	baseline.includes("transform: none") && baseline.includes("translate: none"),
	"baseline clears transform and translate on drawer card hover",
);

assert(
	!/:is\s*\(/.test(baseline),
	"baseline no longer uses per-tool :is(...) allowlist for drawer hover",
);

const baselineWithoutComments = baseline
	.replace(/\/\*[\s\S]*?\*\//g, "")
	.replace(/(^|[^:])\/\/.*$/gm, "$1");

const liftPatterns = [
	/translateY\s*\(\s*-/,
	/-translate-y-/,
	/hover:-translate-y/,
	/group-hover:-translate-y/,
];

for (const pattern of liftPatterns) {
	assert(
		!pattern.test(baselineWithoutComments),
		`baseline must not reintroduce lift via ${pattern}`,
	);
}

assert(
	toolCard.includes("hover:-translate-y-2"),
	"Home ToolCard keeps hover:-translate-y-2 (drawer override must not edit ToolCard)",
);

assert(
	!toolCard.includes("preview-tool-drawer-frosted"),
	"ToolCard itself is not drawer-scoped (home hover remains global)",
);

const v2AstroFiles = walkFiles(
	toolsComponentsDir,
	(fullPath) => fullPath.endsWith("V2.astro") || fullPath.endsWith("v2.astro"),
);

assert(v2AstroFiles.length > 0, "at least one V2 tool component exists");

const drawerTools = [];

for (const fullPath of v2AstroFiles) {
	const rel = relative(root, fullPath);
	const source = readFileSync(fullPath, "utf8");
	const usesFrostedDrawer = source.includes("preview-tool-drawer-frosted");
	const usesToolCard = /<ToolCard[\s>]/.test(source);

	if (!usesFrostedDrawer) {
		continue;
	}

	drawerTools.push(rel);

	assert(
		usesToolCard,
		`${rel} frosted drawer should render ToolCard related links`,
	);

	assert(
		!/hover:-translate-y/.test(source) && !/group-hover:-translate-y/.test(source),
		`${rel} must not add hover translate utility classes on drawer markup`,
	);
}

assert(drawerTools.length >= 5, "expected multiple V2 tools to use frosted related drawer");

const toolPageFiles = walkFiles(
	toolPagesDir,
	(fullPath) =>
		/\/(en|zh)\/[^/]+\/index\.astro$/.test(fullPath.replaceAll("\\", "/")) &&
		!fullPath.includes("/tools/index.astro"),
);

const pagesNeedingDrawerBaseline = [];

for (const fullPath of toolPageFiles) {
	const rel = relative(root, fullPath);
	const source = readFileSync(fullPath, "utf8");

	const importsV2Tool = /components\/tools\/[^"']+-v2\//.test(source);
	if (!importsV2Tool) {
		continue;
	}

	pagesNeedingDrawerBaseline.push(rel);

	const loadsDrawerBaseline =
		source.includes("tool-drawer-v2-baseline.css") ||
		source.includes("tool-result-v2-baseline.css");

	assert(
		loadsDrawerBaseline,
		`${rel} must import tool-result-v2-baseline.css or tool-drawer-v2-baseline.css`,
	);
}

assert(
	pagesNeedingDrawerBaseline.some((path) => path.includes("days-between-dates")),
	"days-between-dates pages are included in drawer baseline coverage checks",
);

const toolCssFiles = walkFiles(
	join(root, "src/styles/tools"),
	(fullPath) => fullPath.endsWith("-v2.css") || fullPath.endsWith("v2.css"),
);

for (const fullPath of toolCssFiles) {
	const rel = relative(root, fullPath);
	const css = readFileSync(fullPath, "utf8");

	const drawerHoverBlocks = css.match(
		/\[[^\]]*drawer[^\]]*\][^{]*a:hover\s*\{[^}]+\}/gi,
	);

	if (!drawerHoverBlocks) {
		continue;
	}

	for (const block of drawerHoverBlocks) {
		const reintroducesLift =
			/translateY\s*\(\s*-/.test(block) ||
			/-translate-y-/.test(block) ||
			(/translate\s*:/.test(block) && !/translate\s*:\s*none/.test(block));

		assert(
			!reintroducesLift,
			`${rel} drawer a:hover must not reintroduce hover lift`,
		);
	}
}

console.log(`passed=${passed} failed=${failed}`);

if (failed > 0) {
	process.exit(1);
}
