/**
 * Taiwan Annual Leave Calculator — B2B Desktop + B2C Mobile AME.
 * Math SSOT: taiwanAnnualLeaveMath（primaryDisplay／officialDays；禁用 rawDays 當主結果）.
 * Smart Date: taiwanAnnualLeaveDateInput；Calendar: shared DesktopCalendar.
 * Mobile: shared AME live + Numeric Keypad YMD segments；reopen 保留 incomplete／invalid.
 */
import {
	applySegmentInputChange,
	emptyDateSegments,
	formatCalendarDateCompact,
	formatSegmentsDisplay,
	formatSegmentsNormalized,
	getTodayCalendarDate,
	isSelectableHireDate,
	MIN_DATE_YEAR,
	normalizeSegmentsForBlur,
	parseDateSegments,
	resolveFieldStatus,
	segmentsFromCalendarDate,
	segmentsFromPastedText,
	type CalendarDate,
	type DateSegments,
	type FieldStatus,
} from "../lib/taiwanAnnualLeaveDateInput.ts";
import {
	evaluateCalendarYear,
	evaluateTaiwanAnnualLeave,
	formatCivilDateSlash,
	formatLeaveDisplay,
	formatTenureDisplay,
	seniorityParts,
	type LeaveSystem,
	type MathLocale,
} from "../lib/taiwanAnnualLeaveMath.ts";
import {
	acceptTalcAmeNumericCandidate,
	draftFromSegments,
	emptyTalcAmeDraft,
	focusTalcAmeField,
	segmentsFromDraft,
	syncTalcAmeSegmentUi,
	takeTalcAmePending,
	TALC_AME_NUMERIC_FIELDS,
	validateTalcAmeDraft,
	type TalcAmeDraft,
	type TalcAmePlaceholders,
} from "./taiwan-annual-leave-ame-adapter.ts";
import {
	createAdaptiveMobileEditor,
	type AdaptiveMobileEditorController,
} from "./adaptive-mobile-editor-controller";
import {
	createDesktopCalendar,
	type DesktopCalendarApi,
} from "./desktop-calendar-controller";
import { update as updateResultSummary } from "./result-summary-controller";

const STORAGE_KEY = "timiva:talc:v1";

type TalcClientI18n = {
	locale: MathLocale;
	intlLocale: string;
	resultPlaceholder: string;
	resultAriaLabel: string;
	definitionAnniversary: string;
	resultInitialSupport: string;
	calendarYearTip: string;
	formulaHeading: string;
	infoAriaLabel: string;
	invalidHireDate: string;
	openCalendarAriaLabel: string;
	capsulePlaceholder: string;
	calendarLabel: string;
	previousMonth: string;
	nextMonth: string;
	monthFieldLabel: string;
	yearFieldLabel: string;
	weekdays: string[];
	supportHireTenure: string;
	supportNextStage: string;
	supportNextStageCalendarYear: string;
	supportMaxReached: string;
};

type StoredState = {
	hireDate: string;
	leaveSystem: LeaveSystem;
};

const initializedRoots = new WeakSet<HTMLElement>();

function fillTemplate(
	template: string,
	values: Record<string, string | number>,
): string {
	return template.replace(/\{(\w+)\}/g, (_, key: string) => {
		const value = values[key];
		return value === undefined || value === null ? "" : String(value);
	});
}

function readClientI18n(root: HTMLElement): TalcClientI18n | null {
	const raw = root.dataset.talcClientI18n;
	if (!raw) return null;
	try {
		return JSON.parse(raw) as TalcClientI18n;
	} catch {
		return null;
	}
}

function parseStoredHire(iso: string): CalendarDate | null {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
	if (!match) return null;
	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const date = { year, month, day };
	return isSelectableHireDate(date) ? date : null;
}

