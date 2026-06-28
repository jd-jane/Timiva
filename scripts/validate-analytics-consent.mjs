/**
 * GA4 + Analytics Consent integrated validator (Batch D).
 *
 * Usage:
 *   npm run build
 *   node scripts/validate-analytics-consent.mjs
 *   node scripts/validate-analytics-consent.mjs --dist-mode=disabled
 *   PUBLIC_GA_MEASUREMENT_ID=G-LOCALTEST npm run build
 *   node scripts/validate-analytics-consent.mjs --dist-mode=enabled
 *
 * Source checks always run. Dist checks run when --dist-mode is set or dist/ exists.
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DIST = join(ROOT, "dist");
const HARNESS = join(ROOT, "local-docs/tests/batch-a-analytics-consent-verify.mjs");

const PLACEHOLDER_ID = "G-LOCALTEST";
const LEGAL_DIR = join(ROOT, "src/content/legal");
const SOURCE_SCAN_ROOTS = [join(ROOT, "src"), join(ROOT, "public/scripts")];
const SOURCE_SCAN_SKIP = [join(ROOT, "src/content/legal")];

const distModeArg = process.argv.find((arg) => arg.startsWith("--dist-mode="));
const distMode = distModeArg ? distModeArg.split("=")[1] : null;

let passed = 0;
let failed = 0;
const sections = {};

function section(name) {
	return {
		name,
		record(condition, message) {
			assert(condition, `[${name}] ${message}`);
		},
	};
}

function assert(condition, message) {
	const sectionName = message.match(/^\[([^\]]+)\]/)?.[1] ?? "general";
	if (!sections[sectionName]) {
		sections[sectionName] = { passed: 0, failed: 0 };
	}

	if (condition) {
		passed += 1;
		sections[sectionName].passed += 1;
		return;
	}

	failed += 1;
	sections[sectionName].failed += 1;
	console.error(`FAIL: ${message}`);
}

function readSource(relativePath) {
	const filePath = join(ROOT, relativePath);
	assert(existsSync(filePath), `[files] source exists: ${relativePath}`);
	return existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
}

function collectSourceFiles(dir, files = []) {
	if (!existsSync(dir)) {
		return files;
	}

	for (const entry of readdirSync(dir)) {
		const fullPath = join(dir, entry);
		if (SOURCE_SCAN_SKIP.some((skipPath) => fullPath.startsWith(skipPath))) {
			continue;
		}

		const stat = statSync(fullPath);
		if (stat.isDirectory()) {
			collectSourceFiles(fullPath, files);
			continue;
		}

		if (/\.(ts|js|astro|mjs|css)$/.test(entry)) {
			files.push(fullPath);
		}
	}

	return files;
}

function readDistHtml(relativePath) {
	const filePath = join(DIST, relativePath);
	assert(existsSync(filePath), `[dist] built file exists: ${relativePath}`);
	return existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
}

function listDistHtmlFiles(dir = DIST, files = []) {
	if (!existsSync(dir)) {
		return files;
	}

	for (const entry of readdirSync(dir)) {
		const fullPath = join(dir, entry);
		if (statSync(fullPath).isDirectory()) {
			listDistHtmlFiles(fullPath, files);
			continue;
		}

		if (entry.endsWith(".html")) {
			files.push(fullPath);
		}
	}

	return files;
}

function includesAll(source, needles, label, s) {
	for (const needle of needles) {
		s.record(source.includes(needle), `${label} includes "${needle}"`);
	}
}

function excludesAll(source, needles, label, s) {
	for (const needle of needles) {
		s.record(!source.includes(needle), `${label} excludes "${needle}"`);
	}
}

// --- A. Measurement ID & environment ---
function validateMeasurementConfig() {
	const s = section("A-config");
	const config = readSource("src/lib/analyticsConfig.ts");

	s.record(config.includes("PUBLIC_GA_MEASUREMENT_ID"), "analyticsConfig uses PUBLIC_GA_MEASUREMENT_ID");
	s.record(config.includes("analyticsEnabled"), "analyticsConfig exports analyticsEnabled");
	s.record(
		/analyticsEnabled\s*=\s*gaMeasurementId\.length\s*>\s*0/.test(config),
		"analyticsEnabled is false when ID is empty",
	);
	s.record(!/G-[A-Z0-9]{4,}/.test(config), "analyticsConfig has no hardcoded Measurement ID");
}

// --- B. BaseLayout wiring ---
function validateBaseLayout() {
	const s = section("B-layout");
	const layout = readSource("src/layouts/BaseLayout.astro");
	const rootRedirect = readSource("src/pages/index.astro");

	s.record(layout.includes("{analyticsEnabled && <script"), "analytics-consent.js loads only when enabled");
	s.record(layout.includes("{analyticsEnabled && <AnalyticsConsent"), "AnalyticsConsent renders only when enabled");
	s.record(
		layout.includes("data-ga-measurement-id={analyticsEnabled ? gaMeasurementId : undefined}"),
		"Measurement ID uses conditional data attribute",
	);
	s.record(!layout.includes("previewAnalyticsConsent"), "no previewAnalyticsConsent hook");
	s.record(!layout.includes("middleware"), "no middleware preview hook in BaseLayout");

	s.record(!rootRedirect.includes("AnalyticsConsent"), "root redirect does not wire AnalyticsConsent");
	s.record(!rootRedirect.includes("analytics-consent.js"), "root redirect does not load analytics-consent.js");
	s.record(!rootRedirect.includes("data-ga-measurement-id"), "root redirect has no GA measurement attribute");
}

// --- C. Footer entry ---
function validateFooter() {
	const s = section("C-footer");
	const footer = readSource("src/components/Footer.astro");

	s.record(footer.includes("analyticsEnabled"), "Footer accepts analyticsEnabled prop");
	s.record(footer.includes("data-footer-analytics-settings"), "Footer exposes analytics settings trigger");
	s.record(footer.includes("<button"), "Footer uses button element for analytics settings");
	s.record(
		/analyticsEnabled\s*&&\s*\(\s*<button[\s\S]*data-footer-analytics-settings/.test(footer),
		"analytics settings button renders only when analyticsEnabled",
	);
	s.record(!footer.includes('href="#"'), "Footer analytics settings is not a dummy href link");
}

// --- D. Consent state ---
function validateConsentState() {
	const s = section("D-consent");
	const script = readSource("public/scripts/analytics-consent.js");

	s.record(script.includes('STORAGE_KEY = "timiva.analytics.consent"'), "storage key is timiva.analytics.consent");
	s.record(script.includes('CONSENT_VERSION = 1'), "consent version is 1");
	s.record(script.includes('"accepted"'), "accepted state exists");
	s.record(script.includes('"rejected"'), "rejected state exists");
	s.record(script.includes('"unknown"') || script.includes("unknown"), "unknown fallback exists");
	s.record(script.includes("createConsentResult"), "consentSaved/tagLoaded result object exists");
	s.record(script.includes("consentSaved"), "consentSaved field exists");
	s.record(script.includes("tagLoaded"), "tagLoaded field exists");
	s.record(
		/writeStoredConsent\("accepted"\)[\s\S]*createConsentResult\(false, false\)/.test(script),
		"LocalStorage write failure returns consentSaved false for accept",
	);
	s.record(!script.includes("preferredLocale"), "consent script does not touch preferredLocale");
	s.record(!script.includes("timiva-countdown-timer"), "consent script does not touch tool storage keys");
	s.record(!script.includes("timiva.yearProgress"), "consent script does not touch year progress storage key");
}

// --- E. Basic Consent Mode ---
function validateConsentMode() {
	const s = section("E-consent-mode");
	const script = readSource("public/scripts/analytics-consent.js");

	includesAll(
		script,
		[
			"analytics_storage",
			"ad_storage",
			"ad_user_data",
			"ad_personalization",
			'gtag("consent", "default"',
			'gtag("consent", "update"',
		],
		"consent mode",
		s,
	);

	s.record(/analytics_storage:\s*"denied"/.test(script), "default analytics_storage denied");
	s.record(
		/CONSENT_GRANTED_ANALYTICS[\s\S]*analytics_storage:\s*"granted"[\s\S]*ad_storage:\s*"denied"/.test(script),
		"accepted grants analytics_storage only",
	);
	s.record(
		/CONSENT_GRANTED_ANALYTICS[\s\S]*ad_user_data:\s*"denied"[\s\S]*ad_personalization:\s*"denied"/.test(script),
		"ad-related consent stays denied on accept",
	);
	s.record(
		/function initializeAnalytics[\s\S]*applyConsentDefault[\s\S]*applyConsentGranted[\s\S]*loadGtagScriptOnce[\s\S]*configureGtag/.test(
			script,
		),
		"gtag config runs after consent default/update and script load",
	);
}

// --- F. Privacy flags & forbidden integrations ---
function validatePrivacyFlags() {
	const s = section("F-privacy");
	const script = readSource("public/scripts/analytics-consent.js");
	const sourceFiles = collectSourceFiles(SOURCE_SCAN_ROOTS[0]).concat(
		collectSourceFiles(SOURCE_SCAN_ROOTS[1]),
	);
	const bundledSource = sourceFiles.map((file) => readFileSync(file, "utf8")).join("\n");

	s.record(script.includes("allow_google_signals: false"), "allow_google_signals false in config");
	s.record(
		script.includes("allow_ad_personalization_signals: false"),
		"allow_ad_personalization_signals false in config",
	);

	excludesAll(bundledSource, ["anonymize_ip"], "production source", s);
	excludesAll(bundledSource, ["GTM-"], "production source", s);
	excludesAll(
		bundledSource,
		["pagead2.googlesyndication.com", "googlesyndication.com", "adsbygoogle"],
		"production source",
		s,
	);

	const hardcodedIds = bundledSource.match(/G-[A-Z0-9]{4,}/g) ?? [];
	s.record(hardcodedIds.length === 0, `no hardcoded Measurement IDs in production source (${hardcodedIds.join(", ") || "none"})`);

	s.record(script.includes("googletagmanager.com/gtag/js"), "gtag loader URL present in consent script only");
}

// --- G. Singleton & stop tracking ---
function validateSingletonGuards() {
	const s = section("G-singleton");
	const script = readSource("public/scripts/analytics-consent.js");

	includesAll(
		script,
		[
			"__timivaGaLoaded",
			"__timivaGaScriptLoading",
			"__timivaGaPageViewSent",
			'window["ga-disable-" + measurementId]',
			"indexOf(\"_ga\") === 0",
		],
		"singleton and disable guards",
		s,
	);

	s.record(
		/if \(window\.__timivaGaLoaded === true\)[\s\S]*return Promise\.resolve\(\)/.test(script),
		"duplicate gtag.js injection guarded",
	);
	s.record(
		/if \(window\.__timivaGaPageViewSent === true\)[\s\S]*return/.test(script),
		"duplicate page_view guarded",
	);
	s.record(
		/function rejectAnalytics[\s\S]*setGaDisableFlag\(resolvedId, true\)/.test(script),
		"reject sets ga-disable true",
	);
	s.record(
		/function acceptAnalytics[\s\S]*setGaDisableFlag\(resolvedId, false\)/.test(script),
		"accept clears ga-disable false",
	);
	s.record(!script.includes(".pages.dev"), "cookie clearing does not target .pages.dev parent domain");
}

// --- H. Localhost guards ---
function validateLocalhostGuards() {
	const s = section("H-localhost");
	const script = readSource("public/scripts/analytics-consent.js");

	s.record(script.includes('"localhost"'), "localhost hostname guard exists");
	s.record(script.includes('"127.0.0.1"'), "127.0.0.1 hostname guard exists");
	s.record(
		/isLocalhostHostname[\s\S]*return false/.test(script),
		"localhost blocks analytics environment",
	);
	s.record(
		/!isAnalyticsEnvironmentAllowed\(resolvedId\)[\s\S]*createConsentResult\(true, false\)/.test(script),
		"localhost accept returns consentSaved true and tagLoaded false",
	);
}

// --- I. Consent UI & accessibility ---
function validateConsentUi() {
	const s = section("I-ui");
	const component = readSource("src/components/AnalyticsConsent.astro");

	s.record(component.includes('role="region"'), "banner uses region role");
	const bannerBlock = component.match(/data-analytics-consent-banner[\s\S]*?<\/section>/)?.[0] ?? "";
	s.record(!bannerBlock.includes("aria-modal"), "banner has no aria-modal");
	s.record(component.includes("data-analytics-banner-action=\"accepted\""), "banner Allow analytics action exists");
	s.record(component.includes("data-analytics-banner-action=\"rejected\""), "banner Necessary only action exists");

	s.record(component.includes('role="dialog"'), "settings uses dialog role");
	s.record(component.includes('aria-modal="true"'), "settings uses aria-modal true");
	s.record(component.includes("aria-labelledby"), "settings uses aria-labelledby");
	s.record(component.includes("data-analytics-settings-close"), "settings close button exists");
	s.record(component.includes("handleFocusTrap"), "settings focus trap exists");
	s.record(component.includes('event.key === "Escape"'), "settings Escape handler exists");
	s.record(component.includes("settingsTrigger.focus"), "settings focus restoration exists");
	s.record(component.includes("data-analytics-settings-save"), "settings Save button exists");
	s.record(component.includes("applySettingsSave"), "settings changes apply on Save");

	s.record(component.includes('role="radiogroup"'), "choices use radiogroup");
	s.record(component.includes('role="radio"'), "choices use radio role");
	s.record(component.includes("aria-checked"), "choices use aria-checked");
	s.record(component.includes('aria-hidden="true"'), "decorative icon is aria-hidden");

	s.record(component.includes('state === "unknown" ? null : state'), "unknown does not preselect on open");
	s.record(component.includes("closeSettings(true)"), "close/backdrop restores without implicit save");
	s.record(component.includes("isConsentSaved"), "Save checks consentSaved not tagLoaded");
	s.record(!component.includes("Allow analytics"), "component does not hardcode EN Allow analytics string");
	s.record(!component.includes("Necessary only"), "component does not hardcode EN Necessary only string");
}

// --- J. i18n ---
function validateI18n() {
	const s = section("J-i18n");
	const en = readSource("src/i18n/en.ts");
	const zh = readSource("src/i18n/zh.ts");

	const enKeys = [
		"bannerBody",
		"necessaryOnly",
		"allowAnalytics",
		"analyticsSettings",
		"settingsBody",
		"privacyLink",
		"save",
		"close",
		"bannerRegionLabel",
	];
	const zhKeys = [
		"bannerBody",
		"necessaryOnly",
		"allowAnalytics",
		"analyticsSettings",
		"settingsBody",
		"privacyLink",
		"save",
		"close",
		"bannerRegionLabel",
	];

	for (const key of enKeys) {
		s.record(new RegExp(`${key}:`).test(en), `en analytics.${key} exists`);
	}
	for (const key of zhKeys) {
		s.record(new RegExp(`${key}:`).test(zh), `zh analytics.${key} exists`);
	}

	s.record(en.includes("Analytics settings"), "en footer analyticsSettings label");
	s.record(zh.includes("分析設定"), "zh footer analyticsSettings label");
}

// --- K. Legal ---
function validateLegal() {
	const s = section("K-legal");
	const files = {
		privacyEn: readSource("src/content/legal/en/privacy.md"),
		privacyZh: readSource("src/content/legal/zh/privacy.md"),
		termsEn: readSource("src/content/legal/en/terms.md"),
		termsZh: readSource("src/content/legal/zh/terms.md"),
	};

	includesAll(files.privacyEn, ["Google Analytics 4", "Allow analytics", "Necessary only", "Analytics settings", "local storage", "14 months", "Google Signals", "User-provided data collection", "90%", "does not log or store IP"], "privacy EN", s);
	includesAll(files.privacyZh, ["Google Analytics 4", "允許分析", "僅使用必要功能", "分析設定", "本機儲存", "14 個月", "Google Signals", "user-provided data", "90%", "不會記錄或儲存 IP"], "privacy ZH", s);
	includesAll(files.privacyEn, ["may in the future", "AdSense"], "privacy EN future ads", s);
	includesAll(files.privacyZh, ["未來可能", "AdSense"], "privacy ZH future ads", s);

	includesAll(files.termsEn, ["Google Analytics 4", "Privacy Policy"], "terms EN", s);
	includesAll(files.termsZh, ["Google Analytics 4", "隱私權政策"], "terms ZH", s);
	includesAll(
		files.termsEn,
		["event countdown", "date range calculator", "countdown timer", "year progress"],
		"terms EN tool list",
		s,
	);
	includesAll(
		files.termsZh,
		["事件倒數", "日期區間", "倒數計時", "今年進度"],
		"terms ZH tool list",
		s,
	);
}

// --- Dist output ---
function validateDist(mode) {
	const s = section(`dist-${mode}`);
	const samplePages = ["en/index.html", "zh/index.html", "en/privacy/index.html"];
	const htmlFiles = listDistHtmlFiles();
	const combined = htmlFiles.map((file) => readFileSync(file, "utf8")).join("\n");

	for (const page of samplePages) {
		readDistHtml(page);
	}

	if (mode === "disabled") {
		for (const page of samplePages) {
			const html = readDistHtml(page);
			excludesAll(
				html,
				[
					"data-analytics-consent-root",
					"data-analytics-consent-banner",
					"data-footer-analytics-settings",
					"/scripts/analytics-consent.js",
					"data-ga-measurement-id",
				],
				`${page} disabled dist`,
				s,
			);
		}

		const realIds = combined.match(/G-[A-Z0-9]{4,}/g) ?? [];
		const unexpectedIds = realIds.filter((id) => id !== PLACEHOLDER_ID);
		s.record(unexpectedIds.length === 0, `dist HTML has no Measurement IDs (${unexpectedIds.join(", ") || "none"})`);
		return;
	}

	if (mode === "enabled") {
		const homeEn = readDistHtml("en/index.html");
		const homeZh = readDistHtml("zh/index.html");

		includesAll(
			homeEn,
			[
				"data-analytics-consent-root",
				"data-analytics-consent-banner",
				"data-footer-analytics-settings",
				"/scripts/analytics-consent.js",
				`data-ga-measurement-id="${PLACEHOLDER_ID}"`,
			],
			"en/index.html enabled dist",
			s,
		);
		includesAll(
			homeZh,
			[
				"data-analytics-consent-root",
				"data-footer-analytics-settings",
				"/scripts/analytics-consent.js",
			],
			"zh/index.html enabled dist",
			s,
		);

		const ids = combined.match(/G-[A-Z0-9]{4,}/g) ?? [];
		const onlyPlaceholder = ids.every((id) => id === PLACEHOLDER_ID);
		s.record(ids.length > 0 && onlyPlaceholder, `dist uses placeholder ID only (${[...new Set(ids)].join(", ")})`);
		excludesAll(combined, ["googletagmanager.com/gtag/js?id=G-"], "dist HTML", s);
	}
}

function inferDistMode() {
	if (distMode === "disabled" || distMode === "enabled") {
		return distMode;
	}

	if (!existsSync(DIST)) {
		return null;
	}

	const home = readFileSync(join(DIST, "en/index.html"), "utf8");
	return home.includes("data-analytics-consent-root") ? "enabled" : "disabled";
}

function runRuntimeHarness() {
	const s = section("runtime");
	if (!existsSync(HARNESS)) {
		s.record(false, "local runtime harness exists at local-docs/tests/batch-a-analytics-consent-verify.mjs");
		return;
	}

	const result = spawnSync(process.execPath, [HARNESS], {
		cwd: ROOT,
		encoding: "utf8",
	});

	if (result.stdout) {
		process.stdout.write(result.stdout);
	}
	if (result.stderr) {
		process.stderr.write(result.stderr);
	}

	s.record(result.status === 0, "runtime harness exits 0");
}

// --- Run ---
validateMeasurementConfig();
validateBaseLayout();
validateFooter();
validateConsentState();
validateConsentMode();
validatePrivacyFlags();
validateSingletonGuards();
validateLocalhostGuards();
validateConsentUi();
validateI18n();
validateLegal();

const resolvedDistMode = inferDistMode();
if (resolvedDistMode) {
	validateDist(resolvedDistMode);
} else {
	console.log("SKIP: dist/ not found; run npm run build before dist validation");
}

runRuntimeHarness();

console.log("\nvalidate-analytics-consent summary");
console.log(`PASS: ${passed}`);
console.log(`FAIL: ${failed}`);
if (resolvedDistMode) {
	console.log(`dist-mode: ${resolvedDistMode}`);
}

for (const [name, counts] of Object.entries(sections)) {
	if (counts.failed > 0) {
		console.log(`  ${name}: ${counts.passed} pass, ${counts.failed} fail`);
	}
}

process.exit(failed > 0 ? 1 : 0);
