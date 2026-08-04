/**
 * Date Calculator client script.
 * B1A: desktop drawer collapse / expand
 * B1B: thin layout-attr sync + sheet open／close
 * B2.2: Desktop Start date Smart Date Input
 * B2.3: Shared DesktopCalendar popover-compact
 * B2.5: Direction＋Duration shared state（Desktop）
 * B8 AME First Adopter：
 *   Mobile chrome is now the shared Adaptive Mobile Editor（no custom sheet／portal／
 *   visualViewport／MSB runtime). Desktop Smart Date Input＋Calendar＋direction／duration
 *   stay production behavior. calculateDate + ResultSummary are wired for live Desktop
 *   updates and AME live lifecycle（draft change → page state／result；Done dismisses only）.
 *   Desktop Reset clears state and reapplies the initial result.
 */

import {
	createCompositionGuard,
	createStartDateController,
	setCompositionActive,
	shouldDeferInputWhileComposing,
	type DateCalculatorStartDateController,
	type StartDateFieldSnapshot,
} from "../lib/dateCalculatorDateInput";
import {
	createDateCalculatorCalendarAdapter,
	type DateCalculatorCalendarAdapter,
} from "../lib/dateCalculatorCalendarAdapter";
import {
	calculateDate,
	isValidSupportedStartDate,
	type CivilDate,
	type Direction,
} from "../lib/dateCalculatorMath";
import {
	createDurationController,
	DURATION_UNITS,
	isDirection,
	type DateCalculatorDurationController,
	type DurationSnapshot,
	type DurationUnit,
} from "../lib/dateCalculatorDuration";
import {
	formatCivilIso,
	formatResultPrimary,
	formatResultSupport,
	formatResultWeekday,
	parseCivilIso,
	type DateCalculatorLocale,
} from "../lib/dateCalculatorFormat";
import {
	createAdaptiveMobileEditor,
	type AdaptiveMobileEditorController,
} from "./adaptive-mobile-editor-controller";
import {
	acceptDcAmeNumericCandidate,
	bindDcAmeInteractions,
	cloneDcAmeDraft,
	DC_AME_NUMERIC_FIELDS,
	DC_AME_RESET_DEFAULTS,
	syncDcAmeUi,
	validateDcAmeDraft,
	type DcAmeCopy,
	type DcAmeDraft,
} from "./date-calculator-ame-adapter";

const initializedRoots = new WeakSet<HTMLElement>();
const startDateControllers = new WeakMap<
	HTMLElement,
	DateCalculatorStartDateController
>();
const calendarAdapters = new WeakMap<
	HTMLElement,
	DateCalculatorCalendarAdapter
>();
const durationControllers = new WeakMap<
	HTMLElement,
	DateCalculatorDurationController
>();
const ameSessions = new WeakMap<HTMLElement, { destroy: () => void }>();

/** Shared start-date API — Desktop Smart Date、Calendar 共用同一 state。 */
type StartDateApi = {
	getSnapshot: () => StartDateFieldSnapshot;
	setDate: (date: NonNullable<StartDateFieldSnapshot["date"]>) => void;
	clear: () => void;
	subscribe: (listener: () => void) => () => void;
	destroy: () => void;
};

type LayoutApi = {
	applyLayoutAttrs: (doc?: Document) => void;
	DESKTOP_MQ: string;
	LANDSCAPE_MQ: string;
};

/** rs:update 缺省文案（initial／invalid support、all-zero starting-date label）。 */
type ResultCopy = {
	initialSupport: string;
	startingDate: string;
};

function getLayoutApi(): LayoutApi | null {
	const api = (
		window as Window & {
			TimivaDateCalculatorLayout?: LayoutApi;
		}
	).TimivaDateCalculatorLayout;
	return api ?? null;
}

function getLocale(root: HTMLElement): DateCalculatorLocale {
	return root.getAttribute("data-dcv2-locale") === "zh" ? "zh" : "en";
}

function readResultCopy(root: HTMLElement): ResultCopy {
	return {
		initialSupport: root.dataset.dcv2CopyInitialSupport ?? "",
		startingDate: root.dataset.dcv2CopyStartingDate ?? "",
	};
}

