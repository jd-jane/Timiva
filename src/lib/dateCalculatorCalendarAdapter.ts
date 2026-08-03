/**
 * Date Calculator — Shared DesktopCalendar thin adapter (B2.3).
 * Shared owns calendar DOM／render／keyboard／outside-click／focus／position clamp.
 * This adapter owns single-date selection, bounds, trigger toggle, and Smart Date sync.
 */
import type { CivilDate } from "./dateCalculatorMath.ts";
import {
	createDesktopCalendar,
	type DesktopCalendarApi,
	type SdcCalendarDate,
} from "../scripts/desktop-calendar-controller.ts";

export interface DateCalculatorCalendarDateSource {
	getDate: () => CivilDate | null;
	setDate: (date: CivilDate) => void;
	subscribe: (listener: () => void) => () => void;
}

export interface DateCalculatorCalendarAdapterConfig {
	root: HTMLElement;
	trigger: HTMLButtonElement;
	anchor: HTMLElement;
	dateSource: DateCalculatorCalendarDateSource;
	intlLocale: string;
	getAvoidRects?: () => Array<DOMRect | undefined | null>;
}

export interface DateCalculatorCalendarAdapter {
	open: () => void;
	close: () => void;
	isOpen: () => boolean;
	destroy: () => void;
}

export const DATE_CALCULATOR_CALENDAR_CONFIG = {
	variant: "popover-compact",
	selectionMode: "single",
	min: { year: 1900, month: 1, day: 1 },
	max: { year: 2200, month: 12, day: 31 },
	yearList: { min: 1900, max: 2200, mode: "full" },
} as const;

function cloneDate(date: CivilDate | null): SdcCalendarDate | null {
	return date ? { year: date.year, month: date.month, day: date.day } : null;
}

export function createDateCalculatorCalendarAdapter(
	config: DateCalculatorCalendarAdapterConfig,
): DateCalculatorCalendarAdapter {
	const { root, trigger, anchor, dateSource } = config;
	const abort = new AbortController();
	const { signal } = abort;
	let destroyed = false;

	const calendar: DesktopCalendarApi = createDesktopCalendar({
		root,
		variant: DATE_CALCULATOR_CALENDAR_CONFIG.variant,
		selectionMode: DATE_CALCULATOR_CALENDAR_CONFIG.selectionMode,
		intlLocale: config.intlLocale,
		yearList: DATE_CALCULATOR_CALENDAR_CONFIG.yearList,
		getMinDate: () => DATE_CALCULATOR_CALENDAR_CONFIG.min,
		getMaxDate: () => DATE_CALCULATOR_CALENDAR_CONFIG.max,
		getSelection: () => ({
			start: cloneDate(dateSource.getDate()),
			end: null,
		}),
		onSelect: ({ date }) => {
			dateSource.setDate({
				year: date.year,
				month: date.month,
				day: date.day,
			});
			return { shouldClose: true };
		},
		getTrigger: () => trigger,
		getPositionAnchor: () => anchor,
		getAvoidRects: config.getAvoidRects,
		placement: "right",
		resolvePopoverPosition: ({
			width,
			height,
			gap,
			viewportPad,
			viewportWidth,
			viewportHeight,
		}) => {
			const anchorRect = anchor.getBoundingClientRect();
			/* 開在整個 Start date 輸入框右側；允許壓住右側相關工具。 */
			const left = Math.max(
				viewportPad,
				Math.min(
					anchorRect.right + gap,
					viewportWidth - width - viewportPad,
				),
			);
			/* 小日曆下緣對齊輸入框下緣。 */
			let top = anchorRect.bottom - height;
			if (top < viewportPad) {
				top = viewportPad;
			} else if (top + height > viewportHeight - viewportPad) {
				top = Math.max(
					viewportPad,
					viewportHeight - height - viewportPad,
				);
			}
			return { left, top };
		},
	});

	const unsubscribe = dateSource.subscribe(() => {
		if (!destroyed && calendar.isOpen()) {
			calendar.refresh();
		}
	});

	trigger.addEventListener(
		"click",
		(event) => {
			event.preventDefault();
			event.stopPropagation();
			if (calendar.isOpen()) {
				calendar.close();
			} else {
				calendar.open();
			}
		},
		{ signal },
	);

	return {
		open: () => {
			if (!destroyed) {
				calendar.open();
			}
		},
		close: () => {
			if (!destroyed) {
				calendar.close();
			}
		},
		isOpen: () => !destroyed && calendar.isOpen(),
		destroy: () => {
			if (destroyed) {
				return;
			}
			destroyed = true;
			unsubscribe();
			abort.abort();
			calendar.destroy();
		},
	};
}
