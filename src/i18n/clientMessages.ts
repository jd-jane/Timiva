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
    untilLabelPrefix: m.untilLabelPrefix,
    intlLocale: locale === "zh" ? "zh-TW" : "en-US",
    templateTitles: m.templateTitles,
  };
}

export function getCountdownTimerClientI18n(locale: Locale) {
  const m = getMessages(locale).countdownTimer;

  return {
    locale,
    kicker: m.kicker,
    cancel: m.cancel,
    start: m.start,
    pause: m.pause,
    resume: m.resume,
    done: m.done,
    timesUp: m.timesUp,
    last: m.last,
    soundOff: m.soundOff,
    soundOn: m.soundOn,
    quickStartLabels: m.quickStartLabels,
    quickStartSeconds: [30, 60, 300, 600, 1500, 3600],
    intlLocale: locale === "zh" ? "zh-TW" : "en-US",
  };
}

export function getYearProgressClientI18n(locale: Locale) {
  const m = getMessages(locale).yearProgress;

  return {
    locale,
    yearHeadlineTemplate: m.staticYearHeadline.replace("2026", "{year}"),
    daysPassedTemplate: m.staticDaysPassed.replace(/\d+/, "{count}"),
    daysRemainingTemplate: m.staticDaysRemaining.replace(/\d+/, "{count}"),
    daysSeparator: m.staticDaysSeparator,
    noteFallback: m.resultPlaceholder,
    share: m.share,
    shareTitle: m.shareTitle,
    copied: m.copied,
    copyFailed: m.copyFailed,
  };
}
