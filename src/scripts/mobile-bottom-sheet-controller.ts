/**
 * Shared Mobile Bottom Sheet controller — D1／MSB Lab path（Historical）.
 * Superseded for new-tool Mobile Editor adoption by Adaptive Mobile Editor（AME）.
 * Do not use for new formal tools. Do not delete without dedicated consumer audit／Owner Gate.
 * Production baseline CSS（tool-mobile-sheet-v2-baseline.css／msb-*）remains separately active.
 *
 * Geometry: measure → CSS vars on [data-msb-host] only.
 * Never writes panel style.top / bottom / height / maxHeight.
 *
 * Phase D.1 — underlay + visualViewport layer composition:
 * - Full-page underlay never shrinks with keyboard
 * - VV layer aligns to visualViewport; panel bottom:0 inside layer (no inset lift)
 * - --msb-keyboard-inset is diagnostic / state only
 * - Internal field focus does not restore page scroll or rewrite geometry
 */

export type CloseReason = "overlay" | "escape" | "api" | "action";

export type MobileBottomSheetOptions = {
	trigger?: HTMLElement | null;
	onOpen?: () => void;
	onClose?: (reason: CloseReason) => void;
};

export type MobileBottomSheetController = {
	open: (trigger?: HTMLElement) => void;
	close: (reason?: CloseReason) => void;
	destroy: () => void;
	isOpen: () => boolean;
	getHost: () => HTMLElement;
};

type InertSnapshot = {
	el: HTMLElement;
	hadInert: boolean;
	hadAttr: boolean;
	attrValue: string | null;
};

type GeometryVars = {
	vvHeight: string;
	vvOffsetTop: string;
	keyboardInset: string;
	keyboardState: "open" | "closed";
	landscape: boolean;
};

const KEYBOARD_THRESHOLD_PX = 72;
const HOST_SELECTOR = "[data-msb-host]";

const landscapeMq =
	typeof window !== "undefined"
		? window.matchMedia(
				"(orientation: landscape) and (max-height: 700px) and (max-width: 1200px)",
			)
		: null;

const registry = new Set<MobileBottomSheetController>();
const boundHosts = new WeakMap<HTMLElement, MobileBottomSheetController>();

let scrollLockOwner: MobileBottomSheetController | null = null;
let sharedSavedScrollY = 0;

function px(n: number): string {
	return `${Math.max(0, Math.round(n))}px`;
}

function getViewportMetrics() {
	const viewport = window.visualViewport;
	return {
		height: viewport?.height ?? window.innerHeight,
		offsetTop: viewport?.offsetTop ?? 0,
		innerHeight: window.innerHeight,
	};
}

function isKeyboardOpenFromMetrics(metrics: {
	height: number;
	innerHeight: number;
}): boolean {
	return metrics.height < metrics.innerHeight - KEYBOARD_THRESHOLD_PX;
}

