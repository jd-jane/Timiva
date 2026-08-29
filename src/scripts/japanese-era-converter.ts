/**
 * Japanese Era Converter client script.
 * B1A: desktop drawer collapse / expand
 * B2B: Desktop live interaction — evaluate／format SSOT
 * B2C: AME live adapter — same evaluate／format；shared keypad；no rollback Cancel
 */

import { getEra } from "../lib/japaneseEraConverterData";
import {
	applyYearInputInsert,
	capYearInput,
	createInitialDesktopState,
	ERA_INPUT_MAX_DIGITS,
	evaluateDesktopState,
	GREGORIAN_INPUT_MAX_DIGITS,
	resetDesktopState,
	setDesktopEraId,
	setEraYearRaw,
	setGregorianRaw,
	switchDesktopMode,
	type JecDesktopState,
} from "../lib/japaneseEraConverterDesktopState";
import type { JecEvaluation } from "../lib/japaneseEraConverterEvaluate";
import {
	formatInvalidHint,
	formatJapaneseEraResult,
	type JecFormatLocale,
} from "../lib/japaneseEraConverterFormat";
import { createAdaptiveMobileEditor } from "./adaptive-mobile-editor-controller";
import {
	acceptJecAmeNumericCandidate,
	bindJecAmeInteractions,
	cloneJecAmeDraft,
	draftFromState,
	jecAmeResetDraft,
	JEC_AME_NUMERIC_FIELDS,
	stateFromDraft,
	syncJecAmeUi,
	validateJecAmeDraft,
	type JecAmeDraft,
} from "./japanese-era-converter-ame-adapter";
import { init as initResultSummary, update as updateResultSummary } from "./result-summary-controller";

type VisualFixture =
	| "initial"
	| "normal"
	| "gregorian"
	| "transition"
	| "transition-heisei"
	| "partial"
	| "future"
	| "era";

type ResultKind = "single" | "transition";
type AmeVisual = "gregorian" | "era";

const ameSessions = new WeakMap<HTMLElement, { destroy: () => void }>();

const FIXTURES: VisualFixture[] = [
	"initial",
	"normal",
	"gregorian",
	"transition",
	"transition-heisei",
	"partial",
	"future",
	"era",
];

function isFixture(value: string): value is VisualFixture {
	return (FIXTURES as string[]).includes(value);
}

function rsLayout(root: HTMLElement): string {
	return (
		root.querySelector("[data-result-summary]")?.getAttribute("data-rs-layout") ||
		"desktop"
	);
}

function readLocale(root: HTMLElement): JecFormatLocale {
	return root.getAttribute("data-jecv2-locale") === "zh" ? "zh" : "en";
}

function portraitSupport(desktop: string): string {
	return desktop
		.split(" / ")
		.map((part) => part.replace(/ /g, "\u00a0"))
		.join("\n");
}

function splitDualPrimary(text: string): [string, string] | null {
	const zh = text.split("｜").map((part) => part.replace(/\n/g, "").trim());
	if (zh.length === 2 && zh[0] && zh[1]) {
		return [zh[0], zh[1]];
	}

	const en = text.split(" | ").map((part) => part.replace(/\n/g, "").trim());
	if (en.length === 2 && en[0] && en[1]) {
		return [en[0], en[1]];
	}

	return null;
}

/**
 * Transition 主結果：兩個年號之間用 tool-owned 線條，不用 ｜／| 文字。
 * 寫入公開 [data-rs-value="primary"] 內容槽；不改 shared ResultSummary、不選 .rs-*。
 */
function decorateTransitionPrimary(resultRoot: HTMLElement, left: string, right: string): void {
	const slot = resultRoot.querySelector<HTMLElement>('[data-rs-value="primary"]');
	if (!slot) {
		return;
	}

	const wrap = document.createElement("span");
	wrap.className = "jecv2-dual-primary";
	wrap.setAttribute("aria-hidden", "true");

	const leftEl = document.createElement("span");
	leftEl.className = "jecv2-dual-primary-part";
	leftEl.textContent = left;

	const rule = document.createElement("span");
	rule.className = "jecv2-dual-primary-rule";

	const rightEl = document.createElement("span");
	rightEl.className = "jecv2-dual-primary-part";
	rightEl.textContent = right;

	wrap.append(leftEl, rule, rightEl);
	slot.replaceChildren(wrap);
}

