"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  startItemAction,
  finishItemAction,
  abandonItemAction,
} from "@/app/actions";
import type { Item } from "@/src/types/index";

export function ItemActions({ item }: { item: Item }) {
  const [isPending, startTransition] = useTransition();
  const [showRating, setShowRating] = useState(false);

  if (item.status === "finished" || item.status === "abandoned") {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {item.status === "backlog" && (
        <Button
          disabled={isPending}
          onClick={() =>
            startTransition(() => startItemAction(item.id))
          }
        >
          {isPending ? "Starting..." : "Start"}
        </Button>
      )}

      {item.status === "in_progress" && (
        <>
          {showRating ? (
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((r) => (
                <Button
                  key={r}
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(() => finishItemAction(item.id, r))
                  }
                >
                  {r}
                </Button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                disabled={isPending}
                onClick={() =>
                  startTransition(() => finishItemAction(item.id))
                }
              >
                Skip
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRating(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              disabled={isPending}
              onClick={() => setShowRating(true)}
            >
              Finish
            </Button>
          )}
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={() =>
              startTransition(() => abandonItemAction(item.id))
            }
          >
            {isPending ? "..." : "Abandon"}
          </Button>
        </>
      )}
    </div>
  );
}
