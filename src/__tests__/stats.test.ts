import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb, type Db } from "../db/index";
import { createTables } from "../db/migrate";
import { addItem, startItem, finishItem } from "../services/items";
import { addProgress } from "../services/progress";
import { getStats, getCurrentDiet, getTimeline } from "../services/stats";

let db: Db;

beforeEach(async () => {
  db = createTestDb();
  await createTables(db);
});

describe("getStats", () => {
  it("returns correct counts by type", async () => {
    const book = await addItem(db, { title: "Book", type: "book" });
    await startItem(db, book.id);
    await finishItem(db, book.id, 4);

    const article = await addItem(db, { title: "Article", type: "article" });
    await startItem(db, article.id);
    await finishItem(db, article.id, 5);

    await addItem(db, { title: "Backlog", type: "podcast" });

    const stats = await getStats(db);
    expect(stats.finishedByType).toEqual({ book: 1, article: 1 });
    expect(stats.totalFinished).toBe(2);
    expect(stats.totalItems).toBe(3);
  });

  it("calculates average rating", async () => {
    const a = await addItem(db, { title: "A", type: "book" });
    await finishItem(db, a.id, 4);

    const b = await addItem(db, { title: "B", type: "book" });
    await finishItem(db, b.id, 2);

    const stats = await getStats(db);
    expect(stats.averageRating).toBe(3);
  });

  it("returns null average when no ratings", async () => {
    const a = await addItem(db, { title: "A", type: "book" });
    await finishItem(db, a.id);

    const stats = await getStats(db);
    expect(stats.averageRating).toBeNull();
  });

  it("counts top tags from finished items", async () => {
    const a = await addItem(db, {
      title: "A",
      type: "book",
      tags: ["ml", "research"],
    });
    await finishItem(db, a.id);

    const b = await addItem(db, {
      title: "B",
      type: "article",
      tags: ["ml", "web"],
    });
    await finishItem(db, b.id);

    const stats = await getStats(db);
    expect(stats.topTags[0]).toEqual({ tag: "ml", count: 2 });
  });
});

describe("getCurrentDiet", () => {
  it("returns only in_progress items", async () => {
    const a = await addItem(db, { title: "Reading", type: "book" });
    await startItem(db, a.id);

    const b = await addItem(db, { title: "Done", type: "book" });
    await startItem(db, b.id);
    await finishItem(db, b.id);

    await addItem(db, { title: "Queued", type: "article" });

    const diet = await getCurrentDiet(db);
    expect(diet).toHaveLength(1);
    expect(diet[0]!.title).toBe("Reading");
  });
});

describe("getTimeline", () => {
  it("returns events in reverse chronological order", async () => {
    const item = await addItem(db, { title: "Test", type: "book" });
    await startItem(db, item.id);
    await addProgress(db, {
      itemId: item.id,
      note: "Progress note",
      date: "2025-06-15",
    });

    const timeline = await getTimeline(db);
    expect(timeline.length).toBeGreaterThan(0);

    // Verify reverse chronological
    for (let i = 1; i < timeline.length; i++) {
      expect(timeline[i - 1]!.date >= timeline[i]!.date).toBe(true);
    }
  });

  it("includes progress entries", async () => {
    const item = await addItem(db, { title: "Test", type: "book" });
    await startItem(db, item.id);
    await addProgress(db, { itemId: item.id, note: "My note" });

    const timeline = await getTimeline(db);
    const progressEvents = timeline.filter((e) => e.type === "progress_added");
    expect(progressEvents.length).toBeGreaterThan(0);
    expect(progressEvents[0]!.detail).toBe("My note");
  });

  it("respects limit", async () => {
    for (let i = 0; i < 5; i++) {
      await addItem(db, { title: `Item ${i}`, type: "article" });
    }

    const timeline = await getTimeline(db, { limit: 3 });
    expect(timeline).toHaveLength(3);
  });
});
