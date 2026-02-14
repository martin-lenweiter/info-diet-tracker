import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";

function createDb(dbPath: string) {
  if (dbPath !== ":memory:") {
    const dir = dirname(dbPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  return drizzle(sqlite, { schema });
}

let db: ReturnType<typeof createDb> | null = null;

export function getDb(dbPath = "./data/diet.db") {
  if (!db) {
    db = createDb(dbPath);
  }
  return db;
}

export function createTestDb() {
  return createDb(":memory:");
}

export type Db = ReturnType<typeof createDb>;
