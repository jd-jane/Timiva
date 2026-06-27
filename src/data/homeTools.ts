/** 首頁主推工具（4 張卡片） */
export const featuredTools = [
  {
    id: "event-countdown",
    slug: "event-countdown",
    available: true,
    icon: "countdown",
    category: "Countdown",
  },
  {
    id: "date-range",
    slug: "date-range-calculator",
    available: true,
    icon: "date-range",
    category: "Date",
  },
  {
    id: "timer",
    slug: "countdown-timer",
    available: true,
    icon: "timer",
    category: "Timer",
  },
  {
    id: "year-progress",
    slug: "year-progress",
    available: true,
    icon: "year-progress",
    category: "Countdown",
  },
] as const;

/** 未來工具（首頁暫不展示，保留資料結構） */
export const reservedTools = [
  {
    id: "timer",
    slug: "timer",
    available: false,
    icon: "timer",
    category: "Timer",
  },
  {
    id: "time-zone",
    slug: "time-zone-converter",
    available: false,
    icon: "timezone",
    category: "Clock",
  },
  {
    id: "stopwatch",
    slug: "stopwatch",
    available: false,
    icon: "stopwatch",
    category: "Timer",
  },
] as const;

/** 未來分類頁預留（首頁暫不渲染） */
export const categories = [
  { id: "countdown", label: "Countdown" },
  { id: "timer", label: "Timer" },
  { id: "clock", label: "Clock" },
  { id: "date", label: "Date" },
] as const;

export type FeaturedToolId = (typeof featuredTools)[number]["id"];
