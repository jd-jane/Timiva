/**
 * Japanese Era Converter layout contract — thin bootstrap for ResultSummary data-rs-layout.
 * Aligns with DC／Hours MQ gates. Layout attrs only — no result content or tool state.
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
			return "landscape-era";
		}

		return "portrait";
	}

	function mapRsLayout(mode) {
		return mode === "landscape-era" ? "landscape" : mode;
	}

	function applyLayoutAttrs(doc) {
		var root = doc || global.document;
		var rs = root.querySelector(
			"[data-japanese-era-converter-v2] [data-result-summary]",
		);
		var mode = resolveLayoutMode(global);

		if (rs) {
			rs.setAttribute("data-rs-layout", mapRsLayout(mode));
		}
	}

	global.TimivaJapaneseEraConverterLayout = {
		DESKTOP_MQ: DESKTOP_MQ,
		LANDSCAPE_MQ: LANDSCAPE_MQ,
		resolveLayoutMode: resolveLayoutMode,
		mapRsLayout: mapRsLayout,
		applyLayoutAttrs: applyLayoutAttrs,
	};
})(typeof window !== "undefined" ? window : globalThis);
