/**
 * Pure Gregorian civil day arithmetic（無 local timezone Date）.
 * Day number = days since 0001-01-01 (proleptic Gregorian), day 0 = 0001-01-01.
 */

import type { CivilDate } from "./lunarTypes.ts";

const DAYS_IN_MONTH = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

export function isGregorianLeapYear(year: number): boolean {
	return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInGregorianMonth(year: number, month: number): number {
	if (month < 1 || month > 12) return 0;
	if (month === 2 && isGregorianLeapYear(year)) return 29;
	return DAYS_IN_MONTH[month]!;
}

export function isValidCivilDate(date: CivilDate): boolean {
	const { year, month, day } = date;
	if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
		return false;
	}
	if (month < 1 || month > 12) return false;
	const dim = daysInGregorianMonth(year, month);
	return day >= 1 && day <= dim;
}

/** Inclusive day count from 0001-01-01. */
export function civilToDayNumber(date: CivilDate): number {
	const { year, month, day } = date;
	let n = day - 1;
	for (let m = 1; m < month; m += 1) {
		n += daysInGregorianMonth(year, m);
	}
	const y = year - 1;
	n += 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400);
	return n;
}

export function dayNumberToCivil(dayNumber: number): CivilDate {
	let rem = dayNumber;
	let year = 1;
	while (true) {
		const diy = isGregorianLeapYear(year) ? 366 : 365;
		if (rem < diy) break;
		rem -= diy;
		year += 1;
	}
	let month = 1;
	while (month <= 12) {
		const dim = daysInGregorianMonth(year, month);
		if (rem < dim) {
			return { year, month, day: rem + 1 };
		}
		rem -= dim;
		month += 1;
	}
	throw new Error(`dayNumberToCivil: overflow (${dayNumber})`);
}

export function addCivilDays(date: CivilDate, delta: number): CivilDate {
	return dayNumberToCivil(civilToDayNumber(date) + delta);
}

export function civilDatesEqual(a: CivilDate, b: CivilDate): boolean {
	return a.year === b.year && a.month === b.month && a.day === b.day;
}

/** Weekday: 0=Sunday … 6=Saturday. 0001-01-01 was Monday → dayNumber 0 → Monday=1. */
export function civilWeekday(date: CivilDate): number {
	return (civilToDayNumber(date) + 1) % 7;
}
