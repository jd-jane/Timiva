/**
 * Adaptive Mobile Editor controller — B7 Core Hardening＋B8.2 lifecycle mode.
 * Opaque draft＋adapter hooks · submit｜live lifecycle · numericField configs.
 * No VV／portal／registry／tool calculation semantics／field DSL.
 * Inert target: exclusively [data-ame-page-content].
 */

import {
	ameAnyNumericFilled,
	ameNumericLiveMessage,
	appendAmeDigit,
	clearAmeDigits,
	deleteAmeDigit,
	normalizeAmeNumericAfterEdit,
} from "../lib/ameNumericDraft";

/** Opaque to AME — tool／Lab adapter defines shape. */
export type AmeDraftBag = Record<string, unknown>;

/** Dismiss-only reasons. Never used to commit. */
export type AmeCloseReason = "cancel" | "escape" | "api";

/** After successful submit dismiss — not a public commit bypass. */
export type AmeDismissAfterSubmit = "submit";

/**
 * Adapter lifecycle mode（B8.2）.
 * - submit（default）：draft until Done；Cancel／Escape／underlay rollback.
 * - live：valid／invalid draft changes sync immediately；Done／Escape／underlay dismiss only.
 * No other modes. No tool-name branching.
 */
export type AmeLifecycle = "submit" | "live";

export type AmeValidateResult =
	| { ok: true }
	| {
			ok: false;
			/** Form-level message for shared error region（only when no fieldErrors）. */
			message: string;
			/**
			 * Optional field-scoped errors（B8.1）.
			 * Keys = existing field ids；values = accessibility messages.
			 * When present／non-empty → field icons only；no bottom banner.
			 */
			fieldErrors?: Record<string, string>;
	  };

/**
 * Minimal numeric field config（B6 C1／B8 Decision C）.
 * Not a widget／schema registry.
 * maxLength: positive integer digit cap，or null = no AME digit truncate（must still be explicit）.
 */
export type AmeNumericFieldConfig = {
	id: string;
	maxLength: number | null;
	allowEmpty: boolean;
};

export type AmeAdapter<TDraft extends AmeDraftBag> = {
	getCommitted: () => TDraft;
	getResetDraft: () => TDraft;
	createOpenDraft?: (committed: TDraft) => TDraft;
	validate: (draft: TDraft) => AmeValidateResult;
	onCommit: (committed: TDraft) => void;
	/** Default `submit`. Opt-in `live` for adopters that sync on every draft change. */
	lifecycle?: AmeLifecycle;
	shouldShowReset?: () => boolean;
	onDraftChange?: (draft: TDraft) => void;
	/**
	 * Optional pre-write gate for keypad digits（B8 Decision C tools）.
	 * Shared AME only asks accept／reject — tool owns all calculation semantics.
	 * Omit → accept（Lab／default）.
	 */
	acceptNumericCandidate?: (args: {
		fieldId: string;
		currentValue: string;
		candidateValue: string;
		digit: string;
		draft: TDraft;
	}) => boolean;
};

/** Lab-only open responsibility ladders. */
export type AmeDiagMode = "display" | "lock" | "inert" | "full";

export type AmeOpenTiming = {
	openStartMs: number;
	displayWrittenMs: number;
	scrollLockAppliedMs: number | null;
	inertAppliedMs: number | null;
	focusCalledMs: number | null;
};

export type AdaptiveMobileEditorController<TDraft extends AmeDraftBag = AmeDraftBag> = {
	open: (trigger?: HTMLElement, options?: { mode?: AmeDiagMode }) => AmeOpenTiming;
	/**
	 * Done control.
	 * submit lifecycle: validate → commit clone → onCommit → dismiss.
	 * live lifecycle: dismiss only（page state already synced）.
	 */
	submit: () => boolean;
	/**
	 * Dismiss chrome.
	 * submit lifecycle: rollback draft to committed；never onCommit.
	 * live lifecycle: dismiss only；no rollback of already-applied state.
	 */
	close: (reason?: AmeCloseReason) => void;
	isOpen: () => boolean;
	destroy: () => void;
	getRoot: () => HTMLElement;
	getLastMode: () => AmeDiagMode;
	getCommitted: () => TDraft;
	getDraft: () => TDraft;
	patchDraft: (partial: Partial<TDraft>) => void;
	clearActiveField: () => void;
	resetDraft: () => void;
};