/** AME validate copy — 缺 fallback 讀既有 desktop label／placeholder DOM，不新增 i18n。 */
function readDcAmeCopy(root: HTMLElement): DcAmeCopy {
	const yearsInput = root.querySelector<HTMLElement>(
		'[data-dcv2-duration-input="years"]',
	);
	const monthsInput = root.querySelector<HTMLElement>(
		'[data-dcv2-duration-input="months"]',
	);
	const weeksInput = root.querySelector<HTMLElement>(
		'[data-dcv2-duration-input="weeks"]',
	);
	const daysInput = root.querySelector<HTMLElement>(
		'[data-dcv2-duration-input="days"]',
	);
	const addButton = root.querySelector<HTMLElement>('[data-dcv2-direction="add"]');
	const subtractButton = root.querySelector<HTMLElement>(
		'[data-dcv2-direction="subtract"]',
	);

	return {
		validationStartDate: root.dataset.dcv2CopyValidationStart ?? "",
		validationDuration: root.dataset.dcv2CopyValidationDuration ?? "",
		validationOutOfRange: root.dataset.dcv2CopyValidationRange ?? "",
		validationUnsafeInteger: root.dataset.dcv2CopyValidationUnsafe ?? "",
		yearsLabel: yearsInput?.getAttribute("aria-label") ?? "",
		monthsLabel: monthsInput?.getAttribute("aria-label") ?? "",
		weeksLabel: weeksInput?.getAttribute("aria-label") ?? "",
		daysLabel: daysInput?.getAttribute("aria-label") ?? "",
		directionAdd: addButton?.getAttribute("aria-label") ?? "",
		directionSubtract: subtractButton?.getAttribute("aria-label") ?? "",
		durationZeroPlaceholder: yearsInput?.getAttribute("placeholder") ?? "",
	};
}

/** ResultSummary shared contract：textual content on [data-result-summary]。 */
function dispatchResultUpdate(
	root: HTMLElement,
	primaryText: string,
	weekday: string | null,
	support: string | null,
): void {
	const resultSummary = root.querySelector<HTMLElement>("[data-result-summary]");
	if (!resultSummary) {
		return;
	}

	resultSummary.dispatchEvent(
		new CustomEvent("rs:update", {
			detail: {
				content: "textual",
				primary: { text: primaryText },
				weekday,
				support,
			},
		}),
	);
}

/**
 * Desktop duration overflow／invalid icon／aria-invalid — 與 duration controller 自身
 * raw-input invalid 狀態合併，避免互相覆寫。
 */
function syncDesktopDurationOverflow(
	root: HTMLElement,
	durationSnapshot: DurationSnapshot,
	failingUnit: DurationUnit | null,
): void {
	for (const unit of DURATION_UNITS) {
		const field = root.querySelector<HTMLElement>(`[data-dcv2-duration="${unit}"]`);
		const input = root.querySelector<HTMLInputElement>(
			`[data-dcv2-duration-input="${unit}"]`,
		);
		const icon = root.querySelector<HTMLElement>(
			`[data-dcv2-duration-invalid="${unit}"]`,
		);
		if (!field) {
			continue;
		}

		const isOverflow = unit === failingUnit;
		const ownInvalid = durationSnapshot.units[unit].status === "invalid";
		const showError = isOverflow || ownInvalid;

		field.setAttribute("data-dcv2-duration-overflow", isOverflow ? "true" : "false");
		field.setAttribute(
			"data-dcv2-duration-status",
			durationSnapshot.units[unit].status,
		);

		if (input) {
			input.setAttribute("aria-invalid", showError ? "true" : "false");
		}

		if (icon) {
			icon.hidden = !showError;
			icon.setAttribute("aria-hidden", showError ? "false" : "true");
		}
	}
}

/**
 * B2.1／B8：single source of truth for calculateDate → ResultSummary。
 * Start invalid icon 沿用既有 Desktop Smart Date Input 狀態同步；本函式只處理
 * duration overflow icon 與 rs:update。
 */
