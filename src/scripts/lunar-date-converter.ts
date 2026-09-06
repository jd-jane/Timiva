/**
 * Lunar Date Converter — B2B Desktop + B2D Mobile AME.
 * SSOT: actualCivil (committed Gregorian date).
 * No LocalStorage. Mobile AME lifecycle = live（picker 即時更新；Done 只關）.
 */
import { init as initResultSummary } from "./result-summary-controller.ts";
import {
	createAdaptiveMobileEditor,
	type AdaptiveMobileEditorController,
} from "./adaptive-mobile-editor-controller.ts";
import {
	bindLdcAmeInteractions,
	cloneLdcAmeDraft,
	draftFromCommitted,
	ldcAmeResetDraft,
	resolveLdcAmeDraft,
	syncLdcAmeUi,
	validateLdcAmeDraft,
	type LdcAmeDraft,
} from "./lunar-date-converter-ame-adapter.ts";
import {
	createGregorianDateController,
	classifyGregorianInvalid,
	type GregorianFieldSnapshot,
	type LunarGregorianDateController,
} from "../lib/lunarDateConverterGregorianInput.ts";
import {
	createCompositionGuard,
	setCompositionActive,
	shouldDeferInputWhileComposing,
} from "../lib/lunarDateConverterGregorianInput.ts";
import {
	createLunarNumericFieldController,
	evaluateLunarInput,
	formatLunarInputDisplayForLocale,
	isLunarNumericDraftText,
	type LunarNumericFieldController,
	type LunarNumericFieldSnapshot,
} from "../lib/lunarDateConverterLunarInput.ts";
import {
	civilFromLunarInput,
	deriveResultPresentation,
	getLocalTodayCivil,
	lunarFromActualCivil,
	resolveEnLunarDesktopRsComposition,
	type InputMode,
	type ResultRsComposition,
	type ResultRsLayout,
} from "../lib/lunarDateConverterEvaluate.ts";
import { buildLunarResultParts } from "../lib/lunar/lunarFormat.ts";
import {
	createLunarCalendarAdapter,
	type LunarCalendarAdapter,
} from "../lib/lunarDateConverterCalendarAdapter.ts";
import {
	createLunarPickerAdapter,
	type LunarPickerAdapter,
} from "../lib/lunarDateConverterLunarCalendarAdapter.ts";
import { gregorianToLunar } from "../lib/lunar/index.ts";
import type { CivilDate, LunarDate } from "../lib/lunar/lunarTypes.ts";

type Locale = "en" | "zh";

type FieldPhase = "draft-incomplete" | "draft-complete-invalid" | "committed-valid";

type FieldErrorPattern = "indicator-only" | "with-message";

type ToolCopy = {
	resetLabel: string;
	errorUnrecognized: string;
	errorOutOfRange: string;
	errorInvalidDate: string;
	errorInvalidLeap: string;
	errorInvalidDay: string;
	errorUnsupportedLeapTypo: string;
	errorIncomplete: string;
};

const initialized = new WeakSet<HTMLElement>();
const ameSessions = new WeakMap<HTMLElement, { destroy: () => void }>();

declare global {
	interface Window {
		TimivaLunarDateConverterLayout?: {
			DESKTOP_MQ: string;
			LANDSCAPE_MQ: string;
			isDesktopInputComposition?: (win?: Window) => boolean;
			applyLayoutAttrs?: (doc?: Document) => void;
			bindLayoutListeners?: () => void;
			resolveLayoutMode?: (win?: Window) => string;
		};
	}
}

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
		errorIncomplete: root.dataset.ldcv2CopyErrorIncomplete ?? "Enter a complete date",
	};
}

