/**
 * Shared Desktop Calendar controller — foundation（Phase A）。
 * 不依賴任何工具專屬 hooks 或工具名稱分支。
 */

export type SdcVariant = "inline-large" | "popover-compact";
export type SdcSelectionMode = "single" | "range";
export type SdcYearListMode = "full" | "nearby";
export type SdcPlacement = "above" | "right" | "auto";

export interface SdcCalendarDate {
	year: number;
	month: number;
	day: number;
}

export interface SdcSelection {
	start: SdcCalendarDate | null;
	end: SdcCalendarDate | null;
}

export interface SdcYearListConfig {
	min: number;
	max: number;
	mode: SdcYearListMode;
	nearbyRadius?: number;
}

export interface SdcSelectPayload {
	date: SdcCalendarDate;
	selection: SdcSelection;
	complete: boolean;
}

export interface SdcPopoverPositionContext {
	width: number;
	height: number;
	gap: number;
	viewportPad: number;
	viewportWidth: number;
	viewportHeight: number;
	trigger: HTMLElement | null;
	anchor: HTMLElement | null;
}

export interface SdcPopoverPosition {
	left: number;
	top: number;
}

export interface DesktopCalendarConfig {
	root: HTMLElement;
	variant: SdcVariant;
	selectionMode: SdcSelectionMode;
	intlLocale?: string;
	yearList: SdcYearListConfig;
	getSelection: () => SdcSelection;
	onSelect: (payload: SdcSelectPayload) => { shouldClose: boolean };
	getMinDate?: () => SdcCalendarDate | null;
	getMaxDate?: () => SdcCalendarDate | null;
	isDateSelectable?: (date: SdcCalendarDate) => boolean;
	/** popover-compact：關閉後焦點回到此 trigger */
	getTrigger?: () => HTMLElement | null;
	getPositionAnchor?: () => HTMLElement | null;
	getAvoidRects?: () => Array<DOMRect | undefined | null>;
	placement?: SdcPlacement;
	nudgeX?: number;
	/**
	 * Optional adapter-owned geometry. When provided, shared uses the returned
	 * left／top then applies viewport clamp. Adapters pass element refs；shared
	 * never branches on tool names or tool CSS selectors.
	 */
	resolvePopoverPosition?: (
		ctx: SdcPopoverPositionContext,
	) => SdcPopoverPosition | null | undefined;
	onBeforeOpen?: () => void;
	onOpenChange?: (open: boolean) => void;
	/** 回傳不得關閉 popover 的 DOM 節點（不得用工具 CSS selector 字串） */
	getOutsideClickExclusions?: () => HTMLElement[];
}

export interface DesktopCalendarApi {
	open(): void;
	close(): void;
	isOpen(): boolean;
	refresh(): void;
	setView(year: number, month: number): void;
	destroy(): void;
	handleEscape(): boolean;
}

export const SDC_VARIANTS = ["inline-large", "popover-compact"] as const;
export const SDC_DEFAULT_NEARBY_RADIUS = 10;

const POPOVER_GAP = 8;
const VIEWPORT_PAD = 16;
const INPUT_GAP = 8;

type ToolbarPanel = "none" | "month" | "year";

const registry = new Set<DesktopCalendarApi>();
const boundRoots = new WeakMap<HTMLElement, DesktopCalendarApi>();

function isDomElement(node: unknown): node is HTMLElement {
	return (
		typeof node === "object" &&
		node !== null &&
		"querySelector" in node &&
		typeof (node as HTMLElement).querySelector === "function"
	);
}

export function calendarDatesEqual(
	a: SdcCalendarDate | null | undefined,
	b: SdcCalendarDate | null | undefined,
): boolean {
	if (!a || !b) {
		return false;
	}

	return a.year === b.year && a.month === b.month && a.day === b.day;
}

export function compareCalendarDates(a: SdcCalendarDate, b: SdcCalendarDate): number {
	const left = a.year * 10000 + a.month * 100 + a.day;
	const right = b.year * 10000 + b.month * 100 + b.day;
	return left - right;
}

export function getTodayCalendarDate(now: Date = new Date()): SdcCalendarDate {
	return {
		year: now.getFullYear(),
		month: now.getMonth() + 1,
		day: now.getDate(),
	};
}

