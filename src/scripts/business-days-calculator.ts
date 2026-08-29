/**
 * Business Days Calculator client script.
 * B1A: desktop Related drawer collapse / expand
 * B1B: calendar popover open/close + mobile sheet open/close / overlay / scroll lock
 * B2A: Desktop／Mobile Smart Date Input 共用單一 state、
 *      empty/incomplete/valid/invalid、invalid icons、反向自動交換
 * B2B: UTC ordinal 工作日計算、即時結果、英文單複數 formatter
 * B2C: Desktop Calendar via shared DesktopCalendar（popover-compact）adapter
 */
import {
	applySegmentInputChange,
	emptyDateSegments,
	formatDateRangeCompact,
	formatSegmentsDisplay,
	formatSegmentsNormalized,
	isEntryCompleteForAutoFocus,
	isSegmentsEmpty,
	MAX_DATE_YEAR,
	MIN_DATE_YEAR,
	normalizeSegmentsForBlur,
	parseDateRangePaste,
	parseDateSegments,
	resolveFieldStatus,
	resolveOrderedRange,
	segmentsFromCalendarDate,
	segmentsFromPastedText,
	type CalendarDate,
	type DateSegments,
} from "../lib/businessDaysCalculatorDateInput";
import {
	ZERO_BUSINESS_DAYS_COUNT,
	calculateBusinessDaysRange,
	type BusinessDaysCount,
} from "../lib/businessDaysCalculatorMath";
import {
	createDesktopCalendar,
	type DesktopCalendarApi,
	type SdcCalendarDate,
} from "./desktop-calendar-controller";

type FieldKey = "from" | "to";
type ResultLocale = "en" | "zh";

interface BusinessDaysLayoutContract {
	DESKTOP_MQ: string;
	LANDSCAPE_MQ: string;
	resolveLayoutMode: (win?: Window) => "desktop" | "portrait" | "landscape-date";
	mapRsLayout: (mode: "desktop" | "portrait" | "landscape-date") => "desktop" | "portrait" | "landscape";
	applyLayoutAttrs: (doc?: Document) => void;
}

declare global {
	interface Window {
		TimivaBusinessDaysLayout?: BusinessDaysLayoutContract;
	}
}

function resolveResultLocale(root: HTMLElement): ResultLocale {
	const attr = root.getAttribute("data-bdcv2-result-locale");
	if (attr === "zh" || attr === "en") {
		return attr;
	}

	return document.documentElement.lang.toLowerCase().startsWith("zh") ? "zh" : "en";
}

/** UI formatter — plurals live here, not in math utility. */
function formatPrimaryUnit(businessDays: number, locale: ResultLocale): string {
	if (locale === "zh") {
		return "個工作日";
	}

	return businessDays === 1 ? "business day" : "business days";
}

function formatTotalDaysLabel(totalDays: number, locale: ResultLocale): string {
	if (locale === "zh") {
		return "總天數";
	}

	return totalDays === 1 ? "day total" : "days total";
}

function formatWeekendDaysLabel(weekendDays: number, locale: ResultLocale): string {
	if (locale === "zh") {
		return "週末天數";
	}

	return weekendDays === 1 ? "weekend day" : "weekend days";
}

function initResultSummaryLayout(root: HTMLElement): void {
	const layoutContract = window.TimivaBusinessDaysLayout;
	const resultSummaryEl = root.querySelector<HTMLElement>("[data-result-summary]");

	if (!resultSummaryEl || !layoutContract) {
		return;
	}

	const desktopMedia = window.matchMedia(
		layoutContract.DESKTOP_MQ ?? "(min-width: 768px) and (hover: hover)",
	);
	const landscapeMedia = window.matchMedia(
		layoutContract.LANDSCAPE_MQ ??
			"(orientation: landscape) and (max-height: 700px) and (max-width: 1200px) and (hover: none)",
	);

	const syncResultSummaryLayout = () => {
		const mode = layoutContract.resolveLayoutMode(window);
		resultSummaryEl.setAttribute("data-rs-layout", layoutContract.mapRsLayout(mode));
	};

	syncResultSummaryLayout();

	desktopMedia.addEventListener("change", syncResultSummaryLayout);
	landscapeMedia.addEventListener("change", syncResultSummaryLayout);
	window.addEventListener("resize", syncResultSummaryLayout);
	window.addEventListener("orientationchange", () => {
		window.setTimeout(syncResultSummaryLayout, 200);
		window.setTimeout(syncResultSummaryLayout, 550);
	});
	window.addEventListener("pageshow", (event) => {
		if (event.persisted) {
			syncResultSummaryLayout();
		}
	});
}

