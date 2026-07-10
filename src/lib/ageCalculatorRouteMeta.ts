import {
	getAlternatePaths,
	getCanonicalUrl,
	routePaths,
	type Locale,
} from "../i18n/config";
import { getMessages } from "../i18n/messages";

export function getAgeCalculatorRouteMeta(locale: Locale) {
	const messages = getMessages(locale);

	return {
		title: messages.meta.ageCalculator.title,
		description: messages.meta.ageCalculator.description,
		canonicalUrl: getCanonicalUrl(routePaths.ageCalculator, locale),
		alternateUrls: getAlternatePaths(routePaths.ageCalculator),
	};
}
