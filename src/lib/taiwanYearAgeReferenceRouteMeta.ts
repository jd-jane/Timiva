import {
	getAlternatePaths,
	getCanonicalUrl,
	routePaths,
	type Locale,
} from "../i18n/config";
import { getMessages } from "../i18n/messages";

export function getTaiwanYearAgeReferenceRouteMeta(locale: Locale) {
	const messages = getMessages(locale);

	return {
		title: messages.meta.taiwanYearAgeReference.title,
		description: messages.meta.taiwanYearAgeReference.description,
		canonicalUrl: getCanonicalUrl(routePaths.taiwanYearAgeReference, locale),
		alternateUrls: getAlternatePaths(routePaths.taiwanYearAgeReference),
	};
}
