import {
	applySegmentInputChange,
	calculateAge,
	calendarDatesEqual,
	emptyDateSegments,
	formatCalendarDateDisplay,
	formatSegmentsDisplay,
	formatSegmentsNormalized,
	getTodayCalendarDate,
	isSegmentsComplete,
	isSegmentsEmpty,
	isSelectableAsOfCalendarDate,
	isSelectableBirthCalendarDate,
	MIN_BIRTH_YEAR,
	normalizeSegmentsForBlur,
	parseBirthDateSegments,
	resolveInvalidBirthFields,
	segmentsFromCalendarDate,
	shouldAutoAdvanceMobileMonth,
	shouldAutoAdvanceMobileYear,
	type AgeResult,
	type CalendarDate,
	type DateSegments,
	type InvalidBirthField,
	type SegmentKey,
} from "../lib/ageCalculatorMath";

type AgeCalculatorLocale = "en" | "zh";

type AgeCalculatorClientI18n = {
	locale: AgeCalculatorLocale;
	intlLocale: string;
	primaryResultUnit: string;
	exactAgeZero: string;
	daysLivedZero: string;
	exactAgeTemplate: string;
	daysLivedTemplate: string;
	invalidBirthDate: string;
	invalidAsOfDate: string;
	birthDatePlaceholder: string;
	birthDateDesktopPlaceholder: string;
	calendarLabel: string;
	openCalendarAriaLabel: string;
	asOfToday: string;
	asOfTemplate: string;
	asOfCalendarLabel: string;
	openAsOfCalendarAriaLabel: string;
	backToTodayAriaLabel: string;
	previousMonth: string;
	nextMonth: string;
	weekdays: string[];
};

const initializedRoots = new WeakSet<HTMLElement>();
const inputSegments = new WeakMap<HTMLInputElement, DateSegments>();

function readClientI18n(root: HTMLElement): AgeCalculatorClientI18n | null {
	const raw = root.dataset.acv2ClientI18n;

	if (!raw) {
		return null;
	}

	try {
		return JSON.parse(raw) as AgeCalculatorClientI18n;
	} catch {
		return null;
	}
}

function fillTemplate(
	template: string,
	values: Record<string, string | number>,
): string {
	return template.replace(/\{(\w+)\}/g, (_, key: string) => {
		const value = values[key];
		return value === undefined ? "" : String(value);
	});
}

function formatExactAge(i18n: AgeCalculatorClientI18n, result: AgeResult): string {
	return fillTemplate(i18n.exactAgeTemplate, {
		years: result.completedYears,
		months: result.months,
		days: result.days,
	});
}

function formatDaysLived(i18n: AgeCalculatorClientI18n, result: AgeResult): string {
	return fillTemplate(i18n.daysLivedTemplate, {
		count: result.daysLived,
	});
}

function getInputSegments(input: HTMLInputElement): DateSegments {
	return inputSegments.get(input) ?? emptyDateSegments();
}

function setInputSegments(input: HTMLInputElement, segments: DateSegments): void {
	inputSegments.set(input, { ...segments });
}