function applyResultKind(root: HTMLElement, kind: ResultKind): void {
	root.setAttribute("data-jecv2-result-kind", kind);
}

function applyResult(
	root: HTMLElement,
	kind: ResultKind,
	primary: string,
	support: string | null,
	assumption: boolean,
	assumptionNote: string | null,
): void {
	applyResultKind(root, kind);

	const resultRoot = root.querySelector<HTMLElement>("[data-result-summary]");
	const dual = kind === "transition" ? splitDualPrimary(primary) : null;
	if (resultRoot) {
		updateResultSummary(resultRoot, {
			content: "textual",
			primary: {
				text: dual ? `${dual[0]} ${dual[1]}` : primary,
				ariaLabel: dual ? `${dual[0]} ${dual[1]}` : undefined,
			},
			weekday: null,
			support,
		});
		if (dual) {
			decorateTransitionPrimary(resultRoot, dual[0], dual[1]);
		}
	}

	const note = root.querySelector<HTMLElement>("[data-jecv2-assumption]");
	const noteText = root.querySelector<HTMLElement>("[data-jecv2-assumption-text]");
	if (note) {
		note.hidden = !assumption;
	}
	if (noteText && assumptionNote) {
		noteText.textContent = assumptionNote;
	}

	root.setAttribute("data-jecv2-fixture", primary === "?" ? "initial" : "live");
}

function setNumericPreview(el: HTMLElement | null, value: string): void {
	if (!el) {
		return;
	}

	el.textContent = value;
	el.classList.toggle("ame-numeric-value--placeholder", value.length === 0);
}

function applyInputMode(root: HTMLElement, mode: "gregorian" | "era"): void {
	root.setAttribute("data-jecv2-input-mode", mode);
	const gregorian = root.querySelector<HTMLElement>("[data-jecv2-desktop-gregorian]");
	const era = root.querySelector<HTMLElement>("[data-jecv2-desktop-era]");
	const switchToEra = root.querySelector<HTMLElement>('[data-jecv2-desktop-switch="era"]');
	const switchToGregorian = root.querySelector<HTMLElement>(
		'[data-jecv2-desktop-switch="gregorian"]',
	);
	if (gregorian) gregorian.hidden = mode !== "gregorian";
	if (era) era.hidden = mode !== "era";
	if (switchToEra) switchToEra.hidden = mode !== "gregorian";
	if (switchToGregorian) switchToGregorian.hidden = mode !== "era";
}

function applyAmeVisual(root: HTMLElement, visual: AmeVisual): void {
	root.setAttribute("data-jecv2-ame", visual);
	const gregorian = root.querySelector<HTMLElement>("[data-jecv2-ame-gregorian]");
	const era = root.querySelector<HTMLElement>("[data-jecv2-ame-era]");
	if (gregorian) gregorian.hidden = visual !== "gregorian";
	if (era) era.hidden = visual !== "era";
}

function stateFromFixture(fixture: VisualFixture): JecDesktopState {
	switch (fixture) {
		case "normal":
			return { mode: "gregorian", gregorianRaw: "2026", eraId: "reiwa", eraYearRaw: "" };
		case "gregorian":
		case "era":
			return { mode: "era", gregorianRaw: "", eraId: "reiwa", eraYearRaw: "8" };
		case "transition":
			return { mode: "gregorian", gregorianRaw: "1926", eraId: "reiwa", eraYearRaw: "" };
		case "transition-heisei":
			return { mode: "gregorian", gregorianRaw: "2019", eraId: "reiwa", eraYearRaw: "" };
		case "partial":
			return { mode: "era", gregorianRaw: "", eraId: "heisei", eraYearRaw: "31" };
		case "future":
			return { mode: "era", gregorianRaw: "", eraId: "reiwa", eraYearRaw: "82" };
		default:
			return createInitialDesktopState();
	}
}

/** B1B AME 靜態 QA：只填 AME 預覽，不當作 Desktop 結果 SSOT。 */
function applyAmeFixturePreview(root: HTMLElement, fixture: VisualFixture): void {
	const ameGregorian = root.querySelector<HTMLElement>("[data-jecv2-ame-gregorian-value]");
	const ameEraYear = root.querySelector<HTMLElement>("[data-jecv2-ame-era-year-value]");
	const select = root.querySelector<HTMLSelectElement>("[data-jecv2-ame-era-select]");
	const seeded = stateFromFixture(fixture);

	if (select) {
		select.value = seeded.eraId;
	}

	if (seeded.mode === "gregorian") {
		setNumericPreview(ameGregorian, seeded.gregorianRaw);
		setNumericPreview(ameEraYear, "");
		applyAmeVisual(root, "gregorian");
		return;
	}

	setNumericPreview(ameGregorian, "");
	setNumericPreview(ameEraYear, seeded.eraYearRaw);
	applyAmeVisual(root, "era");
}

