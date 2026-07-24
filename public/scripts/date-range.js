/* ------------------------------
   Date Range Calculator 狀態
------------------------------ */

let viewYear = new Date().getFullYear();
let viewMonth = new Date().getMonth();

/** @type {Date | null} */
let rangeStart = null;

/** @type {Date | null} */
let rangeEnd = null;

const layoutContract = window.TimivaDateRangeLayout;

const DESKTOP_MEDIA = window.matchMedia(
  layoutContract?.DESKTOP_MQ ??
    "(min-width: 900px) and (min-height: 700px) and (hover: hover)"
);

const LANDSCAPE_DATE_MEDIA = window.matchMedia(
  layoutContract?.LANDSCAPE_MQ ??
    "(orientation: landscape) and (max-height: 700px) and (max-width: 1200px)"
);

let savedScrollY = 0;
let lastLayoutMode = null;

const DR_JS_VERSION = "dr22";

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

const calendarQuickNav =
  document.querySelector("[data-drv2-desktop-nav]");

const calendarPanelEl =
  document.querySelector("[data-drv2-calendar-panel]");

const calendarWeekdays =
  document.querySelector("[data-drv2-calendar-weekdays]");

const monthTrigger =
  document.querySelector("[data-drv2-month-trigger]");

const yearTrigger =
  document.querySelector("[data-drv2-year-trigger]");

const monthTriggerLabel =
  document.querySelector("[data-drv2-month-label]");

const yearTriggerLabel =
  document.querySelector("[data-drv2-year-label]");

const monthPanel =
  document.querySelector("[data-drv2-month-panel]");

const yearPanel =
  document.querySelector("[data-drv2-year-panel]");

const monthGrid =
  document.querySelector("[data-drv2-month-grid]");

const yearList =
  document.querySelector("[data-drv2-year-list]");

const yearInput =
  document.querySelector("[data-drv2-year-input]");

const monthPicker =
  document.querySelector("[data-drv2-month-picker]");

const yearPicker =
  document.querySelector("[data-drv2-year-picker]");

const portraitPeriodTrigger =
  document.querySelector("[data-drv2-portrait-period-trigger]");

const portraitPeriodLabel =
  document.querySelector("[data-drv2-portrait-period-label]");

const portraitPeriodScreen =
  document.querySelector("[data-drv2-portrait-period-screen]");

const portraitPeriodBack =
  document.querySelector("[data-drv2-portrait-period-back]");

const portraitMonthGrid =
  document.querySelector("[data-drv2-portrait-month-grid]");

const portraitYearLabel =
  document.querySelector("[data-drv2-portrait-year-label]");

const portraitPrevYearBtn =
  document.querySelector("[data-drv2-portrait-prev-year]");

const portraitNextYearBtn =
  document.querySelector("[data-drv2-portrait-next-year]");

const prevMonthButton =
  document.querySelector("#prev-month");

const nextMonthButton =
  document.querySelector("#next-month");

const calendarToolbar =
  document.querySelector("[data-drv2-calendar-toolbar]");

const calendarClearButtons =
  document.querySelectorAll("[data-drv2-calendar-clear]");

const sheetFooter =
  document.querySelector("[data-drv2-sheet-footer]");

/** @type {"none" | "month" | "year"} Desktop toolbar panels */
let toolbarPanel = "none";

/** Mobile Portrait：選擇年月畫面是否開啟 */
let portraitPeriodOpen = false;

/** Portrait 年月畫面中的草稿年份（套用月份前可獨立切換） */
let portraitPickerYear = viewYear;

const clearButtons =
  document.querySelectorAll("[data-clear-dates]");

/** @type {HTMLElement | null} */
const resultSummaryEl = document.querySelector(
  "[data-date-range-v2] [data-result-summary]"
);

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
  // setFullYear 避免 Date(0–99) 被解讀成 1900–1999
  const date = new Date(2000, 0, 1);
  date.setHours(0, 0, 0, 0);
  date.setFullYear(year, month, day);
  return date;
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


function mapResultSummaryLayout(mode) {
  if (layoutContract?.mapRsLayout) {
    return layoutContract.mapRsLayout(mode);
  }

  if (mode === "landscape-date") {
    return "landscape";
  }

  return mode;
}

