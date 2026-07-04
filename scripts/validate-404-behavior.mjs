/**
 * Timiva 404 page validator — reads dist output only (no network).
 * Run after: npm run build
 * Run: node scripts/validate-404-behavior.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const DIST = join(ROOT, "dist");
const NOT_FOUND = join(DIST, "404.html");
const SITEMAP_INDEX = join(DIST, "sitemap-index.xml");
const SITEMAP = join(DIST, "sitemap-0.xml");

const REQUIRED_HTML = [
	"index.html",
	"en/index.html",
	"zh/index.html",
	"en/tools/index.html",
	"zh/tools/index.html",
];

let passed = 0;
let failed = 0;

function fail(field, expected, actual) {
	failed += 1;
	console.error(`FAIL: ${field} · expected: ${expected} · actual: ${actual}`);
}

function pass() {
	passed += 1;
}

function parseRobotsTokens(content) {
	return content
		.toLowerCase()
		.split(",")
		.map((token) => token.trim())
		.filter(Boolean);
}

function extractRobotsMetas(html) {
	return [...html.matchAll(/<meta[^>]*name=["']robots["'][^>]*>/gi)].map((match) => {
		const tag = match[0];
		return tag.match(/content=["']([^"']*)["']/i)?.[1] ?? "";
	});
}

function extractCanonicals(html) {
	return [
		...html.matchAll(/<link[^>]*rel=["']canonical["'][^>]*>/gi),
		...html.matchAll(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/gi),
	];
}

function extractAlternates(html) {
	return [...html.matchAll(/<link[^>]*rel=["']alternate["'][^>]*>/gi)];
}

function extractMetaDescription(html) {
	return (
		html.match(/<meta[^>]*name=["']description["'][^>]*content="([^"]*)"/i)?.[1] ??
		html.match(/<meta[^>]*content="([^"]*)"[^>]*name=["']description["']/i)?.[1] ??
		html.match(/<meta[^>]*name=["']description["'][^>]*content='([^']*)'/i)?.[1] ??
		""
	);
}

if (!existsSync(NOT_FOUND)) {
	fail("dist/404.html", "present", "missing");
} else {
	pass();

	const html = readFileSync(NOT_FOUND, "utf8");

	const titleMatches = [...html.matchAll(/<title>([^<]*)<\/title>/gi)];
	if (titleMatches.length === 1) pass();
	else fail("title count", "1", String(titleMatches.length));

	const title = titleMatches[0]?.[1] ?? "";
	if (title === "Page not found | Timiva") pass();
	else fail("title text", "Page not found | Timiva", title || "missing");

	const description = extractMetaDescription(html);
	if (description) pass();
	else fail("meta description", "present", "missing");

	if (
		description ===
		"The page you're looking for doesn't exist or may have moved."
	) {
		pass();
	} else {
		fail(
			"meta description text",
			"The page you're looking for doesn't exist or may have moved.",
			description || "missing",
		);
	}

	const robotsMetas = extractRobotsMetas(html);
	if (robotsMetas.length === 1) pass();
	else fail("robots meta count", "1", String(robotsMetas.length));

	const tokens = parseRobotsTokens(robotsMetas[0] ?? "");

	if (tokens.includes("noindex")) pass();
	else fail("robots noindex", "present", robotsMetas[0] ?? "missing");

	if (tokens.includes("follow")) pass();
	else fail("robots follow", "present", robotsMetas[0] ?? "missing");

	if (!tokens.includes("index")) pass();
	else fail("robots index token", "absent", robotsMetas[0] ?? "missing");

	if (!tokens.includes("nofollow")) pass();
	else fail("robots nofollow token", "absent", robotsMetas[0] ?? "missing");

	const canonicals = extractCanonicals(html);
	if (canonicals.length === 0) pass();
	else fail("canonical count", "0", String(canonicals.length));

	const alternates = extractAlternates(html);
	if (alternates.length === 0) pass();
	else fail("hreflang alternate count", "0", String(alternates.length));

	if (!alternates.some((tag) => /hreflang=["']x-default["']/i.test(tag[0]))) pass();
	else fail("hreflang x-default", "0", "present");

	const jsonLdCount = (html.match(/type=["']application\/ld\+json["']/gi) ?? []).length;
	if (jsonLdCount === 0) pass();
	else fail("JSON-LD count", "0", String(jsonLdCount));

	const metaRefreshCount = (html.match(/<meta[^>]*http-equiv=["']refresh["']/gi) ?? []).length;
	if (metaRefreshCount === 0) pass();
	else fail("meta refresh count", "0", String(metaRefreshCount));

	const htmlWithoutScripts = html.replace(/<script\b[\s\S]*?<\/script>/gi, "");

	const redirectPatterns = [
		{ name: "location.href assignment", pattern: /\blocation\.href\s*=/ },
		{ name: "location.replace", pattern: /\blocation\.replace\s*\(/ },
		{ name: "location.assign", pattern: /\blocation\.assign\s*\(/ },
		{
			name: "setTimeout redirect",
			pattern: /setTimeout\s*\([^)]*(?:location|redirect)/i,
		},
		{ name: "meta refresh", pattern: /http-equiv=["']refresh["']/i },
	];

	for (const { name, pattern } of redirectPatterns) {
		if (!pattern.test(html)) pass();
		else fail(`redirect pattern: ${name}`, "absent", "present");
	}

	if (/window\.location\.(href|assign|replace)\b/.test(html)) {
		fail("window.location mutation", "absent", "present");
	} else {
		pass();
	}

	if (/window\.location\.pathname/.test(html)) pass();
	else fail("pathname locale detection", "present", "missing");

	const h1Matches = [...htmlWithoutScripts.matchAll(/<h1\b[^>]*>/gi)];
	if (h1Matches.length === 1) pass();
	else fail("H1 count", "1", String(h1Matches.length));

	const primaryActions = (
		htmlWithoutScripts.match(/<[^>]+data-404-role=["']primary["'][^>]*>/gi) ?? []
	).length;
	if (primaryActions === 1) pass();
	else fail("primary action count", "1", String(primaryActions));

	const secondaryActions = (
		htmlWithoutScripts.match(/<[^>]+data-404-role=["']secondary["'][^>]*>/gi) ?? []
	).length;
	if (secondaryActions === 1) pass();
	else fail("secondary action count", "1", String(secondaryActions));

	const footerCount = (html.match(/<footer\b/gi) ?? []).length;
	if (footerCount === 0) pass();
	else fail("footer output", "0", String(footerCount));

	const defaultH1 = htmlWithoutScripts.match(
		/data-404-role=["']title["'][^>]*>[\s\n]*Page not found/i,
	);
	if (defaultH1) pass();
	else fail("default EN H1", "Page not found", "missing");

	for (const string of [
		'pathname',
		'"/zh/"',
		'"/en/"',
		'preferredLocale',
		"navigator.language",
		"document.documentElement.lang",
		"Page not found",
		"The page may have moved, or the address may be incorrect.",
		"Back to home",
		"All Tools",
		'"/en/tools/"',
		"找不到這個頁面",
		"這個頁面可能已移動，或網址有誤。",
		"回首頁",
		"全部工具",
		'"/zh/tools/"',
	]) {
		if (html.includes(string)) pass();
		else fail(`locale copy or logic: ${string}`, "present", "missing");
	}

	const dualPrimaryPattern =
		/<[^>]+data-404-role=["']primary["'][^>]*>[\s\S]*<[^>]+data-404-role=["']primary["'][^>]*>/i;
	if (!dualPrimaryPattern.test(htmlWithoutScripts)) pass();
	else fail("dual primary actions", "absent", "present");

	if (!html.includes("/all-tools/")) pass();
	else fail("forbidden /all-tools/ link", "absent", "present");

	for (const forbiddenLabel of ["Switch language", "切換語言", "English home", "中文首頁"]) {
		if (!html.includes(forbiddenLabel)) pass();
		else fail(`forbidden label ${forbiddenLabel}`, "absent", "present");
	}
}

if (!existsSync(SITEMAP_INDEX)) {
	fail("sitemap-index.xml", "present", "missing");
} else {
	pass();
}

if (!existsSync(SITEMAP)) {
	fail("sitemap-0.xml", "present", "missing");
} else {
	pass();
}

const sitemapXml = existsSync(SITEMAP) ? readFileSync(SITEMAP, "utf8") : "";
const sitemapUrls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

if (sitemapUrls.length === 18) pass();
else fail("sitemap URL count", "18", String(sitemapUrls.length));

for (const forbidden of ["/404", "/404.html", "/preview/"]) {
	const hit = sitemapUrls.find((url) => url.includes(forbidden));
	if (!hit) pass();
	else fail(`sitemap exclusion ${forbidden}`, "absent", hit);
}

for (const file of REQUIRED_HTML) {
	if (existsSync(join(DIST, file))) pass();
	else fail(`required build HTML ${file}`, "present", "missing");
}

console.log(`validate-404-behavior: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
