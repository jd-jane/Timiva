/**
 * Lunar Date Converter layout contract — thin bootstrap for ResultSummary data-rs-layout.
 * Aligns with DRC／DC non-desktop + ≤823 landscape gate. Layout attrs only.
 */
(function (global) {
	var DESKTOP_MQ =
		"(min-width: 900px) and (min-height: 700px) and (hover: hover)";
	var LANDSCAPE_MQ =
		"(orientation: landscape) and (max-height: 700px) and (max-width: 823px) and (max-width: 899px), " +
		"(orientation: landscape) and (max-height: 700px) and (max-width: 823px) and (max-height: 699px), " +
		"(orientation: landscape) and (max-height: 700px) and (max-width: 823px) and (hover: none), " +
		"(orientation: landscape) and (max-height: 699px) and (max-width: 823px), " +
		"(orientation: landscape) and (max-height: 699px) and (max-width: 823px) and (hover: none)";
	var PORTRAIT_MOBILE_MQ = "(max-width: 767px) and (orientation: portrait)";
	var DESKTOP_INPUT_MQ = "(min-width: 768px)";

	function isDesktopInputComposition(win) {
		var view = win || global;
		if (!view.matchMedia(DESKTOP_INPUT_MQ).matches) {
			return false;
		}
		if (view.matchMedia(PORTRAIT_MOBILE_MQ).matches) {
			return false;
		}
		if (view.matchMedia(LANDSCAPE_MQ).matches) {
			return false;
		}
		return true;
	}

	function resolveLayoutMode(win) {
		var view = win || global;

		if (view.matchMedia(DESKTOP_MQ).matches) {
			return "desktop";
		}

		if (view.matchMedia(LANDSCAPE_MQ).matches) {
			return "landscape-lunar";
		}

		return "portrait";
	}

	function mapRsLayout(mode) {
		return mode === "landscape-lunar" ? "landscape" : mode;
	}

	function applyLayoutAttrs(doc) {
		var root = doc || global.document;
		var rs = root.querySelector(
			"[data-lunar-date-converter-v2] [data-result-summary]",
		);
		var mode = resolveLayoutMode(global);

		if (rs) {
			rs.setAttribute("data-rs-layout", mapRsLayout(mode));
		}
	}

	function bindLayoutListeners() {
		if (global.__timivaLdcv2LayoutBound) return;
		global.__timivaLdcv2LayoutBound = true;

		var onChange = function () {
			applyLayoutAttrs(global.document);
		};

		global.addEventListener("resize", onChange);
		global.addEventListener("orientationchange", onChange);

		if (global.matchMedia) {
			try {
				global.matchMedia(DESKTOP_MQ).addEventListener("change", onChange);
				global.matchMedia(LANDSCAPE_MQ).addEventListener("change", onChange);
			} catch (_) {
				/* older Safari：change listener optional */
			}
		}
	}

	global.TimivaLunarDateConverterLayout = {
		DESKTOP_MQ: DESKTOP_MQ,
		LANDSCAPE_MQ: LANDSCAPE_MQ,
		PORTRAIT_MOBILE_MQ: PORTRAIT_MOBILE_MQ,
		DESKTOP_INPUT_MQ: DESKTOP_INPUT_MQ,
		isDesktopInputComposition: isDesktopInputComposition,
		resolveLayoutMode: resolveLayoutMode,
		mapRsLayout: mapRsLayout,
		applyLayoutAttrs: applyLayoutAttrs,
		bindLayoutListeners: bindLayoutListeners,
	};

	if (global.document && global.document.readyState !== "loading") {
		bindLayoutListeners();
	} else if (global.document) {
		global.document.addEventListener("DOMContentLoaded", bindLayoutListeners);
	}
})(typeof window !== "undefined" ? window : globalThis);
