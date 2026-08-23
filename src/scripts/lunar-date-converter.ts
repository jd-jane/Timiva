/**
 * Lunar Date Converter — B2B Desktop interaction.
 * SSOT: actualCivil (committed Gregorian date).
 * No LocalStorage. Mobile capsule stays disabled（B2D）.
 */
import { init as initResultSummary } from "./result-summary-controller.ts";
import {
	createGregorianDateController,
	type GregorianFieldSnapshot,
	type LunarGregorianDateController,
} from "../lib/lunarDateConverterGregorianInput.ts";
import {
	createCompositionGuard,
	setCompositionActive,
	shouldDeferInputWhileComposing,
} from "../lib/lunarDateConverterGregorianInput.ts";
import {
	evaluateLunarInput,
	formatLunarInputDisplayForLocale,
	type LunarFieldStatus,
} from "../lib/lunarDateConverterLunarInput.ts";
import {
	civilFromLunarInput,
	deriveResultPresentation,
	getLocalTodayCivil,
	type InputMode,
} from "../lib/lunarDateConverterEvaluate.ts";
import {
	createLunarCalendarAdapter,
	type LunarCalendarAdapter,
} from "../lib/lunarDateConverterCalendarAdapter.ts";
import { gregorianToLunar } from "../lib/lunar/index.ts";
import type { CivilDate } from "../lib/lunar/lunarTypes.ts";

type Locale = "en" | "zh";

type FieldPhase = "draft-incomplete" | "draft-complete-invalid" | "committed-valid";

type ToolCopy = {
	resetLabel: string;
	errorUnrecognized: string;
	errorOutOfRange: string;
	errorInvalidDate: string;
	errorInvalidLeap: string;
	errorInvalidDay: string;
	errorUnsupportedLeapTypo: string;
};

const initialized = new WeakSet<HTMLElement>();

function getLocale(root: HTMLElement): Locale {
	return root.getAttribute("data-ldcv2-locale") === "zh" ? "zh" : "en";
}

function readCopy(root: HTMLElement): ToolCopy {
	return {
		resetLabel: root.dataset.ldcv2CopyReset ?? "Reset",
		errorUnrecognized: root.dataset.ldcv2CopyErrorUnrecognized ?? "Invalid date format",
		errorOutOfRange: root.dataset.ldcv2CopyErrorOutOfRange ?? "Year must be 1901–2099",
		errorInvalidDate: root.dataset.ldcv2CopyErrorInvalidDate ?? "Invalid date",
		errorInvalidLeap: root.dataset.ldcv2CopyErrorInvalidLeap ?? "Invalid leap month",
		errorInvalidDay: root.dataset.ldcv2CopyErrorInvalidDay ?? "Invalid day for this month",
		errorUnsupportedLeapTypo:
			root.dataset.ldcv2CopyErrorUnsupportedLeapTypo ?? "Use 閏 for leap month",
	};
}

function errorMessage(copy: ToolCopy, code: string | null): string {
	switch (code) {
		case "out-of-public-range":
			return copy.errorOutOfRange;
		case "invalid-leap-month":
			return copy.errorInvalidLeap;
		case "invalid-lunar-day":
			return copy.errorInvalidDay;
		case "invalid-lunar-date":
			return copy.errorInvalidDate;
		case "unsupported-leap-typo":
			return copy.errorUnsupportedLeapTypo;
		case "unrecognized-format":
		default:
			return copy.errorUnrecognized;
	}
}

function dispatchResult(
	root: HTMLElement,
	actualCivil: CivilDate,
	inputMode: InputMode,
	locale: Locale,
	invalid: boolean,
): void {
	const resultSummary = root.querySelector<HTMLElement>("[data-result-summary]");
	if (!resultSummary) {
		return;
	}

	const presentation = deriveResultPresentation(actualCivil, inputMode, locale, {
		invalid,
	});

	resultSummary.dispatchEvent(
		new CustomEvent("rs:update", {
			detail: {
				content: "textual",
				primary: {
					text: presentation.primaryText,
					ariaLabel: presentation.primaryAria,
				},
				weekday: presentation.weekday,
				support: null,
			},
		}),
	);
}

