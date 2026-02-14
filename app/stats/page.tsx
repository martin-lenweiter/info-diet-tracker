import Link from "next/link";
import { db } from "@/lib/db";
import { createTables } from "@/src/db/migrate";
import { getStats } from "@/src/services/stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const periods = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
  { value: "all", label: "All Time" },
];

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const period = params.period ?? "all";
  const d = db();
  await createTables(d);

  const stats = await getStats(d, { period });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Stats</h1>

      <div className="flex gap-2">
        {periods.map((p) => (
          <Link
            key={p.value}
            href={`/stats?period=${p.value}`}
            className={`inline-flex h-8 items-center rounded-md px-3 text-sm font-medium transition-colors ${
              period === p.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {p.label}
          </Link>
        ))}
      </div>

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
              Avg Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {stats.averageRating ? `${stats.averageRating}/5` : "N/A"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unique Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.topTags.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Finished by Type</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(stats.finishedByType).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No finished items in this period.
              </p>
            ) : (
              <div className="space-y-2">
                {Object.entries(stats.finishedByType)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">
                        {type}
                      </span>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{
                            width: `${Math.max(
                              20,
                              (count / stats.totalFinished) * 200,
                            )}px`,
                          }}
                        />
                        <span className="text-sm text-muted-foreground">
                          {count}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Tags</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topTags.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tags yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {stats.topTags.map(({ tag, count }) => (
                  <Badge key={tag} variant="secondary">
                    {tag} ({count})
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
