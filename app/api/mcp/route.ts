import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { db } from "@/lib/db";
import { createTables } from "@/src/db/migrate";
import { createMcpServer } from "@/src/mcp-server";

let initialized = false;

async function ensureDb() {
  const d = db();
  if (!initialized) {
    await createTables(d);
    initialized = true;
  }
  return d;
}

function authenticate(request: Request): boolean {
  const token = process.env["MCP_AUTH_TOKEN"];
  if (!token) return false;

  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;

  const bearer = authHeader.replace(/^Bearer\s+/i, "");
  return bearer === token;
}

async function handleMcpRequest(request: Request): Promise<Response> {
  if (!authenticate(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const d = await ensureDb();
  const server = createMcpServer(d);

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  await server.connect(transport);

  return transport.handleRequest(request);
}

export const POST = handleMcpRequest;
export const GET = handleMcpRequest;
export const DELETE = handleMcpRequest;
