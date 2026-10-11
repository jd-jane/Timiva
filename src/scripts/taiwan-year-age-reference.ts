/**
 * Taiwan Year & Age Reference — B2B Desktop + B2C AME controller.
 * 資料流：Desktop／AME events → PageState → B2A evaluate → format(i18n) → renderResult()。
 * 不在 handler／adapter 裡重寫換算或 Reverse algorithm。
 */
import { getMessages } from "../i18n/messages.ts";
import type { Locale } from "../i18n/config.ts";
import {
	formatTaiwanYearAge,
	formatTyarEraYearRangeHint,
	type TyarFormatCopy,
	type TyarFormattedResult,
} from "../lib/taiwanYearAgeReferenceFormat.ts";
import {
	evaluateTyarState,
	applyTyarInputInsert,
	capTyarInput,
	createInitialTyarState,
	parseTyarQaFixtureParam,
	resetTyarState,
	setTyarAgeRaw,
	setTyarEraId,
	setTyarEraYearRaw,
	setTyarGregorianRaw,
	setTyarMinguoRaw,
	setTyarQueryMode,
	setTyarReverseView,
	setTyarZodiacId,
	stateFromTyarQaFixture,
	switchTyarCalendarMode,
	TYAR_AGE_MAX_DIGITS,
	TYAR_ERA_MAX_DIGITS,
	TYAR_GREGORIAN_MAX_DIGITS,
	TYAR_MINGUO_MAX_DIGITS,
	type TyarPageState,
} from "../lib/taiwanYearAgeReferenceState.ts";
import type { TyarCalendarMode, TyarEvaluation } from "../lib/taiwanYearAgeReferenceMath.ts";
import { createAdaptiveMobileEditor } from "./adaptive-mobile-editor-controller";
import { init as initResultSummary, update as updateResultSummary } from "./result-summary-controller.ts";
import {
	acceptTyarAmeNumericCandidate,
	bindTyarAmeInteractions,
	cloneTyarAmeDraft,
	draftFromState,
	stateFromDraft,
	syncTyarAmeUi,
	TYAR_AME_NUMERIC_FIELDS,
	tyarAmeResetDraft,
	validateTyarAmeDraft,
	type TyarAmeDraft,
} from "./taiwan-year-age-reference-ame-adapter.ts";

type InvalidField = {
	wrap: HTMLElement | null;
	input: HTMLInputElement | HTMLSelectElement | null;
	error: HTMLElement | null;
	errorText: HTMLElement | null;
};

function readLocale(root: HTMLElement): Locale {
	return root.getAttribute("data-tyar-locale") === "zh" ? "zh" : "en";
}

function formatCopy(locale: Locale): TyarFormatCopy {
	return getMessages(locale).taiwanYearAgeReference;
}

function bindYearDigitCap(
	input: HTMLInputElement,
	maxDigits: number,
	onChange: (value: string) => void,
): void {
	const commit = (value: string, caret: number | null): void => {
		input.value = value;
		if (caret !== null) {
			const nextCaret = Math.max(0, Math.min(caret, value.length));
			input.setSelectionRange(nextCaret, nextCaret);
		}
		onChange(value);
	};

	input.addEventListener("beforeinput", (event) => {
		const inputEvent = event as InputEvent;
		if (inputEvent.inputType !== "insertText" || inputEvent.data == null) {
			return;
		}

		const start = input.selectionStart ?? 0;
		const end = input.selectionEnd ?? start;
		const unconstrained = `${input.value.slice(0, start)}${inputEvent.data}${input.value.slice(end)}`;
		const next = applyTyarInputInsert(input.value, inputEvent.data, start, end, maxDigits);
		if (unconstrained === next) {
			return;
		}

		event.preventDefault();
		const inserted = next.length - (input.value.length - (end - start));
		commit(next, start + Math.max(0, inserted));
	});

	input.addEventListener("paste", (event) => {
		event.preventDefault();
		const text = event.clipboardData?.getData("text") ?? "";
		const start = input.selectionStart ?? 0;
		const end = input.selectionEnd ?? start;
		const next = applyTyarInputInsert(input.value, text, start, end, maxDigits);
		const inserted = next.length - (input.value.length - (end - start));
		commit(next, start + Math.max(0, inserted));
	});

	input.addEventListener("input", () => {
		const capped = capTyarInput(input.value, maxDigits);
		if (capped !== input.value) {
			const caret = input.selectionStart ?? capped.length;
			commit(capped, Math.min(caret, capped.length));
			return;
		}
		onChange(input.value);
	});
}