function applyInputModeUi(root: HTMLElement, mode: InputMode): void {
	root.setAttribute("data-ldcv2-input-mode", mode);

	const switchToLunar = root.querySelector<HTMLElement>('[data-ldcv2-switch="lunar"]');
	const switchToGregorian = root.querySelector<HTMLElement>(
		'[data-ldcv2-switch="gregorian"]',
	);
	const calendarToggle = root.querySelector<HTMLElement>("[data-ldcv2-calendar-toggle]");

	if (switchToLunar) {
		switchToLunar.hidden = mode !== "gregorian";
	}
	if (switchToGregorian) {
		switchToGregorian.hidden = mode !== "lunar";
	}
	if (calendarToggle) {
		calendarToggle.hidden = mode !== "gregorian";
	}
}

function syncFieldError(
	root: HTMLElement,
	phase: FieldPhase,
	errorText: string,
): void {
	const input = root.querySelector<HTMLInputElement>("[data-ldcv2-date-input]");
	const invalidIcon = root.querySelector<HTMLElement>("[data-ldcv2-field-invalid]");
	const errorEl = root.querySelector<HTMLElement>("[data-ldcv2-field-error]");

	const showError = phase === "draft-complete-invalid";
	root.setAttribute("data-ldcv2-field-phase", phase);

	if (input) {
		input.setAttribute("aria-invalid", showError ? "true" : "false");
	}

	if (invalidIcon) {
		invalidIcon.hidden = !showError;
		invalidIcon.setAttribute("aria-hidden", showError ? "false" : "true");
	}

	if (errorEl) {
		errorEl.hidden = !showError;
		errorEl.textContent = showError ? errorText : "";
	}
}

