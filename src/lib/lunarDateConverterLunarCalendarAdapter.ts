/**
 * Lunar Date Converter — tool-local Lunar Calendar thin adapter.
 */
import { getLocalTodayCivil } from "./lunarDateConverterEvaluate.ts";
import type { CivilDate, LunarDate } from "./lunar/lunarTypes.ts";
import { lunarToGregorian } from "./lunar/index.ts";
import {
	LUNAR_PUBLIC_YEAR_MAX,
	LUNAR_PUBLIC_YEAR_MIN,
} from "./lunar/lunarTypes.ts";
import {
	createLunarCalendar,
	type LunarCalendarApi,
} from "../scripts/lunar-calendar-controller.ts";

export interface LunarPickerDateSource {
	getCivil: () => CivilDate;
	setCivil: (date: CivilDate) => void;
	subscribe: (listener: () => void) => () => void;
}

export interface LunarPickerAdapterConfig {
	host: HTMLElement;
	trigger: HTMLButtonElement;
	anchor: HTMLElement;
	dateSource: LunarPickerDateSource;
	locale: "en" | "zh";
	/** When false, orchestrator owns trigger click routing. */
	bindTrigger?: boolean;
}

export interface LunarPickerAdapter {
	open: () => void;
	close: () => void;
	isOpen: () => boolean;
	destroy: () => void;
}

export function createLunarPickerAdapter(
	config: LunarPickerAdapterConfig,
): LunarPickerAdapter {
	const { host, trigger, anchor, dateSource, locale } = config;
	const bindTrigger = config.bindTrigger ?? true;
	const calendarRoot = host.querySelector<HTMLElement>("[data-lunar-calendar]");
	if (!calendarRoot) {
		throw new Error(
			"LunarDateConverter: lunar calendar host must contain [data-lunar-calendar]",
		);
	}

	const abort = new AbortController();
	const { signal } = abort;
	let destroyed = false;

	const calendar: LunarCalendarApi = createLunarCalendar({
		root: calendarRoot,
		locale,
		yearMin: LUNAR_PUBLIC_YEAR_MIN,
		yearMax: LUNAR_PUBLIC_YEAR_MAX,
		getCommittedCivil: () => dateSource.getCivil(),
		getTodayCivil: () => getLocalTodayCivil(),
		onSelect: (lunar: LunarDate) => {
			const civilResult = lunarToGregorian(lunar);
			if (!civilResult.ok) {
				return { shouldClose: false };
			}
			dateSource.setCivil(civilResult.value);
			return { shouldClose: true };
		},
		getTrigger: () => trigger,
		getPositionAnchor: () => anchor,
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

	if (bindTrigger) {
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
	}

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