function setInvalidField(field: InvalidField, show: boolean, hint: string | null = null): void {
	field.wrap?.classList.toggle("is-invalid", show);

	if (field.errorText) {
		field.errorText.textContent = show && hint ? hint : "";
	}

	if (field.error) {
		field.error.hidden = !show;
		if (show && hint) {
			field.error.setAttribute("aria-label", `${hint} !`);
		} else {
			field.error.removeAttribute("aria-label");
		}
	}

	if (field.input) {
		field.input.setAttribute("aria-invalid", show ? "true" : "false");
		if (show && hint && field.error?.id) {
			field.input.setAttribute("aria-describedby", field.error.id);
		} else {
			field.input.removeAttribute("aria-describedby");
		}
	}
}

/** Exact single：nowrap 超出 stage 才用 long；不依 locale／年份 hardcode。 */
function exactSinglePrimaryTier(
	resultRoot: HTMLElement,
	host: HTMLElement,
): "single-short" | "single-long" {
	const primary = resultRoot.querySelector<HTMLElement>('[data-rs-value="primary"]');
	if (!primary) {
		return "single-short";
	}

	const cs = getComputedStyle(primary);
	const probe = document.createElement("span");
	probe.textContent = primary.textContent ?? "";
	probe.style.cssText = [
		"position:absolute",
		"left:-9999px",
		"top:0",
		"visibility:hidden",
		"white-space:nowrap",
		`font-family:${cs.fontFamily}`,
		`font-weight:${cs.fontWeight}`,
		`font-size:${cs.fontSize}`,
		`letter-spacing:${cs.letterSpacing}`,
	].join(";");
	document.body.appendChild(probe);
	const nowrap = probe.getBoundingClientRect().width;
	probe.remove();
	return nowrap > host.getBoundingClientRect().width + 1 ? "single-long" : "single-short";
}

function splitDualPrimary(text: string): [string, string] | null {
	const zh = text.split("｜").map((part) => part.replace(/\n/g, "").trim());
	if (zh.length === 2 && zh[0] && zh[1]) {
		return [zh[0], zh[1]];
	}

	const en = text.split(" | ").map((part) => part.replace(/\n/g, "").trim());
	if (en.length === 2 && en[0] && en[1]) {
		return [en[0], en[1]];
	}

	return null;
}

/** Portrait pipe 換行：寫入公開 primary 槽，不改 .rs-*。 */
function decoratePrimaryPipe(resultRoot: HTMLElement, text: string): void {
	const slot = resultRoot.querySelector<HTMLElement>('[data-rs-value="primary"]');
	if (!slot) {
		return;
	}

	const dual = splitDualPrimary(text);
	if (!dual) {
		return;
	}

	const sep = text.includes("｜") ? "｜" : " | ";
	const first = document.createElement("span");
	first.className = "tyar-primary-line";
	first.textContent = dual[0];
	const divider = document.createElement("span");
	divider.className = "tyar-primary-sep";
	divider.setAttribute("aria-hidden", "true");
	divider.textContent = sep;
	const second = document.createElement("span");
	second.className = "tyar-primary-line";
	second.textContent = dual[1];
	slot.replaceChildren(first, divider, second);
}

function decorateReverseWeekday(
	resultRoot: HTMLElement,
	eraLine: string | null,
	stemLine: string | null,
): void {
	const weekday = resultRoot.querySelector<HTMLElement>("[data-rs-weekday]");
	if (!weekday) {
		return;
	}

	const lines = [eraLine, stemLine].filter((line): line is string => Boolean(line));
	if (lines.length <= 1) {
		return;
	}

	weekday.replaceChildren();
	for (const line of lines) {
		const p = document.createElement("p");
		p.className = "tyar-reverse-line";
		p.textContent = line;
		weekday.appendChild(p);
	}
	weekday.hidden = false;
}

