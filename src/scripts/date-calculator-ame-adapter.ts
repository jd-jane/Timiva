/**
 * Date Calculator AME adapter（B8 First Adopter／B8.2 live lifecycle）.
 * Owns DC draft shape、numericField configs、validate、DOM sync／bind.
 * Shared AME controller stays tool-agnostic（no DC math semantics）.
 * Tool opts into adapter.lifecycle = "live" at mount（date-calculator.ts）.
 */
import {
	calculateDate,
	DATE_CALCULATOR_MAX,
	DATE_CALCULATOR_MIN,
	isValidSupportedStartDate,
	type Direction,
	type Duration,
	type DurationUnit,
} from "../lib/dateCalculatorMath";
import { isValidDurationInput } from "../lib/dateCalculatorDuration";
import { parseCivilIso } from "../lib/dateCalculatorFormat";
import type { AmeDraftBag, AmeNumericFieldConfig, AmeValidateResult } from "./adaptive-mobile-editor-controller";

export type DcAmeDraft = AmeDraftBag & {
	startDate: string;
	direction: Direction;
	years: string;
	months: string;
	weeks: string;
	days: string;
};

export type DcAmeCopy = {
	validationStartDate: string;
	validationDuration: string;
	validationOutOfRange: string;
	validationUnsafeInteger: string;
	yearsLabel: string;
	monthsLabel: string;
	weeksLabel: string;
	daysLabel: string;
	directionAdd: string;
	directionSubtract: string;
	durationZeroPlaceholder: string;
};

export const DC_AME_RESET_DEFAULTS: DcAmeDraft = {
	startDate: "",
	direction: "add",
	years: "",
	months: "",
	weeks: "",
	days: "",
};

/** Decision C: explicit null = no AME digit truncate；allowEmpty true per §6.2. */
export const DC_AME_NUMERIC_FIELDS: readonly AmeNumericFieldConfig[] = [
	{ id: "years", maxLength: null, allowEmpty: true },
	{ id: "months", maxLength: null, allowEmpty: true },
	{ id: "weeks", maxLength: null, allowEmpty: true },
	{ id: "days", maxLength: null, allowEmpty: true },
];

export const DC_AME_DURATION_UNITS: readonly DurationUnit[] = [
	"years",
	"months",
	"weeks",
	"days",
];

export function cloneDcAmeDraft(source: DcAmeDraft): DcAmeDraft {
	return { ...source };
}

export function mergeDcAmeDraft(partial?: Partial<DcAmeDraft>): DcAmeDraft {
	return cloneDcAmeDraft({ ...DC_AME_RESET_DEFAULTS, ...partial });
}

function readUnitRaw(draft: DcAmeDraft, unit: DurationUnit): string {
	return draft[unit] ?? "";
}

/** Empty → 0；invalid → null. */
export function parseDcDurationUnit(raw: string): number | null {
	if (raw.length === 0) {
		return 0;
	}
	if (!isValidDurationInput(raw)) {
		return null;
	}
	return Number(raw.replace(/^0+(?=\d)/, "") || "0");
}

export function draftToDuration(draft: DcAmeDraft): Duration | null {
	const years = parseDcDurationUnit(draft.years);
	const months = parseDcDurationUnit(draft.months);
	const weeks = parseDcDurationUnit(draft.weeks);
	const days = parseDcDurationUnit(draft.days);
	if (years === null || months === null || weeks === null || days === null) {
		return null;
	}
	return { years, months, weeks, days };
}

/**
 * Dynamic digit gate（Decision C）：maxLength null ≠ unbounded value.
 * Build candidate duration with formal Year→Month→Week→Day order via calculateDate.
 * No start date → probe with MIN（add）／MAX（subtract） so infinite typing is still blocked.
 * Reject keeps prior value；never clamps／rewrites.
 */