function errorPresentationPattern(
	source: InputMode,
	code: string | null,
): FieldErrorPattern {
	if (source === "gregorian") {
		return "indicator-only";
	}

	switch (code) {
		case "out-of-public-range":
		case "invalid-leap-month":
		case "invalid-lunar-day":
		case "unsupported-leap-typo":
			return "with-message";
		case "unrecognized-format":
		case "invalid-lunar-date":
		default:
			return "indicator-only";
	}
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

function readResultRsLayout(root: HTMLElement): ResultRsLayout | null {
	const layout = root
		.querySelector("[data-result-summary]")
		?.getAttribute("data-rs-layout");
	if (layout === "desktop" || layout === "portrait" || layout === "landscape") {
		return layout;
	}
	return null;
}

function applyRsComposition(root: HTMLElement, composition: ResultRsComposition | null): void {
	if (composition === "constrained") {
		root.setAttribute("data-ldcv2-rs-composition", "constrained");
		return;
	}
	if (composition === "wide") {
		root.setAttribute("data-ldcv2-rs-composition", "wide");
		return;
	}
	root.removeAttribute("data-ldcv2-rs-composition");
}

function measurePrimaryTextWidth(root: HTMLElement, text: string): number {
	const primary = root.querySelector<HTMLElement>('[data-rs-value="primary"]');
	if (!primary) {
		return 0;
	}
	const style = getComputedStyle(primary);
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		return text.length * (parseFloat(style.fontSize) || 16) * 0.55;
	}
	ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
	return ctx.measureText(text).width;
}

