export type YearProgressMonthlyNotesLocale = "en" | "zh";

export type YearProgressMonthlyNotesRegistry = Record<
	string,
	{
		en: readonly string[];
		zh: readonly string[];
	}
>;

const MONTH_HEADING_PATTERN = /^##\s+(0[1-9]|1[0-2])\s*$/;
const YEAR_LOCALE_PATH_PATTERN = /monthly-notes\/(\d{4})\/(en|zh)\.md$/;
const SUPPORTED_LOCALES = new Set<YearProgressMonthlyNotesLocale>(["en", "zh"]);

function formatSourceLabel(sourceLabel: string | undefined, detail: string): string {
	return sourceLabel ? `${sourceLabel}: ${detail}` : detail;
}

function assertMarkdownContract(
	line: string,
	sourceLabel: string | undefined,
): void {
	const trimmed = line.trim();

	if (/^#{3,}\s/.test(trimmed)) {
		throw new Error(formatSourceLabel(sourceLabel, "H3 or deeper headings are not allowed"));
	}

	if (/^```/.test(trimmed)) {
		throw new Error(formatSourceLabel(sourceLabel, "Fenced code blocks are not allowed"));
	}

	if (/^>\s?/.test(trimmed)) {
		throw new Error(formatSourceLabel(sourceLabel, "Blockquotes are not allowed"));
	}

	if (/^\s*[-*+]\s+/.test(trimmed)) {
		throw new Error(formatSourceLabel(sourceLabel, "Markdown lists are not allowed"));
	}

	if (/^\s*\d+\.\s+/.test(trimmed)) {
		throw new Error(formatSourceLabel(sourceLabel, "Markdown lists are not allowed"));
	}

	if (/\[[^\]]+\]\([^)]+\)/.test(trimmed)) {
		throw new Error(formatSourceLabel(sourceLabel, "Markdown links are not allowed"));
	}

	if (/!\[[^\]]*\]\([^)]+\)/.test(trimmed)) {
		throw new Error(formatSourceLabel(sourceLabel, "Markdown images are not allowed"));
	}

	if (/<[a-zA-Z][^>]*>/.test(trimmed)) {
		throw new Error(formatSourceLabel(sourceLabel, "Inline HTML is not allowed"));
	}
}

function normalizeParagraphLines(lines: string[], sourceLabel: string | undefined): string {
	const nonEmptyLines = lines.map((line) => line.trim()).filter((line) => line.length > 0);

	if (nonEmptyLines.length === 0) {
		throw new Error(formatSourceLabel(sourceLabel, "Month note must not be empty"));
	}

	const paragraph = nonEmptyLines.join(" ");
	assertMarkdownContract(paragraph, sourceLabel);
	return paragraph;
}

export function parseYearProgressMonthlyNotesMarkdown(
	rawMarkdown: string,
	sourceLabel?: string,
): readonly string[] {
	const normalized = rawMarkdown.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

	if (/^\s*---\s*\n/.test(normalized)) {
		throw new Error(formatSourceLabel(sourceLabel, "YAML frontmatter is not allowed"));
	}

	const lines = normalized.split("\n");
	const notes: string[] = [];
	const seenMonths = new Set<number>();
	let currentMonth: number | null = null;
	let paragraphLines: string[] = [];
	let paragraphComplete = false;
	let sawH1 = false;
	let sawMonthHeading = false;

	const flushMonth = (): void => {
		if (currentMonth === null) return;

		const monthNumber = currentMonth;
		const monthLabel = String(monthNumber).padStart(2, "0");
		const monthSource = sourceLabel ? `${sourceLabel} ## ${monthLabel}` : `## ${monthLabel}`;

		if (seenMonths.has(monthNumber)) {
			throw new Error(formatSourceLabel(monthSource, "Duplicate month heading"));
		}

		const note = normalizeParagraphLines(paragraphLines, monthSource);
		notes[monthNumber - 1] = note;
		seenMonths.add(monthNumber);
		currentMonth = null;
		paragraphLines = [];
		paragraphComplete = false;
	};

	for (const rawLine of lines) {
		const line = rawLine.trimEnd();
		const trimmed = line.trim();

		if (trimmed.length === 0) {
			if (currentMonth !== null && paragraphLines.some((entry) => entry.trim().length > 0)) {
				paragraphComplete = true;
			}
			continue;
		}

		if (/^#\s+/.test(trimmed) && !/^##\s+/.test(trimmed)) {
			if (sawH1) {
				throw new Error(formatSourceLabel(sourceLabel, "Only one H1 document title is allowed"));
			}
			if (sawMonthHeading) {
				throw new Error(formatSourceLabel(sourceLabel, "H1 must appear before month headings"));
			}
			sawH1 = true;
			continue;
		}

		if (/^##\s+/.test(trimmed)) {
			flushMonth();

			if (!MONTH_HEADING_PATTERN.test(trimmed)) {
				throw new Error(
					formatSourceLabel(sourceLabel, `Invalid month heading "${trimmed}"`),
				);
			}

			const monthNumber = Number.parseInt(trimmed.slice(3).trim(), 10);
			currentMonth = monthNumber;
			paragraphComplete = false;
			sawMonthHeading = true;
			continue;
		}

		if (currentMonth === null) {
			throw new Error(
				formatSourceLabel(sourceLabel, "Content must appear under a month heading"),
			);
		}

		if (paragraphComplete) {
			throw new Error(
				formatSourceLabel(sourceLabel, "Only one plain-text paragraph is allowed per month"),
			);
		}

		assertMarkdownContract(line, sourceLabel);
		paragraphLines.push(line);
	}

	flushMonth();

	if (notes.length !== 12 || notes.some((note) => typeof note !== "string" || note.length === 0)) {
		throw new Error(formatSourceLabel(sourceLabel, "Exactly twelve non-empty month notes are required"));
	}

	for (let month = 1; month <= 12; month += 1) {
		if (!seenMonths.has(month)) {
			const monthLabel = String(month).padStart(2, "0");
			throw new Error(formatSourceLabel(sourceLabel, `Missing month ## ${monthLabel}`));
		}
	}

	return notes;
}

