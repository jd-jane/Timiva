/**
 * Tool Component Lab — Adaptive Mobile Editor boot（B7）.
 * Eager init. Mixed／Numeric draft via Lab adapter — shared controller is tool-agnostic.
 * Orientation attribute is diagnostic only — never opens／closes／remounts.
 */

import {
	createAdaptiveMobileEditor,
	type AdaptiveMobileEditorController,
	type AmeDiagMode,
	type AmeOpenTiming,
} from "../adaptive-mobile-editor-controller";
import {
	AME_MIXED_NUMERIC_FIELDS,
	AME_MIXED_RESET_DEFAULTS,
	bindAmeMixedLabInteractions,
	cloneAmeMixedDraft,
	mergeAmeMixedDraft,
	syncAmeMixedLabUi,
	validateAmeMixedDraft,
	type AmeMixedDraft,
} from "./ame-mixed-lab-adapter";

type AmeVisual = "flat" | "current";
type AmeDensity = "short" | "medium" | "long" | "numeric" | "mixed";

let api: AdaptiveMobileEditorController<AmeMixedDraft> | null = null;
let rootEl: HTMLElement | null = null;
let unbindMixed: (() => void) | null = null;
let labCommitted = mergeAmeMixedDraft({ note: "ready", days: "" });

function setStatus(message: string) {
	const el = document.querySelector<HTMLElement>("[data-ame-lab-status]");
	if (el) {
		el.textContent = message;
	}
}

function formatUnit(value: string): string {
	return value === "" ? "—" : value;
}

function syncCommittedPage(committed: AmeMixedDraft) {
	const daysEl = document.querySelector<HTMLElement>("[data-ame-lab-committed-days]");
	if (daysEl) {
		daysEl.textContent = committed.days === "" ? "—" : committed.days;
	}
	const summary = document.querySelector<HTMLElement>("[data-ame-lab-committed-summary]");
	if (!summary) {
		return;
	}
	const dir = committed.direction === "minus" ? "−" : "+";
	const flags = [
		committed.checks.alpha ? "α" : null,
		committed.checks.beta ? "β" : null,
		committed.checks.gamma ? "γ" : null,
	]
		.filter(Boolean)
		.join("");
	summary.textContent = [
		dir,
		committed.date || "no date",
		committed.unitPreset,
		`Y${formatUnit(committed.years)} M${formatUnit(committed.months)} W${formatUnit(committed.weeks)} D${formatUnit(committed.days)}`,
		committed.radioChoice,
		flags || "no flags",
		committed.toggleOn ? "notify on" : "notify off",
	].join(" · ");
}

function readMode(): AmeDiagMode {
	const checked = document.querySelector<HTMLInputElement>('input[name="ame-diag-mode"]:checked');
	const v = checked?.value;
	if (v === "display" || v === "lock" || v === "inert" || v === "full") {
		return v;
	}
	return "full";
}

function readVisual(): AmeVisual {
	const checked = document.querySelector<HTMLInputElement>('input[name="ame-diag-visual"]:checked');
	return checked?.value === "flat" ? "flat" : "current";
}

function readDensity(): AmeDensity {
	const checked = document.querySelector<HTMLInputElement>('input[name="ame-diag-density"]:checked');
	const v = checked?.value;
	if (v === "medium" || v === "long" || v === "short" || v === "numeric" || v === "mixed") {
		return v;
	}
	return "mixed";
}

function applyVisual(visual: AmeVisual) {
	if (!rootEl) {
		return;
	}
	rootEl.setAttribute("data-ame-visual", visual);
}

function applyDensity(density: AmeDensity) {
	if (!rootEl) {
		return;
	}
	rootEl.setAttribute("data-ame-density", density);

	const layoutFixture = density === "short" || density === "medium" || density === "long";
	rootEl.querySelectorAll<HTMLElement>("[data-ame-fixture]").forEach((node) => {
		const match = layoutFixture && node.getAttribute("data-ame-fixture") === density;
		node.hidden = !match;
		if (match) {
			node.removeAttribute("hidden");
		} else {
			node.setAttribute("hidden", "");
		}
	});
}

