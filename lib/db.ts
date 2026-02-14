import { getDb, type Db } from "@/src/db/index";

let _db: Db | null = null;

export function db(): Db {
  if (!_db) {
    _db = getDb(
      process.env["TURSO_DATABASE_URL"] ?? "file:./data/diet.db",
      process.env["TURSO_AUTH_TOKEN"],
    );
  }
  return _db;
}
