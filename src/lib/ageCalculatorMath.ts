import {
	daysBetweenLocalDates,
	isLeapYear,
	localDateOrdinal,
} from "./yearProgressMath.ts";

export type CalendarDate = {
	year: number;
	month: number;
	day: number;
};

export type AgeResult = {
	completedYears: number;
	months: number;
	days: number;
	daysLived: number;
};

export type AgeCalculationOutcome =
	| { status: "ok"; result: AgeResult }
	| { status: "future" }
	| { status: "invalid" };

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
};

export type SegmentKey = "year" | "month" | "day";

export type SegmentCaretContext = {
	segment: SegmentKey;
	offset: number;
};

export const MIN_BIRTH_YEAR = 1900;

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

export function isValidBirthDate(
	year: number,
	month: number,
	day: number,
	today: CalendarDate = getTodayCalendarDate(),
): boolean {
	if (!isValidCalendarDate(year, month, day)) {
		return false;
	}

	if (year < MIN_BIRTH_YEAR || year > today.year) {
		return false;
	}

	return true;
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
	segments: Omit<DateSegments, "openMonth" | "openDay" | "gapAt"> &
		Partial<Pick<DateSegments, "openMonth" | "openDay" | "gapAt">>,
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
		});
	}

	const stream = `${segments.year}${segments.month}${segments.day}${digit}`.slice(0, 8);
	return segmentsFromStreamDigits(stream);
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
		} else {
			next.gapAt = null;
		}
	} else if (segment === "month") {
		next.month = "";
		next.openMonth = true;
		next.gapAt = null;
	} else if (segment === "day") {
		next.day = "";
		next.openDay = true;
		next.openMonth = true;
		next.gapAt = null;
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

	const slashParts = trimmed.split(/\s*\/\s*/).filter((part) => part.length > 0);

	if (slashParts.length === 3) {
		return withSegmentFlags({
			year: extractDateDigits(slashParts[0] ?? "").slice(0, 4),
			month: extractDateDigits(slashParts[1] ?? "").slice(0, 2),
			day: extractDateDigits(slashParts[2] ?? "").slice(0, 2),
		});
	}

	const digits = extractDateDigits(trimmed);

	if (digits.length > 0) {
		return segmentsFromStreamDigits(digits);
	}

	return emptyDateSegments();
}

/**
 * Split month/day after a 4-digit year for continuous digit streams.
 *
 * Length rules (rest = digits after YYYY):
 * - 1: month only
 * - 2 (6 total): YYYY / M / D
 * - 3 (7 total): calendar-aware M/DD vs MM/D
 * - 4 (8 total): YYYY / MM / DD
 */