function resolveRsCompositionForDispatch(
	root: HTMLElement,
	actualCivil: CivilDate,
	inputMode: InputMode,
	locale: Locale,
	rsLayout: ResultRsLayout | null,
	invalid: boolean,
): ResultRsComposition | null {
	if (invalid || locale !== "en" || inputMode !== "gregorian" || rsLayout !== "desktop") {
		return null;
	}
	const lunar = lunarFromActualCivil(actualCivil);
	if (!lunar) {
		return "wide";
	}
	const parts = buildLunarResultParts(lunar, actualCivil);
	const host = root.querySelector<HTMLElement>(".ldcv2-result-host");
	const hostWidth = host?.getBoundingClientRect().width ?? 0;
	if (hostWidth <= 0) {
		return "wide";
	}

	applyRsComposition(root, "wide");
	const textWidth = measurePrimaryTextWidth(root, parts.enPrimary);
	return resolveEnLunarDesktopRsComposition({
		hostWidthPx: hostWidth,
		textWidthPx: textWidth,
	});
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

	const rsLayout = readResultRsLayout(root);
	const rsComposition = resolveRsCompositionForDispatch(
		root,
		actualCivil,
		inputMode,
		locale,
		rsLayout,
		invalid,
	);
	applyRsComposition(root, rsComposition);

	const presentation = deriveResultPresentation(actualCivil, inputMode, locale, {
		invalid,
		rsLayout,
		rsComposition,
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
	const gregorianCalendarHost = root.querySelector<HTMLElement>(
		"[data-ldcv2-calendar-host-gregorian]",
	);
	const lunarCalendarHost = root.querySelector<HTMLElement>(
		"[data-ldcv2-calendar-host-lunar]",
	);

	if (switchToLunar) {
		switchToLunar.hidden = mode !== "gregorian";
	}
	if (switchToGregorian) {
		switchToGregorian.hidden = mode !== "lunar";
	}
	if (gregorianCalendarHost) {
		gregorianCalendarHost.hidden = mode !== "gregorian";
	}
	if (lunarCalendarHost) {
		lunarCalendarHost.hidden = mode !== "lunar";
	}
	if (calendarToggle) {
		calendarToggle.hidden = false;
		calendarToggle.setAttribute(
			"aria-controls",
			mode === "gregorian" ? "ldc-sdc" : "ldc-lc",
		);
	}
}

function syncFieldError(
	root: HTMLElement,
	phase: FieldPhase,
	options: { pattern?: FieldErrorPattern; message?: string } = {},
): void {
	const input = root.querySelector<HTMLInputElement>("[data-ldcv2-date-input]");
	const errorWrap = root.querySelector<HTMLElement>("[data-ldcv2-field-error-wrap]");
	const errorText = root.querySelector<HTMLElement>("[data-ldcv2-field-error-text]");

	const showError = phase === "draft-complete-invalid";
	const showMessage = showError && options.pattern === "with-message" && options.message;
	root.setAttribute("data-ldcv2-field-phase", phase);

	if (input) {
		input.setAttribute("aria-invalid", showError ? "true" : "false");
		if (showMessage && errorWrap?.id) {
			input.setAttribute("aria-describedby", errorWrap.id);
		} else {
			input.removeAttribute("aria-describedby");
		}
	}

	if (errorWrap) {
		errorWrap.hidden = !showError;
	}

	if (errorText) {
		errorText.textContent = showMessage ? options.message! : "";
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
	const calendarGregorianHost = root.querySelector<HTMLElement>(
		"[data-ldcv2-calendar-host-gregorian]",
	);
	const calendarLunarHost = root.querySelector<HTMLElement>(
		"[data-ldcv2-calendar-host-lunar]",
	);
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
	let gregorianCalendarAdapter: LunarCalendarAdapter | null = null;
	let lunarPickerAdapter: LunarPickerAdapter | null = null;
	let gregorianController: LunarGregorianDateController | null = null;
	let lunarNumericController: LunarNumericFieldController | null = null;
	const calendarListeners = new Set<() => void>();

	const notifyCalendar = () => {
		for (const listener of calendarListeners) {
			listener();
		}
	};

	const composition = createCompositionGuard();

	const closeAllCalendars = () => {
		gregorianCalendarAdapter?.close();
		lunarPickerAdapter?.close();
	};

	const syncCommittedResult = (invalid = false) => {
		dispatchResult(root, actualCivil, inputMode, locale, invalid);
	};

	/** Editing draft：Result `?` + weekday clear；no field error. */
	const syncDraftUnknownResult = () => {
		fieldPhase = "draft-incomplete";
		syncFieldError(root, fieldPhase);
		syncCommittedResult(true);
	};

	/** Complete+valid lunar semantic field（blur／Calendar／AME／mode switch only）. */
	const applyLunarCommittedFieldDisplay = (lunar: LunarDate) => {
		const display = formatLunarInputDisplayForLocale(lunar, locale);
		input.value = display;
		lunarDraftText = display;
		if (lunar.isLeapMonth) {
			lunarNumericController?.clear();
		} else {
			lunarNumericController?.setLunar(lunar);
		}
	};

	/**
	 * Focused editing：committed semantic → numeric progressive representation.
	 * Leap baseline preserved only while Y/M/D unchanged（leap never invented from digits）.
	 */
	let lunarEditLeapBaseline: LunarDate | null = null;

	const resolveNumericLunar = (lunar: LunarDate): LunarDate => {
		if (
			lunarEditLeapBaseline?.isLeapMonth &&
			lunarEditLeapBaseline.year === lunar.year &&
			lunarEditLeapBaseline.month === lunar.month &&
			lunarEditLeapBaseline.day === lunar.day
		) {
			return { ...lunar, isLeapMonth: true };
		}
		return { ...lunar, isLeapMonth: false };
	};

	const expandLunarCommittedToEditingDisplay = () => {
		const lunarResult = gregorianToLunar(actualCivil);
		if (!lunarResult.ok) {
			return;
		}
		const lunar = lunarResult.value;
		lunarEditLeapBaseline = lunar.isLeapMonth ? { ...lunar } : null;
		if (!lunarNumericController) {
			return;
		}
		lunarNumericController.setLunar(lunar);
		const editing = lunarNumericController.getSnapshot();
		input.value = editing.display;
		lunarDraftText = editing.display;
	};

	const isLunarCommittedSemanticText = (text: string): boolean => {
		const trimmed = text.trim();
		if (!trimmed) {
			return false;
		}
		if (isLunarNumericDraftText(trimmed)) {
			return false;
		}
		const evaluated = evaluateLunarInput(trimmed, { commit: true });
		return evaluated.status === "valid";
	};

	const repopulateInputFromActual = () => {
		if (inputMode === "gregorian") {
			lunarEditLeapBaseline = null;
			gregorianController?.setDate(actualCivil);
			const snap = gregorianController?.getSnapshot();
			if (snap) {
				input.value = snap.normalizedDisplay;
			}
			return;
		}

		const lunarResult = gregorianToLunar(actualCivil);
		if (lunarResult.ok) {
			lunarEditLeapBaseline = lunarResult.value.isLeapMonth
				? { ...lunarResult.value }
				: null;
			applyLunarCommittedFieldDisplay(lunarResult.value);
		}
	};

	const commitGregorianSnapshot = (snapshot: GregorianFieldSnapshot) => {
		if (snapshot.status === "valid" && snapshot.date) {
			actualCivil = snapshot.date;
			fieldPhase = "committed-valid";
			syncFieldError(root, fieldPhase);
			syncCommittedResult(false);
			notifyCalendar();
			return;
		}

		if (snapshot.status === "incomplete" || snapshot.status === "empty") {
			syncDraftUnknownResult();
			return;
		}

		fieldPhase = "draft-complete-invalid";
		const invalidKind = classifyGregorianInvalid(snapshot.segments);
		const pattern: FieldErrorPattern =
			invalidKind === "out-of-range" ? "with-message" : "indicator-only";
		syncFieldError(root, fieldPhase, {
			pattern,
			message: invalidKind === "out-of-range" ? copy.errorOutOfRange : "",
		});
		syncCommittedResult(true);
	};

	const commitLunarNumericSnapshot = (
		snapshot: LunarNumericFieldSnapshot,
		options: { normalizeField?: boolean } = {},
	) => {
		if (snapshot.status === "valid" && snapshot.lunar) {
			const lunar = resolveNumericLunar(snapshot.lunar);
			const civil = civilFromLunarInput(lunar);
			if (civil) {
				actualCivil = civil;
				fieldPhase = "committed-valid";
				if (options.normalizeField) {
					applyLunarCommittedFieldDisplay(lunar);
				}
				syncFieldError(root, fieldPhase);
				syncCommittedResult(false);
				notifyCalendar();
				return;
			}
		}

		if (snapshot.status === "incomplete" || snapshot.status === "empty") {
			lunarEditLeapBaseline = null;
			syncDraftUnknownResult();
			return;
		}

		lunarEditLeapBaseline = null;
		fieldPhase = "draft-complete-invalid";
		const code = snapshot.errorCode;
		syncFieldError(root, fieldPhase, {
			pattern: errorPresentationPattern("lunar", code),
			message: errorMessage(copy, code),
		});
		syncCommittedResult(true);
	};

	const commitLunarText = (
		text: string,
		options: { normalizeField?: boolean } = {},
	) => {
		lunarDraftText = text;
		const evaluated = evaluateLunarInput(text, { commit: true });

		if (evaluated.status === "valid" && evaluated.lunar) {
			const civil = civilFromLunarInput(evaluated.lunar);
			if (civil) {
				actualCivil = civil;
				fieldPhase = "committed-valid";
				lunarEditLeapBaseline = evaluated.lunar.isLeapMonth
					? { ...evaluated.lunar }
					: null;
				if (options.normalizeField) {
					applyLunarCommittedFieldDisplay(evaluated.lunar);
				} else if (!evaluated.lunar.isLeapMonth) {
					lunarNumericController?.setLunar(evaluated.lunar);
				} else {
					lunarNumericController?.clear();
				}
				syncFieldError(root, fieldPhase);
				syncCommittedResult(false);
				notifyCalendar();
				return;
			}
		}

		if (evaluated.status === "empty" || evaluated.status === "incomplete") {
			lunarEditLeapBaseline = null;
			syncDraftUnknownResult();
			return;
		}

		lunarEditLeapBaseline = null;
		fieldPhase = "draft-complete-invalid";
		const code = evaluated.errorCode;
		syncFieldError(root, fieldPhase, {
			pattern: errorPresentationPattern("lunar", code),
			message: errorMessage(copy, code),
		});
		syncCommittedResult(true);
	};

	const performModeSwitch = (nextMode: InputMode) => {
		if (nextMode === inputMode) {
			return;
		}

		closeAllCalendars();
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
		syncFieldError(root, "committed-valid");
		syncCommittedResult(false);
	};

	/* —— Gregorian controller + calendar（Desktop only；AME 用 structured picker） —— */
	gregorianController = createGregorianDateController();
	lunarNumericController = createLunarNumericFieldController();

	let ameApi: AdaptiveMobileEditorController<LdcAmeDraft> | null = null;

	const gregorianDateSource = {
		getDate: () => actualCivil,
		setDate: (date: CivilDate) => {
			actualCivil = date;
			gregorianController?.setDate(date);
			const snap = gregorianController!.getSnapshot();
			input.value = snap.normalizedDisplay;
			fieldPhase = "committed-valid";
			syncFieldError(root, fieldPhase);
			syncCommittedResult(false);
			notifyCalendar();
		},
		subscribe: (listener: () => void) => {
			calendarListeners.add(listener);
			return () => calendarListeners.delete(listener);
		},
	};

	const lunarDateSource = {
		getCivil: () => actualCivil,
		setCivil: (date: CivilDate) => {
			actualCivil = date;
			fieldPhase = "committed-valid";
			repopulateInputFromActual();
			syncFieldError(root, fieldPhase);
			syncCommittedResult(false);
			notifyCalendar();
		},
		subscribe: (listener: () => void) => {
			calendarListeners.add(listener);
			return () => calendarListeners.delete(listener);
		},
	};

	if (calendarGregorianHost && calendarToggle) {
		gregorianCalendarAdapter = createLunarCalendarAdapter({
			host: calendarGregorianHost,
			trigger: calendarToggle,
			anchor: capsule,
			dateSource: gregorianDateSource,
			intlLocale: locale === "zh" ? "zh-Hant" : "en-US",
			bindTrigger: false,
		});
	}

	if (calendarLunarHost && calendarToggle) {
		lunarPickerAdapter = createLunarPickerAdapter({
			host: calendarLunarHost,
			trigger: calendarToggle,
			anchor: capsule,
			dateSource: lunarDateSource,
			locale,
			bindTrigger: false,
		});
	}

	calendarToggle?.addEventListener("click", (event) => {
		event.preventDefault();
		event.stopPropagation();
		if (ameApi?.isOpen()) {
			return;
		}
		const adapter =
			inputMode === "gregorian" ? gregorianCalendarAdapter : lunarPickerAdapter;
		if (!adapter) {
			return;
		}
		if (adapter.isOpen()) {
			adapter.close();
		} else {
			adapter.open();
		}
	});

	const applyCommittedFromAme = (committed: LdcAmeDraft) => {
		const resolved = resolveLdcAmeDraft(committed);
		if (!resolved.ok) {
			return;
		}
		actualCivil = resolved.civil;
		inputMode = resolved.mode;
		fieldPhase = "committed-valid";
		applyInputModeUi(root, inputMode);
		input.inputMode = inputMode === "gregorian" ? "numeric" : "text";
		input.placeholder =
			inputMode === "gregorian"
				? (root.dataset.ldcv2GregorianPlaceholder ?? "")
				: (root.dataset.ldcv2LunarPlaceholder ?? "");
		input.setAttribute(
			"aria-label",
			inputMode === "gregorian"
				? (root.dataset.ldcv2GregorianAria ?? "")
				: (root.dataset.ldcv2LunarAria ?? ""),
		);
		repopulateInputFromActual();
		syncFieldError(root, "committed-valid");
		syncCommittedResult(false);
		notifyCalendar();
	};

	/* —— B2D AME live lifecycle：picker 即時更新；Done 只關；不 focus／keyboard／calendar —— */
	const pageContent = root.querySelector<HTMLElement>("[data-ame-page-content]");
	const ameRoot = root.querySelector<HTMLElement>("[data-ame-root]");
	const sheetTriggers = [
		...root.querySelectorAll<HTMLElement>("[data-ldcv2-sheet-trigger]"),
	];

	if (pageContent && ameRoot && !ameSessions.has(root)) {
		ameApi = createAdaptiveMobileEditor<LdcAmeDraft>(ameRoot, {
			pageContent,
			numericFields: [],
			adapter: {
				lifecycle: "live",
				getCommitted: () => draftFromCommitted(actualCivil, inputMode),
				createOpenDraft: (committed) => cloneLdcAmeDraft(committed),
				getResetDraft: () => ldcAmeResetDraft(),
				validate: (draft) => validateLdcAmeDraft(draft),
				onCommit: (committed) => {
					applyCommittedFromAme(committed);
				},
				onDraftChange: (draft) => {
					syncLdcAmeUi(root, draft, locale);
				},
			},
			onSyncUi: (draft) => {
				syncLdcAmeUi(root, draft, locale);
			},
			onOpen: () => {
				closeAllCalendars();
			},
			onClose: () => {
				closeAllCalendars();
				applyInputModeUi(root, inputMode);
			},
		});

		const unbindAme = bindLdcAmeInteractions(root, {
			getDraft: () => ameApi!.getDraft(),
			patchDraft: (partial) => ameApi!.patchDraft(partial),
			isOpen: () => ameApi!.isOpen(),
			locale,
		});

		for (const trigger of sheetTriggers) {
			trigger.addEventListener("click", (event) => {
				event.preventDefault();
				ameApi?.open(trigger);
			});
		}

		ameSessions.set(root, {
			destroy: () => {
				unbindAme();
				ameApi?.destroy();
				ameSessions.delete(root);
				ameApi = null;
			},
		});

		const preferOpen =
			new URLSearchParams(window.location.search).get("ldcv2Sheet") === "open";
		if (preferOpen) {
			ameApi.open(sheetTriggers[0] ?? undefined);
		}
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

	input.addEventListener("focus", () => {
		if (inputMode !== "lunar") {
			return;
		}
		if (fieldPhase !== "committed-valid") {
			return;
		}
		if (!isLunarCommittedSemanticText(input.value)) {
			return;
		}
		expandLunarCommittedToEditingDisplay();
		if (document.activeElement === input) {
			const len = input.value.length;
			input.setSelectionRange(len, len);
		}
	});

	input.addEventListener("beforeinput", (event) => {
		if (shouldDeferInputWhileComposing(composition)) {
			return;
		}

		const inputEvent = event as InputEvent;
		const inputType = inputEvent.inputType;
		const selectionStart = input.selectionStart ?? 0;
		const selectionEnd = input.selectionEnd ?? selectionStart;

		if (inputMode === "gregorian") {
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
				commitGregorianSnapshot(snapshot);
				if (document.activeElement === input) {
					const len = input.value.length;
					const next = Math.max(0, Math.min(caret, len));
					input.setSelectionRange(next, next);
				}
			}
			return;
		}

		/* Lunar numeric Smart Date path（digit／slash）；CJK／閏 stay on input event. */
		if (!isLunarNumericDraftText(input.value) || !lunarNumericController) {
			return;
		}

		if (
			inputType === "insertText" &&
			inputEvent.data &&
			!/^[\d/-]$/.test(inputEvent.data)
		) {
			return;
		}

		if (
			inputType === "insertText" ||
			inputType === "deleteContentBackward" ||
			inputType === "deleteContentForward"
		) {
			event.preventDefault();
			const { snapshot, caret } = lunarNumericController.applyInputChange(
				inputType,
				inputEvent.data,
				selectionStart,
				selectionEnd,
			);
			input.value = snapshot.display;
			lunarDraftText = snapshot.display;
			/* Focused：Result 可更新；field 維持 numeric，blur 才 semantic. */
			commitLunarNumericSnapshot(snapshot, { normalizeField: false });
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
		if (isLunarNumericDraftText(input.value) && lunarNumericController) {
			const current = lunarNumericController.getSnapshot();
			if (current.display === input.value) {
				return;
			}
			const { snapshot } = lunarNumericController.applyPaste(input.value);
			input.value = snapshot.display;
			lunarDraftText = snapshot.display;
			commitLunarNumericSnapshot(snapshot, { normalizeField: false });
			return;
		}
		commitLunarText(input.value, { normalizeField: false });
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
				commitGregorianSnapshot(committed);
			} else {
				input.value = snapshot.display;
				commitGregorianSnapshot(snapshot);
				if (document.activeElement === input) {
					input.setSelectionRange(caret, caret);
				}
			}
			return;
		}

		if (isLunarNumericDraftText(text) && lunarNumericController) {
			const { snapshot, caret } = lunarNumericController.applyPaste(text);
			input.value = snapshot.display;
			lunarDraftText = snapshot.display;
			commitLunarNumericSnapshot(snapshot, {
				normalizeField: document.activeElement !== input,
			});
			if (document.activeElement === input) {
				input.setSelectionRange(caret, caret);
			}
			return;
		}

		input.value = text;
		commitLunarText(text, { normalizeField: document.activeElement !== input });
	});

	input.addEventListener("blur", () => {
		if (inputMode === "gregorian" && gregorianController) {
			const snapshot = gregorianController.commitNormalize();
			input.value = snapshot.normalizedDisplay;
			commitGregorianSnapshot(snapshot);
			return;
		}
		if (isLunarNumericDraftText(input.value) && lunarNumericController) {
			const snapshot = lunarNumericController.commitNormalize();
			input.value = snapshot.normalizedDisplay;
			lunarDraftText = snapshot.normalizedDisplay;
			commitLunarNumericSnapshot(snapshot, { normalizeField: true });
			return;
		}
		commitLunarText(input.value, { normalizeField: true });
	});

	input.addEventListener("keydown", (event) => {
		if (event.key !== "Enter") {
			return;
		}
		event.preventDefault();
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
		closeAllCalendars();

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
		syncFieldError(root, "committed-valid");
		syncCommittedResult(false);
	});

	const layoutApi = window.TimivaLunarDateConverterLayout;
	const compositionMedia: MediaQueryList[] = [];
	const onDesktopInputCompositionChange = () => {
		const inDesktopInput =
			layoutApi?.isDesktopInputComposition?.(window) ??
			window.matchMedia("(min-width: 768px) and (hover: hover)").matches;
		if (inDesktopInput) {
			if (ameApi?.isOpen()) {
				ameApi.close("api");
			}
			closeAllCalendars();
			return;
		}
		if (!ameApi?.isOpen()) {
			closeAllCalendars();
		}
	};

	if (layoutApi?.DESKTOP_MQ) {
		compositionMedia.push(window.matchMedia(layoutApi.DESKTOP_MQ));
	}
	if (layoutApi?.LANDSCAPE_MQ) {
		compositionMedia.push(window.matchMedia(layoutApi.LANDSCAPE_MQ));
	}
	if (compositionMedia.length === 0) {
		compositionMedia.push(
			window.matchMedia("(min-width: 768px) and (hover: hover)"),
		);
	}
	for (const mq of compositionMedia) {
		mq.addEventListener("change", onDesktopInputCompositionChange);
	}
	window.addEventListener("resize", onDesktopInputCompositionChange);
	window.addEventListener("orientationchange", onDesktopInputCompositionChange);

	const refreshResultForResponsiveState = () => {
		layoutApi?.applyLayoutAttrs?.(document);
		/* incomplete + complete-invalid both keep Result ?；do not restore last committed. */
		syncCommittedResult(fieldPhase !== "committed-valid");
	};
	window.addEventListener("resize", refreshResultForResponsiveState);
	window.addEventListener("orientationchange", refreshResultForResponsiveState);
	const resultHost = root.querySelector<HTMLElement>(".ldcv2-result-host");
	const resultHostObserver =
		resultHost && typeof ResizeObserver !== "undefined"
			? new ResizeObserver(() => {
					refreshResultForResponsiveState();
				})
			: null;
	resultHostObserver?.observe(resultHost!);

	window.addEventListener(
		"pagehide",
		() => {
			for (const mq of compositionMedia) {
				mq.removeEventListener("change", onDesktopInputCompositionChange);
			}
			window.removeEventListener("resize", onDesktopInputCompositionChange);
			window.removeEventListener(
				"orientationchange",
				onDesktopInputCompositionChange,
			);
			window.removeEventListener("resize", refreshResultForResponsiveState);
			window.removeEventListener("orientationchange", refreshResultForResponsiveState);
			resultHostObserver?.disconnect();
			gregorianCalendarAdapter?.destroy();
			lunarPickerAdapter?.destroy();
			gregorianController?.destroy();
			lunarNumericController?.destroy();
			ameSessions.get(root)?.destroy();
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
