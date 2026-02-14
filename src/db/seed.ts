import { getDb } from "./index";
import { createTables } from "./migrate";
import { addItem, startItem, finishItem } from "../services/items";
import { addProgress } from "../services/progress";

async function main() {
  const db = getDb();
  await createTables(db);

  console.log("Seeding database...\n");

  // Books
  const deepWork = await addItem(db, {
    title: "Deep Work",
    type: "book",
    author: "Cal Newport",
    tags: ["productivity", "focus", "work"],
    notes: "Rules for focused success in a distracted world",
  });
  await startItem(db, deepWork.id);
  await addProgress(db, {
    itemId: deepWork.id,
    note: "Finished Part 1 - The Idea. Compelling case for depth.",
  });
  await addProgress(db, {
    itemId: deepWork.id,
    note: "Completed. The 4 rules are actionable. Will implement the shutdown ritual.",
  });
  await finishItem(db, deepWork.id, 5);
  console.log("  + Deep Work (book, finished, rated 5/5)");

  const ddia = await addItem(db, {
    title: "Designing Data-Intensive Applications",
    type: "book",
    author: "Martin Kleppmann",
    tags: ["engineering", "databases", "distributed-systems"],
    notes: "The big ideas behind reliable, scalable, and maintainable systems",
  });
  await startItem(db, ddia.id);
  await addProgress(db, {
    itemId: ddia.id,
    note: "Chapter 3 - Storage and Retrieval. LSM-trees vs B-trees finally clicked.",
  });
  console.log("  + DDIA (book, in progress)");

  // Papers
  const attention = await addItem(db, {
    title: "Attention Is All You Need",
    type: "paper",
    author: "Vaswani et al.",
    url: "https://arxiv.org/abs/1706.03762",
    tags: ["ml", "transformers", "research"],
  });
  await startItem(db, attention.id);
  await finishItem(db, attention.id, 5);
  console.log("  + Attention Is All You Need (paper, finished, rated 5/5)");

  // Articles
  await addItem(db, {
    title: "The Bitter Lesson",
    type: "article",
    author: "Rich Sutton",
    url: "http://www.incompleteideas.net/IncIdeas/BitterLesson.html",
    tags: ["ml", "research", "philosophy"],
  });
  console.log("  + The Bitter Lesson (article, backlog)");

  // Podcasts
  const lexPodcast = await addItem(db, {
    title: "Lex Fridman Podcast #400 - Elon Musk",
    type: "podcast",
    author: "Lex Fridman",
    url: "https://lexfridman.com/elon-musk-4",
    tags: ["tech", "ai", "interview"],
  });
  await startItem(db, lexPodcast.id);
  console.log("  + Lex Fridman #400 (podcast, in progress)");

  // Courses
  const fastai = await addItem(db, {
    title: "Fast.ai Practical Deep Learning",
    type: "course",
    author: "Jeremy Howard",
    url: "https://course.fast.ai",
    tags: ["ml", "deep-learning", "course"],
    notes: "Top-down teaching approach",
  });
  await startItem(db, fastai.id);
  await addProgress(db, {
    itemId: fastai.id,
    note: "Lesson 1 done. Built image classifier in 3 lines.",
  });
  console.log("  + Fast.ai course (course, in progress)");

  // Videos
  const mongoVideo = await addItem(db, {
    title: "10 Hour MongoDB Tutorial",
    type: "video",
    author: "Some YouTuber",
    url: "https://youtube.com/example",
    tags: ["databases", "nosql"],
    notes: "Way too long, switched to the docs instead",
  });
  await startItem(db, mongoVideo.id);
  console.log("  + MongoDB Tutorial (video, in progress)");

  console.log("\nSeed complete.");
  console.log("  2 finished, 4 in progress, 1 backlog");
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
