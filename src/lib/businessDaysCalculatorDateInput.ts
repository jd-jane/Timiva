/**
 * Business Days Calculator — self-contained Smart Date Input (B2A).
 * Copied / adapted from Days Between Dates date-input engine（不修改 DBD 原檔）。
 * BDC 專屬新增：resolveOrderedRange（反向自動交換）、Mobile Y/M/D helpers、
 * 逐欄 invalid 判斷（1900-01-01 … 2100-12-31）。
 */
import { isLeapYear } from "./yearProgressMath.ts";

export type CalendarDate = {
	year: number;
	month: number;
	day: number;
};

export type DateSegments = {
	year: string;
	month: string;
	day: string;
	/** Keep month slot visible when empty (e.g. `1999 /  / 04`). */
	openMonth: boolean;
	/** Keep day slot visible when empty (e.g. `1999 / 01 / `). */
	openDay: boolean;
	/**
	 * After deleting a mid digit from a complete segment, the next typed digit
	 * inserts at this offset instead of overwriting / collapsing trailing digits.
	 */
	gapAt: { segment: SegmentKey; offset: number } | null;
	/**
	 * Pure-digit forward entry may re-stream (6/7/8 inference).
	 * Once false, year/month/day segments are respected and never re-merged.
	 */
	preferStream: boolean;
};

export type SegmentKey = "year" | "month" | "day";

export type SegmentCaretContext = {
	segment: SegmentKey;
	offset: number;
};

export const MIN_DATE_YEAR = 1900;
export const MAX_DATE_YEAR = 2100;

const SEGMENT_MAX_LENGTH: Record<SegmentKey, number> = {
	year: 4,
	month: 2,
	day: 2,
};

export function daysInMonth(year: number, month: number): number {
	if (month === 2) {
		return isLeapYear(year) ? 29 : 28;
	}

	if ([1, 3, 5, 7, 8, 10, 12].includes(month)) {
		return 31;
	}

	return 30;
}

export function isValidCalendarDate(
	year: number,
	month: number,
	day: number,
): boolean {
	if (!Number.isInteger(year) || year < 1 || year > 9999) {
		return false;
	}

	if (!Number.isInteger(month) || month < 1 || month > 12) {
		return false;
	}

	if (!Number.isInteger(day) || day < 1) {
		return false;
	}

	return day <= daysInMonth(year, month);
}

/** Strip separators and keep up to 8 digits. */
export function extractDateDigits(input: string): string {
	return input.replace(/\D/g, "").slice(0, 8);
}

export function emptyDateSegments(): DateSegments {
	return {
		year: "",
		month: "",
		day: "",
		openMonth: false,
		openDay: false,
		gapAt: null,
		preferStream: true,
	};
}

export function isSegmentsEmpty(segments: DateSegments): boolean {
	return segments.year === "" && segments.month === "" && segments.day === "";
}

export function isSegmentsComplete(segments: DateSegments): boolean {
	return (
		segments.year.length === 4 &&
		segments.month.length >= 1 &&
		segments.day.length >= 1
	);
}

function withSegmentFlags(
	segments: Omit<DateSegments, "openMonth" | "openDay" | "gapAt" | "preferStream"> &
		Partial<Pick<DateSegments, "openMonth" | "openDay" | "gapAt" | "preferStream">>,
): DateSegments {
	const openDay = Boolean(segments.openDay) || segments.day !== "";
	const openMonth =
		Boolean(segments.openMonth) ||
		segments.month !== "" ||
		segments.day !== "" ||
		openDay;

	return {
		year: segments.year,
		month: segments.month,
		day: segments.day,
		openMonth,
		openDay,
		gapAt: segments.gapAt ?? null,
		// Default false for structured/segment edits; pure stream helpers set true explicitly.
		preferStream: segments.preferStream ?? false,
	};
}

/** Editing display — no zero padding; empty segments can keep their slots. */
export function formatSegmentsDisplay(segments: DateSegments): string {
	if (isSegmentsEmpty(segments)) {
		return "";
	}

	const showMonth =
		segments.openMonth ||
		segments.month !== "" ||
		segments.day !== "" ||
		segments.openDay;
	const showDay = segments.openDay || segments.day !== "";

	let formatted = segments.year;

	if (showMonth || showDay) {
		formatted += ` / ${segments.month}`;
	}

	if (showDay) {
		formatted += ` / ${segments.day}`;
	}

	return formatted;
}

