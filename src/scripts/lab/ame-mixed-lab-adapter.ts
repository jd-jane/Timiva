/**
 * Lab Mixed Controls stress adapter（B7）.
 * Owns Mixed draft shape、validate、reset defaults、DOM sync／bind.
 * Shared AME controller stays tool-agnostic.
 */

import type { AmeDraftBag, AmeValidateResult } from "../adaptive-mobile-editor-controller";
import { ameAnyNumericFilled } from "../../lib/ameNumericDraft";

export type AmeMixedChecks = {
	alpha: boolean;
	beta: boolean;
	gamma: boolean;
};

/** Lab Mixed／Numeric stress draft — not a formal product schema. */
export type AmeMixedDraft = AmeDraftBag & {
	note: string;
	direction: "plus" | "minus";
	date: string;
	unitPreset: string;
	years: string;
	months: string;
	weeks: string;
	days: string;
	radioChoice: string;
	checks: AmeMixedChecks;
	toggleOn: boolean;
};

export const AME_MIXED_RESET_DEFAULTS: AmeMixedDraft = {
	note: "ready",
	direction: "plus",
	date: "",
	unitPreset: "custom",
	years: "",
	months: "",
	weeks: "",
	days: "",
	radioChoice: "option-a",
	checks: { alpha: false, beta: false, gamma: false },
	toggleOn: false,
};

export const AME_MIXED_NUMERIC_FIELDS = [
	{ id: "years", maxLength: 4, allowEmpty: true },
	{ id: "months", maxLength: 4, allowEmpty: true },
	{ id: "weeks", maxLength: 4, allowEmpty: true },
	{ id: "days", maxLength: 4, allowEmpty: true },
] as const;

export function cloneAmeMixedDraft(source: AmeMixedDraft): AmeMixedDraft {
	return {
		...source,
		checks: { ...source.checks },
	};
}

export function mergeAmeMixedDraft(partial?: Partial<AmeMixedDraft>): AmeMixedDraft {
	return cloneAmeMixedDraft({
		...AME_MIXED_RESET_DEFAULTS,
		...partial,
		checks: {
			...AME_MIXED_RESET_DEFAULTS.checks,
			...(partial?.checks ?? {}),
		},
	});
}

export function validateAmeMixedDraft(draft: AmeMixedDraft, density: string): AmeValidateResult {
	if (density !== "mixed") {
		return { ok: true };
	}
	if (
		!ameAnyNumericFilled(
			{
				years: draft.years,
				months: draft.months,
				weeks: draft.weeks,
				days: draft.days,
			},
			["years", "months", "weeks", "days"],
		)
	) {
		/* Form-level — shared error region（no fieldErrors）. */
		return {
			ok: false,
			message: "Enter at least one of Years, Months, Weeks, or Days.",
		};
	}

	const fieldErrors: Record<string, string> = {};
	if (!draft.date) {
		fieldErrors.date = "Choose a date.";
	}
	/* Multi-field Lab fixture：Notify on＋empty date → date＋days icons（no banner）. */
	if (!draft.date && draft.toggleOn) {
		fieldErrors.days = "Check the Days value.";
	}
	if (Object.keys(fieldErrors).length > 0) {
		return {
			ok: false,
			message: "",
			fieldErrors,
		};
	}
	return { ok: true };
}

export function syncAmeMixedLabUi(root: HTMLElement, draft: AmeMixedDraft) {
	root.querySelectorAll<HTMLInputElement>("[data-ame-direction]").forEach((input) => {
		const dir = input.getAttribute("data-ame-direction") ?? input.value;
		input.checked = dir === draft.direction;
	});

	const dateInput = root.querySelector<HTMLInputElement>("[data-ame-date]");
	if (dateInput && dateInput.value !== draft.date) {
		dateInput.value = draft.date;
	}
	const select = root.querySelector<HTMLSelectElement>("[data-ame-select]");
	if (select && select.value !== draft.unitPreset) {
		select.value = draft.unitPreset;
	}
	root.querySelectorAll<HTMLInputElement>("[data-ame-radio]").forEach((input) => {
		input.checked = input.value === draft.radioChoice;
	});
	(Object.keys(draft.checks) as Array<keyof AmeMixedChecks>).forEach((key) => {
		const input = root.querySelector<HTMLInputElement>(`[data-ame-check="${key}"]`);
		if (input) {
			input.checked = draft.checks[key];
		}
	});
	const toggle = root.querySelector<HTMLButtonElement>("[data-ame-toggle]");
	if (toggle) {
		toggle.setAttribute("aria-checked", draft.toggleOn ? "true" : "false");
		toggle.classList.toggle("ame-toggle--on", draft.toggleOn);
	}
}

type MixedBindApi = {
	getDraft: () => AmeMixedDraft;
	patchDraft: (partial: Partial<AmeMixedDraft>) => void;
	clearActiveField: () => void;
	isOpen: () => boolean;
};

/**
 * Bind Mixed-only controls. Shared controller does not understand these semantics.
 */
export function bindAmeMixedLabInteractions(root: HTMLElement, api: MixedBindApi): () => void {
	const onClick = (event: Event) => {
		if (!api.isOpen()) {
			return;
		}
		const target = event.target;
		if (!(target instanceof Element) || !root.contains(target)) {
			return;
		}

		const toggleEl = target.closest<HTMLElement>("[data-ame-toggle]");
		const toggleRow = target.closest<HTMLElement>(".ame-setting-row--toggle");
		if ((toggleEl || toggleRow) && root.contains(toggleEl ?? toggleRow)) {
			event.preventDefault();
			const draft = api.getDraft();
			api.patchDraft({ toggleOn: !draft.toggleOn });
			api.clearActiveField();
		}
	};

	const onChange = (event: Event) => {
		if (!api.isOpen()) {
			return;
		}
		const target = event.target;
		if (!(target instanceof HTMLElement) || !root.contains(target)) {
			return;
		}

		if (target.matches("[data-ame-date]") && target instanceof HTMLInputElement) {
			api.patchDraft({ date: target.value });
			api.clearActiveField();
			return;
		}
		if (target.matches("[data-ame-select]") && target instanceof HTMLSelectElement) {
			api.patchDraft({ unitPreset: target.value });
			api.clearActiveField();
			return;
		}
		if (target.matches("[data-ame-direction]") && target instanceof HTMLInputElement && target.checked) {
			const dir = target.getAttribute("data-ame-direction") ?? target.value;
			if (dir === "plus" || dir === "minus") {
				api.patchDraft({ direction: dir });
				api.clearActiveField();
			}
			return;
		}
		if (target.matches("[data-ame-radio]") && target instanceof HTMLInputElement && target.checked) {
			api.patchDraft({ radioChoice: target.value });
			api.clearActiveField();
			return;
		}
		if (target.matches("[data-ame-check]") && target instanceof HTMLInputElement) {
			const key = target.getAttribute("data-ame-check");
			if (key === "alpha" || key === "beta" || key === "gamma") {
				const draft = api.getDraft();
				api.patchDraft({
					checks: { ...draft.checks, [key]: target.checked },
				});
				api.clearActiveField();
			}
		}
	};

	root.addEventListener("click", onClick);
	root.addEventListener("change", onChange);
	return () => {
		root.removeEventListener("click", onClick);
		root.removeEventListener("change", onChange);
	};
}
