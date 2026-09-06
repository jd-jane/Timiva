/**
 * Lunar Date Converter — tool-local lunar field parser + numeric Smart Date UX.
 *
 * Owner B2E corrective：
 * - Continuous digits／auto-format（reuse DBD segment engine）
 * - Compact digits never invent leap（no 閏 marker → regular month）
 * - Explicit 閏／Calendar／AME only for leap
 * - Complete valid／invalid resolved immediately（no commit delay）
 */
import type { LunarDate } from "./lunar/lunarTypes.ts";
import { validatePublicLunar } from "./lunar/lunarValidate.ts";
import { formatLunarMonthZh, formatLunarDayCellZh } from "./lunar/lunarFormat.ts";
import {
	applySegmentInputChange,
	emptyDateSegments,
	extractDateDigits,
	formatSegmentsDisplay,
	formatSegmentsNormalized,
	isSegmentsComplete,
	isSegmentsEmpty,
	normalizeSegmentsForBlur,
	segmentsFromCalendarDate,
	segmentsFromPastedText,
	splitMonthDayDigits,
	type DateSegments,
	type FieldStatus,
} from "./daysBetweenDatesDateInput.ts";

export type LunarFieldStatus = "empty" | "incomplete" | "valid" | "invalid";

export type LunarParseResult = {
	status: LunarFieldStatus;
	lunar: LunarDate | null;
	/** Machine key for i18n error lookup when status === "invalid". */
	errorCode: string | null;
};

const RE_NUMERIC = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/;
/* Owner EN committed：Lunar Y/M/D｜Lunar Y/Leap M/D（Leap wording = calendar month option）. */
const RE_EN_SEMANTIC_REGULAR = /^Lunar\s+(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/i;
const RE_EN_SEMANTIC_LEAP = /^Lunar\s+(\d{4})[/-]Leap\s+(\d{1,2})[/-](\d{1,2})$/i;
/* Legacy EN leap tail — still accepted on parse only. */
const RE_EN_LEAP_SUFFIX = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})\s*\(leap\)$/i;
const RE_LEAP_NUM = /^(\d{4})年?閏(\d{1,2})月(\d{1,2})日?$/;
const RE_LEAP_ZH =
	/^(\d{4})年?閏(十一|十二|十|正|一|二|三|四|五|六|七|八|九)月(\d{1,2})日?$/;
/* Owner compact leap：1963閏415／1963潤415（潤已 normalize）— 不強制「月」 */
const RE_LEAP_COMPACT = /^(\d{4})年?閏(\d{1,4})$/;
const RE_ZH =
	/^(\d{4})年?(十一|十二|十|正|一|二|三|四|五|六|七|八|九)月(\d{1,2})日?$/;
/* Owner committed ZH：2023年正月初一／1963年閏四月十五（reuse lunar day-cell names）. */
const ZH_DAY_CELL =
	"初一|初二|初三|初四|初五|初六|初七|初八|初九|初十|十一|十二|十三|十四|十五|十六|十七|十八|十九|二十|廿一|廿二|廿三|廿四|廿五|廿六|廿七|廿八|廿九|三十";
const RE_ZH_SEMANTIC = new RegExp(
	`^(\\d{4})年?(閏)?(十一|十二|十|正|一|二|三|四|五|六|七|八|九)月(${ZH_DAY_CELL})日?$`,
);

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

const ZH_DAY_CELL_MAP: Record<string, number> = {
	初一: 1,
	初二: 2,
	初三: 3,
	初四: 4,
	初五: 5,
	初六: 6,
	初七: 7,
	初八: 8,
	初九: 9,
	初十: 10,
	十一: 11,
	十二: 12,
	十三: 13,
	十四: 14,
	十五: 15,
	十六: 16,
	十七: 17,
	十八: 18,
	十九: 19,
	二十: 20,
	廿一: 21,
	廿二: 22,
	廿三: 23,
	廿四: 24,
	廿五: 25,
	廿六: 26,
	廿七: 27,
	廿八: 28,
	廿九: 29,
	三十: 30,
};

function parseZhMonth(token: string): number | null {
	return ZH_MONTH[token] ?? null;
}

function parseZhDayCell(token: string): number | null {
	return ZH_DAY_CELL_MAP[token] ?? null;
}

