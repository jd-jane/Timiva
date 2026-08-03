/**
 * Date Calculator — thin Smart Date Input adapter (B2.2).
 *
 * Reuses the Days Between Dates segment／parser engine as production source of truth.
 * Only overrides the supported civil range to 1900-01-01 … 2200-12-31 (product spec).
 * Does not copy the DBD／BDC／Age parser family and does not change those tools.
 *
 * No ResultSummary、duration、Calendar、or Mobile wiring in this module.
 */
import type { CivilDate } from "./dateCalculatorMath.ts";
import {
	DATE_CALCULATOR_MAX,
	DATE_CALCULATOR_MIN,
	isValidSupportedStartDate,
} from "./dateCalculatorMath.ts";
import {
	applySegmentInputChange,
	emptyDateSegments,
	extractDateDigits,
	formatCalendarDateCompact,
	formatSegmentsDisplay,
	formatSegmentsNormalized,
	isSegmentsComplete,
	isSegmentsEmpty,
	isValidCalendarDate,
	normalizeSegmentsForBlur,
	segmentsFromCalendarDate,
	segmentsFromPastedText,
	segmentsFromStreamDigits,
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
	emptyDateSegments,
	extractDateDigits,
	formatCalendarDateCompact,
	formatSegmentsDisplay,
	formatSegmentsNormalized,
	isSegmentsComplete,
	isSegmentsEmpty,
	isValidCalendarDate,
	normalizeSegmentsForBlur,
	segmentsFromCalendarDate,
	segmentsFromPastedText,
	segmentsFromStreamDigits,
};

/** Re-export caret helpers used by DOM binding（same DBD engine）. */
export {
	caretForSegmentOffset,
	countStreamDigits,
	resolveCaretContext,
} from "./daysBetweenDatesDateInput.ts";

export const MIN_DATE_YEAR = DATE_CALCULATOR_MIN.year;
export const MAX_DATE_YEAR = DATE_CALCULATOR_MAX.year;

export function civilFromCalendarDate(date: CalendarDate): CivilDate {
	return { year: date.year, month: date.month, day: date.day };
}

export function calendarFromCivilDate(date: CivilDate): CalendarDate {
	return { year: date.year, month: date.month, day: date.day };
}

/** DC range: 1900-01-01 … 2200-12-31（delegates Gregorian＋bounds to B2.1 math）. */
export function isDateInAllowedRange(date: CalendarDate): boolean {
	return isValidSupportedStartDate(date);
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
		!Number.isInteger(day)
	) {
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

/**
 * Desktop completion helper（DC has a single date field — no auto-focus target）.
 * Same contract as DBD, but status uses DC 2200 range.
 */
export function isEntryCompleteForCommit(
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
		return `${segments.year}${segments.month}${segments.day}`.length >= 8;
	}

	return true;
}

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

export type StartDateFieldSnapshot = {
	status: FieldStatus;
	date: CivilDate | null;
	display: string;
	normalizedDisplay: string;
	segments: DateSegments;
};

export type StartDateChangeHandler = (snapshot: StartDateFieldSnapshot) => void;

export type CompositionGuardState = {
	composing: boolean;
};

export function createCompositionGuard(): CompositionGuardState {
	return { composing: false };
}

export function setCompositionActive(
	guard: CompositionGuardState,
	active: boolean,
): void {
	guard.composing = active;
}

/** While composing, DOM must not rewrite value／caret. */
export function shouldDeferInputWhileComposing(
	guard: CompositionGuardState,
): boolean {
	return guard.composing;
}

function snapshotFromSegments(
	segments: DateSegments,
	normalized: boolean,
): StartDateFieldSnapshot {
	const status = resolveFieldStatus(segments);
	const parsed = status === "valid" ? parseDateSegments(segments) : null;
	const display = normalized
		? formatSegmentsNormalized(segments)
		: formatSegmentsDisplay(segments);

	return {
		status,
		date: parsed ? civilFromCalendarDate(parsed) : null,
		display,
		normalizedDisplay: formatSegmentsNormalized(segments),
		segments: {
			year: segments.year,
			month: segments.month,
			day: segments.day,
			openMonth: segments.openMonth,
			openDay: segments.openDay,
			gapAt: segments.gapAt
				? { segment: segments.gapAt.segment, offset: segments.gapAt.offset }
				: null,
			preferStream: segments.preferStream,
		},
	};
}

/**
 * Pure start-date field controller — no DOM.
 * Script layer binds one Desktop input; B2.3 can call setDate(CivilDate).
 */
export type DateCalculatorStartDateController = {
	getSnapshot: () => StartDateFieldSnapshot;
	setDate: (date: CivilDate) => StartDateFieldSnapshot;
	clear: () => StartDateFieldSnapshot;
	applyInputChange: (
		inputType: string,
		data: string | null,
		selectionStart: number,
		selectionEnd: number,
	) => { snapshot: StartDateFieldSnapshot; caret: number };
	applyPaste: (text: string) => { snapshot: StartDateFieldSnapshot; caret: number };
	commitNormalize: () => StartDateFieldSnapshot;
	destroy: () => void;
};

export function createStartDateController(options?: {
	onChange?: StartDateChangeHandler;
}): DateCalculatorStartDateController {
	let segments = emptyDateSegments();
	let destroyed = false;
	const onChange = options?.onChange;

	const emit = (normalized: boolean): StartDateFieldSnapshot => {
		const snapshot = snapshotFromSegments(segments, normalized);
		if (!destroyed) {
			onChange?.(snapshot);
		}
		return snapshot;
	};

	return {
		getSnapshot: () => snapshotFromSegments(segments, false),

		setDate: (date: CivilDate) => {
			if (destroyed) {
				return snapshotFromSegments(segments, true);
			}
			if (!isValidSupportedStartDate(date)) {
				segments = emptyDateSegments();
				return emit(true);
			}
			segments = segmentsFromCalendarDate(calendarFromCivilDate(date));
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
				return {
					snapshot: snapshotFromSegments(segments, false),
					caret: 0,
				};
			}

			const formatted = formatSegmentsDisplay(segments);
			const isFullSelection =
				formatted.length > 0 &&
				selectionStart === 0 &&
				selectionEnd >= formatted.length;
			const resolvedInputType =
				isFullSelection &&
				(inputType === "deleteContentBackward" ||
					inputType === "deleteContentForward")
					? "clearAll"
					: inputType;

			const result = applySegmentInputChange(
				segments,
				resolvedInputType,
				data,
				selectionStart,
				selectionEnd,
			);
			segments = result.segments;
			return {
				snapshot: emit(false),
				caret: result.caret,
			};
		},

		applyPaste: (text) => {
			if (destroyed) {
				return {
					snapshot: snapshotFromSegments(segments, false),
					caret: 0,
				};
			}
			segments = segmentsFromPastedText(text);
			const snapshot = emit(false);
			return {
				snapshot,
				caret: formatSegmentsDisplay(segments).length,
			};
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
