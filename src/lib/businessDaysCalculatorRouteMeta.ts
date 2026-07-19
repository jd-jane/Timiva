import {
	getAlternatePaths,
	getCanonicalUrl,
	routePaths,
	type Locale,
} from "../i18n/config";
import { getMessages } from "../i18n/messages";

export function getBusinessDaysCalculatorRouteMeta(locale: Locale) {
	const messages = getMessages(locale);

	return {
		title: messages.meta.businessDaysCalculator.title,
		description: messages.meta.businessDaysCalculator.description,
		canonicalUrl: getCanonicalUrl(routePaths.businessDaysCalculator, locale),
		alternateUrls: getAlternatePaths(routePaths.businessDaysCalculator),
	};
}