function getDateRangeLayoutMode() {
  if (layoutContract?.resolveLayoutMode) {
    return layoutContract.resolveLayoutMode(window);
  }

  if (!isMobileLayout()) {
    return "desktop";
  }

  if (LANDSCAPE_DATE_MEDIA.matches) {
    return "landscape-date";
  }

  return "portrait";
}

function syncResultSummaryLayout() {
  if (!resultSummaryEl) {
    return;
  }

  resultSummaryEl.setAttribute(
    "data-rs-layout",
    mapResultSummaryLayout(getDateRangeLayoutMode())
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

function formatMonthOptionName(monthIndex) {
  if (dateRangeI18n.locale === "zh") {
    return `${monthIndex + 1}月`;
  }

  return new Intl.DateTimeFormat(dateRangeI18n.intlLocale, {
    month: "short",
  }).format(createLocalDate(2000, monthIndex, 1));
}

function formatYearLabel(year) {
  return String(year).padStart(4, "0");
}

function formatPeriodTriggerLabel(year, month) {
  if (dateRangeI18n.locale === "zh") {
    return `${year}年${month + 1}月`;
  }

  return `${formatMonthOptionName(month)} ${formatYearLabel(year)}`;
}

function syncCalendarToolbarLabels() {
  if (monthLabel) {
    monthLabel.textContent = formatMonthLabel(viewYear, viewMonth);
  }

  if (monthTriggerLabel) {
    monthTriggerLabel.textContent = formatMonthOptionName(viewMonth);
  }

  if (yearTriggerLabel) {
    yearTriggerLabel.textContent = formatYearLabel(viewYear);
  }

  if (portraitPeriodLabel) {
    portraitPeriodLabel.textContent = formatPeriodTriggerLabel(viewYear, viewMonth);
  }
}

function parseCalendarYearInput(raw) {
  if (typeof raw !== "string" || !/^\d{4}$/.test(raw)) {
    return null;
  }

  const year = Number(raw);

  if (!Number.isInteger(year) || year < 1 || year > 9999) {
    return null;
  }

  return year;
}

function getNearbyYearWindow(centerYear) {
  let start = centerYear - 10;
  let end = centerYear + 10;

  if (start < 1) {
    end = Math.min(9999, end + (1 - start));
    start = 1;
  }

  if (end > 9999) {
    start = Math.max(1, start - (end - 9999));
    end = 9999;
  }

  const years = [];

  for (let year = start; year <= end; year += 1) {
    years.push(year);
  }

  return years;
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

function formatInputDate(date) {
  const year = String(date.getFullYear()).padStart(4, "0");
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
  syncResultSummaryLayout();

  if (mode === "landscape-date") {
    rangeDisplayTrigger?.setAttribute("aria-controls", "range-landscape-panel");
    rangeDisplayTrigger?.setAttribute("aria-haspopup", "true");
  } else if (isMobileLayout()) {
    rangeDisplayTrigger?.setAttribute("aria-controls", "range-sheet");
    rangeDisplayTrigger?.setAttribute("aria-haspopup", "dialog");
  }

  syncCalendarNavVisibility();
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
  closeAllCalendarNavPanels({ restoreFocus: false });
  if (yearInput) {
    yearInput.value = formatYearLabel(viewYear);
    if (document.activeElement === yearInput) {
      yearInput.blur();
    }
  }
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

  if (!resultSummaryEl) {
    return;
  }

  const detail =
    !rangeStart || !rangeEnd
      ? {
          primary: { value: 0, displayValue: "0" },
          secondary: [
            { key: "workdays", value: 0, displayValue: "0" },
            { key: "weekends", value: 0, displayValue: "0" },
          ],
        }
      : (() => {
          const { workdays, weekends } =
            countWorkdaysAndWeekends(rangeStart, rangeEnd);
          const totalDays = countTotalDays(rangeStart, rangeEnd);

          return {
            primary: { value: totalDays, displayValue: String(totalDays) },
            secondary: [
              { key: "workdays", value: workdays, displayValue: String(workdays) },
              { key: "weekends", value: weekends, displayValue: String(weekends) },
            ],
          };
        })();

  resultSummaryEl.dispatchEvent(
    new CustomEvent("rs:update", {
      bubbles: false,
      detail,
    })
  );
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
    rangeSheet.removeAttribute("inert");
    const isOpen = rangeSheet.classList.contains("is-open");
    rangeSheet.setAttribute("aria-hidden", isOpen ? "false" : "true");
    rangeSheet.setAttribute("aria-modal", "true");
    rangeSheet.setAttribute("aria-label", dateRangeI18n.calendarLabel);
    rangeDisplayTrigger?.removeAttribute("tabindex");
    return;
  }

  // Desktop：legacy sheet 隱藏；Shared inline-large 為主路徑
  rangeSheet.setAttribute("aria-hidden", "true");
  rangeSheet.setAttribute("inert", "");
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

function toSdcDate(date) {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

function fromSdcDate(parts) {
  return createLocalDate(parts.year, parts.month - 1, parts.day);
}

/** @type {Set<() => void>} */
const desktopCalendarListeners = new Set();

function notifyDesktopCalendar() {
  desktopCalendarListeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // Adapter refresh errors must not break tool state
    }
  });
}

function renderCalendar() {
  // Desktop → Shared DesktopCalendar；不操作 Mobile legacy DOM
  if (isDesktopLayout()) {
    notifyDesktopCalendar();
    return;
  }

  if (!calendarGrid) {
    return;
  }

  syncCalendarToolbarLabels();
  calendarGrid.innerHTML = "";

  const today = cloneDateOnly(new Date());
  const firstDay = createLocalDate(viewYear, viewMonth, 1);
  const firstWeekday = (firstDay.getDay() + 6) % 7;
  // 用 setFullYear 路徑算當月天數，避免 year 0–99 被 Date 解讀成 1900–1999
  const daysInMonth = createLocalDate(viewYear, viewMonth + 1, 0).getDate();

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
  if (portraitPeriodOpen) {
    return;
  }

  viewMonth -= 1;

  if (viewMonth < 0) {
    viewMonth = 11;
    viewYear -= 1;
  }

  closeAllCalendarNavPanels({ restoreFocus: false });
  renderCalendar();
}

function goToNextMonth() {
  if (portraitPeriodOpen) {
    return;
  }

  viewMonth += 1;

  if (viewMonth > 11) {
    viewMonth = 0;
    viewYear += 1;
  }

  closeAllCalendarNavPanels({ restoreFocus: false });
  renderCalendar();
}



/* ------------------------------
   Calendar 月份／年份快速導覽
   Desktop：Month／Year 分開 panel＋nearby list
   Mobile Portrait：單一「Jul 2026」＋選擇年月畫面（無 nearby list）
   Mobile Landscape：原生 type=date，不啟用
------------------------------ */

function isPortraitLayout() {
  return getDateRangeLayoutMode() === "portrait";
}

function isDesktopLayout() {
  return getDateRangeLayoutMode() === "desktop";
}

function isCustomCalendarNavMode() {
  return getDateRangeLayoutMode() !== "landscape-date";
}

function setFocusable(el, enabled) {
  if (!el) {
    return;
  }

  if (enabled) {
    el.removeAttribute("tabindex");
  } else {
    el.setAttribute("tabindex", "-1");
  }
}

function syncCalendarNavVisibility() {
  const mode = getDateRangeLayoutMode();
  const desktop = mode === "desktop";
  const portrait = mode === "portrait";

  if (calendarQuickNav) {
    calendarQuickNav.hidden = !desktop;
  }

  if (portraitPeriodTrigger) {
    // 年月模式時標題 trigger 隱藏，改由 period screen 承載返回／年份
    portraitPeriodTrigger.hidden = !portrait || portraitPeriodOpen;
  }

  if (monthLabel) {
    monthLabel.hidden = true;
  }

  [monthTrigger, yearTrigger, yearInput].forEach((el) => {
    setFocusable(el, desktop);
  });

  setFocusable(portraitPeriodTrigger, portrait && !portraitPeriodOpen);
  [
    portraitPeriodBack,
    portraitPrevYearBtn,
    portraitNextYearBtn,
  ].forEach((el) => {
    setFocusable(el, portrait);
  });

  if (!desktop) {
    closeDesktopToolbarPanels({ restoreFocus: false });
  }

  if (!portrait) {
    closePortraitPeriodScreen({ restoreFocus: false });
  } else {
    syncPortraitChromeVisibility();
  }
}

function syncPortraitChromeVisibility() {
  const period = isPortraitLayout() && portraitPeriodOpen;
  const showMonthArrows = !period;

  if (calendarToolbar) {
    // Portrait 年月模式整列隱藏，避免前後月空位與 period header 重複
    calendarToolbar.hidden = period;
  }

  if (prevMonthButton) {
    prevMonthButton.hidden = period;
  }

  if (nextMonthButton) {
    nextMonthButton.hidden = period;
  }

  setFocusable(prevMonthButton, showMonthArrows);
  setFocusable(nextMonthButton, showMonthArrows);

  calendarClearButtons.forEach((btn) => {
    btn.hidden = period;
    setFocusable(btn, !period);
  });

  if (sheetFooter) {
    sheetFooter.hidden = period;
  }
}

function syncDateGridVisibility() {
  const portraitPeriod = isPortraitLayout() && portraitPeriodOpen;
  const desktopPanel = isDesktopLayout() && toolbarPanel !== "none";

  if (calendarWeekdays) {
    calendarWeekdays.hidden = portraitPeriod;
  }

  if (calendarGrid) {
    if (portraitPeriod) {
      calendarGrid.hidden = true;
      calendarGrid.setAttribute("inert", "");
    } else if (desktopPanel) {
      calendarGrid.hidden = false;
      calendarGrid.setAttribute("inert", "");
    } else {
      calendarGrid.hidden = false;
      calendarGrid.removeAttribute("inert");
    }
  }

  syncPortraitChromeVisibility();
}

function closeAllCalendarNavPanels(options = {}) {
  closeDesktopToolbarPanels(options);
  closePortraitPeriodScreen(options);
}

function setDesktopToolbarPanel(next) {
  if (!isDesktopLayout() && next !== "none") {
    return;
  }

  const previous = toolbarPanel;
  toolbarPanel = next;
  const monthOpen = next === "month";
  const yearOpen = next === "year";

  if (monthPanel) {
    monthPanel.hidden = !monthOpen;
  }

  if (yearPanel) {
    yearPanel.hidden = !yearOpen;
  }

  calendarPanelEl?.setAttribute(
    "data-drv2-toolbar-panel",
    portraitPeriodOpen ? "portrait-period" : next
  );

  monthTrigger?.setAttribute("aria-expanded", monthOpen ? "true" : "false");
  yearTrigger?.setAttribute("aria-expanded", yearOpen ? "true" : "false");

  syncDateGridVisibility();

  if (previous === "year" && !yearOpen && yearInput) {
    if (document.activeElement === yearInput) {
      yearInput.blur();
    }
    yearInput.value = formatYearLabel(viewYear);
  }

  if (monthOpen) {
    renderDesktopMonthOptions();
  }

  if (yearOpen) {
    renderNearbyYearList();
    if (yearInput) {
      yearInput.value = formatYearLabel(viewYear);
      requestAnimationFrame(() => {
        scrollSelectedYearIntoView();
        yearInput.focus({ preventScroll: true });
        yearInput.select();
      });
    }
  }
}

function closeDesktopToolbarPanels(options = {}) {
  const restoreFocus = options.restoreFocus !== false;
  const previous = toolbarPanel;

  if (previous === "none") {
    if (!portraitPeriodOpen) {
      calendarPanelEl?.setAttribute("data-drv2-toolbar-panel", "none");
    }
    return;
  }

  setDesktopToolbarPanel("none");

  if (!restoreFocus) {
    return;
  }

  if (previous === "month") {
    monthTrigger?.focus({ preventScroll: true });
  } else if (previous === "year") {
    yearTrigger?.focus({ preventScroll: true });
  }
}

function syncPortraitPeriodScreen() {
  if (portraitPeriodScreen) {
    portraitPeriodScreen.hidden = !portraitPeriodOpen;
  }

  if (portraitPeriodTrigger) {
    portraitPeriodTrigger.hidden = !isPortraitLayout() || portraitPeriodOpen;
    portraitPeriodTrigger.setAttribute(
      "aria-expanded",
      portraitPeriodOpen ? "true" : "false"
    );
  }

  if (portraitYearLabel) {
    portraitYearLabel.textContent = formatYearLabel(portraitPickerYear);
  }

  calendarPanelEl?.setAttribute(
    "data-drv2-toolbar-panel",
    portraitPeriodOpen
      ? "portrait-period"
      : toolbarPanel === "none"
        ? "none"
        : toolbarPanel
  );

  syncDateGridVisibility();
}

function openPortraitPeriodScreen() {
  if (!isPortraitLayout()) {
    return;
  }

  closeDesktopToolbarPanels({ restoreFocus: false });
  portraitPeriodOpen = true;
  portraitPickerYear = viewYear;
  renderPortraitMonthOptions();
  syncPortraitPeriodScreen();
}

function closePortraitPeriodScreen(options = {}) {
  const restoreFocus = options.restoreFocus !== false;
  const wasOpen = portraitPeriodOpen;

  if (!wasOpen) {
    syncPortraitChromeVisibility();
    return;
  }

  portraitPeriodOpen = false;
  syncPortraitPeriodScreen();

  if (restoreFocus) {
    portraitPeriodTrigger?.focus({ preventScroll: true });
  }
}

function stepPortraitPickerYear(delta) {
  const next = portraitPickerYear + delta;

  if (next < 1 || next > 9999) {
    return;
  }

  portraitPickerYear = next;

  if (portraitYearLabel) {
    portraitYearLabel.textContent = formatYearLabel(portraitPickerYear);
  }

  renderPortraitMonthOptions();
}

function renderDesktopMonthOptions() {
  if (!monthGrid) {
    return;
  }

  const frag = document.createDocumentFragment();

  for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "drv2-calendar-month-option";
    button.setAttribute("role", "option");
    button.setAttribute("data-drv2-month-option", String(monthIndex));
    button.textContent = formatMonthOptionName(monthIndex);

    if (monthIndex === viewMonth) {
      button.classList.add("is-selected");
      button.setAttribute("aria-selected", "true");
    } else {
      button.setAttribute("aria-selected", "false");
    }

    frag.appendChild(button);
  }

  monthGrid.replaceChildren(frag);
}

