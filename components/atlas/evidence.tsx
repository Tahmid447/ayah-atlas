"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ExternalLink,
  Bookmark,
  Copy,
  Search,
  ChevronRight,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import type { Evidence, Passage } from "@/lib/types";
import type { Language } from "@/lib/topics";
import { dictionary } from "@/lib/i18n";
import {
  api,
  Load,
  SourceText,
  SourceLink,
  evidenceMarkdown,
  textOnly,
  evidenceLabel,
  withReadingPreferences,
} from "./shared";
export function EvidenceLens({
  id,
  onClose,
  lang,
  save,
  research,
  notify,
  initialTab,
  translationLang,
}: {
  initialTab: string;
  translationLang: Language;
  id: string | null;
  onClose: () => void;
  lang: Language;
  save: (e: Evidence) => void;
  research: (q: string) => void;
  notify: (s: string) => void;
}) {
  const t = dictionary(lang);
  const [e, setE] = useState<Evidence | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState(initialTab);
  const [depth, setDepth] = useState("full");
  const [compare, setCompare] = useState(false);
  const [tafsirLang, setTafsirLang] = useState<string>(translationLang);
  useEffect(() => {
    if (!id) return;
    let live = true;
    api<Evidence>("/api/evidence/" + encodeURIComponent(id))
      .then((x) => live && setE(x))
      .catch((x) => live && setError(x.message));
    return () => {
      live = false;
    };
  }, [id]);
  const explanations =
    e?.kind === "quran" ? e.related.filter((p) => p.kind === "tafsir") : [];
  const selected = explanations.filter((p) => p.language === tafsirLang);
  const comparison = compare
    ? explanations.filter((p) => p.language !== tafsirLang).slice(0, 1)
    : [];
  function published(p: Passage) {
    const txt = textOnly(p.text);
    const excerpt =
      depth === "brief"
        ? txt
            .split("\n")
            .filter((x) => x.trim())
            .slice(0, 2)
            .join("\n")
        : txt;
    return (
      <div className="explanation-source" key={p.id}>
        <h3>{p.sourceTitle}</h3>
        <p className="meta-text">
          {p.author} · v{p.version} · {p.language.toUpperCase()}
        </p>
        {p.rangeKeys && (
          <p className="source-range">
            {p.rangeKeys.length > 1
              ? `Shared commentary: ${p.rangeKeys[0]}–${p.rangeKeys[p.rangeKeys.length - 1]}`
              : `Publisher mapping: ${p.key}`}
          </p>
        )}
        <SourceText text={excerpt} language={p.language} />
        {depth === "brief" && (
          <p className="meta-text">
            Opening excerpt from the published passage; no generated summary.
          </p>
        )}
        <SourceLink p={p} />
      </div>
    );
  }
  return (
    <Sheet open={!!id} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="evidence-sheet">
        <SheetHeader>
          <p className="eyebrow">{t.evidence}</p>
          <SheetTitle>{e ? evidenceLabel(e) : t.loading}</SheetTitle>
          <SheetDescription>{t.evidenceNote}</SheetDescription>
        </SheetHeader>
        {!e ? (
          <Load error={error} label={t.loading} />
        ) : (
          <>
            <div className="lens-actions">
              <Button onClick={() => save(e)}>
                <Bookmark />
                {t.save}
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  navigator.clipboard
                    .writeText(
                      evidenceMarkdown(
                        withReadingPreferences(e),
                        translationLang,
                      ),
                    )
                    .then(() => notify(t.copied))
                    .catch(() => notify("Clipboard unavailable"))
                }
              >
                <Copy />
                {t.copy}
              </Button>
              <Button
                variant="ghost"
                aria-label={t.research}
                onClick={() => {
                  research(e.key);
                  onClose();
                }}
              >
                <Search />
              </Button>
            </div>
            <div className="lens-scroll">
              {e.arabic && (
                <div className="arabic lens-arabic" lang="ar" dir="rtl">
                  {e.arabic}
                </div>
              )}
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="lens-tabs">
                  <TabsTrigger value="translation">{t.translation}</TabsTrigger>
                  <TabsTrigger value="explanation">{t.explanation}</TabsTrigger>
                  <TabsTrigger value="context">{t.context}</TabsTrigger>
                  <TabsTrigger value="source">{t.source}</TabsTrigger>
                </TabsList>
                <TabsContent value="translation">
                  {e.verse
                    ? e.verse.translations
                        .filter((p) => p.language === translationLang)
                        .map((p) => (
                          <section className="lens-section" key={p.id}>
                            <SourceText text={p.text} language={p.language} />
                            <SourceLink p={p} />
                            {p.footnotes && (
                              <details>
                                <summary>{t.footnotes}</summary>
                                <SourceText
                                  text={p.footnotes}
                                  language={p.language}
                                />
                              </details>
                            )}
                          </section>
                        ))
                    : [e.passage!, ...e.related]
                        .filter(
                          (p) =>
                            p.language === translationLang ||
                            (p === e.passage &&
                              !e.related.some(
                                (x) => x.language === translationLang,
                              )),
                        )
                        .map((p) => (
                          <section className="lens-section" key={p.id}>
                            {p.language !== translationLang && (
                              <p className="status-note">
                                No {translationLang.toUpperCase()} version is
                                imported for this narration. Showing{" "}
                                {p.language.toUpperCase()}.
                              </p>
                            )}
                            <SourceText text={p.text} language={p.language} />
                            <SourceLink p={p} />
                          </section>
                        ))}
                </TabsContent>
                <TabsContent value="explanation">
                  {e.kind === "quran" ? (
                    <>
                      <div className="explanation-controls">
                        <NativeSelect
                          aria-label="Commentary language"
                          value={tafsirLang}
                          onChange={(ev) => setTafsirLang(ev.target.value)}
                        >
                          <option value="en">English · Ibn Kathir</option>
                          <option value="bn">বাংলা · Al-Mukhtasar</option>
                          <option value="ja">日本語 · Al-Mukhtasar</option>
                          <option value="ar">العربية · Al-Mukhtasar</option>
                        </NativeSelect>
                        <NativeSelect
                          aria-label="Explanation depth"
                          value={depth}
                          onChange={(ev) => setDepth(ev.target.value)}
                        >
                          <option value="brief">{t.brief}</option>
                          <option value="full">{t.full}</option>
                        </NativeSelect>
                        <label className="check-row">
                          <input
                            type="checkbox"
                            checked={compare}
                            onChange={(ev) => setCompare(ev.target.checked)}
                          />
                          {t.compareExplanation}
                        </label>
                      </div>
                      <div className={compare ? "explanation-compare" : ""}>
                        {[...selected, ...comparison].map((p) => published(p))}
                      </div>
                      <p className="status-note">
                        Published interpretations are attributed to their works.
                        Differences have not been independently adjudicated.
                      </p>
                    </>
                  ) : (
                    <>
                      <h3>{t.explanation}</h3>
                      {e.passage?.glossary && e.passage.glossary.length > 0 && (
                        <details>
                          <summary>
                            Published glossary · Arabic · HadeethEnc
                          </summary>
                          <dl lang="ar" dir="rtl">
                            {e.passage.glossary.map((x) => (
                              <div key={x.word}>
                                <dt>{x.word}</dt>
                                <dd>{x.meaning}</dd>
                              </div>
                            ))}
                          </dl>
                        </details>
                      )}
                      {e.passage?.hints && e.passage.hints.length > 0 && (
                        <details className="published-lessons">
                          <summary>
                            Published practical lessons · HadeethEnc
                          </summary>
                          {e.passage.hints.map((hint, i) => (
                            <p key={i}>{hint}</p>
                          ))}
                        </details>
                      )}
                      {[e.passage!, ...e.related]
                        .filter(
                          (p) =>
                            p.language === translationLang ||
                            (p === e.passage &&
                              !e.related.some(
                                (x) => x.language === translationLang,
                              )),
                        )
                        .map((p) => (
                          <div key={p.id}>
                            <SourceText
                              text={
                                p.footnotes ||
                                "No published explanation is available for this record."
                              }
                              language={p.language}
                            />
                            <SourceLink p={p} />
                          </div>
                        ))}
                    </>
                  )}
                </TabsContent>
                <TabsContent value="context">
                  {e.context?.map((v) => (
                    <article
                      className={
                        "context-verse " + (v.key === e.key ? "highlight" : "")
                      }
                      key={v.key}
                    >
                      <p className="meta-text">Quran {v.key}</p>
                      <div className="arabic" lang="ar" dir="rtl">
                        {v.text}
                      </div>
                      <Link href={"/?view=read&verse=" + v.key}>
                        {t.read}
                        <ChevronRight size={14} />
                      </Link>
                    </article>
                  )) || (
                    <div className="lens-section">
                      <h3>{t.sourceDetails}</h3>
                      <p>{e.passage?.reference || e.citation.locator}</p>
                      <a
                        className="source-link"
                        href={e.citation.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t.full}
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="source">
                  <dl className="source-dl">
                    <dt>{t.source}</dt>
                    <dd>{e.passage?.sourceTitle || "Tanzil Quran Text"}</dd>
                    <dt>{t.version}</dt>
                    <dd>{e.citation.edition}</dd>
                    <dt>Citation ID</dt>
                    <dd>{e.citation.id}</dd>
                    <dt>SHA-256</dt>
                    <dd>{e.citation.checksum}</dd>
                    <dt>{t.review}</dt>
                    <dd>{t.unreviewed}</dd>
                    {e.passage?.grade && (
                      <>
                        <dt>Reported grade</dt>
                        <dd>
                          {e.passage.grade}
                          <br />
                          {e.passage.gradeAttribution}
                        </dd>
                      </>
                    )}
                    <dt>Locator</dt>
                    <dd>{e.citation.locator}</dd>
                  </dl>
                  <a
                    className="source-link"
                    href={e.citation.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t.full}
                    <ExternalLink size={14} />
                  </a>
                  <p className="status-note">
                    Citation identity and exact quotation are inspectable. This
                    does not certify an interpretation.
                  </p>
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