/** Blur display — pad month/day to two digits when present. */
export function formatSegmentsNormalized(segments: DateSegments): string {
	if (isSegmentsEmpty(segments)) {
		return "";
	}

	const month = segments.month ? segments.month.padStart(2, "0") : segments.month;
	const day = segments.day ? segments.day.padStart(2, "0") : segments.day;

	return formatSegmentsDisplay(
		withSegmentFlags({
			...segments,
			month,
			day,
		}),
	);
}

export function normalizeSegmentsForBlur(segments: DateSegments): DateSegments {
	if (isSegmentsEmpty(segments)) {
		return emptyDateSegments();
	}

	return withSegmentFlags({
		year: segments.year,
		month: segments.month ? segments.month.padStart(2, "0") : "",
		day: segments.day ? segments.day.padStart(2, "0") : "",
		openMonth: segments.openMonth,
		openDay: segments.openDay,
		preferStream: false,
	});
}

function cloneSegments(segments: DateSegments): DateSegments {
	return {
		year: segments.year,
		month: segments.month,
		day: segments.day,
		openMonth: segments.openMonth,
		openDay: segments.openDay,
		gapAt: segments.gapAt
			? { segment: segments.gapAt.segment, offset: segments.gapAt.offset }
			: null,
		preferStream: segments.preferStream,
	};
}

function segmentMaxLength(segment: SegmentKey): number {
	return SEGMENT_MAX_LENGTH[segment];
}

function isForwardAppend(segments: DateSegments, caret: number): boolean {
	return caret >= formatSegmentsDisplay(segments).length;
}

export function resolveCaretContext(
	segments: DateSegments,
	caret: number,
): SegmentCaretContext {
	const formatted = formatSegmentsDisplay(segments);

	if (!formatted) {
		return { segment: "year", offset: 0 };
	}

	const clampedCaret = Math.max(0, Math.min(caret, formatted.length));
	const yearEnd = segments.year.length;

	if (clampedCaret <= yearEnd) {
		return { segment: "year", offset: clampedCaret };
	}

	const showMonth =
		segments.openMonth ||
		segments.month !== "" ||
		segments.day !== "" ||
		segments.openDay;
	const showDay = segments.openDay || segments.day !== "";

	if (!showMonth && !showDay) {
		return { segment: "year", offset: yearEnd };
	}

	const monthStart = yearEnd + 3;
	const monthEnd = monthStart + segments.month.length;

	if (!showDay || clampedCaret <= monthEnd) {
		return {
			segment: "month",
			offset: Math.max(0, Math.min(clampedCaret - monthStart, segments.month.length)),
		};
	}

	const dayStart = monthEnd + 3;

	return {
		segment: "day",
		offset: Math.max(0, Math.min(clampedCaret - dayStart, segments.day.length)),
	};
}

export function caretForSegmentOffset(
	segments: DateSegments,
	segment: SegmentKey,
	offset: number,
): number {
	const formatted = formatSegmentsDisplay(segments);
	const yearEnd = segments.year.length;

	if (segment === "year") {
		return Math.max(0, Math.min(offset, yearEnd));
	}

	const monthStart = yearEnd + 3;

	if (segment === "month") {
		return Math.max(
			monthStart,
			Math.min(monthStart + offset, monthStart + segments.month.length),
		);
	}

	const dayStart = monthStart + segments.month.length + 3;

	return Math.max(
		dayStart,
		Math.min(dayStart + offset, formatted.length),
	);
}

function appendDigitToSegment(
	segments: DateSegments,
	segment: SegmentKey,
	digit: string,
): DateSegments {
	const next = cloneSegments(segments);
	next.preferStream = false;
	next.gapAt = null;

	if (segment === "year") {
		next.year = `${next.year}${digit}`.slice(0, 4);
	} else if (segment === "month") {
		next.month = `${next.month}${digit}`.slice(0, 2);
		next.openMonth = true;
	} else {
		next.day = `${next.day}${digit}`.slice(0, 2);
		next.openDay = true;
		next.openMonth = true;
	}

	return withSegmentFlags(next);
}