function renderPortraitMonthOptions() {
  if (!portraitMonthGrid) {
    return;
  }

  const frag = document.createDocumentFragment();

  for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "drv2-portrait-month-option";
    button.setAttribute("role", "option");
    button.setAttribute("data-drv2-portrait-month-option", String(monthIndex));
    button.innerHTML = `<span class="drv2-portrait-month-option-label">${formatMonthOptionName(monthIndex)}</span>`;

    const selected =
      monthIndex === viewMonth && portraitPickerYear === viewYear;

    if (selected) {
      button.classList.add("is-selected");
      button.setAttribute("aria-selected", "true");
    } else {
      button.setAttribute("aria-selected", "false");
    }

    frag.appendChild(button);
  }

  portraitMonthGrid.replaceChildren(frag);
}

function renderNearbyYearList() {
  if (!yearList) {
    return;
  }

  const years = getNearbyYearWindow(viewYear);
  const frag = document.createDocumentFragment();

  for (const year of years) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "drv2-calendar-year-option";
    button.setAttribute("role", "option");
    button.setAttribute("data-drv2-year-option", String(year));
    button.textContent = formatYearLabel(year);

    if (year === viewYear) {
      button.classList.add("is-selected");
      button.setAttribute("aria-selected", "true");
    } else {
      button.setAttribute("aria-selected", "false");
    }

    frag.appendChild(button);
  }

  yearList.replaceChildren(frag);
  scrollSelectedYearIntoView();
}

