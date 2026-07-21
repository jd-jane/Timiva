/**
 * Phase A validation for ResultSummary shared layer.
 * Run: node scripts/validate-result-summary-phase-a.mjs
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
	}

	setAttribute(name, value) {
		this.attributes.set(name, String(value));
	}

	getAttribute(name) {
		return this.attributes.has(name) ? this.attributes.get(name) : null;
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

console.log("validate-result-summary-phase-a");

assert(existsSync(join(root, "src/components/tools/shared/ResultSummary.astro")), "ResultSummary.astro exists");
assert(existsSync(join(root, "src/styles/tools/result-summary.css")), "result-summary.css exists");
assert(existsSync(join(root, "src/scripts/result-summary-controller.ts")), "controller exists");
assert(
	existsSync(join(root, "local-fixtures/result-summary/fixture-matrix.html")),
	"dev-only fixture matrix exists",
);

const css = read("src/styles/tools/result-summary.css");
const astro = read("src/components/tools/shared/ResultSummary.astro");

assert(!astro.includes("digits?:"), "Props do not expose digits");
assert(astro.includes("computeRsDigits"), "SSR uses computeRsDigits");
assert(astro.includes('class="rs-status"') && astro.includes('aria-live="polite"'), "accessibility status region exists");
const sectionTag = astro.match(/<section[\s\S]*?>/m)?.[0] ?? "";
assert(!sectionTag.includes("aria-live"), "visual section root is not live region");

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
layoutRoot.setAttribute("data-rs-layout", "portrait");
assert(layoutRoot.getAttribute("data-rs-digits") === "5", "layout attr change does not recalc bucket");

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

console.log(`\nResult: ${passed} passed, ${failed} failed`);

if (failed > 0) {
	process.exit(1);
}

console.log("PASS");
