/**
 * Lunar Date Converter — pure lunar calendar grid / navigation helpers.
 * Consumes B2A core only; no UI or tool business state.
 */
import { civilWeekday } from "./lunar/lunarCivil.ts";
import {
	gregorianToLunarFromDataset,
	lunarToGregorianFromDataset,
} from "./lunar/lunarConvert.ts";
import { formatLunarDayCellZh } from "./lunar/lunarFormat.ts";
import { listLunarMonths } from "./lunar/lunarYearInfo.ts";
import { validatePublicLunar } from "./lunar/lunarValidate.ts";
import type { CivilDate, LunarDate, LunarMonthRef } from "./lunar/lunarTypes.ts";
import {
	LUNAR_PUBLIC_YEAR_MAX,
	LUNAR_PUBLIC_YEAR_MIN,
} from "./lunar/lunarTypes.ts";

export type BoundaryView = null | "lower-sentinel";

export const LOWER_SENTINEL_LUNAR_YEAR = 1900;

export function lunarDatesEqual(
	a: LunarDate | null | undefined,
	b: LunarDate | null | undefined,
): boolean {
	if (!a || !b) {
		return false;
	}
	return (
		a.year === b.year &&
		a.month === b.month &&
		a.day === b.day &&
		a.isLeapMonth === b.isLeapMonth
	);
}

export function isPublicSelectableLunar(lunar: LunarDate): boolean {
	return validatePublicLunar(lunar).status === "valid";
}

export function findMonthIndex(
	year: number,
	month: number,
	isLeapMonth: boolean,
): number {
	const months = listLunarMonths(year);
	if (!months) {
		return 0;
	}
	const idx = months.findIndex(
		(entry) => entry.month === month && entry.isLeapMonth === isLeapMonth,
	);
	return idx >= 0 ? idx : 0;
}

export function getMonthRef(
	year: number,
	monthIndex: number,
): LunarMonthRef | null {
	const months = listLunarMonths(year);
	if (!months || monthIndex < 0 || monthIndex >= months.length) {
		return null;
	}
	return months[monthIndex]!;
}

export function mondayFirstOffset(civil: CivilDate): number {
	return (civilWeekday(civil) + 6) % 7;
}

export function firstDayOffsetForMonth(
	year: number,
	monthIndex: number,
): number | null {
	const ref = getMonthRef(year, monthIndex);
	if (!ref) {
		return null;
	}
	const result = lunarToGregorianFromDataset({
		year,
		month: ref.month,
		day: 1,
		isLeapMonth: ref.isLeapMonth,
	});
	if (!result.ok) {
		return null;
	}
	return mondayFirstOffset(result.value);
}

export function formatLunarMonthOptionEn(ref: LunarMonthRef): string {
	return ref.isLeapMonth ? `Leap ${ref.month}` : String(ref.month);
}

export function lunarDayCellLabel(day: number, locale: "en" | "zh"): string {
	return locale === "zh" ? formatLunarDayCellZh(day) : String(day);
}

export type DayCellModel = {
	lunar: LunarDate;
	label: string;
	selectable: boolean;
	isSelected: boolean;
	isToday: boolean;
	isSentinelLocked: boolean;
};

export function isDayCellSelectable(
	lunar: LunarDate,
	boundaryView: BoundaryView,
): boolean {
	if (boundaryView === "lower-sentinel") {
		return false;
	}
	return isPublicSelectableLunar(lunar);
}

export function buildDayCells(params: {
	viewYear: number;
	viewMonthIndex: number;
	committedLunar: LunarDate | null;
	todayLunar: LunarDate | null;
	boundaryView: BoundaryView;
	locale: "en" | "zh";
}): { leadingBlanks: number; cells: DayCellModel[] } | null {
	const ref = getMonthRef(params.viewYear, params.viewMonthIndex);
	if (!ref) {
		return null;
	}

	const offset = firstDayOffsetForMonth(params.viewYear, params.viewMonthIndex);
	if (offset === null) {
		return null;
	}

	const cells: DayCellModel[] = [];
	for (let day = 1; day <= ref.days; day += 1) {
		const lunar: LunarDate = {
			year: params.viewYear,
			month: ref.month,
			day,
			isLeapMonth: ref.isLeapMonth,
		};
		const selectable = isDayCellSelectable(lunar, params.boundaryView);
		const isSelected = lunarDatesEqual(lunar, params.committedLunar);
		const isToday = lunarDatesEqual(lunar, params.todayLunar);
		const isSentinelLocked =
			params.boundaryView === "lower-sentinel" && isSelected;
		cells.push({
			lunar,
			label: lunarDayCellLabel(day, params.locale),
			selectable,
			isSelected,
			isToday,
			isSentinelLocked,
		});
	}

	return { leadingBlanks: offset, cells };
}

