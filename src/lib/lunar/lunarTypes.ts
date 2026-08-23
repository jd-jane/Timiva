/**
 * Lunar domain types — tool-agnostic civil calendar model.
 * 不用 timezone-sensitive Date 做換算；日期皆為 plain Y-M-D。
 */

/** Gregorian civil date (proleptic Gregorian month/day rules). */
export type CivilDate = {
	year: number;
	month: number;
	day: number;
};

/** Traditional Chinese lunar date with explicit leap flag. */
export type LunarDate = {
	/** Lunar year numeric anchor（歲次對照用同一 year number）. */
	year: number;
	/** Calendar month number 1–12（閏月與正同號，靠 isLeapMonth 區分）. */
	month: number;
	day: number;
	/** true = 閏月；不得用 month number 推斷. */
	isLeapMonth: boolean;
};

export type LunarMonthRef = {
	month: number;
	isLeapMonth: boolean;
	days: 29 | 30;
};

export type LunarYearInfo = {
	year: number;
	/** 閏月月號 1–12；無則 null. */
	leapMonth: number | null;
	/** 依出現順序：正、（閏）、… 含 leap 插入. */
	months: readonly LunarMonthRef[];
	/** 該農曆年總日數. */
	totalDays: number;
	/** 農曆正月初一對應的國曆日. */
	newYearCivil: CivilDate;
};

export type StemBranch = {
	/** 例：丙午 */
	zh: string;
	/** 例：Bing-wu */
	en: string;
	/** 0–59 within 60-year cycle（甲子=0）. */
	index: number;
};

export type LunarConvertErrorCode =
	| "out-of-public-range"
	| "invalid-civil-date"
	| "invalid-lunar-date"
	| "invalid-leap-month"
	| "invalid-lunar-day"
	| "unsupported-internal-year";

export type LunarConvertOk<T> = { ok: true; value: T };
export type LunarConvertErr = {
	ok: false;
	code: LunarConvertErrorCode;
	message: string;
};

export type LunarConvertResult<T> = LunarConvertOk<T> | LunarConvertErr;

/** Public product input years（國曆年或農曆年輸入）. */
export const LUNAR_PUBLIC_YEAR_MIN = 1901;
export const LUNAR_PUBLIC_YEAR_MAX = 2099;

/**
 * Internal dataset coverage（含邊界 sentinel）.
 * 1900：支援國曆 1901-01-01 → 農曆 1900-11-11 等。
 * 2100：支援農曆 2099 年末 → 國曆 2100 與農曆 2100 正月初一。
 */
export const LUNAR_DATASET_YEAR_MIN = 1900;
export const LUNAR_DATASET_YEAR_MAX = 2100;
