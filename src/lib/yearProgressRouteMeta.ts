import {
	getAlternatePaths,
	getCanonicalUrl,
	routePaths,
	type Locale,
} from "../i18n/config";
import { getMessages } from "../i18n/messages";

export function getYearProgressRouteMeta(locale: Locale) {
	const messages = getMessages(locale);

	return {
		title: messages.meta.yearProgress.title,
		description: messages.meta.yearProgress.description,
		canonicalUrl: getCanonicalUrl(routePaths.yearProgress, locale),
		alternateUrls: getAlternatePaths(routePaths.yearProgress),
	};
}
