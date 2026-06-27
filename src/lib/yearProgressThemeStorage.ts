import { DEFAULT_TOOL_THEME, isToolThemeId, type ToolThemeId } from "./toolThemes";

export const YEAR_PROGRESS_STORAGE_KEY = "timiva.yearProgress.state";

export type YearProgressStoredState = {
	theme: ToolThemeId;
	updatedAt: string;
};

export function isValidIsoDateString(value: string): boolean {
	return Number.isFinite(Date.parse(value));
}

export function parseYearProgressStoredState(raw: string): YearProgressStoredState | null {
	let parsed: unknown;

	try {
		parsed = JSON.parse(raw);
	} catch {
		return null;
	}

	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
		return null;
	}

	const record = parsed as Record<string, unknown>;
	const theme = record.theme;
	const updatedAt = record.updatedAt;

	if (typeof theme !== "string" || !isToolThemeId(theme)) {
		return null;
	}

	if (typeof updatedAt !== "string" || !isValidIsoDateString(updatedAt)) {
		return null;
	}

	return { theme, updatedAt };
}

export function removeYearProgressStoredState(storageKey: string): void {
	try {
		localStorage.removeItem(storageKey);
	} catch {
		// Storage unavailable — ignore cleanup failure.
	}
}

export function readYearProgressStoredTheme(storageKey: string): ToolThemeId {
	try {
		const raw = localStorage.getItem(storageKey);

		if (raw === null) {
			return DEFAULT_TOOL_THEME;
		}

		const state = parseYearProgressStoredState(raw);

		if (!state) {
			removeYearProgressStoredState(storageKey);
			return DEFAULT_TOOL_THEME;
		}

		return state.theme;
	} catch {
		return DEFAULT_TOOL_THEME;
	}
}

export function writeYearProgressStoredTheme(storageKey: string, theme: ToolThemeId): void {
	try {
		const payload: YearProgressStoredState = {
			theme,
			updatedAt: new Date().toISOString(),
		};

		localStorage.setItem(storageKey, JSON.stringify(payload));
	} catch {
		// In-session theme already applied — ignore write failure.
	}
}
