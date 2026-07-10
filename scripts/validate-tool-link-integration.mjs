/**
 * Tool Link Integration validator — source architecture + built output.
 * Run after: npm run build
 * Run: node scripts/validate-tool-link-integration.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { featuredTools } from "../src/data/homeTools.ts";
import { en } from "../src/i18n/en.ts";
import { zh } from "../src/i18n/zh.ts";

const ROOT = new URL("..", import.meta.url).pathname;
const DIST = join(ROOT, "dist");

const PRODUCTION_TOOL_IDS = [
	"event-countdown",
	"date-range",
	"countdown-timer",
	"year-progress",
	"age-calculator",
];

const APPROVED_RELATED_IDS = {
	"event-countdown": ["date-range", "countdown-timer", "age-calculator"],
	"date-range": ["event-countdown", "countdown-timer", "age-calculator"],
	"countdown-timer": ["event-countdown", "date-range", "year-progress"],
	"year-progress": ["event-countdown", "date-range", "age-calculator"],
	"age-calculator": ["date-range", "event-countdown", "year-progress"],
};

const PRODUCTION_RELATED_COMPONENTS = [
	"src/components/tools/event-countdown-v2/EventCountdownV2.astro",
	"src/components/tools/date-range-calculator-v2/DateRangeCalculatorV2.astro",
	"src/components/tools/countdown-timer-v2/CountdownTimerV2.astro",
	"src/components/tools/year-progress-v2/YearProgressV2.astro",
];

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

function readDistHtml(relativePath) {
	const filePath = join(DIST, relativePath);
	assert(existsSync(filePath), `built file exists: ${relativePath}`);
	if (!existsSync(filePath)) {
		return "";
	}

	return readFileSync(filePath, "utf8");
}

function readSource(relativePath) {
	return readFileSync(join(ROOT, relativePath), "utf8");
}

function countHref(html, href) {
	const pattern = new RegExp(
		`href=["']${href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`,
		"g",
	);
	return (html.match(pattern) ?? []).length;
}

function extractRelatedHrefs(html, localePrefix) {
	const sectionPattern = new RegExp(
		`<section[^>]*(?:data-preview-related-tools|data-drv2-related-tools|data-ctv2-related-tools|data-ypv2-related-tools|data-acv2-related-tools)[^>]*>([\\s\\S]*?)</section>`,
		"g",
	);
	const hrefPattern = new RegExp(
		`href=["'](${localePrefix}/[^"']+/)["']`,
		"g",
	);
	const hrefs = new Set();

	for (const match of html.matchAll(sectionPattern)) {
		for (const hrefMatch of match[1].matchAll(hrefPattern)) {
			hrefs.add(hrefMatch[1]);
		}
	}

	return [...hrefs];
}

function parseCatalogTools(source) {
	const arrayStart = source.indexOf("export const catalogTools:");
	const arrayBody = source.slice(arrayStart);
	const tools = [];
	const entryPattern =
		/\n  \{\n    id: "([^"]+)"[\s\S]*?slug: "([^"]+)"[\s\S]*?available: (true|false)[\s\S]*?relatedIds: (\[[^\]]+\])/g;

	for (const match of arrayBody.matchAll(entryPattern)) {
		const [, id, slug, available, relatedRaw] = match;
		const relatedIds = [...relatedRaw.matchAll(/"([^"]+)"/g)].map(
			(relatedMatch) => relatedMatch[1],
		);

		tools.push({
			id,
			slug,
			available: available === "true",
			featured: true,
			relatedIds,
		});
	}

	return tools;
}

function getRelatedTools(catalogTools, currentId) {
	const catalogById = new Map(catalogTools.map((tool) => [tool.id, tool]));
	const current = catalogById.get(currentId);
	const related = [];
	const seen = new Set([currentId]);

	for (const id of current?.relatedIds ?? []) {
		const tool = catalogById.get(id);
		if (tool?.available && !seen.has(tool.id)) {
			related.push(tool);
			seen.add(tool.id);
		}
	}

	for (const tool of catalogTools) {
		if (related.length >= 3) {
			break;
		}

		if (tool.available && tool.featured && !seen.has(tool.id)) {
			related.push(tool);
			seen.add(tool.id);
		}
	}

	for (const tool of featuredTools) {
		if (related.length >= 3) {
			break;
		}

		const catalogTool = catalogById.get(tool.id);
		if (catalogTool?.available && !seen.has(catalogTool.id)) {
			related.push(catalogTool);
			seen.add(catalogTool.id);
		}
	}

	return related.slice(0, 3);
}

function parseIconMap(source, exportName) {
	const block = source.match(
		new RegExp(`export const ${exportName}[\\s\\S]*?=\\s*\\{([\\s\\S]*?)\\};`),
	);
	if (!block) {
		return {};
	}

	const map = {};
	for (const match of block[1].matchAll(/"([^"]+)":\s*"([^"]+)"/g)) {
		map[match[1]] = match[2];
	}

	return map;
}

console.log("validate-tool-link-integration");

const catalogSource = readSource("src/data/toolsCatalog.ts");
const catalogTools = parseCatalogTools(catalogSource);
const homeFeaturedIconMap = parseIconMap(
	readSource("src/lib/homeFeaturedIcons.ts"),
	"homeFeaturedIconMap",
);
const catalogIconMap = parseIconMap(
	readSource("src/lib/catalogIcons.ts"),
	"catalogIconMap",
);

// --- Source: catalog ---
const ageCalculatorEntries = catalogTools.filter(
	(tool) => tool.id === "age-calculator",
);
assert(ageCalculatorEntries.length === 1, "exactly one age-calculator catalog entry");

const ageCalculator = ageCalculatorEntries[0];
assert(ageCalculator?.available === true, "age-calculator.available === true");
assert(ageCalculator?.slug === "age-calculator", "age-calculator slug is age-calculator");

for (const id of PRODUCTION_TOOL_IDS) {
	const tool = catalogTools.find((entry) => entry.id === id);
	assert(tool?.available === true, `${id} is available`);
}

for (const [toolId, expectedIds] of Object.entries(APPROVED_RELATED_IDS)) {
	const tool = catalogTools.find((entry) => entry.id === toolId);
	assert(
		JSON.stringify(tool?.relatedIds) === JSON.stringify(expectedIds),
		`${toolId} relatedIds match approved order`,
	);

	const relatedIds = tool?.relatedIds ?? [];
	assert(!relatedIds.includes(toolId), `${toolId} relatedIds has no self-reference`);
	assert(
		new Set(relatedIds).size === relatedIds.length,
		`${toolId} relatedIds has no duplicates`,
	);

	for (const relatedId of relatedIds) {
		const related = catalogTools.find((entry) => entry.id === relatedId);
		assert(Boolean(related), `${toolId} related ID ${relatedId} exists`);
		assert(related?.available === true, `${toolId} related tool ${relatedId} is available`);
	}
}

for (const toolId of PRODUCTION_TOOL_IDS) {
	const related = getRelatedTools(catalogTools, toolId);
	const relatedIds = related.map((tool) => tool.id);
	const expected = APPROVED_RELATED_IDS[toolId].filter((id) => id !== toolId);

	assert(related.length === 3, `getRelatedTools(${toolId}) returns exactly three tools`);
	assert(
		JSON.stringify(relatedIds) === JSON.stringify(expected),
		`getRelatedTools(${toolId}) order matches approved list`,
	);
}

// --- Source: Home ---
assert(featuredTools.length === 4, "Home has exactly four featured tools");
assert(
	JSON.stringify(featuredTools.map((tool) => tool.id)) ===
		JSON.stringify([
			"date-range",
			"age-calculator",
			"event-countdown",
			"year-progress",
		]),
	"Home order is date-range, age-calculator, event-countdown, year-progress",
);
assert(
	!featuredTools.some((tool) => tool.id === "timer"),
	"Home featured tools do not include Countdown Timer",
);

const homeAgeCalculator = featuredTools[1];
assert(homeAgeCalculator?.id === "age-calculator", "Home second tool is age-calculator");
assert(homeAgeCalculator?.slug === "age-calculator", "Home age-calculator slug is age-calculator");
assert(homeAgeCalculator?.available === true, "Home age-calculator is enabled");
assert(
	homeFeaturedIconMap["age-calculator"] === "person",
	"Home age-calculator icon mapping exists",
);
assert(
	catalogIconMap["age-calculator"] === "person",
	"catalog age-calculator icon mapping exists",
);

assert(
	en.home.featuredTools["age-calculator"]?.title === "Age Calculator",
	"EN Home age-calculator title exists",
);
assert(
	en.home.featuredTools["age-calculator"]?.description ===
		en.tools.ageCalculator.description,
	"EN Home age-calculator description matches catalog wording",
);
assert(
	zh.home.featuredTools["age-calculator"]?.title === "年齡計算器",
	"ZH Home age-calculator title exists",
);
assert(
	zh.home.featuredTools["age-calculator"]?.description ===
		zh.tools.ageCalculator.description,
	"ZH Home age-calculator description matches catalog wording",
);
assert(en.tools.ageCalculator.title === "Age Calculator", "EN tools.ageCalculator exists");
assert(zh.tools.ageCalculator.title === "年齡計算器", "ZH tools.ageCalculator exists");

// --- Source: production Related Tools components ---
const countdownTimerSource = readSource(
	"src/components/tools/countdown-timer-v2/CountdownTimerV2.astro",
);
assert(
	!countdownTimerSource.includes(
		'relatedToolIds: CatalogToolId[] = ["event-countdown", "date-range"]',
	),
	"Countdown Timer no longer uses hardcoded two-tool related list",
);
assert(
	countdownTimerSource.includes('getRelatedTools("countdown-timer")'),
	"Countdown Timer uses getRelatedTools from catalog",
);

for (const relativePath of PRODUCTION_RELATED_COMPONENTS) {
	const source = readSource(relativePath);
	assert(
		source.includes('"age-calculator": messages.tools.ageCalculator'),
		`${relativePath} maps age-calculator copy`,
	);
}

// --- Built output ---
const builtPages = [
	{
		path: "en/tools/index.html",
		requires: ["/en/age-calculator/"],
	},
	{
		path: "zh/tools/index.html",
		requires: ["/zh/age-calculator/"],
	},
	{
		path: "en/event-countdown/index.html",
		locale: "en",
		selfSlug: "event-countdown",
		related: ["date-range-calculator", "countdown-timer", "age-calculator"],
	},
	{
		path: "zh/event-countdown/index.html",
		locale: "zh",
		selfSlug: "event-countdown",
		related: ["date-range-calculator", "countdown-timer", "age-calculator"],
	},
	{
		path: "en/date-range-calculator/index.html",
		locale: "en",
		selfSlug: "date-range-calculator",
		related: ["event-countdown", "countdown-timer", "age-calculator"],
	},
	{
		path: "zh/date-range-calculator/index.html",
		locale: "zh",
		selfSlug: "date-range-calculator",
		related: ["event-countdown", "countdown-timer", "age-calculator"],
	},
	{
		path: "en/countdown-timer/index.html",
		locale: "en",
		selfSlug: "countdown-timer",
		related: ["event-countdown", "date-range-calculator", "year-progress"],
	},
	{
		path: "zh/countdown-timer/index.html",
		locale: "zh",
		selfSlug: "countdown-timer",
		related: ["event-countdown", "date-range-calculator", "year-progress"],
	},
	{
		path: "en/year-progress/index.html",
		locale: "en",
		selfSlug: "year-progress",
		related: ["event-countdown", "date-range-calculator", "age-calculator"],
	},
	{
		path: "zh/year-progress/index.html",
		locale: "zh",
		selfSlug: "year-progress",
		related: ["event-countdown", "date-range-calculator", "age-calculator"],
	},
	{
		path: "en/age-calculator/index.html",
		locale: "en",
		selfSlug: "age-calculator",
		related: ["date-range-calculator", "event-countdown", "year-progress"],
		relatedAttr: "data-acv2-related-tools",
	},
	{
		path: "zh/age-calculator/index.html",
		locale: "zh",
		selfSlug: "age-calculator",
		related: ["date-range-calculator", "event-countdown", "year-progress"],
		relatedAttr: "data-acv2-related-tools",
	},
];

for (const page of builtPages) {
	const html = readDistHtml(page.path);

	if (page.requires) {
		for (const required of page.requires) {
			assert(
				html.includes(`href="${required}"`),
				`${page.path} contains Age Calculator link ${required}`,
			);
		}
		continue;
	}

	const localePrefix = `/${page.locale}`;
	for (const slug of page.related) {
		const href = `${localePrefix}/${slug}/`;
		assert(html.includes(`href="${href}"`), `${page.path} contains related link ${href}`);
	}

	const relatedHrefs = extractRelatedHrefs(html, localePrefix);
	assert(
		relatedHrefs.length === 3,
		`${page.path} lower related section has exactly three localized links (found ${relatedHrefs.length})`,
	);

	for (const href of relatedHrefs) {
		assert(
			!href.endsWith(`/${page.selfSlug}/`),
			`${page.path} related section has no self-reference (${href})`,
		);
		assert(
			href.startsWith(`${localePrefix}/`),
			`${page.path} related link uses correct locale prefix: ${href}`,
		);
	}

	const uniqueRelated = new Set(relatedHrefs);
	assert(
		uniqueRelated.size === relatedHrefs.length,
		`${page.path} related section has no duplicate links`,
	);
}

for (const homePage of ["en/index.html", "zh/index.html"]) {
	const html = readDistHtml(homePage);
	const locale = homePage.startsWith("zh") ? "zh" : "en";
	const acHref = `/${locale}/age-calculator/`;

	assert(
		countHref(html, acHref) >= 1,
		`${homePage} contains localized Age Calculator home link`,
	);
	assert(!html.includes("life-progress"), `${homePage} does not link to life-progress slug`);
	assert(
		!html.includes("Life Progress Bar") && !html.includes("人生進度條"),
		`${homePage} has no stale Life Progress fourth-tool placeholder copy`,
	);
}

console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
	process.exit(1);
}