function initDrawer(root: HTMLElement): void {
	const drawer = root.querySelector<HTMLElement>("[data-jecv2-drawer]");
	const shell = root.querySelector<HTMLElement>("[data-jecv2-drawer-shell]");
	const toggle = root.querySelector<HTMLButtonElement>("[data-jecv2-drawer-toggle]");
	const related = root.querySelector<HTMLElement>("[data-jecv2-related-tools]");

	if (!drawer || !shell || !toggle) {
		return;
	}

	let isOpen = drawer.dataset.open !== "false";

	const syncDrawer = () => {
		drawer.dataset.open = isOpen ? "true" : "false";
		shell.dataset.open = isOpen ? "true" : "false";
		shell.classList.toggle("translate-x-[300px]", !isOpen);
		related?.classList.toggle("xl:hidden", isOpen);
		toggle.setAttribute("aria-expanded", String(isOpen));
	};

	syncDrawer();

	toggle.addEventListener("click", (event) => {
		event.preventDefault();
		isOpen = !isOpen;
		syncDrawer();
	});
}

type InvalidField = {
	wrap: HTMLElement | null;
	input: HTMLInputElement | null;
	error: HTMLElement | null;
	errorText: HTMLElement | null;
};

function setInvalidField(field: InvalidField, hint: string | null): void {
	const show = Boolean(hint);
	field.wrap?.classList.toggle("is-invalid", show);

	if (field.errorText) {
		field.errorText.textContent = hint ?? "";
	}

	if (field.error) {
		field.error.hidden = !show;
		if (show && hint) {
			field.error.setAttribute("aria-label", `${hint} !`);
		} else {
			field.error.removeAttribute("aria-label");
		}
	}

	if (field.input) {
		field.input.setAttribute("aria-invalid", show ? "true" : "false");
		if (show && field.error?.id) {
			field.input.setAttribute("aria-describedby", field.error.id);
		} else {
			field.input.removeAttribute("aria-describedby");
		}
	}
}

function bindYearDigitCap(
	input: HTMLInputElement,
	maxDigits: number,
	onChange: (value: string) => void,
): void {
	const commit = (value: string, caret: number | null): void => {
		input.value = value;
		if (caret !== null) {
			const nextCaret = Math.max(0, Math.min(caret, value.length));
			input.setSelectionRange(nextCaret, nextCaret);
		}
		onChange(value);
	};

	input.addEventListener("beforeinput", (event) => {
		const inputEvent = event as InputEvent;
		if (inputEvent.inputType !== "insertText" || inputEvent.data == null) {
			return;
		}

		const start = input.selectionStart ?? 0;
		const end = input.selectionEnd ?? start;
		const unconstrained = `${input.value.slice(0, start)}${inputEvent.data}${input.value.slice(end)}`;
		const next = applyYearInputInsert(input.value, inputEvent.data, start, end, maxDigits);
		if (unconstrained === next) {
			return;
		}

		event.preventDefault();
		const inserted = next.length - (input.value.length - (end - start));
		commit(next, start + Math.max(0, inserted));
	});

	input.addEventListener("paste", (event) => {
		event.preventDefault();
		const text = event.clipboardData?.getData("text") ?? "";
		const start = input.selectionStart ?? 0;
		const end = input.selectionEnd ?? start;
		const next = applyYearInputInsert(input.value, text, start, end, maxDigits);
		const inserted = next.length - (input.value.length - (end - start));
		commit(next, start + Math.max(0, inserted));
	});

	input.addEventListener("input", () => {
		const capped = capYearInput(input.value, maxDigits);
		if (capped !== input.value) {
			const caret = input.selectionStart ?? capped.length;
			commit(capped, Math.min(caret, capped.length));
			return;
		}
		onChange(input.value);
	});
}

/**
 * Desktop 正式互動。換算／range／transition／future 全部走 B2A。
 */
