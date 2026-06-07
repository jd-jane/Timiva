/* ------------------------------
   倒數日期設定
------------------------------ */

function loadCountdownI18n() {
  const fallback = {
    locale: "en",
    defaultDisplayTitle: "My Event",
    share: "Share",
    copied: "Copied",
    copyFailed: "Copy failed",
    intlLocale: "en-US",
    templateTitles: {
      birthday: "My Birthday",
      trip: "My Trip",
      concert: "Concert Day",
      graduation: "Graduation Day",
    },
  };

  try {
    const node = document.getElementById("countdown-i18n");
    if (!node?.textContent) {
      return fallback;
    }

    return { ...fallback, ...JSON.parse(node.textContent) };
  } catch {
    return fallback;
  }
}

const countdownI18n = loadCountdownI18n();

let targetDate = new Date("2026-12-31T00:00:00");


/* ------------------------------
   畫面元素
------------------------------ */

const countdownPage =
  document.querySelector(".countdown-page");

const countdownNumber =
  document.querySelector(".countdown-number");

const countdownDate =
  document.querySelector("#event-date");

const titleElement =
  document.querySelector("#event-title");


/* ------------------------------
   Edit Sheet 元素
------------------------------ */

const editButton =
  document.querySelector("#edit-button");

const editSheet =
  document.querySelector("#edit-sheet");

const countdownSheetOverlay =
  document.querySelector("#countdown-sheet-overlay");

const titleInput =
  document.querySelector("#title-input");

const dateInput =
  document.querySelector("#date-input");

const templateButtons =
  document.querySelectorAll("[data-quick-template]");


/* ------------------------------
   Theme 元素與設定
------------------------------ */

const themeButton =
  document.querySelector("#theme-button");

const themes = [
  "theme-aurora",
  "theme-sunset",
  "theme-midnight",
];

let themeIndex = 0;


/* ------------------------------
   Share 元素
------------------------------ */

const shareButton =
  document.querySelector("#share-button");


/* ------------------------------
   防呆：常數與共用函式
------------------------------ */

/* 主畫面與分享用的預設標題（input 空白時顯示，但不會自動填回 input） */
const DEFAULT_DISPLAY_TITLE = countdownI18n.defaultDisplayTitle;

/* 標題空白時，主畫面與分享網址使用預設標題 */
function getDisplayTitle(value) {
  const trimmed =
    typeof value === "string" ? value.trim() : "";

  return trimmed || DEFAULT_DISPLAY_TITLE;
}

/* 檢查 YYYY-MM-DD 是否為有效日期 */
function isValidDateString(value) {
  if (!value || typeof value !== "string") {
    return false;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  /* 避免 2026-02-31 這類瀏覽器自動進位的無效日期 */
  const [year, month, day] = value.split("-").map(Number);

  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() + 1 === month &&
    parsed.getDate() === day
  );
}

/* 將有效日期字串轉成 Date，無效則回傳 null */
function parseTargetDate(value) {
  if (!isValidDateString(value)) {
    return null;
  }

  return new Date(`${value}T00:00:00`);
}


/* ------------------------------
   LocalStorage：記住上次設定
------------------------------ */

const STORAGE_KEY = "timiva:event-countdown";

/* 讀取 localStorage，格式錯誤時安全忽略 */
function loadCountdownSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const data = JSON.parse(raw);

    if (!data || typeof data !== "object") {
      return null;
    }

    const settings = {};

    if (typeof data.eventTitle === "string") {
      settings.eventTitle = data.eventTitle;
    }

    if (isValidDateString(data.eventDate)) {
      settings.eventDate = data.eventDate;
    }

    if (typeof data.selectedTheme === "string" && themes.includes(data.selectedTheme)) {
      settings.selectedTheme = data.selectedTheme;
    }

    if (
      settings.eventTitle === undefined &&
      settings.eventDate === undefined &&
      settings.selectedTheme === undefined
    ) {
      return null;
    }

    return settings;
  } catch {
    return null;
  }
}

/* 儲存目前標題、日期、主題到 localStorage */
function saveCountdownSettings() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        eventTitle: titleInput?.value ?? "",
        eventDate: dateInput?.value ?? "",
        selectedTheme: themes[themeIndex],
      })
    );
  } catch {
    /* 忽略 private mode / quota 等錯誤 */
  }
}

/* 套用主題（先加新 class 再移除舊的，避免閃白） */
function applyTheme(themeName) {
  if (!countdownPage || !themes.includes(themeName)) {
    return;
  }

  countdownPage.classList.add(themeName);
  countdownPage.classList.remove(
    ...themes.filter((theme) => theme !== themeName)
  );
  themeIndex = themes.indexOf(themeName);
}

