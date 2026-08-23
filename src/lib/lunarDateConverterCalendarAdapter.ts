/**
 * Lunar Date Converter — Shared DesktopCalendar thin adapter.
 */
import type { CivilDate } from "./lunar/lunarTypes.ts";
import {
	createDesktopCalendar,
	type DesktopCalendarApi,
} from "../scripts/desktop-calendar-controller.ts";
import {
	MAX_GREGORIAN,
	MIN_GREGORIAN,
} from "./lunarDateConverterGregorianInput.ts";

export interface LunarCalendarDateSource {
	getDate: () => CivilDate | null;
	setDate: (date: CivilDate) => void;
	subscribe: (listener: () => void) => () => void;
}

export interface LunarCalendarAdapterConfig {
	/** Host wrapping Shared DesktopCalendar root（含 [data-desktop-calendar]）. */
	host: HTMLElement;
	trigger: HTMLButtonElement;
	anchor: HTMLElement;
	dateSource: LunarCalendarDateSource;
	intlLocale: string;
}

export interface LunarCalendarAdapter {
	open: () => void;
	close: () => void;
	isOpen: () => boolean;
	destroy: () => void;
}

function cloneDate(date: CivilDate | null) {
	return date ? { year: date.year, month: date.month, day: date.day } : null;
}

export function createLunarCalendarAdapter(
	config: LunarCalendarAdapterConfig,
): LunarCalendarAdapter {
	const { host, trigger, anchor, dateSource } = config;
	const calendarRoot = host.querySelector<HTMLElement>("[data-desktop-calendar]");
	if (!calendarRoot) {
		throw new Error(
			"LunarDateConverter: calendar host must contain [data-desktop-calendar]",
		);
	}

	const abort = new AbortController();
	const { signal } = abort;
	let destroyed = false;

	const calendar: DesktopCalendarApi = createDesktopCalendar({
		root: calendarRoot,
		variant: "popover-compact",
		selectionMode: "single",
		intlLocale: config.intlLocale,
		yearList: {
			min: MIN_GREGORIAN.year,
			max: MAX_GREGORIAN.year,
			mode: "full",
		},
		getMinDate: () => MIN_GREGORIAN,
		getMaxDate: () => MAX_GREGORIAN,
		getSelection: () => ({
			start: cloneDate(dateSource.getDate()),
			end: null,
		}),
		onSelect: ({ date }) => {
			dateSource.setDate({ year: date.year, month: date.month, day: date.day });
			return { shouldClose: true };
		},
		getTrigger: () => trigger,
		getPositionAnchor: () => anchor,
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
			const left = Math.max(
				viewportPad,
				Math.min(anchorRect.right + gap, viewportWidth - width - viewportPad),
			);
			let top = anchorRect.bottom - height;
			if (top < viewportPad) {
				top = viewportPad;
			} else if (top + height > viewportHeight - viewportPad) {
				top = Math.max(viewportPad, viewportHeight - height - viewportPad);
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
			if (!destroyed) calendar.open();
		},
		close: () => {
			if (!destroyed) calendar.close();
		},
		isOpen: () => !destroyed && calendar.isOpen(),
		destroy: () => {
			if (destroyed) return;
			destroyed = true;
			unsubscribe();
			abort.abort();
			calendar.destroy();
		},
	};
}