function computeAndApplyResult(
	root: HTMLElement,
	dateApi: StartDateApi,
	durationController: DateCalculatorDurationController,
	locale: DateCalculatorLocale,
	copy: ResultCopy,
): void {
	const startSnapshot = dateApi.getSnapshot();
	const durationSnapshot = durationController.getSnapshot();

	if (
		startSnapshot.status !== "valid" ||
		!startSnapshot.date ||
		durationSnapshot.hasInvalidUnit
	) {
		syncDesktopDurationOverflow(root, durationSnapshot, null);
		dispatchResultUpdate(root, "?", null, copy.initialSupport);
		return;
	}

	const result = calculateDate(
		startSnapshot.date,
		durationSnapshot.direction,
		durationSnapshot.duration,
	);

	if (!result.ok) {
		const failingUnit = result.reason === "out-of-range" ? (result.unit ?? null) : null;
		syncDesktopDurationOverflow(root, durationSnapshot, failingUnit);
		dispatchResultUpdate(root, "?", null, copy.initialSupport);
		return;
	}

	syncDesktopDurationOverflow(root, durationSnapshot, null);

	const primary = formatResultPrimary(result.date, locale);
	const weekday = formatResultWeekday(result.date, locale);
	const support = formatResultSupport(
		startSnapshot.date,
		durationSnapshot.direction,
		durationSnapshot.duration,
		locale,
		copy.startingDate,
	);

	dispatchResultUpdate(root, primary, weekday, support);
}

function initDrawer(root: HTMLElement): void {
	const drawer = root.querySelector<HTMLElement>("[data-dcv2-drawer]");
	const shell = root.querySelector<HTMLElement>("[data-dcv2-drawer-shell]");
	const toggle = root.querySelector<HTMLButtonElement>("[data-dcv2-drawer-toggle]");
	const related = root.querySelector<HTMLElement>("[data-dcv2-related-tools]");

	if (!drawer || !shell || !toggle) {
		return;
	}

	let isOpen = drawer.dataset.open !== "false";

	const syncDrawer = () => {
		drawer.dataset.open = isOpen ? "true" : "false";
		shell.dataset.open = isOpen ? "true" : "false";
		/* 對齊 Age：closed 時才加 translate，避免常駐 transform 擴大橫向 overflow */
		shell.classList.toggle("translate-x-[300px]", !isOpen);
		related?.classList.toggle("xl:hidden", isOpen);
		toggle.setAttribute("aria-expanded", String(isOpen));
	};

	syncDrawer();

	toggle.addEventListener("click", (event) => {
		event.preventDefault();
		isOpen = !isOpen;
		syncDrawer();
	});
}

/** Layout attrs only — mirrors DRC／BDC thin contract consumers. */
function initLayoutSync(): void {
	const api = getLayoutApi();
	if (!api) {
		return;
	}

	const sync = () => {
		api.applyLayoutAttrs(document);
	};

	sync();

	const desktopMedia = window.matchMedia(api.DESKTOP_MQ);
	const landscapeMedia = window.matchMedia(api.LANDSCAPE_MQ);

	desktopMedia.addEventListener("change", sync);
	landscapeMedia.addEventListener("change", sync);
	window.addEventListener("resize", sync);

	window.setTimeout(sync, 200);
	window.setTimeout(sync, 550);
}

/**
 * B2.2：Desktop Start date Smart Date Input。
 * B2.3／AME 透過同一 StartDateApi 雙向同步。
 */
