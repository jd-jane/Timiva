/**
 * Lunar Date Converter — tool-local Lunar Calendar controller（B2C）.
 * View state + render only; no ResultSummary / parser coupling.
 */
import { gregorianToLunarFromDataset } from "../lib/lunar/lunarConvert.ts";
import { formatLunarMonthZh } from "../lib/lunar/lunarFormat.ts";
import { listLunarMonths } from "../lib/lunar/lunarYearInfo.ts";
import type { CivilDate, LunarDate } from "../lib/lunar/lunarTypes.ts";
import {
	LUNAR_PUBLIC_YEAR_MAX,
	LUNAR_PUBLIC_YEAR_MIN,
} from "../lib/lunar/lunarTypes.ts";
import {
	type BoundaryView,
	buildDayCells,
	canNavigateMonth,
	formatLunarMonthOptionEn,
	getMonthRef,
	navigateMonth,
	resolveOpenView,
	selectYearFromPublicRange,
} from "../lib/lunarCalendarGrid.ts";

export interface LdcPopoverPositionContext {
	width: number;
	height: number;
	gap: number;
	viewportPad: number;
	viewportWidth: number;
	viewportHeight: number;
	trigger: HTMLElement | null;
	anchor: HTMLElement | null;
}

export interface LdcPopoverPosition {
	left: number;
	top: number;
}

export interface LunarCalendarConfig {
	root: HTMLElement;
	locale: "en" | "zh";
	yearMin?: number;
	yearMax?: number;
	getCommittedCivil: () => CivilDate;
	getTodayCivil: () => CivilDate;
	onSelect: (lunar: LunarDate) => { shouldClose: boolean };
	getTrigger?: () => HTMLElement | null;
	getPositionAnchor?: () => HTMLElement | null;
	resolvePopoverPosition?: (
		ctx: LdcPopoverPositionContext,
	) => LdcPopoverPosition | null | undefined;
	onOpenChange?: (open: boolean) => void;
}

export interface LunarCalendarApi {
	open(): void;
	close(): void;
	isOpen(): boolean;
	refresh(): void;
	destroy(): void;
	handleEscape(): boolean;
}

const POPOVER_GAP = 8;
const VIEWPORT_PAD = 16;
/** Must stay aligned with --ldc-lc-popover-width (23.5rem). */
const POPOVER_BASE_WIDTH_PX = 23.5 * 16;

type ToolbarPanel = "none" | "month" | "year";

const registry = new Set<LunarCalendarApi>();
const boundRoots = new WeakMap<HTMLElement, LunarCalendarApi>();

export const LunarCalendarRegistry = {
	register(api: LunarCalendarApi): void {
		registry.add(api);
	},
	unregister(api: LunarCalendarApi): void {
		registry.delete(api);
	},
	closeOthers(except: LunarCalendarApi): void {
		for (const api of registry) {
			if (api !== except && api.isOpen()) {
				api.close();
			}
		}
	},
};

function requireEl<T extends Element>(root: Element, selector: string): T {
	const el = root.querySelector<T>(selector);
	if (!el) {
		throw new Error(`LunarCalendar: missing ${selector}`);
	}
	return el;
}

function formatToolbarMonth(
	year: number,
	monthIndex: number,
	locale: "en" | "zh",
): string {
	const ref = getMonthRef(year, monthIndex);
	if (!ref) {
		return "—";
	}
	if (locale === "zh") {
		return `${year}年${formatLunarMonthZh(ref.month, ref.isLeapMonth)}`;
	}
	const monthLabel = formatLunarMonthOptionEn(ref);
	return `${year} ${monthLabel}`;
}

