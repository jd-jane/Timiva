import type { FeaturedToolId } from "../data/homeTools";

export const homeFeaturedIconMap: Record<
	FeaturedToolId,
	"calendar" | "plus-square" | "timer" | "progress"
> = {
	"event-countdown": "calendar",
	"date-range": "plus-square",
	timer: "timer",
	"year-progress": "progress",
};