function initDrawer(root: HTMLElement): void {
	const drawer = root.querySelector<HTMLElement>("[data-bdcv2-drawer]");
	const shell = root.querySelector<HTMLElement>("[data-bdcv2-drawer-shell]");
	const toggle = root.querySelector<HTMLButtonElement>("[data-bdcv2-drawer-toggle]");
	const related = root.querySelector<HTMLElement>("[data-bdcv2-related-tools]");
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
	close: () => void;
	isOpen: () => boolean;
} | null {
	const portal = document.querySelector<HTMLElement>("[data-bdcv2-sheet-portal]");
	const overlay = portal?.querySelector<HTMLElement>("[data-bdcv2-sheet-overlay]");
	const sheet = portal?.querySelector<HTMLElement>("[data-bdcv2-sheet]");
	const openTriggers = root.querySelectorAll<HTMLElement>("[data-bdcv2-sheet-open]");
	const sheetInputs = portal
		? [...portal.querySelectorAll<HTMLInputElement>(".bdcv2-date-input")]
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
	const layoutContract = window.TimivaBusinessDaysLayout;
	const desktopMq = window.matchMedia(
		layoutContract?.DESKTOP_MQ ?? "(min-width: 768px) and (hover: hover)",
	);
	/* Keyboard landscape：與 canonical Mobile Landscape interaction gate 對齊（含 hover: none） */
	const landscapeMq = window.matchMedia(
		layoutContract?.LANDSCAPE_MQ ??
			"(orientation: landscape) and (max-height: 700px) and (max-width: 1200px) and (hover: none)",
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
		root.removeAttribute("data-bdcv2-keyboard-open");
		root.style.removeProperty("--bdcv2-keyboard-shift");
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

		// Landscape + keyboard + iOS accessory bar（Timiva 共用規則 / Age／DBD 已驗收）：
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
		root.setAttribute("data-bdcv2-keyboard-open", "true");
		root.style.setProperty("--bdcv2-keyboard-shift", `${bottomInset}px`);
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

	const closeSheet = () => {
		if (!isSheetOpen) {
			return;
		}

		isSheetOpen = false;
		root.removeAttribute("data-bdcv2-sheet-open");
		sheet.classList.remove("is-open");
		sheet.setAttribute("aria-hidden", "true");
		sheet.setAttribute("inert", "");
		overlay.classList.remove("is-visible");
		overlay.hidden = true;
		overlay.setAttribute("aria-hidden", "true");
		unlockBodyScroll();
		lastTrigger?.focus({ preventScroll: true });
		lastTrigger = null;
	};

	const openSheet = (trigger: HTMLElement) => {
		lastTrigger = trigger;
		isSheetOpen = true;
		root.setAttribute("data-bdcv2-sheet-open", "true");
		overlay.hidden = false;
		overlay.classList.add("is-visible");
		overlay.setAttribute("aria-hidden", "false");
		sheet.removeAttribute("inert");
		sheet.classList.add("is-open");
		sheet.setAttribute("aria-hidden", "false");
		lockBodyScroll();
		stabilizePageScroll();
	};

	for (const trigger of openTriggers) {
		trigger.addEventListener("click", (event) => {
			event.preventDefault();
			openSheet(trigger);
		});
	}

	overlay.addEventListener("click", (event) => {
		event.preventDefault();
		closeSheet();
	});

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

	/*
	 * Desktop composition lifecycle：進入 Desktop（768 + hover:hover）時若 MSB 仍 open，
	 * 走正式 closeSheet（scroll lock／inert／overlay／focus），避免 short-height hybrid。
	 * 每次 live matchMedia（勿只依賴建立時的 MediaQueryList.matches 快取）。
	 */
	const syncSheetToDesktopComposition = () => {
		const isDesktop = window.matchMedia(
			layoutContract?.DESKTOP_MQ ?? "(min-width: 768px) and (hover: hover)",
		).matches;
		if (isDesktop && isSheetOpen) {
			closeSheet();
		}
	};
	desktopMq.addEventListener("change", syncSheetToDesktopComposition);
	window.addEventListener("resize", syncSheetToDesktopComposition);
	window.addEventListener("orientationchange", () => {
		window.setTimeout(syncSheetToDesktopComposition, 200);
		window.setTimeout(syncSheetToDesktopComposition, 550);
	});
	syncSheetToDesktopComposition();

	return {
		close: closeSheet,
		isOpen: () => isSheetOpen,
	};
}

type CalendarPickMode = "range" | "edit-start" | "edit-end";

type BdcDateApi = {
	getSegments: (key: FieldKey) => DateSegments;
	applyCalendarPick: (
		date: CalendarDate,
		mode: CalendarPickMode,
	) => "start" | "complete" | "edit";
	subscribe: (listener: () => void) => () => void;
};

/**
 * B2C：Desktop Calendar adapter — shared DesktopCalendar（popover-compact）。
 * 工具保留 pickMode／關閉規則／Smart Date 同步；shared 擁有 DOM／render／panels。
 */
function initCalendarPopover(
	root: HTMLElement,
	dateApi: BdcDateApi,
): {
	close: () => void;
	isOpen: () => boolean;
	handleEscape: () => boolean;
	openWithMode: (mode: CalendarPickMode) => void;
	setPickModeIfOpen: (mode: CalendarPickMode) => void;
} | null {
	const toggle = root.querySelector<HTMLButtonElement>("[data-bdcv2-calendar-toggle]");
	const calendarRoot = root.querySelector<HTMLElement>("[data-desktop-calendar]");
	const inputShell = root.querySelector<HTMLElement>(".bdcv2-date-range-shell--desktop");

	if (!toggle || !calendarRoot) {
		return null;
	}

	const intlLocale = resolveResultLocale(root) === "zh" ? "zh-Hant" : "en-US";
	let pickMode: CalendarPickMode = "range";

	const readFieldDate = (key: FieldKey): SdcCalendarDate | null => {
		const status = resolveFieldStatus(dateApi.getSegments(key));
		if (status !== "valid") {
			return null;
		}
		return parseDateSegments(dateApi.getSegments(key));
	};

	const syncViewToPickMode = (api: DesktopCalendarApi) => {
		const from = readFieldDate("from");
		const to = readFieldDate("to");
		const anchor =
			pickMode === "edit-end" ? (to ?? from) : (from ?? to);
		if (anchor) {
			api.setView(anchor.year, anchor.month);
		}
	};

	const calendar = createDesktopCalendar({
		root: calendarRoot,
		variant: "popover-compact",
		selectionMode: "range",
		intlLocale,
		yearList: {
			min: MIN_DATE_YEAR,
			max: MAX_DATE_YEAR,
			mode: "full",
		},
		getMinDate: () => ({ year: MIN_DATE_YEAR, month: 1, day: 1 }),
		getMaxDate: () => ({ year: MAX_DATE_YEAR, month: 12, day: 31 }),
		getSelection: () => ({
			start: readFieldDate("from"),
			end: readFieldDate("to"),
		}),
		onSelect: ({ date }) => {
			const result = dateApi.applyCalendarPick(date, pickMode);
			// range 完成才關閉；edit-start／edit-end 保持開啟
			return { shouldClose: result === "complete" };
		},
		getTrigger: () => toggle,
		getPositionAnchor: () => inputShell ?? toggle,
		placement: "above",
		/**
		 * Restore pre-migration BDC geometry:
		 * left = calendar-icon left edge（偏右，避開中央結果）
		 * top = date-shell top − gap − height
		 */
		resolvePopoverPosition: ({ width, height, gap, viewportPad, viewportWidth }) => {
			const iconRect = toggle.getBoundingClientRect();
			const shellRect = inputShell?.getBoundingClientRect() ?? iconRect;
			const left = Math.min(
				Math.max(viewportPad, iconRect.left),
				viewportWidth - width - viewportPad,
			);
			let top = shellRect.top - gap - height;
			if (top < viewportPad) {
				top = viewportPad;
			}
			return { left, top };
		},
		getOutsideClickExclusions: () => {
			const exclusions: HTMLElement[] = [];
			if (inputShell) {
				exclusions.push(inputShell);
			}
			return exclusions;
		},
		onOpenChange: (open) => {
			if (!open) {
				pickMode = "range";
			}
		},
	});

	const unsubscribe = dateApi.subscribe(() => {
		if (calendar.isOpen()) {
			calendar.refresh();
		}
	});

	const openWithMode = (mode: CalendarPickMode) => {
		pickMode = mode;
		if (calendar.isOpen()) {
			syncViewToPickMode(calendar);
			calendar.refresh();
			return;
		}
		calendar.open();
		syncViewToPickMode(calendar);
	};

	const setPickModeIfOpen = (mode: CalendarPickMode) => {
		if (!calendar.isOpen()) {
			return;
		}
		pickMode = mode;
		syncViewToPickMode(calendar);
		calendar.refresh();
	};

	toggle.addEventListener("click", (event) => {
		event.preventDefault();
		event.stopPropagation();
		if (calendar.isOpen()) {
			calendar.close();
			return;
		}
		openWithMode("range");
	});

	const originalDestroy = calendar.destroy.bind(calendar);
	const api = {
		close: () => calendar.close(),
		isOpen: () => calendar.isOpen(),
		openWithMode,
		setPickModeIfOpen,
		handleEscape: () => calendar.handleEscape(),
		destroy: () => {
			unsubscribe();
			originalDestroy();
		},
	};

	return api;
}


/**
 * B2A／B2B／B2C：Desktop／Mobile Smart Date 共用 state；
 * 兩個 complete valid → 即時計算；否則結果歸零。
 * Desktop Calendar 透過同一 API 寫入，不另建第二套日期 state。
 */
function initDateInputs(
	root: HTMLElement,
	options: {
		isCalendarOpen?: () => boolean;
		onDesktopFieldActivate?: (key: FieldKey) => void;
	} = {},
): BdcDateApi | null {
	const desktopFrom = root.querySelector<HTMLInputElement>("[data-bdcv2-desktop-from]");
	const desktopTo = root.querySelector<HTMLInputElement>("[data-bdcv2-desktop-to]");
	const sheetFrom = document.querySelector<HTMLInputElement>("[data-bdcv2-sheet-from]");
	const sheetTo = document.querySelector<HTMLInputElement>("[data-bdcv2-sheet-to]");
	const mobileRange = root.querySelector<HTMLElement>("[data-bdcv2-mobile-range]");
	const resultSummaryEl = root.querySelector<HTMLElement>("[data-result-summary]");

	const desktopFromInvalid = root.querySelector<HTMLElement>(
		"[data-bdcv2-desktop-from-invalid]",
	);
	const desktopToInvalid = root.querySelector<HTMLElement>(
		"[data-bdcv2-desktop-to-invalid]",
	);
	const sheetFromInvalid = document.querySelector<HTMLElement>(
		"[data-bdcv2-sheet-from-invalid]",
	);
	const sheetToInvalid = document.querySelector<HTMLElement>(
		"[data-bdcv2-sheet-to-invalid]",
	);

	if (!desktopFrom || !desktopTo || !sheetFrom || !sheetTo) {
		return null;
	}

	const resultLocale = resolveResultLocale(root);
	const emptyLabel =
		mobileRange?.getAttribute("data-bdcv2-empty-label")?.trim() || "Select dates";

	// 單一 state：fromSegments／toSegments（Desktop 與 Mobile 共用並同步）
	const fields: Record<FieldKey, { segments: DateSegments }> = {
		from: { segments: emptyDateSegments() },
		to: { segments: emptyDateSegments() },
	};

	const listeners = new Set<() => void>();
	const notify = (): void => {
		listeners.forEach((listener) => {
			listener();
		});
	};

	const inputs: Record<FieldKey, HTMLInputElement[]> = {
		from: [desktopFrom, sheetFrom],
		to: [desktopTo, sheetTo],
	};

	const invalidIcons: Record<FieldKey, Array<HTMLElement | null>> = {
		from: [desktopFromInvalid, sheetFromInvalid],
		to: [desktopToInvalid, sheetToInvalid],
	};

	const allDateInputs = [desktopFrom, desktopTo, sheetFrom, sheetTo];

	let suppressAutoFocusTo = false;

	const syncResultDisplay = () => {
		const fromStatus = resolveFieldStatus(fields.from.segments);
		const toStatus = resolveFieldStatus(fields.to.segments);
		const bothValid = fromStatus === "valid" && toStatus === "valid";

		let counts: BusinessDaysCount = ZERO_BUSINESS_DAYS_COUNT;

		if (bothValid) {
			// B2A 已排序區間；Math 不再自行交換
			const range = resolveOrderedRange(fields.from.segments, fields.to.segments);
			if (range) {
				counts = calculateBusinessDaysRange(range.start, range.end);
			}
		}

		if (!resultSummaryEl) {
			return;
		}

		const primaryUnit = formatPrimaryUnit(counts.businessDays, resultLocale);
		const totalLabel = formatTotalDaysLabel(counts.totalDays, resultLocale);
		const weekendLabel = formatWeekendDaysLabel(counts.weekendDays, resultLocale);

		resultSummaryEl.dispatchEvent(
			new CustomEvent("rs:update", {
				bubbles: false,
				detail: {
					primary: {
						value: counts.businessDays,
						displayValue: String(counts.businessDays),
						label: primaryUnit,
						ariaLabel: `${counts.businessDays} ${primaryUnit}`,
					},
					secondary: [
						{
							key: "total-days",
							value: counts.totalDays,
							displayValue: String(counts.totalDays),
							label: totalLabel,
						},
						{
							key: "weekend-days",
							value: counts.weekendDays,
							displayValue: String(counts.weekendDays),
							label: weekendLabel,
						},
					],
				},
			}),
		);
	};

	const isAnyDateInputFocused = (): boolean =>
		allDateInputs.some((input) => document.activeElement === input);

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

	const syncInvalidIcon = (key: FieldKey) => {
		const show = resolveFieldStatus(fields[key].segments) === "invalid";
		invalidIcons[key].forEach((icon) => {
			icon?.toggleAttribute("hidden", !show);
		});
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

		if (fromStatus === "valid" && toStatus === "valid") {
			const fromDate = parseDateSegments(fields.from.segments);
			const toDate = parseDateSegments(fields.to.segments);

			if (fromDate && toDate) {
				mobileRange.textContent = formatDateRangeCompact(fromDate, toDate);
				return;
			}
		}

		mobileRange.textContent = `${sideCompact("from")} — ${sideCompact("to")}`;
	};

	const syncFieldViews = (
		key: FieldKey,
		source: HTMLInputElement | null = null,
		caret: number | null = null,
		normalized = false,
	) => {
		const segments = fields[key].segments;
		inputs[key].forEach((input) => {
			const useCaret = source === input ? caret : null;
			setInputValue(input, segments, useCaret, normalized);
		});
		syncInvalidIcon(key);
		syncMobileCapsule();
		syncResultDisplay();
		notify();
	};

	/**
	 * 反向自動交換（B2A resolveOrderedRange）：
	 * - 只在兩個日期皆 complete valid 且反向時交換
	 * - 任一日期欄位仍 focused 時延後（避免逐鍵 swap 干擾輸入），
	 *   於 blur／Enter／sheet 關閉離焦後套用
	 * - 交換後同步 Desktop 與 Mobile，不顯示錯誤
	 */
	const maybeApplyOrderedSwap = (options: { force?: boolean } = {}): void => {
		const range = resolveOrderedRange(fields.from.segments, fields.to.segments);

		if (!range || !range.swapped) {
			return;
		}

		if (!options.force && isAnyDateInputFocused()) {
			return;
		}

		fields.from.segments = segmentsFromCalendarDate(range.start);
		fields.to.segments = segmentsFromCalendarDate(range.end);
		syncFieldViews("from", null, null, true);
		syncFieldViews("to", null, null, true);
	};

	const scheduleOrderedSwapCheck = () => {
		window.setTimeout(() => {
			maybeApplyOrderedSwap();
		}, 0);
	};

	/**
	 * Calendar 選日：依 pick mode 寫入同一 from／to segments。
	 * range＝兩次選取（complete 後關閉）；edit-start／edit-end＝只替換一端並保持開啟。
	 * 反向排序只走既有 B2A maybeApplyOrderedSwap。
	 */
	const applyCalendarPick = (
		date: CalendarDate,
		mode: CalendarPickMode,
	): "start" | "complete" | "edit" => {
		const picked = segmentsFromCalendarDate(date);

		if (mode === "edit-start") {
			fields.from.segments = picked;
			suppressAutoFocusTo = true;
			syncFieldViews("from", null, null, true);
			maybeApplyOrderedSwap({ force: true });
			return "edit";
		}

		if (mode === "edit-end") {
			fields.to.segments = picked;
			suppressAutoFocusTo = true;
			syncFieldViews("to", null, null, true);
			maybeApplyOrderedSwap({ force: true });
			return "edit";
		}

		const fromValid = resolveFieldStatus(fields.from.segments) === "valid";
		const toValid = resolveFieldStatus(fields.to.segments) === "valid";

		// range：尚無有效 from、或已有完整區間 → 這次點擊是新區間起點
		if (!fromValid || toValid) {
			fields.from.segments = picked;
			fields.to.segments = emptyDateSegments();
			suppressAutoFocusTo = false;
			syncFieldViews("from", null, null, true);
			syncFieldViews("to", null, null, true);
			return "start";
		}

		// range：已有有效 from、to 尚未完整 valid → 這次是結束日
		fields.to.segments = picked;
		suppressAutoFocusTo = true;
		syncFieldViews("to", null, null, true);
		maybeApplyOrderedSwap({ force: true });
		return "complete";
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

		if (!options.fromBlurOrEnter && document.activeElement !== desktopFrom) {
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
			formatted.length > 0 && selectionStart === 0 && selectionEnd >= formatted.length;

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
		// Continuous stream：強制 caret 在顯示字尾，避免 iOS stale selection 影響下一碼
		const nextCaret =
			segments.preferStream && resolvedInputType === "insertText"
				? formatSegmentsDisplay(segments).length
				: caret;
		syncFieldViews(key, source, nextCaret);
		maybeDesktopAutoFocusTo(key, wasComplete);
	};

	const bindSmartInput = (key: FieldKey, input: HTMLInputElement) => {
		const isDesktopField = input === desktopFrom || input === desktopTo;

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

			// Desktop：整段日期範圍 paste → 自動拆 From / To（不影響 mobile sheet）
			if (isDesktopField) {
				const range = parseDateRangePaste(text);

				if (range) {
					fields.from.segments = normalizeSegmentsForBlur(range.from);
					fields.to.segments = normalizeSegmentsForBlur(range.to);
					syncFieldViews("from", null, null, true);
					syncFieldViews("to", null, null, true);
					maybeApplyOrderedSwap({ force: true });
					return;
				}
			}

			const next = segmentsFromPastedText(text);
			fields[key].segments = next;
			syncFieldViews(key, input, formatSegmentsDisplay(next).length);
			maybeDesktopAutoFocusTo(key, wasComplete, { fromPaste: true });
			scheduleOrderedSwapCheck();
		});

		input.addEventListener("blur", () => {
			if (!isSegmentsEmpty(fields[key].segments)) {
				fields[key].segments = normalizeSegmentsForBlur(fields[key].segments);
			}

			syncFieldViews(key, null, null, true);
			scheduleOrderedSwapCheck();
		});

		input.addEventListener("keydown", (event) => {
			if (event.key !== "Enter") {
				return;
			}

			event.preventDefault();

			if (!isSegmentsEmpty(fields[key].segments)) {
				fields[key].segments = normalizeSegmentsForBlur(fields[key].segments);
				syncFieldViews(key, input, null, true);
			}

			if (key === "from" && isDesktopField) {
				maybeDesktopAutoFocusTo("from", false, { fromBlurOrEnter: true });
				scheduleOrderedSwapCheck();
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

	/**
	 * Calendar 已開啟：pointerdown 攔截開始／結束欄，避免 input focus／blur
	 * 觸發 sync → renderMonth 重建 day grid，把第一次日曆 click 吃掉。
	 * Calendar 關閉：不攔截，維持 Smart Date focus／caret／鍵盤。
	 */
	const bindDesktopFieldEditModePointer = (
		key: FieldKey,
		input: HTMLInputElement,
	) => {
		input.addEventListener("pointerdown", (event) => {
			if (!options.isCalendarOpen?.()) {
				return;
			}
			event.preventDefault();
			options.onDesktopFieldActivate?.(key);
		});
	};

	bindDesktopFieldEditModePointer("from", desktopFrom);
	bindDesktopFieldEditModePointer("to", desktopTo);

	// 初始：From／To empty；capsule 顯示空標籤；結果 0（無 LocalStorage）
	syncFieldViews("from", null, null, true);
	syncFieldViews("to", null, null, true);

	return {
		getSegments: (key) => ({ ...fields[key].segments }),
		applyCalendarPick,
		subscribe: (listener) => {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
	};
}


function bootstrap(): void {
	const root = document.querySelector<HTMLElement>("[data-business-days-calculator-v2]");
	if (!root) {
		return;
	}

	initDrawer(root);
	initResultSummaryLayout(root);

	const calendarBridge: {
		isOpen: () => boolean;
		onDesktopFieldActivate: (key: FieldKey) => void;
	} = {
		isOpen: () => false,
		onDesktopFieldActivate: () => {},
	};

	const dateApi = initDateInputs(root, {
		isCalendarOpen: () => calendarBridge.isOpen(),
		onDesktopFieldActivate: (key) => {
			calendarBridge.onDesktopFieldActivate(key);
		},
	});
	const calendar = dateApi ? initCalendarPopover(root, dateApi) : null;
	if (calendar) {
		calendarBridge.isOpen = () => calendar.isOpen();
		calendarBridge.onDesktopFieldActivate = (key) => {
			calendar.setPickModeIfOpen(key === "from" ? "edit-start" : "edit-end");
		};
	}
	const sheet = initMobileSheet(root);

	document.addEventListener("keydown", (event) => {
		if (event.key !== "Escape") {
			return;
		}
		if (calendar?.handleEscape()) {
			event.preventDefault();
			return;
		}
		if (sheet?.isOpen()) {
			sheet.close();
			event.preventDefault();
		}
	});
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
} else {
	bootstrap();
}