function appendDigitForward(segments: DateSegments, digit: string): DateSegments {
	// Year hole with later segments: only fill year, never re-stream.
	if (
		segments.year.length < 4 &&
		(segments.month !== "" || segments.day !== "" || segments.openMonth || segments.openDay)
	) {
		return withSegmentFlags({
			...segments,
			year: `${segments.year}${digit}`.slice(0, 4),
			gapAt: null,
			preferStream: false,
		});
	}

	// Raw continuous input: always re-derive from the full digit stream.
	// Do NOT branch into segment-append just because an intermediate 6-digit
	// inference already filled month/day — that breaks 19991122-style 8-digit entry.
	if (segments.preferStream) {
		const stream = `${segments.year}${segments.month}${segments.day}${digit}`.slice(0, 8);
		return segmentsFromStreamDigits(stream);
	}

	// Segment-based editing: never re-merge into 6/7/8 pure-digit inference.
	if (segments.day !== "" || segments.openDay || segments.month.length >= 2) {
		if (segments.day.length >= 2) {
			return withSegmentFlags({ ...segments, preferStream: false, gapAt: null });
		}
		return appendDigitToSegment(segments, "day", digit);
	}

	if (segments.month.length === 1) {
		const first = segments.month;
		const asTwoDigit = Number(`${first}${digit}`);

		// 0/1 may still complete month (01–12); otherwise digit starts day.
		if ((first === "0" || first === "1") && asTwoDigit >= 1 && asTwoDigit <= 12) {
			return appendDigitToSegment(segments, "month", digit);
		}

		return appendDigitToSegment(segments, "day", digit);
	}

	if (segments.month.length === 0) {
		return appendDigitToSegment(segments, "month", digit);
	}

	const stream = `${segments.year}${segments.month}${segments.day}${digit}`.slice(0, 8);
	return segmentsFromStreamDigits(stream);
}

/** Slash / dash：結束目前 segment，進入下一段（離開 raw continuous）。 */
export function applyDelimiterAdvance(segments: DateSegments): DateSegments {
	const next = cloneSegments(segments);
	next.preferStream = false;
	next.gapAt = null;

	if (next.month === "" && !next.openMonth) {
		next.openMonth = true;
		return withSegmentFlags(next);
	}

	if (next.day === "" && !next.openDay) {
		next.openDay = true;
		next.openMonth = true;
		return withSegmentFlags(next);
	}

	return withSegmentFlags(next);
}

/** 目前 segment 狀態下的純數字位數（continuous stream 長度）。 */
export function countStreamDigits(segments: DateSegments): number {
	return `${segments.year}${segments.month}${segments.day}`.length;
}

/**
 * Desktop From → To auto-focus 完成判斷（比 isSegmentsComplete 更保守）。
 * - continuous：僅 8 碼且 valid 才算完成（6/7 碼逐鍵不觸發）
 * - paste / blur：任一 valid 可算完成
 * - segment / delimited：valid 即算完成
 */
export function isEntryCompleteForAutoFocus(
	segments: DateSegments,
	options: { fromPaste?: boolean; fromBlurOrEnter?: boolean } = {},
): boolean {
	if (resolveFieldStatus(segments) !== "valid") {
		return false;
	}

	if (options.fromPaste || options.fromBlurOrEnter) {
		return true;
	}

	if (segments.preferStream) {
		return countStreamDigits(segments) >= 8;
	}

	return true;
}

function insertDigitInSegment(
	segments: DateSegments,
	segment: SegmentKey,
	offset: number,
	digit: string,
): DateSegments {
	const next = cloneSegments(segments);
	const chars = next[segment].split("");
	const maxLength = segmentMaxLength(segment);
	const gap = next.gapAt;

	if (gap && gap.segment === segment && offset === gap.offset) {
		// Fill the mid-delete hole: insert, keeping trailing digits.
		chars.splice(gap.offset, 0, digit);
		next.gapAt = null;
	} else {
		next.gapAt = null;

		if (offset < chars.length) {
			// Overwrite existing digit — keep trailing digits in this segment.
			chars[offset] = digit;
		} else if (chars.length < maxLength) {
			chars.push(digit);
		}
	}

	next[segment] = chars.join("").slice(0, maxLength);
	next.preferStream = false;

	if (segment === "month") {
		next.openMonth = true;
	}

	if (segment === "day") {
		next.openDay = true;
		next.openMonth = true;
	}

	return withSegmentFlags(next);
}