type Options<TDraft extends AmeDraftBag> = {
	pageContent: HTMLElement;
	adapter: AmeAdapter<TDraft>;
	numericFields?: readonly AmeNumericFieldConfig[];
	/** Lab／adapter UI sync after numeric／chrome sync（e.g. Mixed controls）. */
	onSyncUi?: (draft: TDraft) => void;
	onOpen?: (timing: AmeOpenTiming, mode: AmeDiagMode) => void;
	onClose?: (reason: AmeCloseReason | AmeDismissAfterSubmit, committed: TDraft) => void;
	/** When true on open（Numeric fixture）, activate first numeric field. */
	activateFirstNumericOnOpen?: () => boolean;
};

const ROOT_SELECTOR = "[data-ame-root]";

let scrollLockOwner: object | null = null;
let savedScrollY = 0;

function applyScrollLock(owner: object) {
	savedScrollY = window.scrollY;
	scrollLockOwner = owner;
	document.documentElement.classList.add("ame-scroll-lock");
	document.body.classList.add("ame-scroll-lock");
	window.scrollTo(0, savedScrollY);
}

function releaseScrollLock(owner: object) {
	if (scrollLockOwner !== owner) {
		return;
	}
	document.documentElement.classList.remove("ame-scroll-lock");
	document.body.classList.remove("ame-scroll-lock");
	window.scrollTo(0, savedScrollY);
	scrollLockOwner = null;
}

function now() {
	return performance.now();
}

function cloneBag<T extends AmeDraftBag>(source: T): T {
	return structuredClone(source);
}

function isNativeEditableTarget(el: EventTarget | null): boolean {
	return (
		el instanceof HTMLInputElement ||
		el instanceof HTMLSelectElement ||
		el instanceof HTMLTextAreaElement
	);
}

function readNumericString(draft: AmeDraftBag, id: string): string {
	const v = draft[id];
	return typeof v === "string" ? v : "";
}

