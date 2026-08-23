/**
 * Lunar Date Converter — tool-local single-field lunar text parser.
 * Explicit formats only; no compact 6/7/8 digit; no 「潤」 typo.
 */
import type { LunarDate } from "./lunar/lunarTypes.ts";
import { validatePublicLunar } from "./lunar/lunarValidate.ts";
import { formatLunarMonthZh, formatLunarDayZh } from "./lunar/lunarFormat.ts";

export type LunarFieldStatus = "empty" | "incomplete" | "valid" | "invalid";

export type LunarParseResult = {
	status: LunarFieldStatus;
	lunar: LunarDate | null;
	/** Machine key for i18n error lookup when status === "invalid". */
	errorCode: string | null;
};

const RE_NUMERIC = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/;
const RE_LEAP_NUM = /^(\d{4})閏(\d{1,2})月(\d{1,2})日?$/;
const RE_LEAP_ZH =
	/^(\d{4})閏(十一|十二|十|正|一|二|三|四|五|六|七|八|九)月(\d{1,2})日?$/;
const RE_ZH =
	/^(\d{4})(十一|十二|十|正|一|二|三|四|五|六|七|八|九)月(\d{1,2})日?$/;

const ZH_MONTH: Record<string, number> = {
	正: 1,
	一: 1,
	二: 2,
	三: 3,
	四: 4,
	五: 5,
	六: 6,
	七: 7,
	八: 8,
	九: 9,
	十: 10,
	十一: 11,
	十二: 12,
};

function parseZhMonth(token: string): number | null {
	return ZH_MONTH[token] ?? null;
}

function buildLunar(
	year: number,
	month: number,
	day: number,
	isLeapMonth: boolean,
): LunarDate {
	return { year, month, day, isLeapMonth };
}

/** Structural parse only — no range/leap validation. */
export function tryParseLunarStructure(text: string): LunarDate | null {
	const trimmed = text.trim();
	if (!trimmed || /潤/.test(trimmed)) {
		return null;
	}

	let m = RE_LEAP_NUM.exec(trimmed);
	if (m) {
		return buildLunar(Number(m[1]), Number(m[2]), Number(m[3]), true);
	}

	m = RE_LEAP_ZH.exec(trimmed);
	if (m) {
		const month = parseZhMonth(m[2]!);
		if (month === null) {
			return null;
		}
		return buildLunar(Number(m[1]), month, Number(m[3]), true);
	}

	m = RE_NUMERIC.exec(trimmed);
	if (m) {
		return buildLunar(Number(m[1]), Number(m[2]), Number(m[3]), false);
	}

	m = RE_ZH.exec(trimmed);
	if (m) {
		const month = parseZhMonth(m[2]!);
		if (month === null) {
			return null;
		}
		return buildLunar(Number(m[1]), month, Number(m[3]), false);
	}

	return null;
}

export function formatLunarInputDisplay(lunar: LunarDate): string {
	return `${lunar.year}/${lunar.month}/${lunar.day}`;
}

/** Canonical display when repopulating field after switch / reset. */
export function formatLunarInputDisplayForLocale(
	lunar: LunarDate,
	locale: "en" | "zh",
): string {
	if (locale === "zh") {
		const monthLabel = formatLunarMonthZh(lunar.month, lunar.isLeapMonth);
		return `${lunar.year}${monthLabel}${formatLunarDayZh(lunar.day)}`;
	}
	if (lunar.isLeapMonth) {
		return `${lunar.year}/${lunar.month}/${lunar.day} (leap)`;
	}
	return formatLunarInputDisplay(lunar);
}

export function evaluateLunarInput(
	text: string,
	options: { commit: boolean },
): LunarParseResult {
	const trimmed = text.trim();
	if (!trimmed) {
		return { status: "empty", lunar: null, errorCode: null };
	}

	if (/潤/.test(trimmed)) {
		return options.commit
			? { status: "invalid", lunar: null, errorCode: "unsupported-leap-typo" }
			: { status: "incomplete", lunar: null, errorCode: null };
	}

	const structural = tryParseLunarStructure(trimmed);
	if (!structural) {
		return options.commit
			? { status: "invalid", lunar: null, errorCode: "unrecognized-format" }
			: { status: "incomplete", lunar: null, errorCode: null };
	}

	const validation = validatePublicLunar(structural);
	if (validation.status === "invalid") {
		return {
			status: options.commit ? "invalid" : "incomplete",
			lunar: null,
			errorCode: options.commit ? validation.code : null,
		};
	}

	return { status: "valid", lunar: structural, errorCode: null };
}