export function navigateMonth(
	viewYear: number,
	viewMonthIndex: number,
	delta: -1 | 1,
	boundaryView: BoundaryView,
): { year: number; monthIndex: number; boundaryView: BoundaryView } | null {
	if (boundaryView === "lower-sentinel") {
		if (delta === -1) {
			return null;
		}
		const months1901 = listLunarMonths(LUNAR_PUBLIC_YEAR_MIN);
		if (!months1901) {
			return null;
		}
		return {
			year: LUNAR_PUBLIC_YEAR_MIN,
			monthIndex: 0,
			boundaryView: null,
		};
	}

	const months = listLunarMonths(viewYear);
	if (!months) {
		return null;
	}

	let nextIndex = viewMonthIndex + delta;
	let nextYear = viewYear;

	if (nextIndex < 0) {
		nextYear -= 1;
		if (nextYear < LUNAR_PUBLIC_YEAR_MIN) {
			return null;
		}
		const prevMonths = listLunarMonths(nextYear);
		if (!prevMonths) {
			return null;
		}
		nextIndex = prevMonths.length - 1;
	} else if (nextIndex >= months.length) {
		nextYear += 1;
		if (nextYear > LUNAR_PUBLIC_YEAR_MAX) {
			return null;
		}
		nextIndex = 0;
	}

	return { year: nextYear, monthIndex: nextIndex, boundaryView: null };
}

export function canNavigateMonth(
	viewYear: number,
	viewMonthIndex: number,
	delta: -1 | 1,
	boundaryView: BoundaryView,
): boolean {
	return navigateMonth(viewYear, viewMonthIndex, delta, boundaryView) !== null;
}

export function resolveOpenView(committedCivil: CivilDate): {
	viewYear: number;
	viewMonthIndex: number;
	boundaryView: BoundaryView;
	committedLunar: LunarDate | null;
} {
	const lunarResult = gregorianToLunarFromDataset(committedCivil);
	if (!lunarResult.ok) {
		return {
			viewYear: LUNAR_PUBLIC_YEAR_MIN,
			viewMonthIndex: 0,
			boundaryView: null,
			committedLunar: null,
		};
	}

	const lunar = lunarResult.value;
	if (lunar.year === LOWER_SENTINEL_LUNAR_YEAR) {
		return {
			viewYear: lunar.year,
			viewMonthIndex: findMonthIndex(lunar.year, lunar.month, lunar.isLeapMonth),
			boundaryView: "lower-sentinel",
			committedLunar: lunar,
		};
	}

	return {
		viewYear: Math.min(
			LUNAR_PUBLIC_YEAR_MAX,
			Math.max(LUNAR_PUBLIC_YEAR_MIN, lunar.year),
		),
		viewMonthIndex: findMonthIndex(lunar.year, lunar.month, lunar.isLeapMonth),
		boundaryView: null,
		committedLunar: lunar,
	};
}

export function selectYearFromPublicRange(
	year: number,
	currentMonthIndex: number,
): { year: number; monthIndex: number; boundaryView: BoundaryView } | null {
	if (year < LUNAR_PUBLIC_YEAR_MIN || year > LUNAR_PUBLIC_YEAR_MAX) {
		return null;
	}
	const months = listLunarMonths(year);
	if (!months) {
		return null;
	}
	const monthIndex = Math.min(currentMonthIndex, months.length - 1);
	return { year, monthIndex, boundaryView: null };
}

export function monthCountForYear(year: number): number | null {
	return listLunarMonths(year)?.length ?? null;
}
