/**
 * Year Progress Link Integration validator — source architecture + built output.
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
];

const APPROVED_RELATED_IDS = {
	"event-countdown": ["date-range", "countdown-timer", "year-progress"],
	"date-range": ["event-countdown", "countdown-timer", "year-progress"],
	"countdown-timer": ["event-countdown", "date-range", "year-progress"],
	"year-progress": ["event-countdown", "date-range", "countdown-timer"],
};

const PRODUCTION_RELATED_COMPONENTS = [
	"src/components/tools/event-countdown-v2/EventCountdownV2.astro",
	"src/components/tools/date-range-calculator-v2/DateRangeCalculatorV2.astro",
	"src/components/tools/countdown-timer-v2/CountdownTimerV2.astro",
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
		`<section[^>]*(?:data-preview-related-tools|data-drv2-related-tools|data-ctv2-related-tools|data-ypv2-related-tools)[^>]*>([\\s\\S]*?)</section>`,
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
const yearProgressEntries = catalogTools.filter(
	(tool) => tool.id === "year-progress",
);
assert(yearProgressEntries.length === 1, "exactly one year-progress catalog entry");

const yearProgress = yearProgressEntries[0];
assert(yearProgress?.available === true, "year-progress.available === true");

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
		JSON.stringify(["event-countdown", "date-range", "timer", "year-progress"]),
	"Home order is event-countdown, date-range, timer, year-progress",
);

const homeYearProgress = featuredTools[3];
assert(homeYearProgress?.id === "year-progress", "Home fourth tool is year-progress");
assert(homeYearProgress?.slug === "year-progress", "Home year-progress slug is year-progress");
assert(homeYearProgress?.available === true, "Home year-progress is enabled");
assert(
	homeFeaturedIconMap["year-progress"] === "progress",
	"Home year-progress icon mapping exists",
);
assert(
	catalogIconMap["year-progress"] === "progress",
	"catalog year-progress icon mapping exists",
);

assert(
	en.home.featuredTools["year-progress"]?.title === "Year Progress",
	"EN Home year-progress title exists",
);
assert(
	en.home.featuredTools["year-progress"]?.description ===
		en.tools.yearProgress.description,
	"EN Home year-progress description matches catalog wording",
);
assert(
	zh.home.featuredTools["year-progress"]?.title === "今年進度",
	"ZH Home year-progress title exists",
);
assert(
	zh.home.featuredTools["year-progress"]?.description ===
		zh.tools.yearProgress.description,
	"ZH Home year-progress description matches catalog wording",
);
assert(en.tools.yearProgress.title === "Year Progress", "EN tools.yearProgress exists");
assert(zh.tools.yearProgress.title === "今年進度", "ZH tools.yearProgress exists");

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
		source.includes('"year-progress": messages.tools.yearProgress'),
		`${relativePath} maps year-progress copy`,
	);
}

// --- Built output ---
const builtPages = [
	{
		path: "en/tools/index.html",
		requires: ["/en/year-progress/"],
	},
	{
		path: "zh/tools/index.html",
		requires: ["/zh/year-progress/"],
	},
	{
		path: "en/event-countdown/index.html",
		locale: "en",
		selfSlug: "event-countdown",
		related: ["date-range-calculator", "countdown-timer", "year-progress"],
	},
	{
		path: "zh/event-countdown/index.html",
		locale: "zh",
		selfSlug: "event-countdown",
		related: ["date-range-calculator", "countdown-timer", "year-progress"],
	},
	{
		path: "en/date-range-calculator/index.html",
		locale: "en",
		selfSlug: "date-range-calculator",
		related: ["event-countdown", "countdown-timer", "year-progress"],
	},
	{
		path: "zh/date-range-calculator/index.html",
		locale: "zh",
		selfSlug: "date-range-calculator",
		related: ["event-countdown", "countdown-timer", "year-progress"],
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
		related: ["event-countdown", "date-range-calculator", "countdown-timer"],
	},
	{
		path: "zh/year-progress/index.html",
		locale: "zh",
		selfSlug: "year-progress",
		related: ["event-countdown", "date-range-calculator", "countdown-timer"],
	},
];

for (const page of builtPages) {
	const html = readDistHtml(page.path);

	if (page.requires) {
		for (const required of page.requires) {
			assert(
				html.includes(`href="${required}"`),
				`${page.path} contains Year Progress link ${required}`,
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
	const ypHref = `/${locale}/year-progress/`;

	assert(
		countHref(html, ypHref) >= 1,
		`${homePage} contains localized Year Progress home link`,
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
