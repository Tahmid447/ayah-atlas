import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  parseWorkspaceBackup,
  mergeWorkspaceBackup,
  verifySavedSource,
} from "../lib/workspace-backup.ts";
import type { Evidence } from "../lib/types.ts";
const raw = readFileSync(
  new URL("../docs/test-results/device-workspace.json", import.meta.url),
  "utf8",
);
test("actual device backup passes quotation integrity and rejects altered scripture", async () => {
  const backup = await parseWorkspaceBackup(raw);
  assert.equal(backup.entries["atlas.notebook"]?.length, 2);
  const bad = JSON.parse(raw);
  bad.entries["atlas.notebook"][0].evidence.verse.text += "x";
  await assert.rejects(
    () => parseWorkspaceBackup(JSON.stringify(bad)),
    /checksum mismatch/,
  );
});
test("restore rejects unknown storage keys and executable source links", async () => {
  const bad = JSON.parse(raw);
  bad.entries["admin.token"] = "bad";
  await assert.rejects(() => parseWorkspaceBackup(JSON.stringify(bad)));
  delete bad.entries["admin.token"];
  bad.entries["atlas.notebook"][0].evidence.citation.url =
    "javascript:alert(1)";
  await assert.rejects(() => parseWorkspaceBackup(JSON.stringify(bad)));
});
test("restore merges notes and preserves a different current draft", async () => {
  const backup = await parseWorkspaceBackup(raw);
  const values = new Map<string, string>([
    ["atlas.notebook", JSON.stringify(backup.entries["atlas.notebook"])],
    [
      "atlas.talk",
      JSON.stringify({
        title: "Current draft",
        draft: "Keep me",
        evidenceIds: [],
      }),
    ],
  ]);
  const storage = {
    getItem: (k: string) => values.get(k) || null,
    setItem: (k: string, v: string) => {
      values.set(k, v);
    },
    removeItem: (k: string) => {
      values.delete(k);
    },
  };
  const result = mergeWorkspaceBackup(backup, storage);
  assert.equal(JSON.parse(values.get("atlas.notebook")!).length, 2);
  assert.equal(JSON.parse(values.get("atlas.talk")!).draft, "Keep me");
  assert.ok(result.recoveredTalk);
  assert.ok(values.has("atlas.recoveredTalk"));
  assert.ok(!values.has("atlas.offlinePack"));
});
test("restore rolls back writes on a one-time storage failure", async () => {
  const backup = await parseWorkspaceBackup(raw);
  const values = new Map([["atlas.language", '"en"']]);
  const before = new Map(values);
  let writes = 0;
  const storage = {
    getItem: (k: string) => values.get(k) || null,
    setItem: (k: string, v: string) => {
      if (++writes === 3) throw new Error("Quota");
      values.set(k, v);
    },
    removeItem: (k: string) => {
      values.delete(k);
    },
  };
  assert.throws(() => mergeWorkspaceBackup(backup, storage), /Quota/);
  assert.deepEqual(values, before);
});
test("restore checks hadith attribution against actual indexed source", async () => {
  const backup = await parseWorkspaceBackup(raw);
  const records = new Map<string, Evidence>();
  for (const item of backup.entries["atlas.notebook"] || []) {
    const r = await fetch(
      (process.env.TEST_BASE_URL || "http://localhost:4173") +
        "/api/evidence/" +
        encodeURIComponent(item.evidence.id),
    );
    records.set(item.evidence.id, (await r.json()) as Evidence);
  }
  verifySavedSource(backup.entries["atlas.notebook"], records);
  const h = backup.entries["atlas.notebook"]!.find(
    (x) => x.evidence.kind === "hadith",
  )!;
  h.evidence.passage!.grade = "Invented grade";
  assert.throws(
    () => verifySavedSource(backup.entries["atlas.notebook"], records),
    /provenance/,
  );
  const fresh = await parseWorkspaceBackup(raw);
  fresh.entries["atlas.notebook"]![0].evidence.verse!.text += "x";
  assert.throws(() => verifySavedSource(fresh.entries["atlas.notebook"], records), /canonical/);
});
test("a repeated restore cannot overwrite an already recovered talk", async () => {
  const backup = await parseWorkspaceBackup(raw);
  const values = new Map([
    ["atlas.talk", JSON.stringify({...backup.entries["atlas.talk"],title:"Current talk"})],
    ["atlas.recoveredTalk", JSON.stringify({...backup.entries["atlas.talk"],title:"Earlier recovery"})],
  ]);
  const before = new Map(values);
  const storage = {
    getItem: (k: string) => values.get(k) || null,
    setItem: (k: string, v: string) => { values.set(k,v); },
    removeItem: (k: string) => { values.delete(k); },
  };
  assert.throws(()=>mergeWorkspaceBackup(backup,storage),/more than two different talks/);
  assert.deepEqual(values,before);
});
