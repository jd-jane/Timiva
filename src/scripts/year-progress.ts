import { calculateYearProgress } from "../lib/yearProgressMath";
import {
	readYearProgressStoredTheme,
	writeYearProgressStoredTheme,
	YEAR_PROGRESS_STORAGE_KEY,
} from "../lib/yearProgressThemeStorage";
import {
	buildCurrentThemeUrl,
	buildThemeShareUrl,
	readThemeSearchParam,
	resolveInitialTheme,
} from "../lib/yearProgressThemeUrl";
import {
	getYearProgressMonthlyNote,
	resolveYearProgressNotes,
	type YearProgressMonthlyNotesRegistry,
} from "../lib/yearProgressMonthlyNotes";
import {
	getNextToolTheme,
	normalizeToolTheme,
	type ToolThemeId,
} from "../lib/toolThemes";

type YearProgressLocale = "en" | "zh";

type YearProgressClientI18n = {
	locale: YearProgressLocale;
	yearHeadlineTemplate: string;
	daysPassedTemplate: string;
	daysRemainingTemplate: string;
	daysSeparator: string;
	noteFallback: string;
	share: string;
	shareTitle: string;
	copied: string;
	copyFailed: string;
};

const initializedRoots = new WeakSet<HTMLElement>();
const themeBoundRoots = new WeakSet<HTMLElement>();
const shareBoundRoots = new WeakSet<HTMLElement>();
let globalListenersAttached = false;
let midnightTimer: ReturnType<typeof setTimeout> | null = null;
let shareFeedbackTimer: ReturnType<typeof setTimeout> | null = null;

const SHARE_FEEDBACK_MS = 1200;

function getStorageKey(root: HTMLElement): string {
	const key = root.dataset.ypv2StorageKey?.trim();
	return key && key.length > 0 ? key : YEAR_PROGRESS_STORAGE_KEY;
}

function readStoredTheme(storageKey: string): ToolThemeId {
	return readYearProgressStoredTheme(storageKey);
}

function writeStoredTheme(storageKey: string, theme: ToolThemeId): void {
	writeYearProgressStoredTheme(storageKey, theme);
}

function fillTemplate(template: string, values: Record<string, string | number>): string {
	return template.replace(/\{(\w+)\}/g, (_, key: string) => {
		const value = values[key];
		return value === undefined ? "" : String(value);
	});
}

function parseClientI18n(root: HTMLElement): YearProgressClientI18n | null {
	const raw = root.dataset.ypv2ClientI18n;
	if (!raw) return null;

	try {
		return JSON.parse(raw) as YearProgressClientI18n;
	} catch {
		return null;
	}
}

function parseMonthlyNotesRegistry(root: HTMLElement): YearProgressMonthlyNotesRegistry {
	const raw = root.dataset.ypv2MonthlyNotes;
	if (!raw) return {};

	try {
		const parsed = JSON.parse(raw) as YearProgressMonthlyNotesRegistry;
		return parsed && typeof parsed === "object" ? parsed : {};
	} catch {
		return {};
	}
}

function updateSegmentFills(root: HTMLElement, fills: number[]): void {
	const segments = root.querySelectorAll<HTMLElement>("[data-ypv2-segment-fill]");

	segments.forEach((fillEl, index) => {
		const fill = fills[index];
		if (typeof fill !== "number" || !Number.isFinite(fill)) return;

		fillEl.classList.remove("ypv2-segment-fill--full", "ypv2-segment-fill--partial");
		fillEl.style.setProperty("--ypv2-segment-fill", String(Math.min(1, Math.max(0, fill))));
	});
}

