export const TOOL_THEMES = ["mist", "forest", "aurora", "sunset", "midnight"] as const;

export type ToolThemeId = (typeof TOOL_THEMES)[number];

export const DEFAULT_TOOL_THEME: ToolThemeId = "mist";

export function isToolThemeId(value: unknown): value is ToolThemeId {
	return typeof value === "string" && (TOOL_THEMES as readonly string[]).includes(value);
}

export function normalizeToolTheme(value: unknown): ToolThemeId {
	return isToolThemeId(value) ? value : DEFAULT_TOOL_THEME;
}

export function getNextToolTheme(current: ToolThemeId): ToolThemeId {
	const index = TOOL_THEMES.indexOf(current);
	const nextIndex = index === -1 ? 0 : (index + 1) % TOOL_THEMES.length;
	return TOOL_THEMES[nextIndex];
}
