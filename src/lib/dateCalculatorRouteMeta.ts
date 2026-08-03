import {
	getAlternatePaths,
	getCanonicalUrl,
	routePaths,
	type Locale,
} from "../i18n/config";
import { getMessages } from "../i18n/messages";

export function getDateCalculatorRouteMeta(locale: Locale) {
	const messages = getMessages(locale);

	return {
		title: messages.meta.dateCalculator.title,
		description: messages.meta.dateCalculator.description,
		canonicalUrl: getCanonicalUrl(routePaths.dateCalculator, locale),
		alternateUrls: getAlternatePaths(routePaths.dateCalculator),
	};
}
