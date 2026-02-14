import { createItemAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const itemTypes = [
  { value: "book", label: "Book" },
  { value: "article", label: "Article" },
  { value: "podcast", label: "Podcast" },
  { value: "video", label: "Video" },
  { value: "course", label: "Course" },
  { value: "paper", label: "Paper" },
];

export default function NewItemPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Add Item</h1>

      <Card>
        <CardHeader>
          <CardTitle>New Item</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createItemAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" name="title" required placeholder="e.g. Deep Work" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <select
                id="type"
                name="type"
                required
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {itemTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="author">Author</Label>
              <Input id="author" name="author" placeholder="e.g. Cal Newport" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                name="url"
                type="url"
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                name="tags"
                placeholder="e.g. productivity, focus"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder="Any initial thoughts..."
              />
            </div>

            <Button type="submit" className="w-full">
              Add to Backlog
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
