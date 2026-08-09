/**
 * Hours Calculator — B1A drawer + B2A Desktop + B2B Mobile AME + B2C calc sync.
 * Desktop／Mobile 共用 evaluateHoursResult → ResultSummary＋capsule。
 */

import { update as updateResultSummary } from "./result-summary-controller";
import {
	createAdaptiveMobileEditor,
	type AdaptiveMobileEditorController,
} from "./adaptive-mobile-editor-controller";
import {
	HOURS_AME_NUMERIC_FIELDS,
	HOURS_AME_RESET_DEFAULTS,
	acceptHoursAmeNumericCandidate,
	ameDraftFromTimes,
	cloneHoursAmeDraft,
	focusHoursAmeField,
	mergeHoursAmeDraft,
	parseAmeDraftToBreak,
	parseAmeDraftToRange,
	syncHoursAmeRowErrors,
	syncHoursAmeSegmentUi,
	takeHoursAmePending,
	validateHoursAmeDraft,
	type HoursAmeDraft,
} from "./hours-calculator-ame-adapter";
import { evaluateHoursResult, type HoursEvaluation } from "../lib/hoursCalculatorEvaluate";
import { completeMobileClockPair } from "../lib/hoursCalculatorSegmentInput";
import {
	parseBreakInput,
	parseRangeInput,
	type HoursLocale,
} from "../lib/hoursCalculatorTimeInput";

const ameSessions = new WeakMap<HTMLElement, { destroy: () => void }>();
const ameCommitted = new WeakMap<HTMLElement, HoursAmeDraft>();
/** Desktop／layout 變更時重跑 evaluate（support 橫式 slash 組裝） */
const reevaluateByRoot = new WeakMap<HTMLElement, () => void>();

type HoursLayoutApi = {
	DESKTOP_MQ: string;
	LANDSCAPE_MQ: string;
	applyLayoutAttrs: (doc?: Document) => void;
};

function getHoursLayoutApi(): HoursLayoutApi | null {
	const api = (
		window as Window & { TimivaHoursCalculatorLayout?: HoursLayoutApi }
	).TimivaHoursCalculatorLayout;
	return api ?? null;
}

function initLayoutSync(): void {
	const api = getHoursLayoutApi();
	if (!api) {
		return;
	}

	const sync = () => {
		api.applyLayoutAttrs(document);
		document
			.querySelectorAll<HTMLElement>("[data-hours-calculator-v2]")
			.forEach((root) => {
				reevaluateByRoot.get(root)?.();
			});
	};

	sync();

	window.matchMedia(api.DESKTOP_MQ).addEventListener("change", sync);
	window.matchMedia(api.LANDSCAPE_MQ).addEventListener("change", sync);
	window.addEventListener("resize", sync);
}

type VisualFixture =
	| "initial"
	| "same-day"
	| "overnight"
	| "with-break"
	| "break-error"
	| "range-error";

function readLocale(root: HTMLElement): HoursLocale {
	return root.getAttribute("data-hcv2-locale") === "zh" ? "zh" : "en";
}

function capsuleEmptyLabel(root: HTMLElement): string {
	return root.getAttribute("data-hcv2-capsule-empty") || "";
}

function setIcon(el: HTMLElement | null, show: boolean): void {
	if (!el) return;
	el.hidden = !show;
	el.setAttribute("aria-hidden", show ? "false" : "true");
}

/** 僅手機橫式：break 接在 line1 後，以 ` / ` 分隔；Portrait／Desktop 仍兩行 */
function formatSupportForLayout(view: HoursEvaluation, resultRoot: HTMLElement | null): string {
	if (!view.supportLine2) {
		return view.supportLine1;
	}
	const landscape = resultRoot?.getAttribute("data-rs-layout") === "landscape";
	return landscape
		? `${view.supportLine1} / ${view.supportLine2}`
		: `${view.supportLine1}\n${view.supportLine2}`;
}

