#!/usr/bin/env node
/**
 * Mobile Bottom Sheet Visual Baseline — shared field typography＋AME footer.
 * Canonical: docs/standards/mobile-sheet.md §18
 *
 * Run: node scripts/validate-mobile-sheet-visual-baseline.mjs
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(relPath) {
	return readFileSync(join(root, relPath), "utf8");
}

function exists(relPath) {
	return existsSync(join(root, relPath));
}

function stripComments(source) {
	return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function walkFiles(dir, matcher, files = []) {
	if (!existsSync(dir)) {
		return files;
	}
	for (const entry of readdirSync(dir)) {
		const fullPath = join(dir, entry);
		const stat = statSync(fullPath);
		if (stat.isDirectory()) {
			walkFiles(fullPath, matcher, files);
			continue;
		}
		if (matcher(fullPath)) {
			files.push(fullPath);
		}
	}
	return files;
}

function selectorHasClass(selector, className) {
	const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	return new RegExp(`${escaped}(?![A-Za-z0-9_-])`).test(selector);
}

function declarationsForClass(css, className) {
	const results = [];
	let idx = 0;
	while (true) {
		const found = css.indexOf(className, idx);
		if (found === -1) {
			break;
		}
		const open = css.indexOf("{", found);
		if (open === -1) {
			break;
		}
		const prevClose = css.lastIndexOf("}", found);
		const selector = css.slice(prevClose + 1, open);
		if (selectorHasClass(selector, className)) {
			const close = css.indexOf("}", open);
			if (close !== -1) {
				results.push({ selector: selector.replace(/\s+/g, " ").trim(), body: css.slice(open + 1, close) });
			}
		}
		idx = found + className.length;
	}
	return results;
}

function declValue(body, prop) {
	const match = body.match(new RegExp(`${prop}:\\s*([^;]+)`));
	return match ? match[1].trim() : null;
}

let passed = 0;
let failed = 0;

function ok(cond, label) {
	if (cond) {
		passed += 1;
		return;
	}
	failed += 1;
	console.error(`FAIL: ${label}`);
}

console.log("validate-mobile-sheet-visual-baseline\n");

const ameCssRel = "src/styles/tools/adaptive-mobile-editor.css";
const msbCssRel = "src/styles/tools/tool-mobile-sheet-v2-baseline.css";
const ameAstroRel = "src/components/tools/shared/AdaptiveMobileEditor.astro";
const enRel = "src/i18n/en.ts";
const zhRel = "src/i18n/zh.ts";
const hoursAstroRel = "src/components/tools/hours-calculator-v2/HoursCalculatorV2.astro";

ok(exists(ameCssRel), "AME CSS tracked");
ok(exists(msbCssRel), "MSB CSS tracked");
ok(exists(ameAstroRel), "AME shell tracked");

const ameCss = stripComments(read(ameCssRel));
const msbCss = stripComments(read(msbCssRel));
const ameAstro = read(ameAstroRel);
const enSrc = read(enRel);
const zhSrc = read(zhRel);

const numericRules = declarationsForClass(ameCss, ".ame-numeric-value").filter(
	(rule) => !rule.selector.includes("placeholder"),
);
ok(numericRules.length > 0, "AME .ame-numeric-value rule present");
ok(
	numericRules.every(
		(rule) =>
			declValue(rule.body, "font-size") === "1rem" &&
			declValue(rule.body, "font-weight") === "500" &&
			declValue(rule.body, "line-height") === "1.25rem",
	),
	"AME numeric value = 1rem / 500 / 1.25rem",
);

const nativeRules = declarationsForClass(ameCss, ".ame-native-control").filter(
	(rule) => !rule.selector.includes("focus"),
);
ok(
	nativeRules.some(
		(rule) =>
			declValue(rule.body, "font-size") === "1rem" &&
			declValue(rule.body, "font-weight") === "500" &&
			declValue(rule.body, "line-height") === "1.25rem",
	),
	"AME native control = 1rem / 500 / 1.25rem",
);

const labelRules = declarationsForClass(ameCss, ".ame-setting-label");
ok(
	labelRules.some(
		(rule) =>
			declValue(rule.body, "font-size") === "0.75rem" &&
			declValue(rule.body, "font-weight") === "500" &&
			declValue(rule.body, "line-height") === "1rem",
	),
	"AME setting label = 0.75rem / 500 / 1rem",
);

const keyRules = declarationsForClass(ameCss, ".ame-key").filter(
	(rule) => rule.selector === ".ame-key" || rule.selector.endsWith(" .ame-key"),
);
ok(
	keyRules.some((rule) => declValue(rule.body, "font-size") === "1.0625rem"),
	"AME keypad keys keep independent 1.0625rem typography",
);

const msbPrefix = declarationsForClass(msbCss, ".msb-input-prefix");
ok(
	msbPrefix.some(
		(rule) =>
			declValue(rule.body, "font-size") === "0.75rem" &&
			declValue(rule.body, "font-weight") === "500" &&
			declValue(rule.body, "line-height") === "1rem",
	),
	"MSB prefix label = 0.75rem / 500 / 1rem",
);

const msbInput = declarationsForClass(msbCss, ".msb-input").filter(
	(rule) => !rule.selector.includes("placeholder") && !rule.selector.includes("focus"),
);
ok(
	msbInput.every(
		(rule) =>
			declValue(rule.body, "font-size") === "1rem" &&
			declValue(rule.body, "font-weight") === "500" &&
			declValue(rule.body, "line-height") === "1.25rem",
	),
	"MSB input value = 1rem / 500 / 1.25rem",
);

ok(/ameChrome/.test(ameAstro) && /getMessages/.test(ameAstro), "AME chrome uses shared ameChrome i18n");
ok(/resetLabel\?:/.test(ameAstro), "AME exposes optional resetLabel");
ok(
	/ameChrome:\s*\{[\s\S]*?reset:\s*"Reset"[\s\S]*?done:\s*"Done"/.test(enSrc),
	"EN ameChrome = Reset / Done",
);
ok(
	/ameChrome:\s*\{[\s\S]*?reset:\s*"重設"[\s\S]*?done:\s*"完成"/.test(zhSrc),
	"ZH ameChrome = 重設 / 完成",
);

const hoursAstro = read(hoursAstroRel);
ok(/resetLabel=\{m\.clearTimesLabel\}/.test(hoursAstro), "Hours passes clearTimesLabel as resetLabel");
ok(/locale=\{locale\}/.test(hoursAstro), "Hours AME receives locale");
ok(!/data-hcv2-clear-times-label/.test(hoursAstro), "Hours no longer patches footer via data attribute");

const VALUE_CLASSES = [
	".ame-numeric-value",
	".ame-native-control",
	".talc-ame-field-value",
	".hcv2-ame-segment",
	".msb-input",
];
const LABEL_CLASSES = [".ame-setting-label", ".ame-numeric-label", ".talc-ame-field-label", ".hcv2-ame-row-label", ".msb-input-prefix"];

const toolCssFiles = walkFiles(join(root, "src/styles/tools"), (full) => full.endsWith(".css")).map((full) =>
	relative(root, full),
);

for (const rel of toolCssFiles) {
	if (rel.endsWith("adaptive-mobile-editor.css") || rel.endsWith("tool-mobile-sheet-v2-baseline.css")) {
		continue;
	}
	const css = stripComments(read(rel));
	for (const className of VALUE_CLASSES) {
		for (const rule of declarationsForClass(css, className)) {
			const size = declValue(rule.body, "font-size");
			if (size && size !== "1rem") {
				ok(false, `${rel} ${rule.selector} font-size drift: ${size}`);
			}
		}
	}
	for (const className of LABEL_CLASSES) {
		for (const rule of declarationsForClass(css, className)) {
			const size = declValue(rule.body, "font-size");
			if (size && size !== "0.75rem") {
				ok(false, `${rel} ${rule.selector} label font-size drift: ${size}`);
			}
		}
	}
}

const hoursCss = stripComments(read("src/styles/tools/hours-calculator-v2.css"));
const hoursSeg = declarationsForClass(hoursCss, ".hcv2-ame-segment").filter(
	(rule) => !rule.selector.includes("active") && !rule.selector.includes("placeholder"),
);
ok(
	hoursSeg.some(
		(rule) =>
			declValue(rule.body, "font-size") === "1rem" &&
			declValue(rule.body, "font-weight") === "500" &&
			declValue(rule.body, "line-height") === "1.25rem",
	),
	"Hours AME segment value restates 1rem / 500 / 1.25rem",
);
const hoursLabel = declarationsForClass(hoursCss, ".hcv2-ame-row-label");
ok(
	hoursLabel.some(
		(rule) =>
			declValue(rule.body, "font-size") === "0.75rem" &&
			declValue(rule.body, "font-weight") === "500" &&
			declValue(rule.body, "line-height") === "1rem",
	),
	"Hours AME row label restates 0.75rem / 500 / 1rem",
);

const talcCss = stripComments(read("src/styles/tools/taiwan-annual-leave-calculator-v2.css"));
const talcValue = declarationsForClass(talcCss, ".talc-ame-field-value").filter(
	(rule) => !rule.selector.includes("placeholder"),
);
ok(
	talcValue.some(
		(rule) =>
			declValue(rule.body, "font-size") === "1rem" &&
			declValue(rule.body, "font-weight") === "500" &&
			declValue(rule.body, "line-height") === "1.25rem",
	),
	"TALC AME field value restates 1rem / 500 / 1.25rem",
);
ok(
	!talcValue.some((rule) => rule.selector.includes("keypad") && declValue(rule.body, "font-size")),
	"TALC keypad-open does not shrink field value",
);

const COMPOUND = [".tyar-field-shell", ".jecv2-field-shell", ".hcv2-field-shell"];
const astroFiles = walkFiles(join(root, "src/components/tools"), (full) => full.endsWith(".astro")).map((full) =>
	relative(root, full),
);
for (const rel of astroFiles) {
	const src = read(rel);
	const blocks = src.match(/<AdaptiveMobileEditor[\s\S]*?<\/AdaptiveMobileEditor>/g) || [];
	for (const block of blocks) {
		for (const compound of COMPOUND) {
			ok(!block.includes(compound), `${rel} AME slot must not contain ${compound}`);
		}
	}
}

const scriptFiles = [
	...walkFiles(join(root, "src/scripts"), (full) => full.endsWith(".ts")),
	...walkFiles(join(root, "src/components/tools"), (full) => full.endsWith(".astro")),
].map((full) => relative(root, full));

for (const rel of scriptFiles) {
	if (rel.endsWith("AdaptiveMobileEditor.astro")) {
		continue;
	}
	const src = stripComments(read(rel));
	const patch =
		/\[data-ame-reset\][\s\S]{0,240}textContent\s*=/.test(src) ||
		/\[data-ame-submit\][\s\S]{0,240}textContent\s*=/.test(src);
	ok(!patch, `${rel} must not DOM-patch AME Reset／Done copy`);
}

ok(!read("src/components/tools/age-calculator-v2/AgeCalculatorV2.astro").includes("AdaptiveMobileEditor"), "Age stays on MSB; no AME footer added");

ok(exists("docs/standards/mobile-sheet.md") && /## 18\. Shared Mobile field typography/.test(read("docs/standards/mobile-sheet.md")), "Canonical §18 exists");

console.log(`\nvalidate-mobile-sheet-visual-baseline: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