function initDesktopInteraction(
	root: HTMLElement,
	fixture: VisualFixture | null,
): {
	getState: () => JecDesktopState;
	applyState: (next: JecDesktopState) => void;
	republish: () => void;
} {
	const gregorianInput = root.querySelector<HTMLInputElement>(
		"[data-jecv2-desktop-gregorian-year]",
	);
	const eraInput = root.querySelector<HTMLInputElement>("[data-jecv2-desktop-era-year]");
	const eraPrefix = root.querySelector<HTMLButtonElement>("[data-jecv2-era-prefix]");
	const eraPrefixLabel = root.querySelector<HTMLElement>("[data-jecv2-era-prefix-label]");
	const popover = root.querySelector<HTMLElement>("[data-jecv2-era-popover]");
	const eraOptions = [...root.querySelectorAll<HTMLButtonElement>("[data-jecv2-era-option]")];
	const switchToEra = root.querySelector<HTMLButtonElement>('[data-jecv2-desktop-switch="era"]');
	const switchToGregorian = root.querySelector<HTMLButtonElement>(
		'[data-jecv2-desktop-switch="gregorian"]',
	);
	const resetButton = root.querySelector<HTMLButtonElement>("[data-jecv2-reset]");

	const gregorianField: InvalidField = {
		wrap: root.querySelector("[data-jecv2-desktop-gregorian]"),
		input: gregorianInput,
		error: root.querySelector("[data-jecv2-desktop-gregorian-error]"),
		errorText: root.querySelector("[data-jecv2-desktop-gregorian-error-text]"),
	};
	const eraField: InvalidField = {
		wrap: root.querySelector("[data-jecv2-desktop-era]"),
		input: eraInput,
		error: root.querySelector("[data-jecv2-desktop-era-error]"),
		errorText: root.querySelector("[data-jecv2-desktop-era-error-text]"),
	};

	let state: JecDesktopState = fixture ? stateFromFixture(fixture) : createInitialDesktopState();
	let popoverOpen = false;

	const locale = () => readLocale(root);

	const eraLabel = (eraId: JecDesktopState["eraId"]): string => {
		const def = getEra(eraId);
		return locale() === "zh" ? def.zh : def.en;
	};

	const closePopover = (restoreFocus = false): void => {
		if (!popover || !eraPrefix) {
			popoverOpen = false;
			return;
		}

		popoverOpen = false;
		popover.hidden = true;
		popover.removeAttribute("data-placement");
		eraPrefix.setAttribute("aria-expanded", "false");
		eraOptions.forEach((option) => {
			option.tabIndex = -1;
		});
		if (restoreFocus) {
			eraPrefix.focus();
		}
	};

	const syncEraOptions = (): void => {
		eraOptions.forEach((option) => {
			const selected = option.getAttribute("data-jecv2-era-option") === state.eraId;
			option.setAttribute("aria-selected", selected ? "true" : "false");
			option.tabIndex = popoverOpen && selected ? 0 : -1;
		});
	};

	const positionPopover = (): void => {
		if (!popover || !eraPrefix || popover.hidden) {
			return;
		}

		popover.dataset.placement = "below";
		const triggerRect = eraPrefix.getBoundingClientRect();
		const popRect = popover.getBoundingClientRect();
		const gap = 8;
		const spaceBelow = window.innerHeight - triggerRect.bottom - gap;
		if (spaceBelow < popRect.height && triggerRect.top > popRect.height + gap) {
			popover.dataset.placement = "above";
		}
	};

	const openPopover = (): void => {
		if (!popover || !eraPrefix || state.mode !== "era") {
			return;
		}

		popoverOpen = true;
		popover.hidden = false;
		eraPrefix.setAttribute("aria-expanded", "true");
		syncEraOptions();
		positionPopover();
		const selected =
			eraOptions.find((option) => option.getAttribute("aria-selected") === "true") ??
			eraOptions[0];
		selected?.focus();
	};

	const syncFields = (): void => {
		applyInputMode(root, state.mode);
		root.setAttribute("data-jecv2-era-id", state.eraId);
		if (gregorianInput) {
			gregorianInput.value = state.gregorianRaw;
		}
		if (eraInput) {
			eraInput.value = state.eraYearRaw;
		}
		if (eraPrefixLabel) {
			eraPrefixLabel.textContent = eraLabel(state.eraId);
		}
		syncEraOptions();
	};

	const syncInvalid = (evaluation: JecEvaluation): void => {
		const hint = formatInvalidHint(evaluation, locale(), state.eraId);
		if (state.mode === "gregorian") {
			setInvalidField(gregorianField, hint);
			setInvalidField(eraField, null);
			return;
		}

		setInvalidField(gregorianField, null);
		setInvalidField(eraField, hint);
	};

	const publish = (): void => {
		const evaluation = evaluateDesktopState(state);
		const formatted = formatJapaneseEraResult(evaluation, locale());
		const kind: ResultKind =
			evaluation.status === "valid" && evaluation.kind === "gregorian-transition"
				? "transition"
				: "single";
		let support = formatted.support;
		if (support && rsLayout(root) === "portrait") {
			support = portraitSupport(support);
		}

		applyResult(
			root,
			kind,
			formatted.primary,
			support,
			formatted.futureReiwaAssumption,
			formatted.assumptionNote,
		);
		syncFields();
		syncInvalid(evaluation);
	};

	const selectEra = (eraId: string, restoreFocus = true): void => {
		state = setDesktopEraId(state, eraId);
		closePopover(restoreFocus);
		publish();
	};

	switchToEra?.addEventListener("click", (event) => {
		event.preventDefault();
		closePopover();
		state = switchDesktopMode(state);
		publish();
	});

	switchToGregorian?.addEventListener("click", (event) => {
		event.preventDefault();
		closePopover();
		state = switchDesktopMode(state);
		publish();
	});

	if (gregorianInput) {
		bindYearDigitCap(gregorianInput, GREGORIAN_INPUT_MAX_DIGITS, (value) => {
			state = setGregorianRaw(state, value);
			publish();
		});
	}

	if (eraInput) {
		bindYearDigitCap(eraInput, ERA_INPUT_MAX_DIGITS, (value) => {
			state = setEraYearRaw(state, value);
			publish();
		});
	}

	resetButton?.addEventListener("click", (event) => {
		event.preventDefault();
		closePopover();
		state = resetDesktopState();
		publish();
	});

	eraPrefix?.addEventListener("click", (event) => {
		event.preventDefault();
		if (popoverOpen) {
			closePopover();
			return;
		}
		openPopover();
	});

	eraPrefix?.addEventListener("keydown", (event) => {
		if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			if (!popoverOpen) {
				openPopover();
			}
		}
	});

	eraOptions.forEach((option, index) => {
		option.addEventListener("click", (event) => {
			event.preventDefault();
			selectEra(option.getAttribute("data-jecv2-era-option") || "reiwa");
		});

		option.addEventListener("keydown", (event) => {
			if (event.key === "Escape") {
				event.preventDefault();
				closePopover(true);
				return;
			}

			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				selectEra(option.getAttribute("data-jecv2-era-option") || "reiwa");
				return;
			}

			if (event.key === "Home") {
				event.preventDefault();
				eraOptions[0]?.focus();
				return;
			}

			if (event.key === "End") {
				event.preventDefault();
				eraOptions[eraOptions.length - 1]?.focus();
				return;
			}

			if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
				return;
			}

			event.preventDefault();
			const delta = event.key === "ArrowDown" ? 1 : -1;
			const next = (index + delta + eraOptions.length) % eraOptions.length;
			eraOptions[next]?.focus();
		});
	});

	document.addEventListener("pointerdown", (event) => {
		if (!popoverOpen) {
			return;
		}

		const target = event.target;
		if (!(target instanceof Node)) {
			return;
		}

		if (popover?.contains(target) || eraPrefix?.contains(target)) {
			return;
		}

		closePopover();
	});

	document.addEventListener("keydown", (event) => {
		if (event.key === "Escape" && popoverOpen) {
			event.preventDefault();
			closePopover(true);
		}
	});

	window.addEventListener("resize", () => {
		if (popoverOpen) {
			positionPopover();
		}
	});

	publish();

	return {
		getState: () => state,
		applyState: (next: JecDesktopState) => {
			state = next;
			closePopover();
			publish();
		},
		republish: publish,
	};
}