function isFocusable(el: HTMLElement): boolean {
	if (el.hasAttribute("disabled") || el.getAttribute("aria-hidden") === "true") {
		return false;
	}
	if (el.tabIndex < 0 && !["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(el.tagName)) {
		return false;
	}
	const style = window.getComputedStyle(el);
	if (style.display === "none" || style.visibility === "hidden") {
		return false;
	}
	return true;
}

function getFocusable(container: HTMLElement): HTMLElement[] {
	const nodes = container.querySelectorAll<HTMLElement>(
		'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
	);
	return [...nodes].filter(isFocusable);
}

function setCssVar(host: HTMLElement, name: string, value: string, cache: Map<string, string>) {
	if (cache.get(name) === value) {
		return;
	}
	cache.set(name, value);
	host.style.setProperty(name, value);
}

function clearCssVar(host: HTMLElement, name: string, cache: Map<string, string>) {
	if (!cache.has(name) && !host.style.getPropertyValue(name)) {
		return;
	}
	cache.delete(name);
	host.style.removeProperty(name);
}

function applyScrollLock(owner: MobileBottomSheetController, scrollY: number) {
	sharedSavedScrollY = scrollY;
	scrollLockOwner = owner;
	document.documentElement.classList.add("msb-scroll-lock", "msb-sheet-open");
	document.body.classList.add("msb-scroll-lock", "msb-sheet-open");
	window.scrollTo(0, scrollY);
}

function releaseScrollLock(owner: MobileBottomSheetController) {
	if (scrollLockOwner !== owner) {
		return;
	}
	document.documentElement.classList.remove("msb-scroll-lock", "msb-sheet-open");
	document.body.classList.remove("msb-scroll-lock", "msb-sheet-open");
	window.scrollTo(0, sharedSavedScrollY);
	scrollLockOwner = null;
}

/** If no shared sheet is open, ensure scroll-lock classes cannot stick and block taps. */
function ensureScrollLockClearedWhenIdle() {
	if (MobileBottomSheetRegistry.getOpen()) {
		return;
	}
	document.documentElement.classList.remove("msb-scroll-lock", "msb-sheet-open");
	document.body.classList.remove("msb-scroll-lock", "msb-sheet-open");
	scrollLockOwner = null;
}

function stabilizeOwnedScroll(owner: MobileBottomSheetController) {
	if (scrollLockOwner !== owner) {
		return;
	}
	if (Math.abs(window.scrollY - sharedSavedScrollY) > 1) {
		window.scrollTo(0, sharedSavedScrollY);
	}
}

/**
 * Only when field is actually outside the body scrollport.
 * Focus Spike must not need this; internal A↔B must not call it from focusin.
 */
function scrollFieldIntoBodyIfNeeded(body: HTMLElement, field: HTMLElement) {
	const bodyRect = body.getBoundingClientRect();
	const fieldRect = field.getBoundingClientRect();
	const pad = 8;

	if (fieldRect.top >= bodyRect.top + pad && fieldRect.bottom <= bodyRect.bottom - pad) {
		return;
	}

	if (fieldRect.top < bodyRect.top + pad) {
		body.scrollTop -= bodyRect.top + pad - fieldRect.top;
		return;
	}

	if (fieldRect.bottom > bodyRect.bottom - pad) {
		body.scrollTop += fieldRect.bottom - (bodyRect.bottom - pad);
	}
}

function collectPageInertTargets(host: HTMLElement): HTMLElement[] {
	const targets: HTMLElement[] = [];
	for (const child of Array.from(document.body.children)) {
		if (!(child instanceof HTMLElement)) {
			continue;
		}
		if (child === host) {
			continue;
		}
		const tag = child.tagName;
		if (tag === "SCRIPT" || tag === "STYLE" || tag === "LINK" || tag === "TEMPLATE") {
			continue;
		}
		targets.push(child);
	}
	return targets;
}

function applyPageInert(host: HTMLElement): InertSnapshot[] {
	const snapshots: InertSnapshot[] = [];
	for (const el of collectPageInertTargets(host)) {
		snapshots.push({
			el,
			hadInert: el.inert,
			hadAttr: el.hasAttribute("inert"),
			attrValue: el.getAttribute("inert"),
		});
		el.inert = true;
	}
	return snapshots;
}

function restorePageInert(snapshots: InertSnapshot[]) {
	for (const snap of snapshots) {
		if (snap.hadInert || snap.hadAttr) {
			snap.el.inert = true;
			if (snap.hadAttr) {
				if (snap.attrValue === null) {
					snap.el.setAttribute("inert", "");
				} else {
					snap.el.setAttribute("inert", snap.attrValue);
				}
			}
		} else {
			snap.el.inert = false;
			snap.el.removeAttribute("inert");
		}
	}
	snapshots.length = 0;
}

function blurSheetInputs(sheet: HTMLElement) {
	const active = document.activeElement;
	if (active instanceof HTMLElement && sheet.contains(active)) {
		active.blur();
	}
}

/** 同頁多 fixture：同一時間只能有一個 shared Sheet 開啟。 */
export const MobileBottomSheetRegistry = {
	register(api: MobileBottomSheetController): void {
		registry.add(api);
	},
	unregister(api: MobileBottomSheetController): void {
		registry.delete(api);
	},
	closeOthers(except: MobileBottomSheetController): void {
		for (const api of registry) {
			if (api !== except && api.isOpen()) {
				api.close("api");
			}
		}
	},
	destroyAll(): void {
		for (const api of [...registry]) {
			api.destroy();
		}
	},
	size(): number {
		return registry.size;
	},
	getOpen(): MobileBottomSheetController | null {
		for (const api of registry) {
			if (api.isOpen()) {
				return api;
			}
		}
		return null;
	},
};

export function createMobileBottomSheet(
	host: HTMLElement,
	options: MobileBottomSheetOptions = {},
): MobileBottomSheetController {
	if (!(host instanceof HTMLElement) || !host.matches(HOST_SELECTOR)) {
		throw new Error("createMobileBottomSheet: host must match [data-msb-host]");
	}

	const existing = boundHosts.get(host);
	if (existing) {
		existing.destroy();
	}

	const overlay = host.querySelector<HTMLElement>("[data-msb-overlay]");
	const vvLayer = host.querySelector<HTMLElement>("[data-msb-vv-layer]");
	const sheet = host.querySelector<HTMLElement>(".msb-sheet");
	if (!overlay || !vvLayer || !sheet) {
		throw new Error(
			"createMobileBottomSheet: host requires [data-msb-overlay], [data-msb-vv-layer], and .msb-sheet",
		);
	}

	const varCache = new Map<string, string>();
	let destroyed = false;
	let isOpen = false;
	let isClosing = false;
	let lastTrigger: HTMLElement | null = options.trigger ?? null;
	let inertSnapshots: InertSnapshot[] = [];
	let lastGeometry: GeometryVars | null = null;
	let vvRaf = 0;
	let lastDiagEvent = "init";

	const ensurePortal = () => {
		if (host.parentElement !== document.body) {
			document.body.appendChild(host);
		}
		host.hidden = false;
		host.removeAttribute("hidden");
		host.setAttribute("aria-hidden", isOpen ? "false" : "true");
	};

	const writeGeometry = (forceClosedKeyboard = false) => {
		if (!isOpen || destroyed || isClosing) {
			return;
		}

		const metrics = getViewportMetrics();
		const landscape = landscapeMq?.matches ?? false;
		const keyboardOpen =
			!forceClosedKeyboard && isKeyboardOpenFromMetrics(metrics);

		const next: GeometryVars = {
			vvHeight: px(metrics.height),
			vvOffsetTop: px(metrics.offsetTop),
			/* Diagnostic／state only — must NOT drive panel inset lift. */
			keyboardInset: keyboardOpen
				? px(Math.max(0, metrics.innerHeight - metrics.height - metrics.offsetTop))
				: "0px",
			keyboardState: keyboardOpen ? "open" : "closed",
			landscape,
		};

		host.setAttribute("data-msb-landscape", landscape ? "true" : "false");

		if (
			lastGeometry &&
			lastGeometry.vvHeight === next.vvHeight &&
			lastGeometry.vvOffsetTop === next.vvOffsetTop &&
			lastGeometry.keyboardInset === next.keyboardInset &&
			lastGeometry.keyboardState === next.keyboardState &&
			lastGeometry.landscape === next.landscape
		) {
			return;
		}

		/* Page scroll stabilize only when VV／keyboard geometry actually changes — not on focus. */
		stabilizeOwnedScroll(api);
		lastGeometry = next;

		setCssVar(host, "--msb-vv-height", next.vvHeight, varCache);
		setCssVar(host, "--msb-vv-offset-top", next.vvOffsetTop, varCache);
		setCssVar(host, "--msb-keyboard-inset", next.keyboardInset, varCache);

		host.setAttribute("data-msb-keyboard", next.keyboardState);
		if (next.keyboardState === "open") {
			host.classList.add("msb-keyboard-sync");
		} else {
			host.classList.remove("msb-keyboard-sync");
		}

		lastDiagEvent = `vv:${next.keyboardState}`;
		host.setAttribute("data-msb-last-event", lastDiagEvent);
	};

	const clearGeometryVars = () => {
		lastGeometry = null;
		clearCssVar(host, "--msb-vv-height", varCache);
		clearCssVar(host, "--msb-vv-offset-top", varCache);
		clearCssVar(host, "--msb-keyboard-inset", varCache);
		host.setAttribute("data-msb-keyboard", "closed");
		host.setAttribute("data-msb-landscape", "false");
		host.classList.remove("msb-keyboard-sync");
	};

	const scheduleViewportGeometry = (source: string) => {
		if (!isOpen || destroyed || isClosing) {
			return;
		}
		lastDiagEvent = source;
		host.setAttribute("data-msb-last-event", source);
		if (vvRaf !== 0) {
			return;
		}
		vvRaf = window.requestAnimationFrame(() => {
			vvRaf = 0;
			writeGeometry();
		});
	};

	const onViewportChange = () => {
		scheduleViewportGeometry("vv");
	};

	const onWindowScroll = () => {
		if (!isOpen || destroyed || isClosing) {
			return;
		}
		/* Defend scroll lock against browser page scroll — not a focus-transition path. */
		stabilizeOwnedScroll(api);
	};

	const onKeyDown = (event: KeyboardEvent) => {
		if (destroyed || !isOpen || isClosing) {
			return;
		}

		if (event.key === "Escape") {
			event.preventDefault();
			api.close("escape");
			return;
		}

		if (event.key !== "Tab") {
			return;
		}

		const focusables = getFocusable(sheet);
		if (focusables.length === 0) {
			event.preventDefault();
			sheet.focus({ preventScroll: true });
			return;
		}

		const first = focusables[0];
		const last = focusables[focusables.length - 1];
		const active = document.activeElement;

		if (event.shiftKey) {
			if (active === first || active === sheet || !sheet.contains(active)) {
				event.preventDefault();
				last.focus({ preventScroll: true });
			}
			return;
		}

		if (active === last || !sheet.contains(active)) {
			event.preventDefault();
			first.focus({ preventScroll: true });
		}
	};

	const dismissKeyboardThen = (then: () => void) => {
		blurSheetInputs(sheet);
		sheet.focus({ preventScroll: true });
		then();
	};

	const onOverlayPointer = (event: Event) => {
		event.preventDefault();
		dismissKeyboardThen(() => api.close("overlay"));
	};

	const onFocusIn = (event: FocusEvent) => {
		if (!isOpen || destroyed || isClosing) {
			return;
		}
		const target = event.target;
		if (!(target instanceof Node)) {
			return;
		}

		/*
		 * Internal field transition (A↔B, retap): do NOTHING.
		 * No page scroll restore, no geometry rewrite, no body scroll, no focus steal.
		 */
		if (sheet.contains(target)) {
			lastDiagEvent = "focusin:internal";
			host.setAttribute("data-msb-last-event", lastDiagEvent);
			return;
		}

		/*
		 * Focus truly left the sheet — contain to sheet root (not an input)
		 * so Safari Done can dismiss the keyboard without re-focusing a field.
		 */
		lastDiagEvent = "focusin:escape";
		host.setAttribute("data-msb-last-event", lastDiagEvent);
		sheet.focus({ preventScroll: true });
	};

	const api: MobileBottomSheetController = {
		open(trigger?: HTMLElement) {
			if (destroyed || isOpen) {
				if (trigger) {
					lastTrigger = trigger;
				}
				return;
			}

			MobileBottomSheetRegistry.closeOthers(api);

			if (trigger) {
				lastTrigger = trigger;
			}

			ensurePortal();
			isOpen = true;
			isClosing = false;
			host.setAttribute("data-msb-open", "true");
			host.setAttribute("aria-hidden", "false");

			/*
			 * Paint overlay + sheet FIRST.
			 * applyPageInert on a large Lab page is expensive on mobile Safari and
			 * previously ran before any visible update (symptom B: long blank wait).
			 */
			overlay.hidden = false;
			overlay.removeAttribute("hidden");
			overlay.setAttribute("aria-hidden", "false");
			overlay.classList.add("is-visible");

			vvLayer.removeAttribute("inert");
			vvLayer.setAttribute("aria-hidden", "false");

			sheet.removeAttribute("inert");
			sheet.inert = false;
			sheet.setAttribute("aria-hidden", "false");
			void host.offsetHeight;
			sheet.classList.add("is-open");

			applyScrollLock(api, window.scrollY);
			writeGeometry();
			lastDiagEvent = "open";
			host.setAttribute("data-msb-last-event", lastDiagEvent);
			options.onOpen?.();

			window.requestAnimationFrame(() => {
				if (!isOpen || destroyed || isClosing) {
					return;
				}
				inertSnapshots = applyPageInert(host);
				sheet.focus({ preventScroll: true });
			});
		},

		close(reason: CloseReason = "api") {
			if (destroyed || !isOpen || isClosing) {
				return;
			}

			isClosing = true;
			blurSheetInputs(sheet);
			sheet.focus({ preventScroll: true });

			isOpen = false;
			host.setAttribute("data-msb-open", "false");
			host.setAttribute("aria-hidden", "true");
			clearGeometryVars();

			overlay.classList.remove("is-visible");
			overlay.hidden = true;
			overlay.setAttribute("hidden", "");
			overlay.setAttribute("aria-hidden", "true");

			vvLayer.setAttribute("aria-hidden", "true");

			sheet.classList.remove("is-open");
			sheet.setAttribute("aria-hidden", "true");
			sheet.inert = true;
			sheet.setAttribute("inert", "");

			restorePageInert(inertSnapshots);
			releaseScrollLock(api);

			/* Collapse host so VV layer cannot intercept page taps after close. */
			host.hidden = true;
			host.setAttribute("hidden", "");
			host.setAttribute("aria-hidden", "true");
			ensureScrollLockClearedWhenIdle();

			const returnTarget = lastTrigger;
			lastDiagEvent = `close:${reason}`;
			host.setAttribute("data-msb-last-event", lastDiagEvent);

			window.requestAnimationFrame(() => {
				if (returnTarget && typeof returnTarget.focus === "function") {
					returnTarget.focus({ preventScroll: true });
				}
				isClosing = false;
				options.onClose?.(reason);
			});
		},

		destroy() {
			if (destroyed) {
				return;
			}
			if (isOpen) {
				api.close("api");
			}
			destroyed = true;

			if (vvRaf !== 0) {
				window.cancelAnimationFrame(vvRaf);
				vvRaf = 0;
			}

			window.visualViewport?.removeEventListener("resize", onViewportChange);
			window.visualViewport?.removeEventListener("scroll", onViewportChange);
			window.removeEventListener("resize", onViewportChange);
			window.removeEventListener("scroll", onWindowScroll, true);
			document.removeEventListener("keydown", onKeyDown, true);
			document.removeEventListener("focusin", onFocusIn, true);
			overlay.removeEventListener("click", onOverlayPointer);
			landscapeMq?.removeEventListener("change", onViewportChange);

			clearGeometryVars();
			restorePageInert(inertSnapshots);
			releaseScrollLock(api);

			boundHosts.delete(host);
			MobileBottomSheetRegistry.unregister(api);
		},

		isOpen() {
			return isOpen && !destroyed;
		},

		getHost() {
			return host;
		},
	};

	boundHosts.set(host, api);
	MobileBottomSheetRegistry.register(api);

	/*
	 * Do NOT ensurePortal / unhide on init.
	 * Portaling every Lab host immediately leaves full-viewport VV layers in the
	 * document (z-index above page chrome) and blocks taps on Safari landscape.
	 * Host stays `hidden` until the first open().
	 */
	host.setAttribute("data-msb-open", "false");
	host.setAttribute("data-msb-keyboard", "closed");
	host.setAttribute("data-msb-landscape", "false");
	host.setAttribute("data-msb-last-event", "init");
	sheet.setAttribute("tabindex", sheet.getAttribute("tabindex") ?? "-1");

	overlay.addEventListener("click", onOverlayPointer);
	document.addEventListener("keydown", onKeyDown, true);
	document.addEventListener("focusin", onFocusIn, true);
	window.visualViewport?.addEventListener("resize", onViewportChange);
	window.visualViewport?.addEventListener("scroll", onViewportChange);
	window.addEventListener("resize", onViewportChange);
	window.addEventListener("scroll", onWindowScroll, true);
	landscapeMq?.addEventListener("change", onViewportChange);

	return api;
}

/**
 * Reserved for future oversized-body content only.
 * Must NOT be called from focusin internal transitions (Phase D.1).
 */
void scrollFieldIntoBodyIfNeeded;

export function initMobileBottomSheets(root: ParentNode = document): MobileBottomSheetController[] {
	const hosts = root.querySelectorAll<HTMLElement>(HOST_SELECTOR);
	const controllers: MobileBottomSheetController[] = [];
	for (const host of hosts) {
		if (boundHosts.has(host)) {
			continue;
		}
		controllers.push(createMobileBottomSheet(host));
	}
	return controllers;
}
