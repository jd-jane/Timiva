import {
	getAlternatePaths,
	getCanonicalUrl,
	routePaths,
	type Locale,
} from "../i18n/config";
import { getMessages } from "../i18n/messages";

export function getJapaneseEraConverterRouteMeta(locale: Locale) {
	const messages = getMessages(locale);

	return {
		title: messages.meta.japaneseEraConverter.title,
		description: messages.meta.japaneseEraConverter.description,
		canonicalUrl: getCanonicalUrl(routePaths.japaneseEraConverter, locale),
		alternateUrls: getAlternatePaths(routePaths.japaneseEraConverter),
	};
}
