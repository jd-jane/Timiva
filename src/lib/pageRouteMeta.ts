import {
	getAlternatePaths,
	getCanonicalUrl,
	type Locale,
} from "../i18n/config";

export function getPageRouteMeta(pathname: string, locale: Locale) {
	return {
		canonicalUrl: getCanonicalUrl(pathname, locale),
		alternateUrls: getAlternatePaths(pathname),
	};
}
