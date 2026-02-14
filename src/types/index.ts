import { z } from "zod";

// Enums
export const ItemType = z.enum([
  "book",
  "article",
  "podcast",
  "video",
  "course",
  "paper",
]);
export type ItemType = z.infer<typeof ItemType>;

export const ItemStatus = z.enum([
  "backlog",
  "in_progress",
  "finished",
  "abandoned",
]);
export type ItemStatus = z.infer<typeof ItemStatus>;

// Input schemas
export const AddItemInput = z.object({
  title: z.string().min(1, "Title is required"),
  type: ItemType,
  author: z.string().nullable().optional(),
  url: z.string().url().nullable().optional(),
  tags: z.array(z.string()).optional().default([]),
  notes: z.string().nullable().optional(),
});
export type AddItemInput = z.infer<typeof AddItemInput>;

export const UpdateItemInput = z.object({
  title: z.string().min(1).optional(),
  type: ItemType.optional(),
  author: z.string().nullable().optional(),
  url: z.string().url().nullable().optional(),
  status: ItemStatus.optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().nullable().optional(),
  startedAt: z.string().nullable().optional(),
  finishedAt: z.string().nullable().optional(),
});
export type UpdateItemInput = z.infer<typeof UpdateItemInput>;

export const AddProgressInput = z.object({
  itemId: z.string().uuid(),
  note: z.string().min(1, "Note is required"),
  date: z.string().optional(),
});
export type AddProgressInput = z.infer<typeof AddProgressInput>;

export const SearchItemsInput = z.object({
  query: z.string().optional(),
  type: ItemType.optional(),
  status: ItemStatus.optional(),
  tags: z.array(z.string()).optional(),
});
export type SearchItemsInput = z.infer<typeof SearchItemsInput>;

export const ListItemsInput = z.object({
  status: ItemStatus.optional(),
  type: ItemType.optional(),
  limit: z.number().int().min(1).max(100).optional().default(50),
  orderBy: z
    .enum(["createdAt", "updatedAt", "title"])
    .optional()
    .default("updatedAt"),
});
export type ListItemsInput = z.infer<typeof ListItemsInput>;

export const GetStatsInput = z.object({
  period: z.enum(["week", "month", "year", "all"]).optional().default("all"),
});
export type GetStatsInput = z.infer<typeof GetStatsInput>;

export const GetTimelineInput = z.object({
  limit: z.number().int().min(1).max(100).optional().default(20),
});
export type GetTimelineInput = z.infer<typeof GetTimelineInput>;

// Output types
export interface Item {
  id: string;
  title: string;
  type: ItemType;
  author: string | null;
  url: string | null;
  status: ItemStatus;
  rating: number | null;
  tags: string[];
  notes: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ItemWithProgress extends Item {
  progress: ProgressEntry[];
}

export interface ProgressEntry {
  id: string;
  itemId: string;
  date: string;
  note: string;
  createdAt: string;
}

export interface DietStats {
  finishedByType: Record<string, number>;
  averageRating: number | null;
  topTags: { tag: string; count: number }[];
  totalItems: number;
  totalFinished: number;
}

export interface TimelineEntry {
  type:
    | "item_added"
    | "item_started"
    | "item_finished"
    | "item_abandoned"
    | "progress_added";
  date: string;
  itemId: string;
  itemTitle: string;
  detail: string | null;
}
