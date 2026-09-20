import {
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
export const sources = sqliteTable("sources", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  author: text("author").notNull(),
  publisher: text("publisher").notNull(),
  language: text("language").notNull(),
  url: text("url").notNull(),
  terms: text("terms").notNull(),
  scope: text("scope").notNull(),
});
export const editions = sqliteTable("editions", {
  id: text("id").primaryKey(),
  sourceId: text("source_id")
    .notNull()
    .references(() => sources.id),
  version: text("version").notNull(),
  retrieved: text("retrieved").notNull(),
  checksum: text("checksum").notNull(),
  status: text("status").notNull(),
  count: integer("count").notNull(),
  active: integer("active").notNull().default(1),
  metadata: text("metadata").notNull(),
});
export const importRuns = sqliteTable("import_runs", {
  id: text("id").primaryKey(),
  started: text("started").notNull(),
  completed: text("completed"),
  status: text("status").notNull(),
  report: text("report").notNull(),
});
export const surahs = sqliteTable("surahs", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  arabic: text("arabic").notNull(),
  meaning: text("meaning").notNull(),
  count: integer("count").notNull(),
  revelation: text("revelation").notNull(),
});
export const ayat = sqliteTable(
  "ayat",
  {
    key: text("key").primaryKey(),
    surah: integer("surah")
      .notNull()
      .references(() => surahs.id),
    ayah: integer("ayah").notNull(),
    text: text("text").notNull(),
    basmalah: text("basmalah"),
    juz: integer("juz").notNull(),
    page: integer("page").notNull(),
    editionId: text("edition_id")
      .notNull()
      .references(() => editions.id),
    checksum: text("checksum").notNull(),
    normalized: text("normalized").notNull(),
  },
  (t) => [
    uniqueIndex("ayat_surah_ayah").on(t.surah, t.ayah),
    index("ayat_juz").on(t.juz),
  ],
);
export const passages = sqliteTable(
  "passages",
  {
    id: text("id").primaryKey(),
    editionId: text("edition_id")
      .notNull()
      .references(() => editions.id),
    kind: text("kind").notNull(),
    key: text("key").notNull(),
    surah: integer("surah"),
    ayah: integer("ayah"),
    language: text("language").notNull(),
    text: text("text").notNull(),
    footnotes: text("footnotes").notNull(),
    checksum: text("checksum").notNull(),
    url: text("url").notNull(),
    normalized: text("normalized").notNull(),
  },
  (t) => [
    index("passages_surah_language_kind").on(t.surah, t.language, t.kind),
    index("passages_key").on(t.key),
    uniqueIndex("passages_edition_key").on(t.editionId, t.key, t.language),
  ],
);
export const tafsirRanges = sqliteTable("tafsir_ranges", {
  id: text("id").primaryKey(),
  passageId: text("passage_id")
    .notNull()
    .references(() => passages.id),
  startKey: text("start_key")
    .notNull()
    .references(() => ayat.key),
  endKey: text("end_key")
    .notNull()
    .references(() => ayat.key),
});
export const hadith = sqliteTable("hadith", {
  id: text("id").primaryKey(),
  editionId: text("edition_id")
    .notNull()
    .references(() => editions.id),
  title: text("title").notNull(),
  arabic: text("arabic").notNull(),
  attribution: text("attribution").notNull(),
  reference: text("reference").notNull(),
  payload: text("payload").notNull(),
});
export const numberingAliases = sqliteTable("numbering_aliases", {
  id: text("id").primaryKey(),
  hadithId: text("hadith_id")
    .notNull()
    .references(() => hadith.id),
  collection: text("collection").notNull(),
  number: text("number").notNull(),
  scheme: text("scheme").notNull(),
  url: text("url").notNull(),
  verification: text("verification").notNull(),
});
export const gradings = sqliteTable("gradings", {
  id: text("id").primaryKey(),
  hadithId: text("hadith_id")
    .notNull()
    .references(() => hadith.id),
  grade: text("grade").notNull(),
  attributedTo: text("attributed_to").notNull(),
  url: text("url").notNull(),
});
export const displayMappings = sqliteTable("display_mappings", {
  id: text("id").primaryKey(),
  surah: integer("surah").notNull(),
  section: text("section").notNull(),
  images: text("images").notNull(),
  sourceUrl: text("source_url").notNull(),
  startAyah: integer("start_ayah"),
  endAyah: integer("end_ayah"),
});
export const topicAliases = sqliteTable("topic_aliases", {
  id: text("id").primaryKey(),
  topic: text("topic").notNull(),
  language: text("language").notNull(),
  alias: text("alias").notNull(),
  provenance: text("provenance").notNull(),
});
export const relationships = sqliteTable("relationships", {
  id: text("id").primaryKey(),
  topic: text("topic").notNull(),
  evidenceId: text("evidence_id").notNull(),
  type: text("type").notNull(),
  provenance: text("provenance").notNull(),
});
export const researchSessions = sqliteTable("research_sessions", {
  id: text("id").primaryKey(),
  owner: text("owner").notNull(),
  query: text("query").notNull(),
  created: text("created").notNull(),
  status: text("status").notNull(),
  payload: text("payload").notNull(),
});
export const claims = sqliteTable("claims", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").references(() => researchSessions.id),
  wording: text("wording").notNull(),
  kind: text("kind").notNull(),
  evidenceIds: text("evidence_ids").notNull(),
  review: text("review").notNull(),
});
export const citations = sqliteTable("citations", {
  id: text("id").primaryKey(),
  editionId: text("edition_id")
    .notNull()
    .references(() => editions.id),
  locator: text("locator").notNull(),
  exactText: text("exact_text").notNull(),
  span: text("span"),
  url: text("url").notNull(),
  checksum: text("checksum").notNull(),
});
export const notebooks = sqliteTable("notebooks", {
  id: text("id").primaryKey(),
  owner: text("owner").notNull(),
  title: text("title").notNull(),
  payload: text("payload").notNull(),
  updated: text("updated").notNull(),
});
export const talks = sqliteTable("talks", {
  id: text("id").primaryKey(),
  owner: text("owner").notNull(),
  title: text("title").notNull(),
  language: text("language").notNull(),
  payload: text("payload").notNull(),
  updated: text("updated").notNull(),
});
export const reviews = sqliteTable("reviews", {
  id: text("id").primaryKey(),
  reviewer: text("reviewer").notNull(),
  scope: text("scope").notNull(),
  evidenceId: text("evidence_id").notNull(),
  status: text("status").notNull(),
  note: text("note").notNull(),
  created: text("created").notNull(),
});
export const revisions = sqliteTable("revisions", {
  id: text("id").primaryKey(),
  oldEdition: text("old_edition").notNull(),
  newEdition: text("new_edition").notNull(),
  changedKeys: text("changed_keys").notNull(),
  created: text("created").notNull(),
});
