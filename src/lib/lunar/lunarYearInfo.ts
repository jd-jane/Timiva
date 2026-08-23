/**
 * Lunar year structure：leap month、month lengths、正月初一。
 */

import { addCivilDays, civilToDayNumber } from "./lunarCivil.ts";
import {
	getPackedYear,
	LUNAR_EPOCH_CIVIL,
	LUNAR_YEAR_PACKED,
} from "./lunarDataset.ts";
import {
	LUNAR_DATASET_YEAR_MAX,
	LUNAR_DATASET_YEAR_MIN,
	type CivilDate,
	type LunarMonthRef,
	type LunarYearInfo,
} from "./lunarTypes.ts";

export function leapMonthOfYear(year: number): number | null {
	const packed = getPackedYear(year);
	if (packed === null) return null;
	const leap = packed & 0xf;
	return leap === 0 ? null : leap;
}

export function leapMonthDays(year: number): 0 | 29 | 30 {
	const leap = leapMonthOfYear(year);
	if (leap === null) return 0;
	const packed = getPackedYear(year)!;
	return packed & 0x10000 ? 30 : 29;
}

/** Regular（non-leap）month length for month 1–12. */
export function regularMonthDays(year: number, month: number): 29 | 30 | 0 {
	if (month < 1 || month > 12) return 0;
	const packed = getPackedYear(year);
	if (packed === null) return 0;
	return packed & (0x10000 >> month) ? 30 : 29;
}

export function daysInLunarMonth(
	year: number,
	month: number,
	isLeapMonth: boolean,
): 29 | 30 | 0 {
	if (isLeapMonth) {
		const leap = leapMonthOfYear(year);
		if (leap === null || leap !== month) return 0;
		return leapMonthDays(year) as 29 | 30;
	}
	return regularMonthDays(year, month);
}

export function lunarYearTotalDays(year: number): number | null {
	if (getPackedYear(year) === null) return null;
	let sum = 348;
	const packed = getPackedYear(year)!;
	for (let bit = 0x8000; bit > 0x8; bit >>= 1) {
		if (packed & bit) sum += 1;
	}
	return sum + leapMonthDays(year);
}

/** Ordered month list for a lunar year（含閏月插入）. */
export function listLunarMonths(year: number): LunarMonthRef[] | null {
	if (getPackedYear(year) === null) return null;
	const leap = leapMonthOfYear(year);
	const months: LunarMonthRef[] = [];
	for (let m = 1; m <= 12; m += 1) {
		months.push({
			month: m,
			isLeapMonth: false,
			days: regularMonthDays(year, m) as 29 | 30,
		});
		if (leap !== null && m === leap) {
			months.push({
				month: leap,
				isLeapMonth: true,
				days: leapMonthDays(year) as 29 | 30,
			});
		}
	}
	return months;
}

/** Day offset of lunar year Y's 正月初一 from lunar 1900-01-01. */
export function dayOffsetOfLunarNewYear(year: number): number | null {
	if (year < LUNAR_DATASET_YEAR_MIN || year > LUNAR_DATASET_YEAR_MAX) return null;
	let offset = 0;
	for (let y = LUNAR_DATASET_YEAR_MIN; y < year; y += 1) {
		const days = lunarYearTotalDays(y);
		if (days === null) return null;
		offset += days;
	}
	return offset;
}

export function lunarNewYearCivil(year: number): CivilDate | null {
	const offset = dayOffsetOfLunarNewYear(year);
	if (offset === null) return null;
	return addCivilDays({ ...LUNAR_EPOCH_CIVIL }, offset);
}

export function getLunarYearInfo(year: number): LunarYearInfo | null {
	const months = listLunarMonths(year);
	const totalDays = lunarYearTotalDays(year);
	const newYearCivil = lunarNewYearCivil(year);
	if (!months || totalDays === null || !newYearCivil) return null;
	return {
		year,
		leapMonth: leapMonthOfYear(year),
		months,
		totalDays,
		newYearCivil,
	};
}

/** Assert dataset integrity for validators. */
export function assertLunarDatasetIntegrity(): void {
	if (LUNAR_YEAR_PACKED.length !== 201) {
		throw new Error(`expected 201 packed years, got ${LUNAR_YEAR_PACKED.length}`);
	}
	const epoch = civilToDayNumber(LUNAR_EPOCH_CIVIL);
	if (epoch !== civilToDayNumber({ year: 1900, month: 1, day: 31 })) {
		throw new Error("epoch mismatch");
	}
}
