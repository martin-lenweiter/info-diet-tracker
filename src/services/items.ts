import { eq, and, like, desc, asc } from "drizzle-orm";
import { items, progressEntries } from "../db/schema.js";
import { generateId, now, today } from "../lib/utils.js";
import {
  AddItemInput,
  UpdateItemInput,
  SearchItemsInput,
  ListItemsInput,
  type Item,
  type ItemWithProgress,
} from "../types/index.js";
import type { Db } from "../db/index.js";

export function toItem(row: typeof items.$inferSelect): Item {
  return {
    id: row.id,
    title: row.title,
    type: row.type as Item["type"],
    author: row.author,
    url: row.url,
    status: row.status as Item["status"],
    rating: row.rating,
    tags: JSON.parse(row.tags) as string[],
    notes: row.notes,
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function addItem(db: Db, input: unknown): Item {
  const parsed = AddItemInput.parse(input);
  const id = generateId();
  const timestamp = now();

  const row = db
    .insert(items)
    .values({
      id,
      title: parsed.title,
      type: parsed.type,
      author: parsed.author ?? null,
      url: parsed.url ?? null,
      status: "backlog",
      rating: null,
      tags: JSON.stringify(parsed.tags),
      notes: parsed.notes ?? null,
      startedAt: null,
      finishedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .returning()
    .get();

  return toItem(row);
}

export function updateItem(db: Db, id: string, input: unknown): Item {
  const parsed = UpdateItemInput.parse(input);

  const updates: Record<string, unknown> = { updatedAt: now() };
  if (parsed.title !== undefined) updates.title = parsed.title;
  if (parsed.type !== undefined) updates.type = parsed.type;
  if (parsed.author !== undefined) updates.author = parsed.author;
  if (parsed.url !== undefined) updates.url = parsed.url;
  if (parsed.status !== undefined) updates.status = parsed.status;
  if (parsed.rating !== undefined) updates.rating = parsed.rating;
  if (parsed.tags !== undefined) updates.tags = JSON.stringify(parsed.tags);
  if (parsed.notes !== undefined) updates.notes = parsed.notes;
  if (parsed.startedAt !== undefined) updates.startedAt = parsed.startedAt;
  if (parsed.finishedAt !== undefined) updates.finishedAt = parsed.finishedAt;

  const row = db
    .update(items)
    .set(updates)
    .where(eq(items.id, id))
    .returning()
    .get();

  if (!row) throw new Error(`Item not found: ${id}`);
  return toItem(row);
}

export function startItem(db: Db, id: string): Item {
  return updateItem(db, id, { status: "in_progress", startedAt: today() });
}

export function finishItem(db: Db, id: string, rating?: number): Item {
  return updateItem(db, id, {
    status: "finished",
    finishedAt: today(),
    ...(rating !== undefined ? { rating } : {}),
  });
}

export function abandonItem(db: Db, id: string): Item {
  return updateItem(db, id, { status: "abandoned" });
}

export function getItem(db: Db, id: string): ItemWithProgress {
  const row = db.select().from(items).where(eq(items.id, id)).get();
  if (!row) throw new Error(`Item not found: ${id}`);

  const progress = db
    .select()
    .from(progressEntries)
    .where(eq(progressEntries.itemId, id))
    .orderBy(asc(progressEntries.date))
    .all();

  return {
    ...toItem(row),
    progress: progress.map((p) => ({
      id: p.id,
      itemId: p.itemId,
      date: p.date,
      note: p.note,
      createdAt: p.createdAt,
    })),
  };
}

export function searchItems(db: Db, input: unknown): Item[] {
  const parsed = SearchItemsInput.parse(input);
  const conditions = [];

  if (parsed.query) {
    conditions.push(like(items.title, `%${parsed.query}%`));
  }
  if (parsed.type) {
    conditions.push(eq(items.type, parsed.type));
  }
  if (parsed.status) {
    conditions.push(eq(items.status, parsed.status));
  }

  let query = db.select().from(items);
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }

  const rows = query.orderBy(desc(items.updatedAt)).all();

  let results = rows.map(toItem);
  if (parsed.tags && parsed.tags.length > 0) {
    results = results.filter((item) =>
      parsed.tags!.some((tag) => item.tags.includes(tag)),
    );
  }

  return results;
}

export function listItems(db: Db, input?: unknown): Item[] {
  const parsed = ListItemsInput.parse(input ?? {});
  const conditions = [];

  if (parsed.status) conditions.push(eq(items.status, parsed.status));
  if (parsed.type) conditions.push(eq(items.type, parsed.type));

  const orderMap = {
    createdAt: desc(items.createdAt),
    updatedAt: desc(items.updatedAt),
    title: asc(items.title),
  } as const;

  let query = db.select().from(items);
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }

  const rows = query.orderBy(orderMap[parsed.orderBy]).limit(parsed.limit).all();

  return rows.map(toItem);
}