/** Replace a selection with one digit, preserving digits after the selection. */
function replaceSelectionWithDigit(
	segments: DateSegments,
	start: SegmentCaretContext,
	end: SegmentCaretContext,
	digit: string,
): DateSegments {
	if (start.segment === end.segment) {
		const next = cloneSegments(segments);
		const value = next[start.segment];
		const replaced =
			value.slice(0, start.offset) + digit + value.slice(end.offset);
		next[start.segment] = replaced.slice(0, segmentMaxLength(start.segment));
		next.gapAt = null;
		next.preferStream = false;

		if (start.segment === "month") {
			next.openMonth = true;
		}

		if (start.segment === "day") {
			next.openDay = true;
			next.openMonth = true;
		}

		return withSegmentFlags(next);
	}

	const cleared = deleteSegmentRange(segments, start, end);
	return insertDigitInSegment(cleared, start.segment, start.offset, digit);
}

function deleteSegmentRange(
	segments: DateSegments,
	start: SegmentCaretContext,
	end: SegmentCaretContext,
): DateSegments {
	const next = cloneSegments(segments);
	next.preferStream = false;
	const order: SegmentKey[] = ["year", "month", "day"];
	const startIndex = order.indexOf(start.segment);
	const endIndex = order.indexOf(end.segment);

	for (let index = startIndex; index <= endIndex; index += 1) {
		const key = order[index] ?? "year";
		const value = next[key];

		if (index === startIndex && index === endIndex) {
			const wasComplete = value.length === segmentMaxLength(key);
			const isSingleChar = end.offset === start.offset + 1;
			const isMidSelection = isSingleChar && end.offset < value.length;

			next[key] = value.slice(0, start.offset) + value.slice(end.offset);

			if (wasComplete && isMidSelection) {
				next.gapAt = { segment: key, offset: start.offset };
			} else {
				next.gapAt = null;
			}

			continue;
		}

		if (index === startIndex) {
			next[key] = value.slice(0, start.offset);
			continue;
		}

		if (index === endIndex) {
			next[key] = value.slice(end.offset);
			continue;
		}

		next[key] = "";
	}

	if (start.segment !== end.segment) {
		next.gapAt = null;
	}

	// Keep open slots when a segment is cleared but siblings remain.
	if (next.month === "" && (next.day !== "" || next.openDay)) {
		next.openMonth = true;
	}

	if (next.day === "" && segments.openDay) {
		next.openDay = true;
	}

	if (isSegmentsEmpty(next)) {
		return emptyDateSegments();
	}

	return withSegmentFlags(next);
}

function deleteBackwardInSegment(
	segments: DateSegments,
	context: SegmentCaretContext,
): DateSegments {
	const next = cloneSegments(segments);
	const { segment, offset } = context;
	const value = next[segment];

	if (offset > 0) {
		const deleteIndex = offset - 1;
		const wasComplete = value.length === segmentMaxLength(segment);
		const isEndDelete = deleteIndex === value.length - 1;

		next[segment] = value.slice(0, deleteIndex) + value.slice(deleteIndex + 1);

		if (wasComplete && !isEndDelete) {
			next.gapAt = { segment, offset: deleteIndex };
			next.preferStream = false;
		} else {
			next.gapAt = null;
			/* End-delete while continuous streaming：keep preferStream（Backspace 後續打） */
			next.preferStream = Boolean(segments.preferStream && isEndDelete);
		}
	} else if (segment === "month") {
		next.month = "";
		next.openMonth = true;
		next.gapAt = null;
		next.preferStream = false;
	} else if (segment === "day") {
		next.day = "";
		next.openDay = true;
		next.openMonth = true;
		next.gapAt = null;
		next.preferStream = false;
	}

	if (isSegmentsEmpty(next)) {
		return emptyDateSegments();
	}

	return withSegmentFlags(next);
}

function deleteForwardInSegment(
	segments: DateSegments,
	context: SegmentCaretContext,
): DateSegments {
	const next = cloneSegments(segments);
	next.preferStream = false;
	const { segment, offset } = context;
	const value = next[segment];

	if (offset < value.length) {
		const wasComplete = value.length === segmentMaxLength(segment);
		const isEndDelete = offset === value.length - 1;

		next[segment] = value.slice(0, offset) + value.slice(offset + 1);

		if (wasComplete && !isEndDelete) {
			next.gapAt = { segment, offset };
		} else {
			next.gapAt = null;
		}
	} else if (segment === "year" && next.month.length > 0) {
		next.month = next.month.slice(1);
		next.openMonth = true;
		next.gapAt = null;
	} else if (segment === "month" && next.day.length > 0) {
		next.day = next.day.slice(1);
		next.openDay = true;
		next.openMonth = true;
		next.gapAt = null;
	}

	if (isSegmentsEmpty(next)) {
		return emptyDateSegments();
	}

	return withSegmentFlags(next);
}

