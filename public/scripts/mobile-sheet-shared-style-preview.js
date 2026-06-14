(function () {
	const previewRoot = document.querySelector("[data-preview-tool-page]");
	const portalHost = document.querySelector("[data-msb-portal]");
	if (!previewRoot || !portalHost) return;

	const LANDSCAPE_MQ = window.matchMedia(
		"(orientation: landscape) and (max-height: 700px) and (max-width: 1200px)"
	);

	const overlay = portalHost.querySelector("[data-msb-overlay]");
	const sheet = portalHost.querySelector("[data-msb-sheet]");
	const sheetBody = portalHost.querySelector(".msb-sheet-body");
	const openTriggers = previewRoot.querySelectorAll("[data-msb-open]");
	const cancelButton = portalHost.querySelector("[data-msb-cancel]");
	const primaryButton = portalHost.querySelector("[data-msb-primary]");
	const inputs = portalHost.querySelectorAll(".msb-input");
	let savedScrollY = 0;
	let lastTrigger = null;

	function resetScrollLock() {
		document.documentElement.classList.remove("msb-scroll-lock", "msb-sheet-open");
		document.body.classList.remove(
			"msb-scroll-lock",
			"msb-sheet-open",
			"tool-operation-open",
			"tool-sheet-open",
			"range-sheet-open",
			"ecv2-sheet-open"
		);
		document.body.style.top = "";
		clearKeyboardSync();
	}

	resetScrollLock();

	function isLandscapeCompact() {
		return LANDSCAPE_MQ.matches;
	}

	function getViewportMetrics() {
		const viewport = window.visualViewport;

		return {
			height: viewport?.height ?? window.innerHeight,
			offsetTop: viewport?.offsetTop ?? 0,
			innerHeight: window.innerHeight,
		};
	}

	function isKeyboardOpen(metrics) {
		return metrics.height < metrics.innerHeight - 72;
	}

	function clearKeyboardSync() {
		portalHost.classList.remove("msb-keyboard-sync");
		sheet?.style.removeProperty("bottom");
		overlay?.style.removeProperty("top");
		overlay?.style.removeProperty("height");
		overlay?.style.removeProperty("bottom");
	}

	function stabilizePageScroll() {
		if (!sheet?.classList.contains("is-open")) return;
		if (Math.abs(window.scrollY - savedScrollY) > 1) {
			window.scrollTo(0, savedScrollY);
		}
	}

	function liftSheetBy(pixels) {
		if (!sheet || pixels <= 0) return;
		const currentBottom = Number.parseFloat(sheet.style.bottom) || 0;
		sheet.style.bottom = `${currentBottom + Math.ceil(pixels)}px`;
	}

	function ensureFocusedInputVisible(metrics) {
		const active = document.activeElement;
		if (!(active instanceof HTMLElement) || !active.matches(".msb-input")) return;

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

	function syncSheetForKeyboard() {
		if (!sheet?.classList.contains("is-open")) {
			clearKeyboardSync();
			return;
		}

		const metrics = getViewportMetrics();

		if (!isKeyboardOpen(metrics)) {
			clearKeyboardSync();
			stabilizePageScroll();
			return;
		}

		const bottomInset = Math.max(
			0,
			metrics.innerHeight - metrics.height - metrics.offsetTop
		);

		portalHost.classList.add("msb-keyboard-sync");
		sheet.style.bottom = `${bottomInset}px`;

		if (overlay) {
			overlay.style.top = `${metrics.offsetTop}px`;
			overlay.style.height = `${metrics.height}px`;
			overlay.style.bottom = "auto";
		}

		stabilizePageScroll();
		ensureFocusedInputVisible(metrics);
	}

	function scheduleKeyboardSync() {
		requestAnimationFrame(() => {
			syncSheetForKeyboard();
			requestAnimationFrame(syncSheetForKeyboard);
		});
	}

	function lockBodyScroll() {
		savedScrollY = window.scrollY;
		document.documentElement.classList.add("msb-scroll-lock", "msb-sheet-open");
		document.body.classList.add("msb-scroll-lock", "msb-sheet-open");
	}

	function unlockBodyScroll() {
		document.documentElement.classList.remove("msb-scroll-lock", "msb-sheet-open");
		document.body.classList.remove("msb-scroll-lock", "msb-sheet-open");
		document.body.style.top = "";
		clearKeyboardSync();
		window.scrollTo(0, savedScrollY);
	}

	function openSheet(trigger) {
		if (!overlay || !sheet) return;

		lastTrigger = trigger;
		overlay.removeAttribute("hidden");
		overlay.classList.add("is-visible");
		overlay.setAttribute("aria-hidden", "false");
		sheet.classList.add("is-open");
		sheet.setAttribute("aria-hidden", "false");
		sheet.inert = false;
		lockBodyScroll();
	}

	function closeSheet() {
		if (!overlay || !sheet) return;

		overlay.classList.remove("is-visible");
		overlay.setAttribute("hidden", "");
		overlay.setAttribute("aria-hidden", "true");
		sheet.classList.remove("is-open");
		sheet.setAttribute("aria-hidden", "true");
		sheet.inert = true;
		unlockBodyScroll();

		if (lastTrigger instanceof HTMLElement) {
			lastTrigger.focus({ preventScroll: true });
		}
	}

	inputs.forEach((input) => {
		input.addEventListener("focus", () => {
			if (!sheet?.classList.contains("is-open")) return;
			scheduleKeyboardSync();
		});
	});

	openTriggers.forEach((trigger) => {
		trigger.addEventListener("click", () => {
			openSheet(trigger);
		});
	});

	overlay?.addEventListener("click", closeSheet);
	cancelButton?.addEventListener("click", closeSheet);
	primaryButton?.addEventListener("click", closeSheet);
	sheet?.addEventListener("click", (event) => {
		event.stopPropagation();
	});

	document.addEventListener("keydown", (event) => {
		if (event.key === "Escape" && sheet?.classList.contains("is-open")) {
			closeSheet();
		}
	});

	window.visualViewport?.addEventListener("resize", syncSheetForKeyboard);
	window.visualViewport?.addEventListener("scroll", () => {
		stabilizePageScroll();
		syncSheetForKeyboard();
	});
	window.addEventListener("scroll", stabilizePageScroll, { passive: true });
	window.addEventListener("pageshow", resetScrollLock);
	LANDSCAPE_MQ.addEventListener("change", () => {
		resetScrollLock();
		scheduleKeyboardSync();
	});
})();
