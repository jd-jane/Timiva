import type { CatalogToolId } from "../data/toolsCatalog";

export const catalogIconMap: Record<
	CatalogToolId,
	"calendar" | "plus-square" | "person" | "progress" | "timer"
> = {
	"event-countdown": "calendar",
	"date-range": "plus-square",
	"days-between-dates": "calendar",
	"business-days-calculator": "calendar",
	"countdown-timer": "timer",
	"year-progress": "progress",
	"age-calculator": "person",
	"date-calculator": "calendar",
	"hours-calculator": "calendar",
	"life-progress": "progress",
};
