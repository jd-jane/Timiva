import {
	getAlternatePaths,
	getCanonicalUrl,
	routePaths,
	type Locale,
} from "../i18n/config";
import { getMessages } from "../i18n/messages";

export function getCountdownTimerRouteMeta(locale: Locale) {
	const messages = getMessages(locale);

	return {
		title: messages.meta.countdownTimer.title,
		description: messages.meta.countdownTimer.description,
		canonicalUrl: getCanonicalUrl(routePaths.countdownTimer, locale),
		alternateUrls: getAlternatePaths(routePaths.countdownTimer),
	};
}
