/**
 * Days Between Dates client script.
 * B1A: desktop drawer collapse / expand
 * B1B: mobile sheet open/close
 * B2A: self-contained Smart Date Input (From / To)
 * B2B: day-difference + weeks/days + Include both dates
 */
import {
	applySegmentInputChange,
	emptyDateSegments,
	formatDateRangeCompact,
	formatSegmentsDisplay,
	formatSegmentsNormalized,
	isEntryCompleteForAutoFocus,
	isSegmentsEmpty,
	normalizeSegmentsForBlur,
	parseDateRangePaste,
	parseDateSegments,
	resolveFieldStatus,
	segmentsFromPastedText,
	type CalendarDate,
	type DateSegments,
} from "../lib/daysBetweenDatesDateInput";
import {
	computeDaysBetweenResult,
	formatPrimaryDayUnit,
	formatWeeksAndDaysLine,
	type DaysBetweenLocale,
} from "../lib/daysBetweenDatesMath";

const initializedRoots = new WeakSet<HTMLElement>();

type FieldKey = "from" | "to";

type FieldState = {
	segments: DateSegments;
	lastValid: CalendarDate | null;
};

function initDrawer(root: HTMLElement): void {
	const drawer = root.querySelector<HTMLElement>("[data-dbdv2-drawer]");
	const shell = root.querySelector<HTMLElement>("[data-dbdv2-drawer-shell]");
	const toggle = root.querySelector<HTMLButtonElement>("[data-dbdv2-drawer-toggle]");
	const related = root.querySelector<HTMLElement>("[data-dbdv2-related-tools]");
	const arrowOpen = root.querySelector<SVGElement>("[data-drawer-arrow-open]");
	const arrowClosed = root.querySelector<SVGElement>("[data-drawer-arrow-closed]");

	if (!drawer || !shell || !toggle) {
		return;
	}

	let isOpen = drawer.dataset.open !== "false";

	const syncDrawer = () => {
		drawer.dataset.open = isOpen ? "true" : "false";
		shell.dataset.open = isOpen ? "true" : "false";
		shell.classList.toggle("translate-x-[300px]", !isOpen);
		related?.classList.toggle("xl:hidden", isOpen);
		arrowOpen?.classList.toggle("hidden", !isOpen);
		arrowClosed?.classList.toggle("hidden", isOpen);
		toggle.setAttribute("aria-expanded", String(isOpen));
	};

	syncDrawer();

	toggle.addEventListener("click", (event) => {
		event.preventDefault();
		isOpen = !isOpen;
		syncDrawer();
	});
}