function normalizeGlobRawContent(value: unknown): string {
	if (typeof value === "string") return value;
	if (
		value &&
		typeof value === "object" &&
		"default" in value &&
		typeof (value as { default: unknown }).default === "string"
	) {
		return (value as { default: string }).default;
	}

	throw new Error("Invalid raw Markdown module value");
}

function parseYearLocalePath(
	filePath: string,
): { year: string; locale: YearProgressMonthlyNotesLocale } {
	const match = filePath.replace(/\\/g, "/").match(YEAR_LOCALE_PATH_PATTERN);
	if (!match) {
		throw new Error(`Unsupported monthly-notes path "${filePath}"`);
	}

	const year = match[1];
	const locale = match[2] as YearProgressMonthlyNotesLocale;

	if (!/^\d{4}$/.test(year)) {
		throw new Error(`Year folder must be four digits: "${year}"`);
	}

	if (!SUPPORTED_LOCALES.has(locale)) {
		throw new Error(`Unsupported locale file "${filePath}"`);
	}

	return { year, locale };
}

export function buildYearProgressMonthlyNotesRegistry(
	files: Record<string, unknown>,
): YearProgressMonthlyNotesRegistry {
	const parsedByYear = new Map<
		string,
		Partial<Record<YearProgressMonthlyNotesLocale, readonly string[]>>
	>();
	const localePathCounts = new Map<string, number>();

	for (const [filePath, rawValue] of Object.entries(files)) {
		const normalizedPath = filePath.replace(/\\/g, "/");

		if (normalizedPath.endsWith("/README.md")) {
			continue;
		}

		const { year, locale } = parseYearLocalePath(normalizedPath);
		const localeKey = `${year}/${locale}.md`;
		localePathCounts.set(localeKey, (localePathCounts.get(localeKey) ?? 0) + 1);

		if ((localePathCounts.get(localeKey) ?? 0) > 1) {
			throw new Error(`Duplicate monthly-notes file for ${localeKey}`);
		}

		const notes = parseYearProgressMonthlyNotesMarkdown(
			normalizeGlobRawContent(rawValue),
			`monthly-notes/${year}/${locale}.md`,
		);

		const yearEntry = parsedByYear.get(year) ?? {};
		if (yearEntry[locale]) {
			throw new Error(`Duplicate locale entry for ${year}/${locale}.md`);
		}

		yearEntry[locale] = notes;
		parsedByYear.set(year, yearEntry);
	}

	if (parsedByYear.size === 0) {
		throw new Error("No valid year-progress monthly-notes content found");
	}

	const registry: YearProgressMonthlyNotesRegistry = {};

	for (const year of [...parsedByYear.keys()].sort((a, b) => Number(a) - Number(b))) {
		const entry = parsedByYear.get(year);
		if (!entry?.en) {
			throw new Error(`Missing en.md for year ${year}`);
		}
		if (!entry?.zh) {
			throw new Error(`Missing zh.md for year ${year}`);
		}

		registry[year] = {
			en: entry.en,
			zh: entry.zh,
		};
	}

	return registry;
}

export function resolveYearProgressNotes(
	registry: YearProgressMonthlyNotesRegistry,
	localYear: number,
	locale: YearProgressMonthlyNotesLocale,
): readonly string[] | null {
	const years = Object.keys(registry)
		.map((year) => Number.parseInt(year, 10))
		.filter((year) => Number.isFinite(year))
		.sort((a, b) => a - b);

	if (years.length === 0) return null;

	const exact = years.find((year) => year === localYear);
	if (exact !== undefined) {
		return registry[String(exact)][locale];
	}

	const earlierYears = years.filter((year) => year < localYear);
	if (earlierYears.length > 0) {
		const resolved = earlierYears[earlierYears.length - 1];
		return registry[String(resolved)][locale];
	}

	const laterYears = years.filter((year) => year > localYear);
	if (laterYears.length > 0) {
		const resolved = laterYears[0];
		return registry[String(resolved)][locale];
	}

	return null;
}

export function getYearProgressMonthlyNote(
	notes: readonly string[] | null,
	monthIndex: number,
	fallback: string,
): string {
	if (!notes || monthIndex < 0 || monthIndex >= notes.length) {
		return fallback;
	}

	const text = notes[monthIndex];
	return typeof text === "string" && text.length > 0 ? text : fallback;
}
