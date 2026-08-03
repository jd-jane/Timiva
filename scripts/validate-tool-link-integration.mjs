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
	"days-between-dates",
	"business-days-calculator",
	"date-calculator",
	"countdown-timer",
	"year-progress",
	"age-calculator",
];

const APPROVED_RELATED_IDS = {
	"event-countdown": ["date-range", "countdown-timer", "age-calculator"],
	"date-range": ["days-between-dates", "business-days-calculator", "date-calculator"],
	"days-between-dates": ["date-range", "business-days-calculator", "date-calculator"],
	"business-days-calculator": [
		"days-between-dates",
		"date-range",
		"date-calculator",
	],
	"date-calculator": [
		"days-between-dates",
		"business-days-calculator",
		"date-range",
	],
	"countdown-timer": ["event-countdown", "date-range", "year-progress"],
	"year-progress": ["event-countdown", "date-range", "age-calculator"],
	"age-calculator": ["date-range", "days-between-dates", "event-countdown"],
};

const DATES_EVENTS_ORDER = [
	"event-countdown",
	"date-range",
	"days-between-dates",
	"business-days-calculator",
	"date-calculator",
	"age-calculator",
];

const PRODUCTION_RELATED_COMPONENTS = [
	"src/components/tools/event-countdown-v2/EventCountdownV2.astro",
	"src/components/tools/date-range-calculator-v2/DateRangeCalculatorV2.astro",
	"src/components/tools/days-between-dates-v2/DaysBetweenDatesV2.astro",
	"src/components/tools/business-days-calculator-v2/BusinessDaysCalculatorV2.astro",
	"src/components/tools/date-calculator-v2/DateCalculatorV2.astro",
	"src/components/tools/countdown-timer-v2/CountdownTimerV2.astro",
	"src/components/tools/year-progress-v2/YearProgressV2.astro",
	"src/components/tools/age-calculator-v2/AgeCalculatorV2.astro",
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
		`<section[^>]*(?:data-preview-related-tools|data-drv2-related-tools|data-ctv2-related-tools|data-ypv2-related-tools|data-acv2-related-tools|data-dbdv2-related-tools|data-bdcv2-related-tools|data-dcv2-related-tools)[^>]*>([\\s\\S]*?)</section>`,
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
		/\n  \{\n    id: "([^"]+)"[\s\S]*?slug: "([^"]+)"[\s\S]*?available: (true|false)[\s\S]*?featured: (true|false)[\s\S]*?relatedIds: (\[[^\]]+\])/g;

	for (const match of arrayBody.matchAll(entryPattern)) {
		const [, id, slug, available, featured, relatedRaw] = match;
		const relatedIds = [...relatedRaw.matchAll(/"([^"]+)"/g)].map(
			(relatedMatch) => relatedMatch[1],
		);

		tools.push({
			id,
			slug,
			available: available === "true",
			featured: featured === "true",
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
const daysBetweenEntries = catalogTools.filter(
	(tool) => tool.id === "days-between-dates",
);
assert(daysBetweenEntries.length === 1, "exactly one days-between-dates catalog entry");

const daysBetweenDates = daysBetweenEntries[0];
assert(daysBetweenDates?.available === true, "days-between-dates.available === true");
assert(
	daysBetweenDates?.slug === "days-between-dates",
	"days-between-dates slug is days-between-dates",
);

const ageCalculatorEntries = catalogTools.filter(
	(tool) => tool.id === "age-calculator",
);
assert(ageCalculatorEntries.length === 1, "exactly one age-calculator catalog entry");

const ageCalculator = ageCalculatorEntries[0];
assert(ageCalculator?.available === true, "age-calculator.available === true");
assert(ageCalculator?.slug === "age-calculator", "age-calculator slug is age-calculator");

const businessDaysEntries = catalogTools.filter(
	(tool) => tool.id === "business-days-calculator",
);
assert(
	businessDaysEntries.length === 1,
	"exactly one business-days-calculator catalog entry",
);

const businessDaysCalculator = businessDaysEntries[0];
assert(
	businessDaysCalculator?.available === true,
	"business-days-calculator.available === true",
);
assert(
	businessDaysCalculator?.featured === false,
	"business-days-calculator.featured === false",
);
assert(
	businessDaysCalculator?.slug === "business-days-calculator",
	"business-days-calculator slug is business-days-calculator",
);

for (const id of PRODUCTION_TOOL_IDS) {
	const tool = catalogTools.find((entry) => entry.id === id);
	assert(tool?.available === true, `${id} is available`);
}

const datesEventsOrder = catalogTools
	.filter((tool) => tool.available)
	.map((tool) => tool.id)
	.filter((id) => DATES_EVENTS_ORDER.includes(id));
assert(
	JSON.stringify(datesEventsOrder) === JSON.stringify(DATES_EVENTS_ORDER),
	"dates-events available order is event-countdown → date-range → days-between-dates → business-days-calculator → date-calculator → age-calculator",
);

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

assert(
	!APPROVED_RELATED_IDS["date-range"].includes("countdown-timer"),
	"date-range relatedIds no longer include countdown-timer",
);
assert(
	!APPROVED_RELATED_IDS["date-range"].includes("age-calculator"),
	"date-range relatedIds no longer include age-calculator",
);
assert(
	APPROVED_RELATED_IDS["date-range"].includes("days-between-dates"),
	"date-range relatedIds include days-between-dates",
);
assert(
	APPROVED_RELATED_IDS["date-range"].includes("business-days-calculator"),
	"date-range relatedIds include business-days-calculator",
);
assert(
	APPROVED_RELATED_IDS["date-range"].includes("date-calculator"),
	"date-range relatedIds include date-calculator",
);
assert(
	!APPROVED_RELATED_IDS["date-range"].includes("event-countdown"),
	"date-range relatedIds no longer include event-countdown",
);
assert(
	!APPROVED_RELATED_IDS["age-calculator"].includes("year-progress"),
	"age-calculator relatedIds no longer include year-progress",
);
assert(
	APPROVED_RELATED_IDS["age-calculator"].includes("days-between-dates"),
	"age-calculator relatedIds include days-between-dates",
);
assert(
	!APPROVED_RELATED_IDS["age-calculator"].includes("business-days-calculator"),
	"age-calculator relatedIds do not include business-days-calculator",
);
assert(
	!APPROVED_RELATED_IDS["event-countdown"].includes("days-between-dates"),
	"event-countdown relatedIds do not include days-between-dates",
);
assert(
	!APPROVED_RELATED_IDS["event-countdown"].includes("business-days-calculator"),
	"event-countdown relatedIds do not include business-days-calculator",
);
assert(
	!APPROVED_RELATED_IDS["year-progress"].includes("days-between-dates"),
	"year-progress relatedIds do not include days-between-dates",
);
assert(
	!APPROVED_RELATED_IDS["year-progress"].includes("business-days-calculator"),
	"year-progress relatedIds do not include business-days-calculator",
);
assert(
	!APPROVED_RELATED_IDS["countdown-timer"].includes("days-between-dates"),
	"countdown-timer relatedIds do not include days-between-dates",
);
assert(
	!APPROVED_RELATED_IDS["countdown-timer"].includes("business-days-calculator"),
	"countdown-timer relatedIds do not include business-days-calculator",
);
assert(
	!APPROVED_RELATED_IDS["days-between-dates"].includes("event-countdown"),
	"days-between-dates relatedIds no longer include event-countdown",
);
assert(
	APPROVED_RELATED_IDS["days-between-dates"].includes("business-days-calculator"),
	"days-between-dates relatedIds include business-days-calculator",
);
assert(
	APPROVED_RELATED_IDS["days-between-dates"].includes("date-calculator"),
	"days-between-dates relatedIds include date-calculator",
);
assert(
	!APPROVED_RELATED_IDS["days-between-dates"].includes("age-calculator"),
	"days-between-dates relatedIds no longer include age-calculator",
);
assert(
	APPROVED_RELATED_IDS["business-days-calculator"].includes("date-calculator"),
	"business-days-calculator relatedIds include date-calculator",
);
assert(
	!APPROVED_RELATED_IDS["business-days-calculator"].includes("event-countdown"),
	"business-days-calculator relatedIds no longer include event-countdown",
);
assert(
	JSON.stringify(APPROVED_RELATED_IDS["date-calculator"]) ===
		JSON.stringify([
			"days-between-dates",
			"business-days-calculator",
			"date-range",
		]),
	"date-calculator outbound relatedIds are DBD → BDC → date-range",
);

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
assert(
	!featuredTools.some((tool) => tool.id === "days-between-dates"),
	"Home featured tools do not include Days Between Dates",
);
assert(
	!featuredTools.some((tool) => tool.id === "business-days-calculator"),
	"Home featured tools do not include Business Days Calculator",
);
assert(
	!featuredTools.some((tool) => tool.id === "date-calculator"),
	"Home featured tools do not include Date Calculator",
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
	catalogIconMap["days-between-dates"] === "calendar",
	"catalog days-between-dates uses calendar icon (not plus-square)",
);
assert(
	catalogIconMap["days-between-dates"] !== "plus-square",
	"catalog days-between-dates does not use plus-square",
);
assert(
	catalogIconMap["business-days-calculator"] === "calendar",
	"catalog business-days-calculator uses calendar icon",
);
assert(
	catalogIconMap["date-calculator"] === "calendar",
	"catalog date-calculator uses calendar icon",
);
assert(en.tools.dateCalculator.title === "Date Calculator", "EN tools.dateCalculator exists");
assert(zh.tools.dateCalculator.title === "日期加減計算", "ZH tools.dateCalculator exists");

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
	zh.home.featuredTools["age-calculator"]?.title === "年齡計算",
	"ZH Home age-calculator title exists",
);
assert(
	zh.home.featuredTools["age-calculator"]?.description ===
		zh.tools.ageCalculator.description,
	"ZH Home age-calculator description matches catalog wording",
);
assert(en.tools.ageCalculator.title === "Age Calculator", "EN tools.ageCalculator exists");
assert(zh.tools.ageCalculator.title === "年齡計算", "ZH tools.ageCalculator exists");
assert(
	en.tools.daysBetweenDates.title === "Days Between Dates",
	"EN tools.daysBetweenDates exists",
);
assert(zh.tools.daysBetweenDates.title === "日期差計算", "ZH tools.daysBetweenDates exists");
assert(
	en.tools.businessDaysCalculator.title === "Business Days Calculator",
	"EN tools.businessDaysCalculator exists",
);
assert(
	zh.tools.businessDaysCalculator.title === "工作日計算",
	"ZH tools.businessDaysCalculator exists",
);
assert(
	zh.home.featuredTools["date-range"]?.title === "日期區間計算",
	"ZH Home date-range title uses 日期區間計算",
);
assert(zh.tools.dateRange.title === "日期區間計算", "ZH tools.dateRange uses 日期區間計算");
assert(
	!en.home.featuredTools["days-between-dates"],
	"EN Home featuredTools has no days-between-dates entry",
);
assert(
	!zh.home.featuredTools["days-between-dates"],
	"ZH Home featuredTools has no days-between-dates entry",
);
assert(
	!en.home.featuredTools["business-days-calculator"],
	"EN Home featuredTools has no business-days-calculator entry",
);
assert(
	!zh.home.featuredTools["business-days-calculator"],
	"ZH Home featuredTools has no business-days-calculator entry",
);
assert(
	!en.home.featuredTools["date-calculator"],
	"EN Home featuredTools has no date-calculator entry",
);
assert(
	!zh.home.featuredTools["date-calculator"],
	"ZH Home featuredTools has no date-calculator entry",
);

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

const daysBetweenSource = readSource(
	"src/components/tools/days-between-dates-v2/DaysBetweenDatesV2.astro",
);
assert(
	!daysBetweenSource.includes("DAYS_BETWEEN_DATES_OUTBOUND_IDS"),
	"Days Between Dates no longer uses hardcoded outbound related IDs",
);
assert(
	daysBetweenSource.includes('getRelatedTools("days-between-dates")'),
	"Days Between Dates uses getRelatedTools from catalog",
);

const ageCalculatorSource = readSource(
	"src/components/tools/age-calculator-v2/AgeCalculatorV2.astro",
);
assert(
	!ageCalculatorSource.includes("AGE_CALCULATOR_OUTBOUND_IDS"),
	"Age Calculator no longer uses hardcoded outbound related IDs",
);
assert(
	ageCalculatorSource.includes('getRelatedTools("age-calculator")'),
	"Age Calculator uses getRelatedTools from catalog",
);

const businessDaysSource = readSource(
	"src/components/tools/business-days-calculator-v2/BusinessDaysCalculatorV2.astro",
);
assert(
	businessDaysSource.includes('getRelatedTools("business-days-calculator")'),
	"Business Days Calculator uses getRelatedTools from catalog",
);

for (const relativePath of PRODUCTION_RELATED_COMPONENTS) {
	const source = readSource(relativePath);
	assert(
		source.includes('"days-between-dates": messages.tools.daysBetweenDates'),
		`${relativePath} maps days-between-dates copy`,
	);
	assert(
		source.includes(
			'"business-days-calculator": messages.tools.businessDaysCalculator',
		),
		`${relativePath} maps business-days-calculator copy`,
	);
	assert(
		source.includes('"date-calculator": messages.tools.dateCalculator'),
		`${relativePath} maps date-calculator copy`,
	);
}

// --- Built output ---
const builtPages = [
	{
		path: "en/tools/index.html",
		requires: [
			"/en/age-calculator/",
			"/en/days-between-dates/",
			"/en/business-days-calculator/",
			"/en/date-calculator/",
		],
		datesEventsOrder: [
			"/en/event-countdown/",
			"/en/date-range-calculator/",
			"/en/days-between-dates/",
			"/en/business-days-calculator/",
			"/en/date-calculator/",
			"/en/age-calculator/",
		],
	},
	{
		path: "zh/tools/index.html",
		requires: [
			"/zh/age-calculator/",
			"/zh/days-between-dates/",
			"/zh/business-days-calculator/",
			"/zh/date-calculator/",
		],
		datesEventsOrder: [
			"/zh/event-countdown/",
			"/zh/date-range-calculator/",
			"/zh/days-between-dates/",
			"/zh/business-days-calculator/",
			"/zh/date-calculator/",
			"/zh/age-calculator/",
		],
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
		related: ["days-between-dates", "business-days-calculator", "date-calculator"],
		relatedAttr: "data-drv2-related-tools",
	},
	{
		path: "zh/date-range-calculator/index.html",
		locale: "zh",
		selfSlug: "date-range-calculator",
		related: ["days-between-dates", "business-days-calculator", "date-calculator"],
		relatedAttr: "data-drv2-related-tools",
	},
	{
		path: "en/days-between-dates/index.html",
		locale: "en",
		selfSlug: "days-between-dates",
		related: ["date-range-calculator", "business-days-calculator", "date-calculator"],
		relatedAttr: "data-dbdv2-related-tools",
	},
	{
		path: "zh/days-between-dates/index.html",
		locale: "zh",
		selfSlug: "days-between-dates",
		related: ["date-range-calculator", "business-days-calculator", "date-calculator"],
		relatedAttr: "data-dbdv2-related-tools",
	},
	{
		path: "en/business-days-calculator/index.html",
		locale: "en",
		selfSlug: "business-days-calculator",
		related: ["days-between-dates", "date-range-calculator", "date-calculator"],
		relatedAttr: "data-bdcv2-related-tools",
	},
	{
		path: "zh/business-days-calculator/index.html",
		locale: "zh",
		selfSlug: "business-days-calculator",
		related: ["days-between-dates", "date-range-calculator", "date-calculator"],
		relatedAttr: "data-bdcv2-related-tools",
	},
	{
		path: "en/date-calculator/index.html",
		locale: "en",
		selfSlug: "date-calculator",
		related: ["days-between-dates", "business-days-calculator", "date-range-calculator"],
		relatedAttr: "data-dcv2-related-tools",
	},
	{
		path: "zh/date-calculator/index.html",
		locale: "zh",
		selfSlug: "date-calculator",
		related: ["days-between-dates", "business-days-calculator", "date-range-calculator"],
		relatedAttr: "data-dcv2-related-tools",
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
		related: ["date-range-calculator", "days-between-dates", "event-countdown"],
		relatedAttr: "data-acv2-related-tools",
	},
	{
		path: "zh/age-calculator/index.html",
		locale: "zh",
		selfSlug: "age-calculator",
		related: ["date-range-calculator", "days-between-dates", "event-countdown"],
		relatedAttr: "data-acv2-related-tools",
	},
];

for (const page of builtPages) {
	const html = readDistHtml(page.path);

	if (page.requires) {
		for (const required of page.requires) {
			assert(
				html.includes(`href="${required}"`),
				`${page.path} contains tool link ${required}`,
			);
		}

		if (page.datesEventsOrder) {
			const positions = page.datesEventsOrder.map((href) =>
				html.indexOf(`href="${href}"`),
			);
			assert(
				positions.every((position) => position >= 0),
				`${page.path} contains all dates-events links in expected set`,
			);
			assert(
				positions.every(
					(position, index) => index === 0 || positions[index - 1] < position,
				),
				`${page.path} dates-events order is EC → DRC → DBD → BDC → DC → AC`,
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

	if (page.selfSlug === "date-range-calculator") {
		assert(
			!relatedHrefs.some((href) => href.endsWith("/countdown-timer/")),
			`${page.path} related section no longer links to countdown-timer`,
		);
		assert(
			!relatedHrefs.some((href) => href.endsWith("/age-calculator/")),
			`${page.path} related section no longer links to age-calculator`,
		);
		assert(
			!relatedHrefs.some((href) => href.endsWith("/event-countdown/")),
			`${page.path} related section no longer links to event-countdown`,
		);
		assert(
			relatedHrefs.includes(`${localePrefix}/days-between-dates/`) &&
				relatedHrefs.includes(`${localePrefix}/business-days-calculator/`) &&
				relatedHrefs.includes(`${localePrefix}/date-calculator/`),
			`${page.path} related section is Days Between Dates → Business Days Calculator → Date Calculator`,
		);
	}

	if (page.selfSlug === "age-calculator") {
		assert(
			!relatedHrefs.some((href) => href.endsWith("/year-progress/")),
			`${page.path} related section no longer links to year-progress`,
		);
		assert(
			!relatedHrefs.some((href) => href.endsWith("/business-days-calculator/")),
			`${page.path} related section does not link to business-days-calculator`,
		);
		assert(
			relatedHrefs.some((href) => href.endsWith("/days-between-dates/")),
			`${page.path} related section links to days-between-dates`,
		);
	}

	if (page.selfSlug === "days-between-dates") {
		assert(
			relatedHrefs.includes(`${localePrefix}/date-range-calculator/`) &&
				relatedHrefs.includes(`${localePrefix}/business-days-calculator/`) &&
				relatedHrefs.includes(`${localePrefix}/date-calculator/`),
			`${page.path} related section is Date Range → Business Days Calculator → Date Calculator`,
		);
		assert(
			!relatedHrefs.some((href) => href.endsWith("/event-countdown/")),
			`${page.path} related section no longer links to event-countdown`,
		);
		assert(
			!relatedHrefs.some((href) => href.endsWith("/age-calculator/")),
			`${page.path} related section no longer links to age-calculator`,
		);
	}

	if (page.selfSlug === "business-days-calculator") {
		assert(
			relatedHrefs.includes(`${localePrefix}/days-between-dates/`) &&
				relatedHrefs.includes(`${localePrefix}/date-range-calculator/`) &&
				relatedHrefs.includes(`${localePrefix}/date-calculator/`),
			`${page.path} related section is Days Between Dates → Date Range → Date Calculator`,
		);
		assert(
			!relatedHrefs.some((href) => href.endsWith("/event-countdown/")),
			`${page.path} related section no longer links to event-countdown`,
		);
	}

	if (page.selfSlug === "date-calculator") {
		assert(
			relatedHrefs.includes(`${localePrefix}/days-between-dates/`) &&
				relatedHrefs.includes(`${localePrefix}/business-days-calculator/`) &&
				relatedHrefs.includes(`${localePrefix}/date-range-calculator/`),
			`${page.path} related section is Days Between Dates → Business Days Calculator → Date Range`,
		);
	}

	if (
		page.selfSlug === "event-countdown" ||
		page.selfSlug === "countdown-timer" ||
		page.selfSlug === "year-progress"
	) {
		assert(
			!relatedHrefs.some((href) => href.endsWith("/business-days-calculator/")),
			`${page.path} related section does not link to business-days-calculator`,
		);
	}
}

for (const homePage of ["en/index.html", "zh/index.html"]) {
	const html = readDistHtml(homePage);
	const locale = homePage.startsWith("zh") ? "zh" : "en";
	const acHref = `/${locale}/age-calculator/`;
	const dbdHref = `/${locale}/days-between-dates/`;
	const bdcHref = `/${locale}/business-days-calculator/`;
	const dcHref = `/${locale}/date-calculator/`;

	assert(
		countHref(html, acHref) >= 1,
		`${homePage} contains localized Age Calculator home link`,
	);
	assert(
		countHref(html, dbdHref) === 0,
		`${homePage} does not contain Days Between Dates featured link`,
	);
	assert(
		countHref(html, bdcHref) === 0,
		`${homePage} does not contain Business Days Calculator featured link`,
	);
	assert(
		countHref(html, dcHref) === 0,
		`${homePage} does not contain Date Calculator featured link`,
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
