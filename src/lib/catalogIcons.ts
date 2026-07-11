import type { CatalogToolId } from "../data/toolsCatalog";

export const catalogIconMap: Record<
	CatalogToolId,
	"calendar" | "plus-square" | "person" | "progress" | "timer"
> = {
	"event-countdown": "calendar",
	"date-range": "plus-square",
	"days-between-dates": "calendar",
	"countdown-timer": "timer",
	"year-progress": "progress",
	"age-calculator": "person",
	"life-progress": "progress",
};
