/**
 * ResultSummary canonical shared validator.
 * Run: node scripts/validate-result-summary.mjs
 *
 * Covers shared component／controller／CSS ownership + DRC／BDC integration contracts.
 * Compile-only harness remains: scripts/compile-check-result-summary.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
	RS_UPDATE_EVENT,
	ResultSummaryController,
	computeRsDigits,
	formatRsDisplayValue,
	init,
	update,
	validateRsUpdatePayload,
} from "../src/scripts/result-summary-controller.ts";

const root = new URL("..", import.meta.url).pathname;

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
	return readFileSync(join(root, relPath), "utf8");
}

class MiniElement {
	constructor(tagName) {
		this.tagName = tagName.toUpperCase();
		this.attributes = new Map();
		this.children = [];
		this.textContent = "";
		this.parent = null;
		this.listeners = new Map();
		this.hidden = false;
	}

	setAttribute(name, value) {
		this.attributes.set(name, String(value));
	}

	getAttribute(name) {
		return this.attributes.has(name) ? this.attributes.get(name) : null;
	}

	removeAttribute(name) {
		this.attributes.delete(name);
	}

	appendChild(child) {
		child.parent = this;
		this.children.push(child);
	}

	addEventListener(type, listener) {
		if (!this.listeners.has(type)) {
			this.listeners.set(type, new Set());
		}

		this.listeners.get(type).add(listener);
	}

	dispatchEvent(event) {
		event.currentTarget = this;
		const listeners = this.listeners.get(event.type);

		if (!listeners) {
			return true;
		}

		for (const listener of listeners) {
			listener.call(this, event);
		}

		return !event.defaultPrevented;
	}

	querySelector(selector) {
		if (selector === "[data-rs-value]") {
			return this.findDescendant((el) => el.getAttribute("data-rs-value") !== null);
		}

		if (selector === "[data-rs-label]") {
			return this.findDescendant((el) => el.getAttribute("data-rs-label") !== null);
		}

		if (selector === "[data-rs-value=\"primary\"]") {
			return this.findDescendant(
				(el) => el.getAttribute("data-rs-value") === "primary",
			);
		}

		if (selector === "[data-rs-label=\"primary\"]") {
			return this.findDescendant(
				(el) => el.getAttribute("data-rs-label") === "primary",
			);
		}

		if (selector === ".rs-status") {
			return this.findDescendant((el) => el.className === "rs-status");
		}

		if (selector === "[data-rs-weekday]") {
			return this.findDescendant((el) => el.getAttribute("data-rs-weekday") !== null);
		}

		if (selector === "[data-rs-support]") {
			return this.findDescendant((el) => el.getAttribute("data-rs-support") !== null);
		}

		const keyMatch = selector.match(/^\[data-rs-key="([^"]+)"\]$/);

		if (keyMatch) {
			return this.findDescendant((el) => el.getAttribute("data-rs-key") === keyMatch[1]);
		}

		return null;
	}

	findDescendant(matcher) {
		if (matcher(this)) {
			return this;
		}

		for (const child of this.children) {
			const found = child.findDescendant(matcher);

			if (found) {
				return found;
			}
		}

		return null;
	}
}

class MiniDocument {
	constructor() {
		this.body = new MiniElement("body");
	}

	querySelectorAll(selector) {
		if (selector !== "[data-result-summary]") {
			return [];
		}

		return this.body.findAllDescendants(
			(el) => el.getAttribute("data-result-summary") !== null,
		);
	}
}

MiniElement.prototype.className = "";
MiniElement.prototype.findAllDescendants = function findAllDescendants(matcher, acc = []) {
	if (matcher(this)) {
		acc.push(this);
	}

	for (const child of this.children) {
		child.findAllDescendants(matcher, acc);
	}

	return acc;
};

function createSummaryRoot(keys = ["weekdays", "weekends"]) {
	const summary = new MiniElement("section");
	summary.setAttribute("data-result-summary", "");
	summary.setAttribute("data-rs-content", "numeric");
	summary.setAttribute("data-rs-layout", "desktop");
	summary.setAttribute("data-rs-variant", "standard");
	summary.setAttribute("data-rs-digits", "1-2");

	const primary = new MiniElement("div");
	const primaryValue = new MiniElement("div");
	primaryValue.setAttribute("data-rs-value", "primary");
	primaryValue.textContent = "0";
	const primaryLabel = new MiniElement("div");
	primaryLabel.setAttribute("data-rs-label", "primary");
	primaryLabel.textContent = "Total";
	primary.appendChild(primaryValue);
	primary.appendChild(primaryLabel);
	summary.appendChild(primary);

	const secondary = new MiniElement("div");

	for (const key of keys) {
		const item = new MiniElement("div");
		item.setAttribute("data-rs-key", key);
		const value = new MiniElement("div");
		value.setAttribute("data-rs-value", key);
		value.textContent = "0";
		const label = new MiniElement("div");
		label.setAttribute("data-rs-label", key);
		label.textContent = key;
		item.appendChild(value);
		item.appendChild(label);
		secondary.appendChild(item);
	}

	summary.appendChild(secondary);

	const status = new MiniElement("div");
	status.className = "rs-status";
	summary.appendChild(status);

	return summary;
}

function validDetail(overrides = {}) {
	return {
		primary: {
			value: 12,
			label: "Total days",
			...overrides.primary,
		},
		secondary: [
			{
				key: "weekdays",
				value: 8,
				label: "Weekdays",
				...overrides.secondary?.[0],
			},
			{
				key: "weekends",
				value: 4,
				label: "Weekends",
				...overrides.secondary?.[1],
			},
		],
	};
}

console.log("validate-result-summary");

assert(existsSync(join(root, "src/components/tools/shared/ResultSummary.astro")), "ResultSummary.astro exists");
assert(existsSync(join(root, "src/styles/tools/result-summary.css")), "result-summary.css exists");
assert(existsSync(join(root, "src/scripts/result-summary-controller.ts")), "controller exists");
assert(
	!existsSync(join(root, "scripts/validate-result-summary-phase-a.mjs")),
	"legacy phase-a validator removed（canonical is validate-result-summary.mjs）",
);
assert(
	existsSync(join(root, "local-fixtures/result-summary/fixture-matrix.html")),
	"dev-only fixture matrix exists（local-fixtures only）",
);

const css = read("src/styles/tools/result-summary.css");
const astro = read("src/components/tools/shared/ResultSummary.astro");

assert(!astro.includes("digits?:"), "Props do not expose digits");
const propsBlock =
	astro.match(/type Props =[\s\S]*?;/)?.[0] ??
	astro.match(/interface Props \{[\s\S]*?\n\}/)?.[0] ??
	"";
assert(propsBlock.length > 0, "Props type／interface present");
assert(
	astro.includes("NumericProps") && astro.includes("TextualProps"),
	"discriminated NumericProps／TextualProps present",
);
assert(
	!/\b(toolId|toolSlug|digits)\b/.test(propsBlock) &&
		!/data-[a-zA-Z]/.test(propsBlock),
	"Props have no tool-specific id／data props",
);
assert(astro.includes("computeRsDigits"), "SSR uses computeRsDigits");
assert(
	astro.includes('class="rs-status"') &&
		astro.includes('aria-live="polite"') &&
		astro.includes('aria-atomic="true"'),
	"single .rs-status uses polite＋atomic",
);
const sectionTag = astro.match(/<section[\s\S]*?>/m)?.[0] ?? "";
assert(!sectionTag.includes("aria-live"), "visual section root is not live region");
assert(
	(astro.match(/class="rs-status"/g) || []).length === 2,
	"exactly one .rs-status per content branch (numeric＋textual)",
);
assert(
	!astro.includes('aria-live="polite"') ||
		(astro.match(/aria-live="polite"/g) || []).length === 2,
	"live region only on .rs-status branches",
);

for (const layout of ["desktop", "portrait", "landscape"]) {
	assert(css.includes(`data-rs-layout="${layout}"`), `CSS covers layout ${layout}`);
}

for (const variant of ["standard", "spacious"]) {
	assert(css.includes(`data-rs-variant="${variant}"`), `CSS covers variant ${variant}`);
}

for (const digits of ["1-2", "3", "4", "5", "6+"]) {
	assert(css.includes(`data-rs-digits="${digits}"`), `CSS covers digits ${digits}`);
}

assert(css.includes("--rs-desktop-primary-size:"), "desktop 1–5 primary token exists");
assert(css.includes("--rs-desktop-primary-size-6plus"), "desktop 6+ primary token exists");
assert(
	!css.includes("--rs-desktop-primary-size-3") &&
		!css.includes("--rs-desktop-primary-size-4") &&
		!css.includes("--rs-desktop-primary-size-5:"),
	"desktop no per-bucket 3／4／5 primary tokens",
);
assert(!css.includes("@media (orientation"), "shared CSS does not read viewport/orientation");

/* Phase D Desktop：1–5 同尺寸；6+ 獨立縮小 */
assert(
	/\[data-rs-layout="desktop"\]\[data-rs-digits="1-2"\][\s\S]*?\[data-rs-digits="5"\][\s\S]*?\.rs-primary \.rs-value[\s\S]*?var\(--rs-desktop-primary-size\)/.test(
		css,
	),
	"desktop primary 1–5 share --rs-desktop-primary-size",
);
assert(
	/\[data-rs-layout="desktop"\]\[data-rs-digits="6\+"\] \.rs-primary \.rs-value[\s\S]*?var\(--rs-desktop-primary-size-6plus\)/.test(
		css,
	),
	"desktop primary 6+ uses independent shrink token",
);
assert(
	/\[data-rs-variant="standard"\][\s\S]*?--rs-desktop-primary-size:\s*11rem/.test(css),
	"standard desktop primary 1–5 = 11rem",
);
assert(
	/\[data-rs-variant="spacious"\][\s\S]*?--rs-desktop-primary-size:\s*13rem/.test(css),
	"spacious desktop primary 1–5 = 13rem",
);
assert(
	/\[data-rs-layout="desktop"\] \.rs-secondary \.rs-value[\s\S]*?var\(--rs-desktop-secondary-size\)/.test(
		css,
	) && /--rs-desktop-secondary-size:\s*2\.25rem/.test(css),
	"desktop secondary 1–5 = 2.25rem",
);
assert(
	!/\[data-rs-layout="desktop"\]\[data-rs-digits="4"\] \.rs-secondary/.test(css) &&
		!/\[data-rs-layout="desktop"\]\[data-rs-digits="5"\] \.rs-secondary/.test(css),
	"desktop secondary has no 4／5 mid-bucket shrink",
);