function initMobileSheet(root: HTMLElement): {
	openSheet: (trigger: HTMLElement) => void;
	closeSheet: () => void;
	isOpen: () => boolean;
} | null {
	const portal = document.querySelector<HTMLElement>("[data-dbdv2-sheet-portal]");
	const overlay = portal?.querySelector<HTMLElement>("[data-dbdv2-sheet-overlay]");
	const sheet = portal?.querySelector<HTMLElement>("[data-dbdv2-sheet]");
	const openTriggers = root.querySelectorAll<HTMLElement>("[data-dbdv2-sheet-open]");
	const sheetInputs = portal
		? [...portal.querySelectorAll<HTMLInputElement>(".dbdv2-date-input")]
		: [];

	if (!portal || !overlay || !sheet || openTriggers.length === 0) {
		return null;
	}

	document.body.appendChild(portal);
	portal.removeAttribute("hidden");
	portal.setAttribute("aria-hidden", "false");

	let savedScrollY = 0;
	let lastTrigger: HTMLElement | null = null;
	let isSheetOpen = false;
	const landscapeMq = window.matchMedia(
		"(orientation: landscape) and (max-height: 700px) and (max-width: 1200px)",
	);

	const getViewportMetrics = () => {
		const viewport = window.visualViewport;

		return {
			height: viewport?.height ?? window.innerHeight,
			offsetTop: viewport?.offsetTop ?? 0,
			innerHeight: window.innerHeight,
		};
	};

	const isKeyboardOpen = (metrics: { height: number; innerHeight: number }) =>
		metrics.height < metrics.innerHeight - 72;

	const clearKeyboardSync = () => {
		portal.classList.remove("msb-keyboard-sync");
		root.removeAttribute("data-dbdv2-keyboard-open");
		root.style.removeProperty("--dbdv2-keyboard-shift");
		sheet.style.removeProperty("bottom");
		sheet.style.removeProperty("height");
		sheet.style.removeProperty("max-height");

		overlay.style.removeProperty("top");
		overlay.style.removeProperty("height");
		overlay.style.removeProperty("bottom");
	};

	let keyboardSyncTimer: number | null = null;
	let keyboardSyncTimerFollowUp: number | null = null;

	const clearKeyboardSyncTimers = () => {
		if (keyboardSyncTimer !== null) {
			window.clearTimeout(keyboardSyncTimer);
			keyboardSyncTimer = null;
		}

		if (keyboardSyncTimerFollowUp !== null) {
			window.clearTimeout(keyboardSyncTimerFollowUp);
			keyboardSyncTimerFollowUp = null;
		}
	};

	/** 防止 iOS focus / visualViewport 把頁面捲到 lower content（露出 You may also need） */
	const stabilizePageScroll = () => {
		if (!isSheetOpen) {
			return;
		}

		if (Math.abs(window.scrollY - savedScrollY) > 1) {
			window.scrollTo(0, savedScrollY);
		}
	};

	const syncSheetForKeyboard = () => {
		if (!isSheetOpen) {
			clearKeyboardSyncTimers();
			clearKeyboardSync();
			return;
		}

		stabilizePageScroll();

		// Landscape + keyboard + iOS accessory bar（Timiva 共用規則 / Age 已驗收）：
		// 不抬升整個 sheet panel，避免背板卡在 accessory bar 與 keyboard 之間。
		// 此狀態重點是 focused input 可用、背景穩定；不需完整展示 sheet。
		if (landscapeMq.matches) {
			clearKeyboardSyncTimers();
			clearKeyboardSync();
			return;
		}

		const metrics = getViewportMetrics();

		if (!isKeyboardOpen(metrics)) {
			clearKeyboardSyncTimers();
			clearKeyboardSync();
			return;
		}

		// Portrait：sheet 與 result group 共用同一 inset，形成連續 composition。
		const bottomInset = Math.max(
			0,
			Math.round(metrics.innerHeight - metrics.height - metrics.offsetTop),
		);

		portal.classList.add("msb-keyboard-sync");
		root.setAttribute("data-dbdv2-keyboard-open", "true");
		root.style.setProperty("--dbdv2-keyboard-shift", `${bottomInset}px`);
		sheet.style.bottom = `${bottomInset}px`;

		overlay.style.top = `${metrics.offsetTop}px`;
		overlay.style.height = `${metrics.height}px`;
		overlay.style.bottom = "auto";
	};

	const scheduleKeyboardSync = () => {
		window.requestAnimationFrame(() => {
			syncSheetForKeyboard();
			window.requestAnimationFrame(syncSheetForKeyboard);
		});

		clearKeyboardSyncTimers();
		keyboardSyncTimer = window.setTimeout(() => {
			syncSheetForKeyboard();
			keyboardSyncTimerFollowUp = window.setTimeout(() => {
				syncSheetForKeyboard();
				keyboardSyncTimerFollowUp = null;
			}, 180);
			keyboardSyncTimer = null;
		}, 60);
	};

	const lockBodyScroll = () => {
		savedScrollY = window.scrollY;
		document.documentElement.classList.add("msb-scroll-lock", "msb-sheet-open");
		document.body.classList.add("msb-scroll-lock", "msb-sheet-open");
	};

	const unlockBodyScroll = () => {
		clearKeyboardSyncTimers();
		document.documentElement.classList.remove("msb-scroll-lock", "msb-sheet-open");
		document.body.classList.remove("msb-scroll-lock", "msb-sheet-open");
		document.body.style.top = "";
		clearKeyboardSync();
		window.scrollTo(0, savedScrollY);
	};

	const openSheet = (trigger: HTMLElement) => {
		lastTrigger = trigger;
		isSheetOpen = true;
		root.setAttribute("data-dbdv2-sheet-open", "true");
		overlay.removeAttribute("hidden");
		overlay.classList.add("is-visible");
		overlay.setAttribute("aria-hidden", "false");
		sheet.classList.add("is-open");
		sheet.setAttribute("aria-hidden", "false");
		sheet.inert = false;
		lockBodyScroll();
		stabilizePageScroll();
	};

	const closeSheet = () => {
		if (!isSheetOpen) {
			return;
		}

		isSheetOpen = false;
		root.removeAttribute("data-dbdv2-sheet-open");
		overlay.classList.remove("is-visible");
		overlay.setAttribute("hidden", "");
		overlay.setAttribute("aria-hidden", "true");
		sheet.classList.remove("is-open");
		sheet.setAttribute("aria-hidden", "true");
		sheet.inert = true;
		unlockBodyScroll();
		lastTrigger?.focus({ preventScroll: true });
	};

	openTriggers.forEach((trigger) => {
		trigger.addEventListener("click", () => {
			openSheet(trigger);
		});
	});

	overlay.addEventListener("click", closeSheet);
	sheet.addEventListener("click", (event) => {
		event.stopPropagation();
	});

	sheetInputs.forEach((input) => {
		input.addEventListener("focus", () => {
			if (!isSheetOpen) {
				return;
			}

			stabilizePageScroll();
			scheduleKeyboardSync();
		});

		input.addEventListener("blur", () => {
			if (!isSheetOpen) {
				return;
			}

			scheduleKeyboardSync();
		});
	});

	document.addEventListener("keydown", (event) => {
		if (event.key === "Escape" && isSheetOpen) {
			closeSheet();
		}
	});

	window.visualViewport?.addEventListener("resize", syncSheetForKeyboard);
	window.visualViewport?.addEventListener("scroll", () => {
		stabilizePageScroll();
		syncSheetForKeyboard();
	});
	window.addEventListener("scroll", stabilizePageScroll, { passive: true });
	window.addEventListener("pageshow", () => {
		if (isSheetOpen) {
			closeSheet();
		}
	});

	return {
		openSheet,
		closeSheet,
		isOpen: () => isSheetOpen,
	};
}

