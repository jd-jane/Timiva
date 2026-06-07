import type { CatalogToolId } from "../data/toolsCatalog";

export const catalogIconMap: Record<
	CatalogToolId,
	"calendar" | "plus-square" | "person" | "progress"
> = {
	"event-countdown": "calendar",
	"date-range": "plus-square",
	"age-calculator": "person",
	"life-progress": "progress",
};
