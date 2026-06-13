/* ------------------------------
   Date Range Calculator 狀態
------------------------------ */

let viewYear = new Date().getFullYear();
let viewMonth = new Date().getMonth();

/** @type {Date | null} */
let rangeStart = null;

/** @type {Date | null} */
let rangeEnd = null;

const DESKTOP_MEDIA = window.matchMedia(
  "(min-width: 900px) and (min-height: 700px) and (hover: hover)"
);

const LANDSCAPE_DATE_MEDIA = window.matchMedia(
  "(orientation: landscape) and (max-height: 700px) and (max-width: 1200px)"
);

let savedScrollY = 0;
let lastLayoutMode = null;

const DR_JS_VERSION = "dr13";

function loadDateRangeI18n() {
  const fallback = {
    locale: "en",
    dateRangePlaceholder: "Start date — End date",
    startDate: "Start date",
    endDate: "End date",
    chooseDateRange: "Choose date range",
    changeDateRange: "Change date range",
    calendarLabel: "Date range calendar",
    intlLocale: "en-US",
  };

  try {
    const node = document.getElementById("date-range-i18n");
    if (!node?.textContent) {
      return fallback;
    }

    return { ...fallback, ...JSON.parse(node.textContent) };
  } catch {
    return fallback;
  }
}

const dateRangeI18n = loadDateRangeI18n();

const dateRangePage =
  document.querySelector("#date-range-page");

if (dateRangePage) {
  dateRangePage.dataset.drJs = DR_JS_VERSION;
}

const calendarGrid =
  document.querySelector("#calendar-grid");

const monthLabel =
  document.querySelector("#month-label");

const prevMonthButton =
  document.querySelector("#prev-month");

const nextMonthButton =
  document.querySelector("#next-month");

const clearButtons =
  document.querySelectorAll("[data-clear-dates]");

const statTotal =
  document.querySelector("#stat-total");

const statWorkdays =
  document.querySelector("#stat-workdays");

const statWeekends =
  document.querySelector("#stat-weekends");

const rangeDisplayText =
  document.querySelector("#range-display-text");

const rangeDisplayTextDesktop =
  document.querySelector("#range-display-text-desktop");

const rangeDisplayTrigger =
  document.querySelector("#range-display-trigger");

const rangeSheet =
  document.querySelector("#range-sheet");

const rangeSheetBackdrop =
  document.querySelector("#range-sheet-backdrop");

const rangeLandscapePanel =
  document.querySelector("#range-landscape-panel");

const rangeCompactOverlay =
  document.querySelector("#range-compact-overlay");

const rangeLandscapeStart =
  document.querySelector("#range-landscape-start");

const rangeLandscapeEnd =
  document.querySelector("#range-landscape-end");


/* ------------------------------
   日期工具函式（原生 JS，不含外部套件）
------------------------------ */

function createLocalDate(year, month, day) {
  return new Date(year, month, day);
}

