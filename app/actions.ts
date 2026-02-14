"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { createTables } from "@/src/db/migrate";
import {
  addItem,
  startItem,
  finishItem,
  abandonItem,
} from "@/src/services/items";
import { addProgress } from "@/src/services/progress";

let initialized = false;

async function ensureDb() {
  const d = db();
  if (!initialized) {
    await createTables(d);
    initialized = true;
  }
  return d;
}

export async function createItemAction(formData: FormData) {
  const d = await ensureDb();
  const tags = (formData.get("tags") as string)
    ?.split(",")
    .map((t) => t.trim())
    .filter(Boolean) ?? [];

  const item = await addItem(d, {
    title: formData.get("title") as string,
    type: formData.get("type") as string,
    author: (formData.get("author") as string) || null,
    url: (formData.get("url") as string) || null,
    tags,
    notes: (formData.get("notes") as string) || null,
  });

  redirect(`/items/${item.id}`);
}

export async function startItemAction(id: string) {
  const d = await ensureDb();
  await startItem(d, id);
  revalidatePath(`/items/${id}`);
  revalidatePath("/items");
  revalidatePath("/");
}

export async function finishItemAction(id: string, rating?: number) {
  const d = await ensureDb();
  await finishItem(d, id, rating);
  revalidatePath(`/items/${id}`);
  revalidatePath("/items");
  revalidatePath("/");
}

export async function abandonItemAction(id: string) {
  const d = await ensureDb();
  await abandonItem(d, id);
  revalidatePath(`/items/${id}`);
  revalidatePath("/items");
  revalidatePath("/");
}

export async function addProgressAction(itemId: string, formData: FormData) {
  const d = await ensureDb();
  await addProgress(d, {
    itemId,
    note: formData.get("note") as string,
    date: (formData.get("date") as string) || undefined,
  });
  revalidatePath(`/items/${itemId}`);
  revalidatePath("/");
}
