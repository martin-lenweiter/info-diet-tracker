"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@/components/ui/input";

const itemTypes = ["book", "article", "podcast", "video", "course", "paper"];
const itemStatuses = ["backlog", "in_progress", "finished", "abandoned"];

export function ItemsFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/items?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="flex flex-wrap gap-3">
      <Input
        placeholder="Search titles..."
        defaultValue={searchParams.get("query") ?? ""}
        className="w-48"
        onChange={(e) => {
          const value = e.target.value;
          // Debounce: only push after user stops typing
          const timeout = setTimeout(() => updateFilter("query", value), 300);
          return () => clearTimeout(timeout);
        }}
      />
      <select
        className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        defaultValue={searchParams.get("type") ?? ""}
        onChange={(e) => updateFilter("type", e.target.value)}
      >
        <option value="">All types</option>
        {itemTypes.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <select
        className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        defaultValue={searchParams.get("status") ?? ""}
        onChange={(e) => updateFilter("status", e.target.value)}
      >
        <option value="">All statuses</option>
        {itemStatuses.map((s) => (
          <option key={s} value={s}>
            {s.replace("_", " ")}
          </option>
        ))}
      </select>
    </div>
  );
}
