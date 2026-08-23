/**
 * 歲次年干支 only（不做干支月／日）.
 * Cycle：甲子 year when (year - 4) % 60 === 0（e.g. 1984）.
 */

import type { StemBranch } from "./lunarTypes.ts";

const STEMS_ZH = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
const BRANCHES_ZH = [
	"子",
	"丑",
	"寅",
	"卯",
	"辰",
	"巳",
	"午",
	"未",
	"申",
	"酉",
	"戌",
	"亥",
] as const;

const STEMS_EN = [
	"Jia",
	"Yi",
	"Bing",
	"Ding",
	"Wu",
	"Ji",
	"Geng",
	"Xin",
	"Ren",
	"Gui",
] as const;

const BRANCHES_EN = [
	"zi",
	"chou",
	"yin",
	"mao",
	"chen",
	"si",
	"wu",
	"wei",
	"shen",
	"you",
	"xu",
	"hai",
] as const;

export function yearStemBranchIndex(year: number): number {
	const mod = (year - 4) % 60;
	return mod < 0 ? mod + 60 : mod;
}

export function yearStemBranch(year: number): StemBranch {
	const index = yearStemBranchIndex(year);
	const stem = index % 10;
	const branch = index % 12;
	return {
		index,
		zh: `${STEMS_ZH[stem]}${BRANCHES_ZH[branch]}`,
		en: `${STEMS_EN[stem]}-${BRANCHES_EN[branch]}`,
	};
}
