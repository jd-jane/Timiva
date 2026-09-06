/**
 * Tool category display labels validator (label-only contract).
 * Run after: npm run build
 * Run: node scripts/validate-tool-category-labels.mjs
 *
 * Asserts formal All Tools category labels, empty Daily Rhythm hide,
 * and that catalog keys / ownership / relatedIds were not changed.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { en } from "../src/i18n/en.ts";
import { zh } from "../src/i18n/zh.ts";

const ROOT = new URL("..", import.meta.url).pathname;
const DIST = join(ROOT, "dist");

const FORMAL_LABELS = {
	en: {
		datesEvents: "Important Dates",
		productivity: "Timers & Focus",
		bodyFlow: "Daily Rhythm",
		momentum: "Life Progress",
	},
	zh: {
		datesEvents: "重要日子",
		productivity: "計時與專注",
		bodyFlow: "日常節奏",
		momentum: "人生進度",
	},
};

const LEGACY_LABELS = {
	en: ["Dates & Events", "Productivity", "Body & Flow", "Momentum", "Focus & Rhythm"],
	zh: ["日期與事件", "效率與計時", "身體與節奏", "長期進度"],
};

const STABLE_CATEGORY_IDS = [
	"dates-events",
	"productivity",
	"body-flow",
	"momentum",
];

const EXPECTED_CATEGORY_ASSIGNMENTS = {
	"event-countdown": "dates-events",
	"date-range": "dates-events",
	"days-between-dates": "dates-events",
	"business-days-calculator": "dates-events",
	"age-calculator": "dates-events",
	"countdown-timer": "productivity",
	"year-progress": "momentum",
	"date-calculator": "dates-events",
	"hours-calculator": "dates-events",
	"japanese-era-converter": "dates-events",
	"lunar-date-converter": "dates-events",
	"life-progress": "momentum",
};

const EXPECTED_RELATED_IDS = {
	"event-countdown": ["date-range", "countdown-timer", "age-calculator"],
	"date-range": ["days-between-dates", "business-days-calculator", "date-calculator"],
	"days-between-dates": ["date-range", "business-days-calculator", "date-calculator"],
	"business-days-calculator": [
		"days-between-dates",
		"date-range",
		"hours-calculator",
	],
	"countdown-timer": ["event-countdown", "date-range", "year-progress"],
	"year-progress": ["event-countdown", "date-range", "age-calculator"],
	"age-calculator": ["date-range", "days-between-dates", "japanese-era-converter"],
	"date-calculator": [
		"days-between-dates",
		"business-days-calculator",
		"date-range",
	],
	"hours-calculator": [
		"days-between-dates",
		"business-days-calculator",
		"date-calculator",
	],
	"japanese-era-converter": [
		"date-calculator",
		"age-calculator",
		"lunar-date-converter",
	],
	"lunar-date-converter": ["japanese-era-converter", "age-calculator"],
};

const DATES_EVENTS_ORDER = [
	"event-countdown",
	"date-range",
	"days-between-dates",
	"business-days-calculator",
	"date-calculator",
	"hours-calculator",
	"japanese-era-converter",
	"lunar-date-converter",
	"age-calculator",
];

const VISIBLE_CATEGORY_IDS = ["dates-events", "productivity", "momentum"];

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

function read(relPath) {
	return readFileSync(join(ROOT, relPath), "utf8");
}

function readDist(relPath) {
	const filePath = join(DIST, relPath);
	assert(existsSync(filePath), `built file exists: ${relPath}`);
	if (!existsSync(filePath)) {
		return "";
	}

	return readFileSync(filePath, "utf8");
}

function decodeBasicEntities(text) {
	return text
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'");
}

function extractH2Texts(html) {
	return [...html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)].map((match) =>
		decodeBasicEntities(
			match[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(),
		),
	);
}

function htmlIncludesLabel(html, label) {
	return decodeBasicEntities(html).includes(label);
}

function parseToolCategories(source) {
	const blockStart = source.indexOf("export const toolCategories = [");
	const block = source.slice(blockStart, source.indexOf("] as const;", blockStart));
	return [...block.matchAll(/id: "([^"]+)"/g)].map((match) => match[1]);
}

function parseCatalogTools(source) {
	const arrayStart = source.indexOf("export const catalogTools:");
	const arrayBody = source.slice(arrayStart);
	const tools = [];
	const entryPattern =
		/\n  \{\n    id: "([^"]+)"[\s\S]*?slug: "([^"]+)"[\s\S]*?categoryId: "([^"]+)"[\s\S]*?available: (true|false)[\s\S]*?featured: (true|false)[\s\S]*?relatedIds: (\[[^\]]+\])/g;

	for (const match of arrayBody.matchAll(entryPattern)) {
		const [, id, slug, categoryId, available, featured, relatedRaw] = match;
		const relatedIds = [...relatedRaw.matchAll(/"([^"]+)"/g)].map(
			(relatedMatch) => relatedMatch[1],
		);

		tools.push({
			id,
			slug,
			categoryId,
			available: available === "true",
			featured: featured === "true",
			relatedIds,
		});
	}

	return tools;
}

function getAvailableToolsGroupedByCategory(categoryIds, catalogTools) {
	return categoryIds
		.map((categoryId) => ({
			categoryId,
			tools: catalogTools.filter(
				(tool) => tool.categoryId === categoryId && tool.available,
			),
		}))
		.filter((group) => group.tools.length > 0);
}

console.log("validate-tool-category-labels");

/* --- i18n formal labels --- */
for (const [key, value] of Object.entries(FORMAL_LABELS.en)) {
	assert(
		en.allTools.categories[key] === value,
		`en.allTools.categories.${key} === "${value}"`,
	);
}

