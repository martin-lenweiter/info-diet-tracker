#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getDb } from "./db/index.js";
import { createTables } from "./db/migrate.js";
import {
  addItem,
  startItem,
  finishItem,
  searchItems,
} from "./services/items.js";
import { addProgress } from "./services/progress.js";
import { getStats, getCurrentDiet, getTimeline } from "./services/stats.js";

const db = getDb(process.env["DIET_DB_PATH"]);
createTables(db);

const server = new McpServer({
  name: "info-diet-tracker",
  version: "0.1.0",
});

// --- Tools ---

server.registerTool("add_item", {
  description:
    "Add a new item to your info diet (book, article, podcast, video, course, or paper)",
  inputSchema: {
    title: z.string().describe("Title of the item"),
    type: z
      .enum(["book", "article", "podcast", "video", "course", "paper"])
      .describe("Type of media"),
    author: z.string().optional().describe("Author or creator"),
    url: z.string().optional().describe("URL link to the item"),
    tags: z.array(z.string()).optional().describe("Tags for categorization"),
    notes: z.string().optional().describe("Personal notes about this item"),
  },
}, (args) => {
  try {
    const result = addItem(db, args);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  } catch (error) {
    return { content: [{ type: "text" as const, text: error instanceof Error ? error.message : String(error) }], isError: true };
  }
});

server.registerTool("start_item", {
  description:
    "Mark an item as currently being consumed (sets status to in_progress)",
  inputSchema: {
    id: z.string().describe("UUID of the item to start"),
  },
}, (args) => {
  try {
    const result = startItem(db, args.id);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  } catch (error) {
    return { content: [{ type: "text" as const, text: error instanceof Error ? error.message : String(error) }], isError: true };
  }
});

server.registerTool("finish_item", {
  description: "Mark an item as finished, with an optional rating",
  inputSchema: {
    id: z.string().describe("UUID of the item to finish"),
    rating: z
      .number()
      .int()
      .min(1)
      .max(5)
      .optional()
      .describe("Rating from 1 to 5"),
  },
}, (args) => {
  try {
    const result = finishItem(db, args.id, args.rating);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  } catch (error) {
    return { content: [{ type: "text" as const, text: error instanceof Error ? error.message : String(error) }], isError: true };
  }
});

server.registerTool("search_items", {
  description: "Search and filter items in your info diet",
  inputSchema: {
    query: z
      .string()
      .optional()
      .describe("Search term to match against titles"),
    type: z
      .enum(["book", "article", "podcast", "video", "course", "paper"])
      .optional()
      .describe("Filter by media type"),
    status: z
      .enum(["backlog", "in_progress", "finished", "abandoned"])
      .optional()
      .describe("Filter by status"),
    tags: z
      .array(z.string())
      .optional()
      .describe("Filter by tags (matches any)"),
  },
}, (args) => {
  try {
    const result = searchItems(db, args);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  } catch (error) {
    return { content: [{ type: "text" as const, text: error instanceof Error ? error.message : String(error) }], isError: true };
  }
});

server.registerTool("add_progress", {
  description: "Log a progress note for an item you're consuming",
  inputSchema: {
    itemId: z.string().describe("UUID of the item"),
    note: z.string().describe("Progress note (e.g. 'Read chapters 3-5')"),
    date: z
      .string()
      .optional()
      .describe("Date in YYYY-MM-DD format (defaults to today)"),
  },
}, (args) => {
  try {
    const result = addProgress(db, args);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  } catch (error) {
    return { content: [{ type: "text" as const, text: error instanceof Error ? error.message : String(error) }], isError: true };
  }
});

server.registerTool("get_stats", {
  description:
    "Get statistics about your info diet (items finished, ratings, top tags)",
  inputSchema: {
    period: z
      .enum(["week", "month", "year", "all"])
      .optional()
      .describe("Time period to analyze (defaults to all)"),
  },
}, (args) => {
  try {
    const result = getStats(db, args);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  } catch (error) {
    return { content: [{ type: "text" as const, text: error instanceof Error ? error.message : String(error) }], isError: true };
  }
});

server.registerTool("get_timeline", {
  description:
    "Get a chronological timeline of recent info diet activity",
  inputSchema: {
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe("Number of entries to return (defaults to 20)"),
  },
}, (args) => {
  try {
    const result = getTimeline(db, args);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  } catch (error) {
    return { content: [{ type: "text" as const, text: error instanceof Error ? error.message : String(error) }], isError: true };
  }
});

// --- Resources ---

server.registerResource("current-diet", "diet://current", {
  description: "Items you are currently consuming",
}, (uri) => {
  const current = getCurrentDiet(db);
  return {
    contents: [{
      uri: uri.href,
      mimeType: "application/json",
      text: JSON.stringify(current, null, 2),
    }],
  };
});

server.registerResource("recent-activity", "diet://activity", {
  description: "Recent activity in your info diet",
}, (uri) => {
  const timeline = getTimeline(db, { limit: 10 });
  return {
    contents: [{
      uri: uri.href,
      mimeType: "application/json",
      text: JSON.stringify(timeline, null, 2),
    }],
  };
});

// --- Prompts ---

server.registerPrompt("quiz-me", {
  description: "Generate a quiz based on items you've finished consuming",
  argsSchema: {
    topic: z
      .string()
      .optional()
      .describe("Optional topic to focus the quiz on"),
  },
}, (args) => {
  const finished = searchItems(db, { status: "finished" });
  const itemList = finished
    .map(
      (item) =>
        `- "${item.title}"${item.author ? ` by ${item.author}` : ""} (${item.type})${item.tags.length > 0 ? ` [${item.tags.join(", ")}]` : ""}`,
    )
    .join("\n");

  const topicClause = args.topic
    ? ` Focus specifically on "${args.topic}".`
    : "";

  return {
    messages: [
      {
        role: "user" as const,
        content: {
          type: "text" as const,
          text: `Based on my reading/watching/listening history, quiz me to test my understanding and retention.${topicClause}

Here are the items I've finished:
${itemList || "(No finished items yet)"}

Generate 5 thought-provoking questions that test comprehension, connections between ideas, and practical application. After I answer, provide feedback and scoring.`,
        },
      },
    ],
  };
});

// --- Start ---

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
