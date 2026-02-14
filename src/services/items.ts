import { eq, and, like, desc, asc } from "drizzle-orm";
import { items, progressEntries } from "../db/schema";
import { generateId, now, today } from "../lib/utils";
import {
  AddItemInput,
  UpdateItemInput,
  SearchItemsInput,
  ListItemsInput,
  type Item,
  type ItemWithProgress,
} from "../types/index";
import type { Db } from "../db/index";

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

export async function addItem(db: Db, input: unknown): Promise<Item> {
  const parsed = AddItemInput.parse(input);
  const id = generateId();
  const timestamp = now();

  const row = await db
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

export async function updateItem(
  db: Db,
  id: string,
  input: unknown,
): Promise<Item> {
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

  const row = await db
    .update(items)
    .set(updates)
    .where(eq(items.id, id))
    .returning()
    .get();

  if (!row) throw new Error(`Item not found: ${id}`);
  return toItem(row);
}

export async function startItem(db: Db, id: string): Promise<Item> {
  return updateItem(db, id, { status: "in_progress", startedAt: today() });
}

export async function finishItem(
  db: Db,
  id: string,
  rating?: number,
): Promise<Item> {
  return updateItem(db, id, {
    status: "finished",
    finishedAt: today(),
    ...(rating !== undefined ? { rating } : {}),
  });
}

export async function abandonItem(db: Db, id: string): Promise<Item> {
  return updateItem(db, id, { status: "abandoned" });
}

export async function getItem(db: Db, id: string): Promise<ItemWithProgress> {
  const row = await db.select().from(items).where(eq(items.id, id)).get();
  if (!row) throw new Error(`Item not found: ${id}`);

  const progress = await db
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

export async function searchItems(db: Db, input: unknown): Promise<Item[]> {
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

  const rows = await query.orderBy(desc(items.updatedAt)).all();

  let results = rows.map(toItem);
  if (parsed.tags && parsed.tags.length > 0) {
    results = results.filter((item) =>
      parsed.tags!.some((tag) => item.tags.includes(tag)),
    );
  }

  return results;
}

export async function listItems(db: Db, input?: unknown): Promise<Item[]> {
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

  const rows = await query
    .orderBy(orderMap[parsed.orderBy])
    .limit(parsed.limit)
    .all();

  return rows.map(toItem);
}
