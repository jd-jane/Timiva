(function () {
	"use strict";

	const root = document.querySelector("[data-countdown-timer-v2]");
	if (!root) {
		return;
	}

	const quickStartContainer = root.querySelector(".ctv2-quick-start");
	const quickStartPrimaryRow = root.querySelector(".ctv2-quick-start-row--primary");
	const quickStartSecondaryRow = root.querySelector(
		".ctv2-quick-start-row:not(.ctv2-quick-start-row--primary)",
	);
	const cancelBtn = root.querySelector("[data-ctv2-cancel]");
	const primaryBtn = root.querySelector("[data-ctv2-primary]");
	const progressActiveRing = root.querySelector("[data-ctv2-progress-active-ring]");
	const minutesEl = root.querySelector("[data-ctv2-time-minutes]");
	const secondsEl = root.querySelector("[data-ctv2-time-seconds]");
	const hoursEl = root.querySelector("[data-ctv2-time-hours]");
	const timeGridEl = root.querySelector("[data-ctv2-time-grid]");
	const timeShellEl = root.querySelector("[data-ctv2-time-shell]");
	const timeDisplayEl = root.querySelector("[data-ctv2-time-display]");
	const timeEditTrigger = root.querySelector("[data-ctv2-time-edit-trigger]");
	const keyboardCaptureInput = root.querySelector("[data-ctv2-keyboard-capture]");
	const editValidationEl = root.querySelector("[data-ctv2-edit-validation]");
	const completionStatusEl = root.querySelector("[data-ctv2-completion-status]");
	const soundToggleBtn = root.querySelector("[data-ctv2-sound-toggle]");
	const soundLabelEl = root.querySelector(".ctv2-sound-label");
	const ringHitArea = root.querySelector("[data-ctv2-ring-hit-area]");
	const tickRingSvg = root.querySelector("[data-ctv2-tick-ring]");
	const portraitTickEls = root.querySelectorAll(
		"[data-ctv2-tick-ring-portrait] [data-ctv2-tick-minute]",
	);
	const portraitTickByMinute = new Map();
	const portraitTickBaseCoords = new Map();

	portraitTickEls.forEach((tick) => {
		const minute = Number(tick.dataset.ctv2TickMinute);
		if (!Number.isFinite(minute)) {
			return;
		}

		portraitTickByMinute.set(minute, tick);
		portraitTickBaseCoords.set(minute, {
			x1: Number(tick.getAttribute("x1")),
			y1: Number(tick.getAttribute("y1")),
			x2: Number(tick.getAttribute("x2")),
			y2: Number(tick.getAttribute("y2")),
		});
	});

	const labelStart = root.dataset.ctv2LabelStart || "Start";
	const labelPause = root.dataset.ctv2LabelPause || "Pause";
	const labelResume = root.dataset.ctv2LabelResume || "Resume";
	const labelDone = root.dataset.ctv2LabelDone || "Done";
	const labelTimesUp = root.dataset.ctv2LabelTimesUp || "Time's up";
	const labelLast = root.dataset.ctv2LabelLast || "Last";
	const pageLocale = root.dataset.ctv2Locale || "en";
	const isZhLocale = pageLocale === "zh";
	const labelSoundOff = root.dataset.ctv2LabelSoundOff || "Sound off";
	const labelSoundOn = root.dataset.ctv2LabelSoundOn || "Sound on";
	const labelMaxDuration = root.dataset.ctv2LabelMaxDuration || "Maximum duration is 9:59:59";
	const labelZeroDuration = root.dataset.ctv2LabelZeroDuration || "Set a duration greater than 0";
	const labelSetDuration = root.dataset.ctv2LabelSetDuration || "Set timer duration";

	const sheetPortalHost = document.querySelector("[data-ctv2-sheet-portal]");
	const sheetOverlay = sheetPortalHost?.querySelector("[data-ctv2-sheet-overlay]");
	const customSheet = sheetPortalHost?.querySelector("[data-ctv2-custom-sheet]");
	const sheetBody = customSheet?.querySelector(".msb-sheet-body");
	const sheetCancelBtn = sheetPortalHost?.querySelector("[data-ctv2-sheet-cancel]");
	const sheetApplyBtn = sheetPortalHost?.querySelector("[data-ctv2-sheet-apply]");
	const sheetHoursInput = sheetPortalHost?.querySelector("[data-ctv2-sheet-hours]");
	const sheetMinutesInput = sheetPortalHost?.querySelector("[data-ctv2-sheet-minutes]");
	const sheetSecondsInput = sheetPortalHost?.querySelector("[data-ctv2-sheet-seconds]");
	const sheetInputs = [sheetHoursInput, sheetMinutesInput, sheetSecondsInput].filter(Boolean);

	let presetLabels = {};
	try {
		presetLabels = JSON.parse(root.dataset.ctv2PresetLabels || "{}");
	} catch (error) {
		presetLabels = {};
	}

	if (
		!quickStartContainer ||
		!quickStartPrimaryRow ||
		!cancelBtn ||
		!primaryBtn ||
		!minutesEl ||
		!secondsEl ||
		!timeEditTrigger ||
		!keyboardCaptureInput ||
		!soundToggleBtn ||
		!soundLabelEl
	) {
		return;
	}

	const LAST_DURATION_STORAGE_KEY = "timiva-countdown-timer-last-duration-ms";
	const SOUND_PREFERENCE_STORAGE_KEY = "timiva-countdown-timer-sound-enabled";
	const MOBILE_ROW1_OVERFLOW_PRESET_SECONDS = "300";
	const MOBILE_ROW1_LONG_LAST_OVERFLOW_PRESET_SECONDS = "600";
	const MOBILE_ROW2_STATIC_ANCHOR_PRESET_SECONDS = "1500";
	const MOBILE_ROW1_OVERFLOW_PRESET_SECONDS_LIST = [
		MOBILE_ROW1_OVERFLOW_PRESET_SECONDS,
		MOBILE_ROW1_LONG_LAST_OVERFLOW_PRESET_SECONDS,
	];
	const TICK_MS = 250;
	const DESKTOP_EDIT_QUERY = "(min-width: 768px)";
	const LANDSCAPE_COMPACT_QUERY =
		"(orientation: landscape) and (max-height: 700px) and (max-width: 1200px)";
	const MOBILE_LANDSCAPE_INTERACTION_QUERY = `${LANDSCAPE_COMPACT_QUERY} and (hover: none) and (pointer: coarse)`;
	const MAX_RAW_DIGITS = 5;
	const MAX_DURATION_SECONDS = 9 * 3600 + 59 * 60 + 59;
	const RING_VIEWBOX_CENTER = 120;
	const RING_TICK_RADIUS = 108;
	const RING_HIT_INNER_RADIUS = 78;
	const RING_HIT_OUTER_RADIUS = 120;
	const RING_MAIN_TICK_LENGTH = 14;
	const RING_MAJOR_TICK_LENGTH = 11;
	const RING_MAJOR_OUTER_OFFSET = 1;

	let progressRingCircumference = 0;
	let lastChipButton = null;
	let isEditing = false;
	let editSnapshotDurationMs = 0;
	let rawDigitBuffer = "";
	let hasRawInputStarted = false;
	let firstKeyReplaces = true;
	let skipEditBlurCancel = false;
	let readyDisplayMs = 0;
	let completionPulseTimerId = null;

	/** @type {"ready" | "countdown" | "paused" | "timesUp"} */
	let state = "ready";
	let endTimestamp = 0;
	let timerId = null;
	let originalDurationMs = 0;
	let pausedRemainingMs = 0;
	let soundEnabled = false;
	let audioContext = null;
	let activeCompletionNodes = [];
	let completionSoundPlayedForSession = false;
	let completionPlaybackSessionId = 0;
	let timesUpSoundEligible = false;
	let isSheetOpen = false;
	let savedScrollY = 0;
	let sheetHours = 0;
	let sheetMinutes = 0;
	let ringSelectedMinutes = null;
	let ringPressedMinutes = null;
	let ringHasSelection = false;
	let ringSelectionAtPointerDown = null;
	let ringActivePointerId = null;
	let sheetSeconds = 0;

	function readSoundPreference() {
		try {
			const raw = localStorage.getItem(SOUND_PREFERENCE_STORAGE_KEY);
			if (raw === "true") {
				return true;
			}

			if (raw === "false") {
				return false;
			}
		} catch (error) {
			// Ignore read failures.
		}

		return false;
	}

	function saveSoundPreference(enabled) {
		try {
			localStorage.setItem(SOUND_PREFERENCE_STORAGE_KEY, enabled ? "true" : "false");
		} catch (error) {
			// Ignore write failures.
		}
	}

	function ensureAudioContext() {
		if (!audioContext) {
			const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
			if (!AudioContextCtor) {
				return null;
			}

			audioContext = new AudioContextCtor();
		}

		if (audioContext.state === "suspended") {
			audioContext.resume().catch(() => {
				// Ignore resume failures.
			});
		}

		return audioContext;
	}

	function stopCompletionSound() {
		activeCompletionNodes.forEach((node) => {
			try {
				if (typeof node.stop === "function") {
					node.stop(0);
				}

				if (typeof node.disconnect === "function") {
					node.disconnect();
				}
			} catch (error) {
				// Ignore teardown failures.
			}
		});

		activeCompletionNodes = [];
	}

	function resetCompletionPlaybackGuard() {
		completionSoundPlayedForSession = false;
		completionPlaybackSessionId += 1;
	}

	function scheduleCompletionSoundCleanup(sessionId) {
		window.setTimeout(() => {
			if (sessionId === completionPlaybackSessionId) {
				stopCompletionSound();
			}
		}, 4000);
	}

	function playSoftCompletionChime(ctx, sessionId) {
		const startTime = ctx.currentTime;
		const masterGain = ctx.createGain();
		masterGain.gain.setValueAtTime(0.0001, startTime);
		masterGain.gain.exponentialRampToValueAtTime(0.11, startTime + 0.08);
		masterGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 3.6);
		masterGain.connect(ctx.destination);
		activeCompletionNodes.push(masterGain);

		const notes = [
			{ frequency: 523.25, offset: 0, duration: 1.15 },
			{ frequency: 659.25, offset: 0.55, duration: 1.35 },
			{ frequency: 783.99, offset: 1.15, duration: 2.1 },
		];

		notes.forEach((note) => {
			const oscillator = ctx.createOscillator();
			const noteGain = ctx.createGain();
			const noteStart = startTime + note.offset;
			const noteEnd = noteStart + note.duration;

			oscillator.type = "sine";
			oscillator.frequency.setValueAtTime(note.frequency, noteStart);
			noteGain.gain.setValueAtTime(0.0001, noteStart);
			noteGain.gain.exponentialRampToValueAtTime(0.34, noteStart + 0.06);
			noteGain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);
			oscillator.connect(noteGain);
			noteGain.connect(masterGain);
			oscillator.start(noteStart);
			oscillator.stop(noteEnd + 0.05);
			activeCompletionNodes.push(oscillator, noteGain);
		});

		scheduleCompletionSoundCleanup(sessionId);
	}

	function playCompletionSound() {
		if (!timesUpSoundEligible || completionSoundPlayedForSession || !soundEnabled) {
			return;
		}

		const ctx = audioContext;
		if (!ctx) {
			return;
		}

		completionSoundPlayedForSession = true;
		const sessionId = completionPlaybackSessionId;

		const resumePromise = ctx.state === "suspended" ? ctx.resume() : Promise.resolve();
		resumePromise
			.then(() => {
				if (
					sessionId !== completionPlaybackSessionId ||
					!soundEnabled ||
					!timesUpSoundEligible
				) {
					return;
				}

				try {
					playSoftCompletionChime(ctx, sessionId);
				} catch (error) {
					// Ignore playback failures.
				}
			})
			.catch(() => {
				// Ignore resume failures.
			});
	}

	function syncSoundControl() {
		root.dataset.ctv2Sound = soundEnabled ? "on" : "off";
		soundToggleBtn.setAttribute("aria-pressed", soundEnabled ? "true" : "false");
		soundToggleBtn.setAttribute("aria-label", soundEnabled ? labelSoundOn : labelSoundOff);
		soundLabelEl.textContent = soundEnabled ? labelSoundOn : labelSoundOff;
	}

	function setSoundEnabled(enabled, options = {}) {
		const stopActivePlayback = options.stopActivePlayback !== false;
		soundEnabled = enabled;
		saveSoundPreference(enabled);
		syncSoundControl();

		if (!enabled && stopActivePlayback) {
			stopCompletionSound();
		}
	}

	function toggleSoundPreference() {
		ensureAudioContext();

		if (soundEnabled) {
			setSoundEnabled(false);
			return;
		}

		setSoundEnabled(true, { stopActivePlayback: false });
	}

	function prepareCountdownSoundSession() {
		timesUpSoundEligible = false;
		stopCompletionSound();
		resetCompletionPlaybackGuard();
	}

	function pad2(value) {
		return String(value).padStart(2, "0");
	}

	function isValidDurationMs(value) {
		return Number.isFinite(value) && value > 0;
	}

	function isStartableDurationMs(value) {
		if (!isValidDurationMs(value)) {
			return false;
		}

		return Math.round(value / 1000) <= MAX_DURATION_SECONDS;
	}

	function isMobileLandscapeInteractionMode() {
		return window.matchMedia(MOBILE_LANDSCAPE_INTERACTION_QUERY).matches;
	}

	function isDesktopEditEligible() {
		return (
			window.matchMedia(DESKTOP_EDIT_QUERY).matches && !isMobileLandscapeInteractionMode()
		);
	}

	function getLayoutMode() {
		if (isMobileLandscapeInteractionMode()) {
			return "mobile-landscape";
		}

		if (window.matchMedia(DESKTOP_EDIT_QUERY).matches) {
			return "desktop";
		}

		return "mobile-portrait";
	}

	function syncLayoutMode() {
		root.dataset.ctv2LayoutMode = getLayoutMode();
	}

	function canEnterEdit() {
		return state === "ready" && !isEditing && isDesktopEditEligible();
	}

	function isMobileCustomSheetLayoutMode() {
		const layoutMode = getLayoutMode();
		return layoutMode === "mobile-landscape" || layoutMode === "mobile-portrait";
	}

	function canOpenCustomSheet() {
		return (
			state === "ready" &&
			!isEditing &&
			isMobileCustomSheetLayoutMode() &&
			!isSheetOpen &&
			Boolean(customSheet && sheetOverlay)
		);
	}

	function syncTimeEntryTrigger() {
		if (canEnterEdit() || canOpenCustomSheet()) {
			timeEditTrigger.tabIndex = 0;
			timeEditTrigger.setAttribute("aria-hidden", "false");
			timeEditTrigger.setAttribute("aria-label", labelSetDuration);
			return;
		}

		timeEditTrigger.tabIndex = -1;
		timeEditTrigger.setAttribute("aria-hidden", "true");
		timeEditTrigger.removeAttribute("aria-label");
	}

	function clearSheetKeyboardSync() {
		if (!sheetPortalHost) {
			return;
		}

		sheetPortalHost.classList.remove("msb-keyboard-sync");
		sheetPortalHost.style.removeProperty("--ctv2-landscape-sheet-vvh");
		customSheet?.style.removeProperty("bottom");
		customSheet?.style.removeProperty("height");
		customSheet?.style.removeProperty("max-height");

		if (sheetOverlay) {
			sheetOverlay.style.removeProperty("top");
			sheetOverlay.style.removeProperty("height");
			sheetOverlay.style.removeProperty("bottom");
		}
	}

	function resetSheetScrollLock() {
		document.documentElement.classList.remove("msb-scroll-lock", "msb-sheet-open");
		document.body.classList.remove(
			"msb-scroll-lock",
			"msb-sheet-open",
			"tool-operation-open",
			"tool-sheet-open",
			"range-sheet-open",
			"ecv2-sheet-open",
		);
		document.body.style.top = "";
		clearSheetKeyboardSync();
	}

	function getSheetViewportMetrics() {
		const viewport = window.visualViewport;

		return {
			height: viewport?.height ?? window.innerHeight,
			offsetTop: viewport?.offsetTop ?? 0,
			innerHeight: window.innerHeight,
		};
	}

	function isSheetKeyboardOpen(metrics) {
		return metrics.height < metrics.innerHeight - 72;
	}

	function stabilizeSheetPageScroll() {
		if (!isSheetOpen) {
			return;
		}

		if (Math.abs(window.scrollY - savedScrollY) > 1) {
			window.scrollTo(0, savedScrollY);
		}
	}

	function liftSheetBy(pixels) {
		if (!customSheet || pixels <= 0) {
			return;
		}

		const currentBottom = Number.parseFloat(customSheet.style.bottom) || 0;
		customSheet.style.bottom = `${currentBottom + Math.ceil(pixels)}px`;
	}

	function ensureSheetFocusedInputVisible(metrics) {
		const active = document.activeElement;
		if (!(active instanceof HTMLElement) || !active.matches(".msb-input")) {
			return;
		}

		const rect = active.getBoundingClientRect();
		const safeBottom = metrics.offsetTop + metrics.height - 12;
		const safeTop = metrics.offsetTop + 8;

		if (rect.bottom > safeBottom) {
			const overflow = rect.bottom - safeBottom;

			if (active.closest(".msb-sheet-body") && sheetBody) {
				sheetBody.scrollTop += Math.ceil(overflow);
			}

			const nextRect = active.getBoundingClientRect();
			if (nextRect.bottom > safeBottom) {
				liftSheetBy(nextRect.bottom - safeBottom);
			}
		}

		if (rect.top < safeTop && active.closest(".msb-sheet-body") && sheetBody) {
			sheetBody.scrollTop = Math.max(0, sheetBody.scrollTop - Math.ceil(safeTop - rect.top));
		}
	}

	function ensureLandscapeSheetChromeVisible(metrics) {
		if (!isMobileLandscapeInteractionMode() || !customSheet) {
			return;
		}

		const safeBottom = metrics.offsetTop + metrics.height - 8;
		const actionRow = customSheet.querySelector(".msb-action-row");

		if (!actionRow) {
			return;
		}

		const actionRect = actionRow.getBoundingClientRect();
		if (actionRect.bottom > safeBottom) {
			liftSheetBy(actionRect.bottom - safeBottom);
		}
	}

	function syncSheetForKeyboard() {
		if (!isSheetOpen || !customSheet) {
			clearSheetKeyboardSync();
			return;
		}

		const metrics = getSheetViewportMetrics();

		if (!isSheetKeyboardOpen(metrics)) {
			clearSheetKeyboardSync();
			stabilizeSheetPageScroll();
			return;
		}

		const bottomInset = Math.max(0, metrics.innerHeight - metrics.height - metrics.offsetTop);
		const landscapeSheet = isMobileLandscapeInteractionMode();

		sheetPortalHost.classList.add("msb-keyboard-sync");
		customSheet.style.bottom = `${bottomInset}px`;

		if (landscapeSheet) {
			const viewportBudget = Math.max(Math.floor(metrics.height) - 2, 0);
			customSheet.style.height = "auto";
			customSheet.style.maxHeight = `${viewportBudget}px`;
			sheetPortalHost.style.setProperty("--ctv2-landscape-sheet-vvh", `${viewportBudget}px`);
		}

		if (sheetOverlay) {
			sheetOverlay.style.top = `${metrics.offsetTop}px`;
			sheetOverlay.style.height = `${metrics.height}px`;
			sheetOverlay.style.bottom = "auto";
		}

		stabilizeSheetPageScroll();
		ensureSheetFocusedInputVisible(metrics);
		ensureLandscapeSheetChromeVisible(metrics);
	}

	function scheduleSheetKeyboardSync() {
		window.requestAnimationFrame(() => {
			syncSheetForKeyboard();
			window.requestAnimationFrame(syncSheetForKeyboard);
		});
	}

	function lockSheetScroll() {
		savedScrollY = window.scrollY;
		document.documentElement.classList.add("msb-scroll-lock", "msb-sheet-open");
		document.body.classList.add("msb-scroll-lock", "msb-sheet-open");
	}

	function unlockSheetScroll() {
		document.documentElement.classList.remove("msb-scroll-lock", "msb-sheet-open");
		document.body.classList.remove("msb-scroll-lock", "msb-sheet-open", "tool-operation-open");
		document.body.style.top = "";
		clearSheetKeyboardSync();
		window.scrollTo(0, savedScrollY);
	}

	function getSheetFocusables() {
		if (!customSheet) {
			return [];
		}

		return Array.from(
			customSheet.querySelectorAll(
				".msb-input, .msb-action-secondary:not([disabled]), .msb-action-primary:not([disabled])",
			),
		);
	}

	function getSheetDurationMs() {
		return (sheetHours * 3600 + sheetMinutes * 60 + sheetSeconds) * 1000;
	}

	function formatSheetFieldDisplay(field, value) {
		if (value <= 0) {
			return "";
		}

		if (field === "hours") {
			return String(value);
		}

		return String(value);
	}

	function syncSheetInputsFromState() {
		if (sheetHoursInput) {
			sheetHoursInput.value = formatSheetFieldDisplay("hours", sheetHours);
			sheetHoursInput.setAttribute("aria-invalid", "false");
		}

		if (sheetMinutesInput) {
			sheetMinutesInput.value = formatSheetFieldDisplay("minutes", sheetMinutes);
			sheetMinutesInput.setAttribute("aria-invalid", "false");
		}

		if (sheetSecondsInput) {
			sheetSecondsInput.value = formatSheetFieldDisplay("seconds", sheetSeconds);
			sheetSecondsInput.setAttribute("aria-invalid", "false");
		}
	}

	function syncSheetApplyState() {
		if (!sheetApplyBtn) {
			return;
		}

		const durationMs = getSheetDurationMs();
		const enabled = isStartableDurationMs(durationMs);

		sheetApplyBtn.disabled = !enabled;
		sheetApplyBtn.setAttribute("aria-disabled", enabled ? "false" : "true");
	}

	function prefillSheetFromReadyDuration() {
		const totalSeconds = Math.floor(readyDisplayMs / 1000);
		sheetHours = Math.floor(totalSeconds / 3600);
		sheetMinutes = Math.floor((totalSeconds % 3600) / 60);
		sheetSeconds = totalSeconds % 60;
		syncSheetInputsFromState();
		syncSheetApplyState();
	}

	function focusSheetInput(input) {
		if (!(input instanceof HTMLElement)) {
			return;
		}

		input.focus({ preventScroll: true });
		scheduleSheetKeyboardSync();
	}

	function rejectSheetFieldInput(input, field) {
		const value = field === "hours" ? sheetHours : field === "minutes" ? sheetMinutes : sheetSeconds;
		input.value = formatSheetFieldDisplay(field, value);
		input.setAttribute("aria-invalid", "true");
	}

	function commitSheetFieldInput(input, field, digits, maxValue) {
		if (!digits) {
			if (field === "hours") {
				sheetHours = 0;
			} else if (field === "minutes") {
				sheetMinutes = 0;
			} else {
				sheetSeconds = 0;
			}

			input.value = "";
			input.setAttribute("aria-invalid", "false");
			syncSheetApplyState();
			return { accepted: true, advance: false };
		}

		const num = Number(digits);
		if (!Number.isFinite(num) || num > maxValue) {
			rejectSheetFieldInput(input, field);
			return { accepted: false, advance: false };
		}

		if (field === "hours") {
			sheetHours = num;
		} else if (field === "minutes") {
			sheetMinutes = num;
		} else {
			sheetSeconds = num;
		}

		input.value = digits;
		input.setAttribute("aria-invalid", "false");
		syncSheetApplyState();

		return {
			accepted: true,
			advance:
				(field === "hours" && digits.length >= 1) ||
				(field === "minutes" && digits.length >= 2),
		};
	}

	function handleSheetHoursInput() {
		if (!sheetHoursInput || !isSheetOpen) {
			return;
		}

		const digits = sheetHoursInput.value.replace(/\D/g, "").slice(0, 1);
		const result = commitSheetFieldInput(sheetHoursInput, "hours", digits, 9);

		if (result.accepted && result.advance) {
			focusSheetInput(sheetMinutesInput);
		}
	}

	function handleSheetMinutesInput() {
		if (!sheetMinutesInput || !isSheetOpen) {
			return;
		}

		const digits = sheetMinutesInput.value.replace(/\D/g, "").slice(0, 2);
		const result = commitSheetFieldInput(sheetMinutesInput, "minutes", digits, 59);

		if (result.accepted && result.advance) {
			focusSheetInput(sheetSecondsInput);
		}
	}

	function handleSheetSecondsInput() {
		if (!sheetSecondsInput || !isSheetOpen) {
			return;
		}

		const digits = sheetSecondsInput.value.replace(/\D/g, "").slice(0, 2);
		commitSheetFieldInput(sheetSecondsInput, "seconds", digits, 59);
	}

	function handleSheetFieldPaste(event, field) {
		event.preventDefault();

		if (!isSheetOpen) {
			return;
		}

		const pastedDigits = (event.clipboardData?.getData("text") || "").replace(/\D/g, "");
		if (!pastedDigits) {
			return;
		}

		if (field === "hours") {
			if (sheetHoursInput) {
				sheetHoursInput.value = pastedDigits.slice(0, 1);
				handleSheetHoursInput();
			}

			return;
		}

		if (field === "minutes") {
			if (sheetMinutesInput) {
				sheetMinutesInput.value = pastedDigits.slice(0, 2);
				handleSheetMinutesInput();
			}

			return;
		}

		if (sheetSecondsInput) {
			sheetSecondsInput.value = pastedDigits.slice(0, 2);
			handleSheetSecondsInput();
		}
	}

	function applySheetAndStart() {
		if (!isSheetOpen || !sheetApplyBtn || sheetApplyBtn.disabled) {
			return;
		}

		const durationMs = getSheetDurationMs();
		if (!isStartableDurationMs(durationMs)) {
			return;
		}

		closeCustomTimeSheet({ restoreFocus: false });
		startCountdown(durationMs);
	}

	function trapSheetFocus(event) {
		if (!isSheetOpen || event.key !== "Tab") {
			return;
		}

		const focusables = getSheetFocusables();
		if (!focusables.length) {
			return;
		}

		const first = focusables[0];
		const last = focusables[focusables.length - 1];
		const active = document.activeElement;

		if (event.shiftKey) {
			if (active === first || !customSheet?.contains(active)) {
				event.preventDefault();
				last.focus();
			}

			return;
		}

		if (active === last || !customSheet?.contains(active)) {
			event.preventDefault();
			first.focus();
		}
	}

	function openCustomTimeSheet() {
		if (!canOpenCustomSheet() || !sheetOverlay || !customSheet) {
			return;
		}

		prefillSheetFromReadyDuration();
		isSheetOpen = true;
		root.dataset.ctv2SheetOpen = "true";
		sheetOverlay.removeAttribute("hidden");
		sheetOverlay.classList.add("is-visible");
		sheetOverlay.setAttribute("aria-hidden", "false");
		customSheet.classList.add("is-open");
		customSheet.setAttribute("aria-hidden", "false");
		customSheet.inert = false;
		lockSheetScroll();
		syncTimeEntryTrigger();
		syncRingInteraction();
		customSheet.focus({ preventScroll: true });
	}

	function closeCustomTimeSheet(options = {}) {
		const { restoreFocus = true } = options;

		if (!isSheetOpen || !sheetOverlay || !customSheet) {
			return;
		}

		isSheetOpen = false;
		delete root.dataset.ctv2SheetOpen;
		sheetOverlay.classList.remove("is-visible");
		sheetOverlay.setAttribute("hidden", "");
		sheetOverlay.setAttribute("aria-hidden", "true");
		customSheet.classList.remove("is-open");
		customSheet.setAttribute("aria-hidden", "true");
		customSheet.inert = true;
		unlockSheetScroll();
		syncTimeEntryTrigger();
		syncRingInteraction();

		if (customSheet.contains(document.activeElement)) {
			document.activeElement.blur();
		}

		if (restoreFocus) {
			timeEditTrigger.focus({ preventScroll: true });
		}
	}

	function teardownDesktopEditSession() {
		if (isEditing) {
			cancelEditPreview();
			return;
		}

		resetEditSessionState();
		clearRawInputVisual();
		delete root.dataset.ctv2EditMode;

		if (document.activeElement === keyboardCaptureInput) {
			keyboardCaptureInput.blur();
		}
	}

	function syncQuickStartRowLayout() {
		if (!lastChipButton) {
			return;
		}

		const durationMs = Number(lastChipButton.dataset.ctv2QuickStartSeconds) * 1000;
		if (!Number.isFinite(durationMs) || durationMs <= 0) {
			return;
		}

		rebalanceQuickStartRowsForLast(true, durationMs);
	}

	function handleLayoutModeChange() {
		if (isSheetOpen) {
			closeCustomTimeSheet({ restoreFocus: false });
		}

		if (!isDesktopEditEligible()) {
			teardownDesktopEditSession();
		}

		syncLayoutMode();
		syncQuickStartRowLayout();
		syncUI();
	}

	function parseRawDigitsToTotalSeconds(digits) {
		if (!digits) {
			return 0;
		}

		let hours = 0;
		let minutes = 0;
		let seconds = 0;

		if (digits.length <= 2) {
			seconds = Number(digits);
		} else if (digits.length <= 4) {
			seconds = Number(digits.slice(-2));
			minutes = Number(digits.slice(0, -2));
		} else {
			seconds = Number(digits.slice(-2));
			minutes = Number(digits.slice(-4, -2));
			hours = Number(digits.slice(0, -4));
		}

		return hours * 3600 + minutes * 60 + seconds;
	}

	function getPendingEditDurationMs() {
		return parseRawDigitsToTotalSeconds(rawDigitBuffer) * 1000;
	}

	function showZeroDurationValidation() {
		if (!editValidationEl) {
			return;
		}

		editValidationEl.textContent = labelZeroDuration;
		root.dataset.ctv2EditValidation = "zero";
		keyboardCaptureInput.setAttribute("aria-invalid", "true");
	}

	function showMaxDurationValidation() {
		if (!editValidationEl) {
			return;
		}

		editValidationEl.textContent = labelMaxDuration;
		root.dataset.ctv2EditValidation = "max";
		keyboardCaptureInput.setAttribute("aria-invalid", "true");
	}

	function clearEditValidation() {
		if (!editValidationEl) {
			return;
		}

		editValidationEl.textContent = "";
		delete root.dataset.ctv2EditValidation;
		keyboardCaptureInput.setAttribute("aria-invalid", "false");
	}

	function isRawDigitBufferWithinMax(digits) {
		return parseRawDigitsToTotalSeconds(digits) <= MAX_DURATION_SECONDS;
	}

	function updateRawDigitDisplay() {
		const totalSeconds = parseRawDigitsToTotalSeconds(rawDigitBuffer);
		const segments = formatTimeSegments(totalSeconds * 1000);

		if (hasRawInputStarted) {
			root.dataset.ctv2RawInput = "active";
		}

		renderEditingTimeDisplay(segments);
		minutesEl.classList.add("ctv2-time-raw-edit");
		secondsEl.classList.add("ctv2-time-raw-edit");
	}

	function clearRawInputVisual() {
		delete root.dataset.ctv2RawInput;
		minutesEl.classList.remove("ctv2-time-raw-edit");
		secondsEl.classList.remove("ctv2-time-raw-edit");
	}

	function resetEditSessionState() {
		rawDigitBuffer = "";
		hasRawInputStarted = false;
		firstKeyReplaces = true;
		keyboardCaptureInput.value = "";
		clearEditValidation();
	}

	function enterEditMode() {
		if (!canEnterEdit()) {
			return;
		}

		editSnapshotDurationMs = readyDisplayMs;
		resetEditSessionState();
		isEditing = true;
		root.dataset.ctv2EditMode = "editing";
		keyboardCaptureInput.setAttribute("aria-invalid", "false");
		timeEditTrigger.setAttribute("aria-hidden", "true");
		syncTimeEntryTrigger();
		syncControls();
		keyboardCaptureInput.focus();
		keyboardCaptureInput.value = "";
	}

	function exitEditMode() {
		if (!isEditing) {
			return;
		}

		isEditing = false;
		delete root.dataset.ctv2EditMode;
		clearRawInputVisual();
		resetEditSessionState();
		syncTimeEntryTrigger();
	}

	function applyEditDuration() {
		const durationMs = getPendingEditDurationMs();
		if (!isValidDurationMs(durationMs)) {
			return false;
		}

		skipEditBlurCancel = true;
		originalDurationMs = durationMs;
		exitEditMode();
		updateDisplay(durationMs);
		keyboardCaptureInput.blur();
		skipEditBlurCancel = false;
		syncUI();
		return true;
	}

	function focusStartButtonIfReady() {
		if (state !== "ready" || primaryBtn.disabled || !isDesktopEditEligible()) {
			return;
		}

		primaryBtn.focus({ preventScroll: true });
	}

	function scheduleFocusStartAfterEnterKey() {
		const onEnterKeyUp = (event) => {
			if (event.key !== "Enter") {
				return;
			}

			window.removeEventListener("keyup", onEnterKeyUp, true);
			queueMicrotask(() => {
				focusStartButtonIfReady();
			});
		};

		window.addEventListener("keyup", onEnterKeyUp, true);
	}

	function tryApplyEditOnEnter(event) {
		if (event.repeat) {
			return;
		}

		const durationMs = getPendingEditDurationMs();
		if (!isValidDurationMs(durationMs)) {
			showZeroDurationValidation();
			syncControls();
			return;
		}

		if (!applyEditDuration()) {
			return;
		}

		scheduleFocusStartAfterEnterKey();
	}

	function finalizeEditOnLeave() {
		if (!isEditing) {
			return;
		}

		const durationMs = getPendingEditDurationMs();
		if (isValidDurationMs(durationMs)) {
			applyEditDuration();
			return;
		}

		cancelEditPreview();
	}

	function cancelEditPreview() {
		if (!isEditing) {
			return;
		}

		skipEditBlurCancel = true;
		updateDisplay(editSnapshotDurationMs);
		exitEditMode();
		keyboardCaptureInput.blur();
		skipEditBlurCancel = false;
		syncUI();
	}

	function appendRawDigit(digit) {
		if (!isEditing || rawDigitBuffer.length >= MAX_RAW_DIGITS) {
			return;
		}

		const candidate = firstKeyReplaces ? digit : rawDigitBuffer + digit;
		if (!isRawDigitBufferWithinMax(candidate)) {
			showMaxDurationValidation();
			return;
		}

		clearEditValidation();
		firstKeyReplaces = false;
		hasRawInputStarted = true;
		rawDigitBuffer = candidate;
		keyboardCaptureInput.value = "";
		updateRawDigitDisplay();
	}

	function deleteRawDigit() {
		if (!isEditing) {
			return;
		}

		if (!hasRawInputStarted) {
			return;
		}

		clearEditValidation();
		rawDigitBuffer = rawDigitBuffer.slice(0, -1);
		keyboardCaptureInput.value = "";

		if (rawDigitBuffer.length === 0) {
			hasRawInputStarted = false;
			firstKeyReplaces = true;
			clearRawInputVisual();
			return;
		}

		updateRawDigitDisplay();
	}

	function applyInputDigits(incomingDigits) {
		if (!incomingDigits) {
			keyboardCaptureInput.value = "";
			return;
		}

		let validated = firstKeyReplaces ? "" : rawDigitBuffer;
		const priorValidated = validated;
		let hitMax = false;

		for (const char of incomingDigits) {
			if (validated.length >= MAX_RAW_DIGITS) {
				break;
			}

			const candidate = validated + char;
			if (!isRawDigitBufferWithinMax(candidate)) {
				hitMax = true;
				break;
			}

			validated = candidate;
		}

		keyboardCaptureInput.value = "";

		if (hitMax) {
			showMaxDurationValidation();
		} else {
			clearEditValidation();
		}

		if (validated === priorValidated) {
			return;
		}

		rawDigitBuffer = validated;

		if (rawDigitBuffer.length > 0) {
			firstKeyReplaces = false;
			hasRawInputStarted = true;
			updateRawDigitDisplay();
			return;
		}

		hasRawInputStarted = false;
		firstKeyReplaces = true;
		clearRawInputVisual();
	}

	function readLastDurationMs() {
		try {
			const raw = localStorage.getItem(LAST_DURATION_STORAGE_KEY);
			if (!raw) {
				return null;
			}

			const parsed = Number(raw);
			if (!isValidDurationMs(parsed)) {
				return null;
			}

			return parsed;
		} catch (error) {
			return null;
		}
	}

	function saveLastDurationMs(durationMs) {
		if (!isValidDurationMs(durationMs)) {
			return;
		}

		try {
			localStorage.setItem(LAST_DURATION_STORAGE_KEY, String(durationMs));
		} catch (error) {
			// Ignore write failures.
		}
	}

	function formatDurationLabel(durationMs) {
		const totalSeconds = Math.floor(durationMs / 1000);
		const hours = Math.floor(totalSeconds / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const seconds = totalSeconds % 60;

		if (isZhLocale) {
			if (totalSeconds < 60) {
				return `${totalSeconds}秒`;
			}

			if (totalSeconds < 3600) {
				if (seconds === 0) {
					return `${minutes}分`;
				}

				return `${minutes}分${seconds}秒`;
			}

			if (minutes === 0 && seconds === 0) {
				return `${hours}小時`;
			}

			if (seconds === 0) {
				return `${hours}小時${minutes}分`;
			}

			if (minutes === 0) {
				return `${hours}小時${seconds}秒`;
			}

			return `${hours}小時${minutes}分${seconds}秒`;
		}

		if (totalSeconds < 60) {
			return `${totalSeconds}s`;
		}

		if (totalSeconds < 3600) {
			if (seconds === 0) {
				return `${minutes}m`;
			}

			return `${minutes}m ${seconds}s`;
		}

		if (minutes === 0 && seconds === 0) {
			return `${hours}h`;
		}

		if (seconds === 0) {
			return `${hours}h ${minutes}m`;
		}

		if (minutes === 0) {
			return `${hours}h ${seconds}s`;
		}

		return `${hours}h ${minutes}m ${seconds}s`;
	}

	function formatLastChipLabel(durationMs) {
		return `${labelLast} ${formatDurationLabel(durationMs)}`;
	}

	function getMobileRow1OverflowPresets(durationMs) {
		if (durationMs >= 3600000) {
			return MOBILE_ROW1_OVERFLOW_PRESET_SECONDS_LIST;
		}

		return [MOBILE_ROW1_OVERFLOW_PRESET_SECONDS];
	}

	function rebalanceQuickStartRowsForLast(showLast, durationMs = 0) {
		if (!quickStartSecondaryRow || !quickStartPrimaryRow) {
			return;
		}

		const overflowPresets = showLast ? getMobileRow1OverflowPresets(durationMs) : [];

		for (const presetSeconds of MOBILE_ROW1_OVERFLOW_PRESET_SECONDS_LIST) {
			const overflowBtn =
				quickStartPrimaryRow.querySelector(
					`[data-ctv2-quick-start-seconds="${presetSeconds}"]:not([data-ctv2-last-chip])`,
				) ||
				quickStartSecondaryRow.querySelector(
					`[data-ctv2-quick-start-seconds="${presetSeconds}"]`,
				);

			if (!overflowBtn || overflowBtn.parentElement !== quickStartSecondaryRow) {
				continue;
			}

			quickStartPrimaryRow.appendChild(overflowBtn);
		}

		if (!showLast) {
			return;
		}

		const row2Anchor =
			quickStartSecondaryRow.querySelector(
				`[data-ctv2-quick-start-seconds="${MOBILE_ROW2_STATIC_ANCHOR_PRESET_SECONDS}"]`,
			) || quickStartSecondaryRow.firstElementChild;

		for (const presetSeconds of overflowPresets) {
			const overflowBtn = quickStartPrimaryRow.querySelector(
				`[data-ctv2-quick-start-seconds="${presetSeconds}"]:not([data-ctv2-last-chip])`,
			);

			if (!overflowBtn) {
				continue;
			}

			quickStartSecondaryRow.insertBefore(overflowBtn, row2Anchor);
		}
	}

	function ensureLastChip(durationMs) {
		if (!isValidDurationMs(durationMs)) {
			removeLastChip();
			return;
		}

		const seconds = String(Math.round(durationMs / 1000));

		if (!lastChipButton) {
			lastChipButton = document.createElement("button");
			lastChipButton.type = "button";
			lastChipButton.className = "ctv2-quick-start-btn";
			lastChipButton.dataset.ctv2LastChip = "";
			quickStartPrimaryRow.prepend(lastChipButton);
		}

		lastChipButton.dataset.ctv2QuickStartSeconds = seconds;
		lastChipButton.textContent = formatLastChipLabel(durationMs);
		rebalanceQuickStartRowsForLast(true, durationMs);
	}

	function removeLastChip() {
		if (lastChipButton) {
			lastChipButton.remove();
			lastChipButton = null;
			rebalanceQuickStartRowsForLast(false);
		}
	}

	function syncLastChipFromStorage() {
		const storedDurationMs = readLastDurationMs();
		if (storedDurationMs) {
			ensureLastChip(storedDurationMs);
			return;
		}

		removeLastChip();
	}

	function formatTimeSegments(remainingMs) {
		const clampedMs = Math.max(0, remainingMs);
		const totalSeconds = Math.ceil(clampedMs / 1000);

		if (totalSeconds >= 3600) {
			const hours = Math.floor(totalSeconds / 3600);
			const minutes = Math.floor((totalSeconds % 3600) / 60);
			const seconds = totalSeconds % 60;

			return {
				format: "long",
				hoursText: String(hours),
				minutesText: pad2(minutes),
				secondsText: pad2(seconds),
				formatted: `${hours}:${pad2(minutes)}:${pad2(seconds)}`,
				// Combined segments for raw editing display.
				editMinutesText: `${hours}:${pad2(minutes)}`,
			};
		}

		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;

		return {
			format: "short",
			hoursText: "",
			minutesText: pad2(minutes),
			secondsText: pad2(seconds),
			formatted: `${pad2(minutes)}:${pad2(seconds)}`,
			editMinutesText: pad2(minutes),
		};
	}

	function resetVisibleTimeGrid() {
		if (timeGridEl) {
			timeGridEl.dataset.ctv2TimeFormat = "short";
		}

		if (timeShellEl) {
			timeShellEl.dataset.ctv2TimeFormat = "short";
		}

		if (hoursEl) {
			hoursEl.textContent = "";
			hoursEl.setAttribute("aria-hidden", "true");
		}

		minutesEl.textContent = "";
		secondsEl.textContent = "";
	}

	function applyVisibleTimeGrid(segments) {
		if (timeGridEl) {
			timeGridEl.dataset.ctv2TimeFormat = segments.format;
		}

		if (timeShellEl) {
			timeShellEl.dataset.ctv2TimeFormat = segments.format;
		}

		if (hoursEl) {
			hoursEl.textContent = segments.hoursText;
			hoursEl.setAttribute("aria-hidden", segments.format === "long" ? "false" : "true");
		}

		minutesEl.textContent = segments.minutesText;
		secondsEl.textContent = segments.secondsText;

		if (timeDisplayEl) {
			timeDisplayEl.textContent = segments.formatted;
		}
	}

	function renderReadyTimeDisplay(segments) {
		resetVisibleTimeGrid();
		applyVisibleTimeGrid(segments);
	}

	function renderEditingTimeDisplay(segments) {
		resetVisibleTimeGrid();
		applyVisibleTimeGrid(segments);
	}

	function getRemainingMs() {
		return Math.max(0, endTimestamp - Date.now());
	}

	function updateDisplay(remainingMs) {
		const segments = formatTimeSegments(remainingMs);

		renderReadyTimeDisplay(segments);
		minutesEl.classList.remove("ctv2-time-raw-edit");
		secondsEl.classList.remove("ctv2-time-raw-edit");

		if (state === "ready" && !isEditing) {
			readyDisplayMs = remainingMs;
		}
	}

	function getProgressRingCircumference() {
		if (!progressActiveRing) {
			return 0;
		}

		if (!progressRingCircumference) {
			progressRingCircumference = progressActiveRing.getTotalLength();
		}

		if (!progressRingCircumference) {
			progressRingCircumference = 2 * Math.PI * 108;
		}

		return progressRingCircumference;
	}

	function updateActiveProgressRing(remainingMs) {
		if (!progressActiveRing || originalDurationMs <= 0) {
			return;
		}

		const circumference = getProgressRingCircumference();
		if (!circumference) {
			return;
		}

		const progress = Math.max(0, Math.min(1, remainingMs / originalDurationMs));
		const dashOffset = circumference * (1 - progress);
		progressActiveRing.setAttribute("stroke-dasharray", String(circumference));
		progressActiveRing.setAttribute("stroke-dashoffset", String(dashOffset));
	}

	function syncRingMode() {
		if (state === "ready") {
			root.dataset.ctv2RingMode = "ready";
			return;
		}

		if (state === "timesUp") {
			root.dataset.ctv2RingMode = "complete";
			return;
		}

		root.dataset.ctv2RingMode = "progress";
		const remainingMs = state === "paused" ? pausedRemainingMs : getRemainingMs();
		updateActiveProgressRing(remainingMs);
	}

	function canUseRingInteraction() {
		return (
			getLayoutMode() === "mobile-portrait" &&
			state === "ready" &&
			!isEditing &&
			!isSheetOpen
		);
	}

	function ringSelectionFromDurationMs(durationMs) {
		if (!isValidDurationMs(durationMs)) {
			return null;
		}

		const totalSeconds = Math.round(durationMs / 1000);
		if (totalSeconds > 3600 || totalSeconds % 60 !== 0) {
			return null;
		}

		const minutes = totalSeconds / 60;
		if (minutes < 1 || minutes > 60) {
			return null;
		}

		return minutes;
	}

	function resetPortraitTickGeometry(tick, minute) {
		const base = portraitTickBaseCoords.get(minute);
		if (!tick || !base) {
			return;
		}

		tick.setAttribute("x1", String(base.x1));
		tick.setAttribute("y1", String(base.y1));
		tick.setAttribute("x2", String(base.x2));
		tick.setAttribute("y2", String(base.y2));
	}

	function getPortraitTickOuterDistance(base) {
		return Math.hypot(base.x2 - RING_VIEWBOX_CENTER, base.y2 - RING_VIEWBOX_CENTER);
	}

	function applyPortraitTickLength(tick, base, tickLength, outerDistance) {
		if (!tick || !base) {
			return;
		}

		const outerDist = outerDistance ?? getPortraitTickOuterDistance(base);
		const unitX = (base.x2 - RING_VIEWBOX_CENTER) / outerDist;
		const unitY = (base.y2 - RING_VIEWBOX_CENTER) / outerDist;
		const innerDist = outerDist - tickLength;
		const outerX = RING_VIEWBOX_CENTER + unitX * outerDist;
		const outerY = RING_VIEWBOX_CENTER + unitY * outerDist;
		const innerX = RING_VIEWBOX_CENTER + unitX * innerDist;
		const innerY = RING_VIEWBOX_CENTER + unitY * innerDist;

		tick.setAttribute("x1", String(innerX));
		tick.setAttribute("y1", String(innerY));
		tick.setAttribute("x2", String(outerX));
		tick.setAttribute("y2", String(outerY));
	}

	function applyMainLengthTickGeometry(tick, minute) {
		const base = portraitTickBaseCoords.get(minute);
		if (!tick || !base) {
			return;
		}

		applyPortraitTickLength(tick, base, RING_MAIN_TICK_LENGTH);
	}

	function applyMajorTickGeometry(tick, minute) {
		const base = portraitTickBaseCoords.get(minute);
		if (!tick || !base) {
			return;
		}

		const outerDist = RING_TICK_RADIUS + RING_MAJOR_OUTER_OFFSET;
		applyPortraitTickLength(tick, base, RING_MAJOR_TICK_LENGTH, outerDist);
	}

	function clearPortraitTickStates() {
		portraitTickByMinute.forEach((tick, minute) => {
			tick.classList.remove("ctv2-tick--active", "ctv2-tick--pressed");
			resetPortraitTickGeometry(tick, minute);
		});
	}

	function syncRingTickStates() {
		clearPortraitTickStates();

		if (!canUseRingInteraction()) {
			delete root.dataset.ctv2RingHasSelection;
			delete root.dataset.ctv2RingActiveMinute;
			delete root.dataset.ctv2RingPressedMinute;
			return;
		}

		if (ringHasSelection) {
			root.dataset.ctv2RingHasSelection = "true";
		} else {
			delete root.dataset.ctv2RingHasSelection;
		}

		if (ringHasSelection && ringSelectedMinutes !== 60) {
			applyMajorTickGeometry(portraitTickByMinute.get(60), 60);
		}

		if (ringSelectedMinutes != null) {
			root.dataset.ctv2RingActiveMinute = String(ringSelectedMinutes);
			const activeTick = portraitTickByMinute.get(ringSelectedMinutes);
			activeTick?.classList.add("ctv2-tick--active");
			applyMainLengthTickGeometry(activeTick, ringSelectedMinutes);
		} else {
			delete root.dataset.ctv2RingActiveMinute;
		}

		if (ringPressedMinutes != null) {
			root.dataset.ctv2RingPressedMinute = String(ringPressedMinutes);
			const pressedTick = portraitTickByMinute.get(ringPressedMinutes);
			if (pressedTick) {
				pressedTick.classList.add("ctv2-tick--pressed");
				applyMainLengthTickGeometry(pressedTick, ringPressedMinutes);
			}
		} else {
			delete root.dataset.ctv2RingPressedMinute;
		}
	}

	function clearRingSelection() {
		ringSelectedMinutes = null;
		ringHasSelection = false;
		ringPressedMinutes = null;
		syncRingTickStates();
	}

	function syncRingSelectionFromDuration(durationMs) {
		if (state !== "ready" || !canUseRingInteraction()) {
			return;
		}

		if (!isValidDurationMs(durationMs)) {
			ringSelectedMinutes = null;
			ringHasSelection = false;
			syncRingTickStates();
			return;
		}

		const minutes = ringSelectionFromDurationMs(durationMs);
		ringSelectedMinutes = minutes;
		ringHasSelection = minutes != null;
		syncRingTickStates();
	}

	function clientPointToRingAngleMinutes(clientX, clientY) {
		if (!tickRingSvg) {
			return null;
		}

		const rect = tickRingSvg.getBoundingClientRect();
		if (!rect.width || !rect.height) {
			return null;
		}

		const cx = rect.left + rect.width / 2;
		const cy = rect.top + rect.height / 2;
		const dx = clientX - cx;
		const dy = clientY - cy;
		let angle = Math.atan2(dx, -dy);

		if (angle < 0) {
			angle += 2 * Math.PI;
		}

		let minutes = Math.round((angle / (2 * Math.PI)) * 60);

		if (minutes <= 0) {
			minutes = 60;
		}

		if (minutes > 60) {
			minutes = 60;
		}

		return minutes;
	}

	function clientPointToRingMinutes(clientX, clientY) {
		if (!tickRingSvg) {
			return null;
		}

		const rect = tickRingSvg.getBoundingClientRect();
		if (!rect.width || !rect.height) {
			return null;
		}

		const cx = rect.left + rect.width / 2;
		const cy = rect.top + rect.height / 2;
		const dx = clientX - cx;
		const dy = clientY - cy;
		const distance = Math.hypot(dx, dy);
		const scale = rect.width / 240;
		const minDistance = RING_HIT_INNER_RADIUS * scale;
		const maxDistance = RING_HIT_OUTER_RADIUS * scale;

		if (distance < minDistance || distance > maxDistance) {
			return null;
		}

		return clientPointToRingAngleMinutes(clientX, clientY);
	}

	function setReadyDurationFromRing(minutes) {
		if (!canUseRingInteraction() || minutes < 1 || minutes > 60) {
			return;
		}

		const durationMs = minutes * 60 * 1000;
		ringSelectedMinutes = minutes;
		ringHasSelection = true;
		originalDurationMs = durationMs;
		updateDisplay(durationMs);
		syncRingTickStates();
		syncControls();
	}

	function resetRingToInitial() {
		ringSelectedMinutes = null;
		ringHasSelection = false;
		ringPressedMinutes = null;
		originalDurationMs = 0;
		updateDisplay(0);
		syncRingTickStates();
		syncControls();
	}

	function applyRingPreviewMinutes(minutes) {
		if (minutes == null || minutes < 1 || minutes > 60) {
			return;
		}

		ringPressedMinutes = minutes;
		ringSelectedMinutes = minutes;
		ringHasSelection = true;
		originalDurationMs = minutes * 60 * 1000;
		updateDisplay(originalDurationMs);
		syncRingTickStates();
		syncControls();
	}

	function releaseRingPointerCapture() {
		if (ringActivePointerId == null || !ringHitArea) {
			ringActivePointerId = null;
			return;
		}

		if (ringHitArea.hasPointerCapture(ringActivePointerId)) {
			ringHitArea.releasePointerCapture(ringActivePointerId);
		}

		ringActivePointerId = null;
	}

	function revertRingGesture() {
		ringPressedMinutes = null;

		if (ringSelectionAtPointerDown != null) {
			setReadyDurationFromRing(ringSelectionAtPointerDown);
			return;
		}

		resetRingToInitial();
	}

	function finishRingPointerGesture(commit) {
		const minutes = ringPressedMinutes;
		ringPressedMinutes = null;
		releaseRingPointerCapture();

		if (!canUseRingInteraction()) {
			syncRingTickStates();
			return;
		}

		if (commit && minutes != null) {
			setReadyDurationFromRing(minutes);
			return;
		}

		revertRingGesture();
	}

	function handleRingPointerDown(event) {
		if (!canUseRingInteraction() || event.button !== 0 || ringActivePointerId != null) {
			return;
		}

		const minutes = clientPointToRingMinutes(event.clientX, event.clientY);
		if (minutes == null) {
			return;
		}

		event.preventDefault();
		event.stopPropagation();

		ringSelectionAtPointerDown = ringSelectedMinutes;
		ringActivePointerId = event.pointerId;
		ringHitArea.setPointerCapture(event.pointerId);
		applyRingPreviewMinutes(minutes);
	}

	function handleRingPointerMove(event) {
		if (event.pointerId !== ringActivePointerId) {
			return;
		}

		event.preventDefault();

		const minutes = clientPointToRingAngleMinutes(event.clientX, event.clientY);
		if (minutes == null || minutes === ringPressedMinutes) {
			return;
		}

		applyRingPreviewMinutes(minutes);
	}

	function handleRingPointerUp(event) {
		if (event.pointerId !== ringActivePointerId) {
			return;
		}

		event.preventDefault();
		finishRingPointerGesture(true);
	}

	function handleRingPointerCancel(event) {
		if (event.pointerId !== ringActivePointerId) {
			return;
		}

		event.preventDefault();
		finishRingPointerGesture(false);
	}

	function handleRingLostPointerCapture(event) {
		if (event.pointerId !== ringActivePointerId) {
			return;
		}

		finishRingPointerGesture(false);
	}

	function syncRingInteraction() {
		const enabled = canUseRingInteraction();

		if (ringHitArea) {
			ringHitArea.disabled = !enabled;
			ringHitArea.tabIndex = -1;
		}

		if (!enabled) {
			releaseRingPointerCapture();
			ringPressedMinutes = null;
		}

		if (state === "ready" && enabled) {
			syncRingSelectionFromDuration(originalDurationMs);
			return;
		}

		syncRingTickStates();
	}

	function clearCompletionPulseTimer() {
		if (completionPulseTimerId !== null) {
			clearTimeout(completionPulseTimerId);
			completionPulseTimerId = null;
		}
	}

	function syncCompletionStatus() {
		if (!completionStatusEl) {
			return;
		}

		clearCompletionPulseTimer();

		if (state === "timesUp") {
			completionStatusEl.textContent = labelTimesUp;
			completionStatusEl.hidden = false;
			root.dataset.ctv2Completion = "visible";
			root.dataset.ctv2CompletionPulse = "active";
			completionPulseTimerId = window.setTimeout(() => {
				if (state === "timesUp") {
					delete root.dataset.ctv2CompletionPulse;
				}

				completionPulseTimerId = null;
			}, 4000);
			return;
		}

		completionStatusEl.textContent = "";
		completionStatusEl.hidden = true;
		delete root.dataset.ctv2Completion;
		delete root.dataset.ctv2CompletionPulse;
	}

	function syncQuickStartVisibility() {
		const showQuickStart = state === "ready";

		if (showQuickStart) {
			delete root.dataset.ctv2QuickStart;
			quickStartContainer.setAttribute("aria-hidden", "false");
		} else {
			root.dataset.ctv2QuickStart = "hidden";
			quickStartContainer.setAttribute("aria-hidden", "true");
		}

		quickStartContainer.querySelectorAll("button").forEach((button) => {
			if (showQuickStart) {
				button.removeAttribute("tabindex");
				button.removeAttribute("aria-hidden");
			} else {
				button.tabIndex = -1;
				button.setAttribute("aria-hidden", "true");
			}
		});
	}

	function setPrimaryEnabled(enabled) {
		primaryBtn.disabled = !enabled;

		if (enabled) {
			primaryBtn.removeAttribute("aria-disabled");
		} else {
			primaryBtn.setAttribute("aria-disabled", "true");
		}
	}

	function stopTicking() {
		if (timerId !== null) {
			clearInterval(timerId);
			timerId = null;
		}
	}

	function setPrimaryButton(mode) {
		const primaryClasses = ["ctv2-btn-start", "ctv2-btn-pause", "ctv2-btn-resume", "ctv2-btn-done"];
		primaryBtn.classList.remove(...primaryClasses);

		if (mode === "pause") {
			primaryBtn.textContent = labelPause;
			primaryBtn.classList.add("ctv2-btn-pause");
			return;
		}

		if (mode === "resume") {
			primaryBtn.textContent = labelResume;
			primaryBtn.classList.add("ctv2-btn-resume");
			return;
		}

		if (mode === "done") {
			primaryBtn.textContent = labelDone;
			primaryBtn.classList.add("ctv2-btn-done");
			return;
		}

		primaryBtn.textContent = labelStart;
		primaryBtn.classList.add("ctv2-btn-start");
	}

	function syncControls() {
		if (state === "ready") {
			cancelBtn.disabled = true;
			setPrimaryButton("start");
			setPrimaryEnabled(!isEditing && isStartableDurationMs(originalDurationMs));
			syncTimeEntryTrigger();
			syncQuickStartVisibility();
			return;
		}

		if (state === "timesUp") {
			cancelBtn.disabled = true;
			setPrimaryButton("done");
			setPrimaryEnabled(true);
			syncTimeEntryTrigger();
			syncQuickStartVisibility();
			return;
		}

		cancelBtn.disabled = false;
		syncQuickStartVisibility();

		if (state === "countdown") {
			setPrimaryButton("pause");
			setPrimaryEnabled(true);
			syncTimeEntryTrigger();
			return;
		}

		setPrimaryButton("resume");
		setPrimaryEnabled(true);
		syncTimeEntryTrigger();
	}

	function syncUI() {
		if (isSheetOpen && state !== "ready") {
			closeCustomTimeSheet({ restoreFocus: false });
		}

		syncLayoutMode();
		syncControls();
		syncRingMode();
		syncRingInteraction();
		syncCompletionStatus();
	}

	function enterTimesUp() {
		if (state === "timesUp") {
			return;
		}

		stopTicking();
		endTimestamp = 0;
		pausedRemainingMs = 0;
		state = "timesUp";
		timesUpSoundEligible = true;
		syncUI();
		playCompletionSound();
	}

	function resetToInitialReady() {
		stopTicking();
		endTimestamp = 0;
		pausedRemainingMs = 0;
		originalDurationMs = 0;
		readyDisplayMs = 0;
		state = "ready";
		timesUpSoundEligible = false;
		stopCompletionSound();
		cancelEditPreview();
		clearRingSelection();
		updateDisplay(0);
		syncUI();
	}

	function tick() {
		const remainingMs = getRemainingMs();

		if (remainingMs <= 0) {
			enterTimesUp();
			return;
		}

		updateDisplay(remainingMs);
		updateActiveProgressRing(remainingMs);
	}

	function startCountdown(durationMs) {
		if (!isStartableDurationMs(durationMs)) {
			return;
		}

		if (soundEnabled) {
			ensureAudioContext();
		}

		cancelEditPreview();
		prepareCountdownSoundSession();
		stopTicking();
		originalDurationMs = durationMs;
		endTimestamp = Date.now() + durationMs;
		pausedRemainingMs = 0;
		state = "countdown";
		saveLastDurationMs(durationMs);
		ensureLastChip(durationMs);
		updateDisplay(durationMs);
		syncUI();
		timerId = setInterval(tick, TICK_MS);
		tick();
	}

	function pauseCountdown() {
		if (state !== "countdown") {
			return;
		}

		pausedRemainingMs = getRemainingMs();
		if (pausedRemainingMs <= 0) {
			return;
		}

		stopTicking();
		endTimestamp = 0;
		state = "paused";
		updateDisplay(pausedRemainingMs);
		syncUI();
	}

	function resumeCountdown() {
		if (state !== "paused" || pausedRemainingMs <= 0) {
			return;
		}

		endTimestamp = Date.now() + pausedRemainingMs;
		state = "countdown";
		syncUI();
		timerId = setInterval(tick, TICK_MS);
		tick();
	}

	function cancelCountdown() {
		stopTicking();
		endTimestamp = 0;
		pausedRemainingMs = 0;
		state = "ready";
		updateDisplay(originalDurationMs);
		syncUI();
	}

	function getQuickStartDurationMs(button) {
		const seconds = Number(button.dataset.ctv2QuickStartSeconds);
		if (!Number.isFinite(seconds) || seconds <= 0) {
			return 0;
		}

		return seconds * 1000;
	}

	timeEditTrigger.addEventListener("click", () => {
		if (canEnterEdit()) {
			enterEditMode();
			return;
		}

		if (canOpenCustomSheet()) {
			openCustomTimeSheet();
		}
	});

	timeEditTrigger.addEventListener("keydown", (event) => {
		if (canEnterEdit()) {
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				enterEditMode();
			}

			return;
		}

		if (canOpenCustomSheet() && (event.key === "Enter" || event.key === " ")) {
			event.preventDefault();
			openCustomTimeSheet();
		}
	});

	keyboardCaptureInput.addEventListener("keydown", (event) => {
		if (!isEditing) {
			return;
		}

		if (event.key === "Escape") {
			event.preventDefault();
			cancelEditPreview();
			return;
		}

		if (event.key === "Enter") {
			event.preventDefault();
			tryApplyEditOnEnter(event);
			return;
		}

		if (event.key === "Backspace") {
			event.preventDefault();
			deleteRawDigit();
			return;
		}

		if (/^\d$/.test(event.key)) {
			event.preventDefault();
			appendRawDigit(event.key);
		}
	});

	keyboardCaptureInput.addEventListener("input", () => {
		if (!isEditing) {
			return;
		}

		const digits = keyboardCaptureInput.value.replace(/\D/g, "");
		applyInputDigits(digits);
	});

	keyboardCaptureInput.addEventListener("blur", () => {
		if (!isEditing || skipEditBlurCancel) {
			return;
		}

		window.requestAnimationFrame(() => {
			if (!isEditing || skipEditBlurCancel || document.activeElement === keyboardCaptureInput) {
				return;
			}

			finalizeEditOnLeave();
		});
	});

	document.addEventListener(
		"pointerdown",
		(event) => {
			if (!isEditing || skipEditBlurCancel) {
				return;
			}

			const shell = root.querySelector("[data-ctv2-time-shell]");
			if (shell?.contains(event.target)) {
				return;
			}

			finalizeEditOnLeave();
		},
		true,
	);

	quickStartContainer.addEventListener("click", (event) => {
		if (state !== "ready") {
			return;
		}

		const button = event.target.closest("[data-ctv2-quick-start-seconds]");
		if (!button || !quickStartContainer.contains(button)) {
			return;
		}

		const durationMs = getQuickStartDurationMs(button);
		if (!durationMs) {
			return;
		}

		startCountdown(durationMs);
	});

	primaryBtn.addEventListener("click", () => {
		if (state === "ready") {
			if (primaryBtn.disabled) {
				return;
			}

			startCountdown(originalDurationMs);
			return;
		}

		if (state === "countdown") {
			pauseCountdown();
			return;
		}

		if (state === "paused") {
			resumeCountdown();
			return;
		}

		if (state === "timesUp") {
			resetToInitialReady();
		}
	});

	cancelBtn.addEventListener("click", () => {
		if (state === "ready" || state === "timesUp") {
			return;
		}

		cancelCountdown();
	});

	window.matchMedia(DESKTOP_EDIT_QUERY).addEventListener("change", handleLayoutModeChange);
	window
		.matchMedia(MOBILE_LANDSCAPE_INTERACTION_QUERY)
		.addEventListener("change", handleLayoutModeChange);

	if (sheetCancelBtn) {
		sheetCancelBtn.addEventListener("click", () => {
			closeCustomTimeSheet();
		});
	}

	if (sheetApplyBtn) {
		sheetApplyBtn.addEventListener("click", () => {
			applySheetAndStart();
		});
	}

	if (sheetHoursInput) {
		sheetHoursInput.addEventListener("input", handleSheetHoursInput);
		sheetHoursInput.addEventListener("paste", (event) => {
			handleSheetFieldPaste(event, "hours");
		});
	}

	if (sheetMinutesInput) {
		sheetMinutesInput.addEventListener("input", handleSheetMinutesInput);
		sheetMinutesInput.addEventListener("paste", (event) => {
			handleSheetFieldPaste(event, "minutes");
		});
	}

	if (sheetSecondsInput) {
		sheetSecondsInput.addEventListener("input", handleSheetSecondsInput);
		sheetSecondsInput.addEventListener("paste", (event) => {
			handleSheetFieldPaste(event, "seconds");
		});
	}

	sheetOverlay?.addEventListener("click", () => {
		closeCustomTimeSheet();
	});

	customSheet?.addEventListener("click", (event) => {
		event.stopPropagation();
	});

	customSheet?.addEventListener("keydown", (event) => {
		trapSheetFocus(event);
	});

	document.addEventListener("keydown", (event) => {
		if (event.key === "Escape" && isSheetOpen) {
			event.preventDefault();
			closeCustomTimeSheet();
		}
	});

	sheetInputs.forEach((input) => {
		input.addEventListener("focus", () => {
			if (!isSheetOpen) {
				return;
			}

			scheduleSheetKeyboardSync();
		});
	});

	window.visualViewport?.addEventListener("resize", syncSheetForKeyboard);
	window.visualViewport?.addEventListener("scroll", () => {
		stabilizeSheetPageScroll();
		syncSheetForKeyboard();
	});
	window.addEventListener("scroll", stabilizeSheetPageScroll, { passive: true });
	window.addEventListener("pageshow", () => {
		if (isSheetOpen) {
			closeCustomTimeSheet({ restoreFocus: false });
		}

		resetSheetScrollLock();
	});

	resetSheetScrollLock();

	soundToggleBtn.addEventListener("click", () => {
		toggleSoundPreference();
	});

	if (ringHitArea) {
		ringHitArea.addEventListener("pointerdown", handleRingPointerDown);
		ringHitArea.addEventListener("pointermove", handleRingPointerMove);
		ringHitArea.addEventListener("pointerup", handleRingPointerUp);
		ringHitArea.addEventListener("pointercancel", handleRingPointerCancel);
		ringHitArea.addEventListener("lostpointercapture", handleRingLostPointerCapture);
	}

	soundEnabled = readSoundPreference();
	syncSoundControl();
	syncLastChipFromStorage();
	syncQuickStartRowLayout();
	updateDisplay(0);
	syncUI();
})();