function initDrawer(root: HTMLElement): void {
	const drawer = root.querySelector<HTMLElement>("[data-acv2-drawer]");
	const shell = root.querySelector<HTMLElement>("[data-acv2-drawer-shell]");
	const toggle = root.querySelector<HTMLButtonElement>("[data-acv2-drawer-toggle]");
	const related = root.querySelector<HTMLElement>("[data-acv2-related-tools]");
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

function initMobileSheet(root: HTMLElement): void {
	const portal = document.querySelector<HTMLElement>("[data-acv2-sheet-portal]");
	const overlay = portal?.querySelector<HTMLElement>("[data-acv2-sheet-overlay]");
	const sheet = portal?.querySelector<HTMLElement>("[data-acv2-sheet]");
	const openTriggers = root.querySelectorAll<HTMLElement>("[data-acv2-sheet-open]");
	const sheetInputs = portal
		? [
				...portal.querySelectorAll<HTMLInputElement>(
					"[data-acv2-sheet-year-input], [data-acv2-sheet-month-input], [data-acv2-sheet-day-input]",
				),
			]
		: [];

	if (!portal || !overlay || !sheet || openTriggers.length === 0) {
		return;
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

	const isKeyboardOpen = (metrics: {
		height: number;
		innerHeight: number;
	}) => metrics.height < metrics.innerHeight - 72;

	const clearKeyboardSync = () => {
		portal.classList.remove("msb-keyboard-sync");
		root.removeAttribute("data-acv2-keyboard-open");
		root.style.removeProperty("--acv2-keyboard-shift");
		sheet.style.removeProperty("bottom");
		sheet.style.removeProperty("height");
		sheet.style.removeProperty("max-height");

		if (overlay) {
			overlay.style.removeProperty("top");
			overlay.style.removeProperty("height");
			overlay.style.removeProperty("bottom");
		}
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

		// Landscape：已通過 Owner 驗收 — 不抬升 sheet、不重定位結果區。
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
		root.setAttribute("data-acv2-keyboard-open", "true");
		root.style.setProperty("--acv2-keyboard-shift", `${bottomInset}px`);
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

		// iOS keyboard / visualViewport 收合有延遲；關閉後必須再清一次 inline 樣式。
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
		root.setAttribute("data-acv2-sheet-open", "true");
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
		isSheetOpen = false;
		root.removeAttribute("data-acv2-sheet-open");
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

			// 鍵盤收起後立刻清掉 bottom inset，避免短暫高度異常。
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
}

function digitsOnly(value: string, maxLength: number): string {
	return value.replace(/\D/g, "").slice(0, maxLength);
}

function segmentsFromParts(year: string, month: string, day: string): DateSegments {
	return {
		year,
		month,
		day,
		openMonth: month !== "" || day !== "",
		openDay: day !== "",
		gapAt: null,
	};
}

type DesktopCalendarApi = {
	isOpen: () => boolean;
	open: () => void;
	close: () => void;
	toggle: () => void;
};

type DesktopCalendarOptions = {
	intlLocale: string;
	toggle: HTMLButtonElement;
	popover: HTMLElement;
	grid: HTMLElement;
	monthSelect: HTMLSelectElement;
	yearSelect: HTMLSelectElement;
	prev: HTMLButtonElement;
	next: HTMLButtonElement;
	getSelectedDate: () => CalendarDate | null;
	getFallbackViewDate: () => CalendarDate;
	isDateSelectable: (date: CalendarDate, today: CalendarDate) => boolean;
	onSelectDate: (date: CalendarDate) => void;
	getPositionAnchor: () => HTMLElement | null;
	/** 額外避開的區域（例如主結果數字），避免 popover 壓住 */
	getAvoidRects?: () => Array<DOMRect | null | undefined>;
	nudgeX?: number;
	preferAboveAnchor?: boolean;
	/** above = 錨點上方（生日）；right = 錨點右側（as-of） */
	placement?: "above" | "right";
	onBeforeOpen?: () => void;
};

function createDesktopDateCalendar(options: DesktopCalendarOptions): DesktopCalendarApi {
	const {
		intlLocale,
		toggle,
		popover,
		grid,
		monthSelect,
		yearSelect,
		prev,
		next,
		getSelectedDate,
		getFallbackViewDate,
		isDateSelectable,
		onSelectDate,
		getPositionAnchor,
		getAvoidRects,
		nudgeX = 0,
		preferAboveAnchor = true,
		placement = "above",
		onBeforeOpen,
	} = options;

	const POPOVER_GAP = 16;
	const INPUT_GAP = 8;
	const VIEWPORT_PAD = 12;
	let viewYear = getTodayCalendarDate().year;
	let viewMonth = getTodayCalendarDate().month;
	let isCalendarOpen = false;
	let yearOptionsReady = false;

	const monthFormatter = new Intl.DateTimeFormat(intlLocale, { month: "short" });
	const formatMonthOption = (month: number) =>
		monthFormatter.format(new Date(2000, month - 1, 1));

	const maxSelectableMonth = (year: number) => {
		const today = getTodayCalendarDate();
		return year >= today.year ? today.month : 12;
	};

	const clampViewToSelectableRange = () => {
		const today = getTodayCalendarDate();

		if (viewYear < MIN_BIRTH_YEAR) {
			viewYear = MIN_BIRTH_YEAR;
		}

		if (viewYear > today.year) {
			viewYear = today.year;
		}

		const maxMonth = maxSelectableMonth(viewYear);

		if (viewMonth < 1) {
			viewMonth = 1;
		}

		if (viewMonth > maxMonth) {
			viewMonth = maxMonth;
		}
	};

	const canGoPrevMonth = () =>
		viewYear > MIN_BIRTH_YEAR || (viewYear === MIN_BIRTH_YEAR && viewMonth > 1);

	const canGoNextMonth = () => {
		const today = getTodayCalendarDate();
		return (
			viewYear < today.year || (viewYear === today.year && viewMonth < today.month)
		);
	};

	const ensureYearOptions = () => {
		const today = getTodayCalendarDate();

		if (yearOptionsReady && yearSelect.dataset.maxYear === String(today.year)) {
			return;
		}

		yearSelect.innerHTML = "";

		for (let year = today.year; year >= MIN_BIRTH_YEAR; year -= 1) {
			const option = document.createElement("option");
			option.value = String(year);
			option.textContent = String(year);
			yearSelect.appendChild(option);
		}

		yearSelect.dataset.maxYear = String(today.year);
		yearOptionsReady = true;
	};

	const syncMonthOptions = () => {
		const maxMonth = maxSelectableMonth(viewYear);
		monthSelect.innerHTML = "";

		for (let month = 1; month <= 12; month += 1) {
			const option = document.createElement("option");
			option.value = String(month);
			option.textContent = formatMonthOption(month);
			option.disabled = month > maxMonth;
			monthSelect.appendChild(option);
		}

		monthSelect.value = String(viewMonth);
	};

	const syncSelects = () => {
		ensureYearOptions();
		syncMonthOptions();
		yearSelect.value = String(viewYear);
		monthSelect.value = String(viewMonth);
		prev.disabled = !canGoPrevMonth();
		next.disabled = !canGoNextMonth();
	};

	const rectsOverlap = (a: DOMRect, b: DOMRect) =>
		!(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);

	const positionPopover = () => {
		const width = popover.offsetWidth;
		const height = popover.offsetHeight;

		if (width <= 0 || height <= 0) {
			return;
		}

		const vw = window.innerWidth;
		const vh = window.innerHeight;
		const anchor = getPositionAnchor();
		const anchorRect = anchor?.getBoundingClientRect();
		const avoidRects = (getAvoidRects?.() ?? []).filter(
			(rect): rect is DOMRect => rect instanceof DOMRect,
		);

		let left = VIEWPORT_PAD;
		let top = VIEWPORT_PAD;

		if (anchorRect) {
			if (placement === "right") {
				// As-of：水平在文字右側；底部與 As of 文字底緣對齊
				left = anchorRect.right + INPUT_GAP;
				top = anchorRect.bottom - height;

				if (left + width > vw - VIEWPORT_PAD) {
					const leftSide = anchorRect.left - INPUT_GAP - width;
					left = leftSide >= VIEWPORT_PAD ? leftSide : VIEWPORT_PAD;
				}
			} else {
				// 生日：錨點上方，水平置中後再 nudgeX
				left = anchorRect.left + (anchorRect.width - width) / 2 + nudgeX;

				if (preferAboveAnchor) {
					top = anchorRect.top - INPUT_GAP - height;

					if (top < VIEWPORT_PAD) {
						top = VIEWPORT_PAD;
					}
				} else {
					top = anchorRect.bottom + INPUT_GAP;
				}

				let popRect = new DOMRect(left, top, width, height);

				// 不可壓住錨點（生日 input）
				if (rectsOverlap(popRect, anchorRect)) {
					const rightCandidate = anchorRect.right + INPUT_GAP;
					const leftCandidate = anchorRect.left - INPUT_GAP - width;

					if (rightCandidate + width <= vw - VIEWPORT_PAD) {
						left = rightCandidate;
					} else if (leftCandidate >= VIEWPORT_PAD) {
						left = leftCandidate;
					}

					top = Math.max(
						VIEWPORT_PAD,
						Math.min(anchorRect.top - height - INPUT_GAP, vh - height - VIEWPORT_PAD),
					);

					if (top + height > anchorRect.top - 2) {
						top = Math.max(
							VIEWPORT_PAD,
							Math.min(anchorRect.top, vh - height - VIEWPORT_PAD),
						);
					}

					popRect = new DOMRect(left, top, width, height);
				}

				// 盡量不要壓住主結果等 avoid 區域
				for (const avoidRect of avoidRects) {
					popRect = new DOMRect(left, top, width, height);

					if (!rectsOverlap(popRect, avoidRect)) {
						continue;
					}

					const aboveAvoid = avoidRect.top - POPOVER_GAP - height;
					const besideRight = avoidRect.right + POPOVER_GAP;
					const besideLeft = avoidRect.left - POPOVER_GAP - width;
					const nearAnchorTop = anchorRect.top - height - INPUT_GAP;

					if (
						aboveAvoid >= VIEWPORT_PAD &&
						aboveAvoid + height <= anchorRect.top - 4
					) {
						top = aboveAvoid;
					} else if (besideRight + width <= vw - VIEWPORT_PAD) {
						left = besideRight;
						top = Math.max(
							VIEWPORT_PAD,
							Math.min(nearAnchorTop, vh - height - VIEWPORT_PAD),
						);
					} else if (besideLeft >= VIEWPORT_PAD) {
						left = besideLeft;
						top = Math.max(
							VIEWPORT_PAD,
							Math.min(nearAnchorTop, vh - height - VIEWPORT_PAD),
						);
					}
				}
			}
		}

		top = Math.max(VIEWPORT_PAD, Math.min(top, vh - height - VIEWPORT_PAD));
		left = Math.max(VIEWPORT_PAD, Math.min(left, vw - width - VIEWPORT_PAD));

		popover.style.left = `${Math.round(left)}px`;
		popover.style.top = `${Math.round(top)}px`;
	};

	const renderCalendar = () => {
		clampViewToSelectableRange();
		syncSelects();

		const today = getTodayCalendarDate();
		const selected = getSelectedDate();
		grid.innerHTML = "";

		const firstWeekday = (new Date(viewYear, viewMonth - 1, 1).getDay() + 6) % 7;
		const daysCount = new Date(viewYear, viewMonth, 0).getDate();

		for (let index = 0; index < firstWeekday; index += 1) {
			const emptyCell = document.createElement("div");
			emptyCell.className = "calendar-cell calendar-cell--empty";
			emptyCell.setAttribute("aria-hidden", "true");
			grid.appendChild(emptyCell);
		}

		for (let day = 1; day <= daysCount; day += 1) {
			const cellDate: CalendarDate = {
				year: viewYear,
				month: viewMonth,
				day,
			};
			const button = document.createElement("button");
			button.type = "button";
			button.className = "calendar-day";
			button.textContent = String(day);

			if (
				cellDate.year === today.year &&
				cellDate.month === today.month &&
				cellDate.day === today.day
			) {
				button.classList.add("is-today");
			}

			if (
				selected &&
				selected.year === cellDate.year &&
				selected.month === cellDate.month &&
				selected.day === cellDate.day
			) {
				button.classList.add("is-selected");
			}

			if (!isDateSelectable(cellDate, today)) {
				button.disabled = true;
			} else {
				button.addEventListener("click", () => {
					onSelectDate(cellDate);
					closeCalendar();
				});
			}

			grid.appendChild(button);
		}

		if (isCalendarOpen) {
			positionPopover();
		}
	};

	const setViewFromSelection = () => {
		const selected = getSelectedDate();

		if (selected) {
			viewYear = selected.year;
			viewMonth = selected.month;
			clampViewToSelectableRange();
			return;
		}

		const fallback = getFallbackViewDate();
		viewYear = fallback.year;
		viewMonth = fallback.month;
		clampViewToSelectableRange();
	};

	const openCalendar = () => {
		onBeforeOpen?.();
		setViewFromSelection();
		isCalendarOpen = true;
		popover.hidden = false;
		popover.setAttribute("aria-hidden", "false");
		toggle.setAttribute("aria-expanded", "true");
		renderCalendar();
		requestAnimationFrame(() => {
			positionPopover();
		});
	};

	const closeCalendar = () => {
		if (!isCalendarOpen) {
			return;
		}

		isCalendarOpen = false;
		popover.hidden = true;
		popover.setAttribute("aria-hidden", "true");
		toggle.setAttribute("aria-expanded", "false");
		popover.style.left = "";
		popover.style.top = "";
	};

	const toggleCalendar = () => {
		if (isCalendarOpen) {
			closeCalendar();
			return;
		}

		openCalendar();
	};

	toggle.addEventListener("click", (event) => {
		event.preventDefault();
		event.stopPropagation();
		toggleCalendar();
	});

	popover.addEventListener("pointerdown", (event) => {
		event.stopPropagation();
	});

	monthSelect.addEventListener("change", () => {
		const nextMonth = Number(monthSelect.value);

		if (!Number.isInteger(nextMonth) || nextMonth < 1 || nextMonth > 12) {
			return;
		}

		viewMonth = nextMonth;
		clampViewToSelectableRange();
		renderCalendar();
	});

	yearSelect.addEventListener("change", () => {
		const nextYear = Number(yearSelect.value);
		const today = getTodayCalendarDate();

		if (
			!Number.isInteger(nextYear) ||
			nextYear < MIN_BIRTH_YEAR ||
			nextYear > today.year
		) {
			return;
		}

		viewYear = nextYear;
		clampViewToSelectableRange();
		renderCalendar();
	});

	prev.addEventListener("click", () => {
		if (!canGoPrevMonth()) {
			return;
		}

		viewMonth -= 1;

		if (viewMonth < 1) {
			viewMonth = 12;
			viewYear -= 1;
		}

		clampViewToSelectableRange();
		renderCalendar();
	});

	next.addEventListener("click", () => {
		if (!canGoNextMonth()) {
			return;
		}

		viewMonth += 1;

		if (viewMonth > 12) {
			viewMonth = 1;
			viewYear += 1;
		}

		clampViewToSelectableRange();
		renderCalendar();
	});

	document.addEventListener("pointerdown", (event) => {
		if (!isCalendarOpen) {
			return;
		}

		const target = event.target;

		if (!(target instanceof Node)) {
			return;
		}

		if (popover.contains(target) || toggle.contains(target)) {
			return;
		}

		closeCalendar();
	});

	document.addEventListener("keydown", (event) => {
		if (event.key === "Escape" && isCalendarOpen) {
			event.preventDefault();
			closeCalendar();
			toggle.focus();
		}
	});

	window.addEventListener(
		"resize",
		() => {
			if (isCalendarOpen) {
				positionPopover();
			}
		},
		{ passive: true },
	);

	window.addEventListener(
		"scroll",
		() => {
			if (isCalendarOpen) {
				positionPopover();
			}
		},
		{ passive: true, capture: true },
	);

	window.matchMedia("(min-width: 768px)").addEventListener("change", (event) => {
		if (!event.matches && isCalendarOpen) {
			closeCalendar();
		}
	});

	return {
		isOpen: () => isCalendarOpen,
		open: openCalendar,
		close: closeCalendar,
		toggle: toggleCalendar,
	};
}

function initAgeCalculator(root: HTMLElement): void {
	if (initializedRoots.has(root)) {
		return;
	}

	const i18n = readClientI18n(root);

	if (!i18n) {
		return;
	}

	initializedRoots.add(root);

	const primaryNumber = root.querySelector<HTMLElement>("[data-acv2-result-years]");
	const exactAgeStacked = root.querySelector<HTMLElement>("[data-acv2-exact-age-stacked]");
	const daysLivedStacked = root.querySelector<HTMLElement>("[data-acv2-days-lived-stacked]");
	const exactAgeLandscape = root.querySelector<HTMLElement>("[data-acv2-exact-age-landscape]");
	const birthCapsule = root.querySelector<HTMLElement>("[data-acv2-birth-capsule]");
	const desktopInvalidIcon = root.querySelector<HTMLElement>("[data-acv2-desktop-invalid-icon]");
	const asOfControl = root.querySelector<HTMLButtonElement>("[data-acv2-asof-control]");
	const asOfLabel = root.querySelector<HTMLElement>("[data-acv2-asof-label]");
	const asOfInvalidIcon = root.querySelector<HTMLElement>("[data-acv2-asof-invalid-icon]");
	const asOfReset = root.querySelector<HTMLButtonElement>("[data-acv2-asof-reset]");
	const sheetAsOfWrap = document.querySelector<HTMLElement>("[data-acv2-sheet-asof]");
	const sheetAsOfLabel = document.querySelector<HTMLElement>("[data-acv2-sheet-asof-label]");
	const sheetAsOfInvalid = document.querySelector<HTMLElement>("[data-acv2-sheet-asof-invalid]");
	const sheetAsOfNative = document.querySelector<HTMLInputElement>(
		"[data-acv2-sheet-asof-native]",
	);
	const desktopInputs = [
		...root.querySelectorAll<HTMLInputElement>("[data-acv2-birth-input]"),
	];
	const yearInput = document.querySelector<HTMLInputElement>("[data-acv2-sheet-year-input]");
	const monthInput = document.querySelector<HTMLInputElement>("[data-acv2-sheet-month-input]");
	const dayInput = document.querySelector<HTMLInputElement>("[data-acv2-sheet-day-input]");
	const yearInvalidIcon = document.querySelector<HTMLElement>("[data-acv2-sheet-year-invalid]");
	const monthInvalidIcon = document.querySelector<HTMLElement>(
		"[data-acv2-sheet-month-invalid]",
	);
	const dayInvalidIcon = document.querySelector<HTMLElement>("[data-acv2-sheet-day-invalid]");
	const mobileInputs = [yearInput, monthInput, dayInput].filter(
		(input): input is HTMLInputElement => input instanceof HTMLInputElement,
	);

	if (
		!primaryNumber ||
		!exactAgeStacked ||
		!daysLivedStacked ||
		!exactAgeLandscape ||
		(desktopInputs.length === 0 && mobileInputs.length === 0)
	) {
		return;
	}

	let sharedSegments = emptyDateSegments();
	/** null = live today；指定日期後覆寫 */
	let asOfOverride: CalendarDate | null = null;
	let birthCalendarApi: DesktopCalendarApi | null = null;
	let asOfCalendarApi: DesktopCalendarApi | null = null;

	const getEffectiveAsOf = (): CalendarDate => asOfOverride ?? getTodayCalendarDate();

	const isAsOfToday = (): boolean => {
		if (!asOfOverride) {
			return true;
		}

		return calendarDatesEqual(asOfOverride, getTodayCalendarDate());
	};

	const toDateInputValue = (date: CalendarDate): string =>
		[
			String(date.year).padStart(4, "0"),
			String(date.month).padStart(2, "0"),
			String(date.day).padStart(2, "0"),
		].join("-");

	const fromDateInputValue = (value: string): CalendarDate | null => {
		const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

		if (!match) {
			return null;
		}

		const year = Number(match[1]);
		const month = Number(match[2]);
		const day = Number(match[3]);

		if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
			return null;
		}

		return { year, month, day };
	};

	const formatAsOfLabelText = (): string => {
		if (isAsOfToday()) {
			return i18n.asOfToday;
		}

		const asOf = getEffectiveAsOf();
		return fillTemplate(i18n.asOfTemplate, {
			date: formatCalendarDateDisplay(asOf),
		});
	};

	const syncAsOfLabels = () => {
		const text = formatAsOfLabelText();
		const showReset = !isAsOfToday();
		const asOf = getEffectiveAsOf();
		const today = getTodayCalendarDate();

		if (asOfLabel) {
			asOfLabel.textContent = text;
		}

		if (sheetAsOfLabel) {
			sheetAsOfLabel.textContent = text;
		}

		asOfReset?.toggleAttribute("hidden", !showReset);

		if (sheetAsOfNative) {
			sheetAsOfNative.min = "1900-01-01";
			sheetAsOfNative.max = toDateInputValue(today);
			sheetAsOfNative.value = toDateInputValue(asOf);
		}
	};

	const setAsOfOverride = (date: CalendarDate | null) => {
		if (!date) {
			asOfOverride = null;
			return;
		}

		const today = getTodayCalendarDate();
		asOfOverride = calendarDatesEqual(date, today) ? null : date;
	};

	const setDesktopInvalidIcon = (visible: boolean) => {
		desktopInvalidIcon?.toggleAttribute("hidden", !visible);
	};

	const setDesktopAsOfInvalidIcon = (visible: boolean) => {
		asOfInvalidIcon?.toggleAttribute("hidden", !visible);
		sheetAsOfInvalid?.toggleAttribute("hidden", !visible);
	};

	const setMobileInvalidFields = (fields: InvalidBirthField[]) => {
		const invalid = new Set(fields);
		yearInvalidIcon?.toggleAttribute("hidden", !invalid.has("year"));
		monthInvalidIcon?.toggleAttribute("hidden", !invalid.has("month"));
		dayInvalidIcon?.toggleAttribute("hidden", !invalid.has("day"));
	};

	const clearInvalidIcons = () => {
		setDesktopInvalidIcon(false);
		setDesktopAsOfInvalidIcon(false);
		setMobileInvalidFields([]);
	};

	const renderZeroState = () => {
		primaryNumber.textContent = "0";
		primaryNumber.setAttribute("aria-label", `0 ${i18n.primaryResultUnit}`);
		exactAgeStacked.textContent = i18n.exactAgeZero;
		daysLivedStacked.textContent = i18n.daysLivedZero;
		exactAgeLandscape.textContent = `${i18n.exactAgeZero} / ${i18n.daysLivedZero}`;
	};

	const renderResult = (result: AgeResult) => {
		const exactAge = formatExactAge(i18n, result);
		const daysLived = formatDaysLived(i18n, result);

		primaryNumber.textContent = String(result.completedYears);
		primaryNumber.setAttribute(
			"aria-label",
			`${result.completedYears} ${i18n.primaryResultUnit}`,
		);
		exactAgeStacked.textContent = exactAge;
		daysLivedStacked.textContent = daysLived;
		exactAgeLandscape.textContent = `${exactAge} / ${daysLived}`;
	};

	const syncMobileFields = (segments: DateSegments) => {
		if (yearInput) {
			yearInput.value = segments.year;
		}

		if (monthInput) {
			monthInput.value = segments.month;
		}

		if (dayInput) {
			dayInput.value = segments.day;
		}
	};

	const syncDesktopDisplay = (
		segments: DateSegments,
		source: HTMLInputElement | null,
		caret: number | null,
		normalized = false,
	) => {
		const formatted = normalized
			? formatSegmentsNormalized(segments)
			: formatSegmentsDisplay(segments);

		for (const input of desktopInputs) {
			setInputSegments(input, { ...segments });
			input.value = formatted;
		}

		birthCapsule?.classList.toggle(
			"acv2-birth-capsule--has-value",
			!isSegmentsEmpty(segments),
		);

		if (source && caret !== null) {
			source.setSelectionRange(caret, caret);
		}
	};

	const syncAllDisplays = (
		segments: DateSegments,
		desktopSource: HTMLInputElement | null = null,
		caret: number | null = null,
		normalized = false,
	) => {
		syncDesktopDisplay(segments, desktopSource, caret, normalized);
		syncMobileFields(segments);
	};

	const evaluate = (segments: DateSegments) => {
		syncAsOfLabels();

		if (isSegmentsEmpty(segments) || !isSegmentsComplete(segments)) {
			clearInvalidIcons();
			renderZeroState();
			return;
		}

		const today = getTodayCalendarDate();
		const asOf = getEffectiveAsOf();
		const birth = parseBirthDateSegments(segments, today);

		if (!birth) {
			const invalidFields = resolveInvalidBirthFields(segments, today);
			setDesktopInvalidIcon(invalidFields.length > 0);
			setMobileInvalidFields(invalidFields);
			setDesktopAsOfInvalidIcon(false);
			setMobileAsOfInvalidFields([]);
			renderZeroState();
			return;
		}

		const outcome = calculateAge(birth, asOf);

		if (outcome.status !== "ok") {
			// as-of 早於 birth → 結果 0 + 輕量 as-of invalid
			setDesktopInvalidIcon(false);
			setMobileInvalidFields([]);
			setDesktopAsOfInvalidIcon(true);
			renderZeroState();
			return;
		}

		clearInvalidIcons();
		renderResult(outcome.result);
	};

	const processDesktopInputChange = (
		source: HTMLInputElement,
		inputType: string,
		data: string | null,
		selectionStart: number,
		selectionEnd: number,
	) => {
		const currentSegments = getInputSegments(source);
		const formatted = formatSegmentsDisplay(currentSegments);
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
			currentSegments,
			resolvedInputType,
			data,
			selectionStart,
			selectionEnd,
		);

		sharedSegments = segments;
		syncAllDisplays(sharedSegments, source, caret);
		evaluate(sharedSegments);
	};

	const handleDesktopBeforeInput = (event: Event) => {
		const source = event.currentTarget;

		if (!(source instanceof HTMLInputElement)) {
			return;
		}

		const inputEvent = event as InputEvent;
		const inputType = inputEvent.inputType;
		const selectionStart = source.selectionStart ?? 0;
		const selectionEnd = source.selectionEnd ?? selectionStart;

		if (inputType === "insertText" && inputEvent.data && !/^\d$/.test(inputEvent.data)) {
			event.preventDefault();
			return;
		}

		if (
			inputType === "insertText" ||
			inputType === "deleteContentBackward" ||
			inputType === "deleteContentForward"
		) {
			event.preventDefault();
			processDesktopInputChange(
				source,
				inputType,
				inputEvent.data,
				selectionStart,
				selectionEnd,
			);
		}
	};

	const handleDesktopBlur = (event: Event) => {
		const source = event.currentTarget;

		if (!(source instanceof HTMLInputElement)) {
			return;
		}

		const segments = getInputSegments(source);

		if (isSegmentsEmpty(segments)) {
			return;
		}

		const normalized = normalizeSegmentsForBlur(segments);
		sharedSegments = normalized;
		syncAllDisplays(
			normalized,
			source,
			formatSegmentsNormalized(normalized).length,
			true,
		);
		evaluate(normalized);
	};

	const focusMobileField = (input: HTMLInputElement | null) => {
		if (!input) {
			return;
		}

		input.focus({ preventScroll: true });
	};

	const maybeAutoAdvanceMobileField = (
		field: SegmentKey,
		previousValue: string,
		nextValue: string,
		source: HTMLInputElement,
	) => {
		// Only advance when the value grew from typing/paste and caret is at the end.
		if (nextValue.length <= previousValue.length) {
			return;
		}

		const caret = source.selectionStart ?? nextValue.length;

		if (caret < nextValue.length) {
			return;
		}

		if (field === "year" && shouldAutoAdvanceMobileYear(nextValue)) {
			focusMobileField(monthInput);
			return;
		}

		if (field === "month" && shouldAutoAdvanceMobileMonth(nextValue)) {
			focusMobileField(dayInput);
		}
	};

	const applyMobileSegments = (
		segments: DateSegments,
		options: { syncMobile?: boolean } = {},
	) => {
		sharedSegments = segments;
		syncDesktopDisplay(sharedSegments, null, null);

		if (options.syncMobile !== false) {
			syncMobileFields(sharedSegments);
		}

		evaluate(sharedSegments);
	};

	const handleMobileFieldInput = (field: SegmentKey, maxLength: number) => {
		return (event: Event) => {
			const source = event.currentTarget;

			if (!(source instanceof HTMLInputElement)) {
				return;
			}

			const previousValue =
				field === "year"
					? sharedSegments.year
					: field === "month"
						? sharedSegments.month
						: sharedSegments.day;
			const cleaned = digitsOnly(source.value, maxLength);

			if (source.value !== cleaned) {
				source.value = cleaned;
			}

			// Skip rewriting mobile fields while typing so caret stays put.
			applyMobileSegments(
				segmentsFromParts(
					field === "year" ? cleaned : sharedSegments.year,
					field === "month" ? cleaned : sharedSegments.month,
					field === "day" ? cleaned : sharedSegments.day,
				),
				{ syncMobile: false },
			);

			maybeAutoAdvanceMobileField(field, previousValue, cleaned, source);
		};
	};

	const handleMobileBlur = () => {
		if (isSegmentsEmpty(sharedSegments)) {
			return;
		}

		const normalized = normalizeSegmentsForBlur(sharedSegments);
		sharedSegments = normalized;
		syncAllDisplays(normalized, null, null, true);
		evaluate(normalized);
	};

	for (const input of desktopInputs) {
		setInputSegments(input, emptyDateSegments());
		input.addEventListener("beforeinput", handleDesktopBeforeInput);
		input.addEventListener("blur", handleDesktopBlur);
		input.addEventListener("paste", (event) => {
			event.preventDefault();
			const pasted = event.clipboardData?.getData("text") ?? "";
			const selectionStart = input.selectionStart ?? 0;
			const selectionEnd = input.selectionEnd ?? selectionStart;
			processDesktopInputChange(
				input,
				"insertFromPaste",
				pasted,
				selectionStart,
				selectionEnd,
			);
		});
	}

	yearInput?.addEventListener("input", handleMobileFieldInput("year", 4));
	monthInput?.addEventListener("input", handleMobileFieldInput("month", 2));
	dayInput?.addEventListener("input", handleMobileFieldInput("day", 2));

	for (const input of mobileInputs) {
		input.addEventListener("beforeinput", (event) => {
			const inputEvent = event as InputEvent;

			if (
				inputEvent.inputType === "insertText" &&
				inputEvent.data &&
				!/^\d+$/.test(inputEvent.data)
			) {
				event.preventDefault();
			}
		});
		input.addEventListener("blur", handleMobileBlur);
		input.addEventListener("paste", (event) => {
			event.preventDefault();
			const field: SegmentKey =
				input === yearInput ? "year" : input === monthInput ? "month" : "day";
			const maxLength = field === "year" ? 4 : 2;
			const previousValue =
				field === "year"
					? sharedSegments.year
					: field === "month"
						? sharedSegments.month
						: sharedSegments.day;
			const pasted = digitsOnly(event.clipboardData?.getData("text") ?? "", maxLength);
			input.value = pasted;
			applyMobileSegments(
				segmentsFromParts(
					field === "year" ? pasted : sharedSegments.year,
					field === "month" ? pasted : sharedSegments.month,
					field === "day" ? pasted : sharedSegments.day,
				),
			);
			maybeAutoAdvanceMobileField(field, previousValue, pasted, input);
		});
	}

	const openNativeAsOfPicker = () => {
		if (!sheetAsOfNative) {
			return;
		}

		const today = getTodayCalendarDate();
		const asOf = getEffectiveAsOf();
		sheetAsOfNative.min = "1900-01-01";
		sheetAsOfNative.max = toDateInputValue(today);
		sheetAsOfNative.value = toDateInputValue(asOf);
		sheetAsOfNative.focus({ preventScroll: true });

		if (typeof sheetAsOfNative.showPicker === "function") {
			try {
				sheetAsOfNative.showPicker();
			} catch {
				sheetAsOfNative.focus({ preventScroll: true });
			}
		}
	};

	const resetAsOfToToday = () => {
		asOfCalendarApi?.close();
		setAsOfOverride(null);
		evaluate(sharedSegments);
	};

	const handleAsOfResetClick = (event: Event) => {
		event.preventDefault();
		event.stopPropagation();
		resetAsOfToToday();
	};

	asOfReset?.addEventListener("click", handleAsOfResetClick);

	// Mobile：點 As-of 文字開原生 date picker（不顯示 back icon；清除靠原生重置）
	sheetAsOfWrap?.addEventListener(
		"click",
		(event) => {
			const target = event.target;

			if (!(target instanceof Element)) {
				return;
			}

			if (target.closest("[data-acv2-sheet-asof-control]")) {
				event.preventDefault();
				event.stopPropagation();
				birthCalendarApi?.close();
				asOfCalendarApi?.close();
				openNativeAsOfPicker();
			}
		},
		true,
	);

	sheetAsOfNative?.addEventListener("change", () => {
		const today = getTodayCalendarDate();
		const value = sheetAsOfNative.value.trim();

		// 原生 picker 清除／重置會變成空字串 → 視為回到今天
		if (!value) {
			resetAsOfToToday();
			return;
		}

		const parsed = fromDateInputValue(value);

		if (!parsed || !isSelectableAsOfCalendarDate(parsed, today)) {
			syncAsOfLabels();
			return;
		}

		setAsOfOverride(parsed);
		evaluate(sharedSegments);
	});

	sheetAsOfNative?.addEventListener("input", () => {
		const value = sheetAsOfNative.value.trim();

		if (!value) {
			resetAsOfToToday();
		}
	});

	// Desktop birth + as-of calendars（共用 factory；互斥開啟）
	const calendarToggle = root.querySelector<HTMLButtonElement>(
		"[data-acv2-calendar-toggle]",
	);
	const calendarPopover = root.querySelector<HTMLElement>(
		"[data-acv2-calendar-popover]",
	);
	const calendarGrid = root.querySelector<HTMLElement>("[data-acv2-calendar-grid]");
	const calendarMonthSelect = root.querySelector<HTMLSelectElement>(
		"[data-acv2-calendar-month-select]",
	);
	const calendarYearSelect = root.querySelector<HTMLSelectElement>(
		"[data-acv2-calendar-year-select]",
	);
	const calendarPrev = root.querySelector<HTMLButtonElement>(
		"[data-acv2-calendar-prev]",
	);
	const calendarNext = root.querySelector<HTMLButtonElement>(
		"[data-acv2-calendar-next]",
	);

	if (
		calendarToggle &&
		calendarPopover &&
		calendarGrid &&
		calendarMonthSelect &&
		calendarYearSelect &&
		calendarPrev &&
		calendarNext
	) {
		birthCalendarApi = createDesktopDateCalendar({
			intlLocale: i18n.intlLocale,
			toggle: calendarToggle,
			popover: calendarPopover,
			grid: calendarGrid,
			monthSelect: calendarMonthSelect,
			yearSelect: calendarYearSelect,
			prev: calendarPrev,
			next: calendarNext,
			getSelectedDate: () =>
				parseBirthDateSegments(sharedSegments, getTodayCalendarDate()),
			getFallbackViewDate: () => getTodayCalendarDate(),
			isDateSelectable: isSelectableBirthCalendarDate,
			onSelectDate: (date) => {
				const nextSegments = segmentsFromCalendarDate(date);
				sharedSegments = nextSegments;
				syncAllDisplays(nextSegments, null, null, true);
				evaluate(nextSegments);
			},
			getPositionAnchor: () => birthCapsule,
			getAvoidRects: () => {
				const resultBlock = root.querySelector<HTMLElement>(
					".preview-tool-result-block",
				);
				const resultGroup = root.querySelector<HTMLElement>(
					".preview-tool-result-group",
				);
				const avoid = resultBlock ?? resultGroup;
				return [avoid?.getBoundingClientRect()];
			},
			nudgeX: 28,
			preferAboveAnchor: true,
			onBeforeOpen: () => {
				asOfCalendarApi?.close();
			},
		});
	}

	const asOfCalendarToggle = asOfControl;
	const asOfCalendarPopover = root.querySelector<HTMLElement>(
		"[data-acv2-asof-calendar-popover]",
	);
	const asOfCalendarGrid = root.querySelector<HTMLElement>(
		"[data-acv2-asof-calendar-grid]",
	);
	const asOfCalendarMonthSelect = root.querySelector<HTMLSelectElement>(
		"[data-acv2-asof-calendar-month-select]",
	);
	const asOfCalendarYearSelect = root.querySelector<HTMLSelectElement>(
		"[data-acv2-asof-calendar-year-select]",
	);
	const asOfCalendarPrev = root.querySelector<HTMLButtonElement>(
		"[data-acv2-asof-calendar-prev]",
	);
	const asOfCalendarNext = root.querySelector<HTMLButtonElement>(
		"[data-acv2-asof-calendar-next]",
	);

	if (
		asOfCalendarToggle &&
		asOfCalendarPopover &&
		asOfCalendarGrid &&
		asOfCalendarMonthSelect &&
		asOfCalendarYearSelect &&
		asOfCalendarPrev &&
		asOfCalendarNext
	) {
		asOfCalendarApi = createDesktopDateCalendar({
			intlLocale: i18n.intlLocale,
			toggle: asOfCalendarToggle,
			popover: asOfCalendarPopover,
			grid: asOfCalendarGrid,
			monthSelect: asOfCalendarMonthSelect,
			yearSelect: asOfCalendarYearSelect,
			prev: asOfCalendarPrev,
			next: asOfCalendarNext,
			getSelectedDate: () => getEffectiveAsOf(),
			getFallbackViewDate: () => getEffectiveAsOf(),
			isDateSelectable: isSelectableAsOfCalendarDate,
			onSelectDate: (date) => {
				setAsOfOverride(date);
				evaluate(sharedSegments);
			},
			getPositionAnchor: () => asOfControl,
			placement: "right",
			onBeforeOpen: () => {
				birthCalendarApi?.close();
			},
		});
	}

	syncAsOfLabels();
	renderZeroState();
}


function initAll(): void {
	const roots = document.querySelectorAll<HTMLElement>("[data-age-calculator-v2]");

	for (const root of roots) {
		initDrawer(root);
		initMobileSheet(root);
		initAgeCalculator(root);
	}
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", initAll);
} else {
	initAll();
}
