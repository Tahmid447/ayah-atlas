import { rows, row, passageSelect } from "./db";
import { searchTerms, understand, normalize } from "../topics";
import type {
  Verse,
  Passage,
  Evidence,
  Research,
  Source,
  SearchResult,
} from "../types";
export async function sources() {
  return rows<Source>(
    "SELECT s.*,e.id editionId,e.version,e.retrieved,e.checksum,e.status,e.count,e.metadata FROM sources s JOIN editions e ON e.source_id=s.id WHERE e.active=1",
  );
}
export async function verse(key: string): Promise<Verse | null> {
  const v = await row<Verse>("SELECT * FROM ayat WHERE key=?", [key]);
  if (!v) return null;
  v.translations = await rows<Passage>(
    passageSelect + " WHERE p.key=? AND p.kind='translation' ORDER BY s.id",
    [key],
  );
  return v;
}
export async function chapter(s: number) {
  const info = await row("SELECT * FROM surahs WHERE id=?", [s]);
  if (!info) return null;
  const verses = await rows<Verse>(
    "SELECT * FROM ayat WHERE surah=? ORDER BY ayah",
    [s],
  );
  const ts = await rows<Passage>(
    passageSelect + " WHERE p.surah=? AND p.kind='translation' ORDER BY p.ayah",
    [s],
  );
  return {
    surah: info,
    verses: verses.map((v) => ({
      ...v,
      translations: ts.filter((t) => t.key === v.key),
    })),
    pages: await rows(
      "SELECT * FROM display_mappings WHERE surah=? ORDER BY start_ayah,id",
      [s],
    ),
  };
}
export async function evidence(id: string): Promise<Evidence | null> {
  if (id.startsWith("q:") || /^\d{1,3}:\d{1,3}$/.test(id)) {
    const key = id.replace(/^q:/, "");
    const v = await verse(key);
    if (!v) return null;
    const related = await rows<Passage>(
      passageSelect +
        " WHERE p.id IN (SELECT passage_id FROM tafsir_ranges WHERE start_key=?)",
      [key],
    );
    for (const p of related)
      p.rangeKeys = (
        await rows<{ start_key: string }>(
          "SELECT start_key FROM tafsir_ranges WHERE passage_id=?",
          [p.id],
        )
      ).map((x) => x.start_key);
    const context = await rows<Verse>(
      "SELECT * FROM ayat WHERE surah=? AND ayah BETWEEN ? AND ? ORDER BY ayah",
      [v.surah, Math.max(1, v.ayah - 2), v.ayah + 2],
    );
    const e = await row<{ retrieved: string }>(
      "SELECT retrieved FROM editions WHERE id=?",
      [v.edition_id],
    );
    return {
      id: "q:" + key,
      key,
      kind: "quran",
      arabic: v.text,
      verse: v,
      related,
      context,
      citation: {
        id: "q:" + key + "@" + v.edition_id,
        edition: v.edition_id,
        locator: key,
        url: "https://tanzil.net/#" + key,
        text: v.text,
        checksum: v.checksum,
        retrieved: e?.retrieved,
      },
    };
  }
  let p = await row<Passage>(passageSelect + " WHERE p.id=?", [id]);
  if (!p && id.startsWith("h:"))
    p = await row<Passage>(
      passageSelect + " WHERE p.key=? AND p.language='en'",
      [id],
    );
  if (!p) return null;
  let arabic: string | undefined;
  if (p.kind === "hadith") {
    const h = await row<{ arabic: string; reference: string; payload: string }>(
      "SELECT * FROM hadith WHERE id=?",
      [p.key.slice(2)],
    );
    const grade = await row<{ grade: string; attributed_to: string }>(
      "SELECT * FROM gradings WHERE hadith_id=?",
      [p.key.slice(2)],
    );
    const aliases = await rows<{
      collection: string;
      number: string;
      url: string;
      verification: string;
    }>("SELECT * FROM numbering_aliases WHERE hadith_id=?", [p.key.slice(2)]);
    arabic = h?.arabic;
    if (h) {
      const payload = JSON.parse(h.payload);
      p.hints = payload[p.language]?.hints || [];
      p.glossary = Object.values(payload)
        .flatMap(
          (x) =>
            (x as { words_meanings_ar?: { word: string; meaning: string }[] })
              .words_meanings_ar || [],
        )
        .filter((x, i, a) => a.findIndex((y) => y.word === x.word) === i);
    }
    p.grade = grade?.grade;
    p.gradeAttribution = grade?.attributed_to;
    p.reference =
      aliases
        .map((x) => x.collection + " " + x.number + " · " + x.verification)
        .join("\n") ||
      h?.reference ||
      "Publisher digital locator " + p.key;
  }
  const related = await rows<Passage>(
    passageSelect + " WHERE p.key=? AND p.kind=? AND p.id<>?",
    [p.key, p.kind, p.id],
  );
  if (p.kind === "tafsir")
    p.rangeKeys = (
      await rows<{ start_key: string }>(
        "SELECT start_key FROM tafsir_ranges WHERE passage_id=?",
        [p.id],
      )
    ).map((x) => x.start_key);
  return {
    id: p.id,
    key: p.key,
    kind: p.kind,
    arabic,
    passage: p,
    related,
    citation: {
      id: p.id,
      edition: p.edition_id,
      locator: p.key,
      url: p.url,
      text: p.text,
      checksum: p.checksum,
    },
  };
}
export async function research(
  query: string,
  page = 1,
  filter = "all",
  language = "all",
): Promise<Research> {
  const terms = searchTerms(query),
    ts = understand(query);
  const exact = query
    .trim()
    .match(/^(?:quran\s*)?(\d{1,3})\s*[:/]\s*(\d{1,3})$/i);
  const hadithRef = query.match(
    /(?:sahih\s+)?(muslim|(?:al-)?bukhari)\s*:?\s*(\d+)/i,
  );
  const found = new Map<string, SearchResult>();
  if (exact) {
    const v = await verse(exact[1] + ":" + exact[2]);
    if (v)
      found.set("q:" + v.key, {
        id: "q:" + v.key,
        key: v.key,
        kind: "quran",
        title: "Quran " + v.key,
        text: v.text,
        language: "ar",
        relevance: "Exact verse reference",
        sourceTitle: "Tanzil · Uthmani 1.1",
        url: "https://tanzil.net/#" + v.key,
        score: 1000,
      });
  }
  if (hadithRef) {
    const alias = await row<{ hadith_id: string }>(
      "SELECT hadith_id FROM numbering_aliases WHERE id=?",
      [
        (hadithRef[1].toLowerCase().includes("muslim") ? "muslim" : "bukhari") +
          ":" +
          hadithRef[2],
      ],
    );
    if (alias) {
      const p = await row<Passage>(
        passageSelect + " WHERE p.key=? AND p.language='en'",
        ["h:" + alias.hadith_id],
      );
      if (p)
        found.set(p.key, {
          id: p.id,
          key: p.key,
          kind: "hadith",
          title: hadithRef[0],
          text: p.text,
          language: p.language,
          relevance: "Exact verified numbering alias",
          sourceTitle: p.sourceTitle,
          url: p.url,
          score: 1000,
        });
    }
  }
  const latin = terms.filter(
    (t) => !/\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}/u.test(t),
  );
  const cjk = terms.filter((t) =>
    /\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}/u.test(t),
  );
  let hits: { id: string; rank: number }[] = [];
  if (latin.length) {
    const fts = latin
      .map((t) => '"' + t.replace(/"/g, '""') + '"*')
      .join(" OR ");
    hits = await rows(
      "SELECT id,rank FROM search_fts WHERE search_fts MATCH ? ORDER BY rank LIMIT 5000",
      [fts],
    );
  }
  for (const t of cjk) {
    if (t.length >= 3) {
      hits.push(
        ...(await rows<{ id: string; rank: number }>(
          "SELECT id,rank FROM search_cjk WHERE search_cjk MATCH ? LIMIT 3000",
          ['"' + t.replace(/"/g, '""') + '"'],
        )),
      );
    } else {
      const rr = await rows<{ id: string }>(
        "SELECT id FROM passages WHERE language='ja' AND normalized LIKE ? LIMIT 3000",
        ["%" + t.replace(/[%_]/g, "") + "%"],
      );
      hits.push(...rr.map((r) => ({ ...r, rank: -1 })));
    }
  }
  const ids = [
    ...new Set(hits.map((h) => h.id).filter((id) => !id.startsWith("q:"))),
  ];
  const rank = new Map(hits.map((h) => [h.id, -h.rank]));
  // D1 bind limit: batch evidence lookup, never concatenate untrusted SQL.
  for (let offset = 0; offset < ids.length; offset += 70) {
    const batch = ids.slice(offset, offset + 70);
    const ps = await rows<Passage>(
      passageSelect + " WHERE p.id IN (" + batch.map(() => "?").join(",") + ")",
      batch,
    );
    for (const p of ps) {
      if (language !== "all" && p.language !== language && p.language !== "ar")
        continue;
      const key =
        p.kind === "translation"
          ? "q:" + p.key
          : p.kind === "hadith"
            ? p.key
            : p.id;
      const kind = p.kind === "translation" ? "quran" : p.kind;
      const plain = normalize(p.text.replace(/<[^>]+>/g, " "));
      const direct = terms.filter((term) =>
        plain.includes(normalize(term)),
      ).length;
      const score =
        (rank.get(p.id) || 0) +
        (direct ? 15 + Math.min(direct, 4) * 3 : 0) +
        (p.kind === "translation" ? 3 : 0) +
        (p.language === language ? 1 : 0);
      const old = found.get(key);
      if (old && old.score >= score) continue;
      found.set(key, {
        id: p.kind === "translation" ? "q:" + p.key : p.id,
        key: p.key,
        kind,
        title:
          kind === "quran"
            ? "Quran " + p.key
            : kind === "tafsir"
              ? p.sourceTitle + " · " + p.key
              : "Hadith · " + p.key.replace("h:", ""),
        text: p.text,
        language: p.language,
        relevance:
          (direct
            ? "Search terms occur in the published passage. "
            : "Match comes from published footnotes/commentary; a broader connection. ") +
          (ts.length
            ? "Expanded topics: " + ts.map((t) => t.labels.en).join(", ")
            : "Inspect the original context."),
        sourceTitle: p.sourceTitle,
        url: p.url,
        score,
      });
    }
  }
  for (const h of hits.filter((h) => h.id.startsWith("q:"))) {
    if (!found.has(h.id)) {
      const v = await row<Verse>("SELECT * FROM ayat WHERE key=?", [
        h.id.slice(2),
      ]);
      if (v)
        found.set(h.id, {
          id: h.id,
          key: v.key,
          kind: "quran",
          title: "Quran " + v.key,
          text: v.text,
          language: "ar",
          relevance: "Match in canonical Arabic search text",
          sourceTitle: "Tanzil · Uthmani",
          url: "https://tanzil.net/#" + v.key,
          score: -h.rank + 2,
        });
    }
  }
  // Preserve all distinct commentary and narration records; grades are attributed separately.
  const hs = await rows<{ hadith_id: string; grade: string }>(
    "SELECT hadith_id,grade FROM gradings",
  );
  const grades = new Map(hs.map((g) => [g.hadith_id, g.grade]));
  let all = [...found.values()].filter(
    (r) =>
      r.kind !== "hadith" ||
      !/weak|fabricated|unreported/i.test(
        grades.get(r.key.slice(2)) || "Unreported",
      ),
  );
  const aliases = await rows<{
    hadith_id: string;
    collection: string;
    number: string;
  }>("SELECT hadith_id,collection,number FROM numbering_aliases");
  for (const r of all) {
    const alias = aliases.find((x) => r.key === "h:" + x.hadith_id);
    if (alias) r.title = alias.collection + " " + alias.number;
  }
  const counts = {
    quran: all.filter((r) => r.kind === "quran").length,
    tafsir: all.filter((r) => r.kind === "tafsir").length,
    hadith: all.filter((r) => r.kind === "hadith").length,
  };
  all = all
    .filter(
      (r) =>
        (filter === "all" || r.kind === filter) &&
        (language === "all" || r.language === language || r.language === "ar"),
    )
    .sort((a, b) => b.score - a.score);
  if (filter === "all" && !exact && !hadithRef) {
    const queues = ["quran", "hadith", "tafsir"].map((k) =>
      all.filter((r) => r.kind === k),
    );
    const mixed: SearchResult[] = [];
    while (queues.some((q) => q.length)) {
      for (const [i, n] of [
        [0, 6],
        [1, 3],
        [2, 3],
      ])
        mixed.push(...queues[i].splice(0, n));
    }
    all = mixed;
  }
  const stats = await row<{ ayat: number; editions: number; hadith: number }>(
    "SELECT (SELECT COUNT(*) FROM ayat) ayat,(SELECT COUNT(*) FROM editions) editions,(SELECT COUNT(*) FROM hadith) hadith",
  );
  return {
    query,
    terms,
    topics: ts.map((t) => t.id),
    results: all
      .slice((page - 1) * 18, page * 18)
      .map((r) => ({ ...r, grade: grades.get(r.key.slice(2)) })),
    total: all.length,
    page,
    pageSize: 18,
    counts,
    coverage: stats!,
    scope:
      "References found in the indexed sources. Topic expansion guides retrieval; it does not establish a religious finding.",
    limitations: [
      "No generative synthesis or semantic model is enabled.",
      "Hadith coverage is limited to the imported collection.",
      "Lexical relevance is not a scholarly judgment of interpretive support.",
      "Original query qualifiers are retained. Word matching cannot determine whether a passage affirms or negates a premise; inspect the full context.",
      "No identified human scholarly review has been recorded.",
    ],
  };
}
export async function story(topicId: string, language: string) {
  const topic = understand(topicId).find(
    (t) => t.group === "Prophetic stories",
  );
  if (!topic) return null;
  const source =
    language === "bn"
      ? "bengali_zakaria"
      : language === "ja"
        ? "japanese_saeedsato"
        : "english_rwwad";
  const terms = topic.terms.map(normalize);
  const passages = await rows<Passage>(
    passageSelect + " WHERE s.id=? ORDER BY p.surah,p.ayah",
    [source],
  );
  const selected = passages.filter((p) =>
    terms.some((t) => normalize(p.text).includes(t)),
  );
  const grouped = new Map<number, Passage[]>();
  for (const p of selected) {
    const bucket = grouped.get(p.surah!) || [];
    bucket.push(p);
    grouped.set(p.surah!, bucket);
  }
  const chapters = await rows<{ id: number; name: string; arabic: string }>(
    "SELECT id,name,arabic FROM surahs",
  );
  return {
    topic: topic.id,
    total: selected.length,
    method:
      "Published translation passages mentioning the prophet. Ordered by Quran chapter, not historical chronology. Open each passage for context and attributed commentary.",
    groups: [...grouped].map(([surah, passages]) => ({
      surah,
      name: chapters.find((c) => c.id === surah)!.name,
      passages,
    })),
  };
}