function initDesktopStartDateInput(root: HTMLElement): StartDateApi | null {
	const input = root.querySelector<HTMLInputElement>("[data-dcv2-desktop-start]");
	const invalidIcon = root.querySelector<HTMLElement>(
		"[data-dcv2-desktop-start-invalid]",
	);

	if (!input) {
		return null;
	}

	if (startDateControllers.has(root)) {
		return null;
	}

	const composition = createCompositionGuard();
	const listeners = new Set<() => void>();
	let destroyed = false;

	const syncDom = (
		snapshot: ReturnType<DateCalculatorStartDateController["getSnapshot"]>,
		caret: number | null,
		normalized: boolean,
	) => {
		const value = normalized ? snapshot.normalizedDisplay : snapshot.display;
		input.value = value;

		const isInvalid = snapshot.status === "invalid";
		input.setAttribute("aria-invalid", isInvalid ? "true" : "false");
		root.setAttribute("data-dcv2-start-status", snapshot.status);

		if (invalidIcon) {
			invalidIcon.hidden = !isInvalid;
			invalidIcon.setAttribute("aria-hidden", isInvalid ? "false" : "true");
		}

		if (caret !== null && document.activeElement === input) {
			const nextCaret = Math.max(0, Math.min(caret, value.length));
			input.setSelectionRange(nextCaret, nextCaret);
		}
	};

	const controller = createStartDateController({
		onChange: () => {
			for (const listener of listeners) {
				listener();
			}
		},
	});
	startDateControllers.set(root, controller);

	syncDom(controller.getSnapshot(), null, true);

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
			const { snapshot, caret } = controller.applyInputChange(
				inputType,
				inputEvent.data,
				selectionStart,
				selectionEnd,
			);
			syncDom(snapshot, caret, false);
		}
	});

	input.addEventListener("paste", (event) => {
		if (shouldDeferInputWhileComposing(composition)) {
			event.preventDefault();
			return;
		}

		event.preventDefault();
		const text = event.clipboardData?.getData("text") ?? "";
		const { snapshot, caret } = controller.applyPaste(text);
		const commit =
			snapshot.status === "valid"
				? controller.commitNormalize()
				: snapshot;
		syncDom(commit, caret, snapshot.status === "valid");
	});

	input.addEventListener("blur", () => {
		const snapshot = controller.commitNormalize();
		syncDom(snapshot, null, true);
	});

	input.addEventListener("keydown", (event) => {
		if (event.key !== "Enter") {
			return;
		}

		event.preventDefault();
		const snapshot = controller.commitNormalize();
		syncDom(snapshot, null, true);
		input.blur();
	});

	return {
		getSnapshot: () => controller.getSnapshot(),
		setDate: (date) => {
			if (destroyed) {
				return;
			}
			const snapshot = controller.setDate(date);
			syncDom(snapshot, null, true);
		},
		clear: () => {
			if (destroyed) {
				return;
			}
			const snapshot = controller.clear();
			syncDom(snapshot, null, true);
		},
		subscribe: (listener) => {
			if (destroyed) {
				return () => {};
			}
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
		destroy: () => {
			if (destroyed) {
				return;
			}
			destroyed = true;
			listeners.clear();
			controller.destroy();
			startDateControllers.delete(root);
		},
	};
}

/**
 * B2.3：Shared DesktopCalendar popover-compact thin adapter。
 * Icon-only open；single-date；1900–2200。
 */
function initDesktopCalendar(
	root: HTMLElement,
	dateApi: StartDateApi,
): DateCalculatorCalendarAdapter | null {
	if (calendarAdapters.has(root)) {
		return calendarAdapters.get(root) ?? null;
	}

	const trigger = root.querySelector<HTMLButtonElement>(
		"[data-dcv2-calendar-toggle]",
	);
	const calendarRoot = root.querySelector<HTMLElement>(
		"#dcv2-calendar-popover[data-desktop-calendar]",
	);
	const anchor = root.querySelector<HTMLElement>(".dcv2-start-capsule");

	if (!trigger || !calendarRoot || !anchor) {
		return null;
	}

	const calendar = createDateCalculatorCalendarAdapter({
		root: calendarRoot,
		trigger,
		/* 錨在整顆 start 輸入膠囊，popover 右緣對齊輸入框右緣。 */
		anchor,
		intlLocale:
			root.getAttribute("data-dcv2-locale") === "zh" ? "zh-Hant" : "en-US",
		dateSource: {
			getDate: () => dateApi.getSnapshot().date,
			setDate: (date) => dateApi.setDate(date),
			subscribe: dateApi.subscribe,
		},
		getAvoidRects: () => {
			const resultBlock = root.querySelector<HTMLElement>(
				".preview-tool-result-block",
			);
			const resultGroup = root.querySelector<HTMLElement>(
				".preview-tool-result-group",
			);
			return [(resultBlock ?? resultGroup)?.getBoundingClientRect()];
		},
	});

	calendarAdapters.set(root, calendar);
	return calendar;
}

