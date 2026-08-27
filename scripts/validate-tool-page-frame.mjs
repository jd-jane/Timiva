/**
 * Tool Page Frame — high-value contract validator（F1）.
 *
 * Protects the productionized Tool Page page-type baseline.
 * Does NOT require CSS to be byte-equal to Hours Calculator.
 *
 * Run: node scripts/validate-tool-page-frame.mjs
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(relPath) {
	return readFileSync(join(root, relPath), "utf8");
}

function exists(relPath) {
	return existsSync(join(root, relPath));
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

function stripComments(source) {
	return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function extractRuleSelectors(css) {
	const text = stripComments(css);
	const selectors = [];
	const chunks = text.split("}");

	for (const chunk of chunks) {
		const trimmed = chunk.trim();
		if (!trimmed) {
			continue;
		}

		const open = trimmed.lastIndexOf("{");
		if (open === -1) {
			continue;
		}

		let selector = trimmed.slice(0, open).trim();
		const mediaInner = selector.match(/@media[^{]*\{([\s\S]*)$/);
		if (mediaInner) {
			selector = mediaInner[1].trim();
		}

		if (!selector || selector.startsWith("@")) {
			continue;
		}

		for (const part of selector.split(",")) {
			const item = part.trim();
			if (item) {
				selectors.push(item);
			}
		}
	}

	return selectors;
}

function gitDiffNames(relPaths) {
	try {
		const output = execFileSync("git", ["diff", "--name-only", "HEAD", "--", ...relPaths], {
			cwd: root,
			encoding: "utf8",
		});
		const staged = execFileSync(
			"git",
			["diff", "--cached", "--name-only", "HEAD", "--", ...relPaths],
			{
				cwd: root,
				encoding: "utf8",
			},
		);
		return new Set(
			`${output}\n${staged}`
				.split("\n")
				.map((line) => line.trim())
				.filter(Boolean),
		);
	} catch {
		return null;
	}
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

console.log("validate-tool-page-frame\n");

const frameAstroPath = "src/components/tools/shared/ToolPageFrame.astro";
const frameCssPath = "src/styles/tools/tool-page-frame.css";
const previewCssPath = "src/styles/preview/tool-preview-first-screen.css";

assert(exists(frameAstroPath), "ToolPageFrame.astro exists");
assert(exists(frameCssPath), "tool-page-frame.css exists");

const frameAstro = exists(frameAstroPath) ? read(frameAstroPath) : "";
const frameCss = exists(frameCssPath) ? read(frameCssPath) : "";
const frameCssExec = stripComments(frameCss);
const frameAstroExec = stripComments(frameAstro);

/* -------------------------------------------------------------------------- */
/* Frame source                                                                */
/* -------------------------------------------------------------------------- */
assert(frameAstro.includes('data-tool-page-frame'), "Frame root exposes data-tool-page-frame");
assert(
	frameAstro.includes('import "../../../styles/tools/tool-page-frame.css"'),
	"Frame imports production-only tool-page-frame.css",
);
assert(
	!frameAstro.includes("tool-preview-first-screen.css") &&
		!frameCss.includes("tool-preview-first-screen.css"),
	"Frame does not import preview CSS as production implementation",
);
assert(!frameCssExec.includes("@import"), "Frame CSS has no @import");
assert(!frameCssExec.includes("!important"), "Frame CSS does not use !important");
assert(
	!frameAstroExec.includes("exceptionFirstScreen") &&
		!frameCssExec.includes("exceptionFirstScreen"),
	"Frame has no exceptionFirstScreen escape hatch",
);
assert(!/#[A-Za-z][^{]*\{/.test(frameCssExec), "Frame CSS does not use id selectors");

const requiredSlots = [
	'name="title"',
	'name="result"',
	'name="desktopControls"',
	'name="mobilePrimaryControl"',
	'name="drawerRelated"',
	'name="lowerRelated"',
	'name="lowerContent"',
	'name="ame"',
];

for (const slot of requiredSlots) {
	assert(frameAstro.includes(slot), `Frame exposes slot ${slot}`);
}

assert(frameAstro.includes('class="tpf-mobile-capsule"'), "Frame wraps mobile control in capsule geometry");
assert(frameAstro.includes("ToolAdSlot"), "Frame places ToolAdSlot");
assert(frameAstro.includes('state="is-disabled"'), "Frame ToolAdSlot stays is-disabled");
assert(frameAstro.includes('variant="sidebar"') && frameAstro.includes('variant="main"'), "Frame places sidebar and main ad slots");
assert(frameAstro.includes("max-w-3xl"), "Frame lower-content uses max-w-3xl");
assert(frameAstro.includes("max-w-md"), "Frame stage uses max-w-md / md:max-w-lg");
assert(
	!/tpf-stage[^>]*(max-w-3xl)|tool-lower-content[^>]*(max-w-md)/.test(frameAstro.replaceAll("\n", " ")),
	"Frame does not mix stage and lower-content width classes on the same node",
);
assert(frameAstro.includes("data-tpf-drawer"), "Frame owns drawer placement");
assert(frameAstro.includes("preview-tool-drawer-frosted"), "Frame keeps drawer frosted chrome");
assert(frameAstro.includes("w-[300px]"), "Frame drawer panel is 300px");
assert(frameAstro.includes("translate-x-[300px]"), "Frame drawer toggle contract includes 300px translate");
assert(
	!/import\s+Header\b/.test(frameAstro) &&
		!/import\s+Footer\b/.test(frameAstro) &&
		!/import\s+BaseLayout\b/.test(frameAstro) &&
		!/<Header[\s>]/.test(frameAstro) &&
		!/<Footer[\s>]/.test(frameAstro) &&
		!/<BaseLayout[\s>]/.test(frameAstro),
	"Frame does not own Header／Footer／BaseLayout",
);

/* -------------------------------------------------------------------------- */
/* Frame CSS scope + contracts                                                 */
/* -------------------------------------------------------------------------- */
assert(frameCss.includes("[data-tool-page-frame]"), "Frame CSS is scoped to [data-tool-page-frame]");

const selectors = extractRuleSelectors(frameCss);
assert(selectors.length > 0, "Frame CSS has parseable rules");

for (const selector of selectors) {
	const scoped =
		selector.includes("[data-tool-page-frame]") ||
		selector.startsWith("body:has([data-tool-page-frame])");
	assert(scoped, `Frame CSS selector is scoped: ${selector}`);
}

assert(
	frameCss.includes("@media (max-width: 767px) and (orientation: portrait)"),
	"Frame CSS has portrait contract",
);
assert(
	frameCss.includes("grid-template-rows: minmax(0, 1fr) auto"),
	"Frame CSS has portrait 1fr / auto composition",
);
assert(
	frameCss.includes("padding-block: 1.5rem 1.25rem"),
	"Frame CSS includes portrait stage padding-block 1.5rem 1.25rem",
);
assert(
	frameCss.includes(
		"@media (orientation: landscape) and (max-height: 700px) and (max-width: 1200px) and (hover: none)",
	),
	"Frame CSS has Mobile Landscape compact gate (incl. hover: none)",
);
assert(
	!/@media\s*\(\s*orientation:\s*landscape\s*\)\s+and\s*\(\s*max-height:\s*700px\s*\)\s+and\s*\(\s*max-width:\s*1200px\s*\)\s*\{/.test(
		frameCss.replace(/\/\*[\s\S]*?\*\//g, ""),
	),
	"Frame CSS must not use bare landscape+700+1200 without hover: none",
);
assert(
	frameCss.includes("@media (min-width: 900px) and (min-height: 700px) and (hover: hover)"),
	"Frame CSS has desktop 640px Spacious gate media query",
);
assert(
	frameCss.includes("[data-tool-page-frame] .tpf-stage.preview-tool-stage") &&
		frameCss.includes("max-width: 640px"),
	"Desktop 640px gate targets stage, not lower-content",
);
assert(
	frameCss.includes("max-width: min(100%, 20rem)"),
	"Frame CSS guarantees capsule max-width 20rem",
);
assert(
	frameCss.includes("min-height: var(--tool-mobile-portrait-control-min-height, 3.5rem)"),
	"Frame CSS guarantees portrait capsule min-height 3.5rem",
);
assert(
	frameCss.includes("@media (min-width: 768px) and (hover: hover)") &&
		frameCss.includes("[data-tool-page-frame] .tpf-mobile-controls") &&
		frameCss.includes("display: none"),
	"Frame CSS Desktop continuity hides mobile at 768px + hover:hover",
);
assert(
	frameCss.includes("var(--tool-stage-to-lower-content-spacing, 48px)"),
	"Frame CSS has first-screen → lower-content spacing",
);
assert(
	!frameCss.includes(".preview-tool-result-number"),
	"Frame CSS does not copy preview result-number rules",
);

const lowerWidthOnStage = /tpf-stage[^{]*\{[^}]*max-width:\s*3xl/.test(frameCssExec);
const stageGateOnLower = /tpf-lower-content[^{]*\{[^}]*max-width:\s*640px/.test(frameCssExec);
assert(!lowerWidthOnStage, "Frame CSS does not put max-w-3xl on stage");
assert(!stageGateOnLower, "Frame CSS does not put 640px gate on lower-content");

/* -------------------------------------------------------------------------- */
/* Tool CSS must not override .tpf-*（Lunar workaround allowlist → Batch 4）   */
/* -------------------------------------------------------------------------- */
const toolCssFiles = walkFiles(
	join(root, "src/styles"),
	(fullPath) => fullPath.endsWith(".css") && !fullPath.endsWith("tool-page-frame.css"),
);

/** Temporary until Foundation Batch 4 removes Lunar tool-local TPF guard. */
const tpfOverrideAllowlist = new Set([
	"src/styles/tools/lunar-date-converter-v2.css",
]);

for (const fullPath of toolCssFiles) {
	const rel = relative(root, fullPath);
	const css = readFileSync(fullPath, "utf8");
	assert(!css.includes("tool-preview-first-screen.css") || rel.includes("preview/"), `${rel} must not import preview CSS as production Frame`);
	if (tpfOverrideAllowlist.has(rel)) {
		assert(
			/\.tpf-/.test(stripComments(css)),
			`${rel} Batch-4 allowlist: Lunar TPF workaround still present`,
		);
		continue;
	}
	assert(!/\.tpf-/.test(stripComments(css)), `${rel} must not override .tpf-*`);
}

const previewCss = exists(previewCssPath) ? read(previewCssPath) : "";
assert(!/\.tpf-/.test(previewCss), "preview CSS must not define .tpf-*");

/* -------------------------------------------------------------------------- */
/* Adopters（none expected in F0–F2）                                          */
/* -------------------------------------------------------------------------- */
const astroFiles = walkFiles(
	join(root, "src"),
	(fullPath) => fullPath.endsWith(".astro") && !fullPath.endsWith("ToolPageFrame.astro"),
);

const adopters = [];

for (const fullPath of astroFiles) {
	const rel = relative(root, fullPath);
	const source = readFileSync(fullPath, "utf8");
	const usesFrame =
		source.includes("ToolPageFrame") ||
		source.includes("data-tool-page-frame") ||
		source.includes("tool-page-frame.css");

	if (!usesFrame) {
		continue;
	}

	adopters.push(rel);

	assert(
		/import\s+ToolPageFrame\s+from/.test(source) || source.includes("<ToolPageFrame"),
		`${rel} must mount shared ToolPageFrame`,
	);
	assert(
		!source.includes("tool-preview-first-screen.css"),
		`${rel} must not import preview CSS as Frame implementation`,
	);
	assert(
		!source.includes("exceptionFirstScreen"),
		`${rel} must not use exceptionFirstScreen`,
	);
}

if (adopters.length === 0) {
	assert(true, "No production adopter yet（F0–F2 expected；Lunar is first adopter later）");
} else {
	assert(true, `Frame adopters: ${adopters.join(", ")}`);
}

/* -------------------------------------------------------------------------- */
/* DC／Hours／JEC must not be migrated onto Frame this round                   */
/* -------------------------------------------------------------------------- */
const legacyProduction = [
	"src/components/tools/date-calculator-v2/DateCalculatorV2.astro",
	"src/styles/tools/date-calculator-v2.css",
	"src/scripts/date-calculator.ts",
	"src/scripts/date-calculator-ame-adapter.ts",
	"src/pages/en/date-calculator/index.astro",
	"src/pages/zh/date-calculator/index.astro",
	"src/components/tools/hours-calculator-v2/HoursCalculatorV2.astro",
	"src/styles/tools/hours-calculator-v2.css",
	"src/scripts/hours-calculator.ts",
	"src/scripts/hours-calculator-ame-adapter.ts",
	"src/pages/en/hours-calculator/index.astro",
	"src/pages/zh/hours-calculator/index.astro",
	"src/components/tools/japanese-era-converter-v2/JapaneseEraConverterV2.astro",
	"src/styles/tools/japanese-era-converter-v2.css",
	"src/scripts/japanese-era-converter.ts",
	"src/scripts/japanese-era-converter-ame-adapter.ts",
	"src/pages/en/japanese-era-converter/index.astro",
	"src/pages/zh/japanese-era-converter/index.astro",
];

for (const rel of legacyProduction) {
	assert(exists(rel), `legacy production file exists: ${rel}`);
	if (!exists(rel)) {
		continue;
	}

	const source = read(rel);
	assert(
		!source.includes("ToolPageFrame") &&
			!source.includes("data-tool-page-frame") &&
			!source.includes("tool-page-frame.css") &&
			!/\.tpf-/.test(source),
		`${rel} must not adopt or override ToolPageFrame this round`,
	);
	assert(
		!source.includes("tool-preview-first-screen.css"),
		`${rel} must not start importing preview CSS`,
	);
}

const lockedChrome = [
	"src/pages/preview/tool.astro",
	"src/styles/preview/tool-preview-first-screen.css",
	"src/components/Header.astro",
	"src/components/Footer.astro",
	"src/layouts/BaseLayout.astro",
];

const frozen = gitDiffNames([...legacyProduction, ...lockedChrome]);
if (frozen === null) {
	assert(false, "git diff available to confirm DC／Hours／JEC／locked chrome untouched");
} else {
	assert(
		frozen.size === 0,
		frozen.size === 0
			? "DC／Hours／JEC production and locked chrome files are unmodified"
			: `frozen files were modified: ${[...frozen].join(", ")}`,
	);
}

console.log(`\npassed=${passed} failed=${failed}`);

if (failed > 0) {
	process.exit(1);
}