/* Secondary column-gap：Desktop +16px、Portrait +10px；Landscape digit-aware 由 shared 擁有 */
assert(
	/\[data-rs-layout="desktop"\] \.rs-secondary[\s\S]*?column-gap:\s*1\.875rem/.test(css),
	"desktop secondary column-gap = 1.875rem (0.875rem + 16px)",
);
assert(
	/\[data-rs-layout="portrait"\] \.rs-secondary[\s\S]*?column-gap:\s*1\.875rem/.test(css),
	"portrait secondary column-gap = 1.875rem (1.25rem + 10px)",
);
assert(
	/\[data-rs-layout="desktop"\] \.rs-secondary[\s\S]*?margin-top:\s*1\.5rem/.test(css) &&
		/\[data-rs-layout="portrait"\] \.rs-secondary[\s\S]*?margin-top:\s*1\.25rem/.test(css),
	"primary→secondary vertical margin unchanged",
);
assert(
	/\[data-rs-layout="landscape"\][\s\S]*?grid-template-columns:\s*repeat\(3,\s*max-content\)/.test(
		css,
	) &&
		/\[data-rs-layout="landscape"\] \.rs-secondary[\s\S]*?display:\s*contents/.test(css),
	"landscape shared 3-col max-content + secondary display:contents",
);
assert(
	/--rs-landscape-column-gap:\s*1\.75rem/.test(css) &&
		/\[data-rs-digits="4"\][\s\S]*?--rs-landscape-column-gap:\s*2\.25rem/.test(css) &&
		/\[data-rs-digits="5"\][\s\S]*?--rs-landscape-column-gap:\s*2\.75rem/.test(css) &&
		/\[data-rs-digits="6\+"\][\s\S]*?--rs-landscape-column-gap:\s*2\.75rem/.test(css),
	"landscape digit-aware column-gap：1–2／3=1.75／4=2.25／5／6+=2.75",
);
assert(
	!/\[data-rs-layout="landscape"\] \.rs-secondary\s*\{[^}]*column-gap\s*:/.test(css),
	"landscape secondary has no column-gap override",
);

