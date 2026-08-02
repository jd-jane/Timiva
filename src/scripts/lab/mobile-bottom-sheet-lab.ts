/**
 * Tool Component Lab — Mobile Bottom Sheet boot（Legacy／Historical）.
 * Superseded for new-tool adoption by Adaptive Mobile Editor（AME）.
 * Do not use for new formal tools. Do not delete without dedicated consumer audit／Owner Gate.
 * Lazy-creates controllers on first open (faster interactive).
 * Simple click → open. Fixtures must not write panel geometry.
 */

import {
	createMobileBottomSheet,
	MobileBottomSheetRegistry,
	type CloseReason,
	type MobileBottomSheetController,
} from "../mobile-bottom-sheet-controller";

type HostKey =
	| "composition-spike"
	| "focus-spike"
	| "short"
	| "medium"
	| "long"
	| "keyboard"
	| "regions-none"
	| "regions-header"
	| "regions-footer"
	| "regions-both";

const controllers = new Map<string, MobileBottomSheetController>();
const SPIKE_KEYS = new Set(["composition-spike", "focus-spike"]);
const HOST_KEYS: HostKey[] = [
	"composition-spike",
	"focus-spike",
	"short",
	"medium",
	"long",
	"keyboard",
	"regions-none",
	"regions-header",
	"regions-footer",
	"regions-both",
];

let labInitialized = false;
let diagReady = false;

function setLabStatus(message: string) {
	const el = document.querySelector<HTMLElement>("[data-msb-lab-status]");
	if (el) {
		el.textContent = message;
	}
}

function wireCloseButtons(host: HTMLElement, api: MobileBottomSheetController) {
	if (host.hasAttribute("data-msb-lab-close-bound")) {
		return;
	}
	host.setAttribute("data-msb-lab-close-bound", "true");

	host.querySelectorAll<HTMLElement>("[data-msb-close]").forEach((btn) => {
		btn.addEventListener("click", (event) => {
			event.preventDefault();
			const reason = (btn.getAttribute("data-msb-close") || "action") as CloseReason;
			api.close(reason === "overlay" || reason === "escape" || reason === "api" ? reason : "action");
		});
	});
}

/** Medium／Keyboard only — never on Focus／Composition Spike. */
function wireKeyboardAutoAdvance(host: HTMLElement) {
	if (host.hasAttribute("data-msb-lab-advance-bound")) {
		return;
	}
	host.setAttribute("data-msb-lab-advance-bound", "true");

	const inputs = [...host.querySelectorAll<HTMLInputElement>("[data-msb-kb-field]")];
	if (inputs.length === 0) {
		return;
	}

	inputs.forEach((input, index) => {
		input.addEventListener("input", () => {
			const digits = input.value.replace(/\D/g, "").slice(0, 2);
			if (input.value !== digits) {
				input.value = digits;
			}
			if (digits.length >= 2 && index < inputs.length - 1) {
				inputs[index + 1].focus({ preventScroll: true });
			}
		});

		input.addEventListener("keydown", (event) => {
			if (event.key === "Backspace" && input.value.length === 0 && index > 0) {
				inputs[index - 1].focus({ preventScroll: true });
			}
		});
	});
}

function rectLine(label: string, el: Element | null): string {
	if (!(el instanceof HTMLElement)) {
		return `${label}: (missing)`;
	}
	const r = el.getBoundingClientRect();
	return `${label}: t=${Math.round(r.top)} l=${Math.round(r.left)} w=${Math.round(r.width)} h=${Math.round(r.height)}`;
}

function updateSpikeDiagnostics(activeHost: HTMLElement | null) {
	const pre = document.querySelector<HTMLElement>("[data-msb-lab-diag-pre]");
	if (!pre) {
		return;
	}

	if (!activeHost || !activeHost.matches("[data-msb-host]")) {
		pre.textContent = "Open Composition or Focus Spike to populate.";
		return;
	}

	const vv = window.visualViewport;
	const layer = activeHost.querySelector("[data-msb-vv-layer]");
	const sheet = activeHost.querySelector(".msb-sheet");
	const body = activeHost.querySelector('[data-msb-region="body"]');
	const focused = document.activeElement;
	const focusedLabel =
		focused instanceof HTMLElement
			? focused.getAttribute("aria-label") || focused.tagName.toLowerCase()
			: "(none)";

	const lines = [
		`host: ${activeHost.getAttribute("data-msb-lab") ?? "?"}`,
		`open: ${activeHost.getAttribute("data-msb-open")}`,
		`keyboard: ${activeHost.getAttribute("data-msb-keyboard")}`,
		`lastEvent: ${activeHost.getAttribute("data-msb-last-event") ?? "?"}`,
		`innerHeight: ${window.innerHeight}`,
		`vv.height: ${vv?.height ?? "(n/a)"}`,
		`vv.offsetTop: ${vv?.offsetTop ?? "(n/a)"}`,
		`--msb-vv-height: ${activeHost.style.getPropertyValue("--msb-vv-height") || "(css)"}`,
		`--msb-vv-offset-top: ${activeHost.style.getPropertyValue("--msb-vv-offset-top") || "(css)"}`,
		`--msb-keyboard-inset (diag only): ${activeHost.style.getPropertyValue("--msb-keyboard-inset") || "(css)"}`,
		rectLine("vvLayer", layer),
		rectLine("sheet", sheet),
		`body.scrollTop: ${body instanceof HTMLElement ? body.scrollTop : "(n/a)"}`,
		`window.scrollY: ${window.scrollY}`,
		`focused: ${focusedLabel}`,
		`scrollLock: ${document.body.classList.contains("msb-scroll-lock") ? "on" : "off"}`,
	];

	pre.textContent = lines.join("\n");
}

