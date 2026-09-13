/**
 * TALC AME adapter（B2C Mobile）.
 * lifecycle = live：YMD／leave 變更即時 sync；Done／Escape／underlay 只 dismiss，不 rollback。
 * Y／M／D = shared Numeric Keypad segments（button；無 native input／keyboard）。
 * reopen 保留目前 segments（含 incomplete／invalid）；不清空。
 * LocalStorage 寫入由 page script 僅在 valid 時處理。
 */
import type { LeaveSystem } from "../lib/taiwanAnnualLeaveMath.ts";
import {
	emptyDateSegments,
	resolveFieldStatus,
	resolveInvalidHireFields,
	shouldAutoAdvanceMobileMonth,
	shouldAutoAdvanceMobileYear,
	type DateSegments,
} from "../lib/taiwanAnnualLeaveDateInput.ts";
import type {
	AmeDraftBag,
	AmeNumericFieldConfig,
	AmeValidateResult,
} from "./adaptive-mobile-editor-controller";

export type TalcAmeFieldId = "year" | "month" | "day";

export type TalcAmeDraft = AmeDraftBag & {
	year: string;
	month: string;
	day: string;
	leaveSystem: LeaveSystem;
};

export const TALC_AME_FIELD_IDS: readonly TalcAmeFieldId[] = ["year", "month", "day"];

export const TALC_AME_NUMERIC_FIELDS: readonly AmeNumericFieldConfig[] = [
	{ id: "year", maxLength: 4, allowEmpty: true },
	{ id: "month", maxLength: 2, allowEmpty: true },
	{ id: "day", maxLength: 2, allowEmpty: true },
];

export type TalcAmePending = { type: "advance"; advanceTo: TalcAmeFieldId };

let pendingAction: TalcAmePending | null = null;

export function peekTalcAmePending(): TalcAmePending | null {
	return pendingAction;
}

export function takeTalcAmePending(): TalcAmePending | null {
	const next = pendingAction;
	pendingAction = null;
	return next;
}

export function clearTalcAmePending(): void {
	pendingAction = null;
}

export function cloneTalcAmeDraft(source: TalcAmeDraft): TalcAmeDraft {
	return {
		year: source.year,
		month: source.month,
		day: source.day,
		leaveSystem: source.leaveSystem === "calendar-year" ? "calendar-year" : "anniversary",
	};
}

export function draftFromSegments(
	segments: DateSegments,
	leaveSystem: LeaveSystem,
): TalcAmeDraft {
	return {
		year: segments.year,
		month: segments.month,
		day: segments.day,
		leaveSystem,
	};
}

export function segmentsFromDraft(draft: TalcAmeDraft): DateSegments {
	const base = emptyDateSegments();
	return {
		...base,
		year: String(draft.year ?? "")
			.replace(/\D/g, "")
			.slice(0, 4),
		month: String(draft.month ?? "")
			.replace(/\D/g, "")
			.slice(0, 2),
		day: String(draft.day ?? "")
			.replace(/\D/g, "")
			.slice(0, 2),
		openMonth: String(draft.month ?? "") !== "" || String(draft.day ?? "") !== "",
		openDay: String(draft.day ?? "") !== "",
		preferStream: false,
	};
}

export function emptyTalcAmeDraft(): TalcAmeDraft {
	return {
		year: "",
		month: "",
		day: "",
		leaveSystem: "anniversary",
	};
}

export function readTalcAmeField(draft: TalcAmeDraft, id: TalcAmeFieldId): string {
	const value = draft[id];
	return typeof value === "string" ? value : "";
}

/**
 * Keypad digit gate（對齊 date-input mobile auto-advance）。
 * Backspace／Delete 不走此函式 → 不會 auto-advance。
 */
export function acceptTalcAmeNumericCandidate(args: {
	fieldId: string;
	currentValue: string;
	candidateValue: string;
}): boolean {
	pendingAction = null;
	if (!/^\d*$/.test(args.candidateValue)) {
		return false;
	}
	if (args.fieldId === "year") {
		if (shouldAutoAdvanceMobileYear(args.candidateValue)) {
			pendingAction = { type: "advance", advanceTo: "month" };
		}
		return true;
	}
	if (args.fieldId === "month") {
		if (shouldAutoAdvanceMobileMonth(args.candidateValue)) {
			pendingAction = { type: "advance", advanceTo: "day" };
		}
		return true;
	}
	if (args.fieldId === "day") {
		return true;
	}
	return false;
}

export function validateTalcAmeDraft(
	draft: TalcAmeDraft,
	invalidMessage: string,
): AmeValidateResult {
	const segments = segmentsFromDraft(draft);
	const status = resolveFieldStatus(segments);
	if (status === "empty" || status === "incomplete" || status === "valid") {
		return { ok: true };
	}
	const fields = resolveInvalidHireFields(segments);
	const fieldErrors: Record<string, string> = {};
	for (const field of fields) {
		fieldErrors[field] = invalidMessage;
	}
	if (Object.keys(fieldErrors).length === 0) {
		fieldErrors.day = invalidMessage;
	}
	return { ok: false, message: invalidMessage, fieldErrors };
}

export type TalcAmePlaceholders = {
	year: string;
	month: string;
	day: string;
};

export function syncTalcAmeSegmentUi(
	root: HTMLElement,
	draft: TalcAmeDraft,
	placeholders: TalcAmePlaceholders,
): void {
	for (const id of TALC_AME_FIELD_IDS) {
		const value = readTalcAmeField(draft, id);
		const el = root.querySelector<HTMLElement>(
			`[data-ame-numeric-field="${id}"] [data-talc-segment-value]`,
		);
		if (!el) continue;
		if (value === "") {
			el.textContent = placeholders[id];
			el.classList.add("is-placeholder");
		} else {
			el.textContent = value;
			el.classList.remove("is-placeholder");
		}
	}
}

/** Advance／activate segment via shared AME click path（同 Hours）。 */
export function focusTalcAmeField(root: HTMLElement, fieldId: string): void {
	const el = root.querySelector<HTMLButtonElement>(`[data-ame-numeric-field="${fieldId}"]`);
	el?.click();
}
