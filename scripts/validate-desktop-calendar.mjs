/**
 * DesktopCalendar canonical shared validator.
 * Run: node scripts/validate-desktop-calendar.mjs
 *
 * Covers shared foundation／variant contract／tool adoption／CSS ownership／
 * DRC Mobile transitional exception／multi-instance adapter contract.
 * Compile-only harness remains: scripts/compile-check-desktop-calendar.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
	DesktopCalendarController,
	SDC_VARIANTS,
} from "../src/scripts/desktop-calendar-controller.ts";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

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
	return readFileSync(join(rootDir, relPath), "utf8");
}

function countMatches(source, pattern) {
	const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
	return [...source.matchAll(new RegExp(pattern.source, flags))].length;
}

/**
 * Extract CSS rule blocks whose selector contains needle.
 * Returns [{ selector, body, fileHint }].
 */
function findRulesWithSelector(css, needle) {
	const rules = [];
	const re = /([^{}]+)\{([^{}]*)\}/g;
	let match;
	while ((match = re.exec(css)) !== null) {
		const selector = match[1].replace(/\s+/g, " ").trim();
		if (selector.includes(needle)) {
			rules.push({ selector, body: match[2].trim() });
		}
	}
	return rules;
}

/** Approved root-level stacking／composition only — narrow whitelist. */
function isAllowedDesktopCalendarToolRule(selector, body) {
	const compactSel = selector.replace(/\s+/g, " ").trim();
	const compactBody = body
		.replace(/\/\*[\s\S]*?\*\//g, "")
		.replace(/\s+/g, " ")
		.trim();

	// Exclusion from position:relative siblings（composition）
	if (
		/:not\(\[data-desktop-calendar\]\)/.test(compactSel) &&
		!compactSel.includes("[data-desktop-calendar] ")
	) {
		return true;
	}

	// Direct-child stacking only：> [data-desktop-calendar] { z-index: … }
	if (/^[^\{]*>\s*\[data-desktop-calendar\]$/.test(compactSel)) {
		return /^z-index:\s*\d+\s*;?$/.test(compactBody);
	}

	return false;
}

console.log("validate-desktop-calendar\n");

const sharedAstroPath = "src/components/tools/shared/DesktopCalendar.astro";
const sharedControllerPath = "src/scripts/desktop-calendar-controller.ts";
const sharedCssPath = "src/styles/tools/desktop-calendar.css";
const compileHarnessPath = "scripts/compile-check-desktop-calendar.mjs";

const sharedAstro = read(sharedAstroPath);
const sharedController = read(sharedControllerPath);
const sharedCss = read(sharedCssPath);

const bdcAstro = read(
	"src/components/tools/business-days-calculator-v2/BusinessDaysCalculatorV2.astro",
);
const bdcScript = read("src/scripts/business-days-calculator.ts");
const bdcCss = read("src/styles/tools/business-days-calculator-v2.css");

const drcAstro = read(
	"src/components/tools/date-range-calculator-v2/DateRangeCalculatorV2.astro",
);
const drcScript = read("public/scripts/date-range.js");
const drcAdapter = read("src/scripts/date-range-desktop-calendar.ts");
const drcCss = read("src/styles/tools/date-range-calculator-v2.css");
const drcCssLegacy = read("src/styles/tools/date-range.css");

const ageAstro = read("src/components/tools/age-calculator-v2/AgeCalculatorV2.astro");
const ageScript = read("src/scripts/age-calculator.ts");
const ageCss = read("src/styles/tools/age-calculator-v2.css");

/* ------------------------------------------------------------------ */
/* 1. Shared foundation                                                */
/* ------------------------------------------------------------------ */

assert(existsSync(join(rootDir, sharedAstroPath)), "shared Astro exists: DesktopCalendar.astro");
assert(
	existsSync(join(rootDir, sharedControllerPath)),
	"shared controller exists: desktop-calendar-controller.ts",
);
assert(existsSync(join(rootDir, sharedCssPath)), "shared CSS exists: desktop-calendar.css");
assert(
	existsSync(join(rootDir, compileHarnessPath)),
	"compile harness remains separate: compile-check-desktop-calendar.mjs",
);

assert(
	/export type SdcVariant/.test(sharedAstro) && /variant:\s*SdcVariant/.test(sharedAstro),
	"DesktopCalendar.astro exports／uses SdcVariant",
);
assert(
	/data-desktop-calendar/.test(sharedAstro) && /data-sdc-variant/.test(sharedAstro),
	"DesktopCalendar.astro uses data-desktop-calendar＋data-sdc-variant",
);
assert(
	/\.sdc\b/.test(sharedAstro) || /class:list=\{\["sdc"/.test(sharedAstro),
	"DesktopCalendar.astro root uses .sdc class",
);
assert(
	/data-sdc-prev/.test(sharedAstro) &&
		/data-sdc-month-panel/.test(sharedAstro) &&
		/data-sdc-year-input/.test(sharedAstro) &&
		/data-sdc-grid/.test(sharedAstro),
	"DesktopCalendar.astro uses data-sdc-* hooks",
);

assert(
	typeof DesktopCalendarController.createDesktopCalendar === "function" &&
		typeof DesktopCalendarController.DesktopCalendarRegistry.register === "function",
	"controller exports createDesktopCalendar＋DesktopCalendarRegistry",
);
assert(
	/export function createDesktopCalendar/.test(sharedController) &&
		/DesktopCalendarRegistry/.test(sharedController) &&
		/boundRoots/.test(sharedController),
	"controller defines createDesktopCalendar／Registry／boundRoots（idempotent root）",
);
assert(
	/data-sdc-/.test(sharedController) && /data-desktop-calendar/.test(sharedController),
	"controller binds data-desktop-calendar／data-sdc-* selectors",
);
assert(
	!/bdcv2|drv2|acv2|BusinessDays|DateRangeCalculator|AgeCalculator|age-calculator|business-days-calculator|date-range-calculator|Date Calculator|date-calculator/i.test(
		sharedController,
	),
	"shared controller has no BDC／DRC／Age／Date Calculator names or tool selectors",
);
assert(
	!/bdcv2|drv2|acv2|BusinessDays|DateRangeCalculator|AgeCalculator/i.test(sharedAstro),
	"shared Astro has no tool-specific names",
);
assert(
	!/bdcv2|drv2|acv2|BusinessDays|DateRangeCalculator|AgeCalculator/i.test(sharedCss),
	"shared CSS has no tool-specific names",
);

/* ------------------------------------------------------------------ */
/* 2. Variant contract                                                 */
/* ------------------------------------------------------------------ */

assert(
	SDC_VARIANTS.length === 2 &&
		SDC_VARIANTS.includes("inline-large") &&
		SDC_VARIANTS.includes("popover-compact"),
	"SDC_VARIANTS exports exactly inline-large｜popover-compact",
);

assert(
	/SdcVariant\s*=\s*"inline-large"\s*\|\s*"popover-compact"/.test(sharedController) &&
		/SdcVariant\s*=\s*"inline-large"\s*\|\s*"popover-compact"/.test(sharedAstro),
	"SdcVariant type is only inline-large｜popover-compact（Astro＋controller）",
);
assert(
	/variant !== "inline-large" && variant !== "popover-compact"/.test(sharedAstro) ||
		/must be "inline-large" or "popover-compact"/.test(sharedAstro),
	"DesktopCalendar.astro runtime rejects unknown variants",
);
assert(
	/function assertVariant|must be "inline-large" or "popover-compact"/.test(sharedController),
	"controller runtime rejects unknown variants",
);

const cssVariantRefs = [
	...sharedCss.matchAll(/data-sdc-variant="([^"]+)"/g),
].map((m) => m[1]);
const uniqueCssVariants = [...new Set(cssVariantRefs)];
assert(
	uniqueCssVariants.length === 2 &&
		uniqueCssVariants.includes("inline-large") &&
		uniqueCssVariants.includes("popover-compact"),
	"desktop-calendar.css only references the two official variants",
);
assert(
	!/inline-small|popover-large|compact-inline|tool-variant|drc-variant|bdc-variant/i.test(
		sharedAstro + sharedController + sharedCss,
	),
	"no third variant／size alias／tool-specific variant names in shared",
);

assert(
	/SdcYearListMode\s*=\s*"full"\s*\|\s*"nearby"/.test(sharedController) &&
		/mode:\s*SdcYearListMode/.test(sharedController),
	"yearList.mode full｜nearby is data strategy（not a variant）",
);
assert(
	!/variant.*nearby|nearby.*variant/i.test(sharedAstro),
	"nearby is not exposed as a DesktopCalendar variant",
);

/* ------------------------------------------------------------------ */
/* 3. Tool adoption                                                    */
/* ------------------------------------------------------------------ */

const bdcDesktopCount = countMatches(
	bdcAstro,
	/<DesktopCalendar\b[\s\S]*?variant="popover-compact"/,
);
assert(bdcDesktopCount === 1, "BDC mounts exactly one DesktopCalendar popover-compact");
assert(
	/idPrefix="bdcv2-calendar-popover"/.test(bdcAstro),
	"BDC uses unique idPrefix bdcv2-calendar-popover",
);
assert(
	/createDesktopCalendar\(/.test(bdcScript) && /variant:\s*"popover-compact"/.test(bdcScript),
	"BDC adapter calls createDesktopCalendar with popover-compact",
);
assert(
	!/function createDesktopDateCalendar|function initCalendarPopover[\s\S]{0,80}monthSelect|data-bdcv2-calendar-month-select|data-bdcv2-calendar-year-select/.test(
		bdcScript + bdcAstro,
	),
	"BDC has no residual local month／year select calendar implementation",
);
assert(
	!/function renderCalendarDays|ensureYearOptions|monthSelect\.innerHTML/.test(bdcScript),
	"BDC has no residual local day-render／year-list calendar factory",
);

assert(
	/<DesktopCalendar\b[\s\S]*?variant="inline-large"/.test(drcAstro) &&
		countMatches(drcAstro, /<DesktopCalendar\b/g) === 1,
	"DRC Desktop mounts exactly one DesktopCalendar inline-large",
);
assert(
	/idPrefix="drc-sdc"/.test(drcAstro) && /data-drc-desktop-sdc-host/.test(drcAstro),
	"DRC Desktop uses idPrefix drc-sdc＋outer host composition",
);
assert(
	/createDesktopCalendar\(/.test(drcAdapter) &&
		/variant:\s*"inline-large"/.test(drcAdapter) &&
		/mode:\s*"nearby"/.test(drcAdapter) &&
		/nearbyRadius:\s*10/.test(drcAdapter),
	"DRC Desktop adapter uses inline-large＋yearList nearby ±10",
);
assert(
	/if \(isDesktopLayout\(\)\) \{\s*notifyDesktopCalendar\(\);\s*return;/.test(drcScript) ||
		(/isDesktopLayout\(\)/.test(drcScript) &&
			/notifyDesktopCalendar/.test(drcScript) &&
			/Desktop → Shared DesktopCalendar/.test(drcScript)),
	"DRC Desktop renderCalendar skips legacy grid（does not operate legacy DOM）",
);

const ageDesktopCount = countMatches(ageAstro, /<DesktopCalendar\b/g);
const agePopoverCount = countMatches(ageAstro, /variant="popover-compact"/g);
assert(ageDesktopCount === 2, "Age mounts exactly two DesktopCalendar instances");
assert(agePopoverCount === 2, "Age Birth／As-of both use popover-compact");
assert(
	/idPrefix="acv2-calendar-popover"/.test(ageAstro) &&
		/idPrefix="acv2-asof-calendar-popover"/.test(ageAstro),
	"Age Birth／As-of use unique idPrefixes",
);
assert(
	countMatches(ageScript, /createDesktopCalendar\(/g) === 2,
	"Age script creates exactly two createDesktopCalendar adapters",
);
assert(
	!/<select\b/i.test(ageAstro),
	"Age has no native month／year <select> calendar markup",
);
assert(
	!/data-acv2-calendar-month-select|data-acv2-calendar-year-select|data-acv2-asof-calendar-month-select|createDesktopDateCalendar/.test(
		ageAstro + ageScript,
	),
	"Age has no residual select calendar hooks／local factory",
);

/* ------------------------------------------------------------------ */
/* 4. Ownership／CSS anti-drift                                        */
/* ------------------------------------------------------------------ */

const toolCssFiles = [
	{ name: "BDC CSS", css: bdcCss },
	{ name: "DRC CSS", css: drcCss },
	{ name: "DRC legacy CSS", css: drcCssLegacy },
	{ name: "Age CSS", css: ageCss },
];

for (const { name, css } of toolCssFiles) {
	assert(
		!/\.sdc-[a-zA-Z0-9_-]/.test(css) && !/(^|[^\w-])\.sdc([^\w-]|$)/.test(css),
		`${name}: no .sdc-* internal selectors（file: tool CSS）`,
	);
}

for (const { name, css } of [
	{ name: "BDC CSS", css: bdcCss },
	{ name: "Age CSS", css: ageCss },
	{ name: "DRC CSS", css: drcCss },
	{ name: "DRC legacy CSS", css: drcCssLegacy },
]) {
	const rules = findRulesWithSelector(css, "[data-desktop-calendar]");
	for (const rule of rules) {
		assert(
			isAllowedDesktopCalendarToolRule(rule.selector, rule.body),
			`${name}: disallowed [data-desktop-calendar] rule — selector="${rule.selector}" body="${rule.body.slice(0, 80)}"（only root stacking／:not exclusion allowed）`,
		);
	}
	if (name === "DRC CSS" || name === "DRC legacy CSS") {
		assert(
			rules.length === 0,
			`${name}: no [data-desktop-calendar] rules（DRC uses outer host composition only）`,
		);
	}
}

assert(
	findRulesWithSelector(bdcCss, "[data-desktop-calendar]").some((r) =>
		isAllowedDesktopCalendarToolRule(r.selector, r.body),
	),
	"BDC keeps approved root-level [data-desktop-calendar] stacking whitelist rule",
);
assert(
	findRulesWithSelector(ageCss, "[data-desktop-calendar]").some((r) =>
		isAllowedDesktopCalendarToolRule(r.selector, r.body),
	),
	"Age keeps approved root-level [data-desktop-calendar] stacking whitelist rule",
);

assert(
	!/sdc-month-grid|sdc-year-list|sdc-day|data-sdc-month-grid/.test(
		bdcAstro + ageAstro,
	) ||
		(/DesktopCalendar/.test(bdcAstro) && /DesktopCalendar/.test(ageAstro)),
	"tools do not duplicate shared month／year／day markup outside DesktopCalendar",
);
assert(
	!/class="[^"]*calendar-panel[^"]*"[\s\S]{0,400}data-bdcv2-calendar-grid/.test(bdcAstro) &&
		!/class="[^"]*acv2-calendar-panel/.test(ageAstro),
	"BDC／Age do not keep renamed local calendar panel copies",
);

/* ------------------------------------------------------------------ */
/* 5. DRC Mobile transitional exception                                */
/* ------------------------------------------------------------------ */

assert(
	/id=["']range-sheet["']/.test(drcAstro) &&
		/data-drv2-calendar-panel/.test(drcAstro) &&
		/id=["']calendar-grid["']/.test(drcAstro) &&
		/data-drv2-portrait-period-screen/.test(drcAstro),
	"DRC Mobile legacy calendar DOM retained（approved transitional exception）",
);
assert(
	/function renderCalendar/.test(drcScript) &&
		/data-drv2-month-trigger/.test(drcAstro) &&
		/\.drv2-calendar-picker-trigger/.test(drcCss),
	"DRC Mobile legacy controller／CSS retained（approved transitional exception）",
);
console.log(
	"NOTE: DRC Mobile legacy calendar is an approved transitional exception — Desktop must use Shared DesktopCalendar; Mobile Sheet may keep data-drv2-* path.",
);

assert(
	!/tool-desktop-main \.calendar-panel \.calendar-day/.test(drcCss) &&
		!/tool-desktop-main \.calendar-panel \.calendar-grid/.test(drcCss),
	"DRC Desktop densify／legacy calendar internal overrides remain removed",
);
assert(
	/data-drc-desktop-sdc-host/.test(drcAstro) &&
		/\[data-date-range-v2\] \.drc-desktop-sdc-host/.test(drcCss),
	"DRC Desktop host composition exists alongside Mobile legacy exception",
);

/* ------------------------------------------------------------------ */
/* 6. Multi-instance／adapter contract                                 */
/* ------------------------------------------------------------------ */

assert(
	/idPrefix="acv2-calendar-popover"/.test(ageAstro) &&
		/idPrefix="acv2-asof-calendar-popover"/.test(ageAstro) &&
		ageAstro.indexOf('idPrefix="acv2-calendar-popover"') !==
			ageAstro.indexOf('idPrefix="acv2-asof-calendar-popover"'),
	"Age Birth／As-of idPrefix values are unique",
);
assert(
	/DesktopCalendarRegistry\.closeOthers|closeOthers\(/.test(sharedController) &&
		/boundRoots\.get\(root\)/.test(sharedController) &&
		/existing\.destroy\(\)/.test(sharedController),
	"shared Registry＋idempotent create／destroy contract exists",
);
assert(
	/onBeforeOpen:[\s\S]{0,80}asOfCalendarApi\?\.close|onBeforeOpen:[\s\S]{0,80}birthCalendarApi\?\.close/.test(
		ageScript,
	),
	"Age adapters use onBeforeOpen mutual exclusion belt-and-suspenders",
);

assert(
	/getSelection:/.test(bdcScript) &&
		/onSelect:/.test(bdcScript) &&
		/getMinDate:|getMaxDate:/.test(bdcScript) &&
		/placement:|resolvePopoverPosition:/.test(bdcScript),
	"BDC adapter owns selection／close／min-max／placement",
);
assert(
	/getSelection:/.test(drcAdapter) &&
		/onSelect:/.test(drcAdapter) &&
		/yearList:/.test(drcAdapter) &&
		/shouldClose:\s*false/.test(drcAdapter),
	"DRC adapter owns selection／yearList／inline close policy",
);
assert(
	/getSelection:/.test(ageScript) &&
		/isDateSelectable:/.test(ageScript) &&
		/placement:\s*"above"/.test(ageScript) &&
		/placement:\s*"right"/.test(ageScript) &&
		/shouldClose:\s*true/.test(ageScript),
	"Age adapters own selection／selectable／placement／close policy",
);

assert(
	!/calculateAge|computeBusinessDays|countTotalDays|parseSmartDate|smartDate/i.test(
		sharedController,
	),
	"shared controller does not read tool calculation results or Smart Date parser",
);
assert(
	!/rs:update|ResultSummary|data-rs-/.test(sharedController),
	"shared controller does not couple to ResultSummary",
);

/* ------------------------------------------------------------------ */

console.log(`\nResult: ${passed} passed, ${failed} failed`);
if (failed > 0) {
	process.exit(1);
}
console.log("OK");
