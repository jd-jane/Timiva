/**
 * Date Range Calculator — Desktop Shared Calendar adapter（Phase C）。
 * Shared 管 calendar internals；本 adapter 管 Desktop 掛載／銷毀與 range sync。
 * Mobile Sheet／legacy calendar 不由此模組操作。
 */

import {
	createDesktopCalendar,
	type DesktopCalendarApi,
	type SdcCalendarDate,
	type SdcSelection,
} from "./desktop-calendar-controller";

export interface DateRangeDesktopBridge {
	getSelection: () => SdcSelection;
	applyPick: (date: SdcCalendarDate) => void;
	subscribe: (listener: () => void) => () => void;
	isDesktop: () => boolean;
	getDesktopMedia: () => MediaQueryList;
	getIntlLocale: () => string;
}

export interface DateRangeDesktopCalendarBinder {
	bind: (bridge: DateRangeDesktopBridge) => void;
}

declare global {
	interface Window {
		TimivaDateRangeDesktopCalendar?: DateRangeDesktopCalendarBinder;
	}
}

const ROOT_SELECTOR = "#drc-sdc[data-desktop-calendar]";
const HOST_SELECTOR = "[data-drc-desktop-sdc-host]";

let bridgeRef: DateRangeDesktopBridge | null = null;
let calendarApi: DesktopCalendarApi | null = null;
let unsubscribe: (() => void) | null = null;
let mediaBound = false;
let mediaListener: (() => void) | null = null;

function getRoot(): HTMLElement | null {
	return document.querySelector<HTMLElement>(ROOT_SELECTOR);
}

function getHost(): HTMLElement | null {
	return document.querySelector<HTMLElement>(HOST_SELECTOR);
}

function destroyDesktopInstance(): void {
	unsubscribe?.();
	unsubscribe = null;
	calendarApi?.destroy();
	calendarApi = null;
}

function syncDesktopInstance(): void {
	const bridge = bridgeRef;
	const host = getHost();

	if (!bridge || !bridge.isDesktop()) {
		destroyDesktopInstance();
		if (host) {
			host.hidden = true;
		}
		return;
	}

	if (host) {
		host.hidden = false;
	}

	const root = getRoot();
	if (!root) {
		return;
	}

	if (calendarApi) {
		calendarApi.refresh();
		return;
	}

	calendarApi = createDesktopCalendar({
		root,
		variant: "inline-large",
		selectionMode: "range",
		intlLocale: bridge.getIntlLocale(),
		yearList: {
			min: 1,
			max: 9999,
			mode: "nearby",
			nearbyRadius: 10,
		},
		getSelection: () => bridge.getSelection(),
		onSelect: ({ date }) => {
			bridge.applyPick(date);
			// Desktop inline 常駐；關閉行為由工具外層／Mobile Sheet 負責
			return { shouldClose: false };
		},
	});

	unsubscribe = bridge.subscribe(() => {
		calendarApi?.refresh();
	});
}

/**
 * Module 先安裝 binder；date-range.js 在 bridge 就緒後呼叫 bind。
 * bind 可重複呼叫（idempotent）：只更新 bridge 並 sync。
 */
export function installDateRangeDesktopCalendarBinder(): void {
	window.TimivaDateRangeDesktopCalendar = {
		bind(bridge: DateRangeDesktopBridge) {
			bridgeRef = bridge;

			if (!mediaBound) {
				mediaBound = true;
				const media = bridge.getDesktopMedia();
				mediaListener = () => {
					syncDesktopInstance();
				};
				media.addEventListener("change", mediaListener);
			}

			syncDesktopInstance();
		},
	};
}