function setChip(
	button: HTMLButtonElement | null,
	options: {
		hidden: boolean;
		year: number | null;
		label: string;
		current: boolean;
		view: "previous" | "closest" | "next" | null;
	},
): void {
	if (!button) {
		return;
	}

	if (options.hidden || options.year === null) {
		button.hidden = true;
		button.disabled = true;
		button.tabIndex = -1;
		button.removeAttribute("data-tyar-chip-state");
		button.removeAttribute("data-tyar-chip-view");
		button.removeAttribute("aria-label");
		return;
	}

	const yearLabel = String(options.year);
	const yearEl = button.querySelector<HTMLElement>("[data-tyar-chip-year]");
	if (yearEl) {
		yearEl.textContent = yearLabel;
	} else {
		button.textContent = yearLabel;
	}

	button.hidden = false;
	button.setAttribute("data-tyar-chip-view", options.view ?? "");
	button.setAttribute("aria-label", yearLabel);
	if (options.current) {
		button.disabled = true;
		button.tabIndex = -1;
		button.setAttribute("data-tyar-chip-state", "current");
		button.setAttribute("aria-current", "true");
	} else {
		button.disabled = false;
		button.tabIndex = 0;
		button.removeAttribute("data-tyar-chip-state");
		button.removeAttribute("aria-current");
	}
}

