/**
 * Business Days Calculator — inclusive Mon–Fri workday math (B2B).
 *
 * Uses UTC calendar ordinals to represent pure Y-M-D dates and UTC weekday
 * for weekend detection. Does not use local midnight, wall-clock ms diffs,
 * browser locale, or public-holiday tables.
 *
 * Math returns counts only — English plurals / i18n live in the UI layer.
 */

export type BusinessDaysCalendarDate = {
	year: number;
	month: number;
	day: number;
};

export type BusinessDaysCount = {
	totalDays: number;
	weekendDays: number;
	businessDays: number;
};

const MS_PER_DAY = 86_400_000;

/** Days since Unix epoch for a pure calendar Y-M-D (UTC date, not wall clock). */
export function utcCalendarOrdinal(date: BusinessDaysCalendarDate): number {
	return Math.floor(Date.UTC(date.year, date.month - 1, date.day) / MS_PER_DAY);
}

/** UTC weekday for an ordinal: 0 = Sunday … 6 = Saturday. */
export function utcWeekdayFromOrdinal(ordinal: number): number {
	return new Date(ordinal * MS_PER_DAY).getUTCDay();
}

function isUtcWeekend(weekday: number): boolean {
	return weekday === 0 || weekday === 6;
}

/**
 * Inclusive business-day range. Caller must pass an ordered start ≤ end
 * (B2A resolveOrderedRange). Does not swap dates.
 */
export function calculateBusinessDaysRange(
	start: BusinessDaysCalendarDate,
	end: BusinessDaysCalendarDate,
): BusinessDaysCount {
	const startOrdinal = utcCalendarOrdinal(start);
	const endOrdinal = utcCalendarOrdinal(end);
	const totalDays = endOrdinal - startOrdinal + 1;

	let weekendDays = 0;
	for (let ordinal = startOrdinal; ordinal <= endOrdinal; ordinal += 1) {
		if (isUtcWeekend(utcWeekdayFromOrdinal(ordinal))) {
			weekendDays += 1;
		}
	}

	return {
		totalDays,
		weekendDays,
		businessDays: totalDays - weekendDays,
	};
}

export const ZERO_BUSINESS_DAYS_COUNT: BusinessDaysCount = {
	totalDays: 0,
	weekendDays: 0,
	businessDays: 0,
};