function renderYearProgressRoot(root: HTMLElement, now = new Date()): void {
	const i18n = parseClientI18n(root);
	if (!i18n) return;

	const snapshot = calculateYearProgress(now);
	const registry = parseMonthlyNotesRegistry(root);
	const locale: YearProgressLocale = i18n.locale === "zh" ? "zh" : "en";
	const yearNotes = resolveYearProgressNotes(registry, snapshot.year, locale);

	const yearHeadline = root.querySelector<HTMLElement>("[data-ypv2-year-headline]");
	const percentValue = root.querySelector<HTMLElement>("[data-ypv2-percent-value]");
	const daysPassed = root.querySelector<HTMLElement>("[data-ypv2-days-passed]");
	const daysRemaining = root.querySelector<HTMLElement>("[data-ypv2-days-remaining]");
	const monthlyNote = root.querySelector<HTMLElement>("[data-ypv2-note]");

	if (yearHeadline) {
		yearHeadline.textContent = fillTemplate(i18n.yearHeadlineTemplate, {
			year: snapshot.year,
		});
	}

	if (percentValue) {
		percentValue.textContent = String(snapshot.percent);
	}

	if (daysPassed) {
		daysPassed.textContent = fillTemplate(i18n.daysPassedTemplate, {
			count: snapshot.daysPassed,
		});
	}

	if (daysRemaining) {
		daysRemaining.textContent = fillTemplate(i18n.daysRemainingTemplate, {
			count: snapshot.daysRemaining,
		});
	}

	if (monthlyNote) {
		monthlyNote.textContent = getYearProgressMonthlyNote(
			yearNotes,
			snapshot.monthIndex,
			i18n.noteFallback,
		);
	}

	if (snapshot.segmentFills.length === 12) {
		updateSegmentFills(root, snapshot.segmentFills);
	}

	const resultStage = root.querySelector<HTMLElement>("[data-ypv2-result-stage]");
	if (resultStage) {
		resultStage.classList.remove("is-pending");
		resultStage.setAttribute("aria-busy", "false");
	}

	root.dataset.ypv2Hydrated = "true";
}

function refreshAllRoots(): void {
	document.querySelectorAll<HTMLElement>("[data-year-progress-v2]").forEach((root) => {
		renderYearProgressRoot(root);
	});
}

function scheduleMidnightRefresh(): void {
	if (midnightTimer !== null) {
		clearTimeout(midnightTimer);
		midnightTimer = null;
	}

	const now = new Date();
	const nextMidnight = new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate() + 1,
		0,
		0,
		0,
		0,
	);
	const delayMs = Math.max(0, nextMidnight.getTime() - now.getTime());

	midnightTimer = setTimeout(() => {
		refreshAllRoots();
		scheduleMidnightRefresh();
	}, delayMs);
}

function onVisibilityChange(): void {
	if (document.visibilityState === "visible") {
		refreshAllRoots();
		scheduleMidnightRefresh();
	}
}

function onPageShow(): void {
	refreshAllRoots();
	scheduleMidnightRefresh();
}

function attachGlobalListeners(): void {
	if (globalListenersAttached) return;

	globalListenersAttached = true;
	document.addEventListener("visibilitychange", onVisibilityChange);
	window.addEventListener("pageshow", onPageShow);
}

function getRootTheme(root: HTMLElement): ToolThemeId {
	return normalizeToolTheme(root.dataset.toolTheme);
}

function applyRootTheme(root: HTMLElement, theme: ToolThemeId): void {
	root.dataset.toolTheme = theme;
}

function resolveRootInitialTheme(storageKey: string): ToolThemeId {
	const urlTheme = readThemeSearchParam(window.location.search);
	const storedTheme = readStoredTheme(storageKey);
	return resolveInitialTheme(urlTheme, storedTheme);
}

function applyInitialThemeIfNeeded(root: HTMLElement, storageKey: string): ToolThemeId {
	const initialTheme = resolveRootInitialTheme(storageKey);
	const bootstrapped = root.dataset.ypv2ThemeBootstrapped === "true";

	if (bootstrapped && getRootTheme(root) === initialTheme) {
		return initialTheme;
	}

	applyRootTheme(root, initialTheme);
	return initialTheme;
}

