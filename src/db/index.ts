import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

function createDb(url: string, authToken?: string) {
  if (url.startsWith("file:") && url !== "file::memory:") {
    const filePath = url.replace(/^file:/, "");
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  const client = createClient({ url, authToken });
  return drizzle(client, { schema });
}

let db: ReturnType<typeof createDb> | null = null;

export function getDb(url = "file:./data/diet.db", authToken?: string) {
  if (!db) {
    db = createDb(url, authToken);
  }
  return db;
}

export function createTestDb() {
  return createDb("file::memory:");
}

export type Db = ReturnType<typeof createDb>;