function scrollSelectedYearIntoView() {
  const selected = yearList?.querySelector(".drv2-calendar-year-option.is-selected");
  selected?.scrollIntoView({ block: "nearest" });
}

function applyDesktopViewMonth(monthIndex) {
  if (monthIndex < 0 || monthIndex > 11) {
    return;
  }

  viewMonth = monthIndex;
  closeDesktopToolbarPanels();
  renderCalendar();
}

function applyDesktopViewYear(year) {
  if (!Number.isInteger(year) || year < 1 || year > 9999) {
    return;
  }

  viewYear = year;
  closeDesktopToolbarPanels();
  renderCalendar();
}

function applyPortraitMonth(monthIndex) {
  if (monthIndex < 0 || monthIndex > 11) {
    return;
  }

  viewMonth = monthIndex;
  viewYear = portraitPickerYear;
  closePortraitPeriodScreen();
  renderCalendar();
}

function applyDesktopYearInputIfValid() {
  if (!yearInput) {
    return false;
  }

  const year = parseCalendarYearInput(yearInput.value.trim());

  if (year === null) {
    return false;
  }

  viewYear = year;
  return true;
}

function leaveDesktopYearPanel(options = {}) {
  if (toolbarPanel !== "year") {
    return;
  }

  if (yearInput) {
    yearInput.value = formatYearLabel(viewYear);
  }

  closeDesktopToolbarPanels({ restoreFocus: options.restoreFocus !== false });
}

