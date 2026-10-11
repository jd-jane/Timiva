/**
 * Taiwan Year & Age Reference AME adapter（B2C）.
 * 只做 AME field ↔ PageState sync／live commit／Reset／error projection。
 * 換算／Reverse triplet／format 仍走 B2A evaluate／format；不另寫 mobile math。
 */
import { isEraId } from "../lib/japaneseEraConverterData.ts";
import {
	formatTyarEraYearRangeHint,
	type TyarFormatCopy,
} from "../lib/taiwanYearAgeReferenceFormat.ts";
import {
	isTyarZodiacId,
	type TyarCalendarMode,
	type TyarQueryMode,
} from "../lib/taiwanYearAgeReferenceMath.ts";
import {
	capTyarInput,
	evaluateTyarState,
	resetTyarState,
	setTyarQueryMode,
	switchTyarCalendarMode,
	TYAR_AGE_MAX_DIGITS,
	TYAR_DEFAULT_ERA_ID,
	TYAR_ERA_MAX_DIGITS,
	TYAR_GREGORIAN_MAX_DIGITS,
	TYAR_MINGUO_MAX_DIGITS,
	type TyarPageState,
} from "../lib/taiwanYearAgeReferenceState.ts";
import type {
	AmeDraftBag,
	AmeNumericFieldConfig,
	AmeValidateResult,
} from "./adaptive-mobile-editor-controller";

export type TyarAmeDraft = AmeDraftBag & {
	queryMode: TyarQueryMode;
	calendarMode: TyarCalendarMode;
	eraId: string;
	gregorianYear: string;
	minguoYear: string;
	eraYear: string;
	zodiacId: string;
	age: string;
};

export const TYAR_AME_ICON_ONLY = "!";

export const TYAR_AME_NUMERIC_FIELDS: readonly AmeNumericFieldConfig[] = [
	{ id: "gregorianYear", maxLength: TYAR_GREGORIAN_MAX_DIGITS, allowEmpty: true },
	{ id: "minguoYear", maxLength: TYAR_MINGUO_MAX_DIGITS, allowEmpty: true },
	{ id: "eraYear", maxLength: TYAR_ERA_MAX_DIGITS, allowEmpty: true },
	{ id: "age", maxLength: TYAR_AGE_MAX_DIGITS, allowEmpty: true },
];

export function cloneTyarAmeDraft(source: TyarAmeDraft): TyarAmeDraft {
	return { ...source };
}

export function draftFromState(state: TyarPageState): TyarAmeDraft {
	return {
		queryMode: state.queryMode,
		calendarMode: state.calendarMode,
		eraId: state.eraId,
		gregorianYear: state.gregorianRaw,
		minguoYear: state.minguoRaw,
		eraYear: state.eraYearRaw,
		zodiacId: state.zodiacId,
		age: state.ageRaw,
	};
}

function resolveCalendarMode(value: unknown): TyarCalendarMode {
	return value === "minguo" || value === "era" ? value : "gregorian";
}

/** draft → PageState。zodiac／age 沒變時保留 reverseView，不重算 triplet。 */
export function stateFromDraft(draft: TyarAmeDraft, previous: TyarPageState): TyarPageState {
	const zodiacId = isTyarZodiacId(draft.zodiacId) ? draft.zodiacId : "";
	const ageRaw = capTyarInput(typeof draft.age === "string" ? draft.age : "", TYAR_AGE_MAX_DIGITS);
	const zodiacOrAgeChanged = zodiacId !== previous.zodiacId || ageRaw !== previous.ageRaw;

	return {
		queryMode: draft.queryMode === "zodiac" ? "zodiac" : "year",
		calendarMode: resolveCalendarMode(draft.calendarMode),
		gregorianRaw: capTyarInput(
			typeof draft.gregorianYear === "string" ? draft.gregorianYear : "",
			TYAR_GREGORIAN_MAX_DIGITS,
		),
		minguoRaw: capTyarInput(
			typeof draft.minguoYear === "string" ? draft.minguoYear : "",
			TYAR_MINGUO_MAX_DIGITS,
		),
		eraId: isEraId(draft.eraId) ? draft.eraId : TYAR_DEFAULT_ERA_ID,
		eraYearRaw: capTyarInput(
			typeof draft.eraYear === "string" ? draft.eraYear : "",
			TYAR_ERA_MAX_DIGITS,
		),
		zodiacId,
		ageRaw,
		reverseView: zodiacOrAgeChanged ? "closest" : previous.reverseView,
	};
}

export function tyarAmeResetDraft(): TyarAmeDraft {
	return draftFromState(resetTyarState());
}

export function switchTyarAmeQueryMode(
	draft: TyarAmeDraft,
	queryMode: TyarQueryMode,
): TyarAmeDraft {
	return draftFromState(setTyarQueryMode(stateFromDraft(draft, resetTyarState()), queryMode));
}

