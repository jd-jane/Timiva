/**
 * Business Days layout contract — single source for BDC layout gate + initial bootstrap.
 * Canonical Responsive Composition Contract（layout-system §6.0.3）.
 * Must match src/scripts/business-days-calculator.ts layout gate (DESKTOP_MQ / LANDSCAPE_MQ).
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
		var rs = root.querySelector(
			"[data-business-days-calculator-v2] [data-result-summary]",
		);
		var mode = resolveLayoutMode(global);

		if (rs) {
			rs.setAttribute("data-rs-layout", mapRsLayout(mode));
		}
	}

	global.TimivaBusinessDaysLayout = {
		DESKTOP_MQ: DESKTOP_MQ,
		LANDSCAPE_MQ: LANDSCAPE_MQ,
		resolveLayoutMode: resolveLayoutMode,
		mapRsLayout: mapRsLayout,
		applyLayoutAttrs: applyLayoutAttrs,
	};
})(typeof window !== "undefined" ? window : globalThis);
