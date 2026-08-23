/**
 * Lunar Date Converter layout contract — thin bootstrap for ResultSummary data-rs-layout.
 * Aligns with ToolPageFrame desktop gate (900×700+hover) and landscape compact MQ.
 * Layout attrs only — no result content, conversion, or sheet state.
 */
(function (global) {
	var DESKTOP_MQ =
		"(min-width: 900px) and (min-height: 700px) and (hover: hover)";
	var LANDSCAPE_MQ =
		"(orientation: landscape) and (max-height: 700px) and (max-width: 1200px)";

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
