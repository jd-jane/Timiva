/**
 * Taiwan Annual Leave Calculator — B2B Desktop interaction.
 * Math SSOT: taiwanAnnualLeaveMath（primaryDisplay／officialDays；禁用 rawDays 當主結果）.
 * Smart Date: taiwanAnnualLeaveDateInput；Calendar: shared DesktopCalendar.
 */
	import {
	applySegmentInputChange,
	emptyDateSegments,
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

	root.setAttribute("data-talc-phase", "b2b-desktop");
	/* B2B：talcFixture 不再影響 production live */
	root.removeAttribute("data-talc-fixture");

	const resultRoot = root.querySelector<HTMLElement>("[data-result-summary]");
	const definitionEl = root.querySelector<HTMLElement>("[data-talc-definition]");
	const infoBtn = root.querySelector<HTMLButtonElement>("[data-talc-info]");
	const infoPanel = root.querySelector<HTMLElement>("[data-talc-info-panel]");
	const supportEl = root.querySelector<HTMLElement>("[data-talc-support]");
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

	let segments: DateSegments = emptyDateSegments();
	let leaveSystem: LeaveSystem = "anniversary";
	let formulaExpanded = false;
	let calendarApi: DesktopCalendarApi | null = null;
	let lastFormulaLines: string[] = [];

	const syncLeaveButtons = () => {
		const isAnn = leaveSystem === "anniversary";
		anniversaryBtn.classList.toggle("is-active", isAnn);
		calendarBtn.classList.toggle("is-active", !isAnn);
		anniversaryBtn.setAttribute("aria-pressed", isAnn ? "true" : "false");
		calendarBtn.setAttribute("aria-pressed", isAnn ? "false" : "true");
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
		setText(supportEl, i18n.resultInitialSupport);
		setHidden(infoBtn, true);
		if (infoBtn) infoBtn.disabled = true;
		setInfoPanelOpen(false);
		renderFormulaLines([]);
		setInvalidVisible(status === "invalid");
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
			let support = line1;
			if (outcome.isMax) {
				support = `${line1}\n${i18n.supportMaxReached}`;
			} else if (outcome.next) {
				support = `${line1}\n${fillTemplate(i18n.supportNextStage, {
					date: formatCivilDateSlash(outcome.next.date),
					days: outcome.next.days,
				})}`;
			}
			setText(supportEl, support);
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
			setText(supportEl, `${line1}\n${line2}`);
			if (tipEl) tipEl.textContent = i18n.calendarYearTip;
			setHidden(infoBtn, false);
			if (infoBtn) infoBtn.disabled = false;
			renderFormulaLines(outcome.formulaLines);
			setInfoPanelOpen(formulaExpanded);
		}

		setInvalidVisible(false);
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

	anniversaryBtn.addEventListener("click", () => setLeaveSystem("anniversary"));
	calendarBtn.addEventListener("click", () => setLeaveSystem("calendar-year"));

	resetBtn.addEventListener("click", () => {
		segments = emptyDateSegments();
		leaveSystem = "anniversary";
		setInfoPanelOpen(false);
		clearStorage();
		syncInputDisplay(false);
		calendarApi?.close();
		publish();
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

	/* Restore from LocalStorage（共用 EN/ZH）；以 today 重算 */
	const stored = readStorage();
	if (stored) {
		const hire = parseStoredHire(stored.hireDate);
		if (hire) {
			segments = segmentsFromCalendarDate(hire);
			leaveSystem = stored.leaveSystem;
			syncInputDisplay(true);
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
