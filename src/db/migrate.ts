import { sql } from "drizzle-orm";
import type { Db } from "./index.js";

export function createTables(db: Db) {
  db.run(sql`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('book','article','podcast','video','course','paper')),
      author TEXT,
      url TEXT,
      status TEXT NOT NULL DEFAULT 'backlog' CHECK(status IN ('backlog','in_progress','finished','abandoned')),
      rating INTEGER CHECK(rating IS NULL OR (rating >= 1 AND rating <= 5)),
      tags TEXT NOT NULL DEFAULT '[]',
      notes TEXT,
      started_at TEXT,
      finished_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS progress_entries (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      note TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);
}
