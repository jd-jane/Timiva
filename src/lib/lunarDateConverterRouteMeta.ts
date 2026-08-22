import {
	getAlternatePaths,
	getCanonicalUrl,
	routePaths,
	type Locale,
} from "../i18n/config";
import { getMessages } from "../i18n/messages";

export function getLunarDateConverterRouteMeta(locale: Locale) {
	const messages = getMessages(locale);

	return {
		title: messages.meta.lunarDateConverter.title,
		description: messages.meta.lunarDateConverter.description,
		canonicalUrl: getCanonicalUrl(routePaths.lunarDateConverter, locale),
		alternateUrls: getAlternatePaths(routePaths.lunarDateConverter),
	};
}