export function splitMonthDayDigits(
	rest: string,
	year: number,
): { month: string; day: string } {
	const digits = rest.slice(0, 4);

	if (!digits) {
		return { month: "", day: "" };
	}

	if (digits.length === 1) {
		return { month: digits, day: "" };
	}

	// 6-digit stream: always one-digit month + one-digit day
	if (digits.length === 2) {
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

	// first === "1" → prefer valid MM/D (10–12) when possible, else M/DD
	const twoDigitMonth = Number(digits.slice(0, 2));

	if (twoDigitMonth >= 10 && twoDigitMonth <= 12) {
		const month = digits.slice(0, 2);
		const day = digits.slice(2);
		const dayNum = Number(day);

		if (dayNum >= 1 && dayNum <= daysInMonth(year, twoDigitMonth)) {
			return { month, day };
		}
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
		return withSegmentFlags({ year, month: "", day: "" });
	}

	const yearNumber = Number(year);
	const { month, day } = splitMonthDayDigits(rest, yearNumber);

	return withSegmentFlags({ year, month, day });
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

	if (inputType === "insertText" && data && /^\d$/.test(data)) {
		const forward = isForwardAppend(segments, selectionStart) && selectionStart === selectionEnd;

		if (selectionStart !== selectionEnd) {
			const start = resolveCaretContext(segments, selectionStart);
			const end = resolveCaretContext(segments, selectionEnd);
			const next = replaceSelectionWithDigit(segments, start, end, data);

			return {
				segments: next,
				caret: caretForSegmentOffset(next, start.segment, start.offset + 1),
			};
		}

		if (forward) {
			const next = appendDigitForward(segments, data);
			let activeSegment: SegmentKey = "year";

			if (next.day.length > 0) {
				activeSegment = "day";
			} else if (next.month.length > 0) {
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

export function parseBirthDateSegments(
	segments: DateSegments,
	today: CalendarDate = getTodayCalendarDate(),
): CalendarDate | null {
	if (!isSegmentsComplete(segments)) {
		return null;
	}

	const year = Number(segments.year);
	const month = Number(segments.month);
	const day = Number(segments.day);

	if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
		return null;
	}

	if (!isValidBirthDate(year, month, day, today)) {
		return null;
	}

	if (compareCalendarDates({ year, month, day }, today) > 0) {
		return null;
	}

	return { year, month, day };
}

export type InvalidBirthField = "year" | "month" | "day";

/**
 * Mobile: every invalid field can show its own icon at once.
 * Incomplete dates return [] (no icons).
 */
export function resolveInvalidBirthFields(
	segments: DateSegments,
	today: CalendarDate = getTodayCalendarDate(),
): InvalidBirthField[] {
	if (!isSegmentsComplete(segments)) {
		return [];
	}

	const fields: InvalidBirthField[] = [];
	const year = Number(segments.year);
	const month = Number(segments.month);
	const day = Number(segments.day);

	const yearInvalid =
		segments.year.length !== 4 ||
		!Number.isInteger(year) ||
		year < MIN_BIRTH_YEAR ||
		year > today.year;
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
	} else if (!monthInvalid) {
		if (!isValidCalendarDate(year, month, day)) {
			fields.push("day");
		} else if (
			!yearInvalid &&
			compareCalendarDates({ year, month, day }, today) > 0
		) {
			fields.push("day");
		}
	}

	return fields;
}

/** First invalid field — used by desktop single-icon UI. */
export function resolveInvalidBirthField(
	segments: DateSegments,
	today: CalendarDate = getTodayCalendarDate(),
): InvalidBirthField | null {
	return resolveInvalidBirthFields(segments, today)[0] ?? null;
}

/** Mobile Year auto-advance: full 4 digits. */
export function shouldAutoAdvanceMobileYear(yearDigits: string): boolean {
	return /^\d{4}$/.test(yearDigits);
}

/**
 * Mobile Month auto-advance:
 * - 2 digits → advance
 * - single digit 2–9 → advance as one-digit month
 * - leading 0 or 1 → wait for second digit
 */
export function shouldAutoAdvanceMobileMonth(monthDigits: string): boolean {
	if (/^\d{2}$/.test(monthDigits)) {
		return true;
	}

	return /^[2-9]$/.test(monthDigits);
}

export function compareCalendarDates(
	a: CalendarDate,
	b: CalendarDate,
): number {
	return (
		localDateOrdinal(a.year, a.month - 1, a.day) -
		localDateOrdinal(b.year, b.month - 1, b.day)
	);
}

/** Feb 29 birthdays use Mar 1 in non-leap years. */
export function birthdayInYear(
	birth: CalendarDate,
	year: number,
): CalendarDate {
	if (birth.month === 2 && birth.day === 29) {
		if (isLeapYear(year)) {
			return { year, month: 2, day: 29 };
		}

		return { year, month: 3, day: 1 };
	}

	const maxDay = daysInMonth(year, birth.month);

	return {
		year,
		month: birth.month,
		day: Math.min(birth.day, maxDay),
	};
}

export function addCalendarMonths(
	date: CalendarDate,
	months: number,
): CalendarDate {
	const totalMonths = date.month - 1 + months;
	const year = date.year + Math.floor(totalMonths / 12);
	const monthIndex = ((totalMonths % 12) + 12) % 12;
	const month = monthIndex + 1;
	const maxDay = daysInMonth(year, month);

	return {
		year,
		month,
		day: Math.min(date.day, maxDay),
	};
}

function completedYears(birth: CalendarDate, asOf: CalendarDate): number {
	let years = asOf.year - birth.year;
	const anniversary = birthdayInYear(birth, asOf.year);

	if (compareCalendarDates(asOf, anniversary) < 0) {
		years -= 1;
	}

	return Math.max(0, years);
}

export function calculateAge(
	birth: CalendarDate,
	asOf: CalendarDate,
): AgeCalculationOutcome {
	if (compareCalendarDates(birth, asOf) > 0) {
		return { status: "future" };
	}

	const years = completedYears(birth, asOf);
	const anniversary = birthdayInYear(birth, birth.year + years);

	let cursor = anniversary;
	let months = 0;

	while (true) {
		const next = addCalendarMonths(cursor, 1);

		if (compareCalendarDates(next, asOf) > 0) {
			break;
		}

		months += 1;
		cursor = next;
	}

	const days = daysBetweenLocalDates(
		cursor.year,
		cursor.month - 1,
		cursor.day,
		asOf.year,
		asOf.month - 1,
		asOf.day,
	);

	const daysLived = daysBetweenLocalDates(
		birth.year,
		birth.month - 1,
		birth.day,
		asOf.year,
		asOf.month - 1,
		asOf.day,
	);

	return {
		status: "ok",
		result: {
			completedYears: years,
			months,
			days,
			daysLived,
		},
	};
}

export function getTodayCalendarDate(now = new Date()): CalendarDate {
	return {
		year: now.getFullYear(),
		month: now.getMonth() + 1,
		day: now.getDate(),
	};
}