function syncThemeUrl(theme: ToolThemeId): void {
	history.replaceState(null, "", buildCurrentThemeUrl(window.location.href, theme));
}

function canUseWebShare(): boolean {
	return typeof navigator.share === "function" && window.isSecureContext;
}

async function copyShareUrl(shareUrl: string): Promise<boolean> {
	if (!navigator.clipboard?.writeText) {
		return false;
	}

	try {
		await navigator.clipboard.writeText(shareUrl);
		return true;
	} catch {
		return false;
	}
}

function showShareButtonFeedback(
	shareButton: HTMLButtonElement,
	label: string,
	ariaLabel: string,
	defaultShareLabel: string,
): void {
	if (shareFeedbackTimer !== null) {
		clearTimeout(shareFeedbackTimer);
		shareFeedbackTimer = null;
	}

	shareButton.textContent = label;
	shareButton.setAttribute("aria-label", ariaLabel);

	shareFeedbackTimer = setTimeout(() => {
		shareButton.textContent = defaultShareLabel;
		shareButton.setAttribute("aria-label", defaultShareLabel);
		shareFeedbackTimer = null;
	}, SHARE_FEEDBACK_MS);
}

function bindThemeButton(root: HTMLElement, storageKey: string): void {
	if (themeBoundRoots.has(root)) return;

	const themeButton = root.querySelector<HTMLButtonElement>("[data-ypv2-theme-button]");
	if (!themeButton) return;

	themeBoundRoots.add(root);

	themeButton.addEventListener("click", (event) => {
		event.preventDefault();
		const nextTheme = getNextToolTheme(getRootTheme(root));
		applyRootTheme(root, nextTheme);
		writeStoredTheme(storageKey, nextTheme);
		syncThemeUrl(nextTheme);
	});
}

function bindShareButton(root: HTMLElement, i18n: YearProgressClientI18n): void {
	if (shareBoundRoots.has(root)) return;

	const shareButton = root.querySelector<HTMLButtonElement>("[data-ypv2-share-button]");
	if (!shareButton) return;

	shareBoundRoots.add(root);
	const defaultShareLabel = i18n.share;

	shareButton.addEventListener("click", async (event) => {
		event.preventDefault();

		const activeTheme = getRootTheme(root);
		const shareUrl = buildThemeShareUrl(
			window.location.origin,
			window.location.pathname,
			activeTheme,
		);

		if (canUseWebShare()) {
			try {
				await navigator.share({
					title: i18n.shareTitle,
					url: shareUrl,
				});
				return;
			} catch (error) {
				if (error instanceof DOMException && error.name === "AbortError") {
					return;
				}
			}
		}

		const copied = await copyShareUrl(shareUrl);

		if (copied) {
			showShareButtonFeedback(
				shareButton,
				i18n.copied,
				i18n.copied,
				defaultShareLabel,
			);
			return;
		}

		showShareButtonFeedback(
			shareButton,
			i18n.copyFailed,
			i18n.copyFailed,
			defaultShareLabel,
		);
	});
}

function initYearProgressRoot(root: HTMLElement, storageKey: string): void {
	if (initializedRoots.has(root)) return;

	const i18n = parseClientI18n(root);
	if (!i18n) return;

	initializedRoots.add(root);
	applyInitialThemeIfNeeded(root, storageKey);
	renderYearProgressRoot(root);
	bindThemeButton(root, storageKey);
	bindShareButton(root, i18n);
	attachGlobalListeners();
	scheduleMidnightRefresh();
}

export function initYearProgress(): void {
	document.querySelectorAll<HTMLElement>("[data-year-progress-v2]").forEach((root) => {
		const storageKey = getStorageKey(root);
		initYearProgressRoot(root, storageKey);
	});
}

if (typeof document !== "undefined") {
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", initYearProgress, { once: true });
	} else {
		initYearProgress();
	}
}