export function switchTyarAmeCalendarMode(
	draft: TyarAmeDraft,
	calendarMode: TyarCalendarMode,
): TyarAmeDraft {
	return draftFromState(
		switchTyarCalendarMode(stateFromDraft(draft, resetTyarState()), calendarMode),
	);
}

function setEmptyAwarePreview(el: HTMLElement | null, value: string): void {
	if (!el) {
		return;
	}

	el.textContent = value;
	el.classList.toggle("ame-numeric-value--placeholder", value.length === 0);
}

function setAmeFieldInvalid(toolRoot: HTMLElement, fieldId: string, hint: string | null): void {
	const show = Boolean(hint);
	const icon = toolRoot.querySelector<HTMLElement>(`[data-ame-field-error="${fieldId}"]`);
	const sr = toolRoot.querySelector<HTMLElement>(`[data-ame-field-error-text="${fieldId}"]`);
	const visible = toolRoot.querySelector<HTMLElement>(`[data-tyar-ame-error="${fieldId}"]`);
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
		const showCopy = show && hint !== null && hint !== TYAR_AME_ICON_ONLY;
		visible.textContent = showCopy ? hint : "";
		visible.hidden = !showCopy;
		if (showCopy) {
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

export type TyarAmeInvalidPresentation = {
	gregorianYear: string | null;
	minguoYear: string | null;
	eraYear: string | null;
	age: string | null;
};

/** 只有 era-year-invalid 給 range copy；其餘 icon-only（"!"）。 */
export function tyarAmeInvalidPresentation(
	draft: TyarAmeDraft,
	copy: TyarFormatCopy,
	previous: TyarPageState,
): TyarAmeInvalidPresentation {
	const empty: TyarAmeInvalidPresentation = {
		gregorianYear: null,
		minguoYear: null,
		eraYear: null,
		age: null,
	};
	const state = stateFromDraft(draft, previous);
	const evaluation = evaluateTyarState(state);
	if (evaluation.status !== "invalid") {
		return empty;
	}

	if (state.queryMode === "zodiac") {
		if (evaluation.reason === "zodiac-unknown") {
			return empty;
		}
		return { ...empty, age: TYAR_AME_ICON_ONLY };
	}

	if (state.calendarMode === "minguo") {
		return { ...empty, minguoYear: TYAR_AME_ICON_ONLY };
	}
	if (state.calendarMode === "era") {
		if (evaluation.reason === "era-year-invalid") {
			return { ...empty, eraYear: formatTyarEraYearRangeHint(state.eraId, copy) };
		}
		return { ...empty, eraYear: TYAR_AME_ICON_ONLY };
	}
	return { ...empty, gregorianYear: TYAR_AME_ICON_ONLY };
}

export function syncTyarAmeUi(
	toolRoot: HTMLElement,
	draft: TyarAmeDraft,
	copy: TyarFormatCopy,
	previous: TyarPageState,
): void {
	const queryMode: TyarQueryMode = draft.queryMode === "zodiac" ? "zodiac" : "year";
	const calendarMode = resolveCalendarMode(draft.calendarMode);
	toolRoot.setAttribute("data-tyar-ame-query", queryMode);
	toolRoot.setAttribute("data-tyar-ame-calendar", calendarMode);

	const yearPanel = toolRoot.querySelector<HTMLElement>('[data-tyar-ame-panel="year"]');
	const zodiacPanel = toolRoot.querySelector<HTMLElement>('[data-tyar-ame-panel="zodiac"]');
	if (yearPanel) yearPanel.hidden = queryMode !== "year";
	if (zodiacPanel) zodiacPanel.hidden = queryMode !== "zodiac";

	toolRoot.querySelectorAll<HTMLElement>("[data-tyar-ame-mode]").forEach((btn) => {
		const on = btn.getAttribute("data-tyar-ame-mode") === calendarMode;
		btn.classList.toggle("is-active", on);
		btn.setAttribute("aria-pressed", on ? "true" : "false");
	});
	toolRoot.querySelectorAll<HTMLElement>("[data-tyar-ame-field]").forEach((wrap) => {
		wrap.hidden = wrap.getAttribute("data-tyar-ame-field") !== calendarMode;
	});

	const eraSelect = toolRoot.querySelector<HTMLSelectElement>("[data-tyar-ame-era-select]");
	if (eraSelect && eraSelect.value !== draft.eraId) {
		eraSelect.value = isEraId(draft.eraId) ? draft.eraId : TYAR_DEFAULT_ERA_ID;
	}

	const zodiacSelect = toolRoot.querySelector<HTMLSelectElement>("[data-tyar-ame-zodiac-select]");
	if (zodiacSelect && zodiacSelect.value !== draft.zodiacId) {
		zodiacSelect.value = draft.zodiacId;
	}

	setEmptyAwarePreview(
		toolRoot.querySelector("[data-tyar-ame-gregorian-year]"),
		draft.gregorianYear,
	);
	setEmptyAwarePreview(toolRoot.querySelector("[data-tyar-ame-minguo-year]"), draft.minguoYear);
	setEmptyAwarePreview(toolRoot.querySelector("[data-tyar-ame-era-year]"), draft.eraYear);
	setEmptyAwarePreview(toolRoot.querySelector("[data-tyar-ame-age]"), draft.age);

	const invalid = tyarAmeInvalidPresentation(draft, copy, previous);
	setAmeFieldInvalid(toolRoot, "gregorianYear", invalid.gregorianYear);
	setAmeFieldInvalid(toolRoot, "minguoYear", invalid.minguoYear);
	setAmeFieldInvalid(toolRoot, "eraYear", invalid.eraYear);
	setAmeFieldInvalid(toolRoot, "age", invalid.age);
}

export function validateTyarAmeDraft(
	draft: TyarAmeDraft,
	copy: TyarFormatCopy,
	previous: TyarPageState,
): AmeValidateResult {
	const invalid = tyarAmeInvalidPresentation(draft, copy, previous);
	const fieldErrors: Record<string, string> = {};
	if (invalid.gregorianYear) fieldErrors.gregorianYear = invalid.gregorianYear;
	if (invalid.minguoYear) fieldErrors.minguoYear = invalid.minguoYear;
	if (invalid.eraYear) fieldErrors.eraYear = invalid.eraYear;
	if (invalid.age) fieldErrors.age = invalid.age;

	if (Object.keys(fieldErrors).length === 0) {
		return { ok: true };
	}

	return {
		ok: false,
		message: "",
		fieldErrors,
	};
}

export function acceptTyarAmeNumericCandidate(args: {
	fieldId: string;
	candidateValue: string;
	draft: TyarAmeDraft;
}): boolean {
	if (!/^\d*$/.test(args.candidateValue)) {
		return false;
	}

	const queryMode: TyarQueryMode = args.draft.queryMode === "zodiac" ? "zodiac" : "year";
	const calendarMode = resolveCalendarMode(args.draft.calendarMode);
	if (queryMode === "zodiac") {
		if (args.fieldId !== "age") {
			return false;
		}
		return args.candidateValue.length <= TYAR_AGE_MAX_DIGITS;
	}

	if (calendarMode === "gregorian" && args.fieldId !== "gregorianYear") {
		return false;
	}
	if (calendarMode === "minguo" && args.fieldId !== "minguoYear") {
		return false;
	}
	if (calendarMode === "era" && args.fieldId !== "eraYear") {
		return false;
	}

	const max =
		args.fieldId === "eraYear"
			? TYAR_ERA_MAX_DIGITS
			: args.fieldId === "minguoYear"
				? TYAR_MINGUO_MAX_DIGITS
				: TYAR_GREGORIAN_MAX_DIGITS;
	return args.candidateValue.length <= max;
}

type TyarAmeBindApi = {
	getDraft: () => TyarAmeDraft;
	patchDraft: (partial: Partial<TyarAmeDraft>) => void;
	clearActiveField: () => void;
	isOpen: () => boolean;
};

export function bindTyarAmeInteractions(
	ameRoot: HTMLElement,
	api: TyarAmeBindApi,
): () => void {
	const onClick = (event: Event) => {
		if (!api.isOpen()) {
			return;
		}

		const target = event.target;
		if (!(target instanceof Element) || !ameRoot.contains(target)) {
			return;
		}

		const modeEl = target.closest<HTMLElement>("[data-tyar-ame-mode]");
		if (modeEl) {
			event.preventDefault();
			const next = modeEl.getAttribute("data-tyar-ame-mode");
			if (next !== "gregorian" && next !== "minguo" && next !== "era") {
				return;
			}
			api.patchDraft(switchTyarAmeCalendarMode(api.getDraft(), next));
			api.clearActiveField();
			return;
		}

		const switchEl = target.closest<HTMLElement>("[data-tyar-ame-query-switch]");
		if (!switchEl) {
			return;
		}

		event.preventDefault();
		const next = switchEl.getAttribute("data-tyar-ame-query-switch");
		if (next !== "year" && next !== "zodiac") {
			return;
		}
		api.patchDraft(switchTyarAmeQueryMode(api.getDraft(), next));
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

		if (target.matches("[data-tyar-ame-era-select]")) {
			api.patchDraft({ eraId: isEraId(target.value) ? target.value : TYAR_DEFAULT_ERA_ID });
			api.clearActiveField();
			return;
		}

		if (target.matches("[data-tyar-ame-zodiac-select]")) {
			api.patchDraft({ zodiacId: isTyarZodiacId(target.value) ? target.value : "" });
			api.clearActiveField();
		}
	};

	ameRoot.addEventListener("click", onClick);
	ameRoot.addEventListener("change", onChange);
	return () => {
		ameRoot.removeEventListener("click", onClick);
		ameRoot.removeEventListener("change", onChange);
	};
}