export function createLunarCalendar(config: LunarCalendarConfig): LunarCalendarApi {
	const { root } = config;
	if (!root.hasAttribute("data-lunar-calendar")) {
		throw new Error("LunarCalendar: root must have data-lunar-calendar");
	}

	const existing = boundRoots.get(root);
	if (existing) {
		return existing;
	}

	const yearMin = config.yearMin ?? LUNAR_PUBLIC_YEAR_MIN;
	const yearMax = config.yearMax ?? LUNAR_PUBLIC_YEAR_MAX;
	const locale = config.locale;

	root.setAttribute("data-ldc-lc-locale", locale);

	const abort = new AbortController();
	const { signal } = abort;
	let destroyed = false;
	let open = false;
	let toolbarPanel: ToolbarPanel = "none";
	let viewYear = yearMin;
	let viewMonthIndex = 0;
	let boundaryView: BoundaryView = null;
	let committedLunar: LunarDate | null = null;
	let yearListReady = false;

	const prevBtn = requireEl<HTMLButtonElement>(root, "[data-ldc-lc-prev]");
	const nextBtn = requireEl<HTMLButtonElement>(root, "[data-ldc-lc-next]");
	const monthTrigger = requireEl<HTMLButtonElement>(root, "[data-ldc-lc-month-trigger]");
	const yearTrigger = requireEl<HTMLButtonElement>(root, "[data-ldc-lc-year-trigger]");
	const monthLabelEl = requireEl<HTMLElement>(root, "[data-ldc-lc-month-label]");
	const yearLabelEl = requireEl<HTMLElement>(root, "[data-ldc-lc-year-label]");
	const monthPanel = requireEl<HTMLElement>(root, "[data-ldc-lc-month-panel]");
	const yearPanel = requireEl<HTMLElement>(root, "[data-ldc-lc-year-panel]");
	const monthGrid = requireEl<HTMLElement>(root, "[data-ldc-lc-month-grid]");
	const yearInput = requireEl<HTMLInputElement>(root, "[data-ldc-lc-year-input]");
	const yearListEl = requireEl<HTMLElement>(root, "[data-ldc-lc-year-list]");
	const grid = requireEl<HTMLElement>(root, "[data-ldc-lc-grid]");
	const monthPicker = requireEl<HTMLElement>(root, "[data-ldc-lc-month-picker]");
	const yearPicker = requireEl<HTMLElement>(root, "[data-ldc-lc-year-picker]");

	const getTodayLunar = (): LunarDate | null => {
		const result = gregorianToLunarFromDataset(config.getTodayCivil());
		return result.ok ? result.value : null;
	};

	const syncViewToCommitted = () => {
		const resolved = resolveOpenView(config.getCommittedCivil());
		viewYear = resolved.viewYear;
		viewMonthIndex = resolved.viewMonthIndex;
		boundaryView = resolved.boundaryView;
		committedLunar = resolved.committedLunar;
	};

	const syncToolbarLabels = () => {
		const ref = getMonthRef(viewYear, viewMonthIndex);
		if (locale === "zh") {
			monthLabelEl.textContent = ref
				? formatLunarMonthZh(ref.month, ref.isLeapMonth)
				: "—";
		} else {
			monthLabelEl.textContent = ref ? formatLunarMonthOptionEn(ref) : "—";
		}
		yearLabelEl.textContent = String(viewYear);
		root.setAttribute(
			"data-ldc-lc-boundary",
			boundaryView === "lower-sentinel" ? "lower-sentinel" : "none",
		);
	};

	const syncNavButtons = () => {
		prevBtn.disabled = !canNavigateMonth(viewYear, viewMonthIndex, -1, boundaryView);
		nextBtn.disabled = !canNavigateMonth(viewYear, viewMonthIndex, 1, boundaryView);
	};

	const renderMonthOptions = () => {
		const months = listLunarMonths(viewYear);
		const frag = document.createDocumentFragment();
		if (!months) {
			monthGrid.replaceChildren(frag);
			return;
		}

		months.forEach((ref, index) => {
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "ldc-lc-month-option";
			btn.setAttribute("role", "option");
			btn.setAttribute("data-ldc-lc-month-option", String(index));
			const selected = index === viewMonthIndex;
			btn.setAttribute("aria-selected", selected ? "true" : "false");
			if (selected) {
				btn.classList.add("is-selected");
			}
			btn.textContent =
				locale === "zh"
					? formatLunarMonthZh(ref.month, ref.isLeapMonth)
					: formatLunarMonthOptionEn(ref);

			if (boundaryView === "lower-sentinel") {
				btn.disabled = index !== viewMonthIndex;
			}

			frag.appendChild(btn);
		});
		monthGrid.replaceChildren(frag);
	};

	const ensureYearList = () => {
		if (yearListReady) {
			return;
		}
		const frag = document.createDocumentFragment();
		for (let year = yearMin; year <= yearMax; year += 1) {
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "ldc-lc-year-option";
			btn.setAttribute("role", "option");
			btn.setAttribute("data-ldc-lc-year-option", String(year));
			btn.textContent = String(year);
			frag.appendChild(btn);
		}
		yearListEl.replaceChildren(frag);
		yearListReady = true;
	};

	const syncYearListSelection = () => {
		for (const child of yearListEl.children) {
			if (!(child instanceof HTMLButtonElement)) {
				continue;
			}
			const year = Number(child.getAttribute("data-ldc-lc-year-option"));
			const selected = year === viewYear && boundaryView !== "lower-sentinel";
			child.classList.toggle("is-selected", selected);
			child.setAttribute("aria-selected", selected ? "true" : "false");
		}
	};

	const scrollSelectedYearIntoView = () => {
		const selected = yearListEl.querySelector<HTMLElement>(".ldc-lc-year-option.is-selected");
		selected?.scrollIntoView({ block: "nearest" });
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
			yearInput.value =
				boundaryView === "lower-sentinel" ? String(yearMin) : String(viewYear);
			requestAnimationFrame(() => {
				scrollSelectedYearIntoView();
				yearInput.focus({ preventScroll: true });
				yearInput.select();
			});
		}
	};

	const closeToolbarPanels = () => {
		setToolbarPanel("none");
	};

	const leaveYearPanel = (options?: { focusTrigger?: boolean }) => {
		closeToolbarPanels();
		if (options?.focusTrigger !== false) {
			yearTrigger.focus({ preventScroll: true });
		}
	};

	const selectYearFromOption = (year: number) => {
		const next = selectYearFromPublicRange(year, viewMonthIndex);
		if (!next) {
			return;
		}
		viewYear = next.year;
		viewMonthIndex = next.monthIndex;
		boundaryView = next.boundaryView;
		closeToolbarPanels();
		renderMonth();
		repositionIfOpen();
	};

	const positionPopover = () => {
		if (!open) {
			return;
		}

		const anchor = config.getPositionAnchor?.();
		if (!anchor) {
			return;
		}

		/* Canonical width from design token — never read getBoundingClientRect().width
		 * (that reuses --ldc-lc-pos-width and causes progressive shrink on reopen). */
		const width = Math.min(
			POPOVER_BASE_WIDTH_PX,
			window.innerWidth - VIEWPORT_PAD * 2,
		);
		root.style.setProperty("--ldc-lc-pos-width", `${Math.round(width)}px`);

		const height = root.offsetHeight;
		if (height <= 0) {
			requestAnimationFrame(() => positionPopover());
			return;
		}

		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;
		const resolved = config.resolvePopoverPosition?.({
			width,
			height,
			gap: POPOVER_GAP,
			viewportPad: VIEWPORT_PAD,
			viewportWidth,
			viewportHeight,
			trigger: config.getTrigger?.() ?? null,
			anchor,
		});
		if (!resolved) {
			return;
		}
		const left = Math.max(
			VIEWPORT_PAD,
			Math.min(resolved.left, viewportWidth - width - VIEWPORT_PAD),
		);
		const top = Math.max(
			VIEWPORT_PAD,
			Math.min(resolved.top, viewportHeight - height - VIEWPORT_PAD),
		);
		root.style.setProperty("--ldc-lc-pos-left", `${Math.round(left)}px`);
		root.style.setProperty("--ldc-lc-pos-top", `${Math.round(top)}px`);
	};

	const clearPositionVars = () => {
		root.style.removeProperty("--ldc-lc-pos-left");
		root.style.removeProperty("--ldc-lc-pos-top");
		root.style.removeProperty("--ldc-lc-pos-width");
	};

	const repositionIfOpen = () => {
		if (open) {
			requestAnimationFrame(() => positionPopover());
		}
	};

	const renderMonth = () => {
		syncToolbarLabels();
		syncNavButtons();

		const todayLunar = getTodayLunar();
		const gridModel = buildDayCells({
			viewYear,
			viewMonthIndex,
			committedLunar,
			todayLunar,
			boundaryView,
			locale,
		});

		const frag = document.createDocumentFragment();
		if (gridModel) {
			for (let i = 0; i < gridModel.leadingBlanks; i += 1) {
				const empty = document.createElement("span");
				empty.className = "ldc-lc-cell ldc-lc-cell--empty";
				empty.setAttribute("aria-hidden", "true");
				frag.appendChild(empty);
			}

			for (const cell of gridModel.cells) {
				const btn = document.createElement("button");
				btn.type = "button";
				btn.className = "ldc-lc-day";
				if (cell.isToday) {
					btn.classList.add("is-today");
				}
				if (cell.isSelected) {
					btn.classList.add("is-selected");
				}
				if (cell.isSentinelLocked) {
					btn.classList.add("is-sentinel-locked");
				}
				btn.textContent = cell.label;
				btn.setAttribute("data-ldc-lc-day", String(cell.lunar.day));
				btn.disabled = !cell.selectable;
				frag.appendChild(btn);
			}
		}

		grid.replaceChildren(frag);

		if (toolbarPanel === "month") {
			renderMonthOptions();
		}
		if (toolbarPanel === "year") {
			syncYearListSelection();
			yearInput.value =
				boundaryView === "lower-sentinel" ? String(yearMin) : String(viewYear);
		}
	};

	const focusTrigger = () => {
		config.getTrigger?.()?.focus({ preventScroll: true });
	};

	const setOpen = (next: boolean, options?: { restoreFocus?: boolean }) => {
		if (destroyed) {
			return;
		}

		const wasOpen = open;
		open = next;
		root.setAttribute("data-ldc-lc-open", open ? "true" : "false");
		root.hidden = !open;
		root.setAttribute("aria-hidden", open ? "false" : "true");
		config.getTrigger?.()?.setAttribute("aria-expanded", open ? "true" : "false");

		if (open) {
			LunarCalendarRegistry.closeOthers(api);
			syncViewToCommitted();
			renderMonth();
			/* Sync width first so reopen never reads a missing/stale --ldc-lc-pos-width. */
			const width = Math.min(
				POPOVER_BASE_WIDTH_PX,
				window.innerWidth - VIEWPORT_PAD * 2,
			);
			root.style.setProperty("--ldc-lc-pos-width", `${Math.round(width)}px`);
			requestAnimationFrame(() => positionPopover());
		} else {
			closeToolbarPanels();
			clearPositionVars();
			if (options?.restoreFocus !== false && wasOpen) {
				focusTrigger();
			}
		}

		if (wasOpen !== open) {
			config.onOpenChange?.(open);
		}
	};

	const api: LunarCalendarApi = {
		open: () => setOpen(true),
		close: () => setOpen(false),
		isOpen: () => open,
		refresh: () => {
			if (destroyed) {
				return;
			}
			syncViewToCommitted();
			renderMonth();
			repositionIfOpen();
		},
		handleEscape: () => {
			if (destroyed || !open) {
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
		destroy: () => {
			if (destroyed) {
				return;
			}
			destroyed = true;
			if (open) {
				setOpen(false, { restoreFocus: false });
			}
			abort.abort();
			LunarCalendarRegistry.unregister(api);
			if (boundRoots.get(root) === api) {
				boundRoots.delete(root);
			}
			clearPositionVars();
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
			const option = target.closest<HTMLButtonElement>("[data-ldc-lc-month-option]");
			if (!option || option.disabled || !monthGrid.contains(option)) {
				return;
			}
			event.preventDefault();
			const index = Number(option.getAttribute("data-ldc-lc-month-option"));
			if (!Number.isInteger(index) || index < 0) {
				return;
			}
			if (boundaryView === "lower-sentinel" && index !== viewMonthIndex) {
				return;
			}
			viewMonthIndex = index;
			if (viewYear >= yearMin) {
				boundaryView = null;
			}
			closeToolbarPanels();
			renderMonth();
			repositionIfOpen();
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
			const option = target.closest<HTMLButtonElement>("[data-ldc-lc-year-option]");
			if (!option || !yearListEl.contains(option)) {
				return;
			}
			event.preventDefault();
			const year = Number(option.getAttribute("data-ldc-lc-year-option"));
			if (!Number.isInteger(year)) {
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
				yearInput.value =
					boundaryView === "lower-sentinel" ? String(yearMin) : String(viewYear);
				return;
			}
			const nextYear = Number(raw);
			if (nextYear < yearMin || nextYear > yearMax) {
				yearInput.value =
					boundaryView === "lower-sentinel" ? String(yearMin) : String(viewYear);
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
				leaveYearPanel({ focusTrigger: false });
			});
		},
		{ signal },
	);

	prevBtn.addEventListener(
		"click",
		(event) => {
			event.preventDefault();
			event.stopPropagation();
			closeToolbarPanels();
			const next = navigateMonth(viewYear, viewMonthIndex, -1, boundaryView);
			if (!next) {
				return;
			}
			viewYear = next.year;
			viewMonthIndex = next.monthIndex;
			boundaryView = next.boundaryView;
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
			closeToolbarPanels();
			const next = navigateMonth(viewYear, viewMonthIndex, 1, boundaryView);
			if (!next) {
				return;
			}
			viewYear = next.year;
			viewMonthIndex = next.monthIndex;
			boundaryView = next.boundaryView;
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
			const dayBtn = target.closest<HTMLButtonElement>(".ldc-lc-day");
			if (!dayBtn || dayBtn.disabled || !grid.contains(dayBtn)) {
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			closeToolbarPanels();

			const ref = getMonthRef(viewYear, viewMonthIndex);
			if (!ref) {
				return;
			}
			const day = Number(dayBtn.getAttribute("data-ldc-lc-day"));
			if (!Number.isInteger(day) || day < 1) {
				return;
			}

			const lunar: LunarDate = {
				year: viewYear,
				month: ref.month,
				day,
				isLeapMonth: ref.isLeapMonth,
			};

			const result = config.onSelect(lunar);
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
			if (toolbarPanel === "month" && !monthPicker.contains(target)) {
				closeToolbarPanels();
			} else if (toolbarPanel === "year" && !yearPicker.contains(target)) {
				leaveYearPanel({ focusTrigger: false });
			}
		},
		{ signal },
	);

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

	LunarCalendarRegistry.register(api);
	boundRoots.set(root, api);

	return api;
}

export const LunarCalendarController = {
	createLunarCalendar,
	LunarCalendarRegistry,
	formatToolbarMonth,
} as const;