function onDiagFocusEvent() {
	const openHost = document.querySelector<HTMLElement>(
		'[data-msb-host][data-msb-open="true"][data-msb-lab="composition-spike"], [data-msb-host][data-msb-open="true"][data-msb-lab="focus-spike"]',
	);
	updateSpikeDiagnostics(openHost);
}

function initSpikeDiagnostics() {
	if (diagReady) {
		return;
	}
	document.addEventListener("focusin", onDiagFocusEvent, true);
	document.addEventListener("focusout", onDiagFocusEvent, true);
	onDiagFocusEvent();
	diagReady = true;
}

function ensureController(key: string): MobileBottomSheetController | null {
	const existing = controllers.get(key);
	if (existing) {
		return existing;
	}

	const host = document.querySelector<HTMLElement>(`[data-msb-host][data-msb-lab="${key}"]`);
	if (!host) {
		return null;
	}

	const api = createMobileBottomSheet(host);
	controllers.set(key, api);
	wireCloseButtons(host, api);
	if (!SPIKE_KEYS.has(key) && (key === "keyboard" || key === "medium")) {
		wireKeyboardAutoAdvance(host);
	}
	return api;
}

function onLabOpenClick(event: Event) {
	const target = event.target;
	if (!(target instanceof Element)) {
		return;
	}
	const trigger = target.closest<HTMLElement>("[data-msb-lab-open]");
	if (!trigger) {
		return;
	}
	const key = trigger.getAttribute("data-msb-lab-open");
	if (!key) {
		return;
	}

	/* Instant feedback — proves module click fired. */
	setLabStatus(`tap ${key}…`);
	openByKey(key, trigger);
}

function openByKey(key: string, trigger: HTMLElement) {
	const api = ensureController(key);
	if (!api) {
		setLabStatus(`missing host: ${key}`);
		return;
	}
	api.open(trigger);
	setLabStatus(api.isOpen() ? `open ${key}` : `blocked ${key}`);
}

function drainPendingOpen() {
	const pending = (
		window as Window & {
			__msbLabPending?: { key: string; trigger: HTMLElement; t: number } | null;
		}
	).__msbLabPending;
	if (!pending?.key || !(pending.trigger instanceof HTMLElement)) {
		return;
	}
	(
		window as Window & {
			__msbLabPending?: { key: string; trigger: HTMLElement; t: number } | null;
		}
	).__msbLabPending = null;
	const waited = Date.now() - (pending.t || Date.now());
	setLabStatus(`js ready (+${waited}ms) — opening ${pending.key}`);
	openByKey(pending.key, pending.trigger);
}

function resetHosts() {
	document.querySelectorAll<HTMLElement>("[data-msb-host]").forEach((host) => {
		host.hidden = true;
		host.setAttribute("hidden", "");
		host.setAttribute("data-msb-open", "false");
		host.removeAttribute("data-msb-lab-close-bound");
		host.removeAttribute("data-msb-lab-advance-bound");
	});
	document.documentElement.classList.remove("msb-scroll-lock", "msb-sheet-open");
	document.body.classList.remove("msb-scroll-lock", "msb-sheet-open");
}

function initLab() {
	MobileBottomSheetRegistry.destroyAll();
	controllers.clear();
	resetHosts();

	/* Warm only spike hosts so first Composition/Focus tap skips create cost. */
	for (const key of HOST_KEYS) {
		if (SPIKE_KEYS.has(key)) {
			ensureController(key);
		}
	}

	document.removeEventListener("click", onLabOpenClick);
	document.addEventListener("click", onLabOpenClick);
	labInitialized = true;

	setLabStatus("ready — tap once");
	initSpikeDiagnostics();
	drainPendingOpen();
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", initLab, { once: true });
} else {
	initLab();
}

if (import.meta.hot) {
	import.meta.hot.dispose(() => {
		MobileBottomSheetRegistry.destroyAll();
		controllers.clear();
		document.removeEventListener("click", onLabOpenClick);
		document.removeEventListener("focusin", onDiagFocusEvent, true);
		document.removeEventListener("focusout", onDiagFocusEvent, true);
		diagReady = false;
		labInitialized = false;
		document.documentElement.classList.remove("msb-scroll-lock", "msb-sheet-open");
		document.body.classList.remove("msb-scroll-lock", "msb-sheet-open");
	});
}