function cloneDateOnly(date) {
  return createLocalDate(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function normalizeRange(start, end) {
  const startTime = start.getTime();
  const endTime = end.getTime();

  if (startTime <= endTime) {
    return { start, end };
  }

  return { start: end, end: start };
}

function isDateInRange(date, start, end) {
  const value = cloneDateOnly(date).getTime();
  const startValue = cloneDateOnly(start).getTime();
  const endValue = cloneDateOnly(end).getTime();

  return value >= startValue && value <= endValue;
}

function countTotalDays(start, end) {
  const diff =
    cloneDateOnly(end).getTime() - cloneDateOnly(start).getTime();

  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

function countWorkdaysAndWeekends(start, end) {
  let workdays = 0;
  let weekends = 0;

  const cursor = cloneDateOnly(start);
  const last = cloneDateOnly(end);

  while (cursor.getTime() <= last.getTime()) {
    const weekday = cursor.getDay();

    if (weekday === 0 || weekday === 6) {
      weekends += 1;
    } else {
      workdays += 1;
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return { workdays, weekends };
}

function formatDisplayDate(date) {
  return new Intl.DateTimeFormat(dateRangeI18n.intlLocale, {
    year: "numeric",
    month: dateRangeI18n.locale === "zh" ? "long" : "short",
    day: "numeric",
  }).format(date);
}

function formatMonthLabel(year, month) {
  const date = createLocalDate(year, month, 1);

  if (dateRangeI18n.locale === "zh") {
    return new Intl.DateTimeFormat(dateRangeI18n.intlLocale, {
      year: "numeric",
      month: "long",
    }).format(date);
  }

  return new Intl.DateTimeFormat(dateRangeI18n.intlLocale, {
    month: "long",
    year: "numeric",
  }).format(date);
}

function getRangeDisplayCopy() {
  if (!rangeStart) {
    return dateRangeI18n.dateRangePlaceholder;
  }

  if (!rangeEnd) {
    return `${formatDisplayDate(rangeStart)} — ${dateRangeI18n.endDate}`;
  }

  return `${formatDisplayDate(rangeStart)} — ${formatDisplayDate(rangeEnd)}`;
}

function hasCompleteRange() {
  return Boolean(rangeStart && rangeEnd);
}

function isMobileLayout() {
  return !DESKTOP_MEDIA.matches;
}

function isLandscapeDateMode() {
  return isMobileLayout() && LANDSCAPE_DATE_MEDIA.matches;
}

function getDateRangeLayoutMode() {
  if (!isMobileLayout()) {
    return "desktop";
  }

  if (LANDSCAPE_DATE_MEDIA.matches) {
    return "landscape-date";
  }

  return "portrait";
}

function formatInputDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseInputDate(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const parsed = createLocalDate(year, month, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return cloneDateOnly(parsed);
}

function syncLandscapeInputsFromState() {
  if (!rangeLandscapeStart || !rangeLandscapeEnd) {
    return;
  }

  rangeLandscapeStart.value = rangeStart ? formatInputDate(rangeStart) : "";
  rangeLandscapeEnd.value = rangeEnd ? formatInputDate(rangeEnd) : "";
}

function applyLandscapeInputsToRange() {
  if (!isLandscapeDateMode()) {
    return;
  }

  rangeStart = parseInputDate(rangeLandscapeStart?.value ?? "");
  rangeEnd = parseInputDate(rangeLandscapeEnd?.value ?? "");

  if (rangeStart && rangeEnd) {
    const normalized = normalizeRange(rangeStart, rangeEnd);
    rangeStart = normalized.start;
    rangeEnd = normalized.end;
    syncLandscapeInputsFromState();
  }

  updateStats();
  renderCalendar();

  if (hasCompleteRange()) {
    closeCompactDatePanel();
    rangeDisplayTrigger?.focus();
  }
}

function syncLayoutMode() {
  if (!dateRangePage) {
    return;
  }

  const mode = getDateRangeLayoutMode();
  dateRangePage.dataset.rangeLayout = mode;

  if (mode === "landscape-date") {
    rangeDisplayTrigger?.setAttribute("aria-controls", "range-landscape-panel");
    rangeDisplayTrigger?.setAttribute("aria-haspopup", "true");
  } else if (isMobileLayout()) {
    rangeDisplayTrigger?.setAttribute("aria-controls", "range-sheet");
    rangeDisplayTrigger?.setAttribute("aria-haspopup", "dialog");
  }
}

function forceUnlockBodyScroll() {
  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";

  dateRangePage?.classList.remove("date-range-scroll-lock", "tool-operation-open");
  document.body.classList.remove(
    "tool-operation-open",
    "range-sheet-open",
    "tool-sheet-open"
  );

  const restoreY = savedScrollY;
  savedScrollY = 0;

  requestAnimationFrame(() => {
    window.scrollTo(0, restoreY);
  });
}

function closeCompactDatePanel() {
  rangeLandscapePanel?.setAttribute("hidden", "");
  rangeCompactOverlay?.classList.remove("is-visible");
  rangeCompactOverlay?.setAttribute("hidden", "");
  rangeCompactOverlay?.setAttribute("aria-hidden", "true");
  dateRangePage?.classList.remove("date-range-compact-open");

  if (!rangeSheet?.classList.contains("is-open")) {
    forceUnlockBodyScroll();
  }
}

function isCompactDatePanelOpen() {
  return Boolean(
    rangeLandscapePanel && !rangeLandscapePanel.hasAttribute("hidden")
  );
}

function openCompactDatePanel() {
  if (!isLandscapeDateMode() || !rangeLandscapePanel) {
    return;
  }

  closeRangeSheetFully();
  rangeCompactOverlay?.removeAttribute("hidden");
  rangeCompactOverlay?.classList.add("is-visible");
  rangeCompactOverlay?.setAttribute("aria-hidden", "false");
  rangeLandscapePanel.removeAttribute("hidden");
  dateRangePage?.classList.add("date-range-compact-open");
  lockBodyScroll();
  syncLandscapeInputsFromState();
  rangeLandscapeStart?.focus();
}

function toggleCompactDatePanel() {
  if (isCompactDatePanelOpen()) {
    closeCompactDatePanel();
    rangeDisplayTrigger?.focus();
    return;
  }

  openCompactDatePanel();
}

function closeRangeSheetFully() {
  rangeSheet?.classList.remove("is-open");
  rangeSheetBackdrop?.classList.remove("is-visible");
  rangeSheetBackdrop?.setAttribute("aria-hidden", "true");
  dateRangePage?.classList.remove("sheet-open", "tool-sheet-open", "date-range-scroll-lock");
  forceUnlockBodyScroll();
  syncSheetAccessibility();
}

function finalizePortraitReset() {
  closeCompactDatePanel();
  closeRangeSheetFully();
  syncLandscapeInputsFromState();
  syncLayoutMode();
  lastLayoutMode = "portrait";

  requestAnimationFrame(() => {
    window.scrollTo(0, 0);
  });
}

function resetDateRangeLayoutOnModeChange() {
  if (getDateRangeLayoutMode() === "portrait") {
    finalizePortraitReset();
    return;
  }

  if (getDateRangeLayoutMode() === "landscape-date") {
    closeRangeSheetFully();
    if (!LANDSCAPE_DATE_MEDIA.matches) {
      closeCompactDatePanel();
    }
    syncLandscapeInputsFromState();
    syncLayoutMode();
    return;
  }

  closeCompactDatePanel();
  closeRangeSheetFully();
  syncLayoutMode();
}

function handleLayoutTransition() {
  const mode = getDateRangeLayoutMode();
  const modeChanged = lastLayoutMode !== null && lastLayoutMode !== mode;

  if (modeChanged) {
    resetDateRangeLayoutOnModeChange();
  } else {
    syncLayoutMode();
    syncSheetAccessibility();
  }

  lastLayoutMode = mode;
}

function scheduleLayoutTransitionAfterOrientation() {
  handleLayoutTransition();

  window.setTimeout(() => {
    handleLayoutTransition();
    if (getDateRangeLayoutMode() === "portrait") {
      finalizePortraitReset();
    }
  }, 200);

  window.setTimeout(() => {
    if (getDateRangeLayoutMode() === "portrait") {
      finalizePortraitReset();
    }
  }, 550);
}


/* ------------------------------
   統計區與日期區間列更新
------------------------------ */

function updateRangeDisplay() {
  const copy = getRangeDisplayCopy();

  if (rangeDisplayText) {
    rangeDisplayText.textContent = copy;
  }

  if (rangeDisplayTextDesktop) {
    rangeDisplayTextDesktop.textContent = copy;
  }

  if (rangeDisplayTrigger) {
    rangeDisplayTrigger.setAttribute(
      "aria-label",
      hasCompleteRange()
        ? dateRangeI18n.changeDateRange
        : dateRangeI18n.chooseDateRange
    );
  }
}

function updateStats() {
  updateRangeDisplay();

  if (!rangeStart || !rangeEnd) {
    statTotal.textContent = "0";
    statWorkdays.textContent = "0";
    statWeekends.textContent = "0";
    return;
  }

  const { workdays, weekends } =
    countWorkdaysAndWeekends(rangeStart, rangeEnd);

  statTotal.textContent = String(countTotalDays(rangeStart, rangeEnd));
  statWorkdays.textContent = String(workdays);
  statWeekends.textContent = String(weekends);
}


/* ------------------------------
   Bottom Sheet（手機直向月曆）
------------------------------ */

function lockBodyScroll() {
  savedScrollY = window.scrollY;
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
  dateRangePage?.classList.add("date-range-scroll-lock", "tool-operation-open");
  document.body.classList.add(
    "tool-operation-open",
    "range-sheet-open",
    "tool-sheet-open"
  );
}

function openRangeSheet() {
  if (!isMobileLayout() || isLandscapeDateMode() || !rangeSheet) {
    return;
  }

  closeCompactDatePanel();

  rangeSheet.classList.add("is-open");
  rangeSheetBackdrop?.classList.add("is-visible");
  rangeSheetBackdrop?.setAttribute("aria-hidden", "false");
  dateRangePage?.classList.add("sheet-open", "tool-sheet-open");
  lockBodyScroll();
  syncSheetAccessibility();
  prevMonthButton?.focus();
}

function closeRangeSheet() {
  if (!rangeSheet) {
    return;
  }

  const wasOpen = rangeSheet.classList.contains("is-open");

  closeRangeSheetFully();

  if (isMobileLayout() && wasOpen) {
    rangeDisplayTrigger?.focus();
  }
}

function syncSheetAccessibility() {
  if (!rangeSheet) {
    return;
  }

  if (isMobileLayout()) {
    const isOpen = rangeSheet.classList.contains("is-open");
    rangeSheet.setAttribute("aria-hidden", isOpen ? "false" : "true");
    rangeSheet.setAttribute("aria-modal", "true");
    rangeSheet.setAttribute("aria-label", dateRangeI18n.calendarLabel);
    rangeDisplayTrigger?.removeAttribute("tabindex");
    return;
  }

  rangeSheet.setAttribute("aria-hidden", "false");
  rangeSheet.removeAttribute("aria-modal");
  rangeDisplayTrigger?.setAttribute("tabindex", "-1");
}

function maybeCloseSheetOnComplete() {
  if (isMobileLayout() && !isLandscapeDateMode() && hasCompleteRange()) {
    closeRangeSheet();
  }
}

function handleDateCapsuleClick() {
  if (!isMobileLayout()) {
    return;
  }

  if (isLandscapeDateMode()) {
    toggleCompactDatePanel();
    return;
  }

  openRangeSheet();
}


/* ------------------------------
   月曆渲染
------------------------------ */

function renderCalendar() {
  if (!calendarGrid) {
    return;
  }

  monthLabel.textContent = formatMonthLabel(viewYear, viewMonth);
  calendarGrid.innerHTML = "";

  const today = cloneDateOnly(new Date());
  const firstDay = createLocalDate(viewYear, viewMonth, 1);
  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  for (let i = 0; i < firstWeekday; i += 1) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "calendar-cell calendar-cell--empty";
    emptyCell.setAttribute("aria-hidden", "true");
    calendarGrid.appendChild(emptyCell);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const cellDate = createLocalDate(viewYear, viewMonth, day);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "calendar-day";
    button.textContent = String(day);
    button.dataset.date = [
      viewYear,
      String(viewMonth + 1).padStart(2, "0"),
      String(day).padStart(2, "0"),
    ].join("-");

    if (isSameDay(cellDate, today)) {
      button.classList.add("is-today");
    }

    if (rangeStart && rangeEnd) {
      const { start, end } = normalizeRange(rangeStart, rangeEnd);

      if (isSameDay(cellDate, start) && isSameDay(cellDate, end)) {
        button.classList.add("is-range-single");
      } else if (isSameDay(cellDate, start)) {
        button.classList.add("is-range-start");
      } else if (isSameDay(cellDate, end)) {
        button.classList.add("is-range-end");
      } else if (isDateInRange(cellDate, start, end)) {
        button.classList.add("is-in-range");
      }
    } else if (rangeStart && isSameDay(cellDate, rangeStart)) {
      button.classList.add("is-range-single");
    }

    button.addEventListener("click", () => {
      handleDaySelect(cellDate);
    });

    calendarGrid.appendChild(button);
  }
}

function handleDaySelect(selectedDate) {
  const picked = cloneDateOnly(selectedDate);

  if (!rangeStart || (rangeStart && rangeEnd)) {
    rangeStart = picked;
    rangeEnd = null;
  } else {
    const normalized = normalizeRange(rangeStart, picked);
    rangeStart = normalized.start;
    rangeEnd = normalized.end;
  }

  updateStats();
  renderCalendar();
  syncLandscapeInputsFromState();
  maybeCloseSheetOnComplete();
}

function clearSelection() {
  rangeStart = null;
  rangeEnd = null;
  updateStats();
  renderCalendar();
  syncLandscapeInputsFromState();
}

function handleClearDatesClick(event) {
  event.preventDefault();
  event.stopPropagation();
  clearSelection();

  if (isCompactDatePanelOpen()) {
    closeCompactDatePanel();
    rangeDisplayTrigger?.focus();
  }
}

function goToPreviousMonth() {
  viewMonth -= 1;

  if (viewMonth < 0) {
    viewMonth = 11;
    viewYear -= 1;
  }

  renderCalendar();
}

function goToNextMonth() {
  viewMonth += 1;

  if (viewMonth > 11) {
    viewMonth = 0;
    viewYear += 1;
  }

  renderCalendar();
}


/* ------------------------------
   事件綁定
------------------------------ */

prevMonthButton?.addEventListener("click", goToPreviousMonth);
nextMonthButton?.addEventListener("click", goToNextMonth);

clearButtons.forEach((button) => {
  button.addEventListener("click", handleClearDatesClick);
});

rangeDisplayTrigger?.addEventListener("click", handleDateCapsuleClick);

rangeLandscapeStart?.addEventListener("input", applyLandscapeInputsToRange);
rangeLandscapeStart?.addEventListener("change", applyLandscapeInputsToRange);
rangeLandscapeEnd?.addEventListener("input", applyLandscapeInputsToRange);
rangeLandscapeEnd?.addEventListener("change", applyLandscapeInputsToRange);

rangeLandscapePanel?.addEventListener("click", (event) => {
  event.stopPropagation();
});

document.querySelectorAll("[data-date-range-v2] .drv2-landscape-date-field").forEach((field) => {
  field.addEventListener("click", (event) => {
    const input = field.querySelector(".drv2-landscape-date-input");

    if (!input || event.target === input) {
      return;
    }

    input.focus({ preventScroll: true });

    if (typeof input.showPicker === "function") {
      try {
        input.showPicker();
      } catch {
        input.focus({ preventScroll: true });
      }
    }
  });
});

rangeCompactOverlay?.addEventListener("click", () => {
  closeCompactDatePanel();
  rangeDisplayTrigger?.focus();
});

rangeSheetBackdrop?.addEventListener("click", closeRangeSheet);

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  if (isCompactDatePanelOpen()) {
    closeCompactDatePanel();
    rangeDisplayTrigger?.focus();
    return;
  }

  if (rangeSheet?.classList.contains("is-open")) {
    closeRangeSheet();
  }
});


/* ------------------------------
   初始化
------------------------------ */

updateStats();
renderCalendar();
syncLandscapeInputsFromState();
syncLayoutMode();
syncSheetAccessibility();
lastLayoutMode = getDateRangeLayoutMode();

DESKTOP_MEDIA.addEventListener("change", () => {
  if (!DESKTOP_MEDIA.matches) {
    resetDateRangeLayoutOnModeChange();
  } else {
    closeCompactDatePanel();
    closeRangeSheet();
    handleLayoutTransition();
  }
});

LANDSCAPE_DATE_MEDIA.addEventListener("change", scheduleLayoutTransitionAfterOrientation);

window.addEventListener("orientationchange", scheduleLayoutTransitionAfterOrientation);
window.addEventListener("resize", handleLayoutTransition);

window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    finalizePortraitReset();
    handleLayoutTransition();
  }
});