function bindCalendarNav() {
  portraitPeriodTrigger?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isPortraitLayout()) {
      return;
    }

    openPortraitPeriodScreen();
  });

  portraitPeriodBack?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    closePortraitPeriodScreen();
  });

  portraitPrevYearBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    stepPortraitPickerYear(-1);
  });

  portraitNextYearBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    stepPortraitPickerYear(1);
  });

  portraitMonthGrid?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const option = target.closest("[data-drv2-portrait-month-option]");
    if (!option) {
      return;
    }

    event.preventDefault();
    const monthIndex = Number(option.getAttribute("data-drv2-portrait-month-option"));
    applyPortraitMonth(monthIndex);
  });

  if (!monthTrigger || !yearTrigger || !monthPanel || !yearPanel) {
    return;
  }

  monthTrigger.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isDesktopLayout()) {
      return;
    }

    setDesktopToolbarPanel(toolbarPanel === "month" ? "none" : "month");
  });

  yearTrigger.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isDesktopLayout()) {
      return;
    }

    setDesktopToolbarPanel(toolbarPanel === "year" ? "none" : "year");
  });

  monthGrid?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const option = target.closest("[data-drv2-month-option]");
    if (!option) {
      return;
    }

    event.preventDefault();
    const monthIndex = Number(option.getAttribute("data-drv2-month-option"));
    applyDesktopViewMonth(monthIndex);
  });

  yearList?.addEventListener("pointerdown", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const option = target.closest("[data-drv2-year-option]");
    if (!option) {
      return;
    }

    event.preventDefault();
  });

  yearList?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const option = target.closest("[data-drv2-year-option]");
    if (!option) {
      return;
    }

    event.preventDefault();
    const year = Number(option.getAttribute("data-drv2-year-option"));
    applyDesktopViewYear(year);
  });

  yearInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (applyDesktopYearInputIfValid()) {
        closeDesktopToolbarPanels();
        renderCalendar();
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      leaveDesktopYearPanel();
    }
  });

  yearInput?.addEventListener("blur", () => {
    requestAnimationFrame(() => {
      if (toolbarPanel !== "year") {
        return;
      }

      const active = document.activeElement;
      if (yearPanel?.contains(active)) {
        return;
      }

      leaveDesktopYearPanel({ restoreFocus: false });
    });
  });

  document.addEventListener("pointerdown", (event) => {
    if (!isDesktopLayout() || toolbarPanel === "none") {
      return;
    }

    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }

    if (monthPicker?.contains(target) || yearPicker?.contains(target)) {
      return;
    }

    closeDesktopToolbarPanels({ restoreFocus: false });
  });
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

  // Desktop Esc：由 Shared DesktopCalendar（capture）處理月份／年份分層
  if (isDesktopLayout()) {
    return;
  }

  if (toolbarPanel !== "none") {
    closeDesktopToolbarPanels();
    return;
  }

  if (portraitPeriodOpen) {
    closePortraitPeriodScreen();
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

function bindDesktopSharedCalendar() {
  window.TimivaDateRangeDesktopCalendar?.bind({
    getSelection: () => ({
      start: rangeStart ? toSdcDate(rangeStart) : null,
      end: rangeEnd ? toSdcDate(rangeEnd) : null,
    }),
    applyPick: (date) => {
      handleDaySelect(fromSdcDate(date));
    },
    subscribe: (listener) => {
      desktopCalendarListeners.add(listener);
      return () => {
        desktopCalendarListeners.delete(listener);
      };
    },
    isDesktop: () => isDesktopLayout(),
    getDesktopMedia: () => DESKTOP_MEDIA,
    getIntlLocale: () => dateRangeI18n.intlLocale || "en-US",
  });
}

bindCalendarNav();
syncCalendarNavVisibility();
updateStats();
renderCalendar();
syncLandscapeInputsFromState();
syncLayoutMode();
syncSheetAccessibility();
bindDesktopSharedCalendar();
lastLayoutMode = getDateRangeLayoutMode();

DESKTOP_MEDIA.addEventListener("change", () => {
  closeAllCalendarNavPanels({ restoreFocus: false });
  if (!DESKTOP_MEDIA.matches) {
    resetDateRangeLayoutOnModeChange();
  } else {
    closeCompactDatePanel();
    closeRangeSheet();
    handleLayoutTransition();
  }
  syncCalendarNavVisibility();
  syncSheetAccessibility();
  bindDesktopSharedCalendar();
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
