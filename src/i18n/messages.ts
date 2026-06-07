import type { Locale } from "./config";
import { en } from "./en";
import { zh } from "./zh";

const catalogs = {
  en,
  zh,
} as const;

export function getMessages(locale: Locale) {
  return catalogs[locale];
}