export function acceptDcAmeNumericCandidate(
	draft: DcAmeDraft,
	fieldId: string,
	candidateValue: string,
): boolean {
	if (!(DC_AME_DURATION_UNITS as readonly string[]).includes(fieldId)) {
		return true;
	}
	if (candidateValue.length === 0) {
		return true;
	}
	if (!/^\d+$/.test(candidateValue)) {
		return false;
	}
	const numeric = Number(candidateValue);
	if (!Number.isSafeInteger(numeric) || numeric < 0) {
		return false;
	}

	const candidateDraft: DcAmeDraft = {
		...draft,
		[fieldId]: candidateValue,
	};
	const duration = draftToDuration(candidateDraft);
	if (!duration) {
		return false;
	}

	const parsedStart = parseCivilIso(draft.startDate);
	const start =
		parsedStart && isValidSupportedStartDate(parsedStart)
			? parsedStart
			: draft.direction === "add"
				? DATE_CALCULATOR_MIN
				: DATE_CALCULATOR_MAX;

	const result = calculateDate(start, draft.direction, duration);
	return result.ok;
}

export function validateDcAmeDraft(draft: DcAmeDraft, copy: DcAmeCopy): AmeValidateResult {
	for (const unit of DC_AME_DURATION_UNITS) {
		const raw = readUnitRaw(draft, unit);
		if (raw.length === 0) {
			continue;
		}
		if (!/^\d+$/.test(raw)) {
			return {
				ok: false,
				message: copy.validationDuration,
				fieldErrors: { [unit]: copy.validationDuration },
			};
		}
		const n = Number(raw);
		if (!Number.isSafeInteger(n) || n < 0) {
			return {
				ok: false,
				message: copy.validationUnsafeInteger,
				fieldErrors: { [unit]: copy.validationUnsafeInteger },
			};
		}
	}

	const duration = draftToDuration(draft);
	if (!duration) {
		return {
			ok: false,
			message: copy.validationDuration,
		};
	}

	const start = parseCivilIso(draft.startDate);
	if (!start || !isValidSupportedStartDate(start)) {
		return {
			ok: false,
			message: copy.validationStartDate,
			fieldErrors: { startDate: copy.validationStartDate },
		};
	}

	const result = calculateDate(start, draft.direction, duration);
	if (!result.ok) {
		if (result.reason === "out-of-range") {
			const unit = result.unit ?? "days";
			return {
				ok: false,
				message: copy.validationOutOfRange,
				fieldErrors: { [unit]: copy.validationOutOfRange },
			};
		}
		if (result.reason === "invalid-start-date") {
			return {
				ok: false,
				message: copy.validationStartDate,
				fieldErrors: { startDate: copy.validationStartDate },
			};
		}
		const unit = result.unit ?? "days";
		return {
			ok: false,
			message: copy.validationDuration,
			fieldErrors: { [unit]: copy.validationDuration },
		};
	}

	return { ok: true };
}

export function syncDcAmeUi(root: HTMLElement, draft: DcAmeDraft) {
	const dateInput = root.querySelector<HTMLInputElement>("[data-dcv2-ame-start]");
	if (dateInput && dateInput.value !== draft.startDate) {
		dateInput.value = draft.startDate;
	}

	root.querySelectorAll<HTMLInputElement>("[data-dcv2-ame-direction]").forEach((input) => {
		const dir = input.getAttribute("data-dcv2-ame-direction") ?? input.value;
		input.checked = dir === draft.direction;
	});
}

type DcBindApi = {
	getDraft: () => DcAmeDraft;
	patchDraft: (partial: Partial<DcAmeDraft>) => void;
	clearActiveField: () => void;
	isOpen: () => boolean;
};

export function bindDcAmeInteractions(root: HTMLElement, api: DcBindApi): () => void {
	const onChange = (event: Event) => {
		if (!api.isOpen()) {
			return;
		}
		const target = event.target;
		if (!(target instanceof HTMLElement) || !root.contains(target)) {
			return;
		}

		if (target.matches("[data-dcv2-ame-start]") && target instanceof HTMLInputElement) {
			api.patchDraft({ startDate: target.value });
			api.clearActiveField();
			return;
		}
		if (
			target.matches("[data-dcv2-ame-direction]") &&
			target instanceof HTMLInputElement &&
			target.checked
		) {
			const dir = target.getAttribute("data-dcv2-ame-direction") ?? target.value;
			if (dir === "add" || dir === "subtract") {
				api.patchDraft({ direction: dir });
				api.clearActiveField();
			}
		}
	};

	root.addEventListener("change", onChange);
	return () => {
		root.removeEventListener("change", onChange);
	};
}