function initDesktopInteraction(root: HTMLElement): {
	getState: () => TyarPageState;
	applyState: (next: TyarPageState) => void;
} {
	const gregorianInput = root.querySelector<HTMLInputElement>("[data-tyar-gregorian-year]");
	const minguoInput = root.querySelector<HTMLInputElement>("[data-tyar-minguo-year]");
	const eraInput = root.querySelector<HTMLInputElement>("[data-tyar-era-year]");
	const eraPrefix = root.querySelector<HTMLButtonElement>("[data-tyar-era-prefix]");
	const eraPrefixLabel = root.querySelector<HTMLElement>("[data-tyar-era-label]");
	const popover = root.querySelector<HTMLElement>("[data-tyar-era-popover]");
	const eraOptions = [...root.querySelectorAll<HTMLButtonElement>("[data-tyar-era-option]")];
	const zodiacSelect = root.querySelector<HTMLSelectElement>("[data-tyar-zodiac]");
	const ageInput = root.querySelector<HTMLInputElement>("[data-tyar-age]");
	const yearMode = root.querySelector<HTMLElement>("[data-tyar-year-mode]");
	const zodiacMode = root.querySelector<HTMLElement>("[data-tyar-zodiac-mode]");
	const leadEl = root.querySelector<HTMLElement>("[data-tyar-lead]");
	const thenEl = root.querySelector<HTMLElement>("[data-tyar-then-taiwan]");
	const navEl = root.querySelector<HTMLElement>("[data-tyar-reverse-nav]");
	const desktopPrev = root.querySelector<HTMLButtonElement>(
		'[data-tyar-reverse-nav] [data-tyar-chip="prev"]',
	);
	const desktopCurrent = root.querySelector<HTMLButtonElement>(
		'[data-tyar-reverse-nav] [data-tyar-chip="current"]',
	);
	const desktopNext = root.querySelector<HTMLButtonElement>(
		'[data-tyar-reverse-nav] [data-tyar-chip="next"]',
	);
	const landscapePrev = root.querySelector<HTMLButtonElement>(
		'.tyar-landscape-nav[data-tyar-chip="prev"]',
	);
	const landscapeNext = root.querySelector<HTMLButtonElement>(
		'.tyar-landscape-nav[data-tyar-chip="next"]',
	);
	const resultRoot = root.querySelector<HTMLElement>("[data-result-summary]");
	const resetButton = root.querySelector<HTMLButtonElement>("[data-tyar-reset]");

	const gregorianField: InvalidField = {
		wrap: root.querySelector('[data-tyar-field="gregorian"]'),
		input: gregorianInput,
		error: root.querySelector("[data-tyar-gregorian-error]"),
		errorText: null,
	};
	const minguoField: InvalidField = {
		wrap: root.querySelector('[data-tyar-field="minguo"]'),
		input: minguoInput,
		error: root.querySelector("[data-tyar-minguo-error]"),
		errorText: null,
	};
	const eraField: InvalidField = {
		wrap: root.querySelector('[data-tyar-field="era"]'),
		input: eraInput,
		error: root.querySelector("[data-tyar-era-error]"),
		errorText: root.querySelector("[data-tyar-era-error-text]"),
	};
	const zodiacField: InvalidField = {
		wrap: root.querySelector("[data-tyar-zodiac-wrap]"),
		input: zodiacSelect,
		error: root.querySelector("[data-tyar-zodiac-error]"),
		errorText: null,
	};
	const ageField: InvalidField = {
		wrap: root.querySelector("[data-tyar-age-wrap]"),
		input: ageInput,
		error: root.querySelector("[data-tyar-age-error]"),
		errorText: null,
	};

	const fixture = parseTyarQaFixtureParam(new URLSearchParams(location.search).get("tyarFixture"));
	let state: TyarPageState = fixture
		? stateFromTyarQaFixture(fixture)
		: createInitialTyarState();
	let popoverOpen = false;

	const copy = () => formatCopy(readLocale(root));

	const closePopover = (restoreFocus = false): void => {
		if (!popover || !eraPrefix) {
			popoverOpen = false;
			return;
		}

		popoverOpen = false;
		popover.hidden = true;
		popover.removeAttribute("data-placement");
		eraPrefix.setAttribute("aria-expanded", "false");
		eraOptions.forEach((option) => {
			option.tabIndex = -1;
		});
		if (restoreFocus) {
			eraPrefix.focus();
		}
	};

	const syncEraOptions = (): void => {
		eraOptions.forEach((option) => {
			const selected = option.getAttribute("data-tyar-era-option") === state.eraId;
			option.setAttribute("aria-selected", selected ? "true" : "false");
			option.tabIndex = popoverOpen && selected ? 0 : -1;
		});
	};

	const positionPopover = (): void => {
		if (!popover || !eraPrefix || popover.hidden) {
			return;
		}

		popover.dataset.placement = "below";
		const triggerRect = eraPrefix.getBoundingClientRect();
		const popRect = popover.getBoundingClientRect();
		const gap = 8;
		const spaceBelow = window.innerHeight - triggerRect.bottom - gap;
		if (spaceBelow < popRect.height && triggerRect.top > popRect.height + gap) {
			popover.dataset.placement = "above";
		}
	};

	const openPopover = (): void => {
		if (!popover || !eraPrefix || state.calendarMode !== "era" || state.queryMode !== "year") {
			return;
		}

		popoverOpen = true;
		popover.hidden = false;
		eraPrefix.setAttribute("aria-expanded", "true");
		syncEraOptions();
		positionPopover();
		const selected =
			eraOptions.find((option) => option.getAttribute("aria-selected") === "true") ??
			eraOptions[0];
		selected?.focus();
	};

	const syncCalendarMode = (): void => {
		root.querySelectorAll<HTMLElement>("[data-tyar-mode]").forEach((btn) => {
			const on = btn.getAttribute("data-tyar-mode") === state.calendarMode;
			btn.classList.toggle("is-active", on);
			btn.setAttribute("aria-pressed", on ? "true" : "false");
		});
		root.querySelectorAll<HTMLElement>("[data-tyar-field]").forEach((wrap) => {
			wrap.hidden = wrap.getAttribute("data-tyar-field") !== state.calendarMode;
		});
	};

	const syncQueryMode = (): void => {
		const isZodiac = state.queryMode === "zodiac";
		root.setAttribute("data-tyar-query-mode", isZodiac ? "zodiac" : "year");
		if (yearMode) yearMode.hidden = isZodiac;
		if (zodiacMode) zodiacMode.hidden = !isZodiac;
	};

	const syncFields = (): void => {
		syncQueryMode();
		syncCalendarMode();
		if (gregorianInput && gregorianInput.value !== state.gregorianRaw) {
			gregorianInput.value = state.gregorianRaw;
		}
		if (minguoInput && minguoInput.value !== state.minguoRaw) {
			minguoInput.value = state.minguoRaw;
		}
		if (eraInput && eraInput.value !== state.eraYearRaw) {
			eraInput.value = state.eraYearRaw;
		}
		if (eraPrefixLabel) {
			eraPrefixLabel.textContent = copy().eraNames[state.eraId];
		}
		if (zodiacSelect) {
			zodiacSelect.value = state.zodiacId;
			zodiacSelect.classList.toggle("is-placeholder", !state.zodiacId);
		}
		if (ageInput && ageInput.value !== state.ageRaw) {
			ageInput.value = state.ageRaw;
		}
		syncEraOptions();
	};

	const clearInvalid = (): void => {
		setInvalidField(gregorianField, false);
		setInvalidField(minguoField, false);
		setInvalidField(eraField, false);
		setInvalidField(zodiacField, false);
		setInvalidField(ageField, false);
	};

	const syncInvalid = (evaluation: TyarEvaluation): void => {
		clearInvalid();
		if (evaluation.status !== "invalid") {
			return;
		}

		if (state.queryMode === "zodiac") {
			if (evaluation.reason === "zodiac-unknown") {
				setInvalidField(zodiacField, true);
				return;
			}
			setInvalidField(ageField, true);
			return;
		}

		if (state.calendarMode === "minguo") {
			setInvalidField(minguoField, true);
			return;
		}
		if (state.calendarMode === "era") {
			const hint =
				evaluation.reason === "era-year-invalid"
					? formatTyarEraYearRangeHint(state.eraId, copy())
					: null;
			setInvalidField(eraField, true, hint);
			return;
		}
		setInvalidField(gregorianField, true);
	};

	const syncFixtureAttrs = (
		evaluation: TyarEvaluation,
		formatted: TyarFormattedResult,
	): void => {
		if (formatted.kind === "reverse") {
			root.setAttribute(
				"data-tyar-fixture",
				formatted.reverseView === "closest" ? "reverse" : "reverse-expanded",
			);
			root.setAttribute(
				"data-tyar-reverse-primary",
				formatted.reverseView === "closest" ? "closest" : "short",
			);
			root.removeAttribute("data-tyar-primary-tier");
			return;
		}

		root.removeAttribute("data-tyar-reverse-primary");

		if (formatted.kind === "exact") {
			root.setAttribute("data-tyar-fixture", "live");
			const isComposite = splitDualPrimary(formatted.primary) !== null;
			const isLongComposite =
				isComposite &&
				evaluation.status === "valid" &&
				evaluation.result.kind === "exact" &&
				evaluation.result.minguo.type === "before";
			if (isLongComposite) {
				root.setAttribute("data-tyar-primary-tier", "long");
			} else if (!isComposite) {
				root.setAttribute("data-tyar-primary-tier", "single-short");
			} else {
				root.removeAttribute("data-tyar-primary-tier");
			}
			return;
		}

		root.setAttribute("data-tyar-fixture", "initial");
		root.removeAttribute("data-tyar-primary-tier");
	};

	const syncReverseChips = (formatted: TyarFormattedResult): void => {
		const isReverse = formatted.kind === "reverse";
		if (navEl) {
			navEl.hidden = !isReverse;
		}

		if (!isReverse) {
			setChip(desktopPrev, { hidden: true, year: null, label: "", current: false, view: null });
			setChip(desktopCurrent, { hidden: true, year: null, label: "", current: false, view: null });
			setChip(desktopNext, { hidden: true, year: null, label: "", current: false, view: null });
			setChip(landscapePrev, { hidden: true, year: null, label: "", current: false, view: null });
			setChip(landscapeNext, { hidden: true, year: null, label: "", current: false, view: null });
			return;
		}

		const previousYear = formatted.previousYear;
		const closestYear = formatted.closestYear;
		const nextYear = formatted.nextYear;
		const view = formatted.reverseView ?? "closest";

		if (view === "closest") {
			setChip(desktopPrev, {
				hidden: previousYear === null,
				year: previousYear,
				label: previousYear === null ? "" : String(previousYear),
				current: false,
				view: "previous",
			});
			setChip(desktopCurrent, {
				hidden: true,
				year: null,
				label: "",
				current: false,
				view: null,
			});
			setChip(desktopNext, {
				hidden: nextYear === null,
				year: nextYear,
				label: nextYear === null ? "" : String(nextYear),
				current: false,
				view: "next",
			});
			setChip(landscapePrev, {
				hidden: previousYear === null,
				year: previousYear,
				label: previousYear === null ? "" : String(previousYear),
				current: false,
				view: "previous",
			});
			setChip(landscapeNext, {
				hidden: nextYear === null,
				year: nextYear,
				label: nextYear === null ? "" : String(nextYear),
				current: false,
				view: "next",
			});
			return;
		}

		if (view === "previous") {
			setChip(desktopPrev, {
				hidden: previousYear === null,
				year: previousYear,
				label: previousYear === null ? "" : String(previousYear),
				current: true,
				view: null,
			});
			setChip(desktopCurrent, {
				hidden: closestYear === null,
				year: closestYear,
				label: closestYear === null ? "" : String(closestYear),
				current: false,
				view: "closest",
			});
			setChip(desktopNext, {
				hidden: nextYear === null,
				year: nextYear,
				label: nextYear === null ? "" : String(nextYear),
				current: false,
				view: "next",
			});
			setChip(landscapePrev, {
				hidden: previousYear === null,
				year: previousYear,
				label: previousYear === null ? "" : String(previousYear),
				current: true,
				view: null,
			});
			setChip(landscapeNext, {
				hidden: closestYear === null,
				year: closestYear,
				label: closestYear === null ? "" : String(closestYear),
				current: false,
				view: "closest",
			});
			return;
		}

		setChip(desktopPrev, {
			hidden: previousYear === null,
			year: previousYear,
			label: previousYear === null ? "" : String(previousYear),
			current: false,
			view: "previous",
		});
		setChip(desktopCurrent, {
			hidden: closestYear === null,
			year: closestYear,
			label: closestYear === null ? "" : String(closestYear),
			current: false,
			view: "closest",
		});
		setChip(desktopNext, {
			hidden: nextYear === null,
			year: nextYear,
			label: nextYear === null ? "" : String(nextYear),
			current: true,
			view: null,
		});
		setChip(landscapePrev, {
			hidden: closestYear === null,
			year: closestYear,
			label: closestYear === null ? "" : String(closestYear),
			current: false,
			view: "closest",
		});
		setChip(landscapeNext, {
			hidden: nextYear === null,
			year: nextYear,
			label: nextYear === null ? "" : String(nextYear),
			current: true,
			view: null,
		});
	};

	const renderResult = (): void => {
		const evaluation = evaluateTyarState(state);
		const formatted = formatTaiwanYearAge(evaluation, readLocale(root), copy());
		const isReverse = formatted.kind === "reverse";
		const weekday = isReverse
			? [formatted.eraLine, formatted.stemLine].filter(Boolean).join("\n") || null
			: formatted.secondary;

		if (resultRoot) {
			updateResultSummary(resultRoot, {
				content: "textual",
				primary: {
					text: formatted.primary,
					ariaLabel: formatted.primary,
				},
				weekday,
				support: null,
			});
			decoratePrimaryPipe(resultRoot, formatted.primary);
			if (isReverse) {
				decorateReverseWeekday(resultRoot, formatted.eraLine, formatted.stemLine);
			}
		}

		if (leadEl) {
			leadEl.hidden = formatted.kind !== null;
		}
		if (thenEl) {
			const thenTaiwan = formatted.thenTaiwan;
			thenEl.textContent = thenTaiwan ?? "";
			thenEl.hidden = !thenTaiwan;
		}

		syncFixtureAttrs(evaluation, formatted);
		if (
			resultRoot &&
			formatted.kind === "exact" &&
			root.getAttribute("data-tyar-primary-tier") === "single-short"
		) {
			const host =
				resultRoot.closest<HTMLElement>(".tyar-result-host") ?? resultRoot;
			root.setAttribute("data-tyar-primary-tier", exactSinglePrimaryTier(resultRoot, host));
		}
		syncReverseChips(formatted);
		syncFields();
		syncInvalid(evaluation);
	};

	const selectEra = (eraId: string, restoreFocus = true): void => {
		state = setTyarEraId(state, eraId);
		closePopover(restoreFocus);
		renderResult();
	};

	root.querySelectorAll<HTMLButtonElement>("[data-tyar-mode]").forEach((btn) => {
		btn.addEventListener("click", (event) => {
			event.preventDefault();
			closePopover();
			const next = btn.getAttribute("data-tyar-mode") as TyarCalendarMode | null;
			if (!next) {
				return;
			}
			state = switchTyarCalendarMode(state, next);
			renderResult();
		});
	});

	root.querySelectorAll<HTMLButtonElement>("[data-tyar-query-switch]").forEach((btn) => {
		btn.addEventListener("click", (event) => {
			event.preventDefault();
			closePopover();
			const next = btn.getAttribute("data-tyar-query-switch");
			if (next !== "year" && next !== "zodiac") {
				return;
			}
			state = setTyarQueryMode(state, next);
			renderResult();
		});
	});

	if (gregorianInput) {
		bindYearDigitCap(gregorianInput, TYAR_GREGORIAN_MAX_DIGITS, (value) => {
			state = setTyarGregorianRaw(state, value);
			renderResult();
		});
	}
	if (minguoInput) {
		bindYearDigitCap(minguoInput, TYAR_MINGUO_MAX_DIGITS, (value) => {
			state = setTyarMinguoRaw(state, value);
			renderResult();
		});
	}
	if (eraInput) {
		bindYearDigitCap(eraInput, TYAR_ERA_MAX_DIGITS, (value) => {
			state = setTyarEraYearRaw(state, value);
			renderResult();
		});
	}
	if (ageInput) {
		bindYearDigitCap(ageInput, TYAR_AGE_MAX_DIGITS, (value) => {
			state = setTyarAgeRaw(state, value);
			renderResult();
		});
	}

	zodiacSelect?.addEventListener("change", () => {
		state = setTyarZodiacId(state, zodiacSelect.value);
		renderResult();
	});

	resetButton?.addEventListener("click", (event) => {
		event.preventDefault();
		closePopover();
		state = resetTyarState();
		renderResult();
	});

	const onChipClick = (event: Event): void => {
		const button = event.currentTarget;
		if (!(button instanceof HTMLButtonElement) || button.disabled) {
			return;
		}
		event.preventDefault();
		const view = button.getAttribute("data-tyar-chip-view");
		if (view !== "previous" && view !== "closest" && view !== "next") {
			return;
		}
		state = setTyarReverseView(state, view);
		renderResult();
	};

	[desktopPrev, desktopCurrent, desktopNext, landscapePrev, landscapeNext].forEach((chip) => {
		chip?.addEventListener("click", onChipClick);
	});

	eraPrefix?.addEventListener("click", (event) => {
		event.preventDefault();
		if (popoverOpen) {
			closePopover();
			return;
		}
		openPopover();
	});

	eraPrefix?.addEventListener("keydown", (event) => {
		if (
			event.key === "ArrowDown" ||
			event.key === "ArrowUp" ||
			event.key === "Enter" ||
			event.key === " "
		) {
			event.preventDefault();
			if (!popoverOpen) {
				openPopover();
			}
		}
	});

	eraOptions.forEach((option, index) => {
		option.addEventListener("click", (event) => {
			event.preventDefault();
			selectEra(option.getAttribute("data-tyar-era-option") || "reiwa");
		});

		option.addEventListener("keydown", (event) => {
			if (event.key === "Escape") {
				event.preventDefault();
				closePopover(true);
				return;
			}
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				selectEra(option.getAttribute("data-tyar-era-option") || "reiwa");
				return;
			}
			if (event.key === "Home") {
				event.preventDefault();
				eraOptions[0]?.focus();
				return;
			}
			if (event.key === "End") {
				event.preventDefault();
				eraOptions[eraOptions.length - 1]?.focus();
				return;
			}
			if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
				return;
			}
			event.preventDefault();
			const delta = event.key === "ArrowDown" ? 1 : -1;
			const next = (index + delta + eraOptions.length) % eraOptions.length;
			eraOptions[next]?.focus();
		});
	});

	document.addEventListener("pointerdown", (event) => {
		if (!popoverOpen) {
			return;
		}
		const target = event.target;
		if (!(target instanceof Node)) {
			return;
		}
		if (popover?.contains(target) || eraPrefix?.contains(target)) {
			return;
		}
		closePopover();
	});

	document.addEventListener("keydown", (event) => {
		if (event.key === "Escape" && popoverOpen) {
			event.preventDefault();
			closePopover(true);
		}
	});

	window.addEventListener("resize", () => {
		if (popoverOpen) {
			positionPopover();
		}
	});

	const applyState = (next: TyarPageState): void => {
		state = next;
		renderResult();
	};

	renderResult();

	return {
		getState: () => state,
		applyState,
	};
}