export function segmentsFromPastedText(text: string): DateSegments {
	const trimmed = text.trim();

	if (!trimmed) {
		return emptyDateSegments();
	}

	// Slash / dash: respect user segments — do not apply 6/7/8 pure-digit inference.
	const delimited = trimmed.includes("/")
		? trimmed.split(/\s*\/\s*/).filter((part) => part.length > 0)
		: trimmed.includes("-")
			? trimmed.split(/\s*-\s*/).filter((part) => part.length > 0)
			: null;

	if (delimited && delimited.length === 3) {
		return withSegmentFlags({
			year: extractDateDigits(delimited[0] ?? "").slice(0, 4),
			month: extractDateDigits(delimited[1] ?? "").slice(0, 2),
			day: extractDateDigits(delimited[2] ?? "").slice(0, 2),
			preferStream: false,
		});
	}

	const digits = extractDateDigits(trimmed);

	if (digits.length > 0) {
		return segmentsFromStreamDigits(digits);
	}

	return emptyDateSegments();
}

/**
 * Desktop whole-range paste：從文字抽出兩個完整 date token。
 * 不用「看到 dash 就 split」，避免單一 ISO date（2026-07-08）被誤拆。
 * 找不到兩個 token 時回傳 null → 維持單欄 paste。
 */
const DATE_RANGE_TOKEN_RE = /\d{4}[/-]\d{1,2}[/-]\d{1,2}|\d{6,8}/g;

export function extractDateRangeTokens(text: string): [string, string] | null {
	const trimmed = text.trim();

	if (!trimmed) {
		return null;
	}

	const tokens: string[] = [];
	DATE_RANGE_TOKEN_RE.lastIndex = 0;
	let match: RegExpExecArray | null;

	while ((match = DATE_RANGE_TOKEN_RE.exec(trimmed)) !== null) {
		tokens.push(match[0]);

		if (tokens.length >= 2) {
			break;
		}
	}

	if (tokens.length < 2) {
		return null;
	}

	return [tokens[0]!, tokens[1]!];
}

export function parseDateRangePaste(
	text: string,
): { from: DateSegments; to: DateSegments } | null {
	const tokens = extractDateRangeTokens(text);

	if (!tokens) {
		return null;
	}

	return {
		from: segmentsFromPastedText(tokens[0]),
		to: segmentsFromPastedText(tokens[1]),
	};
}

/**
 * Split month/day after a 4-digit year for continuous digit streams.
 *
 * Length rules (rest = digits after YYYY):
 * - 1: month only（若首碼為 1，等待第二碼再決定 10/11/12）
 * - 2: 10/11/12／01–09 → month only；其餘 → M/D
 * - 3 (7 total): calendar-aware M/DD vs MM/D（10–12 優先作 month）
 * - 4 (8 total): YYYY / MM / DD
 */
export function splitMonthDayDigits(
	rest: string,
	_year: number,
): { month: string; day: string } {
	const digits = rest.slice(0, 4);

	if (!digits) {
		return { month: "", day: "" };
	}

	if (digits.length === 1) {
		return { month: digits, day: "" };
	}

	// 6-digit stream（rest length 2）
	if (digits.length === 2) {
		const twoDigitMonth = Number(digits);
		// 01–09／10–12：先完成 month，不把第二碼提前當 day
		if (
			(digits[0] === "0" && twoDigitMonth >= 1 && twoDigitMonth <= 9) ||
			(twoDigitMonth >= 10 && twoDigitMonth <= 12)
		) {
			return { month: digits, day: "" };
		}
		// 13–19／2x–9x：一位月 + 一位日
		return {
			month: digits[0] ?? "",
			day: digits[1] ?? "",
		};
	}

	// 8-digit stream: always two-digit month + two-digit day
	if (digits.length >= 4) {
		return {
			month: digits.slice(0, 2),
			day: digits.slice(2, 4),
		};
	}

	// 7-digit stream: infer M/DD vs MM/D
	const first = digits[0] ?? "";

	if (first === "0") {
		return {
			month: digits.slice(0, 2),
			day: digits.slice(2),
		};
	}

	if (first >= "2" && first <= "9") {
		return {
			month: first,
			day: digits.slice(1),
		};
	}

	/* first === "1"：優先 10–12 作 month（即使 day 尚不完整／無效） */
	const twoDigitMonth = Number(digits.slice(0, 2));
	if (twoDigitMonth >= 10 && twoDigitMonth <= 12) {
		return {
			month: digits.slice(0, 2),
			day: digits.slice(2),
		};
	}

	return {
		month: "1",
		day: digits.slice(1),
	};
}

