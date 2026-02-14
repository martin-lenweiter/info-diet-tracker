import { eq, asc } from "drizzle-orm";
import { items, progressEntries } from "../db/schema";
import { generateId, now, today } from "../lib/utils";
import { AddProgressInput, type ProgressEntry } from "../types/index";
import type { Db } from "../db/index";

export async function addProgress(
  db: Db,
  input: unknown,
): Promise<ProgressEntry> {
  const parsed = AddProgressInput.parse(input);

  const item = await db
    .select({ id: items.id })
    .from(items)
    .where(eq(items.id, parsed.itemId))
    .get();
  if (!item) throw new Error(`Item not found: ${parsed.itemId}`);

  const id = generateId();
  const row = await db
    .insert(progressEntries)
    .values({
      id,
      itemId: parsed.itemId,
      date: parsed.date ?? today(),
      note: parsed.note,
      createdAt: now(),
    })
    .returning()
    .get();

  await db
    .update(items)
    .set({ updatedAt: now() })
    .where(eq(items.id, parsed.itemId))
    .run();

  return {
    id: row.id,
    itemId: row.itemId,
    date: row.date,
    note: row.note,
    createdAt: row.createdAt,
  };
}

export async function getProgress(
  db: Db,
  itemId: string,
): Promise<ProgressEntry[]> {
  const rows = await db
    .select()
    .from(progressEntries)
    .where(eq(progressEntries.itemId, itemId))
    .orderBy(asc(progressEntries.date))
    .all();

  return rows.map((r) => ({
    id: r.id,
    itemId: r.itemId,
    date: r.date,
    note: r.note,
    createdAt: r.createdAt,
  }));
}
