import { eq, and, gte, desc, sql, count } from "drizzle-orm";
import { items, progressEntries } from "../db/schema";
import { toItem } from "./items";
import {
  GetStatsInput,
  GetTimelineInput,
  type Item,
  type DietStats,
  type TimelineEntry,
} from "../types/index";
import type { Db } from "../db/index";

function getPeriodStart(period: string): string | null {
  const d = new Date();
  switch (period) {
    case "week":
      d.setDate(d.getDate() - 7);
      return d.toISOString().split("T")[0]!;
    case "month":
      d.setMonth(d.getMonth() - 1);
      return d.toISOString().split("T")[0]!;
    case "year":
      d.setFullYear(d.getFullYear() - 1);
      return d.toISOString().split("T")[0]!;
    default:
      return null;
  }
}

export async function getStats(db: Db, input?: unknown): Promise<DietStats> {
  const parsed = GetStatsInput.parse(input ?? {});
  const periodStart = getPeriodStart(parsed.period);

  const conditions = [eq(items.status, "finished")];
  if (periodStart) {
    conditions.push(gte(items.finishedAt, periodStart));
  }

  const finishedRows = await db
    .select({ type: items.type, count: count() })
    .from(items)
    .where(and(...conditions))
    .groupBy(items.type)
    .all();

  const finishedByType: Record<string, number> = {};
  for (const row of finishedRows) {
    finishedByType[row.type] = row.count;
  }

  const ratingRow = await db
    .select({ avg: sql<number>`avg(rating)` })
    .from(items)
    .where(and(...conditions, sql`rating IS NOT NULL`))
    .get();

  const averageRating = ratingRow?.avg
    ? Math.round(ratingRow.avg * 10) / 10
    : null;

  const finishedItems = await db
    .select({ tags: items.tags })
    .from(items)
    .where(and(...conditions))
    .all();

  const tagCounts = new Map<string, number>();
  for (const item of finishedItems) {
    const tags = JSON.parse(item.tags) as string[];
    for (const tag of tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }
  const topTags = Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const totalItems =
    (await db.select({ count: count() }).from(items).get())?.count ?? 0;
  const totalFinished = Object.values(finishedByType).reduce(
    (sum, c) => sum + c,
    0,
  );

  return { finishedByType, averageRating, topTags, totalItems, totalFinished };
}

export async function getCurrentDiet(db: Db): Promise<Item[]> {
  const rows = await db
    .select()
    .from(items)
    .where(eq(items.status, "in_progress"))
    .orderBy(desc(items.updatedAt))
    .all();

  return rows.map(toItem);
}

export async function getTimeline(
  db: Db,
  input?: unknown,
): Promise<TimelineEntry[]> {
  const parsed = GetTimelineInput.parse(input ?? {});

  const recentItems = await db
    .select()
    .from(items)
    .orderBy(desc(items.updatedAt))
    .limit(parsed.limit * 2)
    .all();

  const recentProgress = await db
    .select({
      id: progressEntries.id,
      itemId: progressEntries.itemId,
      date: progressEntries.date,
      note: progressEntries.note,
      createdAt: progressEntries.createdAt,
      itemTitle: items.title,
    })
    .from(progressEntries)
    .innerJoin(items, eq(progressEntries.itemId, items.id))
    .orderBy(desc(progressEntries.createdAt))
    .limit(parsed.limit)
    .all();

  const entries: TimelineEntry[] = [];

  for (const item of recentItems) {
    if (item.finishedAt) {
      entries.push({
        type: "item_finished",
        date: item.finishedAt,
        itemId: item.id,
        itemTitle: item.title,
        detail: item.rating ? `Rated ${item.rating}/5` : null,
      });
    }
    if (item.startedAt) {
      entries.push({
        type: "item_started",
        date: item.startedAt,
        itemId: item.id,
        itemTitle: item.title,
        detail: null,
      });
    }
    if (item.status === "abandoned") {
      entries.push({
        type: "item_abandoned",
        date: item.updatedAt.split("T")[0]!,
        itemId: item.id,
        itemTitle: item.title,
        detail: null,
      });
    }
    entries.push({
      type: "item_added",
      date: item.createdAt.split("T")[0]!,
      itemId: item.id,
      itemTitle: item.title,
      detail: null,
    });
  }

  for (const p of recentProgress) {
    entries.push({
      type: "progress_added",
      date: p.date,
      itemId: p.itemId,
      itemTitle: p.itemTitle,
      detail: p.note,
    });
  }

  entries.sort((a, b) => b.date.localeCompare(a.date));
  return entries.slice(0, parsed.limit);
}
