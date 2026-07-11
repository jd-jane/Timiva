import {
	getAlternatePaths,
	getCanonicalUrl,
	routePaths,
	type Locale,
} from "../i18n/config";
import { getMessages } from "../i18n/messages";

export function getDaysBetweenDatesRouteMeta(locale: Locale) {
	const messages = getMessages(locale);

	return {
		title: messages.meta.daysBetweenDates.title,
		description: messages.meta.daysBetweenDates.description,
		canonicalUrl: getCanonicalUrl(routePaths.daysBetweenDates, locale),
		alternateUrls: getAlternatePaths(routePaths.daysBetweenDates),
	};
}