for (const [key, value] of Object.entries(FORMAL_LABELS.zh)) {
	assert(
		zh.allTools.categories[key] === value,
		`zh.allTools.categories.${key} === "${value}"`,
	);
}

/* --- stable internal category IDs --- */
const catalogSource = read("src/data/toolsCatalog.ts");
const categoryIds = parseToolCategories(catalogSource);
const catalogTools = parseCatalogTools(catalogSource);

assert(
	JSON.stringify(categoryIds) === JSON.stringify(STABLE_CATEGORY_IDS),
	"toolCategories ids remain dates-events → productivity → body-flow → momentum",
);
assert(catalogTools.length === 12, "catalogTools has 12 entries");

for (const [toolId, categoryId] of Object.entries(EXPECTED_CATEGORY_ASSIGNMENTS)) {
	const tool = catalogTools.find((entry) => entry.id === toolId);
	assert(Boolean(tool), `catalog has tool ${toolId}`);
	assert(
		tool?.categoryId === categoryId,
		`${toolId}.categoryId remains ${categoryId}`,
	);
}

for (const [toolId, relatedIds] of Object.entries(EXPECTED_RELATED_IDS)) {
	const tool = catalogTools.find((entry) => entry.id === toolId);
	assert(
		JSON.stringify(tool?.relatedIds) === JSON.stringify(relatedIds),
		`${toolId}.relatedIds unchanged`,
	);
}

const datesEventsOrder = catalogTools
	.filter((tool) => tool.available && tool.categoryId === "dates-events")
	.map((tool) => tool.id);
assert(
	JSON.stringify(datesEventsOrder) === JSON.stringify(DATES_EVENTS_ORDER),
	"dates-events available tool order unchanged",
);

const bodyFlowAvailable = catalogTools.filter(
	(tool) => tool.categoryId === "body-flow" && tool.available,
);
assert(bodyFlowAvailable.length === 0, "body-flow has zero available tools");

const grouped = getAvailableToolsGroupedByCategory(categoryIds, catalogTools);
assert(grouped.length === 3, "All Tools shows exactly 3 non-empty categories");
assert(
	JSON.stringify(grouped.map((group) => group.categoryId)) ===
		JSON.stringify(VISIBLE_CATEGORY_IDS),
	"visible category order is dates-events → productivity → momentum",
);
assert(
	!grouped.some((group) => group.categoryId === "body-flow"),
	"Daily Rhythm / body-flow is hidden when empty",
);

