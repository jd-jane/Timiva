/**
 * Taiwan Year & Age Reference — 結果字串組合（B2A）。
 * 只選 i18n key、組結構、插入數值。禁止第二份 EN／ZH 文案。
 */
import type { EraId } from "./japaneseEraConverterData.ts";
import type {
	TyarEraRef,
	TyarEvaluation,
	TyarExactResult,
	TyarMinguoRef,
	TyarReverseResult,
	TyarReverseView,
	TyarYearFacts,
} from "./taiwanYearAgeReferenceMath.ts";
import { lookupThenTaiwan, type ThenTaiwanLocale } from "./taiwanYearAgeReferenceThenTaiwan.ts";

export type TyarFormatCopy = {
	resultPlaceholder: string;
	eraNames: Record<EraId, string>;
	zodiacNames: Record<string, string>;
	formatGregorianYear: string;
	formatMinguoYear: string;
	formatMinguoYearOne: string;
	formatMinguoBefore: string;
	formatEraYear: string;
	formatAgeAbout: string;
	formatZodiacYear: string;
	formatReverseClosest: string;
	formatReverseYear: string;
	formatPrimaryJoin: string;
	formatSecondaryJoin: string;
	formatEraLineJoin: string;
};

export type TyarFormatLocale = ThenTaiwanLocale;

export type TyarFormattedResult = {
	status: TyarEvaluation["status"];
	kind: "exact" | "reverse" | null;
	primary: string;
	secondary: string | null;
	eraLine: string | null;
	stemLine: string | null;
	thenTaiwan: string | null;
	reverseView: TyarReverseView | null;
	viewedYear: number | null;
	closestYear: number | null;
	previousYear: number | null;
	nextYear: number | null;
};

export function fillTyarTemplate(
	template: string,
	vars: Record<string, string | number>,
): string {
	return template.replace(/\{(\w+)\}/g, (_, key: string) => {
		const value = vars[key];
		return value === undefined ? `{${key}}` : String(value);
	});
}

function formatMinguo(ref: TyarMinguoRef, copy: TyarFormatCopy): string {
	if (ref.type === "year-one") {
		return copy.formatMinguoYearOne;
	}
	if (ref.type === "before") {
		return fillTyarTemplate(copy.formatMinguoBefore, { n: ref.years });
	}
	return fillTyarTemplate(copy.formatMinguoYear, { n: ref.year });
}

function formatEra(ref: TyarEraRef, copy: TyarFormatCopy): string {
	return fillTyarTemplate(copy.formatEraYear, {
		era: copy.eraNames[ref.eraId],
		n: ref.eraYear,
	});
}

function formatGregorian(year: number, copy: TyarFormatCopy): string {
	return fillTyarTemplate(copy.formatGregorianYear, { year });
}

function joinPrimary(parts: string[], copy: TyarFormatCopy): string {
	return parts.filter(Boolean).join(copy.formatPrimaryJoin);
}

function stemLine(facts: TyarYearFacts, locale: TyarFormatLocale, copy: TyarFormatCopy): string {
	const zodiac = copy.zodiacNames[facts.zodiacId] ?? facts.zodiacId;
	return [
		locale === "zh" ? facts.stemBranch.zh : facts.stemBranch.en,
		fillTyarTemplate(copy.formatZodiacYear, { zodiac }),
		fillTyarTemplate(copy.formatAgeAbout, { n: facts.age }),
	].join(copy.formatSecondaryJoin);
}

function eraLine(facts: TyarYearFacts, copy: TyarFormatCopy, includeEra: boolean): string {
	const minguo = formatMinguo(facts.minguo, copy);
	if (includeEra && facts.canonicalEra) {
		return [minguo, formatEra(facts.canonicalEra, copy)].join(copy.formatEraLineJoin);
	}
	return minguo;
}

function emptyFormatted(copy: TyarFormatCopy, status: TyarEvaluation["status"]): TyarFormattedResult {
	return {
		status,
		kind: null,
		primary: copy.resultPlaceholder,
		secondary: null,
		eraLine: null,
		stemLine: null,
		thenTaiwan: null,
		reverseView: null,
		viewedYear: null,
		closestYear: null,
		previousYear: null,
		nextYear: null,
	};
}

function formatExact(
	result: TyarExactResult,
	locale: TyarFormatLocale,
	copy: TyarFormatCopy,
): TyarFormattedResult {
	const minguo = formatMinguo(result.minguo, copy);
	const gregorian = formatGregorian(result.gregorianYear, copy);
	const era = result.canonicalEra ? formatEra(result.canonicalEra, copy) : null;
	const showEra = result.showEraInPrimary && era !== null;

	let parts: string[] = [];
	if (result.source === "gregorian") {
		parts = showEra ? [minguo, era] : [minguo];
	} else if (result.source === "minguo") {
		parts = showEra && era ? [gregorian, era] : [gregorian];
	} else {
		parts = [gregorian, minguo];
	}

	return {
		status: "valid",
		kind: "exact",
		primary: joinPrimary(parts, copy),
		secondary: stemLine(result, locale, copy),
		eraLine: null,
		stemLine: null,
		thenTaiwan: lookupThenTaiwan(result.gregorianYear, locale),
		reverseView: null,
		viewedYear: result.gregorianYear,
		closestYear: null,
		previousYear: null,
		nextYear: null,
	};
}

function formatReverse(
	result: TyarReverseResult,
	locale: TyarFormatLocale,
	copy: TyarFormatCopy,
): TyarFormattedResult {
	const viewed = result.viewed;
	const primary =
		result.reverseView === "closest"
			? fillTyarTemplate(copy.formatReverseClosest, { year: viewed.gregorianYear })
			: fillTyarTemplate(copy.formatReverseYear, { year: viewed.gregorianYear });

	return {
		status: "valid",
		kind: "reverse",
		primary,
		secondary: null,
		eraLine: eraLine(viewed, copy, viewed.proactiveEra),
		stemLine: stemLine(viewed, locale, copy),
		thenTaiwan: null,
		reverseView: result.reverseView,
		viewedYear: result.viewedYear,
		closestYear: result.closestYear,
		previousYear: result.previousYear,
		nextYear: result.nextYear,
	};
}

export function formatTaiwanYearAge(
	evaluation: TyarEvaluation,
	locale: TyarFormatLocale,
	copy: TyarFormatCopy,
): TyarFormattedResult {
	if (evaluation.status !== "valid") {
		return emptyFormatted(copy, evaluation.status);
	}
	if (evaluation.result.kind === "exact") {
		return formatExact(evaluation.result, locale, copy);
	}
	return formatReverse(evaluation.result, locale, copy);
}
