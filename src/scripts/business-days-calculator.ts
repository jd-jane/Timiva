/**
 * Business Days Calculator client script.
 * B1A: desktop Related drawer collapse / expand
 * B1B: calendar popover open/close + mobile sheet open/close / overlay / scroll lock
 * B2A: Desktop／Mobile Smart Date Input 共用單一 state、
 *      empty/incomplete/valid/invalid、invalid icons、反向自動交換
 * B2B: UTC ordinal 工作日計算、即時結果、英文單複數 formatter
 * B2C: Desktop Calendar（AC 視覺 + DRC range 行為）寫入同一 from／to state
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

type FieldKey = "from" | "to";
type ResultLocale = "en" | "zh";

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
 * B2C：Desktop Calendar — AC 視覺殼 + DRC range 選取行為。
 * 寫入 B2A 同一組 from／to segments；不另建第二套日期 state、不重做反向排序。
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
	const popover = root.querySelector<HTMLElement>("[data-bdcv2-calendar-popover]");
	const grid = root.querySelector<HTMLElement>("[data-bdcv2-calendar-grid]");
	const monthTrigger = root.querySelector<HTMLButtonElement>("[data-bdcv2-month-trigger]");
	const yearTrigger = root.querySelector<HTMLButtonElement>("[data-bdcv2-year-trigger]");
	const monthLabel = root.querySelector<HTMLElement>("[data-bdcv2-month-label]");
	const yearLabel = root.querySelector<HTMLElement>("[data-bdcv2-year-label]");
	const monthPanel = root.querySelector<HTMLElement>("[data-bdcv2-month-panel]");
	const yearPanel = root.querySelector<HTMLElement>("[data-bdcv2-year-panel]");
	const monthGrid = root.querySelector<HTMLElement>("[data-bdcv2-month-grid]");
	const yearList = root.querySelector<HTMLElement>("[data-bdcv2-year-list]");
	const yearInput = root.querySelector<HTMLInputElement>("[data-bdcv2-year-input]");
	const monthPicker = root.querySelector<HTMLElement>("[data-bdcv2-month-picker]");
	const yearPicker = root.querySelector<HTMLElement>("[data-bdcv2-year-picker]");
	const prevBtn = root.querySelector<HTMLButtonElement>("[data-bdcv2-calendar-prev]");
	const nextBtn = root.querySelector<HTMLButtonElement>("[data-bdcv2-calendar-next]");

	if (
		!toggle ||
		!popover ||
		!grid ||
		!monthTrigger ||
		!yearTrigger ||
		!monthLabel ||
		!yearLabel ||
		!monthPanel ||
		!yearPanel ||
		!monthGrid ||
		!yearList ||
		!yearInput ||
		!monthPicker ||
		!yearPicker ||
		!prevBtn ||
		!nextBtn
	) {
		return null;
	}

	const locale = resolveResultLocale(root);
	const intlLocale = locale === "zh" ? "zh-Hant" : "en-US";
	const monthFormatter = new Intl.DateTimeFormat(intlLocale, { month: "short" });
	const formatMonthOption = (month: number) =>
		monthFormatter.format(new Date(2000, month - 1, 1));

	type ToolbarPanel = "none" | "month" | "year";
	let open = false;
	let pickMode: CalendarPickMode = "range";
	let toolbarPanel: ToolbarPanel = "none";
	let yearListReady = false;
	const now = new Date();
	let viewYear = now.getFullYear();
	let viewMonth = now.getMonth(); // 0-based

	const GAP = 8;
	const VIEWPORT_PAD = 16;
	const inputShell = root.querySelector<HTMLElement>(".bdcv2-date-range-shell--desktop");

	const clampViewToSelectableRange = () => {
		if (viewYear < MIN_DATE_YEAR) {
			viewYear = MIN_DATE_YEAR;
		}
		if (viewYear > MAX_DATE_YEAR) {
			viewYear = MAX_DATE_YEAR;
		}
		if (viewMonth < 0) {
			viewMonth = 0;
		}
		if (viewMonth > 11) {
			viewMonth = 11;
		}
	};

	const canGoPrevMonth = () =>
		viewYear > MIN_DATE_YEAR || (viewYear === MIN_DATE_YEAR && viewMonth > 0);

	const canGoNextMonth = () =>
		viewYear < MAX_DATE_YEAR || (viewYear === MAX_DATE_YEAR && viewMonth < 11);

	const positionPopover = () => {
		const iconRect = toggle.getBoundingClientRect();
		const shellRect = inputShell?.getBoundingClientRect() ?? iconRect;
		const width = Math.min(22 * 16, window.innerWidth - VIEWPORT_PAD * 2);
		popover.style.width = `${width}px`;

		const height = popover.offsetHeight;
		if (height <= 0) {
			return;
		}

		const left = Math.min(
			Math.max(VIEWPORT_PAD, iconRect.left),
			window.innerWidth - width - VIEWPORT_PAD,
		);

		let top = shellRect.top - GAP - height;
		if (top < VIEWPORT_PAD) {
			top = VIEWPORT_PAD;
		}

		popover.style.left = `${left}px`;
		popover.style.top = `${top}px`;
	};

	const repositionIfOpen = () => {
		if (open) {
			requestAnimationFrame(() => {
				positionPopover();
			});
		}
	};

	const syncViewToCurrentRange = () => {
		const from = parseDateSegments(dateApi.getSegments("from"));
		const to = parseDateSegments(dateApi.getSegments("to"));
		const anchor =
			pickMode === "edit-end" ? (to ?? from) : (from ?? to);
		if (anchor) {
			viewYear = anchor.year;
			viewMonth = anchor.month - 1;
			clampViewToSelectableRange();
			return;
		}
		const today = new Date();
		viewYear = today.getFullYear();
		viewMonth = today.getMonth();
		clampViewToSelectableRange();
	};

	const syncToolbarLabels = () => {
		monthLabel.textContent = formatMonthOption(viewMonth + 1);
		yearLabel.textContent = String(viewYear);
		prevBtn.disabled = !canGoPrevMonth();
		nextBtn.disabled = !canGoNextMonth();
	};

	const ensureYearList = () => {
		if (yearListReady) {
			return;
		}
		const frag = document.createDocumentFragment();
		for (let year = MIN_DATE_YEAR; year <= MAX_DATE_YEAR; year += 1) {
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "bdcv2-calendar-year-option";
			btn.setAttribute("role", "option");
			btn.setAttribute("data-bdcv2-year-option", String(year));
			btn.textContent = String(year);
			frag.appendChild(btn);
		}
		yearList.replaceChildren(frag);
		yearListReady = true;
	};

	const syncYearListSelection = () => {
		ensureYearList();
		yearList.querySelectorAll<HTMLButtonElement>("[data-bdcv2-year-option]").forEach((btn) => {
			const year = Number(btn.getAttribute("data-bdcv2-year-option"));
			const selected = year === viewYear;
			btn.classList.toggle("is-selected", selected);
			btn.setAttribute("aria-selected", selected ? "true" : "false");
		});
	};

	const scrollSelectedYearIntoView = () => {
		const selected = yearList.querySelector<HTMLElement>(
			`[data-bdcv2-year-option="${viewYear}"]`,
		);
		selected?.scrollIntoView({ block: "nearest" });
	};

	const renderMonthOptions = () => {
		const frag = document.createDocumentFragment();
		for (let month = 1; month <= 12; month += 1) {
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "bdcv2-calendar-month-option";
			btn.setAttribute("role", "option");
			btn.setAttribute("data-bdcv2-month-option", String(month));
			btn.setAttribute("aria-selected", month === viewMonth + 1 ? "true" : "false");
			if (month === viewMonth + 1) {
				btn.classList.add("is-selected");
			}
			btn.textContent = formatMonthOption(month);
			frag.appendChild(btn);
		}
		monthGrid.replaceChildren(frag);
	};

	const setToolbarPanel = (next: ToolbarPanel) => {
		toolbarPanel = next;
		const monthOpen = next === "month";
		const yearOpen = next === "year";

		monthPanel.hidden = !monthOpen;
		yearPanel.hidden = !yearOpen;
		monthTrigger.setAttribute("aria-expanded", monthOpen ? "true" : "false");
		yearTrigger.setAttribute("aria-expanded", yearOpen ? "true" : "false");

		if (monthOpen) {
			renderMonthOptions();
		}

		if (yearOpen) {
			ensureYearList();
			syncYearListSelection();
			yearInput.value = String(viewYear);
			requestAnimationFrame(() => {
				scrollSelectedYearIntoView();
				yearInput.focus({ preventScroll: true });
				yearInput.select();
			});
		}
	};

	const closeToolbarPanels = () => {
		if (toolbarPanel === "none") {
			return;
		}
		setToolbarPanel("none");
	};

	/** 僅在有效 4 位 1900–2100 時寫入 viewYear；無效不改狀態 */
	const applyYearInputValueIfValid = (): boolean => {
		const raw = yearInput.value.trim();
		if (!/^\d{4}$/.test(raw)) {
			return false;
		}
		const nextYear = Number(raw);
		if (
			!Number.isInteger(nextYear) ||
			nextYear < MIN_DATE_YEAR ||
			nextYear > MAX_DATE_YEAR
		) {
			return false;
		}
		viewYear = nextYear;
		clampViewToSelectableRange();
		return true;
	};

	const focusYearTrigger = () => {
		yearTrigger.focus({ preventScroll: true });
	};

	/** 焦點／指標離開整個年份面板：驗證輸入後關閉 */
	const leaveYearPanel = (options?: { focusTrigger?: boolean }): void => {
		if (toolbarPanel !== "year") {
			return;
		}
		applyYearInputValueIfValid();
		closeToolbarPanels();
		renderMonth();
		repositionIfOpen();
		if (options?.focusTrigger !== false) {
			focusYearTrigger();
		}
	};

	/** 從 list 選年：以選項為準（忽略輸入框草稿），關閉後焦點回年份按鈕 */
	const selectYearFromOption = (year: number): void => {
		viewYear = year;
		clampViewToSelectableRange();
		closeToolbarPanels();
		renderMonth();
		repositionIfOpen();
		focusYearTrigger();
	};

	const ordinal = (date: CalendarDate): number =>
		date.year * 10000 + date.month * 100 + date.day;

	const dayClassNames = (
		date: CalendarDate,
		from: CalendarDate | null,
		to: CalendarDate | null,
	): string => {
		const classes = ["calendar-day"];
		const today = new Date();
		if (
			date.year === today.getFullYear() &&
			date.month === today.getMonth() + 1 &&
			date.day === today.getDate()
		) {
			classes.push("is-today");
		}

		if (!from) {
			return classes.join(" ");
		}

		const cur = ordinal(date);
		const startOrd = ordinal(from);

		if (!to) {
			if (cur === startOrd) {
				classes.push("is-range-start", "is-range-single");
			}
			return classes.join(" ");
		}

		const ordered = resolveOrderedRange(
			segmentsFromCalendarDate(from),
			segmentsFromCalendarDate(to),
		);
		const lo = ordered ? ordinal(ordered.start) : Math.min(startOrd, ordinal(to));
		const hi = ordered ? ordinal(ordered.end) : Math.max(startOrd, ordinal(to));

		if (cur === lo && cur === hi) {
			classes.push("is-range-start", "is-range-end", "is-range-single");
		} else if (cur === lo) {
			classes.push("is-range-start");
		} else if (cur === hi) {
			classes.push("is-range-end");
		} else if (cur > lo && cur < hi) {
			classes.push("is-in-range");
		}

		return classes.join(" ");
	};

	const isSelectable = (date: CalendarDate): boolean =>
		date.year >= MIN_DATE_YEAR && date.year <= MAX_DATE_YEAR;

	const renderMonth = () => {
		clampViewToSelectableRange();
		syncToolbarLabels();

		const fromStatus = resolveFieldStatus(dateApi.getSegments("from"));
		const toStatus = resolveFieldStatus(dateApi.getSegments("to"));
		const from =
			fromStatus === "valid" ? parseDateSegments(dateApi.getSegments("from")) : null;
		const to = toStatus === "valid" ? parseDateSegments(dateApi.getSegments("to")) : null;

		const firstWeekday = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
		const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
		const frag = document.createDocumentFragment();

		for (let i = 0; i < firstWeekday; i += 1) {
			const empty = document.createElement("span");
			empty.className = "calendar-cell calendar-cell--empty";
			empty.setAttribute("aria-hidden", "true");
			frag.appendChild(empty);
		}

		for (let day = 1; day <= daysInMonth; day += 1) {
			const date: CalendarDate = { year: viewYear, month: viewMonth + 1, day };
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = dayClassNames(date, from, to);
			btn.textContent = String(day);
			btn.setAttribute("data-bdcv2-cal-day", String(day));
			btn.setAttribute(
				"aria-label",
				locale === "zh"
					? `${viewYear}年${viewMonth + 1}月${day}日`
					: `${formatMonthOption(viewMonth + 1)} ${day}, ${viewYear}`,
			);

			if (!isSelectable(date)) {
				btn.disabled = true;
			}

			frag.appendChild(btn);
		}

		grid.replaceChildren(frag);

		if (toolbarPanel === "month") {
			renderMonthOptions();
		}
		if (toolbarPanel === "year") {
			syncYearListSelection();
			yearInput.value = String(viewYear);
		}
	};

	const setOpen = (next: boolean) => {
		open = next;
		toggle.setAttribute("aria-expanded", String(open));
		popover.hidden = !open;
		popover.setAttribute("aria-hidden", String(!open));
		if (open) {
			syncViewToCurrentRange();
			renderMonth();
			requestAnimationFrame(() => {
				positionPopover();
			});
		} else {
			if (toolbarPanel === "year") {
				applyYearInputValueIfValid();
			}
			closeToolbarPanels();
			pickMode = "range";
		}
	};

	/** Calendar icon：開啟（或切回）range 模式 */
	const openWithMode = (mode: CalendarPickMode) => {
		pickMode = mode;
		if (open) {
			closeToolbarPanels();
			syncViewToCurrentRange();
			renderMonth();
			repositionIfOpen();
			return;
		}
		setOpen(true);
	};

	/** Calendar 已開啟時：僅切換 edit／range mode，不關閉 */
	const setPickModeIfOpen = (mode: CalendarPickMode) => {
		if (!open) {
			return;
		}
		pickMode = mode;
		closeToolbarPanels();
		syncViewToCurrentRange();
		renderMonth();
		repositionIfOpen();
	};

	toggle.addEventListener("click", (event) => {
		event.preventDefault();
		event.stopPropagation();
		if (open) {
			setOpen(false);
			return;
		}
		openWithMode("range");
	});

	monthTrigger.addEventListener("click", (event) => {
		event.preventDefault();
		event.stopPropagation();
		if (toolbarPanel === "year") {
			leaveYearPanel({ focusTrigger: false });
		}
		setToolbarPanel(toolbarPanel === "month" ? "none" : "month");
	});

	yearTrigger.addEventListener("click", (event) => {
		event.preventDefault();
		event.stopPropagation();
		if (toolbarPanel === "year") {
			leaveYearPanel();
		} else {
			setToolbarPanel("year");
		}
	});

	monthGrid.addEventListener("click", (event) => {
		const target = event.target;
		if (!(target instanceof HTMLElement)) {
			return;
		}
		const option = target.closest<HTMLButtonElement>("[data-bdcv2-month-option]");
		if (!option || !monthGrid.contains(option)) {
			return;
		}
		event.preventDefault();
		const month = Number(option.getAttribute("data-bdcv2-month-option"));
		if (!Number.isInteger(month) || month < 1 || month > 12) {
			return;
		}
		viewMonth = month - 1;
		clampViewToSelectableRange();
		closeToolbarPanels();
		renderMonth();
		repositionIfOpen();
	});

	// 先於 blur：按住年份選項時避免 input 失焦搶先還原／關閉
	yearList.addEventListener("pointerdown", (event) => {
		const target = event.target;
		if (!(target instanceof HTMLElement)) {
			return;
		}
		const option = target.closest<HTMLButtonElement>("[data-bdcv2-year-option]");
		if (!option || !yearList.contains(option)) {
			return;
		}
		event.preventDefault();
	});

	yearList.addEventListener("click", (event) => {
		const target = event.target;
		if (!(target instanceof HTMLElement)) {
			return;
		}
		const option = target.closest<HTMLButtonElement>("[data-bdcv2-year-option]");
		if (!option || !yearList.contains(option)) {
			return;
		}
		event.preventDefault();
		const year = Number(option.getAttribute("data-bdcv2-year-option"));
		if (
			!Number.isInteger(year) ||
			year < MIN_DATE_YEAR ||
			year > MAX_DATE_YEAR
		) {
			return;
		}
		selectYearFromOption(year);
	});

	yearInput.addEventListener("beforeinput", (event) => {
		const inputEvent = event as InputEvent;
		if (inputEvent.inputType?.startsWith("insert") && inputEvent.data) {
			if (!/^\d+$/.test(inputEvent.data)) {
				event.preventDefault();
			}
		}
	});

	yearInput.addEventListener("keydown", (event) => {
		if (event.key !== "Enter") {
			return;
		}
		event.preventDefault();
		const raw = yearInput.value.trim();
		if (!/^\d{4}$/.test(raw)) {
			yearInput.value = String(viewYear);
			return;
		}
		const nextYear = Number(raw);
		if (
			!Number.isInteger(nextYear) ||
			nextYear < MIN_DATE_YEAR ||
			nextYear > MAX_DATE_YEAR
		) {
			yearInput.value = String(viewYear);
			return;
		}
		selectYearFromOption(nextYear);
	});

	yearInput.addEventListener("blur", () => {
		// 等焦點落地：若仍在年份面板內（例如 Tab 到選項）則不驗證／不關
		requestAnimationFrame(() => {
			if (toolbarPanel !== "year") {
				return;
			}
			const active = document.activeElement;
			if (active instanceof Node && yearPanel.contains(active)) {
				return;
			}
			leaveYearPanel();
		});
	});

	prevBtn.addEventListener("click", (event) => {
		event.preventDefault();
		event.stopPropagation();
		if (toolbarPanel === "year") {
			leaveYearPanel({ focusTrigger: false });
		} else {
			closeToolbarPanels();
		}
		if (!canGoPrevMonth()) {
			return;
		}
		viewMonth -= 1;
		if (viewMonth < 0) {
			viewMonth = 11;
			viewYear -= 1;
		}
		clampViewToSelectableRange();
		renderMonth();
		repositionIfOpen();
	});

	nextBtn.addEventListener("click", (event) => {
		event.preventDefault();
		event.stopPropagation();
		if (toolbarPanel === "year") {
			leaveYearPanel({ focusTrigger: false });
		} else {
			closeToolbarPanels();
		}
		if (!canGoNextMonth()) {
			return;
		}
		viewMonth += 1;
		if (viewMonth > 11) {
			viewMonth = 0;
			viewYear += 1;
		}
		clampViewToSelectableRange();
		renderMonth();
		repositionIfOpen();
	});

	grid.addEventListener("click", (event) => {
		const target = event.target;
		if (!(target instanceof HTMLElement)) {
			return;
		}
		const dayBtn = target.closest<HTMLButtonElement>("[data-bdcv2-cal-day]");
		if (!dayBtn || !grid.contains(dayBtn) || dayBtn.disabled) {
			return;
		}
		event.preventDefault();
		event.stopPropagation();
		if (toolbarPanel === "year") {
			leaveYearPanel({ focusTrigger: false });
		} else {
			closeToolbarPanels();
		}

		const day = Number(dayBtn.getAttribute("data-bdcv2-cal-day"));
		if (!Number.isInteger(day) || day < 1) {
			return;
		}

		const result = dateApi.applyCalendarPick(
			{
				year: viewYear,
				month: viewMonth + 1,
				day,
			},
			pickMode,
		);
		renderMonth();
		// range 完成才關閉；edit-start／edit-end 保持開啟以便連續微調
		if (result === "complete") {
			setOpen(false);
		} else {
			repositionIfOpen();
		}
	});

	// 點日曆內、picker 外 → 關閉 toolbar 面板；避免冒泡到 document 關掉整顆 calendar
	popover.addEventListener("pointerdown", (event) => {
		event.stopPropagation();
		if (toolbarPanel === "none") {
			return;
		}
		const target = event.target;
		if (!(target instanceof Node)) {
			return;
		}
		const insideMonth = monthPicker.contains(target);
		const insideYear = yearPicker.contains(target);
		if (toolbarPanel === "month" && !insideMonth) {
			closeToolbarPanels();
		} else if (toolbarPanel === "year" && !insideYear) {
			leaveYearPanel({ focusTrigger: false });
		}
	});

	document.addEventListener("pointerdown", (event) => {
		if (!open) {
			return;
		}
		const target = event.target;
		if (!(target instanceof Node)) {
			return;
		}
		// Desktop 輸入殼內點擊（欄位切 mode／icon）不關閉；避免與 openWithMode 競速
		if (
			popover.contains(target) ||
			toggle.contains(target) ||
			inputShell?.contains(target)
		) {
			return;
		}
		setOpen(false);
	});

	window.addEventListener("resize", () => {
		if (open) {
			positionPopover();
		}
	});

	dateApi.subscribe(() => {
		if (open) {
			renderMonth();
		}
	});

	return {
		close: () => setOpen(false),
		isOpen: () => open,
		openWithMode,
		setPickModeIfOpen,
		handleEscape: () => {
			if (!open) {
				return false;
			}
			if (toolbarPanel === "year") {
				leaveYearPanel();
				return true;
			}
			if (toolbarPanel === "month") {
				closeToolbarPanels();
				return true;
			}
			setOpen(false);
			return true;
		},
	};
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

	const resultDays = root.querySelector<HTMLElement>("[data-bdcv2-result-days]");
	const resultUnit = root.querySelector<HTMLElement>("[data-bdcv2-result-unit]");
	const resultTotalDays = root.querySelector<HTMLElement>("[data-bdcv2-result-total-days]");
	const resultWeekendDays = root.querySelector<HTMLElement>(
		"[data-bdcv2-result-weekend-days]",
	);
	const resultTotalLabel = resultTotalDays?.parentElement?.querySelector<HTMLElement>(
		".bdcv2-result-secondary-label",
	);
	const resultWeekendLabel = resultWeekendDays?.parentElement?.querySelector<HTMLElement>(
		".bdcv2-result-secondary-label",
	);

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

		const primaryUnit = formatPrimaryUnit(counts.businessDays, resultLocale);
		const totalLabel = formatTotalDaysLabel(counts.totalDays, resultLocale);
		const weekendLabel = formatWeekendDaysLabel(counts.weekendDays, resultLocale);
		// 三欄取最大位數，避免主結果 3 位、次要 4 位時仍用大字級造成橫式重疊
		const digitCount = Math.max(
			String(Math.abs(counts.businessDays)).length,
			String(Math.abs(counts.totalDays)).length,
			String(Math.abs(counts.weekendDays)).length,
		);
		const digitBucket = digitCount <= 3 ? "1-3" : digitCount === 4 ? "4" : "5";

		root.setAttribute("data-bdcv2-result-digits", digitBucket);

		if (resultDays) {
			resultDays.textContent = String(counts.businessDays);
			resultDays.setAttribute("aria-label", `${counts.businessDays} ${primaryUnit}`);
		}

		if (resultUnit) {
			resultUnit.textContent = primaryUnit;
		}

		if (resultTotalDays) {
			resultTotalDays.textContent = String(counts.totalDays);
		}

		if (resultWeekendDays) {
			resultWeekendDays.textContent = String(counts.weekendDays);
		}

		if (resultTotalLabel) {
			resultTotalLabel.textContent = totalLabel;
		}

		if (resultWeekendLabel) {
			resultWeekendLabel.textContent = weekendLabel;
		}
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
