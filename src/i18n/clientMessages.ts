import type { Locale } from "./config";
import { getMessages } from "./messages";

export function getDateRangeClientI18n(locale: Locale) {
  const m = getMessages(locale).dateRangeCalculator;

  return {
    locale,
    dateRangePlaceholder: m.dateRangePlaceholder,
    startDate: m.startDate,
    endDate: m.endDate,
    chooseDateRange: m.chooseDateRange,
    changeDateRange: m.changeDateRange,
    calendarLabel: m.calendarLabel,
    intlLocale: locale === "zh" ? "zh-TW" : "en-US",
  };
}

export function getEventCountdownClientI18n(locale: Locale) {
  const m = getMessages(locale).eventCountdown;

  return {
    locale,
    defaultDisplayTitle: m.defaultDisplayTitle,
    share: m.share,
    copied: m.copied,
    copyFailed: m.copyFailed,
    intlLocale: locale === "zh" ? "zh-TW" : "en-US",
    templateTitles: m.templateTitles,
  };
}
