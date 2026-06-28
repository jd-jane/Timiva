(function () {
	"use strict";

	var STORAGE_KEY = "timiva.analytics.consent";
	var CONSENT_VERSION = 1;
	var GTAG_SCRIPT_BASE = "https://www.googletagmanager.com/gtag/js";
	var CONSENT_DENIED = {
		analytics_storage: "denied",
		ad_storage: "denied",
		ad_user_data: "denied",
		ad_personalization: "denied",
	};
	var CONSENT_GRANTED_ANALYTICS = {
		analytics_storage: "granted",
		ad_storage: "denied",
		ad_user_data: "denied",
		ad_personalization: "denied",
	};
	var CONFIG_OPTIONS = {
		send_page_view: true,
		allow_google_signals: false,
		allow_ad_personalization_signals: false,
	};

	function isValidIsoDateString(value) {
		return typeof value === "string" && Number.isFinite(Date.parse(value));
	}

	function parseStoredConsent(raw) {
		var parsed;

		try {
			parsed = JSON.parse(raw);
		} catch (error) {
			return null;
		}

		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
			return null;
		}

		if (parsed.v !== CONSENT_VERSION) {
			return null;
		}

		if (parsed.analytics !== "accepted" && parsed.analytics !== "rejected") {
			return null;
		}

		if (!isValidIsoDateString(parsed.updatedAt)) {
			return null;
		}

		return {
			v: parsed.v,
			analytics: parsed.analytics,
			updatedAt: parsed.updatedAt,
		};
	}

	function readStoredConsentRecord() {
		try {
			var raw = localStorage.getItem(STORAGE_KEY);

			if (raw === null) {
				return null;
			}

			return parseStoredConsent(raw);
		} catch (error) {
			return null;
		}
	}

	function writeStoredConsent(analytics) {
		try {
			var payload = {
				v: CONSENT_VERSION,
				analytics: analytics,
				updatedAt: new Date().toISOString(),
			};

			localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
			return true;
		} catch (error) {
			return false;
		}
	}

	function resolveMeasurementId(measurementId) {
		if (typeof measurementId === "string" && measurementId.length > 0) {
			return measurementId;
		}

		var fromDom = document.documentElement.getAttribute("data-ga-measurement-id");
		return typeof fromDom === "string" && fromDom.length > 0 ? fromDom : "";
	}

	function isLocalhostHostname(hostname) {
		return hostname === "localhost" || hostname === "127.0.0.1";
	}

	function isTimivaProductionHostname(hostname) {
		return hostname === "timiva.app" || hostname.endsWith(".timiva.app");
	}

	function isAnalyticsEnvironmentAllowed(measurementId) {
		var resolvedId = resolveMeasurementId(measurementId);

		if (!resolvedId) {
			return false;
		}

		if (isLocalhostHostname(window.location.hostname)) {
			return false;
		}

		return true;
	}

	function setGaDisableFlag(measurementId, disabled) {
		window["ga-disable-" + measurementId] = disabled;
	}

	function ensureGtagStub() {
		window.dataLayer = window.dataLayer || [];

		if (typeof window.gtag !== "function") {
			window.gtag = function gtag() {
				window.dataLayer.push(arguments);
			};
		}
	}

	function applyConsentDefault() {
		ensureGtagStub();
		window.gtag("consent", "default", Object.assign({ wait_for_update: 500 }, CONSENT_DENIED));
	}

	function applyConsentGranted() {
		ensureGtagStub();
		window.gtag("consent", "update", CONSENT_GRANTED_ANALYTICS);
	}

	function applyConsentDenied() {
		if (typeof window.gtag !== "function") {
			return;
		}

		window.gtag("consent", "update", CONSENT_DENIED);
	}

	function loadGtagScriptOnce(measurementId) {
		if (window.__timivaGaLoaded === true) {
			return Promise.resolve();
		}

		if (window.__timivaGaScriptLoading === true) {
			return window.__timivaGaScriptLoadingPromise || Promise.resolve();
		}

		window.__timivaGaScriptLoading = true;
		window.__timivaGaScriptLoadingPromise = new Promise(function (resolve, reject) {
			var script = document.createElement("script");
			script.async = true;
			script.src = GTAG_SCRIPT_BASE + "?id=" + encodeURIComponent(measurementId);

			script.addEventListener("load", function () {
				window.__timivaGaLoaded = true;
				window.__timivaGaScriptLoading = false;
				resolve();
			});

			script.addEventListener("error", function () {
				window.__timivaGaScriptLoading = false;
				reject(new Error("Failed to load Google tag"));
			});

			document.head.appendChild(script);
		});

		return window.__timivaGaScriptLoadingPromise;
	}

	function configureGtag(measurementId) {
		ensureGtagStub();
		window.gtag("js", new Date());

		if (window.__timivaGaPageViewSent === true) {
			return;
		}

		window.gtag("config", measurementId, CONFIG_OPTIONS);
		window.__timivaGaPageViewSent = true;
	}

	function clearCookie(name, domain) {
		var expires = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
		var path = "path=/";

		document.cookie = name + "=; " + expires + "; " + path;

		if (domain) {
			document.cookie = name + "=; " + expires + "; " + path + "; domain=" + domain;
		}
	}

	function listGaCookieNames() {
		if (!document.cookie) {
			return [];
		}

		return document.cookie
			.split(";")
			.map(function (entry) {
				return entry.trim().split("=")[0];
			})
			.filter(function (name) {
				return name.indexOf("_ga") === 0;
			});
	}

	function clearGaCookies(measurementId) {
		var names = listGaCookieNames();
		var hostname = window.location.hostname;
		var i;

		for (i = 0; i < names.length; i += 1) {
			clearCookie(names[i]);
		}

		if (isTimivaProductionHostname(hostname)) {
			for (i = 0; i < names.length; i += 1) {
				clearCookie(names[i], ".timiva.app");
			}
		}
	}

	function initializeAnalytics(measurementId) {
		applyConsentDefault();
		applyConsentGranted();

		return loadGtagScriptOnce(measurementId).then(function () {
			configureGtag(measurementId);
		});
	}

	function readConsent() {
		var record = readStoredConsentRecord();
		return record ? record.analytics : "unknown";
	}

	function createConsentResult(consentSaved, tagLoaded) {
		return {
			consentSaved: consentSaved === true,
			tagLoaded: tagLoaded === true,
		};
	}

	function acceptAnalytics(measurementId) {
		var resolvedId = resolveMeasurementId(measurementId);

		if (!resolvedId) {
			return Promise.resolve(createConsentResult(false, false));
		}

		if (!writeStoredConsent("accepted")) {
			return Promise.resolve(createConsentResult(false, false));
		}

		if (!isAnalyticsEnvironmentAllowed(resolvedId)) {
			return Promise.resolve(createConsentResult(true, false));
		}

		setGaDisableFlag(resolvedId, false);

		if (window.__timivaGaLoaded === true) {
			applyConsentGranted();
			return Promise.resolve(createConsentResult(true, true));
		}

		return initializeAnalytics(resolvedId)
			.then(function () {
				return createConsentResult(true, true);
			})
			.catch(function () {
				return createConsentResult(true, false);
			});
	}

	function rejectAnalytics(measurementId) {
		var resolvedId = resolveMeasurementId(measurementId);

		if (resolvedId) {
			setGaDisableFlag(resolvedId, true);
		}

		applyConsentDenied();

		if (!writeStoredConsent("rejected")) {
			return createConsentResult(false, false);
		}

		clearGaCookies(resolvedId);
		return createConsentResult(true, false);
	}

	function initializeFromPersistedState(measurementId) {
		var resolvedId = resolveMeasurementId(measurementId);
		var state = readConsent();

		if (!resolvedId) {
			return Promise.resolve(createConsentResult(false, false));
		}

		if (state === "rejected") {
			if (resolvedId) {
				setGaDisableFlag(resolvedId, true);
			}
			return Promise.resolve(createConsentResult(true, false));
		}

		if (!isAnalyticsEnvironmentAllowed(resolvedId)) {
			return Promise.resolve(createConsentResult(state === "accepted", false));
		}

		if (state === "accepted") {
			return acceptAnalytics(resolvedId);
		}

		return Promise.resolve(createConsentResult(false, false));
	}

	window.TimivaAnalyticsConsent = {
		readConsent: readConsent,
		acceptAnalytics: acceptAnalytics,
		rejectAnalytics: rejectAnalytics,
		initializeFromPersistedState: initializeFromPersistedState,
		isAnalyticsEnvironmentAllowed: isAnalyticsEnvironmentAllowed,
	};
})();