/**
 * B2.5：Direction＋Duration 共用 state — Desktop only（B8 起 mobile 走 AME draft）。
 * Desktop duration 鍵盤／paste 寫入前套用與 AME 相同的 acceptDcAmeNumericCandidate range guard。
 */
function initDirectionAndDuration(
	root: HTMLElement,
	dateApi: StartDateApi,
): DateCalculatorDurationController | null {
	if (durationControllers.has(root)) {
		return durationControllers.get(root) ?? null;
	}

	const directionButtons = [
		...root.querySelectorAll<HTMLButtonElement>("[data-dcv2-direction]"),
	];
	const durationInputs = [
		...root.querySelectorAll<HTMLInputElement>("[data-dcv2-duration-input]"),
	];

	if (directionButtons.length === 0 && durationInputs.length === 0) {
		return null;
	}

	const abort = new AbortController();
	const { signal } = abort;

	const readDirection = (button: HTMLButtonElement): Direction | null => {
		const raw = button.getAttribute("data-dcv2-direction");
		return isDirection(raw) ? raw : null;
	};

	const readUnit = (input: HTMLInputElement): DurationUnit | null => {
		const raw = input.getAttribute("data-dcv2-duration-input");
		return DURATION_UNITS.includes(raw as DurationUnit)
			? (raw as DurationUnit)
			: null;
	};

	const controller = createDurationController();

	const buildDraftFromSnapshot = (snapshot: DurationSnapshot): DcAmeDraft => {
		const startSnapshot = dateApi.getSnapshot();
		return {
			startDate:
				startSnapshot.status === "valid" && startSnapshot.date
					? formatCivilIso(startSnapshot.date)
					: "",
			direction: snapshot.direction,
			years: snapshot.units.years.raw,
			months: snapshot.units.months.raw,
			weeks: snapshot.units.weeks.raw,
			days: snapshot.units.days.raw,
		};
	};

	const syncDom = (snapshot: DurationSnapshot) => {
		for (const button of directionButtons) {
			const value = readDirection(button);
			if (!value) {
				continue;
			}
			const isSelected = value === snapshot.direction;
			button.classList.toggle("is-active", isSelected);
			button.setAttribute("aria-pressed", isSelected ? "true" : "false");
		}

		root.setAttribute("data-dcv2-direction-state", snapshot.direction);

		for (const input of durationInputs) {
			const unit = readUnit(input);
			if (!unit) {
				continue;
			}
			const unitSnapshot = snapshot.units[unit];
			/* 正在輸入的欄位不覆寫 value，避免干擾 caret／selection／IME */
			if (document.activeElement !== input) {
				input.value = unitSnapshot.raw;
			}
			const ownInvalid = unitSnapshot.status === "invalid";
			const field = input.closest(".dcv2-duration-field");
			const overflow =
				field?.getAttribute("data-dcv2-duration-overflow") === "true";
			const showError = ownInvalid || overflow;
			input.setAttribute("aria-invalid", showError ? "true" : "false");
			field?.setAttribute("data-dcv2-duration-status", unitSnapshot.status);
			const icon = root.querySelector<HTMLElement>(
				`[data-dcv2-duration-invalid="${unit}"]`,
			);
			if (icon && !overflow) {
				/* Overflow 狀態由 computeAndApplyResult 擁有；此處只同步 raw invalid。 */
				icon.hidden = !ownInvalid;
				icon.setAttribute("aria-hidden", ownInvalid ? "false" : "true");
			}
		}
	};

	controller.subscribe(syncDom);
	syncDom(controller.getSnapshot());

	for (const button of directionButtons) {
		button.addEventListener(
			"click",
			(event) => {
				const value = readDirection(button);
				if (!value) {
					return;
				}
				event.preventDefault();
				controller.setDirection(value);
			},
			{ signal },
		);
	}

	for (const input of durationInputs) {
		const unit = readUnit(input);
		if (!unit) {
			continue;
		}

		input.addEventListener(
			"input",
			() => {
				const candidate = input.value;
				const snapshot = controller.getSnapshot();
				const priorRaw = snapshot.units[unit].raw;

				/* Backspace／Delete／Clear → empty：永遠允許 */
				if (candidate.length === 0) {
					controller.setDurationUnit(unit, "");
					return;
				}

				const draft = buildDraftFromSnapshot(snapshot);
				if (!acceptDcAmeNumericCandidate(draft, unit, candidate)) {
					/* 超界／非數字 candidate：拒絕寫入，保留上一有效值；不 clamp／toast */
					input.value = priorRaw;
					return;
				}

				controller.setDurationUnit(unit, candidate);
			},
			{ signal },
		);

		const normalize = () => {
			const snapshot = controller.normalizeDurationUnit(unit);
			input.value = snapshot.units[unit].raw;
		};

		input.addEventListener("blur", normalize, { signal });
		input.addEventListener(
			"keydown",
			(event) => {
				if (event.key !== "Enter") {
					return;
				}
				event.preventDefault();
				normalize();
			},
			{ signal },
		);
	}

	durationControllers.set(root, controller);

	window.addEventListener(
		"pagehide",
		() => {
			abort.abort();
			controller.destroy();
			durationControllers.delete(root);
		},
		{ once: true, signal },
	);

	return controller;
}

