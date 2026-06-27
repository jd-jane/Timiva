/**
 * Validates Year Progress monthly-notes Markdown content and parser behavior.
 * Run: node scripts/validate-year-progress-monthly-notes.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
	buildYearProgressMonthlyNotesRegistry,
	getYearProgressMonthlyNote,
	parseYearProgressMonthlyNotesMarkdown,
	resolveYearProgressNotes,
} from "../src/lib/yearProgressMonthlyNotes.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_ROOT = path.join(__dirname, "../src/content/year-progress/monthly-notes");

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

function assertThrows(fn, message) {
	try {
		fn();
	} catch {
		assert(true, message);
		return;
	}

	failed += 1;
	console.error(`FAIL: ${message} (expected throw)`);
}

function readProductionFiles() {
	const files = {};

	if (!fs.existsSync(CONTENT_ROOT)) {
		throw new Error(`Missing content root: ${CONTENT_ROOT}`);
	}

	const yearFolders = fs
		.readdirSync(CONTENT_ROOT, { withFileTypes: true })
		.filter((entry) => entry.isDirectory());

	assert(yearFolders.length > 0, "At least one valid year folder exists");

	for (const yearFolder of yearFolders) {
		const year = yearFolder.name;
		assert(/^\d{4}$/.test(year), `Year folder name is four digits: ${year}`);

		const yearPath = path.join(CONTENT_ROOT, year);
		const entries = fs.readdirSync(yearPath, { withFileTypes: true });

		for (const entry of entries) {
			assert(entry.isFile(), `Only files are allowed in ${year}/ (${entry.name})`);
			assert(
				entry.name === "en.md" || entry.name === "zh.md",
				`Unsupported locale file in ${year}/: ${entry.name}`,
			);
		}

		for (const locale of ["en", "zh"]) {
			const filePath = path.join(yearPath, `${locale}.md`);
			assert(fs.existsSync(filePath), `${year} has ${locale}.md`);
			files[`../content/year-progress/monthly-notes/${year}/${locale}.md`] = fs.readFileSync(
				filePath,
				"utf8",
			);
		}
	}

	return files;
}

function buildFixtureRegistry(entries) {
	const files = {};

	for (const entry of entries) {
		files[`../content/year-progress/monthly-notes/${entry.year}/${entry.locale}.md`] =
			entry.markdown;
	}

	return buildYearProgressMonthlyNotesRegistry(files);
}

function validMarkdown(monthTexts) {
	return [
		"# Title",
		...monthTexts.flatMap((text, index) => {
			const month = String(index + 1).padStart(2, "0");
			return ["", `## ${month}`, "", text];
		}),
		"",
	].join("\n");
}

console.log("Year Progress monthly notes validation");

const productionFiles = readProductionFiles();
const productionRegistry = buildYearProgressMonthlyNotesRegistry(productionFiles);

for (const year of Object.keys(productionRegistry).sort()) {
	for (const locale of ["en", "zh"]) {
		const notes = productionRegistry[year][locale];
		assert(Array.isArray(notes) && notes.length === 12, `${year} ${locale.toUpperCase()}: 12/12`);
		assert(notes.every((note) => typeof note === "string" && note.length > 0), `${year} ${locale} notes non-empty`);
	}
}

assert(Object.keys(productionRegistry).includes("2026"), "Production registry includes 2026");
console.log("2026 EN: 12/12");
console.log("2026 ZH: 12/12");
console.log("Year pairs: pass");

const parserFixtures = [
	{
		label: "Missing month",
		markdown: validMarkdown(Array.from({ length: 11 }, (_, index) => `Note ${index + 1}`)),
	},
	{
		label: "Duplicate month",
		markdown: `${validMarkdown(Array.from({ length: 12 }, (_, index) => `Note ${index + 1}`))}\n\n## 01\n\nDuplicate.`,
	},
	{
		label: "Invalid month 00",
		markdown: "# Title\n\n## 00\n\nBad.\n" + validMarkdown(Array.from({ length: 11 }, () => "x")).split("\n").slice(4).join("\n"),
	},
	{
		label: "Invalid month 13",
		markdown: "# Title\n\n## 13\n\nBad.\n",
	},
	{
		label: "Unpadded heading",
		markdown: "# Title\n\n## 1\n\nBad.\n",
	},
	{
		label: "Extra H2",
		markdown: `${validMarkdown(Array.from({ length: 12 }, (_, index) => `Note ${index + 1}`))}\n\n## Bonus\n\nExtra.`,
	},
	{
		label: "H3 heading",
		markdown: "# Title\n\n## 01\n\n### Nope\n",
	},
	{
		label: "Multiple paragraphs",
		markdown: "# Title\n\n## 01\n\nFirst.\n\nSecond.\n",
	},
	{
		label: "List",
		markdown: "# Title\n\n## 01\n\n- item\n",
	},
	{
		label: "Blockquote",
		markdown: "# Title\n\n## 01\n\n> quote\n",
	},
	{
		label: "Link",
		markdown: "# Title\n\n## 01\n\n[text](https://example.com)\n",
	},
	{
		label: "Image",
		markdown: "# Title\n\n## 01\n\n![alt](image.png)\n",
	},
	{
		label: "Code block",
		markdown: "# Title\n\n## 01\n\n```js\nconst x = 1;\n```\n",
	},
	{
		label: "Inline HTML",
		markdown: "# Title\n\n## 01\n\n<b>bold</b>\n",
	},
	{
		label: "Frontmatter",
		markdown: "---\ntitle: bad\n---\n\n# Title\n\n## 01\n\nNote.\n",
	},
	{
		label: "Empty note",
		markdown: "# Title\n\n## 01\n\n   \n",
	},
];

for (const fixture of parserFixtures) {
	assertThrows(
		() => parseYearProgressMonthlyNotesMarkdown(fixture.markdown, fixture.label),
		`Markdown contract rejects ${fixture.label}`,
	);
}

assert(
	parseYearProgressMonthlyNotesMarkdown(validMarkdown(Array.from({ length: 12 }, (_, index) => `Note ${index + 1}`))).length === 12,
	"Valid fixture parses to twelve notes",
);
console.log("Markdown contract: pass");

const only2026 = buildFixtureRegistry([
	{
		year: "2026",
		locale: "en",
		markdown: validMarkdown(Array.from({ length: 12 }, (_, index) => `EN ${index + 1}`)),
	},
	{
		year: "2026",
		locale: "zh",
		markdown: validMarkdown(Array.from({ length: 12 }, (_, index) => `ZH ${index + 1}`)),
	},
]);

assert(
	resolveYearProgressNotes(only2026, 2026, "en")?.[0] === "EN 1",
	"Exact year resolves to 2026 EN",
);
assert(
	resolveYearProgressNotes(only2026, 2027, "en")?.[0] === "EN 1",
	"Latest earlier year resolves 2027 to 2026",
);
assert(
	resolveYearProgressNotes(only2026, 2025, "en")?.[0] === "EN 1",
	"Earliest later year resolves 2025 to 2026",
);

const twoYears = buildFixtureRegistry([
	{
		year: "2026",
		locale: "en",
		markdown: validMarkdown(Array.from({ length: 12 }, (_, index) => `2026 EN ${index + 1}`)),
	},
	{
		year: "2026",
		locale: "zh",
		markdown: validMarkdown(Array.from({ length: 12 }, (_, index) => `2026 ZH ${index + 1}`)),
	},
	{
		year: "2027",
		locale: "en",
		markdown: validMarkdown(Array.from({ length: 12 }, (_, index) => `2027 EN ${index + 1}`)),
	},
	{
		year: "2027",
		locale: "zh",
		markdown: validMarkdown(Array.from({ length: 12 }, (_, index) => `2027 ZH ${index + 1}`)),
	},
]);

assert(
	resolveYearProgressNotes(twoYears, 2027, "en")?.[0] === "2027 EN 1",
	"Exact year resolves to 2027 EN",
);
assert(
	resolveYearProgressNotes(twoYears, 2028, "en")?.[0] === "2027 EN 1",
	"Multiple future years resolve to latest earlier year",
);
assert(
	resolveYearProgressNotes(twoYears, 2025, "en")?.[0] === "2026 EN 1",
	"Multiple past years resolve to earliest later year",
);
assert(resolveYearProgressNotes({}, 2026, "en") === null, "Empty registry resolves to null");

assert(
	resolveYearProgressNotes(only2026, 2026, "en")?.[5] === "EN 6" &&
		resolveYearProgressNotes(only2026, 2026, "zh")?.[5] === "ZH 6",
	"Locale isolation keeps EN and ZH separate",
);
assert(
	getYearProgressMonthlyNote(resolveYearProgressNotes(only2026, 2026, "en"), 11, "fallback") === "EN 12",
	"Month index selects December note",
);
console.log("Fallback cases: pass");
console.log("Locale isolation: pass");

console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
	process.exitCode = 1;
}
