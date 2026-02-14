#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { getDb } from "./db/index";
import { createTables } from "./db/migrate";
import { createMcpServer } from "./mcp-server";

async function main() {
  const db = getDb(
    process.env["TURSO_DATABASE_URL"] ?? process.env["DIET_DB_PATH"],
    process.env["TURSO_AUTH_TOKEN"],
  );
  await createTables(db);

  const server = createMcpServer(db);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
