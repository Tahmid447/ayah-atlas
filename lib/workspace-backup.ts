import { z } from "zod";
import type { SavedEvidence } from "./types";
const language = z.enum(["en", "bn", "ja"]);
const text = z.string().max(300000);
const checksum = z.string().regex(/^[0-9a-f]{64}$/);
const sourceUrl = z
  .string()
  .url()
  .refine((s) => {
    const u = new URL(s);
    return (
      u.protocol === "https:" &&
      !u.username &&
      !u.password &&
      [
        "tanzil.net",
        "quranenc.com",
        "hadeethenc.com",
        "sunnah.com",
        "quran.com",
        "www.equraninstitute.com",
      ].includes(u.hostname)
    );
  }, "Unrecognized source URL in backup");
const passage = z
  .object({
    id: z.string().max(400),
    edition_id: z.string().max(400),
    kind: z.string().max(40),
    key: z.string().max(100),
    language: z.string().max(8),
    text,
    footnotes: text,
    checksum,
    url: sourceUrl,
    sourceTitle: z.string().max(1000),
    author: z.string().max(1000),
    publisher: z.string().max(1000),
    version: z.string().max(200),
    sourceId: z.string().max(200),
  })
  .passthrough();
const verse = z
  .object({
    key: z.string().regex(/^\d{1,3}:\d{1,3}$/),
    surah: z.number().int().min(1).max(114),
    ayah: z.number().int().min(1).max(286),
    text,
    checksum,
    edition_id: z.string().max(400),
    translations: z.array(passage).max(20),
  })
  .passthrough();
const evidence = z
  .object({
    id: z.string().max(400),
    key: z.string().max(100),
    kind: z.string().max(40),
    arabic: text.optional(),
    verse: verse.optional(),
    passage: passage.optional(),
    related: z.array(passage).max(40),
    citation: z
      .object({
        id: z.string().max(400),
        edition: z.string().max(400),
        locator: z.string().max(400),
        url: sourceUrl,
        checksum,
        text,
      })
      .passthrough(),
  })
  .passthrough();
const saved = z.object({
  id: z.string().max(100),
  evidence,
  note: z.string().max(10000),
  collection: z.string().max(100),
  savedAt: z.string().max(100),
  order: z.number().int().min(0),
});
const talk = z.object({
  title: z.string().max(200),
  language,
  audience: z.string().max(200),
  minutes: z.number().min(3).max(120),
  outline: z.string().max(10000),
  draft: z.string().max(20000),
  evidenceIds: z.array(z.string().max(100)).max(250),
  updated: z.string().max(100),
});
const entries = z
  .object({
    "atlas.language": language.optional(),
    "atlas.translationLanguages": z.array(language).min(1).max(3).optional(),
    "atlas.theme": z.enum(["light", "dark"]).optional(),
    "atlas.position": z
      .string()
      .regex(/^\d{1,3}:\d{1,3}$/)
      .optional(),
    "atlas.bookmarks": z
      .array(z.string().regex(/^\d{1,3}:\d{1,3}$/))
      .max(6236)
      .optional(),
    "atlas.notebook": z.array(saved).max(250).optional(),
    "atlas.talk": talk.optional(),
    "atlas.readMode": z.enum(["page", "study", "continuous"]).optional(),
    "atlas.arabicSize": z.number().min(16).max(80).optional(),
    "atlas.lineSpacing": z.number().min(1).max(5).optional(),
    "atlas.pageImage": z.number().int().min(0).max(1000).optional(),
    "atlas.editions": z
      .object({
        en: z.enum(["english_rwwad", "english_saheeh"]),
        bn: z.enum(["bengali_zakaria", "bengali_rwwad"]),
        ja: z.literal("japanese_saeedsato"),
      })
      .optional(),
    "atlas.offlinePack": z.string().max(100).optional(),
    "atlas.recoveredTalk": talk.nullable().optional(),
  })
  .strict();
export const backupSchema = z
  .object({
    format: z.literal("ayah-atlas-device-backup"),
    version: z.literal(1),
    created: z.string().max(100),
    entries,
  })
  .strict();
export type WorkspaceBackup = z.infer<typeof backupSchema>;
async function hash(text: string) {
  return [
    ...new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)),
    ),
  ]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
