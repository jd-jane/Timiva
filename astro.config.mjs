// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

/** @param {string} page */
function isCanonicalLocalePage(page) {
	const { pathname } = new URL(page);

	if (pathname === '/') {
		return false;
	}

	if (pathname.includes('/preview/')) {
		return false;
	}

	return /^\/(en|zh)(\/|$)/.test(pathname);
}

export default defineConfig({
	site: 'https://timiva.app',
	integrations: [
		sitemap({
			i18n: {
				defaultLocale: 'en',
				locales: {
					en: 'en-US',
					zh: 'zh-TW',
				},
			},
			filter: isCanonicalLocalePage,
		}),
	],
	vite: {
		plugins: [tailwindcss()],
	},
});