function publishEvaluation(root: HTMLElement, view: HoursEvaluation): void {
	const resultRoot = root.querySelector<HTMLElement>("[data-result-summary]");
	if (resultRoot) {
		updateResultSummary(resultRoot, {
			content: "textual",
			primary: { text: view.primary },
			weekday: null,
			support: formatSupportForLayout(view, resultRoot),
		});
	}

	const capsuleRange = root.querySelector<HTMLElement>("[data-hcv2-capsule-range]");
	const capsuleNextDay = root.querySelector<HTMLElement>("[data-hcv2-capsule-nextday]");
	const nextDayLabel = root.getAttribute("data-hcv2-capsule-nextday-label") || "";

	if (capsuleRange) {
		capsuleRange.textContent = view.capsuleRange;
	}
	if (capsuleNextDay) {
		capsuleNextDay.hidden = !view.capsuleNextDay;
		capsuleNextDay.setAttribute("aria-hidden", view.capsuleNextDay ? "false" : "true");
		if (view.capsuleNextDay) {
			capsuleNextDay.textContent = nextDayLabel;
			capsuleNextDay.removeAttribute("hidden");
		} else {
			capsuleNextDay.setAttribute("hidden", "");
		}
	}
}

function writeDesktopFromDraft(root: HTMLElement, draft: HoursAmeDraft): void {
	const rangeInput = root.querySelector<HTMLInputElement>("[data-hcv2-desktop-range]");
	const breakInput = root.querySelector<HTMLInputElement>("[data-hcv2-desktop-break]");
	const addBreak = root.querySelector<HTMLButtonElement>("[data-hcv2-add-break]");
	const breakField = root.querySelector<HTMLElement>("[data-hcv2-break-field]");
	const range = parseAmeDraftToRange(draft);
	const brk = parseAmeDraftToBreak(draft);

	if (rangeInput) {
		if (range.status === "valid") {
			rangeInput.value = range.normalized;
		} else if (range.status === "empty") {
			rangeInput.value = "";
		} else {
			/* incomplete／invalid：清掉 Desktop，避免 stale range 與 RS 不一致 */
			rangeInput.value = "";
		}
	}

	const breakHasDigits =
		(draft["break-hh"] ?? "") !== "" || (draft["break-mm"] ?? "") !== "";
	const breakOpen = breakHasDigits || brk.status === "valid";

	if (breakField) breakField.hidden = !breakOpen;
	if (addBreak) addBreak.hidden = breakOpen;
	root.setAttribute("data-hcv2-break-open", breakOpen ? "true" : "false");

	if (breakInput) {
		if (brk.status === "valid") {
			breakInput.value = brk.normalized;
		} else if (brk.status === "empty") {
			breakInput.value = "";
		} else {
			breakInput.value = "";
		}
	}
}

function draftFromDesktop(root: HTMLElement): HoursAmeDraft {
	const rangeInput = root.querySelector<HTMLInputElement>("[data-hcv2-desktop-range]");
	const breakInput = root.querySelector<HTMLInputElement>("[data-hcv2-desktop-break]");
	const breakOpen = root.getAttribute("data-hcv2-break-open") === "true";
	const range = parseRangeInput(rangeInput?.value ?? "");
	const brk =
		breakOpen && breakInput
			? parseBreakInput(breakInput.value)
			: ({ status: "empty" } as const);

	if (range.status === "valid") {
		const breakMinutes = brk.status === "valid" ? brk.totalMinutes : null;
		return ameDraftFromTimes(range.start, range.end, breakMinutes);
	}
	if (range.status === "empty" && brk.status === "empty") {
		return mergeHoursAmeDraft(HOURS_AME_RESET_DEFAULTS);
	}
	/* incomplete／invalid：不回傳半組／舊值，避免 AME 開啟時與 RS 不一致 */
	return mergeHoursAmeDraft(HOURS_AME_RESET_DEFAULTS);
}

function applyMobileDraft(root: HTMLElement, ameRoot: HTMLElement, draft: HoursAmeDraft): void {
	const locale = readLocale(root);
	const range = parseAmeDraftToRange(draft);
	const breakParsed = parseAmeDraftToBreak(draft);
	const view = evaluateHoursResult({
		locale,
		range,
		breakParsed,
		capsuleEmptyLabel: capsuleEmptyLabel(root),
	});

	ameCommitted.set(root, cloneHoursAmeDraft(draft));
	writeDesktopFromDraft(root, draft);
	publishEvaluation(root, view);

	const rangeInvalid = root.querySelector<HTMLElement>("[data-hcv2-range-invalid]");
	const breakInvalid = root.querySelector<HTMLElement>("[data-hcv2-break-invalid]");
	const removeBreak = root.querySelector<HTMLButtonElement>("[data-hcv2-remove-break]");
	setIcon(rangeInvalid, view.rangeInvalid);
	const breakOpen = root.getAttribute("data-hcv2-break-open") === "true";
	if (breakOpen && view.breakInvalid) {
		setIcon(breakInvalid, true);
		if (removeBreak) removeBreak.hidden = true;
	} else if (breakOpen) {
		setIcon(breakInvalid, false);
		if (removeBreak) removeBreak.hidden = false;
	} else {
		setIcon(breakInvalid, false);
	}

	syncHoursAmeSegmentUi(ameRoot, draft);
	syncHoursAmeRowErrors(ameRoot, draft, {
		breakExceedsGross: view.breakExceedsGross,
	});
}

