/**
 * Pure validation helpers for lunar / civil dates（no UI）.
 */

import { isValidCivilDate } from "./lunarCivil.ts";
import {
	isPublicGregorianInput,
	isPublicLunarYear,
} from "./lunarConvert.ts";
import { daysInLunarMonth, leapMonthOfYear } from "./lunarYearInfo.ts";
import type { CivilDate, LunarDate } from "./lunarTypes.ts";

export type LunarValidation =
	| { status: "valid" }
	| {
			status: "invalid";
			code:
				| "out-of-public-range"
				| "invalid-civil-date"
				| "invalid-lunar-date"
				| "invalid-leap-month"
				| "invalid-lunar-day";
			message: string;
	  };

export function validatePublicGregorian(date: CivilDate): LunarValidation {
	if (!isValidCivilDate(date)) {
		return {
			status: "invalid",
			code: "invalid-civil-date",
			message: "Not a valid Gregorian civil date.",
		};
	}
	if (!isPublicGregorianInput(date)) {
		return {
			status: "invalid",
			code: "out-of-public-range",
			message: "Gregorian year must be 1901–2099.",
		};
	}
	return { status: "valid" };
}

export function validatePublicLunar(lunar: LunarDate): LunarValidation {
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
		return {
			status: "invalid",
			code: "invalid-lunar-date",
			message: "Malformed lunar date.",
		};
	}
	if (!isPublicLunarYear(year)) {
		return {
			status: "invalid",
			code: "out-of-public-range",
			message: "Lunar year must be 1901–2099.",
		};
	}
	const leap = leapMonthOfYear(year);
	if (isLeapMonth && (leap === null || leap !== month)) {
		return {
			status: "invalid",
			code: "invalid-leap-month",
			message:
				leap === null
					? `Lunar year ${year} has no leap month.`
					: `Lunar year ${year} leap month is ${leap}, not ${month}.`,
		};
	}
	const md = daysInLunarMonth(year, month, isLeapMonth);
	if (md === 0) {
		return {
			status: "invalid",
			code: "invalid-lunar-date",
			message: "Unknown lunar month.",
		};
	}
	if (day > md) {
		return {
			status: "invalid",
			code: "invalid-lunar-day",
			message: `That lunar month only has ${md} days.`,
		};
	}
	return { status: "valid" };
}
