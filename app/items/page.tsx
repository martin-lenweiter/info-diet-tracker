import Link from "next/link";
import { db } from "@/lib/db";
import { createTables } from "@/src/db/migrate";
import { searchItems } from "@/src/services/items";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ItemsFilter } from "@/components/items-filter";

export const dynamic = "force-dynamic";

const statusColors: Record<string, string> = {
  backlog: "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-100 text-blue-700",
  finished: "bg-green-100 text-green-700",
  abandoned: "bg-red-100 text-red-700",
};

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const d = db();
  await createTables(d);

  const filters: Record<string, string | undefined> = {};
  if (params.query) filters.query = params.query;
  if (params.type) filters.type = params.type;
  if (params.status) filters.status = params.status;

  const items = await searchItems(d, filters);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Browse Items</h1>
        <Link
          href="/items/new"
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Add Item
        </Link>
      </div>

      <ItemsFilter />

      {items.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          No items found. Try adjusting your filters.
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="w-24">Type</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="w-16 text-center">Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link
                      href={`/items/${item.id}`}
                      className="font-medium hover:underline"
                    >
                      {item.title}
                    </Link>
                    {item.author && (
                      <p className="text-sm text-muted-foreground">
                        {item.author}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[item.status] ?? ""}`}
                    >
                      {item.status.replace("_", " ")}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {item.rating ? `${item.rating}/5` : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
