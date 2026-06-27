import { DEFAULT_TOOL_THEME, isToolThemeId, type ToolThemeId } from "./toolThemes.ts";

export function readThemeSearchParam(search: string): ToolThemeId | null {
	if (!search) {
		return null;
	}

	const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
	const theme = params.get("theme");

	if (theme === null || theme === "") {
		return null;
	}

	return isToolThemeId(theme) ? theme : null;
}

export function resolveInitialTheme(
	urlTheme: ToolThemeId | null,
	storedTheme: ToolThemeId | null,
): ToolThemeId {
	if (urlTheme !== null) {
		return urlTheme;
	}

	if (storedTheme !== null) {
		return storedTheme;
	}

	return DEFAULT_TOOL_THEME;
}

export function buildThemeShareUrl(
	origin: string,
	pathname: string,
	theme: ToolThemeId,
): string {
	const url = new URL(pathname, origin);
	url.search = "";
	url.hash = "";
	url.searchParams.set("theme", theme);
	return url.toString();
}

export function buildCurrentThemeUrl(currentUrl: string, theme: ToolThemeId): string {
	const url = new URL(currentUrl);
	url.searchParams.set("theme", theme);
	return `${url.pathname}${url.search}${url.hash}`;
}