function initLayoutSync(root: HTMLElement, republish: () => void): void {
	const apply = () => {
		window.TimivaJapaneseEraConverterLayout?.applyLayoutAttrs(document);
		republish();
	};

	const desktopMq = window.matchMedia(
		window.TimivaJapaneseEraConverterLayout?.DESKTOP_MQ ||
			"(min-width: 768px) and (hover: hover)",
	);
	const landscapeMq = window.matchMedia(
		window.TimivaJapaneseEraConverterLayout?.LANDSCAPE_MQ ||
			"(orientation: landscape) and (max-height: 700px) and (max-width: 1200px) and (hover: none)",
	);

	desktopMq.addEventListener("change", apply);
	landscapeMq.addEventListener("change", apply);
	window.addEventListener("resize", apply);
	apply();
}

/**
 * B2C AME live：共用 B2A evaluate／format 與 Desktop state helpers。
 * Reset 保持 Editor 開啟（shared live）；Done／一般關閉不 rollback。
 */
function initAme(
	root: HTMLElement,
	session: {
		getState: () => JecDesktopState;
		applyState: (next: JecDesktopState) => void;
	},
): void {
	const pageContent = root.querySelector<HTMLElement>("[data-ame-page-content]");
	const ameRoot = root.querySelector<HTMLElement>("[data-ame-root]");
	const trigger = root.querySelector<HTMLElement>("[data-jecv2-sheet-trigger]");

	if (!pageContent || !ameRoot || ameSessions.has(root)) {
		return;
	}

	const locale = () => readLocale(root);

	const ameApi = createAdaptiveMobileEditor<JecAmeDraft>(ameRoot, {
		pageContent,
		numericFields: JEC_AME_NUMERIC_FIELDS,
		adapter: {
			lifecycle: "live",
			getCommitted: () => cloneJecAmeDraft(draftFromState(session.getState())),
			createOpenDraft: (committed) => cloneJecAmeDraft(committed),
			getResetDraft: () => cloneJecAmeDraft(jecAmeResetDraft()),
			validate: (draft) => validateJecAmeDraft(draft, locale()),
			acceptNumericCandidate: ({ fieldId, candidateValue, draft }) =>
				acceptJecAmeNumericCandidate({ fieldId, candidateValue, draft }),
			onCommit: (committed) => {
				session.applyState(stateFromDraft(committed));
			},
			onDraftChange: (draft) => {
				syncJecAmeUi(root, draft, locale());
			},
		},
		onSyncUi: (draft) => {
			syncJecAmeUi(root, draft, locale());
		},
	});

	const unbindInteractions = bindJecAmeInteractions(ameRoot, {
		getDraft: () => ameApi.getDraft(),
		patchDraft: (partial) => ameApi.patchDraft(partial),
		clearActiveField: () => ameApi.clearActiveField(),
		isOpen: () => ameApi.isOpen(),
	});

	trigger?.addEventListener("click", (event) => {
		event.preventDefault();
		ameApi.open(trigger);
	});

	ameSessions.set(root, {
		destroy: () => {
			unbindInteractions();
			ameApi.destroy();
			ameSessions.delete(root);
		},
	});

	window.addEventListener(
		"pagehide",
		() => {
			ameSessions.get(root)?.destroy();
		},
		{ once: true },
	);

	const params = new URLSearchParams(window.location.search);
	if (params.get("jecv2Sheet") === "open") {
		ameApi.open(trigger ?? undefined);
	}
}

