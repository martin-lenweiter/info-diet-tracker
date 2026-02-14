import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb, type Db } from "../db/index.js";
import { createTables } from "../db/migrate.js";
import { addItem, startItem, finishItem } from "../services/items.js";
import { addProgress } from "../services/progress.js";
import { getStats, getCurrentDiet, getTimeline } from "../services/stats.js";

let db: Db;

beforeEach(() => {
  db = createTestDb();
  createTables(db);
});

describe("getStats", () => {
  it("returns correct counts by type", () => {
    const book = addItem(db, { title: "Book", type: "book" });
    startItem(db, book.id);
    finishItem(db, book.id, 4);

    const article = addItem(db, { title: "Article", type: "article" });
    startItem(db, article.id);
    finishItem(db, article.id, 5);

    addItem(db, { title: "Backlog", type: "podcast" });

    const stats = getStats(db);
    expect(stats.finishedByType).toEqual({ book: 1, article: 1 });
    expect(stats.totalFinished).toBe(2);
    expect(stats.totalItems).toBe(3);
  });

  it("calculates average rating", () => {
    const a = addItem(db, { title: "A", type: "book" });
    finishItem(db, a.id, 4);

    const b = addItem(db, { title: "B", type: "book" });
    finishItem(db, b.id, 2);

    const stats = getStats(db);
    expect(stats.averageRating).toBe(3);
  });

  it("returns null average when no ratings", () => {
    const a = addItem(db, { title: "A", type: "book" });
    finishItem(db, a.id);

    const stats = getStats(db);
    expect(stats.averageRating).toBeNull();
  });

  it("counts top tags from finished items", () => {
    const a = addItem(db, {
      title: "A",
      type: "book",
      tags: ["ml", "research"],
    });
    finishItem(db, a.id);

    const b = addItem(db, {
      title: "B",
      type: "article",
      tags: ["ml", "web"],
    });
    finishItem(db, b.id);

    const stats = getStats(db);
    expect(stats.topTags[0]).toEqual({ tag: "ml", count: 2 });
  });
});

describe("getCurrentDiet", () => {
  it("returns only in_progress items", () => {
    const a = addItem(db, { title: "Reading", type: "book" });
    startItem(db, a.id);

    const b = addItem(db, { title: "Done", type: "book" });
    startItem(db, b.id);
    finishItem(db, b.id);

    addItem(db, { title: "Queued", type: "article" });

    const diet = getCurrentDiet(db);
    expect(diet).toHaveLength(1);
    expect(diet[0]!.title).toBe("Reading");
  });
});

describe("getTimeline", () => {
  it("returns events in reverse chronological order", () => {
    const item = addItem(db, { title: "Test", type: "book" });
    startItem(db, item.id);
    addProgress(db, {
      itemId: item.id,
      note: "Progress note",
      date: "2025-06-15",
    });

    const timeline = getTimeline(db);
    expect(timeline.length).toBeGreaterThan(0);

    // Verify reverse chronological
    for (let i = 1; i < timeline.length; i++) {
      expect(timeline[i - 1]!.date >= timeline[i]!.date).toBe(true);
    }
  });

  it("includes progress entries", () => {
    const item = addItem(db, { title: "Test", type: "book" });
    startItem(db, item.id);
    addProgress(db, { itemId: item.id, note: "My note" });

    const timeline = getTimeline(db);
    const progressEvents = timeline.filter((e) => e.type === "progress_added");
    expect(progressEvents.length).toBeGreaterThan(0);
    expect(progressEvents[0]!.detail).toBe("My note");
  });

  it("respects limit", () => {
    for (let i = 0; i < 5; i++) {
      addItem(db, { title: `Item ${i}`, type: "article" });
    }

    const timeline = getTimeline(db, { limit: 3 });
    expect(timeline).toHaveLength(3);
  });
});
