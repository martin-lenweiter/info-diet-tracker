import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const items = sqliteTable("items", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type", {
    enum: ["book", "article", "podcast", "video", "course", "paper"],
  }).notNull(),
  author: text("author"),
  url: text("url"),
  status: text("status", {
    enum: ["backlog", "in_progress", "finished", "abandoned"],
  })
    .notNull()
    .default("backlog"),
  rating: integer("rating"),
  tags: text("tags").notNull().default("[]"),
  notes: text("notes"),
  startedAt: text("started_at"),
  finishedAt: text("finished_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const progressEntries = sqliteTable("progress_entries", {
  id: text("id").primaryKey(),
  itemId: text("item_id")
    .notNull()
    .references(() => items.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  note: text("note").notNull(),
  createdAt: text("created_at").notNull(),
});
