/**
 * Japanese Era Converter AME adapter（B2C）.
 * Draft／digit cap／mode switch／Reset payload；換算只走 B2A evaluate／format。
 * 不改 shared AME lifecycle／keypad／ResultSummary internals。
 */
import {
	DEFAULT_ERA_ID,
	ERA_INPUT_MAX_DIGITS,
	evaluateDesktopState,
	GREGORIAN_INPUT_MAX_DIGITS,
	resetDesktopState,
	resolveEraId,
	switchDesktopMode,
	type JecDesktopState,
} from "../lib/japaneseEraConverterDesktopState.ts";
import {
	formatInvalidHint,
	type JecFormatLocale,
} from "../lib/japaneseEraConverterFormat.ts";
import type {
	AmeDraftBag,
	AmeNumericFieldConfig,
	AmeValidateResult,
} from "./adaptive-mobile-editor-controller";

export type JecAmeMode = "gregorian" | "era";

export type JecAmeDraft = AmeDraftBag & {
	mode: JecAmeMode;
	eraId: string;
	gregorianYear: string;
	eraYear: string;
};

export const JEC_AME_RESET_DEFAULTS: JecAmeDraft = {
	mode: "gregorian",
	eraId: DEFAULT_ERA_ID,
	gregorianYear: "",
	eraYear: "",
};

export const JEC_AME_NUMERIC_FIELDS: readonly AmeNumericFieldConfig[] = [
	{ id: "gregorianYear", maxLength: GREGORIAN_INPUT_MAX_DIGITS, allowEmpty: true },
	{ id: "eraYear", maxLength: ERA_INPUT_MAX_DIGITS, allowEmpty: true },
];

export function cloneJecAmeDraft(source: JecAmeDraft): JecAmeDraft {
	return { ...source };
}

export function draftFromState(state: JecDesktopState): JecAmeDraft {
	return {
		mode: state.mode,
		eraId: state.eraId,
		gregorianYear: state.gregorianRaw,
		eraYear: state.eraYearRaw,
	};
}

export function stateFromDraft(draft: JecAmeDraft): JecDesktopState {
	return {
		mode: draft.mode === "era" ? "era" : "gregorian",
		gregorianRaw: typeof draft.gregorianYear === "string" ? draft.gregorianYear : "",
		eraId: resolveEraId(typeof draft.eraId === "string" ? draft.eraId : DEFAULT_ERA_ID),
		eraYearRaw: typeof draft.eraYear === "string" ? draft.eraYear : "",
	};
}

export function jecAmeResetDraft(): JecAmeDraft {
	return draftFromState(resetDesktopState());
}

function setEmptyAwarePreview(el: HTMLElement | null, value: string): void {
	if (!el) {
		return;
	}

	el.textContent = value;
	el.classList.toggle("ame-numeric-value--placeholder", value.length === 0);
}

export type JecAmeInvalidPresentation = {
	gregorianYear: string | null;
	eraYear: string | null;
};

/** 只讀 B2A evaluate／formatInvalidHint；empty／incomplete 不產生 range error。 */
export function jecAmeInvalidPresentation(
	draft: JecAmeDraft,
	locale: JecFormatLocale,
): JecAmeInvalidPresentation {
	const state = stateFromDraft(draft);
	const evaluation = evaluateDesktopState(state);
	const hint = formatInvalidHint(evaluation, locale, state.eraId);
	if (evaluation.status !== "invalid" || !hint) {
		return { gregorianYear: null, eraYear: null };
	}

	if (state.mode === "era") {
		return { gregorianYear: null, eraYear: hint };
	}

	return { gregorianYear: hint, eraYear: null };
}

function setAmeFieldInvalid(toolRoot: HTMLElement, fieldId: string, hint: string | null): void {
	const show = Boolean(hint);
	const icon = toolRoot.querySelector<HTMLElement>(`[data-ame-field-error="${fieldId}"]`);
	const sr = toolRoot.querySelector<HTMLElement>(`[data-ame-field-error-text="${fieldId}"]`);
	const visible = toolRoot.querySelector<HTMLElement>(`[data-jecv2-ame-error="${fieldId}"]`);
	const field = toolRoot.querySelector<HTMLElement>(`[data-ame-numeric-field="${fieldId}"]`);

	if (icon) {
		icon.hidden = !show;
		if (show) {
			icon.removeAttribute("hidden");
		} else {
			icon.setAttribute("hidden", "");
		}
	}

	if (sr) {
		sr.textContent = hint ?? "";
		sr.hidden = !show;
		if (show) {
			sr.removeAttribute("hidden");
		} else {
			sr.setAttribute("hidden", "");
		}
	}

	if (visible) {
		visible.textContent = hint ?? "";
		visible.hidden = !show;
		if (show) {
			visible.removeAttribute("hidden");
		} else {
			visible.setAttribute("hidden", "");
		}
	}

	if (field) {
		field.setAttribute("aria-invalid", show ? "true" : "false");
		if (show && sr?.id) {
			field.setAttribute("aria-describedby", sr.id);
		} else {
			field.removeAttribute("aria-describedby");
		}
	}
}

