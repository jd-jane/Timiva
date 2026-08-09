/**
 * Hours Calculator AME adapter（B2B）.
 * 6 numeric fields · HH／MM digit gate · same-group auto-advance · no result calc.
 * Shared AME remains tool-agnostic — do not modify shared AME for Hours.
 */
import type {
	AmeDraftBag,
	AmeNumericFieldConfig,
	AmeValidateResult,
} from "./adaptive-mobile-editor-controller";
import {
	HOURS_AME_FIELD_IDS,
	evaluateHoursSegmentDigit,
	hoursFieldKind,
	hoursGroupHasInvalidSegment,
	parseBreakDurationSegments,
	type HoursAmeFieldId,
} from "../lib/hoursCalculatorSegmentInput";
import { formatTimeOfDay, type BreakParseResult } from "../lib/hoursCalculatorTimeInput";
import {
	parseSegmentPair,
	rangeFromSegmentPairs,
} from "../lib/hoursCalculatorEvaluate";

export type HoursAmeDraft = AmeDraftBag & {
	"start-hh": string;
	"start-mm": string;
	"end-hh": string;
	"end-mm": string;
	"break-hh": string;
	"break-mm": string;
};

export const HOURS_AME_RESET_DEFAULTS: HoursAmeDraft = {
	"start-hh": "",
	"start-mm": "",
	"end-hh": "",
	"end-mm": "",
	"break-hh": "",
	"break-mm": "",
};

export const HOURS_AME_NUMERIC_FIELDS: readonly AmeNumericFieldConfig[] =
	HOURS_AME_FIELD_IDS.map((id) => ({
		id,
		maxLength: 2,
		allowEmpty: true,
	}));

export type HoursAmePending =
	| { type: "pad"; fieldId: string; padded: string; advanceTo?: string }
	| { type: "advance"; advanceTo: string };

let pendingAction: HoursAmePending | null = null;

export function peekHoursAmePending(): HoursAmePending | null {
	return pendingAction;
}

export function takeHoursAmePending(): HoursAmePending | null {
	const next = pendingAction;
	pendingAction = null;
	return next;
}

export function clearHoursAmePending(): void {
	pendingAction = null;
}

export function cloneHoursAmeDraft(source: HoursAmeDraft): HoursAmeDraft {
	return { ...source };
}

export function mergeHoursAmeDraft(partial?: Partial<HoursAmeDraft>): HoursAmeDraft {
	return cloneHoursAmeDraft({ ...HOURS_AME_RESET_DEFAULTS, ...partial });
}

export function readHoursField(draft: HoursAmeDraft, id: HoursAmeFieldId | string): string {
	const value = draft[id as HoursAmeFieldId];
	return typeof value === "string" ? value : "";
}

/**
 * Keypad digit gate. Sets pending pad／advance for onDraftChange（不改 shared AME）。
 * Backspace／Delete 不走此函式 → 不會 auto-advance。
 */
export function acceptHoursAmeNumericCandidate(args: {
	fieldId: string;
	currentValue: string;
	candidateValue: string;
	digit: string;
}): boolean {
	pendingAction = null;
	const kind = hoursFieldKind(args.fieldId);
	if (!kind) {
		return false;
	}
	const result = evaluateHoursSegmentDigit(
		kind,
		args.currentValue,
		args.digit,
		args.fieldId,
	);
	if (!result.accept) {
		return false;
	}
	if (result.padTo) {
		pendingAction = {
			type: "pad",
			fieldId: args.fieldId,
			padded: result.padTo,
			advanceTo: result.advanceTo,
		};
		return true;
	}
	if (result.advanceTo) {
		pendingAction = { type: "advance", advanceTo: result.advanceTo };
	}
	return true;
}

/** B2B：欄位合法性；不處理 break > gross（B2C）。不用 bottom banner。 */
export function validateHoursAmeDraft(draft: HoursAmeDraft): AmeValidateResult {
	const fieldErrors: Record<string, string> = {};

	for (const id of HOURS_AME_FIELD_IDS) {
		const kind = hoursFieldKind(id);
		if (!kind) continue;
		const raw = readHoursField(draft, id);
		if (raw === "" || raw.length < 2) continue;
		const n = Number(raw);
		if (kind === "hh" && (n < 0 || n > 23)) {
			fieldErrors[id] = "Hours must be 00 to 23";
		}
		if (kind === "mm" && (n < 0 || n > 59)) {
			fieldErrors[id] = "Minutes must be 00 to 59";
		}
	}

	if (Object.keys(fieldErrors).length > 0) {
		return { ok: false, message: "Invalid time", fieldErrors };
	}
	return { ok: true };
}