/** nearby 年份視窗；UI chrome 與 full 相同，僅資料範圍不同。 */
export function getNearbyYearWindow(
	centerYear: number,
	min: number,
	max: number,
	radius: number = SDC_DEFAULT_NEARBY_RADIUS,
): number[] {
	let start = Math.max(min, centerYear - radius);
	let end = Math.min(max, centerYear + radius);

	const expected = radius * 2 + 1;
	const span = end - start + 1;

	if (span < expected) {
		if (start === min) {
			end = Math.min(max, start + expected - 1);
		} else if (end === max) {
			start = Math.max(min, end - expected + 1);
		}
	}

	const years: number[] = [];
	for (let year = start; year <= end; year += 1) {
		years.push(year);
	}
	return years;
}

function assertVariant(variant: string): asserts variant is SdcVariant {
	if (variant !== "inline-large" && variant !== "popover-compact") {
		throw new Error(
			`DesktopCalendar: variant must be "inline-large" or "popover-compact" (got "${variant}")`,
		);
	}
}

function requireEl<T extends HTMLElement>(root: HTMLElement, selector: string): T {
	const el = root.querySelector<T>(selector);
	if (!el) {
		throw new Error(`DesktopCalendar: missing required element ${selector}`);
	}
	return el;
}

function ordinal(date: SdcCalendarDate): number {
	return date.year * 10000 + date.month * 100 + date.day;
}

function orderRange(start: SdcCalendarDate, end: SdcCalendarDate): SdcSelection {
	if (compareCalendarDates(start, end) <= 0) {
		return { start, end };
	}
	return { start: end, end: start };
}

function buildDayClassNames(
	date: SdcCalendarDate,
	selection: SdcSelection,
	selectionMode: SdcSelectionMode,
	today: SdcCalendarDate,
): string {
	const classes = ["sdc-day"];

	if (calendarDatesEqual(date, today)) {
		classes.push("is-today");
	}

	const { start, end } = selection;

	if (selectionMode === "single") {
		if (start && calendarDatesEqual(date, start)) {
			classes.push("is-selected");
		}
		return classes.join(" ");
	}

	if (!start) {
		return classes.join(" ");
	}

	const cur = ordinal(date);
	const startOrd = ordinal(start);

	if (!end) {
		if (cur === startOrd) {
			classes.push("is-range-start", "is-range-single");
		}
		return classes.join(" ");
	}

	const ordered = orderRange(start, end);
	const lo = ordinal(ordered.start!);
	const hi = ordinal(ordered.end!);

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
}

function computeNextSelection(
	mode: SdcSelectionMode,
	current: SdcSelection,
	date: SdcCalendarDate,
): { selection: SdcSelection; complete: boolean } {
	if (mode === "single") {
		return { selection: { start: date, end: null }, complete: true };
	}

	if (!current.start || current.end) {
		return { selection: { start: date, end: null }, complete: false };
	}

	return {
		selection: orderRange(current.start, date),
		complete: true,
	};
}

function defaultIsSelectable(
	date: SdcCalendarDate,
	min: SdcCalendarDate | null,
	max: SdcCalendarDate | null,
): boolean {
	if (min && compareCalendarDates(date, min) < 0) {
		return false;
	}
	if (max && compareCalendarDates(date, max) > 0) {
		return false;
	}
	return true;
}

/** 同頁多 instance：popover-compact 開啟時關閉其他 popover。 */
export const DesktopCalendarRegistry = {
	register(api: DesktopCalendarApi): void {
		registry.add(api);
	},
	unregister(api: DesktopCalendarApi): void {
		registry.delete(api);
	},
	closeOthers(except: DesktopCalendarApi): void {
		for (const api of registry) {
			if (api !== except && api.isOpen()) {
				api.close();
			}
		}
	},
	size(): number {
		return registry.size;
	},
};

