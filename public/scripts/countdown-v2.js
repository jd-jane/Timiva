(function () {
  const root = document.querySelector("[data-event-countdown-v2]");

  if (!root) {
    return;
  }

  const daysEl = root.querySelector("[data-ecv2-days-count]");
  const titleEl = root.querySelector("[data-ecv2-title]");
  const dateLabelEl = root.querySelector("[data-ecv2-date-label]");
  const editButton = root.querySelector("#edit-button");
  const sheet = root.querySelector("[data-ecv2-sheet]");
  const overlay = root.querySelector("[data-ecv2-sheet-overlay]");
  const titleInput = root.querySelector("[data-ecv2-title-input]");
  const dateInput = root.querySelector("[data-ecv2-date-input]");
  const dateField = root.querySelector("[data-ecv2-date-field]");
  const themeButton = root.querySelector("[data-ecv2-theme-button]");
  const shareButton = root.querySelector("[data-ecv2-share-button]");

  function loadCountdownV2I18n() {
    const fallback = {
      locale: "en",
      defaultDisplayTitle: "My Event",
      share: "Share",
      copied: "Copied",
      copyFailed: "Copy failed",
      untilLabelPrefix: "Until",
      intlLocale: "en-US",
    };

    try {
      const node = document.getElementById("countdown-v2-i18n");

      if (!node?.textContent) {
        return fallback;
      }

      return { ...fallback, ...JSON.parse(node.textContent) };
    } catch (error) {
      console.warn("[countdown-v2] Failed to read client i18n:", error);
      return fallback;
    }
  }

  const clientI18n = loadCountdownV2I18n();
  const DEFAULT_TITLE = clientI18n.defaultDisplayTitle;
  const DEFAULT_DATE = "2026-12-31";
  const SHARE_LABEL = clientI18n.share;
  const COPIED_LABEL = clientI18n.copied;
  const SHARE_FAILED_LABEL = clientI18n.copyFailed;
  const SHARE_FEEDBACK_MS = 1200;
  const TITLE_SAVE_DEBOUNCE_MS = 300;
  const PREVIEW_STORAGE_KEY = "timiva.eventCountdownV2.state";
  const PRODUCTION_STORAGE_KEY = "timiva.eventCountdown.state";
  const LEGACY_STORAGE_KEY = "timiva:event-countdown";
  const THEMES = ["aurora", "sunset", "midnight"];
  const SHEET_OPEN_CLASS = "ecv2-sheet-open";
  const LANDSCAPE_MQ = window.matchMedia(
    "(orientation: landscape) and (max-height: 700px) and (max-width: 1200px)"
  );
  const PORTRAIT_MQ = window.matchMedia(
    "(max-width: 767px) and (orientation: portrait)"
  );

  let savedScrollY = 0;
  let targetDate = null;
  let lastEditActivateAt = 0;
  let lastThemeActivateAt = 0;
  let lastShareActivateAt = 0;
  let shareFeedbackTimer = null;
  let titleSaveTimer = null;
  let safariEditTouchPending = false;
  let currentThemeIndex = 0;

  const runtimeMode =
    root.dataset.ecv2Mode === "production" ? "production" : "preview";
  const storageKey =
    root.dataset.ecv2StorageKey ||
    (runtimeMode === "production"
      ? PRODUCTION_STORAGE_KEY
      : PREVIEW_STORAGE_KEY);

  const IS_IOS_SAFARI =
    /iP(hone|od|ad)/.test(navigator.userAgent) &&
    /WebKit/.test(navigator.userAgent) &&
    !/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent);

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

    const [year, month, day] = value.split("-").map(Number);

    return (
      parsed.getFullYear() === year &&
      parsed.getMonth() + 1 === month &&
      parsed.getDate() === day
    );
  }

  function parseTargetDate(value) {
    if (!isValidDateString(value)) {
      return null;
    }

    return new Date(`${value}T00:00:00`);
  }

  function computeDaysRemaining(target) {
    const now = new Date();
    const diff = target.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    return Number.isFinite(days) ? Math.max(0, days) : 0;
  }

  function formatUntilLabel(target) {
    const formatted = new Intl.DateTimeFormat(clientI18n.intlLocale, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(target);

    return `${clientI18n.untilLabelPrefix} ${formatted}`;
  }

  function getDisplayTitle(value) {
    const trimmed = typeof value === "string" ? value.trim() : "";

    return trimmed || DEFAULT_TITLE;
  }

  function normalizeTheme(value) {
    if (!value || typeof value !== "string") {
      return null;
    }

    if (THEMES.includes(value)) {
      return value;
    }

    if (value.startsWith("theme-")) {
      const shortName = value.slice("theme-".length);

      if (THEMES.includes(shortName)) {
        return shortName;
      }
    }

    return null;
  }

  function getDefaultStateFromRoot() {
    const defaultTitle = root.dataset.eventTitle || "My Birthday";
    const defaultDateString = isValidDateString(root.dataset.eventDate)
      ? root.dataset.eventDate
      : DEFAULT_DATE;
    const defaultTheme = normalizeTheme(root.dataset.ecv2Theme) || THEMES[0];

    return {
      title: getDisplayTitle(defaultTitle),
      dateString: defaultDateString,
      theme: defaultTheme,
    };
  }

  function mapModernStoredState(parsed) {
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const result = {};

    if (typeof parsed.title === "string" && parsed.title.trim()) {
      result.title = getDisplayTitle(parsed.title);
    }

    if (isValidDateString(parsed.date)) {
      result.dateString = parsed.date;
    }

    const theme = normalizeTheme(parsed.theme);

    if (theme) {
      result.theme = theme;
    }

    return Object.keys(result).length > 0 ? result : null;
  }

  function mapLegacyStoredState(parsed) {
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const result = {};

    if (typeof parsed.eventTitle === "string" && parsed.eventTitle.trim()) {
      result.title = getDisplayTitle(parsed.eventTitle);
    }

    if (isValidDateString(parsed.eventDate)) {
      result.dateString = parsed.eventDate;
    }

    const theme = normalizeTheme(parsed.selectedTheme);

    if (theme) {
      result.theme = theme;
    }

    return Object.keys(result).length > 0 ? result : null;
  }

  function readStateFromStorageKey(key, mapper) {
    try {
      const raw = localStorage.getItem(key);

      if (!raw) {
        return null;
      }

      return mapper(JSON.parse(raw));
    } catch (error) {
      console.warn("[countdown-v2] Failed to read stored state:", error);
      return null;
    }
  }

  function readStoredState() {
    if (runtimeMode === "preview") {
      return readStateFromStorageKey(storageKey, mapModernStoredState);
    }

    const migrationKeys = [
      { key: PRODUCTION_STORAGE_KEY, mapper: mapModernStoredState },
      { key: PREVIEW_STORAGE_KEY, mapper: mapModernStoredState },
      { key: LEGACY_STORAGE_KEY, mapper: mapLegacyStoredState },
    ];

    for (const entry of migrationKeys) {
      const state = readStateFromStorageKey(entry.key, entry.mapper);

      if (state) {
        return state;
      }
    }

    return null;
  }

  function persistStoredState() {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          title: getCurrentEventTitle(),
          date: getCurrentEventDateString(),
          theme: getCurrentThemeName(),
          updatedAt: new Date().toISOString(),
        })
      );
    } catch (error) {
      console.warn("[countdown-v2] Failed to write stored state:", error);
    }
  }

  function clearStoredState() {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn("[countdown-v2] Failed to clear stored state:", error);
    }
  }

  function schedulePersistTitleState() {
    if (titleSaveTimer) {
      window.clearTimeout(titleSaveTimer);
    }

    titleSaveTimer = window.setTimeout(() => {
      titleSaveTimer = null;
      root.dataset.eventTitle = getCurrentEventTitle();
      persistStoredState();
    }, TITLE_SAVE_DEBOUNCE_MS);
  }

  function applyQuickTemplate(templateTitle, templateDateString) {
    const displayTitle = getDisplayTitle(templateTitle);
    const parsedDate = parseTargetDate(templateDateString);

    if (!parsedDate) {
      console.warn(
        "[countdown-v2] Invalid quick template date:",
        templateDateString
      );
      return;
    }

    if (titleSaveTimer) {
      window.clearTimeout(titleSaveTimer);
      titleSaveTimer = null;
    }

    targetDate = parsedDate;
    root.dataset.eventTitle = displayTitle;
    root.dataset.eventDate = templateDateString;

    if (titleEl) {
      titleEl.textContent = displayTitle;
    }

    if (titleInput) {
      titleInput.value = displayTitle;
    }

    if (dateInput) {
      dateInput.value = templateDateString;
    }

    renderCountdown();
    persistStoredState();
  }

  function bindQuickTemplateButtons() {
    if (!sheet) {
      return;
    }

    const templateButtons = sheet.querySelectorAll("[data-ecv2-template-button]");

    templateButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const templateTitle = button.dataset.templateTitle;
        const templateDate = button.dataset.templateDate;

        if (!templateTitle || !templateDate) {
          return;
        }

        applyQuickTemplate(templateTitle, templateDate);
      });
    });
  }

  function resolveInitialState() {
    const defaults = getDefaultStateFromRoot();
    const stored = readStoredState();
    const params = new URLSearchParams(window.location.search);
    let title = defaults.title;
    let dateString = defaults.dateString;
    let theme = defaults.theme;

    if (params.has("title")) {
      title = getDisplayTitle(params.get("title"));

      if (!params.get("title")?.trim()) {
        console.warn("[countdown-v2] Empty URL title param, using default title.");
      }
    } else if (stored?.title) {
      title = stored.title;
    }

    if (params.has("date")) {
      const urlDate = params.get("date");

      if (isValidDateString(urlDate)) {
        dateString = urlDate;
      } else {
        console.warn("[countdown-v2] Invalid URL date param:", urlDate);
        dateString = DEFAULT_DATE;
      }
    } else if (stored?.dateString) {
      dateString = stored.dateString;
    }

    if (params.has("theme")) {
      const normalizedTheme = normalizeTheme(params.get("theme"));

      if (normalizedTheme) {
        theme = normalizedTheme;
      } else {
        console.warn("[countdown-v2] Invalid URL theme param:", params.get("theme"));
        theme = THEMES[0];
      }
    } else if (stored?.theme) {
      theme = stored.theme;
    }

    return { title, dateString, theme };
  }

  function applyInitialState(state) {
    root.dataset.eventTitle = state.title;
    root.dataset.eventDate = state.dateString;

    targetDate = parseTargetDate(state.dateString);

    if (!targetDate) {
      console.warn("[countdown-v2] Invalid resolved date:", state.dateString);
      targetDate = parseTargetDate(DEFAULT_DATE);
      state.dateString = DEFAULT_DATE;
      root.dataset.eventDate = DEFAULT_DATE;
    }

    if (titleEl) {
      titleEl.textContent = state.title;
    }

    if (titleInput) {
      titleInput.value = state.title;
    }

    if (dateInput) {
      dateInput.value = state.dateString;
    }

    currentThemeIndex = THEMES.indexOf(state.theme);
    applyTheme(state.theme);
  }

  function mountSheetLayers() {
    if (!sheet || !overlay) {
      return;
    }

    if (overlay.parentElement !== document.body) {
      document.body.appendChild(overlay);
    }

    if (sheet.parentElement !== document.body) {
      document.body.appendChild(sheet);
    }
  }

  function setSheetLayersHidden(hidden) {
    if (overlay) {
      overlay.hidden = hidden;
    }

    if (sheet) {
      sheet.hidden = hidden;
    }
  }

  function openDatePicker(input) {
    if (!input) {
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
  }

  function lockBodyScroll() {
    savedScrollY = window.scrollY;
    document.body.classList.add(SHEET_OPEN_CLASS, "tool-operation-open");
    document.body.style.top = `-${savedScrollY}px`;
  }

  function unlockBodyScroll() {
    document.body.classList.remove(SHEET_OPEN_CLASS, "tool-operation-open");
    document.body.style.top = "";
    window.scrollTo(0, savedScrollY);
  }

  function getVisualViewportMetrics() {
    const viewport = window.visualViewport;

    return {
      height: viewport ? Math.round(viewport.height) : window.innerHeight,
      offsetTop: viewport ? Math.round(viewport.offsetTop) : 0,
      innerHeight: window.innerHeight,
      clientHeight: document.documentElement.clientHeight,
      scrollY: window.scrollY,
    };
  }

  function updateLandscapeViewportVar() {
    if (!LANDSCAPE_MQ.matches) {
      root.classList.remove("ecv2-landscape-first-screen");
      root.style.removeProperty("--ecv2-visual-height");
      return;
    }

    if (isSheetOpen()) {
      return;
    }

    const metrics = getVisualViewportMetrics();
    root.style.setProperty("--ecv2-visual-height", `${metrics.height}px`);
  }

  function syncLandscapeFirstScreenState() {
    if (!LANDSCAPE_MQ.matches) {
      root.classList.remove("ecv2-landscape-first-screen");
      return;
    }

    if (isSheetOpen()) {
      return;
    }

    updateLandscapeViewportVar();

    const atFirstScreen = window.scrollY < 12;
    root.classList.toggle("ecv2-landscape-first-screen", atFirstScreen);

    if (!atFirstScreen || !editButton) {
      return;
    }

    const metrics = getVisualViewportMetrics();
    const rect = editButton.getBoundingClientRect();
    const safeTop = metrics.offsetTop + 4;
    const safeBottom = metrics.offsetTop + metrics.height - 12;

    if (rect.top < safeTop || rect.bottom > safeBottom) {
      const delta = rect.bottom > safeBottom
        ? rect.bottom - safeBottom
        : rect.top - safeTop;

      window.scrollTo(0, window.scrollY + Math.ceil(delta));
    }
  }

  function isPointInButtonHitArea(button, clientX, clientY) {
    if (!button) {
      return false;
    }

    const rect = button.getBoundingClientRect();
    const slop = 10;

    return (
      clientX >= rect.left - slop &&
      clientX <= rect.right + slop &&
      clientY >= rect.top - slop &&
      clientY <= rect.bottom + slop
    );
  }

  function isPointInEditHitArea(clientX, clientY) {
    return isPointInButtonHitArea(editButton, clientX, clientY);
  }

  function isPointInThemeHitArea(clientX, clientY) {
    if (!themeButton) {
      return false;
    }

    const rect = themeButton.getBoundingClientRect();
    const slop = PORTRAIT_MQ.matches && !LANDSCAPE_MQ.matches ? 16 : 10;

    return (
      clientX >= rect.left - slop &&
      clientX <= rect.right + slop &&
      clientY >= rect.top - slop &&
      clientY <= rect.bottom + slop
    );
  }

  function isPointInShareHitArea(clientX, clientY) {
    if (!shareButton) {
      return false;
    }

    const rect = shareButton.getBoundingClientRect();
    const slop = PORTRAIT_MQ.matches && !LANDSCAPE_MQ.matches ? 16 : 10;

    return (
      clientX >= rect.left - slop &&
      clientX <= rect.right + slop &&
      clientY >= rect.top - slop &&
      clientY <= rect.bottom + slop
    );
  }

  function shouldUseSafariThemeTouchCapture() {
    if (isSheetOpen()) {
      return false;
    }

    if (LANDSCAPE_MQ.matches) {
      return true;
    }

    return PORTRAIT_MQ.matches && window.scrollY < 12;
  }

  function shouldUseMobileShareTouchCapture() {
    return shouldUseSafariThemeTouchCapture();
  }

  function canUseWebShare() {
    return typeof navigator.share === "function" && window.isSecureContext;
  }

  function activateEdit(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const now = Date.now();

    if (now - lastEditActivateAt < 400) {
      return;
    }

    lastEditActivateAt = now;
    toggleSheet();
  }

  function applyTheme(themeName) {
    root.dataset.ecv2Theme = themeName;
  }

  function cycleTheme() {
    currentThemeIndex = (currentThemeIndex + 1) % THEMES.length;
    applyTheme(THEMES[currentThemeIndex]);
    persistStoredState();
  }

  function activateTheme(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const now = Date.now();

    if (now - lastThemeActivateAt < 300) {
      return;
    }

    lastThemeActivateAt = now;
    cycleTheme();
  }

  function getCurrentEventTitle() {
    const fromInput = titleInput?.value;
    const fromDisplay = titleEl?.textContent;
    const fromDataset = root.dataset.eventTitle;

    return getDisplayTitle(fromInput ?? fromDisplay ?? fromDataset);
  }

  function getCurrentEventDateString() {
    const fromInput = dateInput?.value;

    if (isValidDateString(fromInput)) {
      return fromInput;
    }

    const fromDataset = root.dataset.eventDate;

    if (isValidDateString(fromDataset)) {
      return fromDataset;
    }

    return DEFAULT_DATE;
  }

  function getCurrentThemeName() {
    const theme = normalizeTheme(root.dataset.ecv2Theme);

    if (theme) {
      return theme;
    }

    return THEMES[currentThemeIndex] ?? THEMES[0];
  }

  function buildShareUrl() {
    const url = new URL(window.location.href);
    url.search = "";
    url.hash = "";
    url.searchParams.set("title", getCurrentEventTitle());
    url.searchParams.set("date", getCurrentEventDateString());
    url.searchParams.set("theme", getCurrentThemeName());
    return url.toString();
  }

  function showShareButtonFeedback(label, ariaLabel) {
    if (!shareButton) {
      return;
    }

    if (shareFeedbackTimer) {
      window.clearTimeout(shareFeedbackTimer);
      shareFeedbackTimer = null;
    }

    shareButton.textContent = label;
    shareButton.setAttribute("aria-label", ariaLabel);

    shareFeedbackTimer = window.setTimeout(() => {
      shareButton.textContent = SHARE_LABEL;
      shareButton.setAttribute("aria-label", SHARE_LABEL);
      shareFeedbackTimer = null;
    }, SHARE_FEEDBACK_MS);
  }

  async function copyShareUrl(shareUrl) {
    if (!navigator.clipboard?.writeText) {
      console.warn("[countdown-v2] Clipboard API unavailable.");
      return false;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      return true;
    } catch (error) {
      console.warn("[countdown-v2] clipboard write failed:", error);
      return false;
    }
  }

  async function activateShare(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const now = Date.now();

    if (now - lastShareActivateAt < 400) {
      return;
    }

    lastShareActivateAt = now;

    const shareUrl = buildShareUrl();
    const shareTitle = getCurrentEventTitle();

    if (canUseWebShare()) {
      try {
        await navigator.share({
          title: shareTitle,
          url: shareUrl,
        });
        return;
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }

        console.warn("[countdown-v2] navigator.share failed:", error);
      }
    }

    const copied = await copyShareUrl(shareUrl);

    if (copied) {
      showShareButtonFeedback(COPIED_LABEL, "Link copied to clipboard");
      return;
    }

    showShareButtonFeedback(SHARE_FAILED_LABEL, "Could not share link");
  }

  function bindShareButton() {
    if (!shareButton) {
      return;
    }

    shareButton.addEventListener(
      "pointerup",
      (event) => {
        if (event.pointerType === "mouse" && event.button !== 0) {
          return;
        }

        activateShare(event);
      },
      { capture: true }
    );

    shareButton.addEventListener(
      "click",
      (event) => {
        activateShare(event);
      },
      { capture: true }
    );

    bindMobileShareTouchCapture();
  }

  function bindMobileShareTouchCapture() {
    if (!shareButton) {
      return;
    }

    let mobileShareTouchPending = false;

    document.addEventListener(
      "touchstart",
      (event) => {
        if (!shouldUseMobileShareTouchCapture()) {
          mobileShareTouchPending = false;
          return;
        }

        const touch = event.targetTouches[0];

        if (!touch) {
          mobileShareTouchPending = false;
          return;
        }

        mobileShareTouchPending = isPointInShareHitArea(
          touch.clientX,
          touch.clientY
        );
      },
      { capture: true, passive: true }
    );

    document.addEventListener(
      "touchend",
      (event) => {
        if (!shouldUseMobileShareTouchCapture() || !mobileShareTouchPending) {
          return;
        }

        mobileShareTouchPending = false;

        const touch = event.changedTouches[0];

        if (!touch || !isPointInShareHitArea(touch.clientX, touch.clientY)) {
          return;
        }

        activateShare(event);
      },
      { capture: true, passive: false }
    );
  }

  function bindThemeButton() {
    if (!themeButton) {
      return;
    }

    themeButton.addEventListener(
      "pointerup",
      (event) => {
        if (event.pointerType === "mouse" && event.button !== 0) {
          return;
        }

        activateTheme(event);
      },
      { capture: true }
    );

    themeButton.addEventListener(
      "click",
      (event) => {
        activateTheme(event);
      },
      { capture: true }
    );

    if (!IS_IOS_SAFARI) {
      return;
    }

    let safariThemeTouchPending = false;

    document.addEventListener(
      "touchstart",
      (event) => {
        if (!shouldUseSafariThemeTouchCapture()) {
          safariThemeTouchPending = false;
          return;
        }

        const touch = event.targetTouches[0];

        if (!touch) {
          safariThemeTouchPending = false;
          return;
        }

        safariThemeTouchPending = isPointInThemeHitArea(
          touch.clientX,
          touch.clientY
        );
      },
      { capture: true, passive: true }
    );

    document.addEventListener(
      "touchend",
      (event) => {
        if (!shouldUseSafariThemeTouchCapture() || !safariThemeTouchPending) {
          return;
        }

        safariThemeTouchPending = false;

        const touch = event.changedTouches[0];

        if (!touch || !isPointInThemeHitArea(touch.clientX, touch.clientY)) {
          return;
        }

        activateTheme(event);
      },
      { capture: true, passive: false }
    );
  }

  function bindEditButton() {
    if (!editButton) {
      return;
    }

    editButton.addEventListener(
      "pointerup",
      (event) => {
        if (event.pointerType === "mouse" && event.button !== 0) {
          return;
        }

        activateEdit(event);
      },
      { capture: true }
    );

    editButton.addEventListener(
      "click",
      (event) => {
        activateEdit(event);
      },
      { capture: true }
    );

    if (!IS_IOS_SAFARI) {
      return;
    }

    document.addEventListener(
      "touchstart",
      (event) => {
        if (!LANDSCAPE_MQ.matches || isSheetOpen()) {
          safariEditTouchPending = false;
          return;
        }

        const touch = event.targetTouches[0];

        if (!touch) {
          safariEditTouchPending = false;
          return;
        }

        safariEditTouchPending = isPointInEditHitArea(
          touch.clientX,
          touch.clientY
        );
      },
      { capture: true, passive: true }
    );

    document.addEventListener(
      "touchend",
      (event) => {
        if (!LANDSCAPE_MQ.matches || isSheetOpen() || !safariEditTouchPending) {
          return;
        }

        safariEditTouchPending = false;

        const touch = event.changedTouches[0];

        if (!touch || !isPointInEditHitArea(touch.clientX, touch.clientY)) {
          return;
        }

        activateEdit(event);
      },
      { capture: true, passive: false }
    );
  }

  function bindLandscapeViewportSync() {
    if (LANDSCAPE_MQ.matches && window.scrollY < 12) {
      root.classList.add("ecv2-landscape-first-screen");
    }

    updateLandscapeViewportVar();
    syncLandscapeFirstScreenState();

    window.visualViewport?.addEventListener("resize", syncLandscapeFirstScreenState);
    window.visualViewport?.addEventListener("scroll", syncLandscapeFirstScreenState);
    window.addEventListener("scroll", syncLandscapeFirstScreenState, { passive: true });
    window.addEventListener("orientationchange", () => {
      window.requestAnimationFrame(syncLandscapeFirstScreenState);
    });
    LANDSCAPE_MQ.addEventListener("change", syncLandscapeFirstScreenState);

    if (IS_IOS_SAFARI) {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(syncLandscapeFirstScreenState);
      });
    }
  }

  mountSheetLayers();

  const initialState = resolveInitialState();
  applyInitialState(initialState);

  if (sheet) {
    sheet.inert = true;
  }

  if (overlay) {
    overlay.inert = true;
  }

  setSheetLayersHidden(true);

  function renderCountdown() {
    if (!targetDate) {
      return;
    }

    const days = computeDaysRemaining(targetDate);

    if (daysEl) {
      daysEl.textContent = String(days);
    }

    if (dateLabelEl) {
      dateLabelEl.textContent = formatUntilLabel(targetDate);
    }
  }

  function isSheetOpen() {
    return sheet?.classList.contains("is-open") ?? false;
  }

  function finalizeSheetClose() {
    if (!sheet || !overlay) {
      return;
    }

    sheet.classList.remove("is-open");
    overlay.classList.remove("is-open");
    sheet.inert = true;
    overlay.inert = true;
    sheet.setAttribute("aria-hidden", "true");
    overlay.setAttribute("aria-hidden", "true");
    setSheetLayersHidden(true);
  }

  function openSheet() {
    if (!sheet || !overlay) {
      return;
    }

    setSheetLayersHidden(false);
    sheet.classList.remove("is-open");
    overlay.classList.remove("is-open");
    sheet.offsetHeight;

    lockBodyScroll();

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        sheet.classList.add("is-open");
        overlay.classList.add("is-open");
        sheet.inert = false;
        overlay.inert = false;
        sheet.setAttribute("aria-hidden", "false");
        overlay.setAttribute("aria-hidden", "false");
      });
    });
  }

  function closeSheet() {
    if (!sheet || !overlay) {
      return;
    }

    if (!isSheetOpen() && sheet.hidden) {
      return;
    }

    unlockBodyScroll();
    finalizeSheetClose();
  }

  function toggleSheet() {
    if (isSheetOpen()) {
      closeSheet();
      return;
    }

    openSheet();
  }

  bindLandscapeViewportSync();
  bindEditButton();
  bindThemeButton();
  bindShareButton();
  bindQuickTemplateButtons();

  overlay?.addEventListener("click", () => {
    closeSheet();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isSheetOpen()) {
      closeSheet();
    }
  });

  titleInput?.addEventListener("input", (event) => {
    if (!titleEl) {
      return;
    }

    titleEl.textContent = getDisplayTitle(event.target.value);
    schedulePersistTitleState();
  });

  titleInput?.addEventListener("focus", () => {
    if (isSheetOpen()) {
      window.scrollTo(0, savedScrollY);
    }
  });

  dateInput?.addEventListener("input", (event) => {
    const nextDate = parseTargetDate(event.target.value);

    if (!nextDate) {
      return;
    }

    targetDate = nextDate;
    root.dataset.eventDate = event.target.value;
    renderCountdown();
    persistStoredState();
  });

  dateInput?.addEventListener("click", () => {
    openDatePicker(dateInput);
  });

  dateField?.addEventListener("click", (event) => {
    if (event.target === dateInput) {
      return;
    }

    openDatePicker(dateInput);
  });

  renderCountdown();
  setInterval(renderCountdown, 60 * 1000);
})();
