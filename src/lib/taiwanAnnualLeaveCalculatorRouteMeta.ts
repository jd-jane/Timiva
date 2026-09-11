import {
	getAlternatePaths,
	getCanonicalUrl,
	routePaths,
	type Locale,
} from "../i18n/config";
import { getMessages } from "../i18n/messages";

export function getTaiwanAnnualLeaveCalculatorRouteMeta(locale: Locale) {
	const messages = getMessages(locale);

	return {
		title: messages.meta.taiwanAnnualLeaveCalculator.title,
		description: messages.meta.taiwanAnnualLeaveCalculator.description,
		canonicalUrl: getCanonicalUrl(routePaths.taiwanAnnualLeaveCalculator, locale),
		alternateUrls: getAlternatePaths(routePaths.taiwanAnnualLeaveCalculator),
	};
}
