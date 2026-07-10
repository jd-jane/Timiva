/**
 * Timiva sitemap validator — reads dist output only (no network).
 * Run after: npm run build
 * Run: node scripts/validate-sitemap.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const DIST = join(ROOT, "dist");
const SITE = "https://timiva.app";
const SITEMAP_INDEX = join(DIST, "sitemap-index.xml");
const SITEMAP = join(DIST, "sitemap-0.xml");
const ROBOTS = join(DIST, "robots.txt");

const EXPECTED_URLS = [
	`${SITE}/en/`,
	`${SITE}/zh/`,
	`${SITE}/en/tools/`,
	`${SITE}/zh/tools/`,
	`${SITE}/en/event-countdown/`,
	`${SITE}/zh/event-countdown/`,
	`${SITE}/en/date-range-calculator/`,
	`${SITE}/zh/date-range-calculator/`,
	`${SITE}/en/countdown-timer/`,
	`${SITE}/zh/countdown-timer/`,
	`${SITE}/en/year-progress/`,
	`${SITE}/zh/year-progress/`,
	`${SITE}/en/age-calculator/`,
	`${SITE}/zh/age-calculator/`,
	`${SITE}/en/privacy/`,
	`${SITE}/zh/privacy/`,
	`${SITE}/en/terms/`,
	`${SITE}/zh/terms/`,
	`${SITE}/en/contact/`,
	`${SITE}/zh/contact/`,
];

const EXPECTED_HTML = [
	"en/index.html",
	"zh/index.html",
	"en/tools/index.html",
	"zh/tools/index.html",
	"en/event-countdown/index.html",
	"zh/event-countdown/index.html",
	"en/date-range-calculator/index.html",
	"zh/date-range-calculator/index.html",
	"en/countdown-timer/index.html",
	"zh/countdown-timer/index.html",
	"en/year-progress/index.html",
	"zh/year-progress/index.html",
	"en/age-calculator/index.html",
	"zh/age-calculator/index.html",
	"en/privacy/index.html",
	"zh/privacy/index.html",
	"en/terms/index.html",
	"zh/terms/index.html",
	"en/contact/index.html",
	"zh/contact/index.html",
];

const PAIRS = [
	["/en/", "/zh/"],
	["/en/tools/", "/zh/tools/"],
	["/en/event-countdown/", "/zh/event-countdown/"],
	["/en/date-range-calculator/", "/zh/date-range-calculator/"],
	["/en/countdown-timer/", "/zh/countdown-timer/"],
	["/en/year-progress/", "/zh/year-progress/"],
	["/en/age-calculator/", "/zh/age-calculator/"],
	["/en/privacy/", "/zh/privacy/"],
	["/en/terms/", "/zh/terms/"],
	["/en/contact/", "/zh/contact/"],
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

function extractLocs(xml) {
	return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

function extractUrlBlocks(xml) {
	return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((match) => match[1]);
}

function extractAlternates(block) {
	return [...block.matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)].map((match) => ({
		hreflang: match[1],
		href: match[2],
	}));
}

assert(existsSync(SITEMAP_INDEX), "dist/sitemap-index.xml exists");
assert(existsSync(SITEMAP), "dist/sitemap-0.xml exists");
assert(existsSync(ROBOTS), "dist/robots.txt exists");

const indexXml = readFileSync(SITEMAP_INDEX, "utf8");
const sitemapXml = readFileSync(SITEMAP, "utf8");
const robotsTxt = readFileSync(ROBOTS, "utf8");

assert(indexXml.includes("<?xml"), "sitemap-index.xml is XML");
assert(indexXml.includes(`${SITE}/sitemap-0.xml`), "sitemap-index points to sitemap-0.xml");
assert(!indexXml.includes("localhost"), "sitemap-index has no localhost");
assert(!indexXml.includes("pages.dev"), "sitemap-index has no pages.dev");
assert(!indexXml.includes("www.timiva.app"), "sitemap-index has no www");

const locs = extractLocs(sitemapXml);
assert(locs.length === 20, `sitemap has 20 URLs (got ${locs.length})`);
assert(new Set(locs).size === locs.length, "sitemap URLs are unique");

for (const url of EXPECTED_URLS) {
	assert(locs.includes(url), `expected URL present: ${url}`);
}

for (const url of locs) {
	assert(url.startsWith(`${SITE}/`), `URL uses timiva.app: ${url}`);
	assert(url.endsWith("/"), `URL has trailing slash: ${url}`);
	assert(!url.includes("localhost"), `no localhost in URL: ${url}`);
	assert(!url.includes("pages.dev"), `no pages.dev in URL: ${url}`);
	assert(!url.includes("www.timiva.app"), `no www in URL: ${url}`);
	assert(url !== `${SITE}/`, `root path excluded: ${url}`);
	assert(!url.includes("/preview/"), `preview excluded: ${url}`);
}

const forbidden = locs.filter((url) => !EXPECTED_URLS.includes(url));
assert(forbidden.length === 0, `no unexpected URLs: ${forbidden.join(", ")}`);

for (const relativePath of EXPECTED_HTML) {
	assert(existsSync(join(DIST, relativePath)), `built HTML exists: ${relativePath}`);
}

for (const block of extractUrlBlocks(sitemapXml)) {
	const locMatch = block.match(/<loc>([^<]+)<\/loc>/);
	const loc = locMatch?.[1] ?? "";
	const alternates = extractAlternates(block);

	assert(alternates.length === 2, `alternate links count for ${loc}`);
	assert(
		alternates.some((link) => link.hreflang === "en-US"),
		`en-US alternate for ${loc}`,
	);
	assert(
		alternates.some((link) => link.hreflang === "zh-TW"),
		`zh-TW alternate for ${loc}`,
	);

	for (const link of alternates) {
		assert(link.href.startsWith(`${SITE}/`), `alternate uses timiva.app: ${link.href}`);
		assert(link.href.endsWith("/"), `alternate has trailing slash: ${link.href}`);
	}
}

for (const [enPath, zhPath] of PAIRS) {
	const enUrl = `${SITE}${enPath}`;
	const zhUrl = `${SITE}${zhPath}`;
	const enBlock = extractUrlBlocks(sitemapXml).find((block) => block.includes(`<loc>${enUrl}</loc>`));
	const zhBlock = extractUrlBlocks(sitemapXml).find((block) => block.includes(`<loc>${zhUrl}</loc>`));

	assert(Boolean(enBlock), `EN block exists: ${enUrl}`);
	assert(Boolean(zhBlock), `ZH block exists: ${zhUrl}`);

	if (enBlock) {
		const alternates = extractAlternates(enBlock);
		assert(
			alternates.some((link) => link.hreflang === "en-US" && link.href === enUrl),
			`EN block self en-US: ${enUrl}`,
		);
		assert(
			alternates.some((link) => link.hreflang === "zh-TW" && link.href === zhUrl),
			`EN block zh-TW pair: ${enUrl}`,
		);
	}
}

assert(
	robotsTxt.includes("Sitemap: https://timiva.app/sitemap-index.xml"),
	"robots.txt declares sitemap-index.xml",
);
assert(!robotsTxt.includes("pages.dev"), "robots.txt has no pages.dev");
assert(robotsTxt.includes("User-agent: *"), "robots.txt has User-agent");
assert(robotsTxt.includes("Allow: /"), "robots.txt allows /");

console.log(`validate-sitemap: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