/**
 * Owner leap alias：常見誤字「潤」在 parse boundary normalize 成正式「閏」。
 * Committed display／Result 一律只輸出「閏」；EN 不受影響。
 */
export function normalizeLunarLeapAlias(text: string): string {
	return text.replaceAll("潤", "閏");
}

function buildLunar(
	year: number,
	month: number,
	day: number,
	isLeapMonth: boolean,
): LunarDate {
	return { year, month, day, isLeapMonth };
}

function isLunarSegmentShape(year: number, month: number, day: number): boolean {
	return (
		Number.isInteger(year) &&
		year >= 1 &&
		year <= 9999 &&
		Number.isInteger(month) &&
		month >= 1 &&
		month <= 12 &&
		Number.isInteger(day) &&
		day >= 1 &&
		day <= 31
	);
}

/** Pure digit / slash-dash numeric → regular month only（never invent leap）. */
export function tryParseLunarNumericSegments(text: string): LunarDate | null {
	const trimmed = text.trim();
	if (!trimmed) {
		return null;
	}
	if (
		/[閏潤年月日正一二三四五六七八九十]/.test(trimmed) ||
		/\(leap\)/i.test(trimmed) ||
		/^Lunar\b/i.test(trimmed) ||
		/\bLeap\b/i.test(trimmed)
	) {
		return null;
	}
	if (/[^\d\s/-]/.test(trimmed)) {
		return null;
	}

	const segments = segmentsFromPastedText(trimmed);
	if (!isSegmentsComplete(segments)) {
		return null;
	}

	const year = Number(segments.year);
	const month = Number(segments.month);
	const day = Number(segments.day);
	if (!isLunarSegmentShape(year, month, day)) {
		return null;
	}
	return buildLunar(year, month, day, false);
}

