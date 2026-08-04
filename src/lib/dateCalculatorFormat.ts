/**
 * Date Calculator — result／summary formatting（tool-owned）.
 * Pure display helpers. Does not own calculateDate math.
 */
import type { CivilDate, Direction, Duration } from "./dateCalculatorMath.ts";

export type DateCalculatorLocale = "en" | "zh";

const EN_MONTHS_SHORT = [
	"JAN",
	"FEB",
	"MAR",
	"APR",
	"MAY",
	"JUN",
	"JUL",
	"AUG",
	"SEP",
	"OCT",
	"NOV",
	"DEC",
] as const;

const EN_MONTHS_TITLE = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
] as const;

const EN_WEEKDAYS = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
] as const;

const ZH_WEEKDAYS = [
	"星期日",
	"星期一",
	"星期二",
	"星期三",
	"星期四",
	"星期五",
	"星期六",
] as const;

function pad2(n: number): string {
	return n < 10 ? `0${n}` : String(n);
}

/** UTC weekday for a civil Y-M-D（0=Sunday）. */
export function civilWeekdayIndex(date: CivilDate): number {
	return new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
}

export function formatCivilIso(date: CivilDate): string {
	return `${date.year}-${pad2(date.month)}-${pad2(date.day)}`;
}

export function parseCivilIso(raw: string): CivilDate | null {
	const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim());
	if (!m) {
		return null;
	}
	return {
		year: Number(m[1]),
		month: Number(m[2]),
		day: Number(m[3]),
	};
}

/** Primary result — EN: AUG 10, 2026 · ZH: 年／月日兩段（Mobile pre-line；Desktop nowrap 併成單行） */
export function formatResultPrimary(date: CivilDate, locale: DateCalculatorLocale): string {
	if (locale === "zh") {
		return `${date.year} 年\n${date.month} 月 ${date.day} 日`;
	}
	return `${EN_MONTHS_SHORT[date.month - 1]} ${date.day}, ${date.year}`;
}

export function formatResultWeekday(date: CivilDate, locale: DateCalculatorLocale): string {
	const idx = civilWeekdayIndex(date);
	return locale === "zh" ? ZH_WEEKDAYS[idx] : EN_WEEKDAYS[idx];
}

function formatStartInSummary(date: CivilDate, locale: DateCalculatorLocale): string {
	if (locale === "zh") {
		return `${date.year} 年 ${date.month} 月 ${date.day} 日`;
	}
	return `${EN_MONTHS_TITLE[date.month - 1]} ${date.day}, ${date.year}`;
}

type UnitPart = { unit: keyof Duration; value: number };

function unitParts(duration: Duration): UnitPart[] {
	const order: Array<keyof Duration> = ["years", "months", "weeks", "days"];
	return order
		.map((unit) => ({ unit, value: duration[unit] }))
		.filter((p) => p.value > 0);
}

function enUnitLabel(unit: keyof Duration, value: number): string {
	const singular: Record<keyof Duration, string> = {
		years: "year",
		months: "month",
		weeks: "week",
		days: "day",
	};
	const plural: Record<keyof Duration, string> = {
		years: "years",
		months: "months",
		weeks: "weeks",
		days: "days",
	};
	return `${value} ${value === 1 ? singular[unit] : plural[unit]}`;
}

function zhUnitLabel(unit: keyof Duration, value: number): string {
	if (unit === "years") {
		return `${value} 年`;
	}
	if (unit === "months") {
		return `${value} 個月`;
	}
	if (unit === "weeks") {
		return `${value} 週`;
	}
	return `${value} 天`;
}

function joinEnList(parts: string[]): string {
	if (parts.length === 0) {
		return "";
	}
	if (parts.length === 1) {
		return parts[0];
	}
	if (parts.length === 2) {
		return `${parts[0]} and ${parts[1]}`;
	}
	return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

function joinZhList(parts: string[]): string {
	return parts.join("");
}

/**
 * Natural-language calculation summary.
 * All-zero duration → startingDateLabel（「Starting date」／「起始日期」）.
 */
export function formatResultSupport(
	start: CivilDate,
	direction: Direction,
	duration: Duration,
	locale: DateCalculatorLocale,
	startingDateLabel: string,
): string {
	const parts = unitParts(duration);
	if (parts.length === 0) {
		return startingDateLabel;
	}

	const startText = formatStartInSummary(start, locale);

	if (locale === "zh") {
		const amount = joinZhList(parts.map((p) => zhUnitLabel(p.unit, p.value)));
		const verb = direction === "add" ? "加上" : "減去";
		return `從 ${startText} 起，${verb} ${amount}。`;
	}

	const amount = joinEnList(parts.map((p) => enUnitLabel(p.unit, p.value)));
	if (direction === "add") {
		return `Add ${amount} to ${startText}.`;
	}
	return `Subtract ${amount} from ${startText}.`;
}