/* Phase D Portrait：BDC production clamps；variant 不影響 mobile */
assert(
	/\[data-rs-layout="portrait"\]\[data-rs-digits="1-2"\][\s\S]*?\[data-rs-digits="3"\][\s\S]*?clamp\(7\.5rem,\s*38vw,\s*10\.5rem\)/.test(
		css,
	),
	"portrait 1–3 primary = BDC clamp(7.5rem, 38vw, 10.5rem)",
);
assert(
	/\[data-rs-layout="portrait"\]\[data-rs-digits="4"\][\s\S]*?clamp\(6\.5rem,\s*33vw,\s*9rem\)/.test(
		css,
	),
	"portrait 4 primary = BDC clamp(6.5rem, 33vw, 9rem)",
);
assert(
	/\[data-rs-layout="portrait"\]\[data-rs-digits="5"\][\s\S]*?clamp\(5\.5rem,\s*27vw,\s*7rem\)/.test(
		css,
	),
	"portrait 5 primary = BDC clamp(5.5rem, 27vw, 7rem)",
);
assert(
	/\[data-rs-layout="portrait"\]\[data-rs-digits="6\+"\][\s\S]*?clamp\(2\.5rem,\s*13vw,\s*3\.5rem\)/.test(
		css,
	),
	"portrait 6+ keeps shared fallback",
);
assert(
	/\[data-rs-layout="portrait"\]\[data-rs-digits="4"\][\s\S]*?clamp\(2\.4rem,\s*10\.5vw,\s*2\.9rem\)/.test(
		css,
	) &&
		/\[data-rs-layout="portrait"\]\[data-rs-digits="5"\][\s\S]*?clamp\(2\.4rem,\s*10\.5vw,\s*2\.9rem\)/.test(
			css,
		),
	"portrait secondary 1–5 = BDC clamp(2.4rem, 10.5vw, 2.9rem)",
);
assert(
	!/\[data-rs-layout="portrait"\]\[data-rs-variant/.test(css),
	"portrait typography not gated by variant",
);

/* Phase D Landscape：完整五檔 + overflow visible */
assert(
	/\[data-rs-layout="landscape"\][\s\S]*?--rs-landscape-number-size:\s*5rem/.test(css),
	"landscape 1–2 = 5rem",
);
assert(
	/\[data-rs-layout="landscape"\]\[data-rs-digits="3"\][\s\S]*?3\.5rem/.test(css) &&
		/\[data-rs-layout="landscape"\]\[data-rs-digits="4"\][\s\S]*?3\.25rem/.test(css) &&
		/\[data-rs-layout="landscape"\]\[data-rs-digits="5"\][\s\S]*?2\.625rem/.test(css) &&
		/\[data-rs-layout="landscape"\]\[data-rs-digits="6\+"\][\s\S]*?1\.5rem/.test(css),
	"landscape 3／4／5／6+ ladder present",
);
assert(
	/\[data-rs-layout="landscape"\] \.rs-value[\s\S]*?overflow:\s*visible/.test(css),
	"landscape overflow visible avoids clip-as-small illusion",
);

assert(computeRsDigits([1, 2, 3]) === "1-2", "bucket 1-2");
assert(computeRsDigits([100, 10, 200]) === "3", "bucket 3");
assert(computeRsDigits([1000, 999, 100]) === "4", "bucket 4");
assert(computeRsDigits([10000, 1000, 100]) === "5", "bucket 5");
assert(computeRsDigits([100000, 10000, 1000]) === "6+", "bucket 6+");
assert(computeRsDigits([NaN, Infinity, 12]) === "1-2", "non-finite ignored → 1-2 from finite max");
assert(computeRsDigits([NaN, Infinity]) === "1-2", "all non-finite → safe 1-2");

assert(
	formatRsDisplayValue(1000, "1,000") === "1,000",
	"displayValue formatting preserved",
);
assert(formatRsDisplayValue(NaN) === "—", "non-finite display uses em dash");

const displayBucketRoot = createSummaryRoot();
const displayDetail = validDetail({
	primary: { value: 1000, displayValue: "1,000", label: "Total" },
});

assert(update(displayBucketRoot, displayDetail), "displayValue update accepted");
assert(displayBucketRoot.getAttribute("data-rs-digits") === "4", "bucket from raw value not displayValue");
assert(
	displayBucketRoot.querySelector('[data-rs-value="primary"]').textContent === "1,000",
	"displayValue written to DOM",
);

const invalidCases = [
	{ label: "NaN primary", detail: validDetail({ primary: { value: NaN } }) },
	{ label: "Infinity secondary", detail: validDetail({ secondary: [{ value: Infinity }, {}] }) },
	{ label: "missing secondary", detail: { primary: { value: 1 }, secondary: [{ key: "weekdays", value: 1 }] } },
	{ label: "key mismatch", detail: validDetail({ secondary: [{ key: "missing", value: 1 }, {}] }) },
];

for (const invalidCase of invalidCases) {
	const rootEl = createSummaryRoot();
	rootEl.querySelector('[data-rs-value="primary"]').textContent = "KEEP";
	rootEl.setAttribute("data-rs-digits", "1-2");

	assert(!update(rootEl, invalidCase.detail), `${invalidCase.label} rejected`);
	assert(
		rootEl.querySelector('[data-rs-value="primary"]').textContent === "KEEP",
		`${invalidCase.label} no partial DOM update`,
	);
	assert(rootEl.getAttribute("data-rs-digits") === "1-2", `${invalidCase.label} digits unchanged`);
}

const multiA = createSummaryRoot();
const multiB = createSummaryRoot(["left", "right"]);
multiB.querySelector('[data-rs-key="left"]');

assert(update(multiA, validDetail({ primary: { value: 5 } })), "multi-instance A update");
assert(update(multiB, validDetail({
	secondary: [
		{ key: "left", value: 100, label: "Left" },
		{ key: "right", value: 200, label: "Right" },
	],
})), "multi-instance B update with custom keys");

assert(multiA.getAttribute("data-rs-digits") === "1-2", "instance A bucket independent");
assert(multiB.getAttribute("data-rs-digits") === "3", "instance B bucket independent");

const bindRoot = createSummaryRoot();
const doc = new MiniDocument();
doc.body.appendChild(bindRoot);

const originalDocument = globalThis.document;
globalThis.document = doc;

init();
init();

assert(bindRoot.getAttribute("data-rs-controller-bound") === "true", "controller bound once");
assert(
	bindRoot.listeners.get(RS_UPDATE_EVENT)?.size === 1,
	"duplicate init does not duplicate listeners",
);

bindRoot.dispatchEvent({
	type: RS_UPDATE_EVENT,
	detail: validDetail({ primary: { value: 999, displayValue: "999" } }),
});

assert(bindRoot.getAttribute("data-rs-digits") === "3", "rs:update event updates target root only");

globalThis.document = originalDocument;

const layoutRoot = createSummaryRoot();
layoutRoot.setAttribute("data-rs-digits", "5");
layoutRoot.querySelector('[data-rs-value="primary"]').textContent = "12345";
layoutRoot.querySelector(".rs-status").textContent = "KEEP_STATUS";
layoutRoot.setAttribute("data-rs-layout", "portrait");
assert(layoutRoot.getAttribute("data-rs-digits") === "5", "layout attr change does not recalc bucket");
assert(
	layoutRoot.querySelector(".rs-status").textContent === "KEEP_STATUS",
	"layout attr change does not update .rs-status",
);

const ssrValues = [42, 7, 3];
const clientValues = [42, 7, 3];
assert(
	computeRsDigits(ssrValues) === computeRsDigits(clientValues),
	"SSR and client computeRsDigits consistent",
);

assert(
	validateRsUpdatePayload(createSummaryRoot(), validDetail()),
	"validateRsUpdatePayload accepts valid detail",
);

assert(
	ResultSummaryController.RS_UPDATE_EVENT === RS_UPDATE_EVENT,
	"ResultSummaryController export surface",
);

const tokenCss = read("src/styles/tools/result-summary.css");
assert(
	tokenCss.includes("[data-rs-variant=\"standard\"]") &&
		tokenCss.includes("--rs-desktop-primary-size-6plus: 4.5rem"),
	"standard 6+ explicit fallback not large default",
);
assert(
	tokenCss.includes("[data-rs-variant=\"spacious\"]") &&
		tokenCss.includes("--rs-desktop-primary-size-6plus: 7rem"),
	"spacious 6+ explicit fallback",
);

const catalog = read("src/data/toolsCatalog.ts");
const sitemapConfig = existsSync(join(root, "astro.config.mjs"))
	? read("astro.config.mjs")
	: "";

assert(!catalog.includes("ResultSummary"), "ResultSummary not in tools catalog");
assert(!sitemapConfig.includes("result-summary"), "no sitemap entry for fixture");

/* Production must not expose ResultSummary preview route or fixture hooks */
assert(
	!existsSync(join(root, "src/pages/preview/result-summary")) &&
		!existsSync(join(root, "src/pages/preview/result-summary/index.astro")),
	"no production preview route for ResultSummary",
);

const controllerSrc = read("src/scripts/result-summary-controller.ts");
assert(
	!controllerSrc.includes("local-fixtures") &&
		!controllerSrc.includes("fixture-matrix") &&
		!controllerSrc.includes("preview/result-summary"),
	"controller has no fixture／preview hooks in production API",
);
assert(
	!astro.includes("local-fixtures") && !css.includes("local-fixtures"),
	"shared Astro／CSS have no fixture path hooks",
);

/* DRC／BDC integration contracts */
const bdcCss = read("src/styles/tools/business-days-calculator-v2.css");
const drcCss = read("src/styles/tools/date-range-calculator-v2.css");
const bdcAstro = read(
	"src/components/tools/business-days-calculator-v2/BusinessDaysCalculatorV2.astro",
);
const drcAstro = read(
	"src/components/tools/date-range-calculator-v2/DateRangeCalculatorV2.astro",
);
const bdcScript = read("src/scripts/business-days-calculator.ts");
const drcScript = read("public/scripts/date-range.js");
const bdcContract = read("public/scripts/business-days-layout-contract.js");
const drcContract = read("public/scripts/date-range-layout-contract.js");

assert(
	(bdcAstro.match(/<ResultSummary\b/g) || []).length === 1,
	"BDC has exactly one ResultSummary",
);
assert(
	(drcAstro.match(/<ResultSummary\b/g) || []).length === 1,
	"DRC has exactly one ResultSummary",
);
assert(bdcAstro.includes('variant="spacious"'), "BDC variant=spacious");
assert(drcAstro.includes('variant="standard"'), "DRC variant=standard");

assert(
	!/data-bdcv2-result-days|data-bdcv2-result-digits|preview-tool-result-number|dispatchResultSummaryUpdate/.test(
		bdcAstro + bdcScript,
	),
	"BDC has no legacy result DOM／digit attrs／temporary adapter",
);
assert(
	!/#stat-total|#stat-workdays|data-drv2-result-digits|dispatchResultSummaryUpdate|resolveResultDigitBucket/.test(
		drcAstro + drcScript,
	),
	"DRC has no legacy result DOM／digit attrs／bucket／temporary adapter",
);