function toIso(date: CalendarDate): string {
	return `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
}

function readStorage(): StoredState | null {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as Partial<StoredState>;
		if (
			parsed.leaveSystem !== "anniversary" &&
			parsed.leaveSystem !== "calendar-year"
		) {
			return null;
		}
		if (typeof parsed.hireDate !== "string") return null;
		const hire = parseStoredHire(parsed.hireDate);
		if (!hire) return null;
		return { hireDate: toIso(hire), leaveSystem: parsed.leaveSystem };
	} catch {
		return null;
	}
}

function writeStorage(hire: CalendarDate, leaveSystem: LeaveSystem): void {
	try {
		const payload: StoredState = {
			hireDate: toIso(hire),
			leaveSystem,
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
	} catch {
		/* storage failure → ignore */
	}
}

function clearStorage(): void {
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch {
		/* ignore */
	}
}

function setText(el: Element | null, text: string): void {
	if (el) el.textContent = text;
}

function setHidden(el: HTMLElement | null, hidden: boolean): void {
	if (!el) return;
	el.hidden = hidden;
}

function initRoot(root: HTMLElement): void {
	if (initializedRoots.has(root)) return;
	const i18n = readClientI18n(root);
	if (!i18n) return;
	initializedRoots.add(root);

	root.setAttribute("data-talc-phase", "b2c-mobile");
	/* fixtures 不再影響 production live */
	root.removeAttribute("data-talc-fixture");

	const resultRoot = root.querySelector<HTMLElement>("[data-result-summary]");
	const definitionEl = root.querySelector<HTMLElement>("[data-talc-definition]");
	const infoBtn = root.querySelector<HTMLButtonElement>("[data-talc-info]");
	const infoPanel = root.querySelector<HTMLElement>("[data-talc-info-panel]");
	const supportLine1 = root.querySelector<HTMLElement>('[data-talc-support-line="1"]');
	const supportLine2 = root.querySelector<HTMLElement>('[data-talc-support-line="2"]');

	const setSupportLines = (line1: string, line2: string | null = null) => {
		setText(supportLine1, line1);
		if (line2) {
			setText(supportLine2, line2);
			setHidden(supportLine2, false);
		} else {
			setText(supportLine2, "");
			setHidden(supportLine2, true);
		}
	};
	const tipEl = root.querySelector<HTMLElement>("[data-talc-tip]");
	const formulaLinesEl = root.querySelector<HTMLElement>("[data-talc-formula-lines]");
	const dateInput = root.querySelector<HTMLInputElement>("[data-talc-date-value]");
	const calendarToggle = root.querySelector<HTMLButtonElement>("[data-talc-calendar-toggle]");
	const datePill = root.querySelector<HTMLElement>("[data-talc-date-pill]");
	const invalidIcon = root.querySelector<HTMLElement>("[data-talc-date-invalid]");
	const resetBtn = root.querySelector<HTMLButtonElement>("[data-talc-reset]");
	const anniversaryBtn = root.querySelector<HTMLButtonElement>(
		'[data-talc-leave="anniversary"]',
	);
	const calendarBtn = root.querySelector<HTMLButtonElement>(
		'[data-talc-leave="calendar-year"]',
	);
	const calendarRoot = document.querySelector<HTMLElement>(
		"#talc-calendar-popover[data-desktop-calendar]",
	);

	if (!resultRoot || !dateInput || !anniversaryBtn || !calendarBtn || !resetBtn) {
		return;
	}

	const capsuleBtn = root.querySelector<HTMLButtonElement>("[data-talc-capsule]");
	const capsuleLabel = root.querySelector<HTMLElement>("[data-talc-capsule-label]");
	const ameRoot = document.querySelector<HTMLElement>("#talc-ame[data-ame-root]");
	const pageContent = root.querySelector<HTMLElement>("[data-ame-page-content]");
	const ameForm = ameRoot?.querySelector<HTMLElement>("[data-talc-ame-form]");
	const ameAnniversaryBtn = ameRoot?.querySelector<HTMLButtonElement>(
		'[data-talc-ame-leave="anniversary"]',
	);
	const ameCalendarBtn = ameRoot?.querySelector<HTMLButtonElement>(
		'[data-talc-ame-leave="calendar-year"]',
	);

	let segments: DateSegments = emptyDateSegments();
	let leaveSystem: LeaveSystem = "anniversary";
	let formulaExpanded = false;
	let calendarApi: DesktopCalendarApi | null = null;
	let lastFormulaLines: string[] = [];
	let ameApi: AdaptiveMobileEditorController<TalcAmeDraft> | null = null;

	const amePlaceholders: TalcAmePlaceholders = {
		year: ameForm?.getAttribute("data-talc-ymd-year-ph") || "YYYY",
		month: ameForm?.getAttribute("data-talc-ymd-month-ph") || "MM",
		day: ameForm?.getAttribute("data-talc-ymd-day-ph") || "DD",
	};

	const syncLeaveButtons = () => {
		const isAnn = leaveSystem === "anniversary";
		anniversaryBtn.classList.toggle("is-active", isAnn);
		calendarBtn.classList.toggle("is-active", !isAnn);
		anniversaryBtn.setAttribute("aria-pressed", isAnn ? "true" : "false");
		calendarBtn.setAttribute("aria-pressed", isAnn ? "false" : "true");
		ameAnniversaryBtn?.classList.toggle("is-active", isAnn);
		ameCalendarBtn?.classList.toggle("is-active", !isAnn);
		ameAnniversaryBtn?.setAttribute("aria-pressed", isAnn ? "true" : "false");
		ameCalendarBtn?.setAttribute("aria-pressed", isAnn ? "false" : "true");
	};

	const capsuleEmptyLabel = i18n.capsulePlaceholder;

	const syncCapsule = () => {
		if (!capsuleLabel) return;
		const status = resolveFieldStatus(segments);
		if (status === "valid") {
			const hire = parseDateSegments(segments);
			capsuleLabel.textContent = hire
				? formatCalendarDateCompact(hire)
				: capsuleEmptyLabel;
			return;
		}
		if (status === "empty") {
			capsuleLabel.textContent = capsuleEmptyLabel;
			return;
		}
		/* incomplete／invalid：保留目前 segments 顯示 */
		const yearPart = segments.year ? segments.year.padStart(4, "0") : "————";
		const monthPart = segments.month ? segments.month.padStart(2, "0") : "——";
		const dayPart = segments.day ? segments.day.padStart(2, "0") : "——";
		capsuleLabel.textContent = `${yearPart}/${monthPart}/${dayPart}`;
	};

	const syncAmeSegmentDisplay = (draft?: TalcAmeDraft) => {
		if (!ameRoot) return;
		syncTalcAmeSegmentUi(
			ameRoot,
			draft ?? draftFromSegments(segments, leaveSystem),
			amePlaceholders,
		);
	};

	const syncInputDisplay = (normalized = false) => {
		const text = normalized
			? formatSegmentsNormalized(segments)
			: formatSegmentsDisplay(segments);
		dateInput.value = text;
	};

	const setInvalidVisible = (visible: boolean) => {
		setHidden(invalidIcon, !visible);
		dateInput.setAttribute("aria-invalid", visible ? "true" : "false");
	};

	const renderFormulaLines = (lines: string[]) => {
		lastFormulaLines = lines;
		if (!formulaLinesEl) return;
		formulaLinesEl.replaceChildren();
		for (const line of lines) {
			const li = document.createElement("li");
			li.textContent = line;
			formulaLinesEl.appendChild(li);
		}
	};

	const setInfoPanelOpen = (open: boolean) => {
		formulaExpanded = open;
		infoPanel?.classList.toggle("is-open", open);
		infoPanel?.setAttribute("aria-hidden", open ? "false" : "true");
		if (infoPanel) {
			if (open) infoPanel.removeAttribute("inert");
			else infoPanel.setAttribute("inert", "");
		}
		infoBtn?.setAttribute("aria-expanded", open ? "true" : "false");
	};

	const applyIdleResult = (status: FieldStatus) => {
		updateResultSummary(resultRoot, {
			content: "textual",
			primary: {
				text: i18n.resultPlaceholder,
				ariaLabel: i18n.resultAriaLabel,
			},
			weekday: null,
			support: null,
		});
		setText(definitionEl, i18n.definitionAnniversary);
		setSupportLines(i18n.resultInitialSupport);
		setHidden(infoBtn, true);
		if (infoBtn) infoBtn.disabled = true;
		setInfoPanelOpen(false);
		renderFormulaLines([]);
		setInvalidVisible(status === "invalid");
		syncCapsule();
	};

	const applyValidResult = (hire: CalendarDate) => {
		const today = getTodayCalendarDate();
		if (hire.year > today.year || compareHireAfterToday(hire, today)) {
			applyIdleResult("invalid");
			return;
		}

		const outcome = evaluateTaiwanAnnualLeave({
			hire,
			asOf: today,
			leaveSystem,
			locale: i18n.locale,
		});

		/* UI 契約：主結果只用 primaryDisplay；數值用 officialDays；禁用 rawDays */
		updateResultSummary(resultRoot, {
			content: "textual",
			primary: {
				text: outcome.primaryDisplay,
				ariaLabel: `${outcome.primaryDisplay} · ${i18n.resultAriaLabel}`,
			},
			weekday: null,
			support: null,
		});

		const hireLabel = formatCivilDateSlash(hire);
		setText(definitionEl, i18n.definitionAnniversary);

		if (outcome.status === "anniversary") {
			const tenureText = formatTenureDisplay(outcome.tenure, i18n.locale);
			const line1 = fillTemplate(i18n.supportHireTenure, {
				date: hireLabel,
				tenure: tenureText,
			});
			if (outcome.isMax) {
				setSupportLines(line1, i18n.supportMaxReached);
			} else if (outcome.next) {
				setSupportLines(
					line1,
					fillTemplate(i18n.supportNextStage, {
						date: formatCivilDateSlash(outcome.next.date),
						days: outcome.next.days,
					}),
				);
			} else {
				setSupportLines(line1);
			}
			setHidden(infoBtn, true);
			if (infoBtn) infoBtn.disabled = true;
			setInfoPanelOpen(false);
			renderFormulaLines([]);
		} else {
			const tenureNow = seniorityParts(hire, today);
			const tenureText = formatTenureDisplay(tenureNow, i18n.locale);
			const line1 = fillTemplate(i18n.supportHireTenure, {
				date: hireLabel,
				tenure: tenureText,
			});
			const nextYear = today.year + 1;
			const nextYearResult = evaluateCalendarYear(hire, nextYear, i18n.locale);
			const nextDays = formatLeaveDisplay(nextYearResult.officialDays);
			const line2 = fillTemplate(i18n.supportNextStageCalendarYear, {
				year: nextYear,
				days: nextDays,
			});
			setSupportLines(line1, line2);
			if (tipEl) tipEl.textContent = i18n.calendarYearTip;
			setHidden(infoBtn, false);
			if (infoBtn) infoBtn.disabled = false;
			renderFormulaLines(outcome.formulaLines);
			setInfoPanelOpen(formulaExpanded);
		}

		setInvalidVisible(false);
		syncCapsule();
		void outcome.officialDays;
		writeStorage(hire, leaveSystem);
	};

	function compareHireAfterToday(hire: CalendarDate, today: CalendarDate): boolean {
		if (hire.year !== today.year) return hire.year > today.year;
		if (hire.month !== today.month) return hire.month > today.month;
		return hire.day > today.day;
	}

	const publish = () => {
		syncLeaveButtons();
		const status = resolveFieldStatus(segments);
		if (status === "empty" || status === "incomplete") {
			applyIdleResult(status);
			return;
		}
		if (status === "invalid") {
			applyIdleResult("invalid");
			return;
		}
		const hire = parseDateSegments(segments);
		if (!hire) {
			applyIdleResult("invalid");
			return;
		}
		applyValidResult(hire);
	};

	const processInputChange = (
		inputType: string,
		data: string | null,
		selectionStart: number | null,
		selectionEnd: number | null,
	) => {
		const formatted = formatSegmentsDisplay(segments);
		let start = selectionStart ?? formatted.length;
		let end = selectionEnd ?? start;
		let type = inputType;

		if (
			(type === "deleteContentBackward" || type === "deleteContentForward") &&
			start === 0 &&
			end >= formatted.length &&
			formatted.length > 0
		) {
			type = "clearAll";
		}

		if (segments.preferStream && type === "insertText") {
			start = formatted.length;
			end = formatted.length;
		}

		const result = applySegmentInputChange(segments, type, data, start, end);
		segments = result.segments;
		syncInputDisplay(false);
		const caret = result.caret;
		requestAnimationFrame(() => {
			try {
				dateInput.setSelectionRange(caret, caret);
			} catch {
				/* ignore */
			}
		});
		publish();
		if (calendarApi?.isOpen()) calendarApi.refresh();
	};

	dateInput.addEventListener("beforeinput", (event) => {
		const e = event as InputEvent;
		if (e.inputType === "insertText" && e.data && !/^[\d/-]$/.test(e.data)) {
			e.preventDefault();
			return;
		}
		if (
			e.inputType === "insertText" ||
			e.inputType === "deleteContentBackward" ||
			e.inputType === "deleteContentForward"
		) {
			e.preventDefault();
			processInputChange(
				e.inputType,
				e.data ?? null,
				dateInput.selectionStart,
				dateInput.selectionEnd,
			);
		}
	});

	dateInput.addEventListener("paste", (event) => {
		event.preventDefault();
		const text = event.clipboardData?.getData("text") ?? "";
		const next = segmentsFromPastedText(text);
		segments = next;
		syncInputDisplay(false);
		publish();
		if (calendarApi?.isOpen()) calendarApi.refresh();
	});

	dateInput.addEventListener("blur", () => {
		segments = normalizeSegmentsForBlur(segments);
		syncInputDisplay(true);
		publish();
	});

	const setLeaveSystem = (next: LeaveSystem) => {
		if (leaveSystem === next) return;
		leaveSystem = next;
		if (next === "anniversary") {
			setInfoPanelOpen(false);
		}
		publish();
		const hire = parseDateSegments(segments);
		if (hire) writeStorage(hire, leaveSystem);
	};

	const resetAll = () => {
		segments = emptyDateSegments();
		leaveSystem = "anniversary";
		setInfoPanelOpen(false);
		clearStorage();
		syncInputDisplay(false);
		syncAmeSegmentDisplay(emptyTalcAmeDraft());
		calendarApi?.close();
		publish();
		/* live：若 AME 開著，走 shared Reset draft path（不 rollback 語意） */
		if (ameApi?.isOpen()) {
			ameApi.resetDraft();
		}
	};

	anniversaryBtn.addEventListener("click", () => setLeaveSystem("anniversary"));
	calendarBtn.addEventListener("click", () => setLeaveSystem("calendar-year"));

	resetBtn.addEventListener("click", () => {
		resetAll();
	});

	infoBtn?.addEventListener("click", () => {
		if (leaveSystem !== "calendar-year") return;
		if (resolveFieldStatus(segments) !== "valid") return;
		setInfoPanelOpen(!formulaExpanded);
		if (formulaExpanded && lastFormulaLines.length === 0) {
			publish();
		}
	});

	if (calendarRoot && calendarToggle && datePill) {
		calendarApi = createDesktopCalendar({
			root: calendarRoot,
			variant: "popover-compact",
			selectionMode: "single",
			intlLocale: i18n.intlLocale,
			yearList: {
				min: MIN_DATE_YEAR,
				max: getTodayCalendarDate().year,
				mode: "full",
			},
			getMinDate: () => ({ year: MIN_DATE_YEAR, month: 1, day: 1 }),
			getMaxDate: () => getTodayCalendarDate(),
			isDateSelectable: (date) => isSelectableHireDate(date, getTodayCalendarDate()),
			getSelection: () => ({
				start: parseDateSegments(segments),
				end: null,
			}),
			onSelect: ({ date }) => {
				segments = segmentsFromCalendarDate(date);
				syncInputDisplay(true);
				publish();
				return { shouldClose: true };
			},
			getTrigger: () => calendarToggle,
			getPositionAnchor: () => datePill,
			placement: "above",
			/**
			 * 小日曆左緣對齊日期 icon 左緣（可略遮結果區）。
			 */
			resolvePopoverPosition: ({
				width,
				height,
				gap,
				viewportPad,
				viewportWidth,
				viewportHeight,
				anchor,
				trigger,
			}) => {
				const iconRect =
					trigger?.getBoundingClientRect() ??
					calendarToggle.getBoundingClientRect();
				const anchorRect = anchor?.getBoundingClientRect();
				if (!iconRect && !anchorRect) return undefined;

				const refTop = (anchorRect ?? iconRect).top;
				let left = iconRect.left;
				let top = refTop - gap - height;
				if (top < viewportPad) {
					top = Math.max(
						viewportPad,
						Math.min(refTop - height - 8, viewportHeight - height - viewportPad),
					);
				}

				left = Math.max(viewportPad, Math.min(left, viewportWidth - width - viewportPad));
				top = Math.max(viewportPad, Math.min(top, viewportHeight - height - viewportPad));
				return { left, top };
			},
			onOpenChange: (open) => {
				calendarToggle.setAttribute("aria-expanded", open ? "true" : "false");
			},
		});

		calendarToggle.addEventListener("click", (event) => {
			event.preventDefault();
			event.stopPropagation();
			if (calendarApi?.isOpen()) {
				calendarApi.close();
				return;
			}
			calendarApi?.open();
		});
	}

	/* B2C：shared AME live + Numeric Keypad YMD（reopen 保留目前 segments） */
	if (ameRoot && pageContent) {
		/* Shared chrome Reset／Done：本地化 Reset 文案（對齊 Hours） */
		ameRoot.querySelectorAll<HTMLElement>("[data-ame-reset]").forEach((el) => {
			el.textContent = root.querySelector("[data-talc-reset]")?.textContent?.trim() || "Reset";
		});

		const applyDraftToPage = (draft: TalcAmeDraft) => {
			segments = segmentsFromDraft(draft);
			const nextLeave =
				draft.leaveSystem === "calendar-year" ? "calendar-year" : "anniversary";
			if (leaveSystem !== nextLeave && nextLeave === "anniversary") {
				setInfoPanelOpen(false);
			}
			leaveSystem = nextLeave;
			syncInputDisplay(false);
			publish();
		};

		const applyPendingAdvance = () => {
			const pending = takeTalcAmePending();
			if (!pending || !ameRoot) return;
			queueMicrotask(() => {
				if (!ameApi?.isOpen()) return;
				focusTalcAmeField(ameRoot, pending.advanceTo);
			});
		};

		ameApi = createAdaptiveMobileEditor<TalcAmeDraft>(ameRoot, {
			pageContent,
			numericFields: [...TALC_AME_NUMERIC_FIELDS],
			/* 開啟不自動 focus field → keypad 維持 closed（對齊 Hours） */
			activateFirstNumericOnOpen: () => false,
			adapter: {
				lifecycle: "live",
				getCommitted: () => draftFromSegments(segments, leaveSystem),
				getResetDraft: () => emptyTalcAmeDraft(),
				/* 不覆寫 createOpenDraft → open 用 getCommitted clone，保留 incomplete／invalid */
				validate: (draft) => validateTalcAmeDraft(draft, i18n.invalidHireDate),
				acceptNumericCandidate: ({ fieldId, currentValue, candidateValue }) =>
					acceptTalcAmeNumericCandidate({
						fieldId,
						currentValue,
						candidateValue,
					}),
				onCommit: (draft) => {
					applyDraftToPage(draft);
				},
				onDraftChange: (draft) => {
					syncTalcAmeSegmentUi(ameRoot, draft, amePlaceholders);
					applyPendingAdvance();
				},
			},
			onSyncUi: (draft) => {
				syncTalcAmeSegmentUi(ameRoot, draft, amePlaceholders);
			},
		});

		ameAnniversaryBtn?.addEventListener("click", () => {
			ameApi?.patchDraft({ leaveSystem: "anniversary" });
		});
		ameCalendarBtn?.addEventListener("click", () => {
			ameApi?.patchDraft({ leaveSystem: "calendar-year" });
		});

		/* Shared AME Reset：draft 由 controller reset；此處補 storage／calendar／info */
		ameRoot.addEventListener(
			"click",
			(event) => {
				const target = event.target;
				if (!(target instanceof Element)) return;
				const resetEl = target.closest<HTMLElement>("[data-ame-reset]");
				if (!resetEl || !ameRoot.contains(resetEl)) return;
				clearStorage();
				setInfoPanelOpen(false);
				calendarApi?.close();
			},
			true,
		);

		capsuleBtn?.addEventListener("click", () => {
			syncLeaveButtons();
			syncAmeSegmentDisplay();
			ameApi?.open(capsuleBtn);
			/* open 會 clear fieldErrors；再 patch 一次以還原 invalid field state */
			ameApi?.patchDraft(draftFromSegments(segments, leaveSystem));
		});
	}

	/* Restore from LocalStorage（共用 EN/ZH）；以 today 重算 */
	const stored = readStorage();
	if (stored) {
		const hire = parseStoredHire(stored.hireDate);
		if (hire) {
			segments = segmentsFromCalendarDate(hire);
			leaveSystem = stored.leaveSystem;
			syncInputDisplay(true);
			syncAmeSegmentDisplay();
		}
	}

	publish();
}

function boot(): void {
	const roots = document.querySelectorAll<HTMLElement>(
		"[data-taiwan-annual-leave-calculator-v2]",
	);
	roots.forEach((root) => initRoot(root));
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
	boot();
}