/** Structural parse only — no range/leap validation. */
export function tryParseLunarStructure(text: string): LunarDate | null {
	const trimmed = normalizeLunarLeapAlias(text.trim());
	if (!trimmed) {
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

	/* Explicit 閏 + compact month/day digits（reuse numeric split；leap 由 marker 表達） */
	m = RE_LEAP_COMPACT.exec(trimmed);
	if (m) {
		const year = Number(m[1]);
		const rest = m[2] ?? "";
		const { month, day } = splitMonthDayDigits(rest, year);
		if (!month || !day) {
			return null;
		}
		const monthNum = Number(month);
		const dayNum = Number(day);
		if (!Number.isInteger(monthNum) || !Number.isInteger(dayNum)) {
			return null;
		}
		return buildLunar(year, monthNum, dayNum, true);
	}

	m = RE_ZH_SEMANTIC.exec(trimmed);
	if (m) {
		const month = parseZhMonth(m[3]!);
		const day = parseZhDayCell(m[4]!);
		if (month === null || day === null) {
			return null;
		}
		return buildLunar(Number(m[1]), month, day, Boolean(m[2]));
	}

	m = RE_EN_SEMANTIC_LEAP.exec(trimmed);
	if (m) {
		return buildLunar(Number(m[1]), Number(m[2]), Number(m[3]), true);
	}

	m = RE_EN_SEMANTIC_REGULAR.exec(trimmed);
	if (m) {
		return buildLunar(Number(m[1]), Number(m[2]), Number(m[3]), false);
	}

	m = RE_EN_LEAP_SUFFIX.exec(trimmed);
	if (m) {
		return buildLunar(Number(m[1]), Number(m[2]), Number(m[3]), true);
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

	return tryParseLunarNumericSegments(trimmed);
}

export function formatLunarInputDisplay(lunar: LunarDate): string {
	return `${lunar.year}/${lunar.month}/${lunar.day}`;
}

/**
 * Committed lunar field display after complete+valid / mode switch / Calendar／AME.
 * ZH：Owner semantic（年 + lunar month/day cell names）.
 * EN：Owner semantic — `Lunar Y/M/D`｜`Lunar Y/Leap M/D`（reuse Result "Lunar" + calendar "Leap N"）.
 */
export function formatLunarInputDisplayForLocale(
	lunar: LunarDate,
	locale: "en" | "zh",
): string {
	if (locale === "zh") {
		const monthLabel = formatLunarMonthZh(lunar.month, lunar.isLeapMonth);
		return `${lunar.year}年${monthLabel}${formatLunarDayCellZh(lunar.day)}`;
	}
	if (lunar.isLeapMonth) {
		return `Lunar ${lunar.year}/Leap ${lunar.month}/${lunar.day}`;
	}
	return `Lunar ${lunar.year}/${lunar.month}/${lunar.day}`;
}

function isStructurallyCompleteText(text: string): boolean {
	const trimmed = normalizeLunarLeapAlias(text.trim());
	if (!trimmed) {
		return false;
	}
	if (tryParseLunarStructure(trimmed)) {
		return true;
	}
	if (/[閏年月日正一二三四五六七八九十初廿]/.test(trimmed)) {
		return (
			RE_LEAP_NUM.test(trimmed) ||
			RE_LEAP_ZH.test(trimmed) ||
			RE_ZH.test(trimmed) ||
			RE_ZH_SEMANTIC.test(trimmed)
		);
	}
	if (/^Lunar\b/i.test(trimmed) || /\bLeap\b/i.test(trimmed) || /\(leap\)/i.test(trimmed)) {
		return (
			RE_EN_SEMANTIC_LEAP.test(trimmed) ||
			RE_EN_SEMANTIC_REGULAR.test(trimmed) ||
			RE_EN_LEAP_SUFFIX.test(trimmed)
		);
	}
	if (/[^\d\s/-]/.test(trimmed)) {
		return true;
	}
	const digits = extractDateDigits(trimmed);
	const segments = segmentsFromPastedText(trimmed);
	return digits.length >= 8 || isSegmentsComplete(segments);
}

/**
 * Evaluate lunar field text.
 * `commit` kept for call-site compat；complete invalid no longer waits for blur.
 */
export function evaluateLunarInput(
	text: string,
	_options: { commit: boolean } = { commit: true },
): LunarParseResult {
	const trimmed = normalizeLunarLeapAlias(text.trim());
	if (!trimmed) {
		return { status: "empty", lunar: null, errorCode: null };
	}

	const structural = tryParseLunarStructure(trimmed);
	if (!structural) {
		if (isStructurallyCompleteText(trimmed)) {
			return { status: "invalid", lunar: null, errorCode: "unrecognized-format" };
		}
		return { status: "incomplete", lunar: null, errorCode: null };
	}

	const validation = validatePublicLunar(structural);
	if (validation.status === "invalid") {
		return {
			status: "invalid",
			lunar: null,
			errorCode: validation.code,
		};
	}

	return { status: "valid", lunar: structural, errorCode: null };
}

export type LunarNumericFieldSnapshot = {
	status: FieldStatus;
	lunar: LunarDate | null;
	display: string;
	normalizedDisplay: string;
	segments: DateSegments;
	errorCode: string | null;
};

function snapshotFromLunarSegments(
	segments: DateSegments,
	normalized: boolean,
): LunarNumericFieldSnapshot {
	if (isSegmentsEmpty(segments)) {
		return {
			status: "empty",
			lunar: null,
			display: normalized
				? formatSegmentsNormalized(segments)
				: formatSegmentsDisplay(segments),
			normalizedDisplay: formatSegmentsNormalized(segments),
			segments: { ...segments },
			errorCode: null,
		};
	}

	if (!isSegmentsComplete(segments)) {
		return {
			status: "incomplete",
			lunar: null,
			display: normalized
				? formatSegmentsNormalized(segments)
				: formatSegmentsDisplay(segments),
			normalizedDisplay: formatSegmentsNormalized(segments),
			segments: { ...segments },
			errorCode: null,
		};
	}

	const year = Number(segments.year);
	const month = Number(segments.month);
	const day = Number(segments.day);
	const display = normalized
		? formatSegmentsNormalized(segments)
		: formatSegmentsDisplay(segments);
	const normalizedDisplay = formatSegmentsNormalized(segments);

	if (!isLunarSegmentShape(year, month, day)) {
		return {
			status: "invalid",
			lunar: null,
			display,
			normalizedDisplay,
			segments: { ...segments },
			errorCode: "invalid-lunar-date",
		};
	}

	const lunar = buildLunar(year, month, day, false);
	const validation = validatePublicLunar(lunar);
	if (validation.status === "invalid") {
		return {
			status: "invalid",
			lunar: null,
			display,
			normalizedDisplay,
			segments: { ...segments },
			errorCode: validation.code,
		};
	}

	return {
		status: "valid",
		lunar,
		display,
		normalizedDisplay,
		segments: { ...segments },
		errorCode: null,
	};
}

export type LunarNumericFieldController = {
	getSnapshot: () => LunarNumericFieldSnapshot;
	setLunar: (lunar: LunarDate) => LunarNumericFieldSnapshot;
	clear: () => LunarNumericFieldSnapshot;
	applyInputChange: (
		inputType: string,
		data: string | null,
		selectionStart: number,
		selectionEnd: number,
	) => { snapshot: LunarNumericFieldSnapshot; caret: number };
	applyPaste: (text: string) => { snapshot: LunarNumericFieldSnapshot; caret: number };
	commitNormalize: () => LunarNumericFieldSnapshot;
	destroy: () => void;
};

/** Numeric Smart Date UX for lunar regular months（leap via Calendar／AME／explicit 閏 only）. */
export function createLunarNumericFieldController(): LunarNumericFieldController {
	let segments = emptyDateSegments();
	let destroyed = false;

	const emit = (normalized: boolean): LunarNumericFieldSnapshot =>
		snapshotFromLunarSegments(segments, normalized);

	return {
		getSnapshot: () => snapshotFromLunarSegments(segments, false),

		setLunar: (lunar: LunarDate) => {
			if (destroyed) {
				return snapshotFromLunarSegments(segments, true);
			}
			/* Numeric field stores regular Y/M/D only；leap flag is display／SSOT elsewhere. */
			segments = segmentsFromCalendarDate({
				year: lunar.year,
				month: lunar.month,
				day: lunar.day,
			});
			return emit(true);
		},

		clear: () => {
			if (destroyed) {
				return snapshotFromLunarSegments(segments, true);
			}
			segments = emptyDateSegments();
			return emit(true);
		},

		applyInputChange: (inputType, data, selectionStart, selectionEnd) => {
			if (destroyed) {
				return { snapshot: snapshotFromLunarSegments(segments, false), caret: 0 };
			}

			const formatted = formatSegmentsDisplay(segments);
			const isFullSelection =
				formatted.length > 0 &&
				selectionStart === 0 &&
				selectionEnd >= formatted.length;
			const resolvedInputType =
				isFullSelection &&
				(inputType === "deleteContentBackward" || inputType === "deleteContentForward")
					? "clearAll"
					: inputType;

			let start = selectionStart;
			let end = selectionEnd;
			if (
				segments.preferStream &&
				resolvedInputType === "insertText" &&
				start === end
			) {
				start = end = formatted.length;
			}

			const result = applySegmentInputChange(
				segments,
				resolvedInputType,
				data,
				start,
				end,
			);
			segments = result.segments;

			let caret = result.caret;
			if (segments.preferStream && resolvedInputType === "insertText") {
				caret = formatSegmentsDisplay(segments).length;
			}

			return { snapshot: emit(false), caret };
		},

		applyPaste: (text) => {
			if (destroyed) {
				return { snapshot: snapshotFromLunarSegments(segments, false), caret: 0 };
			}
			segments = segmentsFromPastedText(text);
			const snapshot = emit(false);
			return { snapshot, caret: formatSegmentsDisplay(segments).length };
		},

		commitNormalize: () => {
			if (destroyed) {
				return snapshotFromLunarSegments(segments, true);
			}
			if (isSegmentsEmpty(segments)) {
				segments = emptyDateSegments();
				return emit(true);
			}
			segments = normalizeSegmentsForBlur(segments);
			return emit(true);
		},

		destroy: () => {
			destroyed = true;
		},
	};
}

export function isLunarNumericDraftText(text: string): boolean {
	const trimmed = text.trim();
	if (!trimmed) {
		return true;
	}
	if (
		/[閏潤年月日正一二三四五六七八九十]/.test(trimmed) ||
		/\(leap\)/i.test(trimmed) ||
		/^Lunar\b/i.test(trimmed) ||
		/\bLeap\b/i.test(trimmed)
	) {
		return false;
	}
	return !/[^\d\s/-]/.test(trimmed);
}
