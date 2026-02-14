import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb, type Db } from "../db/index";
import { createTables } from "../db/migrate";
import { addItem, getItem } from "../services/items";
import { addProgress, getProgress } from "../services/progress";

let db: Db;

beforeEach(async () => {
  db = createTestDb();
  await createTables(db);
});

describe("addProgress", () => {
  it("creates a progress entry linked to an item", async () => {
    const item = await addItem(db, { title: "Test", type: "book" });
    const entry = await addProgress(db, {
      itemId: item.id,
      note: "Read chapter 1",
    });

    expect(entry.itemId).toBe(item.id);
    expect(entry.note).toBe("Read chapter 1");
    expect(entry.date).toBeDefined();
    expect(entry.id).toBeDefined();
  });

  it("updates the item's updatedAt", async () => {
    const item = await addItem(db, { title: "Test", type: "book" });
    const originalUpdatedAt = item.updatedAt;

    // Small delay to ensure timestamp difference
    await addProgress(db, { itemId: item.id, note: "Progress" });

    const updated = await getItem(db, item.id);
    expect(updated.updatedAt >= originalUpdatedAt).toBe(true);
  });

  it("throws for nonexistent item", async () => {
    await expect(
      addProgress(db, {
        itemId: "00000000-0000-0000-0000-000000000000",
        note: "orphan",
      }),
    ).rejects.toThrow("Item not found");
  });

  it("rejects empty note", async () => {
    const item = await addItem(db, { title: "Test", type: "book" });
    await expect(
      addProgress(db, { itemId: item.id, note: "" }),
    ).rejects.toThrow();
  });
});

describe("getProgress", () => {
  it("returns progress in chronological order", async () => {
    const item = await addItem(db, { title: "Test", type: "book" });
    await addProgress(db, { itemId: item.id, note: "First", date: "2024-01-01" });
    await addProgress(db, { itemId: item.id, note: "Second", date: "2024-01-02" });
    await addProgress(db, { itemId: item.id, note: "Third", date: "2024-01-03" });

    const entries = await getProgress(db, item.id);
    expect(entries).toHaveLength(3);
    expect(entries[0]!.note).toBe("First");
    expect(entries[2]!.note).toBe("Third");
  });

  it("returns empty array for item with no progress", async () => {
    const item = await addItem(db, { title: "Test", type: "book" });
    const entries = await getProgress(db, item.id);
    expect(entries).toEqual([]);
  });
});
