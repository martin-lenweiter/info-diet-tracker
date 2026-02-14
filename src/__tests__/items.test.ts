import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb, type Db } from "../db/index.js";
import { createTables } from "../db/migrate.js";
import {
  addItem,
  updateItem,
  startItem,
  finishItem,
  abandonItem,
  getItem,
  searchItems,
  listItems,
} from "../services/items.js";

let db: Db;

beforeEach(() => {
  db = createTestDb();
  createTables(db);
});

describe("addItem", () => {
  it("creates an item with backlog status and defaults", () => {
    const item = addItem(db, { title: "Test Book", type: "book" });

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

  it("stores tags as array", () => {
    const item = addItem(db, {
      title: "Tagged",
      type: "article",
      tags: ["ml", "research"],
    });
    expect(item.tags).toEqual(["ml", "research"]);
  });

  it("rejects missing title", () => {
    expect(() => addItem(db, { type: "book" })).toThrow();
  });

  it("rejects invalid type", () => {
    expect(() => addItem(db, { title: "X", type: "tweet" })).toThrow();
  });
});

describe("updateItem", () => {
  it("partially updates an item", () => {
    const item = addItem(db, { title: "Original", type: "book" });
    const updated = updateItem(db, item.id, { title: "Updated" });

    expect(updated.title).toBe("Updated");
    expect(updated.type).toBe("book");
  });

  it("throws for nonexistent item", () => {
    expect(() =>
      updateItem(db, "nonexistent-id", { title: "X" }),
    ).toThrow("Item not found");
  });
});

describe("startItem", () => {
  it("sets status to in_progress and startedAt", () => {
    const item = addItem(db, { title: "To Start", type: "podcast" });
    const started = startItem(db, item.id);

    expect(started.status).toBe("in_progress");
    expect(started.startedAt).toBeDefined();
  });
});

describe("finishItem", () => {
  it("sets status to finished with optional rating", () => {
    const item = addItem(db, { title: "To Finish", type: "video" });
    startItem(db, item.id);
    const finished = finishItem(db, item.id, 4);

    expect(finished.status).toBe("finished");
    expect(finished.finishedAt).toBeDefined();
    expect(finished.rating).toBe(4);
  });

  it("works without rating", () => {
    const item = addItem(db, { title: "No Rating", type: "article" });
    const finished = finishItem(db, item.id);

    expect(finished.status).toBe("finished");
    expect(finished.rating).toBeNull();
  });
});

describe("abandonItem", () => {
  it("sets status to abandoned", () => {
    const item = addItem(db, { title: "Giving Up", type: "course" });
    const abandoned = abandonItem(db, item.id);

    expect(abandoned.status).toBe("abandoned");
  });
});

describe("getItem", () => {
  it("returns item with empty progress", () => {
    const item = addItem(db, { title: "Solo", type: "paper" });
    const fetched = getItem(db, item.id);

    expect(fetched.id).toBe(item.id);
    expect(fetched.progress).toEqual([]);
  });

  it("throws for nonexistent item", () => {
    expect(() => getItem(db, "nope")).toThrow("Item not found");
  });
});

describe("searchItems", () => {
  it("searches by title substring", () => {
    addItem(db, { title: "Deep Work", type: "book" });
    addItem(db, { title: "Shallow Work", type: "book" });
    addItem(db, { title: "Deep Learning", type: "course" });

    const results = searchItems(db, { query: "Deep" });
    expect(results).toHaveLength(2);
  });

  it("filters by type", () => {
    addItem(db, { title: "A Book", type: "book" });
    addItem(db, { title: "An Article", type: "article" });

    const results = searchItems(db, { type: "book" });
    expect(results).toHaveLength(1);
    expect(results[0]!.type).toBe("book");
  });

  it("filters by tags", () => {
    addItem(db, { title: "ML Paper", type: "paper", tags: ["ml"] });
    addItem(db, { title: "Web Article", type: "article", tags: ["web"] });

    const results = searchItems(db, { tags: ["ml"] });
    expect(results).toHaveLength(1);
    expect(results[0]!.title).toBe("ML Paper");
  });
});

describe("listItems", () => {
  it("lists all items with default limit", () => {
    addItem(db, { title: "A", type: "book" });
    addItem(db, { title: "B", type: "article" });

    const results = listItems(db);
    expect(results).toHaveLength(2);
  });

  it("filters by status", () => {
    const item = addItem(db, { title: "Started", type: "book" });
    startItem(db, item.id);
    addItem(db, { title: "Not Started", type: "book" });

    const results = listItems(db, { status: "in_progress" });
    expect(results).toHaveLength(1);
    expect(results[0]!.title).toBe("Started");
  });

  it("respects limit", () => {
    for (let i = 0; i < 5; i++) {
      addItem(db, { title: `Item ${i}`, type: "article" });
    }

    const results = listItems(db, { limit: 3 });
    expect(results).toHaveLength(3);
  });
});
