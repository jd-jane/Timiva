/**
 * Japanese Era Converter — 結果字串格式（B2A）。
 * 只格式化 evaluate 已判定的結果，不再做 validation。不碰 DOM／CSS。
 */
import { getEra, isEraId, type EraId, type MonthDay } from "./japaneseEraConverterData.ts";
import type {
	JecEraYear,
	JecEvaluation,
	JecTransitionPart,
} from "./japaneseEraConverterEvaluate.ts";

export type JecFormatLocale = "en" | "zh";

export type JecFormattedResult = {
	primary: string;
	support: string | null;
	futureReiwaAssumption: boolean;
	assumptionNote: string | null;
};

const EN_MONTHS = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
] as const;

const ASSUMPTION_NOTE = {
	en: "Assuming the Reiwa era remains in use.",
	zh: "此結果假設令和年號持續使用",
} as const;

function formatEraYear(era: JecEraYear, locale: JecFormatLocale): string {
	const def = getEra(era.eraId);
	if (locale === "zh") {
		return era.eraYear === 1 ? `${def.zh}元年` : `${def.zh}${era.eraYear}年`;
	}
	return `${def.en} ${era.eraYear}`;
}

function formatGregorianYear(year: number, locale: JecFormatLocale): string {
	return locale === "zh" ? `${year}年` : String(year);
}

function formatZhMonthDay(date: MonthDay): string {
	return `${date.month}月${date.day}日`;
}

function formatEnMonthDay(date: MonthDay): string {
	return `${EN_MONTHS[date.month - 1]} ${date.day}`;
}

function formatDateRange(start: MonthDay, end: MonthDay, locale: JecFormatLocale): string {
	if (locale === "zh") {
		return `${formatZhMonthDay(start)}－${formatZhMonthDay(end)}`;
	}
	return `${formatEnMonthDay(start)}–${formatEnMonthDay(end)}`;
}

function formatTransitionPrimary(
	parts: [JecTransitionPart, JecTransitionPart],
	locale: JecFormatLocale,
): string {
	const left = formatEraYear(parts[0], locale);
	const right = formatEraYear(parts[1], locale);
	return locale === "zh" ? `${left}｜${right}` : `${left} | ${right}`;
}

function formatTransitionSupport(
	parts: [JecTransitionPart, JecTransitionPart],
	locale: JecFormatLocale,
): string {
	if (locale === "zh") {
		return `${formatEraYear(parts[0], locale)} ${formatDateRange(parts[0].range.start, parts[0].range.end, locale)} / ${formatEraYear(parts[1], locale)} ${formatDateRange(parts[1].range.start, parts[1].range.end, locale)}`;
	}

	return `${formatEraYear(parts[0], locale)}: ${formatDateRange(parts[0].range.start, parts[0].range.end, locale)} / ${formatEraYear(parts[1], locale)}: ${formatDateRange(parts[1].range.start, parts[1].range.end, locale)}`;
}

function emptyFormatted(): JecFormattedResult {
	return {
		primary: "?",
		support: null,
		futureReiwaAssumption: false,
		assumptionNote: null,
	};
}

export function formatJapaneseEraResult(
	evaluation: JecEvaluation,
	locale: JecFormatLocale,
): JecFormattedResult {
	if (evaluation.status !== "valid") {
		return emptyFormatted();
	}

	const assumptionNote = evaluation.futureReiwaAssumption
		? ASSUMPTION_NOTE[locale]
		: null;

	if (evaluation.kind === "gregorian-transition") {
		return {
			primary: formatTransitionPrimary(evaluation.transitionParts, locale),
			support: formatTransitionSupport(evaluation.transitionParts, locale),
			futureReiwaAssumption: false,
			assumptionNote: null,
		};
	}

	if (evaluation.kind === "era-partial-year") {
		return {
			primary: formatGregorianYear(evaluation.gregorianYear, locale),
			support: formatDateRange(
				evaluation.partialYearRange.start,
				evaluation.partialYearRange.end,
				locale,
			),
			futureReiwaAssumption: evaluation.futureReiwaAssumption,
			assumptionNote,
		};
	}

	const primary =
		evaluation.source === "gregorian"
			? formatEraYear(evaluation.era, locale)
			: formatGregorianYear(evaluation.gregorianYear, locale);

	return {
		primary,
		support: null,
		futureReiwaAssumption: evaluation.futureReiwaAssumption,
		assumptionNote,
	};
}

function eraDisplayName(eraId: EraId, locale: JecFormatLocale): string {
	const def = getEra(eraId);
	return locale === "zh" ? def.zh : def.en;
}

/**
 * Desktop inline invalid copy。只讀 evaluate 的 reason／range，不再判斷數學規則。
 * 句尾 `!` 由 UI 另外放，不寫進這段字串。
 */
export function formatInvalidHint(
	evaluation: JecEvaluation,
	locale: JecFormatLocale,
	eraId?: string,
): string | null {
	if (evaluation.status !== "invalid") {
		return null;
	}

	const range = evaluation.range;
	const eraName = isEraId(eraId ?? "") ? eraDisplayName(eraId as EraId, locale) : null;

	switch (evaluation.reason) {
		case "gregorian-below-min":
		case "gregorian-above-max":
			if (range) {
				return locale === "zh"
					? `西元年份請輸入 ${range.min} 至 ${range.max}`
					: `Gregorian year: ${range.min}–${range.max}`;
			}
			return locale === "zh" ? "請輸入有效的西元年份" : "Gregorian year invalid";

		case "era-below-min":
		case "era-above-max":
			if (eraName && range) {
				return locale === "zh"
					? `${eraName}年份請輸入 ${range.min} 至 ${range.max}`
					: `${eraName} year: ${range.min}–${range.max}`;
			}
			return locale === "zh" ? "請輸入該年號的有效年份" : "Era year invalid";

		case "zero":
		case "negative":
			return locale === "zh" ? "請輸入 1 以上的年份" : "Year: 1 or higher";

		case "decimal":
		case "non-numeric":
			return locale === "zh" ? "請輸入有效的年份數字" : "Enter a whole number";

		case "era-unknown":
			return locale === "zh" ? "請選擇有效的年號" : "Choose a valid era";
	}
}