export function segmentsFromStreamDigits(digits: string): DateSegments {
	const value = digits.slice(0, 8);
	const year = value.slice(0, 4);
	const rest = value.slice(4);

	if (!rest) {
		return withSegmentFlags({ year, month: "", day: "", preferStream: true });
	}

	const yearNumber = Number(year);
	const { month, day } = splitMonthDayDigits(rest, yearNumber);

	return withSegmentFlags({ year, month, day, preferStream: true });
}

export function applySegmentInputChange(
	segments: DateSegments,
	inputType: string,
	data: string | null,
	selectionStart: number,
	selectionEnd: number,
): { segments: DateSegments; caret: number } {
	if (
		inputType === "insertFromPaste" ||
		inputType === "insertReplacementText" ||
		inputType === "clearAll"
	) {
		const next =
			inputType === "clearAll"
				? emptyDateSegments()
				: segmentsFromPastedText(data ?? "");

		return {
			segments: next,
			caret: formatSegmentsDisplay(next).length,
		};
	}

	if (inputType === "insertText" && data && /^[/-]$/.test(data)) {
		const next = applyDelimiterAdvance(segments);
		let activeSegment: SegmentKey = "month";

		if (next.openDay || next.day !== "") {
			activeSegment = "day";
		} else if (next.openMonth || next.month !== "") {
			activeSegment = "month";
		}

		return {
			segments: next,
			caret: caretForSegmentOffset(next, activeSegment, next[activeSegment].length),
		};
	}

	if (inputType === "insertText" && data && /^\d$/.test(data)) {
		const collapsed = selectionStart === selectionEnd;
		const forward = isForwardAppend(segments, selectionStart) && collapsed;

		if (!collapsed) {
			const start = resolveCaretContext(segments, selectionStart);
			const end = resolveCaretContext(segments, selectionEnd);
			const next = replaceSelectionWithDigit(segments, start, end, data);

			return {
				segments: next,
				caret: caretForSegmentOffset(next, start.segment, start.offset + 1),
			};
		}

		// Continuous raw stream：即使 mobile beforeinput 回報 stale caret，
		// 仍必須整串 re-derive（避免第 5/6 碼鎖死 month →「2026 / 74 /」）。
		// Segment edit 只在 preferStream === false 時依 caret 進行。
		if (segments.preferStream || forward) {
			const context = resolveCaretContext(segments, selectionStart);

			// Continuous stream：即使畫面已顯示 day，仍必須整串 re-stream（修 19991122）。
			// 僅在 segment 模式且 caret 在 day 時，才強制 day append。
			if (!segments.preferStream && context.segment === "day") {
				const next = appendDigitToSegment(
					{ ...segments, openDay: true, preferStream: false },
					"day",
					data,
				);
				return {
					segments: next,
					caret: caretForSegmentOffset(next, "day", next.day.length),
				};
			}

			const next = appendDigitForward(segments, data);
			let activeSegment: SegmentKey = "year";

			if (next.day.length > 0 || next.openDay) {
				activeSegment = "day";
			} else if (next.month.length > 0 || next.openMonth) {
				activeSegment = "month";
			} else {
				activeSegment = "year";
			}

			return {
				segments: next,
				caret: caretForSegmentOffset(next, activeSegment, next[activeSegment].length),
			};
		}

		const context = resolveCaretContext(segments, selectionStart);
		const next = insertDigitInSegment(segments, context.segment, context.offset, data);

		return {
			segments: next,
			caret: caretForSegmentOffset(
				next,
				context.segment,
				Math.min(context.offset + 1, next[context.segment].length),
			),
		};
	}

	if (inputType === "deleteContentBackward") {
		if (selectionStart !== selectionEnd) {
			const start = resolveCaretContext(segments, selectionStart);
			const end = resolveCaretContext(segments, selectionEnd);
			const next = deleteSegmentRange(segments, start, end);

			return {
				segments: next,
				caret: caretForSegmentOffset(next, start.segment, start.offset),
			};
		}

		if (selectionStart === 0) {
			return { segments, caret: 0 };
		}

		const formatted = formatSegmentsDisplay(segments);
		const beforeCaret = formatted.slice(0, selectionStart);

		if (beforeCaret.endsWith(" / ")) {
			const context =
				beforeCaret.length === segments.year.length + 3
					? { segment: "year" as SegmentKey, offset: segments.year.length }
					: { segment: "month" as SegmentKey, offset: segments.month.length };

			return {
				segments,
				caret: caretForSegmentOffset(segments, context.segment, context.offset),
			};
		}

		const context = resolveCaretContext(segments, selectionStart);
		let deleteContext = context;

		if (context.offset === 0) {
			if (context.segment === "day") {
				deleteContext = { segment: "month", offset: segments.month.length };
			} else if (context.segment === "month") {
				deleteContext = { segment: "year", offset: segments.year.length };
			}
		}

		const next = deleteBackwardInSegment(segments, deleteContext);

		return {
			segments: next,
			caret: caretForSegmentOffset(
				next,
				deleteContext.segment,
				Math.max(0, deleteContext.offset - (deleteContext.offset > 0 ? 1 : 0)),
			),
		};
	}

	if (inputType === "deleteContentForward") {
		if (selectionStart !== selectionEnd) {
			const start = resolveCaretContext(segments, selectionStart);
			const end = resolveCaretContext(segments, selectionEnd);
			const next = deleteSegmentRange(segments, start, end);

			return {
				segments: next,
				caret: caretForSegmentOffset(next, start.segment, start.offset),
			};
		}

		const formatted = formatSegmentsDisplay(segments);
		const afterCaret = formatted.slice(selectionStart);

		if (afterCaret.startsWith(" / ")) {
			const context =
				selectionStart === segments.year.length
					? { segment: "month" as SegmentKey, offset: 0 }
					: { segment: "day" as SegmentKey, offset: 0 };

			return {
				segments,
				caret: caretForSegmentOffset(segments, context.segment, context.offset),
			};
		}

		const context = resolveCaretContext(segments, selectionStart);
		const next = deleteForwardInSegment(segments, context);

		return {
			segments: next,
			caret: caretForSegmentOffset(next, context.segment, context.offset),
		};
	}

	return {
		segments,
		caret: selectionStart,
	};
}

