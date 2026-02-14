import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { createTables } from "@/src/db/migrate";
import { getItem } from "@/src/services/items";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ItemActions } from "@/components/item-actions";
import { ProgressForm } from "@/components/progress-form";

export const dynamic = "force-dynamic";

const statusColors: Record<string, string> = {
  backlog: "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-100 text-blue-700",
  finished: "bg-green-100 text-green-700",
  abandoned: "bg-red-100 text-red-700",
};

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const d = db();
  await createTables(d);

  let item;
  try {
    item = await getItem(d, id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/items"
          className="text-sm text-muted-foreground hover:underline"
        >
          &larr; Back to browse
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{item.title}</h1>
          {item.author && (
            <p className="mt-1 text-muted-foreground">by {item.author}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="outline">{item.type}</Badge>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[item.status] ?? ""}`}
            >
              {item.status.replace("_", " ")}
            </span>
            {item.rating && <Badge variant="secondary">{item.rating}/5</Badge>}
          </div>
        </div>
        <ItemActions item={item} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {item.url && (
              <div>
                <span className="font-medium">URL: </span>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {item.url}
                </a>
              </div>
            )}
            {item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="font-medium">Tags: </span>
                {item.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            {item.notes && (
              <div>
                <span className="font-medium">Notes: </span>
                <span className="text-muted-foreground">{item.notes}</span>
              </div>
            )}
            <Separator />
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>Created: {item.createdAt}</p>
              {item.startedAt && <p>Started: {item.startedAt}</p>}
              {item.finishedAt && <p>Finished: {item.finishedAt}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Progress Log</CardTitle>
          </CardHeader>
          <CardContent>
            {item.status === "in_progress" && (
              <div className="mb-4">
                <ProgressForm itemId={item.id} />
              </div>
            )}
            {item.progress.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No progress entries yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {[...item.progress].reverse().map((entry) => (
                  <li key={entry.id} className="text-sm">
                    <p className="text-xs text-muted-foreground">
                      {entry.date}
                    </p>
                    <p>{entry.note}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
