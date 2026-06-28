/**
 * GA4 Measurement ID — supplied at build time via Cloudflare Pages env.
 * Empty in local dev by default; analytics must remain disabled without an ID.
 */
export const gaMeasurementId = import.meta.env.PUBLIC_GA_MEASUREMENT_ID ?? "";

export const analyticsEnabled = gaMeasurementId.length > 0;
