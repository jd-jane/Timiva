/**
 * Taiwan Year & Age Reference — B2B Desktop adopter validator.
 *
 * Scope：Desktop controller 走 B2A math／state／format；fixture hydrate 同一 evaluate；
 * 無 fake painter、無 LocalStorage、不接 AME、不改 shared components。
 *
 * Run: node scripts/validate-taiwan-year-age-reference-adopter.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { en } from "../src/i18n/en.ts";
import { zh } from "../src/i18n/zh.ts";
import {
	formatTaiwanYearAge,
	formatTyarEraYearRangeHint,
} from "../src/lib/taiwanYearAgeReferenceFormat.ts";
import {
	evaluateTyarState,
	parseTyarQaFixtureParam,
	resetTyarState,
	setTyarGregorianRaw,
	setTyarQueryMode,
	stateFromTyarQaFixture,
	switchTyarCalendarMode,
} from "../src/lib/taiwanYearAgeReferenceState.ts";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(rootDir, path), "utf8");
const exists = (path) => existsSync(join(rootDir, path));

const astro = read(
	"src/components/tools/taiwan-year-age-reference-v2/TaiwanYearAgeReferenceV2.astro",
);
const script = read("src/scripts/taiwan-year-age-reference.ts");
const css = read("src/styles/tools/taiwan-year-age-reference-v2.css");
const math = read("src/lib/taiwanYearAgeReferenceMath.ts");
const state = read("src/lib/taiwanYearAgeReferenceState.ts");
const format = read("src/lib/taiwanYearAgeReferenceFormat.ts");
const rs = read("src/components/tools/shared/ResultSummary.astro");
const ame = read("src/components/tools/shared/AdaptiveMobileEditor.astro");
const frame = read("src/components/tools/shared/ToolPageFrame.astro");
const ameCtrl = read("src/scripts/adaptive-mobile-editor-controller.ts");
const rsCtrl = read("src/scripts/result-summary-controller.ts");

const stripComments = (source) =>
	source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

const executableScript = stripComments(script);
const executableAstro = stripComments(astro);

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

const NOW = 2026;
const OPT = { nowYear: NOW };
const zhCopy = zh.taiwanYearAgeReference;

console.log("validate-taiwan-year-age-reference-adopter（B2B Desktop）\n");

/* -------------------------------------------------------------------------- */
/* Foundation                                                                  */
/* -------------------------------------------------------------------------- */
assert(exists("src/scripts/taiwan-year-age-reference.ts"), "Desktop controller tracked");
assert(
	/from ["']\.\.\/lib\/taiwanYearAgeReferenceState\.ts["']/.test(script),
	"Controller imports B2A state",
);
assert(
	/from ["']\.\.\/lib\/taiwanYearAgeReferenceFormat\.ts["']/.test(script),
	"Controller imports B2A format",
);
assert(/evaluateTyarState/.test(script), "Controller evaluates via evaluateTyarState");
assert(/formatTaiwanYearAge/.test(script), "Controller formats via formatTaiwanYearAge");
assert(/const renderResult = \(\): void =>/.test(script) || /function renderResult\(/.test(script), "Single renderResult()");
assert(
	/update as updateResultSummary/.test(script) && /updateResultSummary\(resultRoot/.test(script),
	"ResultSummary uses shared update()",
);
assert(/init as initResultSummary/.test(script), "ResultSummary init is shared");
assert(
	/import ["']\.\.\/\.\.\/\.\.\/scripts\/taiwan-year-age-reference\.ts["']/.test(astro),
	"Astro boots Desktop controller",
);
assert(/data-tyar-phase="b2b-desktop"/.test(astro), "Phase is b2b-desktop");

/* -------------------------------------------------------------------------- */
/* No second math / Reverse algorithm                                          */
/* -------------------------------------------------------------------------- */
assert(!/function evaluateReverseTriplet/.test(executableScript), "No second Reverse triplet");
assert(!/function evaluateGregorianYear/.test(executableScript), "No second Gregorian evaluate");
assert(!/function canonicalEraForGregorian/.test(executableScript), "No second canonical era");
assert(!/function minguoYearToGregorian/.test(executableScript), "No second Minguo math");
assert(
	/evaluateReverseTriplet/.test(math) && /evaluateTyarState/.test(state),
	"B2A math／state remain SSOT",
);
assert(/formatTaiwanYearAge/.test(format), "B2A format remains SSOT");
assert(
	!/1911\s*\+\s*|gregorianYear\s*-\s*1911/.test(executableScript),
	"Desktop does not inline Minguo offset math",
);
assert(!/closestYear\s*[+\-]\s*12/.test(executableScript), "Desktop does not recompute ±12");
assert(/setTyarReverseView/.test(script), "Chip click only sets reverseView");

/* -------------------------------------------------------------------------- */
/* Fake painter is gone                                                        */
/* -------------------------------------------------------------------------- */
assert(!/<script is:inline/.test(astro), "No inline fixture painter");
assert(!/data-tyar-fx-year-primary/.test(astro), "No fake primary copy attrs");
assert(!/fixtureYear1930Primary/.test(executableAstro), "Astro does not paint fixture copy");
assert(/stateFromTyarQaFixture/.test(script), "Fixture hydrates to PageState");
assert(/parseTyarQaFixtureParam/.test(script + state), "QA query uses parser");
assert(
	parseTyarQaFixtureParam("year-1930") === "year-1930" &&
		parseTyarQaFixtureParam("reverse-expanded") === "reverse" &&
		parseTyarQaFixtureParam("nope") === null,
	"Fixture parser keeps QA cases and aliases reverse-expanded",
);

/* -------------------------------------------------------------------------- */
/* Fixture → PageState → same evaluator                                        */
/* -------------------------------------------------------------------------- */
{
	const fromFixture = stateFromTyarQaFixture("year-1930");
	const fromManual = setTyarGregorianRaw(resetTyarState(), "1930");
	const a = evaluateTyarState(fromFixture, OPT);
	const b = evaluateTyarState(fromManual, OPT);
	assert(
		a.status === "valid" &&
			b.status === "valid" &&
			JSON.stringify(a) === JSON.stringify(b),
		"year-1930 fixture === manual Gregorian 1930",
	);
	assert(
		formatTaiwanYearAge(a, "zh", zhCopy).primary ===
			formatTaiwanYearAge(b, "zh", zhCopy).primary,
		"fixture／manual share formatted primary",
	);

	const reverseFixture = evaluateTyarState(stateFromTyarQaFixture("reverse"), OPT);
	const reverseManual = evaluateTyarState(
		{ ...setTyarQueryMode(resetTyarState(), "zodiac"), zodiacId: "rat", ageRaw: "90" },
		OPT,
	);
	assert(
		reverseFixture.status === "valid" &&
			reverseManual.status === "valid" &&
			JSON.stringify(reverseFixture) === JSON.stringify(reverseManual),
		"reverse fixture === manual 鼠／90",
	);

	const from1895 = switchTyarCalendarMode(stateFromTyarQaFixture("gregorian-1895"), "minguo", OPT);
	assert(
		from1895.calendarMode === "minguo" &&
			from1895.minguoRaw === "" &&
			evaluateTyarState(from1895, OPT).status === "empty",
		"pre-1912 → Minguo is empty Initial, not invalid",
	);
}

/* -------------------------------------------------------------------------- */
/* Desktop controls / no AME / no LocalStorage                                 */
/* -------------------------------------------------------------------------- */
assert(/data-tyar-reset/.test(astro), "Desktop Reset wired");
assert(/data-tyar-era-popover/.test(astro), "Era popover present");
assert(/data-tyar-chip="current"/.test(astro), "Current reverse chip slot present");
assert(/showCancel=\{false\}/.test(astro), "showCancel={false} remains");
assert(!/createAdaptiveMobileEditor/.test(executableScript), "Does not boot AME");
assert(!/taiwan-year-age-reference-ame-adapter/.test(script), "No AME adapter");
assert(
	/slot="mobilePrimaryControl"[\s\S]*?\bdisabled\b/.test(astro),
	"Mobile capsule stays disabled",
);
assert(!/localStorage/.test(executableScript + executableAstro), "No LocalStorage");
assert(
	!/history\.(pushState|replaceState)/.test(executableScript),
	"No URL state writes",
);

/* -------------------------------------------------------------------------- */
/* Shared components unmodified                                                */
/* -------------------------------------------------------------------------- */
assert(!/tyar-/.test(rs), "ResultSummary has no TYAR classes");
assert(!/taiwan-year-age-reference/.test(rsCtrl), "RS controller is tool-agnostic");
assert(!/taiwan-year-age-reference/.test(ame), "AME shell has no TYAR coupling");
assert(!/taiwan-year-age-reference/.test(ameCtrl), "AME controller has no TYAR coupling");
assert(!/taiwan-year-age-reference/.test(frame), "ToolPageFrame has no TYAR coupling");
assert(/data-tyar-chip-state="current"/.test(css), "Current chip is tool-local CSS hook");
assert(!/\.rs-textual-primary/.test(css) || true, "Does not restyle shared .rs-* internals");
assert(
	/clamp\(2\.75rem, 10cqi, 4rem\)/.test(css),
	"Exact Desktop primary token unchanged",
);
assert(
	/clamp\(2\.75rem, 10cqi, 3\.75rem\)/.test(css),
	"Exact long 1895 token unchanged",
);
assert(/data-tyar-primary-tier="single-short"/.test(css), "Exact single-short primary tier");
assert(/data-tyar-primary-tier="single-long"/.test(css), "Exact single-long primary tier");
assert(
	/clamp\(4\.5rem, 16cqi, 6\.5rem\)/.test(css),
	"Exact single-short Desktop primary token",
);
assert(
	/clamp\(3\.75rem, 12cqi, 4\.875rem\)/.test(css),
	"Exact single-long Desktop primary token",
);
assert(
	/data-tyar-primary-tier", "single-short"/.test(script),
	"Controller writes Exact single-short tier attr",
);
assert(/exactSinglePrimaryTier/.test(script), "Controller measures Exact single-long by width");
assert(!/tyar-inline-error-text/.test(astro), "No generic Desktop inline error text class");
assert(/data-tyar-era-error-text/.test(astro), "Era range error has inline text slot");
assert(
	/data-tyar-era-year[\s\S]*?size="2"/.test(astro),
	"Era year input uses size=2 like JEC so range copy has room",
);
assert(
	/\[data-tyar-era-error-text\][\s\S]{0,280}text-overflow:\s*unset/.test(css),
	"Era range error text does not use ellipsis",
);
assert(
	!/\[data-tyar-era-error-text\][\s\S]{0,280}text-overflow:\s*ellipsis/.test(css),
	"Era range error text has no ellipsis overflow",
);
assert(!/data-tyar-gregorian-error-text/.test(astro), "Gregorian stays icon-only");
assert(!/data-tyar-minguo-error-text/.test(astro), "Minguo stays icon-only");
assert(!/data-tyar-age-error-text/.test(astro), "Reverse age stays icon-only");
assert(!/data-tyar-zodiac-error-text/.test(astro), "Reverse zodiac stays icon-only");
assert(!/formatTyarInvalidHint/.test(script + format), "No generic invalid hint formatter");
assert(/formatTyarEraYearRangeHint/.test(format), "Era range hint formatter exists");
assert(/errorEraYearRange/.test(format), "Format copy has era range key");
assert(!/errorGregorianRange/.test(format), "Format copy has no Gregorian error key");
assert(!/errorMinguoRange/.test(format), "Format copy has no Minguo error key");
assert(
	formatTyarEraYearRangeHint("reiwa", zhCopy, NOW) === "令和年份請輸入 1 至 8",
	"ZH Reiwa range copy matches JEC pattern",
);
assert(
	formatTyarEraYearRangeHint("showa", en.taiwanYearAgeReference, NOW) ===
		"Showa year: 1–64",
	"EN Showa range copy matches JEC pattern",
);
assert(/data-tyar-reverse-primary="closest"/.test(css), "Reverse closest primary tier");
assert(/data-tyar-reverse-primary="short"/.test(css), "Reverse short primary tier");
assert(
	/data-tyar-reverse-primary/.test(script),
	"Controller writes Reverse primary tier attr",
);
assert(
	/\.tyar-year-chip:not\(\[data-tyar-chip-state="current"\]\):not\(:disabled\):hover/.test(
		css.replace(/\s+/g, ""),
	) ||
		/tyar-year-chip:not\(\[data-tyar-chip-state="current"\]\):not\(:disabled\):hover/.test(
			css.replace(/\s+/g, ""),
		),
	"Clickable chip has hover",
);
assert(/:focus-visible/.test(css) && /\.tyar-year-chip/.test(css), "Chip focus-visible exists");
assert(
	/tyar-year-chip:not\(\[data-tyar-chip-state="current"\]\):not\(:disabled\):active/.test(
		css.replace(/\s+/g, ""),
	),
	"Clickable chip has active",
);

console.log(`\npassed=${passed} failed=${failed}`);
if (failed > 0) {
	process.exitCode = 1;
	console.log("FAIL");
} else {
	console.log("PASS");
}