/**
 * Shared AME empty numeric 會顯示 "0"。年份空白應維持空值預覽，不改 shared internals。
 * Invalid icon／可見 range message 也在這裡重繪，避免 keypad／focus sync 清掉後不再出現。
 */
export function syncJecAmeUi(
	toolRoot: HTMLElement,
	draft: JecAmeDraft,
	locale: JecFormatLocale,
): void {
	const mode: JecAmeMode = draft.mode === "era" ? "era" : "gregorian";
	toolRoot.setAttribute("data-jecv2-ame", mode);

	const gregorian = toolRoot.querySelector<HTMLElement>("[data-jecv2-ame-gregorian]");
	const era = toolRoot.querySelector<HTMLElement>("[data-jecv2-ame-era]");
	if (gregorian) gregorian.hidden = mode !== "gregorian";
	if (era) era.hidden = mode !== "era";

	const select = toolRoot.querySelector<HTMLSelectElement>("[data-jecv2-ame-era-select]");
	if (select && select.value !== draft.eraId) {
		select.value = draft.eraId;
	}

	setEmptyAwarePreview(
		toolRoot.querySelector("[data-jecv2-ame-gregorian-value]"),
		draft.gregorianYear,
	);
	setEmptyAwarePreview(
		toolRoot.querySelector("[data-jecv2-ame-era-year-value]"),
		draft.eraYear,
	);

	const invalid = jecAmeInvalidPresentation(draft, locale);
	setAmeFieldInvalid(toolRoot, "gregorianYear", invalid.gregorianYear);
	setAmeFieldInvalid(toolRoot, "eraYear", invalid.eraYear);
}

export function validateJecAmeDraft(
	draft: JecAmeDraft,
	locale: JecFormatLocale,
): AmeValidateResult {
	const state = stateFromDraft(draft);
	const evaluation = evaluateDesktopState(state);
	if (evaluation.status !== "invalid") {
		return { ok: true };
	}

	const hint = formatInvalidHint(evaluation, locale, state.eraId) ?? "";
	const fieldId = state.mode === "era" ? "eraYear" : "gregorianYear";
	return {
		ok: false,
		message: hint,
		fieldErrors: hint ? { [fieldId]: hint } : undefined,
	};
}

/**
 * 只做 digit cap 與目前模式欄位閘門，不把非法年份改成合法年份。
 */
export function acceptJecAmeNumericCandidate(args: {
	fieldId: string;
	candidateValue: string;
	draft: JecAmeDraft;
}): boolean {
	if (!/^\d*$/.test(args.candidateValue)) {
		return false;
	}

	const mode: JecAmeMode = args.draft.mode === "era" ? "era" : "gregorian";
	if (mode === "gregorian" && args.fieldId !== "gregorianYear") {
		return false;
	}
	if (mode === "era" && args.fieldId !== "eraYear") {
		return false;
	}

	const max =
		args.fieldId === "eraYear" ? ERA_INPUT_MAX_DIGITS : GREGORIAN_INPUT_MAX_DIGITS;
	return args.candidateValue.length <= max;
}

export function switchJecAmeDraft(draft: JecAmeDraft): JecAmeDraft {
	return draftFromState(switchDesktopMode(stateFromDraft(draft)));
}

type JecAmeBindApi = {
	getDraft: () => JecAmeDraft;
	patchDraft: (partial: Partial<JecAmeDraft>) => void;
	clearActiveField: () => void;
	isOpen: () => boolean;
};

export function bindJecAmeInteractions(
	ameRoot: HTMLElement,
	api: JecAmeBindApi,
): () => void {
	const onClick = (event: Event) => {
		if (!api.isOpen()) {
			return;
		}

		const target = event.target;
		if (!(target instanceof Element) || !ameRoot.contains(target)) {
			return;
		}

		const switchEl = target.closest<HTMLElement>("[data-jecv2-ame-switch]");
		if (!switchEl) {
			return;
		}

		event.preventDefault();
		api.patchDraft(switchJecAmeDraft(api.getDraft()));
		api.clearActiveField();
	};

	const onChange = (event: Event) => {
		if (!api.isOpen()) {
			return;
		}

		const target = event.target;
		if (!(target instanceof HTMLSelectElement)) {
			return;
		}
		if (!target.matches("[data-jecv2-ame-era-select]")) {
			return;
		}

		api.patchDraft({ eraId: resolveEraId(target.value) });
		api.clearActiveField();
	};

	ameRoot.addEventListener("click", onClick);
	ameRoot.addEventListener("change", onChange);
	return () => {
		ameRoot.removeEventListener("click", onClick);
		ameRoot.removeEventListener("change", onChange);
	};
}
