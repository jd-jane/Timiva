/**
 * Timiva SEO head validator — reads dist output only (no network).
 * Run after: npm run build
 * Run: node scripts/validate-seo-head.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const DIST = join(ROOT, "dist");
const SITE = "https://timiva.app";

const PAGES = [
	{ route: "/en/", file: "en/index.html", canonical: `${SITE}/en/` },
	{ route: "/zh/", file: "zh/index.html", canonical: `${SITE}/zh/` },
	{ route: "/en/tools/", file: "en/tools/index.html", canonical: `${SITE}/en/tools/` },
	{ route: "/zh/tools/", file: "zh/tools/index.html", canonical: `${SITE}/zh/tools/` },
	{
		route: "/en/event-countdown/",
		file: "en/event-countdown/index.html",
		canonical: `${SITE}/en/event-countdown/`,
	},
	{
		route: "/zh/event-countdown/",
		file: "zh/event-countdown/index.html",
		canonical: `${SITE}/zh/event-countdown/`,
	},
	{
		route: "/en/date-range-calculator/",
		file: "en/date-range-calculator/index.html",
		canonical: `${SITE}/en/date-range-calculator/`,
	},
	{
		route: "/zh/date-range-calculator/",
		file: "zh/date-range-calculator/index.html",
		canonical: `${SITE}/zh/date-range-calculator/`,
	},
	{
		route: "/en/countdown-timer/",
		file: "en/countdown-timer/index.html",
		canonical: `${SITE}/en/countdown-timer/`,
	},
	{
		route: "/zh/countdown-timer/",
		file: "zh/countdown-timer/index.html",
		canonical: `${SITE}/zh/countdown-timer/`,
	},
	{
		route: "/en/year-progress/",
		file: "en/year-progress/index.html",
		canonical: `${SITE}/en/year-progress/`,
	},
	{
		route: "/zh/year-progress/",
		file: "zh/year-progress/index.html",
		canonical: `${SITE}/zh/year-progress/`,
	},
	{
		route: "/en/age-calculator/",
		file: "en/age-calculator/index.html",
		canonical: `${SITE}/en/age-calculator/`,
	},
	{
		route: "/zh/age-calculator/",
		file: "zh/age-calculator/index.html",
		canonical: `${SITE}/zh/age-calculator/`,
	},
	{ route: "/en/privacy/", file: "en/privacy/index.html", canonical: `${SITE}/en/privacy/` },
	{ route: "/zh/privacy/", file: "zh/privacy/index.html", canonical: `${SITE}/zh/privacy/` },
	{ route: "/en/terms/", file: "en/terms/index.html", canonical: `${SITE}/en/terms/` },
	{ route: "/zh/terms/", file: "zh/terms/index.html", canonical: `${SITE}/zh/terms/` },
	{ route: "/en/contact/", file: "en/contact/index.html", canonical: `${SITE}/en/contact/` },
	{ route: "/zh/contact/", file: "zh/contact/index.html", canonical: `${SITE}/zh/contact/` },
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

function fail(route, field, expected, actual) {
	failed += 1;
	console.error(
		`FAIL: ${route} · ${field} · expected: ${expected} · actual: ${actual}`,
	);
}

function pass() {
	passed += 1;
}

function extractCanonicals(html) {
	return [
		...html.matchAll(/<link[^>]*rel=["']canonical["'][^>]*>/gi),
		...html.matchAll(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/gi),
	]
		.map((match) => {
			const tag = match[0];
			return tag.match(/href=["']([^"']+)["']/i)?.[1] ?? "";
		})
		.filter(Boolean);
}

function extractAlternates(html) {
	return [...html.matchAll(/<link[^>]*rel=["']alternate["'][^>]*>/gi)].map((match) => {
		const tag = match[0];
		return {
			hreflang: tag.match(/hreflang=["']([^"']+)["']/i)?.[1] ?? "",
			href: tag.match(/href=["']([^"']+)["']/i)?.[1] ?? "",
		};
	});
}

function extractMetaDescription(html) {
	return (
		html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)?.[1] ??
		html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i)?.[1] ??
		""
	);
}

const canonicalByRoute = Object.fromEntries(PAGES.map((page) => [page.route, page.canonical]));

for (const page of PAGES) {
	const filePath = join(DIST, page.file);
	if (!existsSync(filePath)) {
		fail(page.route, "build HTML", page.file, "missing");
		continue;
	}
	pass();

	const html = readFileSync(filePath, "utf8");
	const canonicals = extractCanonicals(html);
	const alternates = extractAlternates(html);
	const titleCount = (html.match(/<title>/gi) ?? []).length;
	const description = extractMetaDescription(html);

	if (titleCount === 1) pass();
	else fail(page.route, "title count", "1", String(titleCount));

	if (description) pass();
	else fail(page.route, "meta description", "present", "missing");

	if (canonicals.length === 1) pass();
	else fail(page.route, "canonical count", "1", String(canonicals.length));

	const canonical = canonicals[0];
	if (canonical === page.canonical) pass();
	else fail(page.route, "canonical href", page.canonical, canonical ?? "missing");

	if (canonical?.startsWith(`${SITE}/`)) pass();
	else fail(page.route, "canonical host", SITE, canonical ?? "missing");

	if (canonical?.endsWith("/")) pass();
	else fail(page.route, "canonical trailing slash", "ends with /", canonical ?? "missing");

	for (const forbidden of ["www.timiva.app", "pages.dev", "localhost", "/all-tools/"]) {
		if (canonical?.includes(forbidden)) {
			fail(page.route, "canonical forbidden fragment", `not ${forbidden}`, canonical);
		} else if (canonical) {
			pass();
		}
	}

	if (canonical === `${SITE}/`) {
		fail(page.route, "canonical root", "not root", canonical);
	} else {
		pass();
	}

	if (alternates.length === 3) pass();
	else fail(page.route, "alternate count", "3", String(alternates.length));

	const enAlt = alternates.filter((link) => link.hreflang === "en");
	const zhAlt = alternates.filter((link) => link.hreflang === "zh-Hant");
	const xDefault = alternates.filter((link) => link.hreflang === "x-default");

	if (enAlt.length === 1) pass();
	else fail(page.route, "hreflang en count", "1", String(enAlt.length));

	if (zhAlt.length === 1) pass();
	else fail(page.route, "hreflang zh-Hant count", "1", String(zhAlt.length));

	if (xDefault.length === 1) pass();
	else fail(page.route, "hreflang x-default count", "1", String(xDefault.length));

	const enPath = page.route.startsWith("/zh/") ? page.route.replace("/zh/", "/en/") : page.route;
	const zhPath = page.route.startsWith("/en/") ? page.route.replace("/en/", "/zh/") : page.route;
	const expectedEn = canonicalByRoute[enPath];
	const expectedZh = canonicalByRoute[zhPath];

	if (enAlt[0]?.href === expectedEn) pass();
	else fail(page.route, "hreflang en href", expectedEn, enAlt[0]?.href ?? "missing");

	if (zhAlt[0]?.href === expectedZh) pass();
	else fail(page.route, "hreflang zh-Hant href", expectedZh, zhAlt[0]?.href ?? "missing");

	if (xDefault[0]?.href === expectedEn) pass();
	else fail(page.route, "hreflang x-default href", expectedEn, xDefault[0]?.href ?? "missing");

	for (const link of alternates) {
		if (link.href.startsWith(`${SITE}/`) && link.href.endsWith("/")) pass();
		else fail(page.route, "alternate URL format", `${SITE}/.../`, link.href);
	}
}

for (const [enRoute, zhRoute] of PAIRS) {
	const enFile = PAGES.find((page) => page.route === enRoute)?.file;
	const zhFile = PAGES.find((page) => page.route === zhRoute)?.file;
	if (!enFile || !zhFile) continue;

	const enHtml = readFileSync(join(DIST, enFile), "utf8");
	const zhHtml = readFileSync(join(DIST, zhFile), "utf8");
	const enAlts = extractAlternates(enHtml);
	const zhAlts = extractAlternates(zhHtml);

	const enZhTarget = enAlts.find((link) => link.hreflang === "zh-Hant")?.href;
	const zhEnTarget = zhAlts.find((link) => link.hreflang === "en")?.href;

	if (enZhTarget === canonicalByRoute[zhRoute]) pass();
	else fail(enRoute, "EN→ZH symmetry", canonicalByRoute[zhRoute], enZhTarget ?? "missing");

	if (zhEnTarget === canonicalByRoute[enRoute]) pass();
	else fail(zhRoute, "ZH→EN symmetry", canonicalByRoute[enRoute], zhEnTarget ?? "missing");
}

console.log(`validate-seo-head: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
