/**
 * Days Between Dates — day-difference math (B2B).
 * Local calendar dates only; absolute difference; optional include-both (+1).
 */
import { daysBetweenLocalDates } from "./yearProgressMath.ts";

export type DaysBetweenCalendarDate = {
	year: number;
	month: number;
	day: number;
};

export type DaysBetweenLocale = "en" | "zh";

/** Absolute day gap between two local calendar dates (order-independent). */
export function absoluteDayDifference(
	from: DaysBetweenCalendarDate,
	to: DaysBetweenCalendarDate,
): number {
	return Math.abs(
		daysBetweenLocalDates(
			from.year,
			from.month - 1,
			from.day,
			to.year,
			to.month - 1,
			to.day,
		),
	);
}

/** Displayed day count: base absolute gap, or +1 when Include both dates is on. */
export function computeDisplayedDays(
	baseDifference: number,
	includeBothDates: boolean,
): number {
	return includeBothDates ? baseDifference + 1 : baseDifference;
}

export function splitWeeksAndDays(totalDays: number): {
	weeks: number;
	remainingDays: number;
} {
	const safe = Math.max(0, Math.floor(totalDays));
	return {
		weeks: Math.floor(safe / 7),
		remainingDays: safe % 7,
	};
}

export function formatPrimaryDayUnit(
	days: number,
	locale: DaysBetweenLocale,
): string {
	if (locale === "zh") {
		return "天";
	}

	return days === 1 ? "day" : "days";
}

export function formatWeeksAndDaysLine(
	totalDays: number,
	locale: DaysBetweenLocale,
): string {
	const { weeks, remainingDays } = splitWeeksAndDays(totalDays);

	if (locale === "zh") {
		return `${weeks} 週又 ${remainingDays} 天`;
	}

	const weekUnit = weeks === 1 ? "week" : "weeks";
	const dayUnit = remainingDays === 1 ? "day" : "days";
	return `${weeks} ${weekUnit} and ${remainingDays} ${dayUnit}`;
}

export function computeDaysBetweenResult(
	from: DaysBetweenCalendarDate | null,
	to: DaysBetweenCalendarDate | null,
	includeBothDates: boolean,
): number {
	if (!from || !to) {
		return 0;
	}

	const base = absoluteDayDifference(from, to);
	return computeDisplayedDays(base, includeBothDates);
}