function initDateInputs(root: HTMLElement): void {
	const desktopFrom = root.querySelector<HTMLInputElement>("[data-dbdv2-desktop-from]");
	const desktopTo = root.querySelector<HTMLInputElement>("[data-dbdv2-desktop-to]");
	const sheetFrom = document.querySelector<HTMLInputElement>("[data-dbdv2-sheet-from]");
	const sheetTo = document.querySelector<HTMLInputElement>("[data-dbdv2-sheet-to]");
	const mobileRange = root.querySelector<HTMLElement>("[data-dbdv2-mobile-range]");
	const resultDays = root.querySelector<HTMLElement>("[data-dbdv2-result-days]");
	const resultUnit = root.querySelector<HTMLElement>("[data-dbdv2-result-unit]");
	const resultWeeks = root.querySelector<HTMLElement>("[data-dbdv2-result-weeks]");
	const includeToggles = [
		...root.querySelectorAll<HTMLButtonElement>("[data-dbdv2-include-toggle]"),
		...document.querySelectorAll<HTMLButtonElement>(
			"[data-dbdv2-sheet-portal] [data-dbdv2-include-toggle]",
		),
	];

	const desktopFromInvalid = root.querySelector<HTMLElement>("[data-dbdv2-desktop-from-invalid]");
	const desktopToInvalid = root.querySelector<HTMLElement>("[data-dbdv2-desktop-to-invalid]");
	const sheetFromInvalid = document.querySelector<HTMLElement>("[data-dbdv2-sheet-from-invalid]");
	const sheetToInvalid = document.querySelector<HTMLElement>("[data-dbdv2-sheet-to-invalid]");

	if (!desktopFrom || !desktopTo || !sheetFrom || !sheetTo) {
		return;
	}

	const emptyLabel =
		mobileRange?.getAttribute("data-dbdv2-empty-label")?.trim() || "Select dates";
	const resultLocale: DaysBetweenLocale =
		root.getAttribute("data-dbdv2-result-locale") === "zh" ? "zh" : "en";
	const includeLabelOff =
		root.getAttribute("data-dbdv2-include-label-off")?.trim() || "Include both dates";
	const includeLabelOn =
		root.getAttribute("data-dbdv2-include-label-on")?.trim() || "✓ Both dates included";

	// 初始：From / To 皆 empty + placeholder（不預填今天）
	const fields: Record<FieldKey, FieldState> = {
		from: { segments: emptyDateSegments(), lastValid: null },
		to: { segments: emptyDateSegments(), lastValid: null },
	};

	let includeBothDates = false;

	const inputs: Record<FieldKey, HTMLInputElement[]> = {
		from: [desktopFrom, sheetFrom],
		to: [desktopTo, sheetTo],
	};

	const invalidIcons: Record<FieldKey, Array<HTMLElement | null>> = {
		from: [desktopFromInvalid, sheetFromInvalid],
		to: [desktopToInvalid, sheetToInvalid],
	};

	let suppressAutoFocusTo = false;

	const syncIncludeControls = () => {
		includeToggles.forEach((toggle) => {
			toggle.setAttribute("aria-pressed", includeBothDates ? "true" : "false");
			toggle.classList.toggle("dbdv2-include-option--active", includeBothDates);
			toggle.textContent = includeBothDates ? includeLabelOn : includeLabelOff;
		});
	};

	const syncResultDisplay = () => {
		const fromStatus = resolveFieldStatus(fields.from.segments);
		const toStatus = resolveFieldStatus(fields.to.segments);
		const bothValid = fromStatus === "valid" && toStatus === "valid";

		// empty / incomplete / invalid：結果歸零，不保留上一筆 valid
		const fromDate = bothValid ? parseDateSegments(fields.from.segments) : null;
		const toDate = bothValid ? parseDateSegments(fields.to.segments) : null;
		const days = computeDaysBetweenResult(fromDate, toDate, includeBothDates);
		const unit = formatPrimaryDayUnit(days, resultLocale);
		const weeksLine = formatWeeksAndDaysLine(days, resultLocale);
		const digitCount = String(Math.abs(days)).length;
		const digitBucket =
			digitCount <= 3 ? "1-3" : digitCount === 4 ? "4" : digitCount === 5 ? "5" : "6plus";

		root.setAttribute("data-dbdv2-result-digits", digitBucket);

		if (resultDays) {
			resultDays.textContent = String(days);
			resultDays.setAttribute("aria-label", `${days} ${unit}`);
		}

		if (resultUnit) {
			resultUnit.textContent = unit;
		}

		if (resultWeeks) {
			resultWeeks.textContent = weeksLine;
		}
	};

	const sideCompact = (key: FieldKey): string => {
		const { segments } = fields[key];
		const status = resolveFieldStatus(segments);

		if (status === "valid") {
			const date = parseDateSegments(segments);
			if (date) {
				return `${String(date.year).padStart(4, "0")}/${String(date.month).padStart(2, "0")}/${String(date.day).padStart(2, "0")}`;
			}
		}

		if (status === "empty") {
			return "—";
		}

		// incomplete / invalid：不顯示成已正規化的 valid 外觀
		const raw = formatSegmentsDisplay(segments).replace(/ \/ /g, "/");
		return raw || "—";
	};

	const syncMobileCapsule = () => {
		if (!mobileRange) {
			return;
		}

		const fromStatus = resolveFieldStatus(fields.from.segments);
		const toStatus = resolveFieldStatus(fields.to.segments);

		if (fromStatus === "empty" && toStatus === "empty") {
			mobileRange.textContent = emptyLabel;
			return;
		}

		if (fromStatus === "valid" && toStatus === "valid" && fields.from.lastValid && fields.to.lastValid) {
			mobileRange.textContent = formatDateRangeCompact(fields.from.lastValid, fields.to.lastValid);
			return;
		}

		mobileRange.textContent = `${sideCompact("from")} — ${sideCompact("to")}`;
	};

	const syncInvalidIcon = (key: FieldKey) => {
		const show = resolveFieldStatus(fields[key].segments) === "invalid";
		invalidIcons[key].forEach((icon) => {
			if (!icon) {
				return;
			}
			icon.hidden = !show;
		});
	};

	const setInputValue = (
		input: HTMLInputElement,
		segments: DateSegments,
		caret: number | null,
		normalized: boolean,
	) => {
		const value = normalized
			? formatSegmentsNormalized(segments)
			: formatSegmentsDisplay(segments);
		input.value = value;

		if (caret !== null && document.activeElement === input) {
			const nextCaret = Math.max(0, Math.min(caret, value.length));
			input.setSelectionRange(nextCaret, nextCaret);
		}
	};

	const syncFieldDisplays = (
		key: FieldKey,
		source: HTMLInputElement | null,
		caret: number | null,
		normalized = false,
	) => {
		const segments = fields[key].segments;
		inputs[key].forEach((input) => {
			const useCaret = source === input ? caret : null;
			setInputValue(input, segments, useCaret, normalized && source !== input ? true : normalized);
		});
		syncInvalidIcon(key);
		syncMobileCapsule();
	};

	const evaluateField = (key: FieldKey) => {
		const status = resolveFieldStatus(fields[key].segments);

		if (status === "valid") {
			const date = parseDateSegments(fields[key].segments);
			fields[key].lastValid = date;
		} else if (status === "invalid" || status === "empty") {
			// valid → invalid / empty：不保留錯誤日期為 valid 顯示來源
			fields[key].lastValid = null;
		}
		// incomplete：保留 lastValid 僅供內部；capsule 用 sideCompact 不顯示成 valid
		// 結果區一律依目前 status 重算，incomplete 也會歸零

		syncInvalidIcon(key);
		syncMobileCapsule();
		syncResultDisplay();
	};

	const focusDesktopTo = () => {
		desktopTo.focus({ preventScroll: true });
		const len = desktopTo.value.length;
		desktopTo.setSelectionRange(len, len);
	};

	const maybeDesktopAutoFocusTo = (
		key: FieldKey,
		wasComplete: boolean,
		options: { fromPaste?: boolean; fromBlurOrEnter?: boolean } = {},
	) => {
		if (key !== "from" || suppressAutoFocusTo) {
			return;
		}

		const nowComplete = isEntryCompleteForAutoFocus(fields.from.segments, options);
		if (wasComplete || !nowComplete) {
			return;
		}

		if (
			!options.fromBlurOrEnter &&
			document.activeElement !== desktopFrom
		) {
			return;
		}

		// Desktop only：From 真正完成後才 focus To；不在 mobile sheet 跨欄
		focusDesktopTo();
	};

	const processInputChange = (
		key: FieldKey,
		source: HTMLInputElement,
		inputType: string,
		data: string | null,
		selectionStart: number,
		selectionEnd: number,
	) => {
		const current = fields[key].segments;
		const formatted = formatSegmentsDisplay(current);
		const wasComplete = isEntryCompleteForAutoFocus(current);
		const isFullSelection =
			formatted.length > 0 &&
			selectionStart === 0 &&
			selectionEnd >= formatted.length;

		const resolvedInputType =
			isFullSelection &&
			(inputType === "deleteContentBackward" || inputType === "deleteContentForward")
				? "clearAll"
				: inputType;

		const { segments, caret } = applySegmentInputChange(
			current,
			resolvedInputType,
			data,
			selectionStart,
			selectionEnd,
		);

		fields[key].segments = segments;
		syncFieldDisplays(key, source, caret);
		evaluateField(key);
		maybeDesktopAutoFocusTo(key, wasComplete);
	};

	const bindSmartInput = (key: FieldKey, input: HTMLInputElement) => {
		input.addEventListener("beforeinput", (event) => {
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
				processInputChange(
					key,
					input,
					inputType,
					inputEvent.data,
					selectionStart,
					selectionEnd,
				);
			}
		});

		input.addEventListener("paste", (event) => {
			event.preventDefault();
			const text = event.clipboardData?.getData("text") ?? "";
			const wasComplete = isEntryCompleteForAutoFocus(fields[key].segments);
			const isDesktopField = input === desktopFrom || input === desktopTo;

			// Desktop：整段日期範圍 paste → 自動拆 From / To（不影響 mobile sheet）
			if (isDesktopField) {
				const range = parseDateRangePaste(text);

				if (range) {
					fields.from.segments = normalizeSegmentsForBlur(range.from);
					fields.to.segments = normalizeSegmentsForBlur(range.to);
					syncFieldDisplays("from", null, null, true);
					syncFieldDisplays("to", null, null, true);
					evaluateField("from");
					evaluateField("to");
					return;
				}
			}

			const next = segmentsFromPastedText(text);
			fields[key].segments = next;
			syncFieldDisplays(key, input, formatSegmentsDisplay(next).length);
			evaluateField(key);
			maybeDesktopAutoFocusTo(key, wasComplete, { fromPaste: true });
		});

		input.addEventListener("blur", () => {
			if (isSegmentsEmpty(fields[key].segments)) {
				syncFieldDisplays(key, null, null, true);
				evaluateField(key);
				return;
			}

			fields[key].segments = normalizeSegmentsForBlur(fields[key].segments);
			syncFieldDisplays(key, null, null, true);
			evaluateField(key);
		});

		input.addEventListener("keydown", (event) => {
			if (event.key !== "Enter") {
				return;
			}

			event.preventDefault();

			if (!isSegmentsEmpty(fields[key].segments)) {
				fields[key].segments = normalizeSegmentsForBlur(fields[key].segments);
				syncFieldDisplays(key, input, null, true);
				evaluateField(key);
			}

			if (key === "from") {
				maybeDesktopAutoFocusTo("from", false, { fromBlurOrEnter: true });
			} else {
				input.blur();
			}
		});

		input.addEventListener("focus", () => {
			if (input === desktopTo || input === sheetTo) {
				suppressAutoFocusTo = true;
			}
		});
	};

	bindSmartInput("from", desktopFrom);
	bindSmartInput("to", desktopTo);
	bindSmartInput("from", sheetFrom);
	bindSmartInput("to", sheetTo);

	includeToggles.forEach((toggle) => {
		toggle.addEventListener("click", () => {
			includeBothDates = !includeBothDates;
			syncIncludeControls();
			syncResultDisplay();
		});
	});

	// 初始：From / To empty；結果 0；Include Off
	syncIncludeControls();
	syncFieldDisplays("from", null, null, true);
	syncFieldDisplays("to", null, null, true);
	evaluateField("from");
	evaluateField("to");
}

function initDaysBetweenDates(root: HTMLElement): void {
	if (initializedRoots.has(root)) {
		return;
	}

	initializedRoots.add(root);
	initDrawer(root);
	initMobileSheet(root);
	initDateInputs(root);
}

function boot(): void {
	document
		.querySelectorAll<HTMLElement>("[data-days-between-dates-v2]")
		.forEach((root) => {
			initDaysBetweenDates(root);
		});
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
	boot();
}
