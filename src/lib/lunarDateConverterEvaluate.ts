/**
 * Lunar Date Converter — evaluate + ResultSummary presentation（tool-local）.
 */
import {
	buildLunarResultParts,
	buildGregorianResultParts,
} from "./lunar/lunarFormat.ts";
import {
	gregorianToLunar,
	lunarToGregorian,
} from "./lunar/lunarConvert.ts";
import type { CivilDate, LunarDate } from "./lunar/lunarTypes.ts";

export type InputMode = "gregorian" | "lunar";

export type ResultPresentation = {
	primaryText: string;
	primaryAria: string;
	weekday: string | null;
	isInvalid: boolean;
};

export function getLocalTodayCivil(): CivilDate {
	const now = new Date();
	return {
		year: now.getFullYear(),
		month: now.getMonth() + 1,
		day: now.getDate(),
	};
}

/** Owner D6：EN Lunar→Gregorian = `Aug 17, 2026`. */
export function formatEnGregorianPrimary(civil: CivilDate): string {
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	}).format(new Date(civil.year, civil.month - 1, civil.day));
}

export function civilFromGregorianInput(date: CivilDate): CivilDate {
	return { ...date };
}

export function civilFromLunarInput(lunar: LunarDate): CivilDate | null {
	const r = lunarToGregorian(lunar);
	return r.ok ? r.value : null;
}

export function lunarFromActualCivil(civil: CivilDate): LunarDate | null {
	const r = gregorianToLunar(civil);
	return r.ok ? r.value : null;
}

/** Derive ResultSummary from committed actualCivil + inputMode. */
export function deriveResultPresentation(
	actualCivil: CivilDate,
	inputMode: InputMode,
	locale: "en" | "zh",
	options: { invalid?: boolean } = {},
): ResultPresentation {
	if (options.invalid) {
		return {
			primaryText: "?",
			primaryAria: "?",
			weekday: null,
			isInvalid: true,
		};
	}

	if (inputMode === "gregorian") {
		const lunar = lunarFromActualCivil(actualCivil);
		if (!lunar) {
			return {
				primaryText: "?",
				primaryAria: "?",
				weekday: null,
				isInvalid: true,
			};
		}
		const parts = buildLunarResultParts(lunar, actualCivil);
		if (locale === "zh") {
			const primaryText = `${parts.zhYearLine}\n${parts.zhMonthDayLine}`;
			return {
				primaryText,
				primaryAria: `${parts.zhYearLine}${parts.zhMonthDayLine}`,
				weekday: parts.weekdayZh,
				isInvalid: false,
			};
		}
		return {
			primaryText: parts.enPrimary,
			primaryAria: parts.enPrimary,
			weekday: parts.weekdayEn,
			isInvalid: false,
		};
	}

	const parts = buildGregorianResultParts(actualCivil);
	if (locale === "zh") {
		return {
			primaryText: parts.zhPrimary,
			primaryAria: parts.zhPrimary,
			weekday: parts.weekdayZh,
			isInvalid: false,
		};
	}
	const enPrimary = formatEnGregorianPrimary(actualCivil);
	return {
		primaryText: enPrimary,
		primaryAria: enPrimary,
		weekday: parts.weekdayEn,
		isInvalid: false,
	};
}