function initRoot(root: HTMLElement): void {
	if (initialized.has(root)) {
		return;
	}
	initialized.add(root);

	const locale = getLocale(root);
	const copy = readCopy(root);
	const input = root.querySelector<HTMLInputElement>("[data-ldcv2-date-input]");
	const calendarHost = root.querySelector<HTMLElement>("[data-ldcv2-calendar-host]");
	const calendarToggle = root.querySelector<HTMLButtonElement>(
		"[data-ldcv2-calendar-toggle]",
	);
	const capsule = root.querySelector<HTMLElement>("[data-ldcv2-date-capsule]");
	const resetButton = root.querySelector<HTMLButtonElement>("[data-ldcv2-reset]");
	const switchToLunar = root.querySelector<HTMLButtonElement>('[data-ldcv2-switch="lunar"]');
	const switchToGregorian = root.querySelector<HTMLButtonElement>(
		'[data-ldcv2-switch="gregorian"]',
	);

	if (!input || !capsule) {
		return;
	}

	let actualCivil: CivilDate = getLocalTodayCivil();
	let inputMode: InputMode = "gregorian";
	let fieldPhase: FieldPhase = "committed-valid";
	let lunarDraftText = "";
	let calendarAdapter: LunarCalendarAdapter | null = null;
	let gregorianController: LunarGregorianDateController | null = null;
	const calendarListeners = new Set<() => void>();

	const notifyCalendar = () => {
		for (const listener of calendarListeners) {
			listener();
		}
	};

	const composition = createCompositionGuard();

	const syncCommittedResult = (invalid = false) => {
		dispatchResult(root, actualCivil, inputMode, locale, invalid);
	};

	const repopulateInputFromActual = () => {
		if (inputMode === "gregorian") {
			gregorianController?.setDate(actualCivil);
			const snap = gregorianController?.getSnapshot();
			if (snap) {
				input.value = snap.normalizedDisplay;
			}
			return;
		}

		const lunarResult = gregorianToLunar(actualCivil);
		if (lunarResult.ok) {
			input.value = formatLunarInputDisplayForLocale(lunarResult.value, locale);
			lunarDraftText = input.value;
		}
	};

	const commitGregorianSnapshot = (
		snapshot: GregorianFieldSnapshot,
		options: { commitAttempt: boolean },
	) => {
		if (snapshot.status === "valid" && snapshot.date) {
			actualCivil = snapshot.date;
			fieldPhase = "committed-valid";
			syncFieldError(root, fieldPhase, "");
			syncCommittedResult(false);
			notifyCalendar();
			return;
		}

		if (snapshot.status === "incomplete" || snapshot.status === "empty") {
			fieldPhase = "draft-incomplete";
			syncFieldError(root, fieldPhase, "");
			syncCommittedResult(false);
			return;
		}

		if (options.commitAttempt) {
			fieldPhase = "draft-complete-invalid";
			syncFieldError(root, fieldPhase, copy.errorInvalidDate);
			syncCommittedResult(true);
			return;
		}

		fieldPhase = "draft-incomplete";
		syncFieldError(root, fieldPhase, "");
		syncCommittedResult(false);
	};

	const commitLunarText = (text: string, commitAttempt: boolean) => {
		lunarDraftText = text;
		const evaluated = evaluateLunarInput(text, { commit: commitAttempt });

		if (evaluated.status === "valid" && evaluated.lunar) {
			const civil = civilFromLunarInput(evaluated.lunar);
			if (civil) {
				actualCivil = civil;
				fieldPhase = "committed-valid";
				syncFieldError(root, fieldPhase, "");
				syncCommittedResult(false);
				return;
			}
		}

		if (
			evaluated.status === "empty" ||
			evaluated.status === "incomplete" ||
			(!commitAttempt && evaluated.status === "invalid")
		) {
			fieldPhase = "draft-incomplete";
			syncFieldError(root, fieldPhase, "");
			syncCommittedResult(false);
			return;
		}

		fieldPhase = "draft-complete-invalid";
		syncFieldError(
			root,
			fieldPhase,
			errorMessage(copy, evaluated.errorCode),
		);
		syncCommittedResult(true);
	};

	const performModeSwitch = (nextMode: InputMode) => {
		if (nextMode === inputMode) {
			return;
		}

		calendarAdapter?.close();
		inputMode = nextMode;
		fieldPhase = "committed-valid";
		applyInputModeUi(root, inputMode);
		input.placeholder =
			nextMode === "gregorian"
				? (root.dataset.ldcv2GregorianPlaceholder ?? "")
				: (root.dataset.ldcv2LunarPlaceholder ?? "");
		input.setAttribute(
			"aria-label",
			nextMode === "gregorian"
				? (root.dataset.ldcv2GregorianAria ?? "")
				: (root.dataset.ldcv2LunarAria ?? ""),
		);
		input.inputMode = nextMode === "gregorian" ? "numeric" : "text";
		repopulateInputFromActual();
		syncFieldError(root, "committed-valid", "");
		syncCommittedResult(false);
	};

	/* —— Gregorian controller + calendar —— */
	gregorianController = createGregorianDateController();

	const dateSource = {
		getDate: () => actualCivil,
		setDate: (date: CivilDate) => {
			actualCivil = date;
			gregorianController?.setDate(date);
			const snap = gregorianController!.getSnapshot();
			input.value = snap.normalizedDisplay;
			fieldPhase = "committed-valid";
			syncFieldError(root, fieldPhase, "");
			syncCommittedResult(false);
			notifyCalendar();
		},
		subscribe: (listener: () => void) => {
			calendarListeners.add(listener);
			return () => calendarListeners.delete(listener);
		},
	};

	if (calendarHost && calendarToggle) {
		calendarAdapter = createLunarCalendarAdapter({
			host: calendarHost,
			trigger: calendarToggle,
			anchor: capsule,
			dateSource,
			intlLocale: locale === "zh" ? "zh-Hant" : "en-US",
		});
	}

	/* Init defaults */
	applyInputModeUi(root, inputMode);
	gregorianController.setDate(actualCivil);
	input.value = gregorianController.getSnapshot().normalizedDisplay;
	syncCommittedResult(false);

	input.readOnly = false;
	input.inputMode = inputMode === "gregorian" ? "numeric" : "text";
	input.autocomplete = "off";
	input.spellcheck = false;

	input.addEventListener("compositionstart", () => {
		setCompositionActive(composition, true);
	});

	input.addEventListener("compositionend", () => {
		setCompositionActive(composition, false);
	});

	input.addEventListener("beforeinput", (event) => {
		if (shouldDeferInputWhileComposing(composition)) {
			return;
		}

		if (inputMode !== "gregorian") {
			return;
		}

		const inputEvent = event as InputEvent;
		const inputType = inputEvent.inputType;
		const selectionStart = input.selectionStart ?? 0;
		const selectionEnd = input.selectionEnd ?? selectionStart;

		if (
			inputType === "insertText" &&
			inputEvent.data &&
			!/^[\d/-]$/.test(inputEvent.data)
		) {
			event.preventDefault();
			return;
		}

		if (
			inputType === "insertText" ||
			inputType === "deleteContentBackward" ||
			inputType === "deleteContentForward"
		) {
			event.preventDefault();
			if (!gregorianController) {
				return;
			}
			const { snapshot, caret } = gregorianController.applyInputChange(
				inputType,
				inputEvent.data,
				selectionStart,
				selectionEnd,
			);
			input.value = snapshot.display;
			if (snapshot.status === "valid" && snapshot.date) {
				const committed = gregorianController.commitNormalize();
				input.value = committed.normalizedDisplay;
				commitGregorianSnapshot(committed, { commitAttempt: true });
			} else {
				commitGregorianSnapshot(snapshot, { commitAttempt: false });
			}
			if (document.activeElement === input) {
				const len = input.value.length;
				const next = Math.max(0, Math.min(caret, len));
				input.setSelectionRange(next, next);
			}
		}
	});

	input.addEventListener("input", () => {
		if (inputMode !== "lunar") {
			return;
		}
		commitLunarText(input.value, false);
	});

	input.addEventListener("paste", (event) => {
		if (shouldDeferInputWhileComposing(composition)) {
			event.preventDefault();
			return;
		}

		event.preventDefault();
		const text = event.clipboardData?.getData("text") ?? "";

		if (inputMode === "gregorian" && gregorianController) {
			const { snapshot, caret } = gregorianController.applyPaste(text);
			if (snapshot.status === "valid") {
				const committed = gregorianController.commitNormalize();
				input.value = committed.normalizedDisplay;
				commitGregorianSnapshot(committed, { commitAttempt: true });
			} else {
				input.value = snapshot.display;
				commitGregorianSnapshot(snapshot, { commitAttempt: false });
				if (document.activeElement === input) {
					input.setSelectionRange(caret, caret);
				}
			}
			return;
		}

		input.value = text;
		commitLunarText(text, true);
	});

	input.addEventListener("blur", () => {
		if (inputMode === "gregorian" && gregorianController) {
			const snapshot = gregorianController.commitNormalize();
			input.value = snapshot.normalizedDisplay;
			commitGregorianSnapshot(snapshot, { commitAttempt: true });
			return;
		}
		commitLunarText(input.value, true);
	});

	input.addEventListener("keydown", (event) => {
		if (event.key !== "Enter") {
			return;
		}
		event.preventDefault();
		if (inputMode === "gregorian" && gregorianController) {
			const snapshot = gregorianController.commitNormalize();
			input.value = snapshot.normalizedDisplay;
			commitGregorianSnapshot(snapshot, { commitAttempt: true });
		} else {
			commitLunarText(input.value, true);
		}
		input.blur();
	});

	for (const btn of [switchToLunar, switchToGregorian]) {
		btn?.addEventListener("mousedown", (event) => {
			/* 避免 blur 在 click 前先 commit draft（含 incomplete invalid）. */
			event.preventDefault();
		});
	}

	switchToLunar?.addEventListener("click", (event) => {
		event.preventDefault();
		performModeSwitch("lunar");
	});

	switchToGregorian?.addEventListener("click", (event) => {
		event.preventDefault();
		performModeSwitch("gregorian");
	});

	resetButton?.addEventListener("click", (event) => {
		event.preventDefault();
		calendarAdapter?.close();

		const active = document.activeElement;
		if (
			active instanceof HTMLElement &&
			root.contains(active) &&
			typeof active.blur === "function"
		) {
			active.blur();
		}

		actualCivil = getLocalTodayCivil();
		inputMode = "gregorian";
		fieldPhase = "committed-valid";
		lunarDraftText = "";
		applyInputModeUi(root, inputMode);
		input.inputMode = "numeric";
		input.placeholder = root.dataset.ldcv2GregorianPlaceholder ?? "";
		input.setAttribute("aria-label", root.dataset.ldcv2GregorianAria ?? "");
		gregorianController?.setDate(actualCivil);
		input.value = gregorianController?.getSnapshot().normalizedDisplay ?? "";
		syncFieldError(root, "committed-valid", "");
		syncCommittedResult(false);
	});

	window.addEventListener(
		"pagehide",
		() => {
			calendarAdapter?.destroy();
			gregorianController?.destroy();
		},
		{ once: true },
	);
}

function boot(): void {
	initResultSummary();
	document
		.querySelectorAll<HTMLElement>("[data-lunar-date-converter-v2]")
		.forEach((root) => initRoot(root));
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", boot);
} else {
	boot();
}

export { initRoot as initLunarDateConverter };