function initRoot(root: HTMLElement): void {
	initDrawer(root);
	window.TimivaJapaneseEraConverterLayout?.applyLayoutAttrs(document);

	const params = new URLSearchParams(window.location.search);
	const rawFixture = params.get("jecv2Fixture");
	const fixture = rawFixture && isFixture(rawFixture) ? rawFixture : null;
	const ameParam = params.get("jecv2Ame");

	if (fixture) {
		applyAmeFixturePreview(root, fixture);
	}

	const session = initDesktopInteraction(root, fixture);
	initLayoutSync(root, session.republish);

	if (ameParam === "era" && session.getState().mode !== "era") {
		session.applyState(switchDesktopMode(session.getState()));
	} else if (ameParam === "gregorian" && session.getState().mode !== "gregorian") {
		session.applyState(switchDesktopMode(session.getState()));
	} else if (ameParam === "era" || ameParam === "gregorian") {
		applyAmeVisual(root, ameParam);
	}

	initAme(root, session);
}

function boot(): void {
	initResultSummary();
	document
		.querySelectorAll<HTMLElement>("[data-japanese-era-converter-v2]")
		.forEach((root) => initRoot(root));
}

declare global {
	interface Window {
		TimivaJapaneseEraConverterLayout?: {
			DESKTOP_MQ: string;
			LANDSCAPE_MQ: string;
			applyLayoutAttrs: (doc?: Document) => void;
		};
	}
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
	boot();
}
