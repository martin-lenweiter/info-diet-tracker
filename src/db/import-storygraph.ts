import { resolve } from "path";
import XLSX from "xlsx";
import { getDb } from "./index";
import { createTables } from "./migrate";
import { items } from "./schema";
import { generateId, now } from "../lib/utils";

interface StorygraphRow {
  Title: string;
  Author: string;
  Pages: string;
  Format: string;
  "Original Pub Year": string;
  ISBN: string;
  Language: string;
  Publisher: string;
  "Edition Pub Date": string;
  "Finished Date": string;
  Genres: string;
  Moods: string;
}

function parseFinishedDate(raw: string): string | null {
  if (!raw || raw.trim() === "") return null;

  const trimmed = raw.trim();

  // "2022" — year only
  if (/^\d{4}$/.test(trimmed)) {
    return `${trimmed}-01-01`;
  }

  // "Oct 2022" — month year
  const monthYearMatch = trimmed.match(
    /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})$/,
  );
  if (monthYearMatch) {
    const months: Record<string, string> = {
      Jan: "01", Feb: "02", Mar: "03", Apr: "04",
      May: "05", Jun: "06", Jul: "07", Aug: "08",
      Sep: "09", Oct: "10", Nov: "11", Dec: "12",
    };
    return `${monthYearMatch[2]}-${months[monthYearMatch[1]!]}-01`;
  }

  // "Feb 4, 2026" — full date
  const fullDateMatch = trimmed.match(
    /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),\s+(\d{4})$/,
  );
  if (fullDateMatch) {
    const months: Record<string, string> = {
      Jan: "01", Feb: "02", Mar: "03", Apr: "04",
      May: "05", Jun: "06", Jul: "07", Aug: "08",
      Sep: "09", Oct: "10", Nov: "11", Dec: "12",
    };
    const day = fullDateMatch[2]!.padStart(2, "0");
    return `${fullDateMatch[3]}-${months[fullDateMatch[1]!]}-${day}`;
  }

  console.warn(`  ! Could not parse date: "${trimmed}"`);
  return null;
}

function parseGenres(raw: string): string[] {
  if (!raw || raw.trim() === "") return [];
  return raw
    .split(";")
    .map((g) => g.trim())
    .filter(Boolean);
}

async function main() {
  const xlsxPath = resolve(
    import.meta.dirname ?? ".",
    "../../storygraph_read_books.xlsx",
  );

  const workbook = XLSX.readFile(xlsxPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]!]!;
  const rows = XLSX.utils.sheet_to_json<StorygraphRow>(sheet);

  const db = getDb();
  await createTables(db);

  console.log(`Importing ${rows.length} books from Storygraph...\n`);

  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    const title = row.Title?.trim();
    if (!title) {
      skipped++;
      continue;
    }

    const finishedAt = parseFinishedDate(row["Finished Date"]);
    const status = finishedAt ? "finished" : "backlog";
    const tags = parseGenres(row.Genres);
    const author = row.Author?.trim() || null;
    const timestamp = now();

    await db
      .insert(items)
      .values({
        id: generateId(),
        title,
        type: "book",
        author,
        url: null,
        status,
        rating: null,
        tags: JSON.stringify(tags),
        notes: null,
        startedAt: null,
        finishedAt,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .run();

    const statusLabel = status === "finished" ? `finished ${finishedAt}` : "backlog";
    console.log(`  + ${title} (${statusLabel})`);
    imported++;
  }

  console.log(`\nDone. Imported ${imported} books, skipped ${skipped}.`);
}

main().catch((error) => {
  console.error("Import failed:", error);
  process.exit(1);
});