export function syncHoursAmeSegmentUi(root: HTMLElement, draft: HoursAmeDraft): void {
	const toolRoot = root.closest("[data-hours-calculator-v2]") ?? root;
	const hhPh = toolRoot.getAttribute("data-hcv2-seg-hh-ph") || "HH";
	const mmPh = toolRoot.getAttribute("data-hcv2-seg-mm-ph") || "MM";

	for (const id of HOURS_AME_FIELD_IDS) {
		const kind = hoursFieldKind(id);
		const value = readHoursField(draft, id);
		const el = root.querySelector<HTMLElement>(
			`[data-ame-numeric-field="${id}"] [data-hcv2-segment-value]`,
		);
		if (!el) continue;
		if (value === "") {
			el.textContent = kind === "hh" ? hhPh : mmPh;
			el.classList.add("is-placeholder");
		} else {
			el.textContent = value;
			el.classList.remove("is-placeholder");
		}
	}
}

/** 列級 !：格式 invalid，或 B2C break > gross（僅 break 列） */
export function syncHoursAmeRowErrors(
	root: HTMLElement,
	draft: HoursAmeDraft,
	options?: { breakExceedsGross?: boolean },
): void {
	for (const group of ["start", "end", "break"] as const) {
		const hh = readHoursField(draft, `${group}-hh`);
		const mm = readHoursField(draft, `${group}-mm`);
		const formatInvalid = hoursGroupHasInvalidSegment(hh, mm);
		const show =
			formatInvalid || (group === "break" && Boolean(options?.breakExceedsGross));
		const icon = root.querySelector<HTMLElement>(`[data-hcv2-ame-invalid="${group}"]`);
		if (!icon) continue;
		icon.hidden = !show;
		icon.setAttribute("aria-hidden", show ? "false" : "true");
		if (show) {
			icon.removeAttribute("hidden");
		} else {
			icon.setAttribute("hidden", "");
		}
	}
}

export function parseAmeDraftToRange(draft: HoursAmeDraft) {
	return rangeFromSegmentPairs(
		parseSegmentPair(draft["start-hh"] ?? "", draft["start-mm"] ?? ""),
		parseSegmentPair(draft["end-hh"] ?? "", draft["end-mm"] ?? ""),
	);
}

export function parseAmeDraftToBreak(draft: HoursAmeDraft): BreakParseResult {
	/* Break＝duration：空白視為 0；不必兩碼齊全（Start／End 仍用 parseSegmentPair） */
	const core = parseBreakDurationSegments(draft["break-hh"] ?? "", draft["break-mm"] ?? "");
	if (core.status === "empty" || core.status === "invalid") {
		return { status: core.status };
	}
	return {
		status: "valid",
		totalMinutes: core.totalMinutes,
		normalized: formatTimeOfDay({ hours: core.hours, minutes: core.minutes }),
	};
}

export function ameDraftFromTimes(
	start: { hours: number; minutes: number } | null,
	end: { hours: number; minutes: number } | null,
	breakMinutes: number | null,
): HoursAmeDraft {
	const pad = (n: number) => String(n).padStart(2, "0");
	const draft = mergeHoursAmeDraft();
	if (start) {
		draft["start-hh"] = pad(start.hours);
		draft["start-mm"] = pad(start.minutes);
	}
	if (end) {
		draft["end-hh"] = pad(end.hours);
		draft["end-mm"] = pad(end.minutes);
	}
	if (breakMinutes != null && breakMinutes >= 0) {
		const hours = Math.floor(breakMinutes / 60);
		const minutes = breakMinutes % 60;
		draft["break-hh"] = pad(hours);
		draft["break-mm"] = pad(minutes);
	}
	return draft;
}

export function focusHoursAmeField(root: HTMLElement, fieldId: string): void {
	const el = root.querySelector<HTMLButtonElement>(`[data-ame-numeric-field="${fieldId}"]`);
	el?.click();
}
