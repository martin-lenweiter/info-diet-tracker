"use client";

import { useRef, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addProgressAction } from "@/app/actions";

export function ProgressForm({ itemId }: { itemId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={(formData) =>
        startTransition(async () => {
          await addProgressAction(itemId, formData);
          formRef.current?.reset();
        })
      }
      className="space-y-2"
    >
      <Textarea
        name="note"
        required
        placeholder="Log your progress..."
        rows={2}
      />
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Saving..." : "Add Progress"}
      </Button>
    </form>
  );
}