/* 套用標題到 input 與主畫面 */
function applyTitle(title) {
  if (titleInput) {
    titleInput.value = title;
  }

  if (titleElement) {
    titleElement.textContent = getDisplayTitle(title);
  }
}

/* 套用日期到 input 與倒數計算 */
function applyDate(dateString) {
  const parsed = parseTargetDate(dateString);

  if (!parsed) {
    return false;
  }

  targetDate = parsed;

  if (dateInput) {
    dateInput.value = dateString;
  }

  return true;
}


/* ------------------------------
   Quick Templates 情境模板
------------------------------ */

/* 模板只改 title 與 theme，不動 date */
const quickTemplates = [
  {
    id: "birthday",
    title: countdownI18n.templateTitles.birthday,
    theme: "theme-sunset",
  },
  {
    id: "trip",
    title: countdownI18n.templateTitles.trip,
    theme: "theme-aurora",
  },
  {
    id: "concert",
    title: countdownI18n.templateTitles.concert,
    theme: "theme-midnight",
  },
  {
    id: "graduation",
    title: countdownI18n.templateTitles.graduation,
    theme: "theme-aurora",
  },
];

/* 更新模板按鈕的選中狀態 */
function setActiveQuickTemplate(templateId) {
  templateButtons.forEach((button) => {
    button.classList.toggle(
      "is-active",
      button.dataset.quickTemplate === templateId
    );
  });
}

/* 套用指定情境模板 */
function applyQuickTemplate(templateId) {
  const template = quickTemplates.find(
    (item) => item.id === templateId
  );

  if (!template) {
    return;
  }

  applyTitle(template.title);
  applyTheme(template.theme);
  setActiveQuickTemplate(template.id);
  saveCountdownSettings();
}


/* ------------------------------
   從 URL 讀取分享參數
------------------------------ */

const urlParams =
  new URLSearchParams(window.location.search);

const sharedTitle =
  urlParams.get("title");

const sharedDate =
  urlParams.get("date");

const sharedTheme =
  urlParams.get("theme");

const hasUrlTitle = sharedTitle !== null;
const hasUrlDate = Boolean(sharedDate && parseTargetDate(sharedDate));
const hasUrlTheme = Boolean(sharedTheme && themes.includes(sharedTheme));
const hasUrlParams = hasUrlTitle || hasUrlDate || hasUrlTheme;

/* 優先順序：URL 分享參數 → localStorage → HTML 預設值 */
if (hasUrlParams) {
  if (hasUrlTitle) {
    applyTitle(sharedTitle);
  }

  if (hasUrlDate) {
    applyDate(sharedDate);
  }

  if (hasUrlTheme) {
    applyTheme(sharedTheme);
  }

  /* URL 內容成功套用後，同步存回 localStorage */
  saveCountdownSettings();
} else {
  const savedSettings = loadCountdownSettings();

  if (savedSettings) {
    if (savedSettings.eventTitle !== undefined) {
      applyTitle(savedSettings.eventTitle);
    }

    if (savedSettings.eventDate) {
      applyDate(savedSettings.eventDate);
    }

    if (savedSettings.selectedTheme) {
      applyTheme(savedSettings.selectedTheme);
    }
  }
}


/* ------------------------------
   Sheet 開啟：body scroll lock（Design System V1）
------------------------------ */

let savedScrollY = 0;

