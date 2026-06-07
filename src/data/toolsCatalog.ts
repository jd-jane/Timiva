import { featuredTools } from "./homeTools";

export const toolCategories = [
  { id: "dates-events", labelKey: "datesEvents" },
  { id: "productivity", labelKey: "productivity" },
  { id: "body-flow", labelKey: "bodyFlow" },
  { id: "momentum", labelKey: "momentum" },
] as const;

export type ToolCategoryId = (typeof toolCategories)[number]["id"];

export type CatalogToolId =
  | "event-countdown"
  | "date-range"
  | "age-calculator"
  | "life-progress";

export interface CatalogTool {
  id: CatalogToolId;
  slug: string;
  categoryId: ToolCategoryId;
  available: boolean;
  featured: boolean;
  icon: string;
  relatedIds: CatalogToolId[];
}

export const catalogTools: CatalogTool[] = [
  {
    id: "event-countdown",
    slug: "event-countdown",
    categoryId: "dates-events",
    available: true,
    featured: true,
    icon: "countdown",
    relatedIds: ["date-range"],
  },
  {
    id: "date-range",
    slug: "date-range-calculator",
    categoryId: "dates-events",
    available: true,
    featured: true,
    icon: "date-range",
    relatedIds: ["event-countdown"],
  },
  {
    id: "age-calculator",
    slug: "age-calculator",
    categoryId: "dates-events",
    available: false,
    featured: true,
    icon: "age-calculator",
    relatedIds: ["date-range", "event-countdown"],
  },
  {
    id: "life-progress",
    slug: "life-progress",
    categoryId: "momentum",
    available: false,
    featured: true,
    icon: "life-progress",
    relatedIds: ["event-countdown", "date-range"],
  },
];

const catalogById = new Map(catalogTools.map((tool) => [tool.id, tool]));

export function getCatalogTool(id: CatalogToolId): CatalogTool | undefined {
  return catalogById.get(id);
}

export function getAvailableCatalogTools(): CatalogTool[] {
  return catalogTools.filter((tool) => tool.available);
}

export function getRelatedTools(currentId: CatalogToolId): CatalogTool[] {
  const current = catalogById.get(currentId);
  const related: CatalogTool[] = [];
  const seen = new Set<CatalogToolId>([currentId]);

  for (const id of current?.relatedIds ?? []) {
    const tool = catalogById.get(id);
    if (tool?.available && !seen.has(tool.id)) {
      related.push(tool);
      seen.add(tool.id);
    }
  }

  for (const tool of catalogTools) {
    if (related.length >= 3) {
      break;
    }

    if (tool.available && tool.featured && !seen.has(tool.id)) {
      related.push(tool);
      seen.add(tool.id);
    }
  }

  for (const tool of featuredTools) {
    if (related.length >= 3) {
      break;
    }

    const catalogTool = catalogById.get(tool.id as CatalogToolId);
    if (catalogTool?.available && !seen.has(catalogTool.id)) {
      related.push(catalogTool);
      seen.add(catalogTool.id);
    }
  }

  return related.slice(0, 3);
}

export function getAvailableToolsGroupedByCategory(): Array<{
  categoryId: ToolCategoryId;
  tools: CatalogTool[];
}> {
  return toolCategories
    .map((category) => ({
      categoryId: category.id,
      tools: catalogTools.filter(
        (tool) => tool.categoryId === category.id && tool.available
      ),
    }))
    .filter((group) => group.tools.length > 0);
}
