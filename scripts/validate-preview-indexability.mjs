/**
 * Timiva preview indexability validator — reads dist output only (no network).
 * Run after: npm run build
 * Run: node scripts/validate-preview-indexability.mjs
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const DIST = join(ROOT, "dist");
const PREVIEW_DIST = join(DIST, "preview");
const SITEMAP_INDEX = join(DIST, "sitemap-index.xml");
const SITEMAP = join(DIST, "sitemap-0.xml");
const SITE = "https://timiva.app";

const CLASSIFICATION = {
	"/preview/home/": "A — Layout baseline",
	"/preview/all-tools/": "A — Layout baseline",
	"/preview/tool/": "A — Layout baseline",
	"/preview/text/": "A — Layout baseline",
	"/preview/mobile-sheet-shared-style/": "B — Shared component baseline",
	"/preview/event-countdown-v2/": "C — Legacy tool preview candidate",
};

const FORMAL_HTML = [
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
	"en/privacy/index.html",
	"zh/privacy/index.html",
	"en/terms/index.html",
	"zh/terms/index.html",
	"en/contact/index.html",
	"zh/contact/index.html",
];

let passed = 0;
let failed = 0;

function fail(route, field, expected, actual) {
	failed += 1;
	console.error(
		`FAIL: ${route} · ${field} · expected: ${expected} · actual: ${actual}`,
	);
}

function pass() {
	passed += 1;
}

function findPreviewHtmlFiles(dir, files = []) {
	if (!existsSync(dir)) return files;

	for (const entry of readdirSync(dir)) {
		const fullPath = join(dir, entry);
		const stats = statSync(fullPath);
		if (stats.isDirectory()) {
			findPreviewHtmlFiles(fullPath, files);
		} else if (entry === "index.html") {
			files.push(fullPath);
		}
	}

	return files;
}

function fileToRoute(filePath) {
	const rel = relative(DIST, filePath).replace(/\\/g, "/");
	const withoutIndex = rel.replace(/index\.html$/, "");
	return `/${withoutIndex}`;
}

function extractRobotsMetas(html) {
	return [...html.matchAll(/<meta[^>]*name=["']robots["'][^>]*>/gi)].map((match) => {
		const tag = match[0];
		return tag.match(/content=["']([^"']*)["']/i)?.[1] ?? "";
	});
}

function parseRobotsTokens(content) {
	return content
		.toLowerCase()
		.split(",")
		.map((token) => token.trim())
		.filter(Boolean);
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

function hasPreviewLink(html) {
	return /href=["'][^"']*\/preview\//i.test(html);
}

function hasRobotsDirective(html, directive) {
	const metas = extractRobotsMetas(html);
	for (const content of metas) {
		if (parseRobotsTokens(content).includes(directive)) {
			return true;
		}
	}
	return false;
}

const previewFiles = findPreviewHtmlFiles(PREVIEW_DIST);

if (previewFiles.length === 0) {
	fail("/preview/", "discovery", "at least 1 preview route", "0");
} else {
	pass();
}

const previewRoutes = previewFiles.map(fileToRoute).sort();
console.log(`Preview routes discovered: ${previewRoutes.length}`);
for (const route of previewRoutes) {
	const classification = CLASSIFICATION[route] ?? "D — Unknown (keep + noindex)";
	console.log(`  ${route} — ${classification}`);
}

const layoutBaseline = previewRoutes.filter((route) => CLASSIFICATION[route]?.startsWith("A"));
const sharedBaseline = previewRoutes.filter((route) => CLASSIFICATION[route]?.startsWith("B"));
const legacyCandidates = previewRoutes.filter((route) => CLASSIFICATION[route]?.startsWith("C"));
const unknownRoutes = previewRoutes.filter((route) => !CLASSIFICATION[route]);

console.log(`Classification summary: A=${layoutBaseline.length}, B=${sharedBaseline.length}, C=${legacyCandidates.length}, D=${unknownRoutes.length}`);

for (const filePath of previewFiles) {
	const route = fileToRoute(filePath);
	const html = readFileSync(filePath, "utf8");
	const robotsMetas = extractRobotsMetas(html);
	const canonicals = extractCanonicals(html);
	const alternates = extractAlternates(html);

	if (robotsMetas.length === 1) pass();
	else fail(route, "robots meta count", "1", String(robotsMetas.length));

	const tokens = parseRobotsTokens(robotsMetas[0] ?? "");

	if (tokens.includes("noindex")) pass();
	else fail(route, "robots noindex", "present", robotsMetas[0] ?? "missing");

	if (tokens.includes("nofollow")) pass();
	else fail(route, "robots nofollow", "present", robotsMetas[0] ?? "missing");

	if (!tokens.includes("index")) pass();
	else fail(route, "robots index token", "absent", robotsMetas[0] ?? "missing");

	if (!tokens.includes("follow")) pass();
	else fail(route, "robots follow token", "absent", robotsMetas[0] ?? "missing");

	if (canonicals.length === 0) pass();
	else fail(route, "canonical count", "0", String(canonicals.length));

	if (alternates.length === 0) pass();
	else fail(route, "hreflang alternate count", "0", String(alternates.length));
}

if (!existsSync(SITEMAP_INDEX)) {
	fail("sitemap-index.xml", "file", "present", "missing");
} else {
	pass();
}

if (!existsSync(SITEMAP)) {
	fail("sitemap-0.xml", "file", "present", "missing");
} else {
	pass();
}

const sitemapXml = existsSync(SITEMAP) ? readFileSync(SITEMAP, "utf8") : "";
const sitemapUrls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

if (sitemapUrls.length === 18) pass();
else fail("sitemap-0.xml", "URL count", "18", String(sitemapUrls.length));

for (const url of sitemapUrls) {
	if (!url.includes("/preview/")) pass();
	else fail("sitemap-0.xml", "preview exclusion", "no /preview/", url);
}

for (const file of FORMAL_HTML) {
	const route = `/${file.replace(/index\.html$/, "")}`;
	const filePath = join(DIST, file);

	if (!existsSync(filePath)) {
		fail(route, "formal HTML", file, "missing");
		continue;
	}
	pass();

	const html = readFileSync(filePath, "utf8");

	if (!hasRobotsDirective(html, "noindex")) pass();
	else fail(route, "formal noindex", "absent", "present");

	if (!hasRobotsDirective(html, "nofollow")) pass();
	else fail(route, "formal nofollow", "absent", "present");

	if (!hasPreviewLink(html)) pass();
	else fail(route, "preview link", "absent", "present");
}

console.log(`validate-preview-indexability: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