/**
 * Desktop Reset — clear StartDateApi／DurationController，關閉 Calendar，
 * blur 目前輸入，回到 initial 結果；不自動 focus。
 */
function initDesktopReset(
	root: HTMLElement,
	dateApi: StartDateApi,
	durationController: DateCalculatorDurationController,
	calendarAdapter: DateCalculatorCalendarAdapter | null,
	locale: DateCalculatorLocale,
	resultCopy: ResultCopy,
): void {
	const resetButton = root.querySelector<HTMLButtonElement>("[data-dcv2-reset]");
	if (!resetButton) {
		return;
	}

	resetButton.addEventListener("click", (event) => {
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

		dateApi.clear();
		durationController.reset();
		computeAndApplyResult(root, dateApi, durationController, locale, resultCopy);
	});
}

/**
 * B8 AME First Adopter — mobile chrome 交給 shared Adaptive Mobile Editor。
 * B8.2：lifecycle `live` — draft 變更即時同步 page state／結果；Done／Escape／underlay 只關閉。
 */
function initAme(
	root: HTMLElement,
	dateApi: StartDateApi,
	durationController: DateCalculatorDurationController,
	locale: DateCalculatorLocale,
	resultCopy: ResultCopy,
	setSkipLiveUpdates: (value: boolean) => void,
): void {
	if (ameSessions.has(root)) {
		return;
	}

	const pageContent = root.querySelector<HTMLElement>("[data-ame-page-content]");
	const ameRoot = root.querySelector<HTMLElement>("[data-ame-root]");
	const triggers = [
		...root.querySelectorAll<HTMLElement>("[data-dcv2-sheet-trigger]"),
	];

	if (!pageContent || !ameRoot) {
		return;
	}

	const copy = readDcAmeCopy(root);

	const getCommittedDraft = (): DcAmeDraft => {
		const startSnapshot = dateApi.getSnapshot();
		const durationSnapshot = durationController.getSnapshot();

		return {
			startDate:
				startSnapshot.status === "valid" && startSnapshot.date
					? formatCivilIso(startSnapshot.date)
					: "",
			direction: durationSnapshot.direction,
			years: durationSnapshot.units.years.raw,
			months: durationSnapshot.units.months.raw,
			weeks: durationSnapshot.units.weeks.raw,
			days: durationSnapshot.units.days.raw,
		};
	};

	const applyDraftToPage = (committed: DcAmeDraft) => {
		/* Keep Desktop subscribe quiet while writing；compute once at end. */
		setSkipLiveUpdates(true);

		const parsedStart: CivilDate | null = parseCivilIso(committed.startDate);
		if (parsedStart && isValidSupportedStartDate(parsedStart)) {
			dateApi.setDate(parsedStart);
		} else {
			dateApi.clear();
		}

		durationController.setDirection(committed.direction);
		for (const unit of DURATION_UNITS) {
			durationController.setDurationUnit(unit, committed[unit]);
		}

		computeAndApplyResult(root, dateApi, durationController, locale, resultCopy);
		/* Leave skip true while AME open（onOpen）；onClose restores. */
	};

	const ameApi: AdaptiveMobileEditorController<DcAmeDraft> = createAdaptiveMobileEditor<DcAmeDraft>(
		ameRoot,
		{
			pageContent,
			numericFields: DC_AME_NUMERIC_FIELDS,
			adapter: {
				lifecycle: "live",
				getCommitted: getCommittedDraft,
				createOpenDraft: (committed) => cloneDcAmeDraft(committed),
				getResetDraft: () => cloneDcAmeDraft(DC_AME_RESET_DEFAULTS),
				validate: (draft) => validateDcAmeDraft(draft, copy),
				acceptNumericCandidate: ({ fieldId, candidateValue, draft }) =>
					acceptDcAmeNumericCandidate(draft, fieldId, candidateValue),
				onCommit: (committed) => {
					applyDraftToPage(committed);
				},
				onDraftChange: (draft) => {
					syncDcAmeUi(root, draft);
				},
			},
			onSyncUi: (draft) => {
				syncDcAmeUi(root, draft);
			},
			onOpen: () => {
				setSkipLiveUpdates(true);
			},
			onClose: () => {
				setSkipLiveUpdates(false);
			},
		},
	);

	const unbindInteractions = bindDcAmeInteractions(root, {
		getDraft: () => ameApi.getDraft(),
		patchDraft: (partial) => ameApi.patchDraft(partial),
		clearActiveField: () => ameApi.clearActiveField(),
		isOpen: () => ameApi.isOpen(),
	});

	for (const trigger of triggers) {
		trigger.addEventListener("click", (event) => {
			event.preventDefault();
			ameApi.open(trigger);
		});
	}

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

	/* Owner review：?dcv2Sheet=open 預開 AME（open state via data-ame-open） */
	const preferOpen =
		new URLSearchParams(window.location.search).get("dcv2Sheet") === "open";
	if (preferOpen) {
		ameApi.open(triggers[0] ?? undefined);
	}
}

