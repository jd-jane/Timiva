/**
 * Gregorian ↔ Lunar deterministic conversion（pure civil day numbers）.
 */

import {
	civilToDayNumber,
	dayNumberToCivil,
	isValidCivilDate,
} from "./lunarCivil.ts";
import { LUNAR_EPOCH_CIVIL } from "./lunarDataset.ts";
import {
	daysInLunarMonth,
	leapMonthOfYear,
	listLunarMonths,
	lunarYearTotalDays,
} from "./lunarYearInfo.ts";
import {
	LUNAR_DATASET_YEAR_MAX,
	LUNAR_DATASET_YEAR_MIN,
	LUNAR_PUBLIC_YEAR_MAX,
	LUNAR_PUBLIC_YEAR_MIN,
	type CivilDate,
	type LunarConvertResult,
	type LunarDate,
} from "./lunarTypes.ts";

function ok<T>(value: T): LunarConvertResult<T> {
	return { ok: true, value };
}

function fail(
	code:
		| "out-of-public-range"
		| "invalid-civil-date"
		| "invalid-lunar-date"
		| "invalid-leap-month"
		| "invalid-lunar-day"
		| "unsupported-internal-year",
	message: string,
): LunarConvertResult<never> {
	return { ok: false, code, message };
}

/** Public Gregorian input：civil year 1901–2099. */
export function isPublicGregorianInput(date: CivilDate): boolean {
	return (
		isValidCivilDate(date) &&
		date.year >= LUNAR_PUBLIC_YEAR_MIN &&
		date.year <= LUNAR_PUBLIC_YEAR_MAX
	);
}

/** Public Lunar input year：1901–2099. */
export function isPublicLunarYear(year: number): boolean {
	return (
		Number.isInteger(year) &&
		year >= LUNAR_PUBLIC_YEAR_MIN &&
		year <= LUNAR_PUBLIC_YEAR_MAX
	);
}

/**
 * Gregorian → Lunar for dataset coverage（含 G 2100 upper sentinel）.
 * Boundary-internal only — import from ./lunarConvert.ts in calendar grid code;
 * not exported from lunar/index.ts public API.
 */
export function gregorianToLunarFromDataset(
	date: CivilDate,
): LunarConvertResult<LunarDate> {
	if (!isValidCivilDate(date)) {
		return fail("invalid-civil-date", "Not a valid Gregorian civil date.");
	}

	let offset =
		civilToDayNumber(date) - civilToDayNumber({ ...LUNAR_EPOCH_CIVIL });
	if (offset < 0) {
		return fail("unsupported-internal-year", "Date is before lunar dataset epoch.");
	}

	let yearCursor = LUNAR_DATASET_YEAR_MIN;
	let yearDays = 0;
	for (
		;
		yearCursor <= LUNAR_DATASET_YEAR_MAX && offset > 0;
		yearCursor += 1
	) {
		yearDays = lunarYearTotalDays(yearCursor) ?? 0;
		offset -= yearDays;
	}
	if (offset < 0) {
		offset += yearDays;
		yearCursor -= 1;
	}

	const year = yearCursor;
	if (year < LUNAR_DATASET_YEAR_MIN || year > LUNAR_DATASET_YEAR_MAX) {
		return fail("unsupported-internal-year", "Resolved lunar year out of dataset.");
	}

	const leap = leapMonthOfYear(year) ?? 0;
	let isLeapMonth = false;
	let month = 1;
	let monthDays = 0;

	for (month = 1; month < 13 && offset > 0; month += 1) {
		if (leap > 0 && month === leap + 1 && !isLeapMonth) {
			month -= 1;
			isLeapMonth = true;
			monthDays = daysInLunarMonth(year, leap, true);
		} else {
			monthDays = daysInLunarMonth(year, month, false);
		}
		if (monthDays === 0) {
			return fail("unsupported-internal-year", "Invalid month length.");
		}
		if (isLeapMonth && month === leap + 1) {
			isLeapMonth = false;
		}
		offset -= monthDays;
	}

	if (offset === 0 && leap > 0 && month === leap + 1) {
		if (isLeapMonth) {
			isLeapMonth = false;
		} else {
			isLeapMonth = true;
			month -= 1;
		}
	}
	if (offset < 0) {
		offset += monthDays;
		month -= 1;
	}

	return ok({
		year,
		month,
		day: offset + 1,
		isLeapMonth,
	});
}