const availableCount = catalogTools.filter((tool) => tool.available).length;
assert(availableCount === 11, "available production tool count is 11");
assert(
	catalogTools.find((tool) => tool.id === "date-calculator")?.available === true,
	"date-calculator is available",
);
assert(
	catalogTools.find((tool) => tool.id === "hours-calculator")?.available === true,
	"hours-calculator is available",
);
assert(
	catalogTools.find((tool) => tool.id === "hours-calculator")?.featured === false,
	"hours-calculator remains non-featured",
);
assert(
	catalogTools.find((tool) => tool.id === "japanese-era-converter")?.available ===
		true,
	"japanese-era-converter is available",
);
assert(
	catalogTools.find((tool) => tool.id === "japanese-era-converter")?.featured ===
		false,
	"japanese-era-converter remains non-featured",
);
assert(
	catalogTools.find((tool) => tool.id === "japanese-era-converter")?.categoryId ===
		"dates-events",
	"japanese-era-converter category remains dates-events",
);
assert(
	catalogTools.find((tool) => tool.id === "lunar-date-converter")?.available === true,
	"lunar-date-converter is available",
);
assert(
	catalogTools.find((tool) => tool.id === "lunar-date-converter")?.featured === false,
	"lunar-date-converter remains non-featured",
);
assert(
	catalogTools.find((tool) => tool.id === "lunar-date-converter")?.categoryId ===
		"dates-events",
	"lunar-date-converter category remains dates-events",
);

/* --- built All Tools pages --- */
const enToolsHtml = readDist("en/tools/index.html");
const zhToolsHtml = readDist("zh/tools/index.html");
const enHeadings = extractH2Texts(enToolsHtml);
const zhHeadings = extractH2Texts(zhToolsHtml);

assert(
	JSON.stringify(enHeadings) ===
		JSON.stringify([
			FORMAL_LABELS.en.datesEvents,
			FORMAL_LABELS.en.productivity,
			FORMAL_LABELS.en.momentum,
		]),
	"EN All Tools h2 labels are Important Dates → Timers & Focus → Life Progress",
);
assert(
	JSON.stringify(zhHeadings) ===
		JSON.stringify([
			FORMAL_LABELS.zh.datesEvents,
			FORMAL_LABELS.zh.productivity,
			FORMAL_LABELS.zh.momentum,
		]),
	"ZH All Tools h2 labels are 重要日子 → 計時與專注 → 人生進度",
);

assert(
	!enHeadings.includes(FORMAL_LABELS.en.bodyFlow),
	"EN All Tools does not show Daily Rhythm while empty",
);
assert(
	!zhHeadings.includes(FORMAL_LABELS.zh.bodyFlow),
	"ZH All Tools does not show 日常節奏 while empty",
);

for (const legacy of LEGACY_LABELS.en) {
	assert(
		!htmlIncludesLabel(enToolsHtml, legacy),
		`EN All Tools HTML excludes legacy label "${legacy}"`,
	);
}

for (const legacy of LEGACY_LABELS.zh) {
	assert(
		!htmlIncludesLabel(zhToolsHtml, legacy),
		`ZH All Tools HTML excludes legacy label "${legacy}"`,
	);
}

/* --- preview all-tools sync --- */
const previewSource = read("src/pages/preview/all-tools.astro");
for (const title of Object.values(FORMAL_LABELS.en)) {
	assert(
		previewSource.includes(`title: "${title}"`),
		`preview/all-tools.astro includes formal title "${title}"`,
	);
}

for (const legacy of LEGACY_LABELS.en) {
	assert(
		!previewSource.includes(`title: "${legacy}"`),
		`preview/all-tools.astro excludes legacy title "${legacy}"`,
	);
}

if (existsSync(join(DIST, "preview/all-tools/index.html"))) {
	const previewHtml = readDist("preview/all-tools/index.html");
	const previewHeadings = extractH2Texts(previewHtml);
	assert(
		JSON.stringify(previewHeadings) ===
			JSON.stringify([
				FORMAL_LABELS.en.datesEvents,
				FORMAL_LABELS.en.productivity,
				FORMAL_LABELS.en.bodyFlow,
				FORMAL_LABELS.en.momentum,
			]),
		"built preview/all-tools h2 labels are the four formal EN names",
	);
}

console.log(`Result: ${passed} passed, ${failed} failed`);
if (failed > 0) {
	process.exitCode = 1;
} else {
	console.log("OK");
}
