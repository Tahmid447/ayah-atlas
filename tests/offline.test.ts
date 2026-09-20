import type { Chapter } from "../lib/types.ts";
import { test } from "node:test";
import assert from "node:assert/strict";
import { validateChapter } from "../lib/offline.ts";
const base = process.env.TEST_BASE_URL || "http://localhost:4173";
test("offline pack rejects altered Arabic and incomplete translations", async () => {
  const original = (await (
    await fetch(base + "/api/chapter/1")
  ).json()) as Chapter;
  await validateChapter(original, 1);
  const damaged = structuredClone(original);
  damaged.verses[0].text += "x";
  await assert.rejects(() => validateChapter(damaged, 1), /Arabic integrity/);
  const partial = structuredClone(original);
  partial.verses[0].translations.pop();
  await assert.rejects(
    () => validateChapter(partial, 1),
    /Incomplete translation/,
  );
});
