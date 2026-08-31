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

export type ResultRsLayout = "desktop" | "portrait" | "landscape";

/** EN Lunar Desktop：依 result host 可用寬在 wide 單行 vs constrained 兩行間切換。 */
export type ResultRsComposition = "wide" | "constrained";

export type DeriveResultOptions = {
	invalid?: boolean;
	rsLayout?: ResultRsLayout | null;
	rsComposition?: ResultRsComposition | null;
};

/** Tool-local：以量到的文字寬 vs host 寬決定 EN Lunar Desktop composition。 */
export function resolveEnLunarDesktopRsComposition(options: {
	hostWidthPx: number;
	textWidthPx: number;
	safetyRatio?: number;
}): ResultRsComposition {
	const ratio = options.safetyRatio ?? 0.94;
	if (options.hostWidthPx <= 0) {
		return "wide";
	}
	return options.textWidthPx <= options.hostWidthPx * ratio ? "wide" : "constrained";
}

function buildEnLunarTwoLinePrimary(
	lunar: NonNullable<ReturnType<typeof lunarFromActualCivil>>,
	actualCivil: CivilDate,
): { primaryText: string; primaryAria: string } {
	const parts = buildLunarResultParts(lunar, actualCivil);
	const leapEn = lunar.isLeapMonth ? "Leap " : "";
	const dateLine = `${leapEn}Lunar ${lunar.month}/${lunar.day}`;
	return {
		primaryText: `${dateLine}\n${parts.stemBranch.en}`,
		primaryAria: parts.enPrimary,
	};
}

/** Derive ResultSummary from committed actualCivil + inputMode. */
export function deriveResultPresentation(
	actualCivil: CivilDate,
	inputMode: InputMode,
	locale: "en" | "zh",
	options: DeriveResultOptions = {},
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
		if (
			options.rsLayout === "portrait" ||
			(options.rsLayout === "desktop" && options.rsComposition === "constrained")
		) {
			const twoLine = buildEnLunarTwoLinePrimary(lunar, actualCivil);
			return {
				primaryText: twoLine.primaryText,
				primaryAria: twoLine.primaryAria,
				weekday: parts.weekdayEn,
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
		/* ZH Portrait 兩行 composition（對齊 DC formatResultPrimary）；Desktop 以 nowrap 併回單行 */
		const primaryText = `${parts.civil.year} 年\n${parts.civil.month} 月 ${parts.civil.day} 日`;
		const primaryAria = `${parts.civil.year} 年${parts.civil.month} 月 ${parts.civil.day} 日`;
		return {
			primaryText,
			primaryAria,
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