export async function parseWorkspaceBackup(raw: string) {
  if (raw.length > 10000000)
    throw new Error("Backup is too large (10 MB maximum).");
  const backup = backupSchema.parse(JSON.parse(raw));
  for (const item of backup.entries["atlas.notebook"] || []) {
    const e = item.evidence;
    if (e.verse && (await hash(e.verse.text)) !== e.verse.checksum)
      throw new Error("Arabic checksum mismatch in saved evidence.");
    for (const p of [
      ...(e.verse?.translations || []),
      ...(e.passage ? [e.passage] : []),
      ...e.related,
    ])
      if ((await hash(p.text + "\n" + p.footnotes)) !== p.checksum)
        throw new Error(
          "Published quotation checksum mismatch in saved evidence.",
        );
  }
  return backup;
}
export function mergeWorkspaceBackup(
  backup: WorkspaceBackup,
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem">,
) {
  const old = new Map<string, string | null>();
  const writes = new Map<string, string>();
  for (const [key, value] of Object.entries(backup.entries)) {
    if (key === "atlas.offlinePack") continue;
    writes.set(key, JSON.stringify(value));
  }
  const incoming = backup.entries["atlas.notebook"];
  if (incoming) {
    const current = JSON.parse(
      storage.getItem("atlas.notebook") || "[]",
    ) as SavedEvidence[];
    const known = new Set(current.map((x) => x.id));
    writes.set(
      "atlas.notebook",
      JSON.stringify([...current, ...incoming.filter((x) => !known.has(x.id))]),
    );
  }
  // Keep an existing edited talk; preserve the imported one under a recovery key for explicit selection.
  const currentTalk = storage.getItem("atlas.talk");
  const importedTalk = writes.get("atlas.talk");
  const currentRecovered = storage.getItem("atlas.recoveredTalk");
  const incomingRecovered = writes.get("atlas.recoveredTalk");
  // A second recovery must never silently replace a draft retained by an earlier restore.
  const drafts = new Map<string, string>();
  for (const raw of [currentTalk, currentRecovered, importedTalk, incomingRecovered]) {
    if (!raw || raw === "null") continue;
    const draft = JSON.parse(raw);
    if (!draft.title && !draft.draft && !draft.evidenceIds?.length) continue;
    const identity = JSON.stringify(Object.fromEntries(Object.entries(draft).filter(([k]) => k !== "updated").sort(([a], [b]) => a.localeCompare(b))));
    drafts.set(identity, raw);
  }
  if (drafts.size > 2)
    throw new Error("This restore contains more than two different talks. Your current and recovered talks are unchanged. Export them first and keep this backup for a separate workspace.");
  if (currentTalk && importedTalk && currentTalk !== importedTalk) {
    const t = JSON.parse(currentTalk);
    if (t.title || t.draft || t.evidenceIds?.length) {
      writes.delete("atlas.talk");
      writes.set("atlas.recoveredTalk", importedTalk);
    }
  }
  if (drafts.size > 0) {
    const active = writes.get("atlas.talk") || currentTalk;
    const activeDraft = active && active !== "null" ? JSON.parse(active) : null;
    const activeContent = activeDraft ? Object.fromEntries(Object.entries(activeDraft).filter(([k]) => k !== "updated").sort(([a], [b]) => a.localeCompare(b))) : null;
    const extra = [...drafts.entries()].find(([key]) => key !== JSON.stringify(activeContent));
    if (extra) writes.set("atlas.recoveredTalk", extra[1]);
    else writes.delete("atlas.recoveredTalk");
  }
  for (const key of writes.keys()) old.set(key, storage.getItem(key));
  try {
    for (const [key, value] of writes) storage.setItem(key, value);
  } catch (error) {
    for (const [key, value] of old) {
      try {
        if (value === null) storage.removeItem(key);
        else storage.setItem(key, value);
      } catch {}
    }
    throw error;
  }
  return {
    savedEvidence: incoming?.length || 0,
    recoveredTalk: writes.has("atlas.recoveredTalk"),
  };
}
export function verifySavedSource(
  saved: WorkspaceBackup["entries"]["atlas.notebook"],
  resolved: Map<string, import("./types").Evidence>,
) {
  for (const item of saved || []) {
    const a = item.evidence,
      b = resolved.get(a.id);
    if (!b)
      throw new Error(
        "Saved edition is unavailable in the current library. Keep the backup and restore its matching source corpus first.",
      );
    for (const key of ["id", "edition", "locator", "checksum", "url", "text", "retrieved"] as const)
      if (a.citation[key] !== b.citation[key])
        throw new Error(
          "Saved citation differs from the current source record.",
        );
    if (a.arabic !== b.arabic)
      throw new Error("Saved Arabic differs from the current source record.");
    if (a.key !== b.key || a.kind !== b.kind || !!a.verse !== !!b.verse || !!a.passage !== !!b.passage)
      throw new Error("Saved evidence identity differs from the current source record.");
    if (a.verse && b.verse) {
      for (const key of ["key", "surah", "ayah", "text", "checksum", "edition_id", "basmalah", "juz", "page"] as const)
        if (a.verse[key] !== b.verse[key]) throw new Error("Saved verse differs from the canonical source record.");
    }
    const originals = new Map(
      [
        ...(b.verse?.translations || []),
        ...(b.passage ? [b.passage] : []),
        ...b.related,
      ].map((p) => [p.id, p]),
    );
    for (const p of [
      ...(a.verse?.translations || []),
      ...(a.passage ? [a.passage] : []),
      ...a.related,
    ]) {
      const original = originals.get(p.id);
      if (!original)
        throw new Error(
          "A saved source edition is not in the restored library.",
        );
      for (const key of [
        "checksum",
        "key",
        "kind",
        "language",
        "text",
        "footnotes",
        "edition_id",
        "url",
        "sourceTitle",
        "author",
        "publisher",
        "version",
        "sourceId",
      ] as const)
        if (p[key] !== original[key])
          throw new Error(
            "Saved source attribution differs from the indexed edition.",
          );
      for (const key of ["arabic", "grade", "gradeAttribution", "reference", "rangeKeys", "hints", "glossary"] as const)
        if (JSON.stringify(p[key]) !== JSON.stringify(original[key]))
          throw new Error("Saved source provenance or commentary differs from the publisher record.");
    }
    for (const key of ["grade", "gradeAttribution", "reference"] as const)
      if (a.passage?.[key] !== b.passage?.[key])
        throw new Error(
          "Saved hadith provenance differs from the publisher record.",
        );
  }
}
