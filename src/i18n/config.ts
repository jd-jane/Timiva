export const supportedLocales = ["en", "zh"] as const;

export type Locale = (typeof supportedLocales)[number];

export const defaultLocale: Locale = "en";

export const siteName = "Timiva";

export const siteUrl = "https://timiva.app";

/** Path slugs without locale prefix; trailing slash included. */
export const routePaths = {
  home: "/",
  eventCountdown: "/event-countdown/",
  dateRangeCalculator: "/date-range-calculator/",
  countdownTimer: "/countdown-timer/",
  yearProgress: "/year-progress/",
  ageCalculator: "/age-calculator/",
  daysBetweenDates: "/days-between-dates/",
  allTools: "/tools/",
  privacy: "/privacy/",
  terms: "/terms/",
  contact: "/contact/",
} as const;

export type RouteKey = keyof typeof routePaths;

function normalizePath(path: string): string {
  if (!path || path === "/") {
    return "/";
  }

  let normalized = path.startsWith("/") ? path : `/${path}`;

  if (!normalized.endsWith("/")) {
    normalized = `${normalized}/`;
  }

  return normalized;
}

export function stripLocaleFromPath(pathname: string): string {
  const path = normalizePath(pathname).replace(/\/+$/, "") || "/";

  if (path === "/en" || path.startsWith("/en/")) {
    const rest = path.slice(3);
    return normalizePath(rest || "/");
  }

  if (path === "/zh" || path.startsWith("/zh/")) {
    const rest = path.slice(3);
    return normalizePath(rest || "/");
  }

  return normalizePath(path);
}

export function getLocaleFromPath(pathname: string): Locale {
  const path = pathname.replace(/\/+$/, "") || "/";

  if (path === "/zh" || path.startsWith("/zh/")) {
    return "zh";
  }

  if (path === "/en" || path.startsWith("/en/")) {
    return "en";
  }

  return defaultLocale;
}

export function getLocalizedPath(locale: Locale, path: string): string {
  const basePath = stripLocaleFromPath(path);

  if (locale === "zh") {
    return basePath === "/" ? "/zh/" : `/zh${basePath}`;
  }

  return basePath === "/" ? "/en/" : `/en${basePath}`;
}

export function getAlternatePaths(pathname: string): Record<Locale, string> {
  const basePath = stripLocaleFromPath(pathname);

  return {
    en: getLocalizedPath("en", basePath),
    zh: getLocalizedPath("zh", basePath),
  };
}

export function getCanonicalUrl(pathname: string, locale?: Locale): string {
  const resolvedLocale = locale ?? getLocaleFromPath(pathname);
  const localizedPath = getLocalizedPath(
    resolvedLocale,
    stripLocaleFromPath(pathname)
  );

  if (localizedPath === "/") {
    return `${siteUrl}/`;
  }

  return `${siteUrl}${localizedPath.endsWith("/") ? localizedPath.slice(0, -1) : localizedPath}/`;
}