const ameSessions = new WeakMap<HTMLElement, { destroy: () => void }>();

/**
 * B2C AME live：共用 B2A evaluate／format 與同一 renderResult()。
 * Reset 保持 Editor 開啟；Done／Escape／underlay 不 rollback。
 */
function initAme(
	root: HTMLElement,
	session: {
		getState: () => TyarPageState;
		applyState: (next: TyarPageState) => void;
	},
): void {
	const pageContent = root.querySelector<HTMLElement>("[data-ame-page-content]");
	const ameRoot = root.querySelector<HTMLElement>("[data-ame-root]");
	const trigger = root.querySelector<HTMLElement>("[data-tyar-capsule]");

	if (!pageContent || !ameRoot || ameSessions.has(root)) {
		return;
	}

	const locale = () => readLocale(root);
	const copy = () => formatCopy(locale());

	const ameApi = createAdaptiveMobileEditor<TyarAmeDraft>(ameRoot, {
		pageContent,
		numericFields: TYAR_AME_NUMERIC_FIELDS,
		adapter: {
			lifecycle: "live",
			getCommitted: () => cloneTyarAmeDraft(draftFromState(session.getState())),
			createOpenDraft: (committed) => cloneTyarAmeDraft(committed),
			getResetDraft: () => cloneTyarAmeDraft(tyarAmeResetDraft()),
			validate: (draft) => validateTyarAmeDraft(draft, copy(), session.getState()),
			acceptNumericCandidate: ({ fieldId, candidateValue, draft }) =>
				acceptTyarAmeNumericCandidate({ fieldId, candidateValue, draft }),
			onCommit: (committed) => {
				session.applyState(stateFromDraft(committed, session.getState()));
			},
			onDraftChange: (draft) => {
				syncTyarAmeUi(root, draft, copy(), session.getState());
			},
		},
		onSyncUi: (draft) => {
			syncTyarAmeUi(root, draft, copy(), session.getState());
		},
	});

	const unbindInteractions = bindTyarAmeInteractions(ameRoot, {
		getDraft: () => ameApi.getDraft(),
		patchDraft: (partial) => ameApi.patchDraft(partial),
		clearActiveField: () => ameApi.clearActiveField(),
		isOpen: () => ameApi.isOpen(),
	});

	trigger?.addEventListener("click", (event) => {
		event.preventDefault();
		ameApi.open(trigger);
	});

	ameSessions.set(root, {
		destroy: () => {
			unbindInteractions();
			ameApi.destroy();
			ameSessions.delete(root);
		},
	});

	window.addEventListener(
		"pagehide",
		() => {
			ameSessions.get(root)?.destroy();
		},
		{ once: true },
	);

	if (new URLSearchParams(window.location.search).get("tyarSheet") === "open") {
		ameApi.open(trigger ?? undefined);
	}
}

function initRoot(root: HTMLElement): void {
	const session = initDesktopInteraction(root);
	initAme(root, session);
}

function boot(): void {
	initResultSummary();
	document
		.querySelectorAll<HTMLElement>("[data-taiwan-year-age-reference-v2]")
		.forEach((root) => initRoot(root));
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
	boot();
}
