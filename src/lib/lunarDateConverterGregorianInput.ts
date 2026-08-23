/**
 * Lunar Date Converter — Gregorian Smart Date Input（tool-local）.
 * Reuses DBD segment engine; public range 1901–2099 only.
 */
import type { CivilDate } from "./lunar/lunarTypes.ts";
import { LUNAR_PUBLIC_YEAR_MAX, LUNAR_PUBLIC_YEAR_MIN } from "./lunar/lunarTypes.ts";
import { civilToDayNumber, isValidCivilDate } from "./lunar/lunarCivil.ts";
import {
	applySegmentInputChange,
	caretForSegmentOffset,
	countStreamDigits,
	emptyDateSegments,
	formatSegmentsDisplay,
	formatSegmentsNormalized,
	isSegmentsComplete,
	isSegmentsEmpty,
	isValidCalendarDate,
	normalizeSegmentsForBlur,
	resolveCaretContext,
	segmentsFromCalendarDate,
	segmentsFromPastedText,
	type CalendarDate,
	type DateSegments,
	type FieldStatus,
	type SegmentCaretContext,
	type SegmentKey,
} from "./daysBetweenDatesDateInput.ts";

export type {
	CalendarDate,
	DateSegments,
	FieldStatus,
	SegmentCaretContext,
	SegmentKey,
};

export {
	applySegmentInputChange,
	caretForSegmentOffset,
	countStreamDigits,
	resolveCaretContext,
};

export type CompositionGuardState = {
	active: boolean;
};

export function createCompositionGuard(): CompositionGuardState {
	return { active: false };
}

export function setCompositionActive(
	state: CompositionGuardState,
	active: boolean,
): void {
	state.active = active;
}

export function shouldDeferInputWhileComposing(state: CompositionGuardState): boolean {
	return state.active;
}

export const MIN_GREGORIAN = {
	year: LUNAR_PUBLIC_YEAR_MIN,
	month: 1,
	day: 1,
} as const;

export const MAX_GREGORIAN = {
	year: LUNAR_PUBLIC_YEAR_MAX,
	month: 12,
	day: 31,
} as const;

const MIN_DAY = civilToDayNumber(MIN_GREGORIAN);
const MAX_DAY = civilToDayNumber(MAX_GREGORIAN);

export function calendarFromCivil(date: CivilDate): CalendarDate {
	return { year: date.year, month: date.month, day: date.day };
}

export function civilFromCalendar(date: CalendarDate): CivilDate {
	return { year: date.year, month: date.month, day: date.day };
}

export function isDateInAllowedRange(date: CalendarDate): boolean {
	if (!isValidCivilDate(date)) {
		return false;
	}
	const n = civilToDayNumber(date);
	return n >= MIN_DAY && n <= MAX_DAY;
}

export function parseDateSegments(segments: DateSegments): CalendarDate | null {
	if (!isSegmentsComplete(segments)) {
		return null;
	}

	const year = Number(segments.year);
	const month = Number(segments.month);
	const day = Number(segments.day);

	if (
		!Number.isInteger(year) ||
		!Number.isInteger(month) ||
		!Number.isInteger(day) ||
		!isValidCalendarDate(year, month, day)
	) {
		return null;
	}

	const date = { year, month, day };
	return isDateInAllowedRange(date) ? date : null;
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

/** Desktop field error presentation when segments are complete but invalid. */
export type GregorianInvalidKind = "invalid-date" | "out-of-range";

export function classifyGregorianInvalid(segments: DateSegments): GregorianInvalidKind {
	const year = Number(segments.year);
	const month = Number(segments.month);
	const day = Number(segments.day);

	if (!isValidCalendarDate(year, month, day)) {
		return "invalid-date";
	}

	return "out-of-range";
}

export type GregorianFieldSnapshot = {
	status: FieldStatus;
	date: CivilDate | null;
	display: string;
	normalizedDisplay: string;
	segments: DateSegments;
};

export type GregorianChangeHandler = (snapshot: GregorianFieldSnapshot) => void;

function snapshotFromSegments(
	segments: DateSegments,
	normalized: boolean,
): GregorianFieldSnapshot {
	const status = resolveFieldStatus(segments);
	const parsed = status === "valid" ? parseDateSegments(segments) : null;
	const display = normalized
		? formatSegmentsNormalized(segments)
		: formatSegmentsDisplay(segments);

	return {
		status,
		date: parsed ? civilFromCalendar(parsed) : null,
		display,
		normalizedDisplay: formatSegmentsNormalized(segments),
		segments: { ...segments },
	};
}

export type LunarGregorianDateController = {
	getSnapshot: () => GregorianFieldSnapshot;
	setDate: (date: CivilDate) => GregorianFieldSnapshot;
	clear: () => GregorianFieldSnapshot;
	applyInputChange: (
		inputType: string,
		data: string | null,
		selectionStart: number,
		selectionEnd: number,
	) => { snapshot: GregorianFieldSnapshot; caret: number };
	applyPaste: (text: string) => { snapshot: GregorianFieldSnapshot; caret: number };
	commitNormalize: () => GregorianFieldSnapshot;
	destroy: () => void;
};

export function createGregorianDateController(options?: {
	onChange?: GregorianChangeHandler;
}): LunarGregorianDateController {
	let segments = emptyDateSegments();
	let destroyed = false;
	const onChange = options?.onChange;

	const emit = (normalized: boolean): GregorianFieldSnapshot => {
		const snapshot = snapshotFromSegments(segments, normalized);
		if (!destroyed) {
			onChange?.(snapshot);
		}
		return snapshot;
	};

	return {
		getSnapshot: () => snapshotFromSegments(segments, false),

		setDate: (date: CivilDate) => {
			if (destroyed || !isDateInAllowedRange(calendarFromCivil(date))) {
				return snapshotFromSegments(segments, true);
			}
			segments = segmentsFromCalendarDate(calendarFromCivil(date));
			return emit(true);
		},

		clear: () => {
			if (destroyed) {
				return snapshotFromSegments(segments, true);
			}
			segments = emptyDateSegments();
			return emit(true);
		},

		applyInputChange: (inputType, data, selectionStart, selectionEnd) => {
			if (destroyed) {
				return { snapshot: snapshotFromSegments(segments, false), caret: 0 };
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
			// Continuous raw stream：DOM caret 可能落後 1～2 碼；typing 時以 display 尾端為 SSOT（BDC production pattern）
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
				return { snapshot: snapshotFromSegments(segments, false), caret: 0 };
			}
			segments = segmentsFromPastedText(text);
			const snapshot = emit(false);
			return { snapshot, caret: formatSegmentsDisplay(segments).length };
		},

		commitNormalize: () => {
			if (destroyed) {
				return snapshotFromSegments(segments, true);
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