assert(
	!/setAttribute\(\s*["']data-rs-digits/.test(bdcScript) &&
		!/setAttribute\(\s*["']data-rs-digits/.test(drcScript),
	"tools do not write data-rs-digits",
);

assert(
	!/\.rs-value|\.rs-label|\.rs-primary|\.rs-secondary|\.rs-status/.test(bdcCss),
	"BDC tool CSS has no .rs-* internal overrides",
);
assert(
	!/preview-tool-result-number|bdcv2-result-secondary|bdcv2-result-main|data-bdcv2-result-digits/.test(
		bdcCss,
	),
	"BDC CSS has no legacy result typography／digit ladder",
);
assert(
	!/\.preview-tool-result-block[\s\S]{0,220}?grid-template-columns:\s*repeat\(3/.test(bdcCss) &&
		!/\.bdcv2-result-summary[\s\S]{0,220}?grid-template-columns:\s*repeat\(3/.test(bdcCss) &&
		!/--bdcv2-landscape-result-column-gap/.test(bdcCss) &&
		!/\[data-rs-digits/.test(bdcCss),
	"BDC CSS does not own ResultSummary landscape grid／digit gap",
);
assert(
	!/\[data-date-range-v2\][^{]*\.rs-(value|label|primary|secondary|status)/.test(drcCss) &&
		(!/\.rs-value[\s\S]{0,80}font-size:/.test(drcCss) ||
			!/\[data-date-range-v2\][^{]*\.rs-/.test(drcCss)),
	"DRC tool CSS has no .rs-* internal overrides",
);
assert(
	!/\.preview-tool-result-block[\s\S]{0,220}?grid-template-columns:\s*repeat\(3/.test(drcCss) &&
		!/\.drv2-result-summary[\s\S]{0,220}?grid-template-columns:\s*repeat\(3/.test(drcCss) &&
		!/\[data-rs-digits/.test(drcCss),
	"DRC tool CSS does not own ResultSummary landscape grid／digit gap",
);

assert(
	/TimivaBusinessDaysLayout/.test(bdcContract) &&
		/business-days-layout-contract\.js/.test(bdcAstro) &&
		/TimivaBusinessDaysLayout\?\.applyLayoutAttrs/.test(bdcAstro) &&
		/layoutContract\?\.resolveLayoutMode|TimivaBusinessDaysLayout/.test(bdcScript),
	"BDC initial bootstrap + layout gate share TimivaBusinessDaysLayout contract",
);
assert(
	/TimivaDateRangeLayout/.test(drcContract) &&
		/date-range-layout-contract\.js/.test(drcAstro) &&
		/TimivaDateRangeLayout\?\.applyLayoutAttrs/.test(drcAstro) &&
		/layoutContract\?\.resolveLayoutMode|TimivaDateRangeLayout/.test(drcScript),
	"DRC initial bootstrap + layout gate share TimivaDateRangeLayout contract",
);

const bdcLayoutGate =
	bdcScript.match(/const syncResultSummaryLayout = \(\) => \{[\s\S]*?\n\t\};/)?.[0] ?? "";
const drcLayoutGate =
	drcScript.match(/function syncResultSummaryLayout\(\) \{[\s\S]*?\n\}/)?.[0] ?? "";
assert(bdcLayoutGate.length > 0 && !bdcLayoutGate.includes("rs:update"), "BDC layout gate layout-only");
assert(
	drcLayoutGate.length > 0 && !drcLayoutGate.includes("rs:update"),
	"DRC layout gate layout-only",
);
assert(
	!/applyLayoutAttrs[\s\S]{0,300}(rs:update|data-rs-digits|rs-status)/.test(
		bdcContract + drcContract,
	),
	"layout contracts do not touch digits／status／rs:update",
);

assert(
	!/local-fixtures|fixture-matrix|preview\/result-summary/.test(bdcAstro + drcAstro + bdcCss + drcCss),
	"DRC／BDC production have no preview／fixture references",
);


/* --- content mode: numeric default + textual contract --- */
assert(
	astro.includes('data-rs-content="numeric"') && astro.includes('data-rs-content="textual"'),
	"Astro emits numeric and textual content attrs",
);
assert(
	!/variant\s*=\s*["']date["']/.test(astro),
	"no variant=date in ResultSummary",
);
assert(
	controllerSrc.includes('content: "textual"') || controllerSrc.includes('RsTextualUpdateDetail'),
	"controller exports textual update contract",
);
assert(controllerSrc.includes("readRsContent"), "controller exposes readRsContent");
// applyTextualUpdate must not setAttribute data-rs-digits
const applyTextualBlock =
	controllerSrc.match(/function applyTextualUpdate\([\s\S]*?\n\}/)?.[0] ?? "";
assert(applyTextualBlock.length > 0, "applyTextualUpdate exists");
assert(
	!applyTextualBlock.includes('setAttribute("data-rs-digits"') &&
		!applyTextualBlock.includes("computeRsDigits"),
	"textual update does not compute or set data-rs-digits",
);
assert(
	applyTextualBlock.includes('removeAttribute("data-rs-digits")'),
	"textual update clears data-rs-digits if present",
);

assert(
	css.includes('[data-rs-content="textual"]') &&
		css.includes('[data-rs-content="numeric"]'),
	"CSS scopes numeric and textual content",
);
assert(
	!/\[[^\]]*data-rs-content=["']textual["'][^\]]*\][^{]*\{[^}]*data-rs-digits/.test(css) &&
		!/\[data-rs-content="textual"\][\s\S]*?\[data-rs-digits/.test(
			css.split("/* -------------------------------------------------------------------------- */\n/* Textual mode")[1] ?? "",
		),
	"textual CSS does not select [data-rs-digits]",
);

const textualCss = css.includes("/* Textual mode")
	? css.slice(css.indexOf("/* Textual mode"))
	: css.slice(css.indexOf('[data-rs-content="textual"]'));
assert(textualCss.length > 0, "textual CSS section present");
assert(!/line-clamp\s*:/.test(textualCss), "textual CSS has no line-clamp");
assert(
	!/\.rs-support[^{]*\{[^}]*(text-overflow\s*:\s*ellipsis|line-clamp\s*:)/.test(textualCss),
	"textual .rs-support has no ellipsis／line-clamp truncation",
);
assert(
	/\.rs-support[\s\S]*?white-space:\s*pre-line/.test(textualCss) &&
		/\.rs-support[\s\S]*?overflow:\s*visible/.test(textualCss),
	"textual .rs-support uses pre-line（equal-level multiline via \\\\n）without clipping",
);
assert(
	/\[data-rs-layout="landscape"\][\s\S]*?grid-template-areas:[\s\S]*?primary weekday/.test(
		textualCss,
	),
	"textual landscape Primary + Weekday same row",
);
assert(
	/:has\(\.rs-weekday\[hidden\]\)/.test(textualCss),
	"textual landscape collapses when weekday hidden",
);

/* B3 textual primary defaults + supporting text size (Batch 2A) */
assert(
	/\[data-result-summary\]\[data-rs-content="textual"\][\s\S]*?--rs-textual-primary-size:\s*5rem/.test(
		textualCss,
	),
	"textual shared base primary default = 5rem (B3 desktop)",
);
assert(
	/\[data-result-summary\]\[data-rs-content="textual"\]\[data-rs-layout="portrait"\][\s\S]*?--rs-textual-primary-size:\s*4\.75rem/.test(
		textualCss,
	),
	"textual portrait primary default = 4.75rem (B3)",
);
assert(
	/\[data-result-summary\]\[data-rs-content="textual"\]\[data-rs-layout="landscape"\][\s\S]*?--rs-textual-primary-size:\s*3\.75rem/.test(
		textualCss,
	),
	"textual landscape primary default = 3.75rem (B3)",
);
assert(
	/\[data-result-summary\]\[data-rs-content="textual"\][\s\S]*?--rs-textual-support-size:\s*16px/.test(
		textualCss,
	),
	"textual support default size = 16px",
);
assert(
	!/\[data-rs-content="textual"\]\[data-rs-variant="spacious"\]\s*\{[^}]*--rs-textual-primary-size/.test(
		textualCss,
	),
	"textual spacious has no alternate primary default",
);

function createTextualRoot({ weekday = "", support = "" } = {}) {
	const summary = new MiniElement("section");
	summary.setAttribute("data-result-summary", "");
	summary.setAttribute("data-rs-content", "textual");
	summary.setAttribute("data-rs-layout", "desktop");
	summary.setAttribute("data-rs-variant", "standard");

	const primary = new MiniElement("div");
	const primaryValue = new MiniElement("div");
	primaryValue.setAttribute("data-rs-value", "primary");
	primaryValue.textContent = "?";
	primary.appendChild(primaryValue);
	summary.appendChild(primary);

	const weekdayEl = new MiniElement("div");
	weekdayEl.setAttribute("data-rs-weekday", "");
	weekdayEl.className = "rs-weekday";
	if (!weekday) {
		weekdayEl.hidden = true;
	} else {
		weekdayEl.textContent = weekday;
	}
	summary.appendChild(weekdayEl);

	const supportEl = new MiniElement("div");
	supportEl.setAttribute("data-rs-support", "");
	supportEl.className = "rs-support";
	if (!support) {
		supportEl.hidden = true;
	} else {
		supportEl.textContent = support;
	}
	summary.appendChild(supportEl);

	const status = new MiniElement("div");
	status.className = "rs-status";
	summary.appendChild(status);
	return summary;
}

const textualValid = {
	content: "textual",
	primary: { text: "AUG 10, 2026", ariaLabel: "August 10, 2026" },
	weekday: "Monday",
	support: "Add 3 weeks to Jul 12, 2026.",
};

const textualRoot = createTextualRoot();
assert(update(textualRoot, textualValid), "textual update accepted");
assert(
	textualRoot.getAttribute("data-rs-digits") === null,
	"textual update does not leave data-rs-digits",
);
assert(
	textualRoot.querySelector('[data-rs-value="primary"]').textContent === "AUG 10, 2026",
	"textual primary text written",
);
assert(
	textualRoot.querySelector("[data-rs-weekday]").textContent === "Monday" &&
		textualRoot.querySelector("[data-rs-weekday]").hidden === false,
	"textual weekday shown",
);
assert(
	textualRoot.querySelector("[data-rs-support]").textContent.includes("Add 3 weeks") &&
		textualRoot.querySelector("[data-rs-support]").hidden === false,
	"textual support shown",
);
assert(
	textualRoot.querySelector(".rs-status").textContent.includes("August 10, 2026") &&
		textualRoot.querySelector(".rs-status").textContent.includes("Monday"),
	"textual status uses ariaLabel and weekday",
);

assert(
	update(textualRoot, {
		content: "textual",
		primary: { text: "?" },
		weekday: null,
		support: "Enter a start date, then add or subtract a time period.",
	}),
	"textual initial-like update accepted",
);
assert(
	textualRoot.querySelector("[data-rs-weekday]").hidden === true &&
		textualRoot.querySelector("[data-rs-weekday]").textContent === "",
	"empty weekday hidden with no leftover text",
);
assert(
	!textualRoot.querySelector(".rs-status").textContent.includes("Monday"),
	"hidden weekday skipped in live-region status",
);

const textualRejectCases = [
	{
		label: "textual with secondary",
		detail: { ...textualValid, secondary: [{ key: "a", value: 1 }, { key: "b", value: 2 }] },
	},
	{
		label: "textual missing content key mismatch numeric payload",
		detail: validDetail(),
	},
	{
		label: "unknown content",
		detail: { content: "date", primary: { text: "?" } },
	},
	{
		label: "textual primary with numeric value field",
		detail: { content: "textual", primary: { text: "?", value: 0 } },
	},
];

for (const item of textualRejectCases) {
	const rootEl = createTextualRoot({ weekday: "Keep", support: "Keep" });
	rootEl.querySelector('[data-rs-value="primary"]').textContent = "KEEP";
	assert(!update(rootEl, item.detail), `${item.label} rejected`);
	assert(
		rootEl.querySelector('[data-rs-value="primary"]').textContent === "KEEP",
		`${item.label} no partial update`,
	);
}

const numericRoot = createSummaryRoot();
assert(
	!update(numericRoot, textualValid),
	"textual payload rejected on numeric root",
);

assert(
	astro.includes("data-rs-weekday") && astro.includes("data-rs-support"),
	"Astro textual markup includes weekday／support hooks",
);
const textualAstroBranch =
	astro.match(/data-rs-content="textual"[\s\S]*?data-rs-content="numeric"/)?.[0] ?? "";
assert(
	textualAstroBranch.length > 0 && !textualAstroBranch.includes("rs-secondary"),
	"textual branch has no rs-secondary",
);


console.log(`\nResult: ${passed} passed, ${failed} failed`);

if (failed > 0) {
	process.exit(1);
}

console.log("PASS");