export function createDesktopCalendar(config: DesktopCalendarConfig): DesktopCalendarApi {
	const { root, variant, selectionMode, yearList } = config;

	if (!isDomElement(root) || !root.hasAttribute("data-desktop-calendar")) {
		throw new Error('DesktopCalendar: root must be an element with data-desktop-calendar');
	}

	assertVariant(variant);

	const attrVariant = root.getAttribute("data-sdc-variant");
	if (attrVariant && attrVariant !== variant) {
		throw new Error(
			`DesktopCalendar: config.variant "${variant}" does not match data-sdc-variant="${attrVariant}"`,
		);
	}

	if (yearList.min > yearList.max) {
		throw new Error("DesktopCalendar: yearList.min must be <= yearList.max");
	}

	const existing = boundRoots.get(root);
	if (existing) {
		existing.destroy();
	}

	const grid = requireEl<HTMLElement>(root, "[data-sdc-grid]");
	const monthTrigger = requireEl<HTMLButtonElement>(root, "[data-sdc-month-trigger]");
	const yearTrigger = requireEl<HTMLButtonElement>(root, "[data-sdc-year-trigger]");
	const monthLabel = requireEl<HTMLElement>(root, "[data-sdc-month-label]");
	const yearLabel = requireEl<HTMLElement>(root, "[data-sdc-year-label]");
	const monthPanel = requireEl<HTMLElement>(root, "[data-sdc-month-panel]");
	const yearPanel = requireEl<HTMLElement>(root, "[data-sdc-year-panel]");
	const monthGrid = requireEl<HTMLElement>(root, "[data-sdc-month-grid]");
	const yearListEl = requireEl<HTMLElement>(root, "[data-sdc-year-list]");
	const yearInput = requireEl<HTMLInputElement>(root, "[data-sdc-year-input]");
	const monthPicker = requireEl<HTMLElement>(root, "[data-sdc-month-picker]");
	const yearPicker = requireEl<HTMLElement>(root, "[data-sdc-year-picker]");
	const prevBtn = requireEl<HTMLButtonElement>(root, "[data-sdc-prev]");
	const nextBtn = requireEl<HTMLButtonElement>(root, "[data-sdc-next]");

	const intlLocale = config.intlLocale ?? "en-US";
	const monthFormatter = new Intl.DateTimeFormat(intlLocale, { month: "short" });
	const formatMonthOption = (month: number) =>
		monthFormatter.format(new Date(2000, month - 1, 1));

	const isPopover = variant === "popover-compact";
	const placement: SdcPlacement = config.placement ?? "above";
	const nudgeX = config.nudgeX ?? 0;
	const nearbyRadius = yearList.nearbyRadius ?? SDC_DEFAULT_NEARBY_RADIUS;

	let destroyed = false;
	let open = root.getAttribute("data-sdc-open") === "true";
	let toolbarPanel: ToolbarPanel = "none";
	let yearListReady = false;
	let yearListCacheKey = "";

	const todaySeed = getTodayCalendarDate();
	let viewYear = todaySeed.year;
	let viewMonth = todaySeed.month; // 1-based

	const abort = new AbortController();
	const { signal } = abort;

	const getMin = () => config.getMinDate?.() ?? null;
	const getMax = () => config.getMaxDate?.() ?? null;

	const clampView = () => {
		const min = getMin();
		const max = getMax();
		const yearMin = Math.max(yearList.min, min?.year ?? yearList.min);
		const yearMax = Math.min(yearList.max, max?.year ?? yearList.max);

		if (viewYear < yearMin) {
			viewYear = yearMin;
		}
		if (viewYear > yearMax) {
			viewYear = yearMax;
		}
		if (viewMonth < 1) {
			viewMonth = 1;
		}
		if (viewMonth > 12) {
			viewMonth = 12;
		}

		if (min && viewYear === min.year && viewMonth < min.month) {
			viewMonth = min.month;
		}
		if (max && viewYear === max.year && viewMonth > max.month) {
			viewMonth = max.month;
		}
	};

	const canGoPrevMonth = () => {
		const min = getMin();
		const yearMin = Math.max(yearList.min, min?.year ?? yearList.min);
		const monthMin = min && viewYear === min.year ? min.month : 1;
		return viewYear > yearMin || (viewYear === yearMin && viewMonth > monthMin);
	};

	const canGoNextMonth = () => {
		const max = getMax();
		const yearMax = Math.min(yearList.max, max?.year ?? yearList.max);
		const monthMax = max && viewYear === max.year ? max.month : 12;
		return viewYear < yearMax || (viewYear === yearMax && viewMonth < monthMax);
	};

	const isSelectable = (date: SdcCalendarDate): boolean => {
		if (config.isDateSelectable) {
			return config.isDateSelectable(date);
		}
		return defaultIsSelectable(date, getMin(), getMax());
	};

	const syncToolbarLabels = () => {
		monthLabel.textContent = formatMonthOption(viewMonth);
		yearLabel.textContent = String(viewYear);
		prevBtn.disabled = !canGoPrevMonth();
		nextBtn.disabled = !canGoNextMonth();
	};

	const yearsForList = (): number[] => {
		if (yearList.mode === "nearby") {
			return getNearbyYearWindow(viewYear, yearList.min, yearList.max, nearbyRadius);
		}
		const years: number[] = [];
		for (let year = yearList.min; year <= yearList.max; year += 1) {
			years.push(year);
		}
		return years;
	};

	const ensureYearList = () => {
		const years = yearsForList();
		const key = `${yearList.mode}:${years[0]}-${years[years.length - 1]}:${years.length}`;
		if (yearListReady && yearListCacheKey === key) {
			return;
		}

		const frag = document.createDocumentFragment();
		for (const year of years) {
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "sdc-year-option";
			btn.setAttribute("role", "option");
			btn.setAttribute("data-sdc-year-option", String(year));
			btn.textContent = String(year);
			frag.appendChild(btn);
		}
		yearListEl.replaceChildren(frag);
		yearListReady = true;
		yearListCacheKey = key;
	};

	const syncYearListSelection = () => {
		ensureYearList();
		yearListEl.querySelectorAll<HTMLButtonElement>("[data-sdc-year-option]").forEach((btn) => {
			const year = Number(btn.getAttribute("data-sdc-year-option"));
			const selected = year === viewYear;
			btn.classList.toggle("is-selected", selected);
			btn.setAttribute("aria-selected", selected ? "true" : "false");
		});
	};

	const scrollSelectedYearIntoView = () => {
		const selected = yearListEl.querySelector<HTMLElement>(
			`[data-sdc-year-option="${viewYear}"]`,
		);
		selected?.scrollIntoView({ block: "nearest" });
	};

	const renderMonthOptions = () => {
		const frag = document.createDocumentFragment();
		for (let month = 1; month <= 12; month += 1) {
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "sdc-month-option";
			btn.setAttribute("role", "option");
			btn.setAttribute("data-sdc-month-option", String(month));
			const selected = month === viewMonth;
			btn.setAttribute("aria-selected", selected ? "true" : "false");
			if (selected) {
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

	const applyYearInputValueIfValid = (): boolean => {
		const raw = yearInput.value.trim();
		if (!/^\d{4}$/.test(raw)) {
			return false;
		}
		const nextYear = Number(raw);
		if (
			!Number.isInteger(nextYear) ||
			nextYear < yearList.min ||
			nextYear > yearList.max
		) {
			return false;
		}
		viewYear = nextYear;
		clampView();
		return true;
	};

	const focusYearTrigger = () => {
		yearTrigger.focus({ preventScroll: true });
	};

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

	const selectYearFromOption = (year: number): void => {
		viewYear = year;
		clampView();
		closeToolbarPanels();
		renderMonth();
		repositionIfOpen();
		focusYearTrigger();
	};

	const setPositionVars = (left: number, top: number, width: number) => {
		root.style.setProperty("--sdc-pos-left", `${Math.round(left)}px`);
		root.style.setProperty("--sdc-pos-top", `${Math.round(top)}px`);
		root.style.setProperty("--sdc-pos-width", `${Math.round(width)}px`);
	};

	const rectsOverlap = (a: DOMRect, b: DOMRect) =>
		!(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);

	const positionPopover = () => {
		if (!isPopover || !open) {
			return;
		}

		const width = Math.min(22 * 16, window.innerWidth - VIEWPORT_PAD * 2);
		root.style.setProperty("--sdc-pos-width", `${width}px`);

		const height = root.offsetHeight;
		if (height <= 0) {
			return;
		}

		const vw = window.innerWidth;
		const vh = window.innerHeight;
		const trigger = config.getTrigger?.() ?? null;
		const anchor = config.getPositionAnchor?.() ?? trigger;
		const anchorRect = anchor?.getBoundingClientRect();
		const avoidRects = (config.getAvoidRects?.() ?? []).filter(
			(rect): rect is DOMRect => rect instanceof DOMRect,
		);

		let left = VIEWPORT_PAD;
		let top = VIEWPORT_PAD;

		const resolved = config.resolvePopoverPosition?.({
			width,
			height,
			gap: POPOVER_GAP,
			viewportPad: VIEWPORT_PAD,
			viewportWidth: vw,
			viewportHeight: vh,
			trigger,
			anchor,
		});

		if (resolved) {
			left = resolved.left;
			top = resolved.top;
		} else if (anchorRect) {
			if (placement === "right") {
				left = anchorRect.right + INPUT_GAP;
				top = anchorRect.bottom - height;

				if (left + width > vw - VIEWPORT_PAD) {
					const leftSide = anchorRect.left - INPUT_GAP - width;
					left = leftSide >= VIEWPORT_PAD ? leftSide : VIEWPORT_PAD;
				}
			} else {
				left = anchorRect.left + (anchorRect.width - width) / 2 + nudgeX;

				if (placement === "above" || placement === "auto") {
					top = anchorRect.top - POPOVER_GAP - height;
					if (top < VIEWPORT_PAD) {
						if (placement === "auto") {
							top = Math.min(
								anchorRect.bottom + POPOVER_GAP,
								vh - height - VIEWPORT_PAD,
							);
						} else {
							top = VIEWPORT_PAD;
						}
					}
				}

				let popRect = new DOMRect(left, top, width, height);

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
					popRect = new DOMRect(left, top, width, height);
				}

				for (const avoidRect of avoidRects) {
					popRect = new DOMRect(left, top, width, height);
					if (!rectsOverlap(popRect, avoidRect)) {
						continue;
					}

					const aboveAvoid = avoidRect.top - POPOVER_GAP - height;
					const besideRight = avoidRect.right + POPOVER_GAP;
					const besideLeft = avoidRect.left - POPOVER_GAP - width;
					const nearAnchorTop = Math.max(
						VIEWPORT_PAD,
						Math.min(anchorRect.top - height - INPUT_GAP, vh - height - VIEWPORT_PAD),
					);

					if (aboveAvoid >= VIEWPORT_PAD) {
						top = aboveAvoid;
					} else if (besideRight + width <= vw - VIEWPORT_PAD) {
						left = besideRight;
						top = nearAnchorTop;
					} else if (besideLeft >= VIEWPORT_PAD) {
						left = besideLeft;
						top = nearAnchorTop;
					}
				}
			}
		}

		top = Math.max(VIEWPORT_PAD, Math.min(top, vh - height - VIEWPORT_PAD));
		left = Math.max(VIEWPORT_PAD, Math.min(left, vw - width - VIEWPORT_PAD));
		setPositionVars(left, top, width);
	};

	const repositionIfOpen = () => {
		if (open && isPopover) {
			requestAnimationFrame(() => {
				positionPopover();
			});
		}
	};

	const syncViewToSelection = () => {
		const selection = config.getSelection();
		const anchor = selection.end ?? selection.start;
		if (anchor) {
			viewYear = anchor.year;
			viewMonth = anchor.month;
			clampView();
			return;
		}
		const today = getTodayCalendarDate();
		viewYear = today.year;
		viewMonth = today.month;
		clampView();
	};

	const renderMonth = () => {
		clampView();
		syncToolbarLabels();

		const selection = config.getSelection();
		const today = getTodayCalendarDate();
		const firstWeekday = (new Date(viewYear, viewMonth - 1, 1).getDay() + 6) % 7;
		const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
		const frag = document.createDocumentFragment();

		for (let i = 0; i < firstWeekday; i += 1) {
			const empty = document.createElement("span");
			empty.className = "sdc-cell sdc-cell--empty";
			empty.setAttribute("aria-hidden", "true");
			frag.appendChild(empty);
		}

		for (let day = 1; day <= daysInMonth; day += 1) {
			const date: SdcCalendarDate = { year: viewYear, month: viewMonth, day };
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = buildDayClassNames(date, selection, selectionMode, today);
			btn.textContent = String(day);
			btn.setAttribute("data-sdc-day", String(day));
			btn.setAttribute(
				"aria-label",
				intlLocale.startsWith("zh")
					? `${viewYear}年${viewMonth}月${day}日`
					: `${formatMonthOption(viewMonth)} ${day}, ${viewYear}`,
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
			if (yearList.mode === "nearby") {
				yearListReady = false;
			}
			syncYearListSelection();
			yearInput.value = String(viewYear);
		}
	};

	const focusTrigger = () => {
		const trigger = config.getTrigger?.();
		trigger?.focus({ preventScroll: true });
	};

	const setOpen = (next: boolean, options?: { restoreFocus?: boolean }) => {
		if (destroyed) {
			return;
		}

		const wasOpen = open;
		open = next;
		root.setAttribute("data-sdc-open", open ? "true" : "false");

		if (isPopover) {
			root.hidden = !open;
			root.setAttribute("aria-hidden", open ? "false" : "true");
			const trigger = config.getTrigger?.();
			trigger?.setAttribute("aria-expanded", open ? "true" : "false");
		}

		if (open) {
			if (isPopover) {
				DesktopCalendarRegistry.closeOthers(api);
			}
			config.onBeforeOpen?.();
			syncViewToSelection();
			renderMonth();
			requestAnimationFrame(() => {
				positionPopover();
			});
		} else {
			if (toolbarPanel === "year") {
				applyYearInputValueIfValid();
			}
			closeToolbarPanels();
			if (options?.restoreFocus !== false && wasOpen && isPopover) {
				focusTrigger();
			}
		}

		if (wasOpen !== open) {
			config.onOpenChange?.(open);
		}
	};

	const api: DesktopCalendarApi = {
		open: () => setOpen(true),
		close: () => setOpen(false),
		isOpen: () => open,
		refresh: () => {
			if (destroyed) {
				return;
			}
			renderMonth();
			repositionIfOpen();
		},
		setView: (year: number, month: number) => {
			viewYear = year;
			viewMonth = month;
			clampView();
			renderMonth();
			repositionIfOpen();
		},
		handleEscape: () => {
			if (destroyed) {
				return false;
			}
			if (!open && isPopover) {
				return false;
			}
			if (!open && !isPopover) {
				if (toolbarPanel === "year") {
					leaveYearPanel();
					return true;
				}
				if (toolbarPanel === "month") {
					closeToolbarPanels();
					return true;
				}
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
			if (isPopover) {
				setOpen(false);
				return true;
			}
			return false;
		},
		destroy: () => {
			if (destroyed) {
				return;
			}
			destroyed = true;
			if (open) {
				setOpen(false, { restoreFocus: false });
			}
			abort.abort();
			DesktopCalendarRegistry.unregister(api);
			if (boundRoots.get(root) === api) {
				boundRoots.delete(root);
			}
			root.style.removeProperty("--sdc-pos-left");
			root.style.removeProperty("--sdc-pos-top");
			root.style.removeProperty("--sdc-pos-width");
		},
	};

	monthTrigger.addEventListener(
		"click",
		(event) => {
			event.preventDefault();
			event.stopPropagation();
			if (toolbarPanel === "year") {
				leaveYearPanel({ focusTrigger: false });
			}
			setToolbarPanel(toolbarPanel === "month" ? "none" : "month");
		},
		{ signal },
	);

	yearTrigger.addEventListener(
		"click",
		(event) => {
			event.preventDefault();
			event.stopPropagation();
			if (toolbarPanel === "year") {
				leaveYearPanel();
			} else {
				setToolbarPanel("year");
			}
		},
		{ signal },
	);

	monthGrid.addEventListener(
		"click",
		(event) => {
			const target = event.target;
			if (!(target instanceof HTMLElement)) {
				return;
			}
			const option = target.closest<HTMLButtonElement>("[data-sdc-month-option]");
			if (!option || !monthGrid.contains(option)) {
				return;
			}
			event.preventDefault();
			const month = Number(option.getAttribute("data-sdc-month-option"));
			if (!Number.isInteger(month) || month < 1 || month > 12) {
				return;
			}
			viewMonth = month;
			clampView();
			closeToolbarPanels();
			renderMonth();
			repositionIfOpen();
		},
		{ signal },
	);

	yearListEl.addEventListener(
		"pointerdown",
		(event) => {
			const target = event.target;
			if (!(target instanceof HTMLElement)) {
				return;
			}
			const option = target.closest<HTMLButtonElement>("[data-sdc-year-option]");
			if (!option || !yearListEl.contains(option)) {
				return;
			}
			event.preventDefault();
		},
		{ signal },
	);

	yearListEl.addEventListener(
		"click",
		(event) => {
			const target = event.target;
			if (!(target instanceof HTMLElement)) {
				return;
			}
			const option = target.closest<HTMLButtonElement>("[data-sdc-year-option]");
			if (!option || !yearListEl.contains(option)) {
				return;
			}
			event.preventDefault();
			const year = Number(option.getAttribute("data-sdc-year-option"));
			if (
				!Number.isInteger(year) ||
				year < yearList.min ||
				year > yearList.max
			) {
				return;
			}
			selectYearFromOption(year);
		},
		{ signal },
	);

	yearInput.addEventListener(
		"beforeinput",
		(event) => {
			const inputEvent = event as InputEvent;
			if (inputEvent.inputType?.startsWith("insert") && inputEvent.data) {
				if (!/^\d+$/.test(inputEvent.data)) {
					event.preventDefault();
				}
			}
		},
		{ signal },
	);

	yearInput.addEventListener(
		"keydown",
		(event) => {
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
				nextYear < yearList.min ||
				nextYear > yearList.max
			) {
				yearInput.value = String(viewYear);
				return;
			}
			selectYearFromOption(nextYear);
		},
		{ signal },
	);

	yearInput.addEventListener(
		"blur",
		() => {
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
		},
		{ signal },
	);

	prevBtn.addEventListener(
		"click",
		(event) => {
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
			if (viewMonth < 1) {
				viewMonth = 12;
				viewYear -= 1;
			}
			clampView();
			renderMonth();
			repositionIfOpen();
		},
		{ signal },
	);

	nextBtn.addEventListener(
		"click",
		(event) => {
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
			if (viewMonth > 12) {
				viewMonth = 1;
				viewYear += 1;
			}
			clampView();
			renderMonth();
			repositionIfOpen();
		},
		{ signal },
	);

	grid.addEventListener(
		"click",
		(event) => {
			const target = event.target;
			if (!(target instanceof HTMLElement)) {
				return;
			}
			const dayBtn = target.closest<HTMLButtonElement>("[data-sdc-day]");
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

			const day = Number(dayBtn.getAttribute("data-sdc-day"));
			if (!Number.isInteger(day) || day < 1) {
				return;
			}

			const date: SdcCalendarDate = { year: viewYear, month: viewMonth, day };
			if (!isSelectable(date)) {
				return;
			}

			const next = computeNextSelection(selectionMode, config.getSelection(), date);
			const result = config.onSelect({
				date,
				selection: next.selection,
				complete: next.complete,
			});

			renderMonth();

			if (result.shouldClose) {
				setOpen(false);
			} else {
				repositionIfOpen();
			}
		},
		{ signal },
	);

	root.addEventListener(
		"pointerdown",
		(event) => {
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
		},
		{ signal },
	);

	if (isPopover) {
		document.addEventListener(
			"pointerdown",
			(event) => {
				if (!open || destroyed) {
					return;
				}
				const target = event.target;
				if (!(target instanceof Node)) {
					return;
				}
				if (root.contains(target)) {
					return;
				}
				const trigger = config.getTrigger?.();
				if (trigger?.contains(target)) {
					return;
				}
				const exclusions = config.getOutsideClickExclusions?.() ?? [];
				for (const el of exclusions) {
					if (el.contains(target)) {
						return;
					}
				}
				setOpen(false);
			},
			{ signal },
		);

		window.addEventListener(
			"resize",
			() => {
				if (open) {
					positionPopover();
				}
			},
			{ signal },
		);
	}

	document.addEventListener(
		"keydown",
		(event) => {
			if (event.key !== "Escape" || destroyed) {
				return;
			}
			if (api.handleEscape()) {
				event.preventDefault();
				event.stopPropagation();
			}
		},
		{ signal, capture: true },
	);

	DesktopCalendarRegistry.register(api);
	boundRoots.set(root, api);

	// 首次掛載：inline 可立即渲染；popover 等 open
	if (!isPopover || open) {
		syncViewToSelection();
		renderMonth();
	}

	return api;
}

export const DesktopCalendarController = {
	SDC_VARIANTS,
	createDesktopCalendar,
	DesktopCalendarRegistry,
	getNearbyYearWindow,
	compareCalendarDates,
	calendarDatesEqual,
	getTodayCalendarDate,
} as const;
