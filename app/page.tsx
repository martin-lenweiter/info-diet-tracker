import Link from "next/link";
import { db } from "@/lib/db";
import { createTables } from "@/src/db/migrate";
import { getCurrentDiet, getStats, getTimeline } from "@/src/services/stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const typeEmoji: Record<string, string> = {
  book: "B",
  article: "A",
  podcast: "P",
  video: "V",
  course: "C",
  paper: "R",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const d = db();
  await createTables(d);

  const [currentDiet, stats, timeline] = await Promise.all([
    getCurrentDiet(d),
    getStats(d),
    getTimeline(d, { limit: 10 }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalItems}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Finished
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalFinished}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{currentDiet.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {stats.averageRating ? `${stats.averageRating}/5` : "N/A"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Diet</CardTitle>
          </CardHeader>
          <CardContent>
            {currentDiet.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing in progress.{" "}
                <Link href="/items/new" className="underline">
                  Add something
                </Link>
              </p>
            ) : (
              <ul className="space-y-3">
                {currentDiet.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/items/${item.id}`}
                      className="group flex items-start gap-3"
                    >
                      <Badge variant="outline" className="mt-0.5 shrink-0">
                        {typeEmoji[item.type] ?? item.type}
                      </Badge>
                      <div className="min-w-0">
                        <p className="truncate font-medium group-hover:underline">
                          {item.title}
                        </p>
                        {item.author && (
                          <p className="truncate text-sm text-muted-foreground">
                            {item.author}
                          </p>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <ul className="space-y-2">
                {timeline.map((entry, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="shrink-0 text-muted-foreground">
                      {entry.date}
                    </span>
                    <span className="truncate">
                      <span className="font-medium">{entry.itemTitle}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        &mdash; {entry.type.replace(/_/g, " ")}
                        {entry.detail ? ` (${entry.detail})` : ""}
                      </span>
                    </span>
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