function orientationLabel(): string {
	return window.matchMedia("(orientation: landscape)").matches ? "landscape" : "portrait";
}

function syncOrientationAttr() {
	if (!rootEl) {
		return;
	}
	rootEl.setAttribute("data-ame-orientation", orientationLabel());
}

function activeLabel(): string {
	const el = document.activeElement;
	if (!(el instanceof HTMLElement)) {
		return "(none)";
	}
	if (el.getAttribute("data-ame-numeric-field") !== null) {
		return `numeric:${el.getAttribute("data-ame-numeric-field")}`;
	}
	if (el.getAttribute("data-ame-date") !== null) {
		return "date";
	}
	if (el.getAttribute("data-ame-select") !== null) {
		return "select";
	}
	return el.getAttribute("data-ame-shell") !== null
		? "shell"
		: el.getAttribute("data-ame-lab-open") !== null
			? "trigger"
			: el.tagName.toLowerCase();
}

function renderDiag(lines: string[]) {
	const pre = document.querySelector<HTMLElement>("[data-ame-lab-diag-pre]");
	if (pre) {
		pre.textContent = lines.join("\n");
	}
}

function setDiagControlsEnabled(enabled: boolean) {
	document.querySelectorAll<HTMLInputElement>("[data-ame-diag-control]").forEach((input) => {
		input.disabled = !enabled;
	});
}