/**
 * Gregorian → Lunar.
 * Public input years 1901–2099；output lunar year may be 1900 near lower edge.
 */
export function gregorianToLunar(date: CivilDate): LunarConvertResult<LunarDate> {
	if (!isValidCivilDate(date)) {
		return fail("invalid-civil-date", "Not a valid Gregorian civil date.");
	}
	if (!isPublicGregorianInput(date)) {
		return fail(
			"out-of-public-range",
			`Gregorian year must be ${LUNAR_PUBLIC_YEAR_MIN}–${LUNAR_PUBLIC_YEAR_MAX}.`,
		);
	}

	return gregorianToLunarFromDataset(date);
}

/**
 * Lunar → Gregorian for dataset coverage years（1900–2100）.
 * Boundary-internal only — import from ./lunarConvert.ts in calendar grid code;
 * not exported from lunar/index.ts public API.
 */
export function lunarToGregorianFromDataset(
	lunar: LunarDate,
): LunarConvertResult<CivilDate> {
	const { year, month, day, isLeapMonth } = lunar;

	if (
		!Number.isInteger(year) ||
		!Number.isInteger(month) ||
		!Number.isInteger(day) ||
		typeof isLeapMonth !== "boolean" ||
		month < 1 ||
		month > 12 ||
		day < 1
	) {
		return fail("invalid-lunar-date", "Malformed lunar date.");
	}

	if (year < LUNAR_DATASET_YEAR_MIN || year > LUNAR_DATASET_YEAR_MAX) {
		return fail(
			"unsupported-internal-year",
			`Lunar year must be within dataset ${LUNAR_DATASET_YEAR_MIN}–${LUNAR_DATASET_YEAR_MAX}.`,
		);
	}

	const leap = leapMonthOfYear(year);
	if (isLeapMonth) {
		if (leap === null || leap !== month) {
			return fail(
				"invalid-leap-month",
				leap === null
					? `Lunar year ${year} has no leap month.`
					: `Lunar year ${year} leap month is ${leap}, not ${month}.`,
			);
		}
	}

	const md = daysInLunarMonth(year, month, isLeapMonth);
	if (md === 0) {
		return fail("invalid-lunar-date", "Unknown lunar month.");
	}
	if (day > md) {
		return fail("invalid-lunar-day", `That lunar month only has ${md} days.`);
	}

	let offset = 0;
	for (let y = LUNAR_DATASET_YEAR_MIN; y < year; y += 1) {
		const yd = lunarYearTotalDays(y);
		if (yd === null) {
			return fail("unsupported-internal-year", `Missing lunar year ${y}.`);
		}
		offset += yd;
	}

	const months = listLunarMonths(year);
	if (!months) {
		return fail("unsupported-internal-year", `Missing months for ${year}.`);
	}

	for (const entry of months) {
		if (entry.month === month && entry.isLeapMonth === isLeapMonth) {
			offset += day - 1;
			return ok(
				dayNumberToCivil(civilToDayNumber({ ...LUNAR_EPOCH_CIVIL }) + offset),
			);
		}
		offset += entry.days;
	}

	return fail("invalid-lunar-date", "Month not found in lunar year.");
}

/**
 * Lunar → Gregorian.
 * Public lunar years 1901–2099；output Gregorian year may be 2100 near upper edge.
 */
export function lunarToGregorian(lunar: LunarDate): LunarConvertResult<CivilDate> {
	if (
		!Number.isInteger(lunar.year) ||
		!Number.isInteger(lunar.month) ||
		!Number.isInteger(lunar.day) ||
		typeof lunar.isLeapMonth !== "boolean" ||
		lunar.month < 1 ||
		lunar.month > 12 ||
		lunar.day < 1
	) {
		return fail("invalid-lunar-date", "Malformed lunar date.");
	}

	if (!isPublicLunarYear(lunar.year)) {
		return fail(
			"out-of-public-range",
			`Lunar year must be ${LUNAR_PUBLIC_YEAR_MIN}–${LUNAR_PUBLIC_YEAR_MAX}.`,
		);
	}

	return lunarToGregorianFromDataset(lunar);
}
