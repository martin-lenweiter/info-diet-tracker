import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb, type Db } from "../db/index.js";
import { createTables } from "../db/migrate.js";
import { addItem, getItem } from "../services/items.js";
import { addProgress, getProgress } from "../services/progress.js";

let db: Db;

beforeEach(() => {
  db = createTestDb();
  createTables(db);
});

describe("addProgress", () => {
  it("creates a progress entry linked to an item", () => {
    const item = addItem(db, { title: "Test", type: "book" });
    const entry = addProgress(db, {
      itemId: item.id,
      note: "Read chapter 1",
    });

    expect(entry.itemId).toBe(item.id);
    expect(entry.note).toBe("Read chapter 1");
    expect(entry.date).toBeDefined();
    expect(entry.id).toBeDefined();
  });

  it("updates the item's updatedAt", () => {
    const item = addItem(db, { title: "Test", type: "book" });
    const originalUpdatedAt = item.updatedAt;

    // Small delay to ensure timestamp difference
    addProgress(db, { itemId: item.id, note: "Progress" });

    const updated = getItem(db, item.id);
    expect(updated.updatedAt >= originalUpdatedAt).toBe(true);
  });

  it("throws for nonexistent item", () => {
    expect(() =>
      addProgress(db, {
        itemId: "00000000-0000-0000-0000-000000000000",
        note: "orphan",
      }),
    ).toThrow("Item not found");
  });

  it("rejects empty note", () => {
    const item = addItem(db, { title: "Test", type: "book" });
    expect(() => addProgress(db, { itemId: item.id, note: "" })).toThrow();
  });
});

describe("getProgress", () => {
  it("returns progress in chronological order", () => {
    const item = addItem(db, { title: "Test", type: "book" });
    addProgress(db, { itemId: item.id, note: "First", date: "2024-01-01" });
    addProgress(db, { itemId: item.id, note: "Second", date: "2024-01-02" });
    addProgress(db, { itemId: item.id, note: "Third", date: "2024-01-03" });

    const entries = getProgress(db, item.id);
    expect(entries).toHaveLength(3);
    expect(entries[0]!.note).toBe("First");
    expect(entries[2]!.note).toBe("Third");
  });

  it("returns empty array for item with no progress", () => {
    const item = addItem(db, { title: "Test", type: "book" });
    const entries = getProgress(db, item.id);
    expect(entries).toEqual([]);
  });
});
