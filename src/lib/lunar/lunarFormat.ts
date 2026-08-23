/**
 * Structured display parts for future UI（tool-agnostic；不組最終 UI 字串策略外的硬編碼換行）.
 */

import { civilWeekday } from "./lunarCivil.ts";
import { yearStemBranch } from "./lunarStemBranch.ts";
import type { CivilDate, LunarDate, StemBranch } from "./lunarTypes.ts";

const WEEKDAY_ZH = [
	"星期日",
	"星期一",
	"星期二",
	"星期三",
	"星期四",
	"星期五",
	"星期六",
] as const;

const WEEKDAY_EN = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
] as const;

const LUNAR_DAY_ZH = [
	"",
	"初一",
	"初二",
	"初三",
	"初四",
	"初五",
	"初六",
	"初七",
	"初八",
	"初九",
	"初十",
	"十一",
	"十二",
	"十三",
	"十四",
	"十五",
	"十六",
	"十七",
	"十八",
	"十九",
	"二十",
	"廿一",
	"廿二",
	"廿三",
	"廿四",
	"廿五",
	"廿六",
	"廿七",
	"廿八",
	"廿九",
	"三十",
] as const;

const LUNAR_MONTH_ZH = [
	"",
	"正月",
	"二月",
	"三月",
	"四月",
	"五月",
	"六月",
	"七月",
	"八月",
	"九月",
	"十月",
	"十一月",
	"十二月",
] as const;

export type LunarResultParts = {
	kind: "lunar";
	lunar: LunarDate;
	stemBranch: StemBranch;
	/** ZH 語意第一行：農曆{干支}年 */
	zhYearLine: string;
	/** ZH 語意第二行：{閏?}{月}{日} */
	zhMonthDayLine: string;
	/** EN primary without weekday */
	enPrimary: string;
	weekdayIndex: number;
	weekdayZh: string;
	weekdayEn: string;
};

export type GregorianResultParts = {
	kind: "gregorian";
	civil: CivilDate;
	zhPrimary: string;
	enPrimary: string;
	weekdayIndex: number;
	weekdayZh: string;
	weekdayEn: string;
};

export function formatLunarMonthZh(month: number, isLeapMonth: boolean): string {
	const base = LUNAR_MONTH_ZH[month] ?? `月${month}`;
	return isLeapMonth ? `閏${base}` : base;
}

export function formatLunarDayZh(day: number): string {
	const base = LUNAR_DAY_ZH[day];
	if (!base) return String(day);
	/* 產品文案對齊 B1B：初五日／二十日（帶「日」）. */
	return `${base}日`;
}

/**
 * Build structured lunar result parts.
 * weekdayIndex 以對應國曆日計算（caller 傳入已換算的 civil）.
 */
export function buildLunarResultParts(
	lunar: LunarDate,
	civilForWeekday: CivilDate,
): LunarResultParts {
	const stemBranch = yearStemBranch(lunar.year);
	const wd = civilWeekday(civilForWeekday);
	const monthZh = formatLunarMonthZh(lunar.month, lunar.isLeapMonth);
	const dayZh = formatLunarDayZh(lunar.day);
	const leapEn = lunar.isLeapMonth ? "Leap " : "";
	return {
		kind: "lunar",
		lunar,
		stemBranch,
		zhYearLine: `農曆${stemBranch.zh}年`,
		zhMonthDayLine: `${monthZh}${dayZh}`,
		enPrimary: `${leapEn}Lunar ${lunar.month}/${lunar.day} · ${stemBranch.en}`,
		weekdayIndex: wd,
		weekdayZh: WEEKDAY_ZH[wd]!,
		weekdayEn: WEEKDAY_EN[wd]!,
	};
}

export function buildGregorianResultParts(civil: CivilDate): GregorianResultParts {
	const wd = civilWeekday(civil);
	return {
		kind: "gregorian",
		civil,
		zhPrimary: `${civil.year} 年 ${civil.month} 月 ${civil.day} 日`,
		/* EN Gregorian primary：日期本體；weekday 走獨立 slot（最終 EN 文案可於 B2 UI 再對齊產品）. */
		enPrimary: `${civil.year}-${String(civil.month).padStart(2, "0")}-${String(civil.day).padStart(2, "0")}`,
		weekdayIndex: wd,
		weekdayZh: WEEKDAY_ZH[wd]!,
		weekdayEn: WEEKDAY_EN[wd]!,
	};
}