export type FieldStatus = "empty" | "incomplete" | "valid" | "invalid";

export function compareCalendarDates(a: CalendarDate, b: CalendarDate): number {
	if (a.year !== b.year) return a.year - b.year;
	if (a.month !== b.month) return a.month - b.month;
	return a.day - b.day;
}

export function calendarDatesEqual(a: CalendarDate, b: CalendarDate): boolean {
	return compareCalendarDates(a, b) === 0;
}

export function isDateInAllowedRange(date: CalendarDate): boolean {
	if (!isValidCalendarDate(date.year, date.month, date.day)) {
		return false;
	}
	if (date.year < MIN_DATE_YEAR || date.year > MAX_DATE_YEAR) {
		return false;
	}
	return true;
}

export function segmentsFromCalendarDate(date: CalendarDate): DateSegments {
	return withSegmentFlags({
		year: String(date.year).padStart(4, "0"),
		month: String(date.month).padStart(2, "0"),
		day: String(date.day).padStart(2, "0"),
		preferStream: false,
	});
}

export function parseDateSegments(segments: DateSegments): CalendarDate | null {
	if (!isSegmentsComplete(segments)) {
		return null;
	}

	const year = Number(segments.year);
	const month = Number(segments.month);
	const day = Number(segments.day);

	if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
		return null;
	}

	if (!isValidCalendarDate(year, month, day)) {
		return null;
	}

	const date = { year, month, day };
	if (!isDateInAllowedRange(date)) {
		return null;
	}

	return date;
}

export function resolveFieldStatus(segments: DateSegments): FieldStatus {
	if (isSegmentsEmpty(segments)) {
		return "empty";
	}
	if (!isSegmentsComplete(segments)) {
		return "incomplete";
	}
	return parseDateSegments(segments) ? "valid" : "invalid";
}

/** Compact display for mobile capsule: YYYY/MM/DD */
export function formatCalendarDateCompact(date: CalendarDate): string {
	const y = String(date.year).padStart(4, "0");
	const m = String(date.month).padStart(2, "0");
	const d = String(date.day).padStart(2, "0");
	return `${y}/${m}/${d}`;
}