export function createAdaptiveMobileEditor<TDraft extends AmeDraftBag>(
	root: HTMLElement,
	options: Options<TDraft>,
): AdaptiveMobileEditorController<TDraft> {
	if (!(root instanceof HTMLElement) || !root.matches(ROOT_SELECTOR)) {
		throw new Error("createAdaptiveMobileEditor: root must match [data-ame-root]");
	}

	const pageContent = options.pageContent;
	if (!(pageContent instanceof HTMLElement) || !pageContent.hasAttribute("data-ame-page-content")) {
		throw new Error("createAdaptiveMobileEditor: options.pageContent must be [data-ame-page-content]");
	}

	const adapter = options.adapter;
	const numericFields = [...(options.numericFields ?? [])];
	const numericIds = numericFields.map((f) => f.id);
	const fieldConfig = new Map(numericFields.map((f) => [f.id, f]));

	const underlay = root.querySelector<HTMLElement>("[data-ame-underlay]");
	const shell = root.querySelector<HTMLElement>("[data-ame-shell]");
	if (!underlay || !shell) {
		throw new Error("createAdaptiveMobileEditor: requires [data-ame-underlay] and [data-ame-shell]");
	}

	const keypadHost = root.querySelector<HTMLElement>("[data-ame-layout-keypad]");
	const errorEl = root.querySelector<HTMLElement>("[data-ame-error]");

	let destroyed = false;
	let isOpen = false;
	let lastTrigger: HTMLElement | null = null;
	let lastMode: AmeDiagMode = "full";
	let appliedScrollLock = false;
	let appliedInert = false;
	let activeField: string | null = null;
	let keypadDismissed = false;
	let errorMessage: string | null = null;
	let committed = cloneBag(adapter.getCommitted());
	let draft = cloneBag(committed);
	let pageWasInert = pageContent.inert;

	function density(): string {
		return root.getAttribute("data-ame-density") ?? "";
	}

	function resolveLifecycle(): AmeLifecycle {
		return adapter.lifecycle === "live" ? "live" : "submit";
	}

	function syncLifecycleChrome() {
		const mode = resolveLifecycle();
		root.setAttribute("data-ame-lifecycle", mode);
		root.querySelectorAll<HTMLElement>("[data-ame-cancel]").forEach((el) => {
			const hide = mode === "live";
			el.hidden = hide;
			if (hide) {
				el.setAttribute("hidden", "");
			} else {
				el.removeAttribute("hidden");
			}
		});
		/* Underlay remains a dismiss target；live uses Close so it does not imply rollback. */
		if (underlay) {
			underlay.setAttribute("aria-label", mode === "live" ? "Close" : "Cancel");
		}
	}

	/**
	 * Live mode only: sync draft → committed＋adapter.onCommit immediately.
	 * Invalid drafts still sync（tool shows ?／empty）；fieldErrors drive icons.
	 * Does not dismiss.
	 */
	function applyLiveSyncFromDraft() {
		if (resolveLifecycle() !== "live" || !isOpen || destroyed) {
			return;
		}
		const result = adapter.validate(draft);
		committed = cloneBag(draft);
		adapter.onCommit(committed);
		if (!result.ok) {
			applyValidateFailure(result);
		} else {
			clearFieldErrors();
			clearError();
		}
	}

	function keypadUiEnabled(): boolean {
		return Boolean(keypadHost) && numericIds.length > 0;
	}

	function syncKeypadVisibility() {
		const d = density();
		/* Lab contract: Numeric always shows keypad when open; Mixed only with activeField. */
		const prior =
			isOpen &&
			Boolean(keypadHost) &&
			!keypadDismissed &&
			(d === "numeric" || (d === "mixed" && activeField !== null));
		root.setAttribute("data-ame-keypad-visible", prior ? "true" : "false");
	}

	function syncResetVisibility() {
		const show = adapter.shouldShowReset?.() ?? true;
		root.querySelectorAll<HTMLElement>("[data-ame-reset]").forEach((el) => {
			el.hidden = !show;
			if (show) {
				el.removeAttribute("hidden");
			} else {
				el.setAttribute("hidden", "");
			}
		});
	}

	function hideKeypadOnly() {
		if (!isOpen || destroyed) {
			return;
		}
		keypadDismissed = true;
		syncKeypadVisibility();
	}

	function clearActiveFieldInternal() {
		activeField = null;
		keypadDismissed = false;
		syncKeypadVisibility();
		for (const id of numericIds) {
			syncNumericField(id);
		}
	}

	function clearError() {
		errorMessage = null;
		if (!errorEl) {
			return;
		}
		errorEl.textContent = "";
		errorEl.hidden = true;
		errorEl.setAttribute("hidden", "");
	}

	function clearFieldErrors() {
		root.querySelectorAll<HTMLElement>("[data-ame-field-error]").forEach((icon) => {
			icon.hidden = true;
			icon.setAttribute("hidden", "");
		});
		root.querySelectorAll<HTMLElement>("[data-ame-field-error-text]").forEach((hint) => {
			hint.textContent = "";
			hint.hidden = true;
			hint.setAttribute("hidden", "");
		});
		root.querySelectorAll<HTMLElement>("[data-ame-field], [data-ame-numeric-field], [data-ame-date]").forEach(
			(field) => {
				field.setAttribute("aria-invalid", "false");
			},
		);
	}

	function fieldControl(id: string): HTMLElement | null {
		return (
			root.querySelector<HTMLElement>(`[data-ame-field="${id}"]`) ??
			root.querySelector<HTMLElement>(`[data-ame-numeric-field="${id}"]`) ??
			(id === "date" ? root.querySelector<HTMLElement>("[data-ame-date]") : null)
		);
	}

	function syncFieldErrors(fieldErrors?: Record<string, string>) {
		clearFieldErrors();
		if (!fieldErrors) {
			return;
		}
		for (const [id, message] of Object.entries(fieldErrors)) {
			if (!message) {
				continue;
			}
			const icon = root.querySelector<HTMLElement>(`[data-ame-field-error="${id}"]`);
			const hint = root.querySelector<HTMLElement>(`[data-ame-field-error-text="${id}"]`);
			const control = fieldControl(id);
			if (icon) {
				icon.hidden = false;
				icon.removeAttribute("hidden");
			}
			if (hint) {
				hint.textContent = message;
				hint.hidden = false;
				hint.removeAttribute("hidden");
				if (control && hint.id) {
					control.setAttribute("aria-describedby", hint.id);
				}
			}
			if (control) {
				control.setAttribute("aria-invalid", "true");
			}
		}
	}

	function showError(message: string) {
		if (!message) {
			clearError();
			return;
		}
		errorMessage = message;
		if (!errorEl) {
			return;
		}
		errorEl.textContent = message;
		errorEl.hidden = false;
		errorEl.removeAttribute("hidden");
	}

	function applyValidateFailure(result: Extract<AmeValidateResult, { ok: false }>) {
		const entries = result.fieldErrors
			? Object.entries(result.fieldErrors).filter(([, msg]) => Boolean(msg))
			: [];
		if (entries.length > 0) {
			syncFieldErrors(Object.fromEntries(entries));
			clearError();
			return;
		}
		clearFieldErrors();
		showError(result.message);
	}

	function fieldLabel(id: string): string {
		const field = root.querySelector(`[data-ame-numeric-field="${id}"]`);
		const label =
			field?.querySelector(".ame-setting-label, .ame-numeric-label")?.textContent?.trim() ||
			field?.getAttribute("aria-label")?.split(",")[0]?.trim() ||
			id;
		return label;
	}

	function syncNumericField(id: string) {
		const value = readNumericString(draft, id);
		const empty = value === "";
		const label = fieldLabel(id);
		root.querySelectorAll<HTMLButtonElement>(`[data-ame-numeric-field="${id}"]`).forEach((field) => {
			const valueEl = field.querySelector<HTMLElement>("[data-ame-numeric-value]");
			if (valueEl) {
				valueEl.textContent = empty ? "0" : value;
				valueEl.classList.toggle("ame-numeric-value--placeholder", empty);
			}
			field.setAttribute("aria-label", empty ? `${label}, empty` : `${label}, ${value}`);
			field.setAttribute("data-ame-active", activeField === id ? "true" : "false");
		});
	}

	function syncNumericLive() {
		const liveEls = root.querySelectorAll<HTMLElement>("[data-ame-numeric-live]");
		const id = activeField ?? numericIds[0] ?? "days";
		const label = fieldLabel(id);
		const message = ameNumericLiveMessage(label, readNumericString(draft, id));
		liveEls.forEach((el) => {
			el.textContent = message;
		});
	}

	function syncAllUi() {
		for (const id of numericIds) {
			syncNumericField(id);
		}
		syncNumericLive();
		syncKeypadVisibility();
		syncResetVisibility();
		if (errorMessage) {
			showError(errorMessage);
		} else {
			clearError();
		}
		options.onSyncUi?.(cloneBag(draft));
	}

	function activeFieldElement(id: string): HTMLButtonElement | null {
		const panel =
			density() === "mixed"
				? root.querySelector("[data-ame-mixed-panel]")
				: root.querySelector("[data-ame-numeric-panel]");
		return (
			panel?.querySelector<HTMLButtonElement>(`[data-ame-numeric-field="${id}"]`) ??
			root.querySelector<HTMLButtonElement>(`[data-ame-numeric-field="${id}"]`)
		);
	}

	const ACTIVE_FIELD_SAFE_GAP_PX = 16;
	const ACTIVE_FIELD_SAFE_GAP_MIN_PX = 12;

	function isKeypadBesideForm(field: HTMLElement): boolean {
		if (!keypadHost || keypadHost.getClientRects().length === 0) {
			return false;
		}
		const kr = keypadHost.getBoundingClientRect();
		const fr = field.getBoundingClientRect();
		return kr.left >= fr.right - 1;
	}

	function scrollBodyBy(body: HTMLElement, delta: number) {
		if (delta === 0) {
			return;
		}
		body.scrollTop += delta;
	}

	function ensureActiveFieldInView(id: string) {
		const field = activeFieldElement(id);
		const body = root.querySelector<HTMLElement>("[data-ame-body]");
		if (!field || !body) {
			return;
		}

		window.requestAnimationFrame(() => {
			window.requestAnimationFrame(() => {
				if (!isOpen || destroyed || activeField !== id) {
					return;
				}

				const fieldRect = field.getBoundingClientRect();
				const bodyRect = body.getBoundingClientRect();
				const keypadVisible = root.getAttribute("data-ame-keypad-visible") === "true";

				if (keypadVisible && keypadHost && !isKeypadBesideForm(field)) {
					const keypadTop = keypadHost.getBoundingClientRect().top;
					const gap = ACTIVE_FIELD_SAFE_GAP_PX;
					const limit = keypadTop - gap;
					if (fieldRect.bottom <= limit) {
						return;
					}
					const needed = fieldRect.bottom - limit;
					const minGapLimit = keypadTop - ACTIVE_FIELD_SAFE_GAP_MIN_PX;
					if (fieldRect.bottom <= minGapLimit && needed < 1) {
						return;
					}
					scrollBodyBy(body, needed);
					return;
				}

				if (fieldRect.top < bodyRect.top) {
					scrollBodyBy(body, fieldRect.top - bodyRect.top);
					return;
				}
				if (fieldRect.bottom > bodyRect.bottom) {
					scrollBodyBy(body, fieldRect.bottom - bodyRect.bottom);
				}
			});
		});
	}

	function setActiveField(id: string, focusField: boolean) {
		if (!fieldConfig.has(id)) {
			return;
		}
		activeField = id;
		keypadDismissed = false;
		syncAllUi();
		if (focusField) {
			activeFieldElement(id)?.focus({ preventScroll: true });
		}
		ensureActiveFieldInView(id);
	}

	function mutateNumeric(id: string, next: string) {
		const cfg = fieldConfig.get(id);
		if (!cfg) {
			return;
		}
		const normalized = normalizeAmeNumericAfterEdit(next, cfg.allowEmpty);
		draft = { ...draft, [id]: normalized };
		clearFieldErrors();
		if (
			errorMessage &&
			ameAnyNumericFilled(
				Object.fromEntries(numericIds.map((nid) => [nid, readNumericString(draft, nid)])),
				numericIds,
			)
		) {
			clearError();
		}
		syncNumericField(id);
		syncNumericLive();
		adapter.onDraftChange?.(cloneBag(draft));
		applyLiveSyncFromDraft();
	}

	function applyDigit(digit: string) {
		if (!isOpen || destroyed || !activeField) {
			return;
		}
		const cfg = fieldConfig.get(activeField);
		if (!cfg) {
			return;
		}
		const currentValue = readNumericString(draft, activeField);
		const candidateValue = appendAmeDigit(currentValue, digit, cfg.maxLength);
		if (candidateValue === currentValue) {
			return;
		}
		if (
			adapter.acceptNumericCandidate &&
			!adapter.acceptNumericCandidate({
				fieldId: activeField,
				currentValue,
				candidateValue,
				digit,
				draft: cloneBag(draft),
			})
		) {
			/* Reject digit — keep prior value；Delete／Clear unaffected. */
			return;
		}
		mutateNumeric(activeField, candidateValue);
		setActiveField(activeField, true);
	}

	function applyDelete() {
		if (!isOpen || destroyed || !activeField) {
			return;
		}
		const cfg = fieldConfig.get(activeField);
		if (!cfg) {
			return;
		}
		mutateNumeric(
			activeField,
			normalizeAmeNumericAfterEdit(deleteAmeDigit(readNumericString(draft, activeField)), cfg.allowEmpty),
		);
		setActiveField(activeField, true);
	}

	function applyClear() {
		if (!isOpen || destroyed || !activeField) {
			return;
		}
		const cfg = fieldConfig.get(activeField);
		if (!cfg) {
			return;
		}
		mutateNumeric(activeField, normalizeAmeNumericAfterEdit(clearAmeDigits(), cfg.allowEmpty));
		setActiveField(activeField, true);
	}

	function resetDraftInternal() {
		if (adapter.shouldShowReset && !adapter.shouldShowReset()) {
			return;
		}
		draft = cloneBag(adapter.getResetDraft());
		activeField =
			options.activateFirstNumericOnOpen?.() && numericIds[0] ? numericIds[0] : null;
		/* Numeric Lab fixture keeps Days active after Reset */
		if (density() === "numeric" && numericIds.includes("days")) {
			activeField = "days";
		} else if (density() === "mixed") {
			activeField = null;
		}
		keypadDismissed = false;
		clearError();
		clearFieldErrors();
		syncAllUi();
		adapter.onDraftChange?.(cloneBag(draft));
		applyLiveSyncFromDraft();
	}

	function dismissChrome(reason: AmeCloseReason | AmeDismissAfterSubmit) {
		activeField = null;
		keypadDismissed = false;
		clearError();
		clearFieldErrors();
		syncAllUi();

		isOpen = false;
		root.setAttribute("data-ame-open", "false");
		root.setAttribute("aria-hidden", "true");
		root.hidden = true;
		root.setAttribute("hidden", "");

		shell.setAttribute("aria-hidden", "true");
		shell.inert = true;
		shell.setAttribute("inert", "");

		if (appliedInert) {
			pageContent.inert = pageWasInert;
			appliedInert = false;
		}
		if (appliedScrollLock) {
			releaseScrollLock(api);
			appliedScrollLock = false;
		}

		const returnTarget = lastTrigger;
		const committedSnapshot = cloneBag(committed);
		window.requestAnimationFrame(() => {
			if (returnTarget && typeof returnTarget.focus === "function") {
				returnTarget.focus({ preventScroll: true });
			}
			options.onClose?.(reason, committedSnapshot);
		});
	}

	const onKeyDown = (event: KeyboardEvent) => {
		if (!isOpen || destroyed) {
			return;
		}
		if (event.key === "Escape") {
			event.preventDefault();
			api.close("escape");
			return;
		}

		if (
			keypadUiEnabled() &&
			activeField &&
			!isNativeEditableTarget(event.target) &&
			!isNativeEditableTarget(document.activeElement)
		) {
			if (/^[0-9]$/.test(event.key)) {
				event.preventDefault();
				applyDigit(event.key);
				return;
			}
			if (event.key === "Backspace" || event.key === "Delete") {
				event.preventDefault();
				applyDelete();
				return;
			}
		}

		if (event.key !== "Tab") {
			return;
		}
		const focusables = getFocusable(shell);
		if (focusables.length === 0) {
			event.preventDefault();
			shell.focus({ preventScroll: true });
			return;
		}
		const first = focusables[0];
		const last = focusables[focusables.length - 1];
		const active = document.activeElement;
		if (event.shiftKey) {
			if (active === first || active === shell || !shell.contains(active)) {
				event.preventDefault();
				last.focus({ preventScroll: true });
			}
			return;
		}
		if (active === last || !shell.contains(active)) {
			event.preventDefault();
			first.focus({ preventScroll: true });
		}
	};

	const onShellClick = (event: Event) => {
		const target = event.target;
		if (!(target instanceof Element)) {
			return;
		}

		const resetEl = target.closest<HTMLElement>("[data-ame-reset]");
		if (resetEl && root.contains(resetEl)) {
			event.preventDefault();
			resetDraftInternal();
			return;
		}

		const keyEl = target.closest<HTMLElement>("[data-ame-key]");
		if (keyEl && root.contains(keyEl)) {
			event.preventDefault();
			const key = keyEl.getAttribute("data-ame-key");
			if (!key) {
				return;
			}
			if (key === "hide") {
				hideKeypadOnly();
				return;
			}
			if (!activeField && numericIds[0]) {
				setActiveField(numericIds.includes("days") ? "days" : numericIds[0], false);
			}
			if (key === "delete") {
				applyDelete();
				return;
			}
			if (key === "clear") {
				applyClear();
				return;
			}
			if (/^[0-9]$/.test(key)) {
				applyDigit(key);
			}
			return;
		}

		const fieldEl = target.closest<HTMLElement>("[data-ame-numeric-field]");
		if (fieldEl && root.contains(fieldEl)) {
			event.preventDefault();
			const id = fieldEl.getAttribute("data-ame-numeric-field");
			if (id && fieldConfig.has(id)) {
				setActiveField(id, true);
			}
			return;
		}

		const submitEl = target.closest<HTMLElement>("[data-ame-submit]");
		if (submitEl && root.contains(submitEl)) {
			event.preventDefault();
			api.submit();
			return;
		}

		const closer = target.closest<HTMLElement>("[data-ame-close]");
		if (!closer || !root.contains(closer)) {
			return;
		}
		event.preventDefault();
		const reasonAttr = closer.getAttribute("data-ame-close");
		/* C2: close never commits — ignore legacy data-ame-close="done" as dismiss cancel */
		if (reasonAttr === "done") {
			api.submit();
			return;
		}
		api.close("cancel");
	};

	const onShellFocusIn = (event: FocusEvent) => {
		if (!isOpen || destroyed) {
			return;
		}
		if (isNativeEditableTarget(event.target)) {
			clearActiveFieldInternal();
			syncNumericLive();
			options.onSyncUi?.(cloneBag(draft));
		}
	};

	const api: AdaptiveMobileEditorController<TDraft> = {
		open(trigger?: HTMLElement, openOptions?: { mode?: AmeDiagMode }) {
			const empty: AmeOpenTiming = {
				openStartMs: now(),
				displayWrittenMs: now(),
				scrollLockAppliedMs: null,
				inertAppliedMs: null,
				focusCalledMs: null,
			};
			if (destroyed || isOpen) {
				if (trigger) {
					lastTrigger = trigger;
				}
				return empty;
			}

			const mode: AmeDiagMode = openOptions?.mode ?? "full";
			lastMode = mode;
			if (trigger) {
				lastTrigger = trigger;
			}

			const openStartMs = now();
			committed = cloneBag(adapter.getCommitted());
			draft = cloneBag(
				adapter.createOpenDraft ? adapter.createOpenDraft(committed) : committed,
			);
			activeField = null;
			keypadDismissed = false;
			clearError();
			clearFieldErrors();
			isOpen = true;
			appliedScrollLock = false;
			appliedInert = false;

			root.hidden = false;
			root.removeAttribute("hidden");
			root.setAttribute("data-ame-open", "true");
			root.setAttribute("data-ame-diag-mode", mode);
			root.setAttribute("aria-hidden", "false");
			syncLifecycleChrome();

			shell.removeAttribute("inert");
			shell.inert = false;
			shell.setAttribute("aria-hidden", "false");

			syncAllUi();
			syncResetVisibility();

			const displayWrittenMs = now();
			let scrollLockAppliedMs: number | null = null;
			let inertAppliedMs: number | null = null;
			let focusCalledMs: number | null = null;

			if (mode === "lock" || mode === "inert" || mode === "full") {
				applyScrollLock(api);
				appliedScrollLock = true;
				scrollLockAppliedMs = now();
			}

			if (mode === "inert" || mode === "full") {
				pageWasInert = pageContent.inert;
				pageContent.inert = true;
				appliedInert = true;
				inertAppliedMs = now();
			}

			if (mode === "full") {
				if (options.activateFirstNumericOnOpen?.() && numericIds[0]) {
					const first =
						density() === "numeric" && numericIds.includes("days") ? "days" : numericIds[0];
					setActiveField(first, true);
				} else if (density() === "numeric" && numericIds.includes("days")) {
					setActiveField("days", true);
				} else {
					shell.focus({ preventScroll: true });
				}
				focusCalledMs = now();
			}

			const timing: AmeOpenTiming = {
				openStartMs,
				displayWrittenMs,
				scrollLockAppliedMs,
				inertAppliedMs,
				focusCalledMs,
			};
			options.onOpen?.(timing, mode);
			return timing;
		},

		submit() {
			if (destroyed || !isOpen) {
				return false;
			}
			/* Live：Done = dismiss only；page state already synced via applyLiveSyncFromDraft. */
			if (resolveLifecycle() === "live") {
				clearFieldErrors();
				clearError();
				committed = cloneBag(draft);
				dismissChrome("submit");
				return true;
			}
			const result = adapter.validate(draft);
			if (!result.ok) {
				applyValidateFailure(result);
				options.onSyncUi?.(cloneBag(draft));
				return false;
			}
			clearFieldErrors();
			clearError();
			committed = cloneBag(draft);
			adapter.onCommit(committed);
			dismissChrome("submit");
			return true;
		},

		close(reason: AmeCloseReason = "api") {
			if (destroyed || !isOpen) {
				return;
			}
			if (resolveLifecycle() === "live") {
				/* Live：dismiss only — do not rollback already-applied page state. */
				dismissChrome(reason);
				return;
			}
			/* submit：Dismiss only — rollback draft; never validate／onCommit */
			draft = cloneBag(committed);
			dismissChrome(reason);
		},

		destroy() {
			if (destroyed) {
				return;
			}
			if (isOpen) {
				api.close("api");
			}
			destroyed = true;
			document.removeEventListener("keydown", onKeyDown, true);
			root.removeEventListener("click", onShellClick);
			root.removeEventListener("focusin", onShellFocusIn);
			if (appliedScrollLock) {
				releaseScrollLock(api);
			}
			if (appliedInert) {
				pageContent.inert = pageWasInert;
			}
		},

		isOpen() {
			return isOpen && !destroyed;
		},

		getRoot() {
			return root;
		},

		getLastMode() {
			return lastMode;
		},

		getCommitted() {
			return cloneBag(committed);
		},

		getDraft() {
			return cloneBag(draft);
		},

		patchDraft(partial: Partial<TDraft>) {
			if (!isOpen || destroyed) {
				return;
			}
			draft = { ...draft, ...partial };
			clearFieldErrors();
			syncAllUi();
			adapter.onDraftChange?.(cloneBag(draft));
			applyLiveSyncFromDraft();
		},

		clearActiveField() {
			if (!isOpen || destroyed) {
				return;
			}
			clearActiveFieldInternal();
			options.onSyncUi?.(cloneBag(draft));
		},

		resetDraft() {
			if (!isOpen || destroyed) {
				return;
			}
			resetDraftInternal();
		},
	};

	root.setAttribute("data-ame-open", "false");
	root.setAttribute("data-ame-diag-mode", "full");
	shell.inert = true;
	shell.setAttribute("inert", "");
	shell.setAttribute("tabindex", shell.getAttribute("tabindex") ?? "-1");
	syncLifecycleChrome();
	syncAllUi();
	syncResetVisibility();

	document.addEventListener("keydown", onKeyDown, true);
	root.addEventListener("click", onShellClick);
	root.addEventListener("focusin", onShellFocusIn);

	return api;
}

function getFocusable(scope: HTMLElement): HTMLElement[] {
	const nodes = scope.querySelectorAll<HTMLElement>(
		'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
	);
	return [...nodes].filter((el) => {
		if (el.hasAttribute("disabled") || el.tabIndex < 0) {
			return false;
		}
		if (el.hidden || el.getAttribute("aria-hidden") === "true") {
			return false;
		}
		return el.getClientRects().length > 0;
	});
}
