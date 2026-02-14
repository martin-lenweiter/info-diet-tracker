import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb, type Db } from "../db/index";
import { createTables } from "../db/migrate";
import {
  addItem,
  updateItem,
  startItem,
  finishItem,
  abandonItem,
  getItem,
  searchItems,
  listItems,
} from "../services/items";

let db: Db;

beforeEach(async () => {
  db = createTestDb();
  await createTables(db);
});

describe("addItem", () => {
  it("creates an item with backlog status and defaults", async () => {
    const item = await addItem(db, { title: "Test Book", type: "book" });

    expect(item.title).toBe("Test Book");
    expect(item.type).toBe("book");
    expect(item.status).toBe("backlog");
    expect(item.tags).toEqual([]);
    expect(item.rating).toBeNull();
    expect(item.author).toBeNull();
    expect(item.url).toBeNull();
    expect(item.startedAt).toBeNull();
    expect(item.finishedAt).toBeNull();
    expect(item.id).toBeDefined();
    expect(item.createdAt).toBeDefined();
  });

  it("stores tags as array", async () => {
    const item = await addItem(db, {
      title: "Tagged",
      type: "article",
      tags: ["ml", "research"],
    });
    expect(item.tags).toEqual(["ml", "research"]);
  });

  it("rejects missing title", async () => {
    await expect(addItem(db, { type: "book" })).rejects.toThrow();
  });

  it("rejects invalid type", async () => {
    await expect(addItem(db, { title: "X", type: "tweet" })).rejects.toThrow();
  });
});

describe("updateItem", () => {
  it("partially updates an item", async () => {
    const item = await addItem(db, { title: "Original", type: "book" });
    const updated = await updateItem(db, item.id, { title: "Updated" });

    expect(updated.title).toBe("Updated");
    expect(updated.type).toBe("book");
  });

  it("throws for nonexistent item", async () => {
    await expect(
      updateItem(db, "nonexistent-id", { title: "X" }),
    ).rejects.toThrow("Item not found");
  });
});

describe("startItem", () => {
  it("sets status to in_progress and startedAt", async () => {
    const item = await addItem(db, { title: "To Start", type: "podcast" });
    const started = await startItem(db, item.id);

    expect(started.status).toBe("in_progress");
    expect(started.startedAt).toBeDefined();
  });
});

describe("finishItem", () => {
  it("sets status to finished with optional rating", async () => {
    const item = await addItem(db, { title: "To Finish", type: "video" });
    await startItem(db, item.id);
    const finished = await finishItem(db, item.id, 4);

    expect(finished.status).toBe("finished");
    expect(finished.finishedAt).toBeDefined();
    expect(finished.rating).toBe(4);
  });

  it("works without rating", async () => {
    const item = await addItem(db, { title: "No Rating", type: "article" });
    const finished = await finishItem(db, item.id);

    expect(finished.status).toBe("finished");
    expect(finished.rating).toBeNull();
  });
});

describe("abandonItem", () => {
  it("sets status to abandoned", async () => {
    const item = await addItem(db, { title: "Giving Up", type: "course" });
    const abandoned = await abandonItem(db, item.id);

    expect(abandoned.status).toBe("abandoned");
  });
});

describe("getItem", () => {
  it("returns item with empty progress", async () => {
    const item = await addItem(db, { title: "Solo", type: "paper" });
    const fetched = await getItem(db, item.id);

    expect(fetched.id).toBe(item.id);
    expect(fetched.progress).toEqual([]);
  });

  it("throws for nonexistent item", async () => {
    await expect(getItem(db, "nope")).rejects.toThrow("Item not found");
  });
});

describe("searchItems", () => {
  it("searches by title substring", async () => {
    await addItem(db, { title: "Deep Work", type: "book" });
    await addItem(db, { title: "Shallow Work", type: "book" });
    await addItem(db, { title: "Deep Learning", type: "course" });

    const results = await searchItems(db, { query: "Deep" });
    expect(results).toHaveLength(2);
  });

  it("filters by type", async () => {
    await addItem(db, { title: "A Book", type: "book" });
    await addItem(db, { title: "An Article", type: "article" });

    const results = await searchItems(db, { type: "book" });
    expect(results).toHaveLength(1);
    expect(results[0]!.type).toBe("book");
  });

  it("filters by tags", async () => {
    await addItem(db, { title: "ML Paper", type: "paper", tags: ["ml"] });
    await addItem(db, { title: "Web Article", type: "article", tags: ["web"] });

    const results = await searchItems(db, { tags: ["ml"] });
    expect(results).toHaveLength(1);
    expect(results[0]!.title).toBe("ML Paper");
  });
});

describe("listItems", () => {
  it("lists all items with default limit", async () => {
    await addItem(db, { title: "A", type: "book" });
    await addItem(db, { title: "B", type: "article" });

    const results = await listItems(db);
    expect(results).toHaveLength(2);
  });

  it("filters by status", async () => {
    const item = await addItem(db, { title: "Started", type: "book" });
    await startItem(db, item.id);
    await addItem(db, { title: "Not Started", type: "book" });

    const results = await listItems(db, { status: "in_progress" });
    expect(results).toHaveLength(1);
    expect(results[0]!.title).toBe("Started");
  });

  it("respects limit", async () => {
    for (let i = 0; i < 5; i++) {
      await addItem(db, { title: `Item ${i}`, type: "article" });
    }

    const results = await listItems(db, { limit: 3 });
    expect(results).toHaveLength(3);
  });
});
