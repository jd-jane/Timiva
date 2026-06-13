import { featuredTools } from "../data/homeTools";
import { getLocalizedPath, siteUrl, type Locale } from "../i18n/config";
import { buildFaqPageJsonLd, type FaqItem } from "./buildFaqPageJsonLd";

export type HomeToolListItem = {
	id: (typeof featuredTools)[number]["id"];
	slug: string;
	name: string;
};

function toAbsoluteUrl(locale: Locale, slug: string): string {
	const path = getLocalizedPath(locale, `/${slug}/`);
	return `${siteUrl}${path}`;
}

export function buildHomePageJsonLd(options: {
	locale: Locale;
	homeUrl: string;
	tools: readonly HomeToolListItem[];
	faqItems: readonly FaqItem[];
}) {
	const { locale, homeUrl, tools, faqItems } = options;
	const organizationId = `${siteUrl}/#organization`;
	const inLanguage = locale === "zh" ? "zh-Hant" : "en";

	const website = {
		"@context": "https://schema.org",
		"@type": "WebSite",
		name: "Timiva",
		url: homeUrl,
		inLanguage,
		publisher: {
			"@id": organizationId,
		},
	};

	const organization = {
		"@context": "https://schema.org",
		"@type": "Organization",
		"@id": organizationId,
		name: "Timiva",
		url: siteUrl,
		email: "hello@timiva.app",
	};

	const itemList = {
		"@context": "https://schema.org",
		"@type": "ItemList",
		name: locale === "zh" ? "Timiva 主要工具" : "Timiva main tools",
		itemListElement: tools.map((tool, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: tool.name,
			url: toAbsoluteUrl(locale, tool.slug),
		})),
	};

	return [website, organization, itemList, buildFaqPageJsonLd(faqItems)];
}