export function formatDateRangeCompact(from: CalendarDate, to: CalendarDate): string {
	return `${formatCalendarDateCompact(from)} — ${formatCalendarDateCompact(to)}`;
}

/** Parse raw typed/pasted text into segments (for tests / one-shot parse). */
export function parseDateInputText(text: string): {
	segments: DateSegments;
	status: FieldStatus;
	date: CalendarDate | null;
} {
	const segments = segmentsFromPastedText(text);
	const status = resolveFieldStatus(segments);
	return {
		segments,
		status,
		date: status === "valid" ? parseDateSegments(segments) : null,
	};
}

/* ------------------------------------------------------------------ */
/* BDC 專屬（B2A）：反向自動交換 + Mobile Y/M/D helpers                */
/* ------------------------------------------------------------------ */

export type OrderedRange = {
	start: CalendarDate;
	end: CalendarDate;
	/** true = 輸入為反向（結束早於開始），已交換為較早 → 較晚 */
	swapped: boolean;
};

/**
 * 只在兩個日期皆 complete valid 時回傳已排序區間；
 * empty／incomplete／complete invalid 一律回傳 null（不交換、不出結果）。
 */
export function resolveOrderedRange(
	from: DateSegments,
	to: DateSegments,
): OrderedRange | null {
	if (resolveFieldStatus(from) !== "valid" || resolveFieldStatus(to) !== "valid") {
		return null;
	}

	const fromDate = parseDateSegments(from);
	const toDate = parseDateSegments(to);

	if (!fromDate || !toDate) {
		return null;
	}

	if (compareCalendarDates(fromDate, toDate) > 0) {
		return { start: toDate, end: fromDate, swapped: true };
	}

	return { start: fromDate, end: toDate, swapped: false };
}

/** Mobile sheet Y/M/D 欄位值 → segments（segment 模式，不套 6/7/8 推斷）。 */
export function segmentsFromParts(
	year: string,
	month: string,
	day: string,
): DateSegments {
	return {
		year,
		month,
		day,
		openMonth: month !== "" || day !== "",
		openDay: day !== "",
		gapAt: null,
		preferStream: false,
	};
}

/** 只留數字並截斷至欄位上限。 */
export function digitsOnly(value: string, maxLength: number): string {
	return value.replace(/\D/g, "").slice(0, maxLength);
}

/** Mobile Year auto-advance：滿 4 位。 */
export function shouldAutoAdvanceMobileYear(yearDigits: string): boolean {
	return /^\d{4}$/.test(yearDigits);
}

/**
 * Mobile Month auto-advance：
 * - 2 位 → advance
 * - 單一位 2–9 → 視為一位數月份 advance
 * - 首位 0 或 1 → 等第二位
 */
export function shouldAutoAdvanceMobileMonth(monthDigits: string): boolean {
	if (/^\d{2}$/.test(monthDigits)) {
		return true;
	}

	return /^[2-9]$/.test(monthDigits);
}

/**
 * 同組內 auto-advance 目標欄位。
 * Day 一律回傳 null：Start Day 不得自動跨組跳到 End Year（product-spec §6.3）。
 */
export function mobileAutoAdvanceTarget(field: SegmentKey): SegmentKey | null {
	if (field === "year") {
		return "month";
	}

	if (field === "month") {
		return "day";
	}

	return null;
}

/**
 * Mobile 逐欄 invalid（僅 complete 後判斷；incomplete 回傳 []）。
 * Year：4 位且 1900–2100；Month：01–12；Day：存在於該年月。
 */
export function resolveInvalidDateFields(segments: DateSegments): SegmentKey[] {
	if (!isSegmentsComplete(segments)) {
		return [];
	}

	const fields: SegmentKey[] = [];
	const year = Number(segments.year);
	const month = Number(segments.month);
	const day = Number(segments.day);

	const yearInvalid =
		segments.year.length !== 4 ||
		!Number.isInteger(year) ||
		year < MIN_DATE_YEAR ||
		year > MAX_DATE_YEAR;
	const monthInvalid = !Number.isInteger(month) || month < 1 || month > 12;
	const dayOutOfRange = !Number.isInteger(day) || day < 1 || day > 31;

	if (yearInvalid) {
		fields.push("year");
	}

	if (monthInvalid) {
		fields.push("month");
	}

	if (dayOutOfRange) {
		fields.push("day");
	} else if (!monthInvalid && !isValidCalendarDate(year, month, day)) {
		fields.push("day");
	}

	return fields;
}