function initLab() {
	const pageContent = document.querySelector<HTMLElement>("[data-ame-page-content]");
	const root = document.querySelector<HTMLElement>("[data-ame-root]");
	const trigger = document.querySelector<HTMLButtonElement>("[data-ame-lab-open]");

	if (!pageContent || !root || !trigger) {
		setStatus("boot error: missing lab nodes");
		return;
	}

	rootEl = root;
	applyVisual(readVisual());
	applyDensity(readDensity());
	syncOrientationAttr();

	const orientMq = window.matchMedia("(orientation: landscape)");
	const onOrientChange = () => {
		syncOrientationAttr();
	};
	if (typeof orientMq.addEventListener === "function") {
		orientMq.addEventListener("change", onOrientChange);
	} else if (typeof orientMq.addListener === "function") {
		orientMq.addListener(onOrientChange);
	}

	api = createAdaptiveMobileEditor<AmeMixedDraft>(root, {
		pageContent,
		numericFields: AME_MIXED_NUMERIC_FIELDS,
		adapter: {
			getCommitted: () => cloneAmeMixedDraft(labCommitted),
			getResetDraft: () => cloneAmeMixedDraft(AME_MIXED_RESET_DEFAULTS),
			createOpenDraft: (committed) => cloneAmeMixedDraft(committed),
			validate: (draft) => validateAmeMixedDraft(draft, root.getAttribute("data-ame-density") ?? ""),
			onCommit: (committed) => {
				labCommitted = cloneAmeMixedDraft({ ...committed, note: "applied" });
			},
			shouldShowReset: () => {
				const d = root.getAttribute("data-ame-density");
				return d === "mixed" || d === "numeric";
			},
		},
		onSyncUi: (draft) => {
			syncAmeMixedLabUi(root, draft);
		},
		onOpen: () => {
			setDiagControlsEnabled(false);
		},
		onClose: (reason, committed) => {
			setDiagControlsEnabled(true);
			syncCommittedPage(committed);
			const draftNote =
				reason === "submit"
					? `committed days=${committed.days || "(empty)"} · ${committed.direction}/${committed.unitPreset}`
					: "draft discarded";
			setStatus(`closed:${reason} · ${draftNote}`);
		},
	});

	unbindMixed = bindAmeMixedLabInteractions(root, {
		getDraft: () => api!.getDraft(),
		patchDraft: (partial) => api!.patchDraft(partial),
		clearActiveField: () => api!.clearActiveField(),
		isOpen: () => Boolean(api?.isOpen()),
	});

	syncCommittedPage(api.getCommitted());

	document.querySelectorAll<HTMLInputElement>("[data-ame-diag-control]").forEach((input) => {
		input.addEventListener("change", () => {
			if (api?.isOpen()) {
				return;
			}
			applyVisual(readVisual());
			applyDensity(readDensity());
			setStatus(`fixture ${readDensity()} · mode ${readMode()} · ${readVisual()}`);
		});
	});

	trigger.addEventListener("click", (event) => {
		event.preventDefault();
		if (trigger.disabled) {
			return;
		}

		const clickReceivedMs = performance.now();
		const mode = readMode();
		const visual = readVisual();
		const density = readDensity();
		applyVisual(visual);
		applyDensity(density);
		syncOrientationAttr();

		setStatus(`opening ${density}/${mode}/${visual}…`);

		const timing: AmeOpenTiming = api?.open(trigger, { mode }) ?? {
			openStartMs: clickReceivedMs,
			displayWrittenMs: clickReceivedMs,
			scrollLockAppliedMs: null,
			inertAppliedMs: null,
			focusCalledMs: null,
		};

		const linesBase = () => [
			`fixture: ${density}`,
			`mode: ${mode}`,
			`visual: ${visual}`,
			`orientation: ${orientationLabel()}`,
			`visibilityState: ${document.visibilityState}`,
			`activeElement: ${activeLabel()}`,
			`draft.days: ${api?.getDraft().days || "(empty)"}`,
			`committed.days: ${api?.getCommitted().days || "(empty)"}`,
			`click received: 0.0ms`,
			`open start: ${(timing.openStartMs - clickReceivedMs).toFixed(1)}ms`,
			`display written: ${(timing.displayWrittenMs - clickReceivedMs).toFixed(1)}ms`,
			`scroll lock: ${
				timing.scrollLockAppliedMs === null
					? "skipped"
					: `${(timing.scrollLockAppliedMs - clickReceivedMs).toFixed(1)}ms`
			}`,
			`inert: ${
				timing.inertAppliedMs === null
					? "skipped"
					: `${(timing.inertAppliedMs - clickReceivedMs).toFixed(1)}ms`
			}`,
			`focus: ${
				timing.focusCalledMs === null
					? "skipped"
					: `${(timing.focusCalledMs - clickReceivedMs).toFixed(1)}ms`
			}`,
		];

		renderDiag([...linesBase(), "raf1: …", "raf2: …"]);

		window.requestAnimationFrame(() => {
			const raf1 = performance.now() - clickReceivedMs;
			window.requestAnimationFrame(() => {
				const raf2 = performance.now() - clickReceivedMs;
				renderDiag([
					...linesBase(),
					`raf1: ${raf1.toFixed(1)}ms`,
					`raf2: ${raf2.toFixed(1)}ms`,
					`data-ame-open: ${root.getAttribute("data-ame-open")}`,
					`data-ame-density: ${root.getAttribute("data-ame-density")}`,
					`root.hidden: ${String(root.hidden)}`,
				]);
				setStatus(api?.isOpen() ? `open ${density}/${mode}/${visual}` : "open blocked");
			});
		});
	});

	trigger.disabled = false;
	trigger.removeAttribute("disabled");
	trigger.setAttribute("data-ame-trigger-ready", "true");
	setStatus("ready — tap once");
	renderDiag(["Pick Mixed fixture while closed, then tap Open once."]);

	window.addEventListener(
		"pagehide",
		() => {
			unbindMixed?.();
			unbindMixed = null;
		},
		{ once: true },
	);
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", initLab, { once: true });
} else {
	initLab();
}
