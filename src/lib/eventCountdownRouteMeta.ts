import {
	getAlternatePaths,
	getCanonicalUrl,
	routePaths,
	type Locale,
} from "../i18n/config";
import { getMessages } from "../i18n/messages";

export function getEventCountdownRouteMeta(locale: Locale) {
	const messages = getMessages(locale);

	return {
		title: messages.meta.eventCountdown.title,
		description: messages.meta.eventCountdown.description,
		canonicalUrl: getCanonicalUrl(routePaths.eventCountdown, locale),
		alternateUrls: getAlternatePaths(routePaths.eventCountdown),
	};
}