function lockBodyScroll() {
  savedScrollY = window.scrollY;
  document.body.style.position = "fixed";
  document.body.style.top = `-${savedScrollY}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.width = "100%";
  document.body.classList.add("tool-sheet-open");
}

function unlockBodyScroll() {
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";
  document.body.classList.remove("tool-sheet-open");
  window.scrollTo(0, savedScrollY);
}


/* ------------------------------
   開啟 Edit Sheet
------------------------------ */

function openEditSheet() {
  editSheet?.classList.add("is-open");
  countdownPage?.classList.add("sheet-open", "tool-sheet-open");
  countdownSheetOverlay?.classList.add("is-visible");
  countdownSheetOverlay?.setAttribute("aria-hidden", "false");
  lockBodyScroll();
}


/* ------------------------------
   關閉 Edit Sheet
------------------------------ */

function syncHeroTitleFromInput() {
  if (titleElement && titleInput) {
    titleElement.textContent = getDisplayTitle(titleInput.value);
  }
}

function isMobileLandscapeCompact() {
  return window.matchMedia(
    "(orientation: landscape) and (max-height: 700px) and (max-width: 1200px)"
  ).matches;
}

function shouldDeferHeroTitleSync() {
  return (
    isMobileLandscapeCompact() &&
    editSheet?.classList.contains("is-open")
  );
}

function closeEditSheet() {
  syncHeroTitleFromInput();
  editSheet?.classList.remove("is-open");
  countdownPage?.classList.remove("sheet-open", "tool-sheet-open");
  countdownSheetOverlay?.classList.remove("is-visible");
  countdownSheetOverlay?.setAttribute("aria-hidden", "true");
  unlockBodyScroll();
  /* 關閉編輯面板時，儲存目前設定 */
  saveCountdownSettings();
}


/* ------------------------------
   更新倒數數字與日期
------------------------------ */

function updateCountdown() {
  const now = new Date();

  const diff =
    targetDate.getTime() - now.getTime();

  const days = Math.ceil(
    diff / (1000 * 60 * 60 * 24)
  );

  /* 日期已過或計算異常時，倒數顯示 0，避免負數或 NaN */
  const safeDays =
    Number.isFinite(days) ? Math.max(0, days) : 0;

  if (countdownNumber) {
    countdownNumber.textContent = String(safeDays);
  }

  if (countdownDate) {
    countdownDate.textContent = targetDate.toLocaleDateString(
      countdownI18n.intlLocale,
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
  }
}


/* ------------------------------
   初始化倒數
------------------------------ */

updateCountdown();

setInterval(updateCountdown, 1000);


/* ------------------------------
   點擊 Edit 按鈕開啟 / 關閉 Sheet
------------------------------ */

editButton?.addEventListener("click", () => {
  if (editSheet?.classList.contains("is-open")) {
    closeEditSheet();
    return;
  }

  openEditSheet();
});


/* ------------------------------
   即時更新標題
------------------------------ */

titleInput?.addEventListener("input", (event) => {
  /* input 可維持空白，主畫面顯示預設標題 */
  if (!shouldDeferHeroTitleSync()) {
    titleElement.textContent = getDisplayTitle(event.target.value);
  }
  saveCountdownSettings();
});

titleInput?.addEventListener("blur", () => {
  if (isMobileLandscapeCompact()) {
    syncHeroTitleFromInput();
  }
});


/* ------------------------------
   點擊整條 Date Input 開啟日期選單
------------------------------ */

dateInput?.addEventListener("click", () => {
  dateInput.showPicker?.();
});


/* ------------------------------
   更新倒數日期
------------------------------ */

dateInput?.addEventListener("input", (event) => {
  const nextDate = parseTargetDate(event.target.value);

  /* 沒有值或格式無效時，不更新 targetDate */
  if (!nextDate) {
    return;
  }

  targetDate = nextDate;
  updateCountdown();
  saveCountdownSettings();
});


/* ------------------------------
   點擊 Theme 按鈕切換主題
------------------------------ */

themeButton?.addEventListener("click", () => {
  const nextIndex =
    (themeIndex + 1) % themes.length;

  applyTheme(themes[nextIndex]);
  saveCountdownSettings();
});


/* ------------------------------
   Quick Templates 點擊事件
------------------------------ */

templateButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyQuickTemplate(button.dataset.quickTemplate);
    /* 不關閉 Edit Sheet，方便使用者接著選日期 */
  });
});


/* ------------------------------
   點擊畫面空白區域時關閉 Sheet
------------------------------ */

document.addEventListener("click", (event) => {
  const target = event.target;

  // 如果 Sheet 沒有開啟，就不處理
  if (!editSheet?.classList.contains("is-open")) {
    return;
  }

  // 點擊 Edit 按鈕時，不在這裡處理
  if (editButton?.contains(target)) {
    return;
  }

  // 點擊 Sheet 內部時，不關閉
  if (editSheet?.contains(target)) {
    return;
  }

  // 點擊其他區域時，關閉 Sheet 並同步狀態
  closeEditSheet();
});


/* ------------------------------
   複製文字到剪貼簿
------------------------------ */

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textArea = document.createElement("textarea");

    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";

    document.body.appendChild(textArea);

    textArea.focus();
    textArea.select();

    const success = document.execCommand("copy");

    document.body.removeChild(textArea);

    return success;
  }
}


/* ------------------------------
   產生分享網址
------------------------------ */

shareButton?.addEventListener("click", async () => {
  /* input 空白時，分享網址使用預設標題 */
  const title = getDisplayTitle(titleInput.value);
  const date = dateInput.value;
  const theme = themes[themeIndex];

  const params = new URLSearchParams({
    title,
    date,
    theme,
  });

  const shareUrl =
    `${window.location.origin}${window.location.pathname}?${params.toString()}`;

  const success = await copyText(shareUrl);

  closeEditSheet();

  shareButton.textContent = success
    ? countdownI18n.copied
    : countdownI18n.copyFailed;

  setTimeout(() => {
    shareButton.textContent = countdownI18n.share;
  }, 1400);
});