function initRoot(root: HTMLElement): void {
	if (initializedRoots.has(root)) {
		return;
	}

	initializedRoots.add(root);
	initDrawer(root);

	const dateApi = initDesktopStartDateInput(root);
	if (!dateApi) {
		return;
	}

	const durationController = initDirectionAndDuration(root, dateApi);

	if (!durationController) {
		return;
	}

	const calendarAdapter = initDesktopCalendar(root, dateApi);
	const locale = getLocale(root);
	const resultCopy = readResultCopy(root);

	/* AME open 期間（含 onCommit 寫回瞬間）暫停 Desktop live recompute，避免中間態閃爍。 */
	let skipLiveUpdates = false;
	const setSkipLiveUpdates = (value: boolean) => {
		skipLiveUpdates = value;
	};

	const recompute = () => {
		if (skipLiveUpdates) {
			return;
		}
		computeAndApplyResult(root, dateApi, durationController, locale, resultCopy);
	};

	dateApi.subscribe(recompute);
	durationController.subscribe(recompute);

	initDesktopReset(root, dateApi, durationController, calendarAdapter, locale, resultCopy);
	initAme(root, dateApi, durationController, locale, resultCopy, setSkipLiveUpdates);
}

function boot(): void {
	initLayoutSync();
	document
		.querySelectorAll<HTMLElement>("[data-date-calculator-v2]")
		.forEach((root) => initRoot(root));
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
	boot();
}
