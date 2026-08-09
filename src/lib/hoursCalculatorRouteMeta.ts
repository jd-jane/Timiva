import {
	getAlternatePaths,
	getCanonicalUrl,
	routePaths,
	type Locale,
} from "../i18n/config";
import { getMessages } from "../i18n/messages";

export function getHoursCalculatorRouteMeta(locale: Locale) {
	const messages = getMessages(locale);

	return {
		title: messages.meta.hoursCalculator.title,
		description: messages.meta.hoursCalculator.description,
		canonicalUrl: getCanonicalUrl(routePaths.hoursCalculator, locale),
		alternateUrls: getAlternatePaths(routePaths.hoursCalculator),
	};
}