function initDrawer(root: HTMLElement): void {
	const drawer = root.querySelector<HTMLElement>("[data-hcv2-drawer]");
	const shell = root.querySelector<HTMLElement>("[data-hcv2-drawer-shell]");
	const toggle = root.querySelector<HTMLButtonElement>("[data-hcv2-drawer-toggle]");
	const related = root.querySelector<HTMLElement>("[data-hcv2-related-tools]");

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

/**
 * B2B＋B2C：shared AME＋keypad；live draft → 共用 evaluate／RS／capsule。
 * Owner review：?hcv2Sheet=open
 */
function initAme(root: HTMLElement): void {
	if (ameSessions.has(root)) {
		return;
	}

	const pageContent = root.querySelector<HTMLElement>("[data-ame-page-content]");
	const ameRoot = root.querySelector<HTMLElement>("[data-ame-root]");
	const triggers = [
		...root.querySelectorAll<HTMLElement>("[data-hcv2-sheet-trigger]"),
	];
	const clearLabel = root.getAttribute("data-hcv2-clear-times-label") || "Clear";

	if (!pageContent || !ameRoot) {
		return;
	}

	ameRoot.querySelectorAll<HTMLElement>("[data-ame-reset]").forEach((el) => {
		el.textContent = clearLabel;
	});

	const getCommittedDraft = (): HoursAmeDraft =>
		cloneHoursAmeDraft(ameCommitted.get(root) ?? draftFromDesktop(root));

	let ameApi!: AdaptiveMobileEditorController<HoursAmeDraft>;
	/** 目前所在時間組；離開 start／end 時才做 clock completion */
	let activeClockGroup: "start" | "end" | "break" | null = null;
	let completingClock = false;

	const clockGroupOfField = (
		fieldId: string,
	): "start" | "end" | "break" | null => {
		if (fieldId.startsWith("start-")) return "start";
		if (fieldId.startsWith("end-")) return "end";
		if (fieldId.startsWith("break-")) return "break";
		return null;
	};

	const completeClockGroup = (group: "start" | "end") => {
		if (!ameApi.isOpen() || completingClock) {
			return;
		}
		const draft = ameApi.getDraft();
		const hhKey = `${group}-hh` as keyof HoursAmeDraft;
		const mmKey = `${group}-mm` as keyof HoursAmeDraft;
		const result = completeMobileClockPair(
			String(draft[hhKey] ?? ""),
			String(draft[mmKey] ?? ""),
		);
		if (result.status !== "complete") {
			return;
		}
		const nextHh = result.hh;
		const nextMm = result.mm;
		if (draft[hhKey] === nextHh && draft[mmKey] === nextMm) {
			return;
		}
		completingClock = true;
		try {
			ameApi.patchDraft({
				[hhKey]: nextHh,
				[mmKey]: nextMm,
			});
		} finally {
			completingClock = false;
		}
	};

	const onLeaveClockGroup = (nextGroup: "start" | "end" | "break" | null) => {
		if (
			activeClockGroup &&
			(activeClockGroup === "start" || activeClockGroup === "end") &&
			activeClockGroup !== nextGroup
		) {
			completeClockGroup(activeClockGroup);
		}
		activeClockGroup = nextGroup;
	};

	const applyPendingPadOrAdvance = () => {
		const pending = takeHoursAmePending();
		if (!pending) {
			return;
		}
		queueMicrotask(() => {
			if (!ameApi.isOpen()) {
				return;
			}
			if (pending.type === "pad") {
				ameApi.patchDraft({ [pending.fieldId]: pending.padded });
				if (pending.advanceTo) {
					focusHoursAmeField(ameRoot, pending.advanceTo);
				}
				return;
			}
			focusHoursAmeField(ameRoot, pending.advanceTo);
		});
	};

	ameApi = createAdaptiveMobileEditor<HoursAmeDraft>(ameRoot, {
		pageContent,
		numericFields: HOURS_AME_NUMERIC_FIELDS,
		adapter: {
			lifecycle: "live",
			getCommitted: getCommittedDraft,
			createOpenDraft: (committed) => {
				/*
				 * Desktop 有效 → 以 Desktop 為準。
				 * Desktop incomplete／invalid → 開空稿（對齊已歸零的 RS／capsule），不回退舊 committed。
				 * Desktop empty → 用 committed（Mobile 編輯中途關閉後重開）。
				 */
				const rangeInput = root.querySelector<HTMLInputElement>(
					"[data-hcv2-desktop-range]",
				);
				const desktopRange = parseRangeInput(rangeInput?.value ?? "");
				if (desktopRange.status === "valid") {
					return cloneHoursAmeDraft(draftFromDesktop(root));
				}
				if (desktopRange.status === "incomplete" || desktopRange.status === "invalid") {
					return cloneHoursAmeDraft(HOURS_AME_RESET_DEFAULTS);
				}
				return cloneHoursAmeDraft(committed);
			},
			getResetDraft: () => cloneHoursAmeDraft(HOURS_AME_RESET_DEFAULTS),
			validate: (draft) => validateHoursAmeDraft(draft),
			acceptNumericCandidate: ({ fieldId, currentValue, candidateValue, digit }) =>
				acceptHoursAmeNumericCandidate({
					fieldId,
					currentValue,
					candidateValue,
					digit,
				}),
			onCommit: (committed) => {
				applyMobileDraft(root, ameRoot, committed);
			},
			onDraftChange: (draft) => {
				const locale = readLocale(root);
				const range = parseAmeDraftToRange(draft);
				const breakParsed = parseAmeDraftToBreak(draft);
				const view = evaluateHoursResult({
					locale,
					range,
					breakParsed,
					capsuleEmptyLabel: capsuleEmptyLabel(root),
				});
				syncHoursAmeSegmentUi(ameRoot, draft);
				syncHoursAmeRowErrors(ameRoot, draft, {
					breakExceedsGross: view.breakExceedsGross,
				});
				applyPendingPadOrAdvance();
			},
		},
		onSyncUi: (draft) => {
			const locale = readLocale(root);
			const range = parseAmeDraftToRange(draft);
			const breakParsed = parseAmeDraftToBreak(draft);
			const view = evaluateHoursResult({
				locale,
				range,
				breakParsed,
				capsuleEmptyLabel: capsuleEmptyLabel(root),
			});
			syncHoursAmeSegmentUi(ameRoot, draft);
			syncHoursAmeRowErrors(ameRoot, draft, {
				breakExceedsGross: view.breakExceedsGross,
			});
		},
	});

	/* 離開 Start／End 時間組 → clock completion（不改 shared AME） */
	ameRoot.addEventListener(
		"click",
		(event) => {
			if (!ameApi.isOpen()) {
				return;
			}
			const target = event.target;
			if (!(target instanceof Element)) {
				return;
			}

			const submitEl = target.closest<HTMLElement>("[data-ame-submit]");
			if (submitEl && ameRoot.contains(submitEl)) {
				/* Done：補完 Start／End 後再關閉 */
				completeClockGroup("start");
				completeClockGroup("end");
				activeClockGroup = null;
				return;
			}

			const resetEl = target.closest<HTMLElement>("[data-ame-reset]");
			if (resetEl && ameRoot.contains(resetEl)) {
				activeClockGroup = null;
				return;
			}

			const fieldEl = target.closest<HTMLElement>("[data-ame-numeric-field]");
			if (fieldEl && ameRoot.contains(fieldEl)) {
				const fieldId = fieldEl.getAttribute("data-ame-numeric-field") || "";
				const nextGroup = clockGroupOfField(fieldId);
				onLeaveClockGroup(nextGroup);
			}
		},
		true,
	);

	for (const trigger of triggers) {
		trigger.addEventListener("click", (event) => {
			event.preventDefault();
			ameApi.open(trigger);
		});
	}

	ameSessions.set(root, {
		destroy: () => {
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

	const preferOpen =
		new URLSearchParams(window.location.search).get("hcv2Sheet") === "open";
	if (preferOpen) {
		ameApi.open(triggers[0] ?? undefined);
	}
}

/** B2A／B2C：Desktop range／break → 共用 evaluate → RS／capsule／! */
function initDesktopLive(root: HTMLElement): void {
	const rangeInput = root.querySelector<HTMLInputElement>("[data-hcv2-desktop-range]");
	const breakInput = root.querySelector<HTMLInputElement>("[data-hcv2-desktop-break]");
	const addBreak = root.querySelector<HTMLButtonElement>("[data-hcv2-add-break]");
	const breakField = root.querySelector<HTMLElement>("[data-hcv2-break-field]");
	const removeBreak = root.querySelector<HTMLButtonElement>("[data-hcv2-remove-break]");
	const rangeInvalid = root.querySelector<HTMLElement>("[data-hcv2-range-invalid]");
	const breakInvalid = root.querySelector<HTMLElement>("[data-hcv2-break-invalid]");
	const resultRoot = root.querySelector<HTMLElement>("[data-result-summary]");

	if (!rangeInput || !resultRoot) {
		return;
	}

	const locale = readLocale(root);

	const setBreakOpen = (open: boolean) => {
		if (breakField) breakField.hidden = !open;
		if (addBreak) addBreak.hidden = open;
		root.setAttribute("data-hcv2-break-open", open ? "true" : "false");
	};

	const syncBreakTrailing = (breakIsInvalid: boolean) => {
		const open = root.getAttribute("data-hcv2-break-open") === "true";
		if (!open) {
			setIcon(breakInvalid, false);
			if (removeBreak) removeBreak.hidden = false;
			return;
		}
		if (breakIsInvalid) {
			setIcon(breakInvalid, true);
			if (removeBreak) removeBreak.hidden = true;
		} else {
			setIcon(breakInvalid, false);
			if (removeBreak) removeBreak.hidden = false;
		}
	};

	const evaluate = (options?: {
		normalizeRange?: boolean;
		normalizeBreak?: boolean;
		skipAmeMirror?: boolean;
	}) => {
		const range = parseRangeInput(rangeInput.value);
		const breakOpen = root.getAttribute("data-hcv2-break-open") === "true";
		const breakRaw = breakOpen && breakInput ? breakInput.value : "";
		const breakParsed = breakOpen ? parseBreakInput(breakRaw) : { status: "empty" as const };

		if (options?.normalizeRange && range.status === "valid") {
			rangeInput.value = range.normalized;
		}
		if (options?.normalizeBreak && breakParsed.status === "valid" && breakInput) {
			breakInput.value = breakParsed.normalized;
		}

		const view = evaluateHoursResult({
			locale,
			range,
			breakParsed,
			capsuleEmptyLabel: capsuleEmptyLabel(root),
		});

		setIcon(rangeInvalid, view.rangeInvalid);
		syncBreakTrailing(view.breakInvalid);
		publishEvaluation(root, view);

		if (!options?.skipAmeMirror) {
			if (range.status === "valid") {
				const breakMinutes =
					breakParsed.status === "valid" ? breakParsed.totalMinutes : null;
				ameCommitted.set(
					root,
					ameDraftFromTimes(range.start, range.end, breakMinutes),
				);
			} else {
				/* empty／incomplete／invalid：清除 committed，避免 AME 開啟帶回舊 valid */
				ameCommitted.set(root, mergeHoursAmeDraft(HOURS_AME_RESET_DEFAULTS));
			}
		}
	};

	const commitRange = () => {
		evaluate({ normalizeRange: true });
	};

	const commitBreak = () => {
		evaluate({ normalizeBreak: true });
	};

	rangeInput.addEventListener("input", () => {
		evaluate();
	});
	rangeInput.addEventListener("blur", () => {
		commitRange();
	});
	rangeInput.addEventListener("keydown", (event) => {
		if (event.key === "Enter") {
			event.preventDefault();
			commitRange();
			rangeInput.blur();
		}
	});

	if (breakInput) {
		breakInput.addEventListener("input", () => {
			evaluate();
		});
		breakInput.addEventListener("blur", () => {
			commitBreak();
		});
		breakInput.addEventListener("keydown", (event) => {
			if (event.key === "Enter") {
				event.preventDefault();
				commitBreak();
				breakInput.blur();
			}
		});
	}

	addBreak?.addEventListener("click", (event) => {
		event.preventDefault();
		setBreakOpen(true);
		syncBreakTrailing(false);
		breakInput?.focus();
		evaluate();
	});

	removeBreak?.addEventListener("click", (event) => {
		event.preventDefault();
		if (breakInput) breakInput.value = "";
		setIcon(breakInvalid, false);
		if (removeBreak) removeBreak.hidden = false;
		setBreakOpen(false);
		evaluate();
	});

	evaluate();
	reevaluateByRoot.set(root, () => {
		evaluate({ skipAmeMirror: true });
	});
}

function applyFixture(root: HTMLElement, fixture: VisualFixture): void {
	root.setAttribute("data-hcv2-fixture", fixture);

	const rangeInput = root.querySelector<HTMLInputElement>("[data-hcv2-desktop-range]");
	const breakInput = root.querySelector<HTMLInputElement>("[data-hcv2-desktop-break]");
	const addBreak = root.querySelector<HTMLButtonElement>("[data-hcv2-add-break]");
	const breakField = root.querySelector<HTMLElement>("[data-hcv2-break-field]");
	const removeBreak = root.querySelector<HTMLButtonElement>("[data-hcv2-remove-break]");
	const rangeInvalid = root.querySelector<HTMLElement>("[data-hcv2-range-invalid]");
	const breakInvalid = root.querySelector<HTMLElement>("[data-hcv2-break-invalid]");
	const capsuleRange = root.querySelector<HTMLElement>("[data-hcv2-capsule-range]");
	const capsuleNextDay = root.querySelector<HTMLElement>("[data-hcv2-capsule-nextday]");

	const setBreakOpen = (open: boolean) => {
		if (breakField) breakField.hidden = !open;
		if (addBreak) addBreak.hidden = open;
		root.setAttribute("data-hcv2-break-open", open ? "true" : "false");
	};

	const emptyCapsule = capsuleEmptyLabel(root);
	const nextDayLabel = root.getAttribute("data-hcv2-capsule-nextday-label") || "";

	const setSegments = (values: Record<string, string | null>) => {
		for (const [key, value] of Object.entries(values)) {
			const el = root.querySelector<HTMLElement>(
				`[data-hcv2-segment="${key}"] [data-hcv2-segment-value]`,
			);
			if (!el) continue;
			if (value == null || value === "") {
				el.textContent =
					key.endsWith("-hh")
						? root.getAttribute("data-hcv2-seg-hh-ph") || "HH"
						: root.getAttribute("data-hcv2-seg-mm-ph") || "MM";
				el.classList.add("is-placeholder");
			} else {
				el.textContent = value;
				el.classList.remove("is-placeholder");
			}
		}
	};

	const blankSegments = {
		"start-hh": null,
		"start-mm": null,
		"end-hh": null,
		"end-mm": null,
		"break-hh": null,
		"break-mm": null,
	} as Record<string, string | null>;

	switch (fixture) {
		case "same-day": {
			if (rangeInput) rangeInput.value = "09:00 – 18:00";
			if (breakInput) breakInput.value = "";
			setBreakOpen(false);
			setIcon(rangeInvalid, false);
			setIcon(breakInvalid, false);
			if (removeBreak) removeBreak.hidden = false;
			if (capsuleRange) capsuleRange.textContent = "09:00 — 18:00";
			if (capsuleNextDay) {
				capsuleNextDay.hidden = true;
				capsuleNextDay.textContent = nextDayLabel;
			}
			setSegments({
				...blankSegments,
				"start-hh": "09",
				"start-mm": "00",
				"end-hh": "18",
				"end-mm": "00",
			});
			ameCommitted.set(
				root,
				ameDraftFromTimes({ hours: 9, minutes: 0 }, { hours: 18, minutes: 0 }, null),
			);
			break;
		}
		case "overnight": {
			if (rangeInput) rangeInput.value = "22:00 – 06:00";
			if (breakInput) breakInput.value = "";
			setBreakOpen(false);
			setIcon(rangeInvalid, false);
			setIcon(breakInvalid, false);
			if (removeBreak) removeBreak.hidden = false;
			if (capsuleRange) capsuleRange.textContent = "22:00 — 06:00";
			if (capsuleNextDay) {
				capsuleNextDay.hidden = false;
				capsuleNextDay.textContent = nextDayLabel;
			}
			setSegments({
				...blankSegments,
				"start-hh": "22",
				"start-mm": "00",
				"end-hh": "06",
				"end-mm": "00",
			});
			ameCommitted.set(
				root,
				ameDraftFromTimes({ hours: 22, minutes: 0 }, { hours: 6, minutes: 0 }, null),
			);
			break;
		}
		case "with-break": {
			if (rangeInput) rangeInput.value = "22:00 – 07:00";
			if (breakInput) breakInput.value = "00:30";
			setBreakOpen(true);
			setIcon(rangeInvalid, false);
			setIcon(breakInvalid, false);
			if (removeBreak) removeBreak.hidden = false;
			if (capsuleRange) capsuleRange.textContent = "22:00 — 07:00";
			if (capsuleNextDay) {
				capsuleNextDay.hidden = false;
				capsuleNextDay.textContent = nextDayLabel;
			}
			setSegments({
				"start-hh": "22",
				"start-mm": "00",
				"end-hh": "07",
				"end-mm": "00",
				"break-hh": "00",
				"break-mm": "30",
			});
			ameCommitted.set(
				root,
				ameDraftFromTimes({ hours: 22, minutes: 0 }, { hours: 7, minutes: 0 }, 30),
			);
			break;
		}
		case "break-error": {
			if (rangeInput) rangeInput.value = "09:00 – 17:00";
			if (breakInput) breakInput.value = "09:00";
			setBreakOpen(true);
			setIcon(rangeInvalid, false);
			setIcon(breakInvalid, true);
			if (removeBreak) removeBreak.hidden = true;
			if (capsuleRange) capsuleRange.textContent = "09:00 — 17:00";
			if (capsuleNextDay) capsuleNextDay.hidden = true;
			setSegments({
				"start-hh": "09",
				"start-mm": "00",
				"end-hh": "17",
				"end-mm": "00",
				"break-hh": "09",
				"break-mm": "00",
			});
			ameCommitted.set(
				root,
				ameDraftFromTimes({ hours: 9, minutes: 0 }, { hours: 17, minutes: 0 }, 9 * 60),
			);
			break;
		}
		case "range-error": {
			if (rangeInput) rangeInput.value = "25:00-18:00";
			if (breakInput) breakInput.value = "";
			setBreakOpen(false);
			setIcon(rangeInvalid, true);
			setIcon(breakInvalid, false);
			if (removeBreak) removeBreak.hidden = false;
			if (capsuleRange) capsuleRange.textContent = emptyCapsule;
			if (capsuleNextDay) capsuleNextDay.hidden = true;
			setSegments(blankSegments);
			ameCommitted.set(root, mergeHoursAmeDraft(HOURS_AME_RESET_DEFAULTS));
			break;
		}
		default: {
			if (rangeInput) rangeInput.value = "";
			if (breakInput) breakInput.value = "";
			setBreakOpen(false);
			setIcon(rangeInvalid, false);
			setIcon(breakInvalid, false);
			if (removeBreak) removeBreak.hidden = false;
			if (capsuleRange) capsuleRange.textContent = emptyCapsule;
			if (capsuleNextDay) capsuleNextDay.hidden = true;
			setSegments(blankSegments);
			ameCommitted.set(root, mergeHoursAmeDraft(HOURS_AME_RESET_DEFAULTS));
			break;
		}
	}
}

function initFixtureBootstrap(root: HTMLElement): void {
	const params = new URLSearchParams(window.location.search);
	const raw = params.get("hcv2Fixture") || "initial";
	const allowed: VisualFixture[] = [
		"initial",
		"same-day",
		"overnight",
		"with-break",
		"break-error",
		"range-error",
	];
	const fixture = (allowed.includes(raw as VisualFixture) ? raw : "initial") as VisualFixture;
	applyFixture(root, fixture);
}

function initHoursCalculator(): void {
	initLayoutSync();
	const roots = document.querySelectorAll<HTMLElement>("[data-hours-calculator-v2]");
	roots.forEach((root) => {
		initDrawer(root);
		initAme(root);
		initFixtureBootstrap(root);
		/* fixture 先寫入欄位，再綁定 live（evaluate 一次對齊 ResultSummary） */
		initDesktopLive(root);
	});
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", initHoursCalculator, { once: true });
} else {
	initHoursCalculator();
}
