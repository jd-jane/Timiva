import type { FeaturedToolId } from "../data/homeTools";

export const homeFeaturedIconMap: Record<
	FeaturedToolId,
	"calendar" | "plus-square" | "timer" | "progress" | "person"
> = {
	"date-range": "plus-square",
	"age-calculator": "person",
	"event-countdown": "calendar",
	"year-progress": "progress",
};
