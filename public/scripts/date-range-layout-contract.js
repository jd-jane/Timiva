/**
 * Date Range layout contract — single source for DRC layout gate + initial bootstrap.
 * Must match public/scripts/date-range.js layout gate (DESKTOP_MEDIA / LANDSCAPE_DATE_MEDIA).
 */
(function (global) {
  var DESKTOP_MQ = "(min-width: 768px) and (hover: hover)";
  var LANDSCAPE_MQ =
    "(orientation: landscape) and (max-height: 700px) and (max-width: 1200px) and (hover: none)";

  function resolveLayoutMode(win) {
    var view = win || global;

    if (view.matchMedia(DESKTOP_MQ).matches) {
      return "desktop";
    }

    if (view.matchMedia(LANDSCAPE_MQ).matches) {
      return "landscape-date";
    }

    return "portrait";
  }

  function mapRsLayout(mode) {
    return mode === "landscape-date" ? "landscape" : mode;
  }

  /** Layout attrs only — no rs:update, digits, or live region changes. */
  function applyLayoutAttrs(doc) {
    var root = doc || global.document;
    var page = root.getElementById("date-range-page");
    var rs = root.querySelector("[data-date-range-v2] [data-result-summary]");
    var mode = resolveLayoutMode(global);

    if (page) {
      page.dataset.rangeLayout = mode;
    }

    if (rs) {
      rs.setAttribute("data-rs-layout", mapRsLayout(mode));
    }
  }

  global.TimivaDateRangeLayout = {
    DESKTOP_MQ: DESKTOP_MQ,
    LANDSCAPE_MQ: LANDSCAPE_MQ,
    resolveLayoutMode: resolveLayoutMode,
    mapRsLayout: mapRsLayout,
    applyLayoutAttrs: applyLayoutAttrs,
  };
})(typeof window !== "undefined" ? window : globalThis);
