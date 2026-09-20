"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bookmark,
  Trash2,
  Download,
  ArrowUp,
  ArrowUpRight,
  Plus,
  Check,
  Printer,
  Play,
  Copy,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { dictionary } from "@/lib/i18n";
import type { Language } from "@/lib/topics";
import type { SavedEvidence, Talk } from "@/lib/types";
import {
  api,
  SourceText,
  translationFor,
  notebookMarkdown,
  downloadText,
  evidenceMarkdown,
  textOnly,
  evidenceLabel,
} from "./shared";
import type { Check as CitationCheck } from "@/lib/server/checker";
export function Notebook({
  lang,
  items,
  setItems,
  open,
  toTalk,
}: {
  lang: Language;
  items: SavedEvidence[];
  setItems: (items: SavedEvidence[]) => void;
  open: (id: string) => void;
  toTalk: (id?: string) => void;
}) {
  const [activeEditions, setActiveEditions] = useState<Set<string> | null>(
    null,
  );
  useEffect(() => {
    api<{ sources: { editionId: string }[] }>("/api/sources")
      .then((d) =>
        setActiveEditions(new Set(d.sources.map((s) => s.editionId))),
      )
      .catch(() => {});
  }, []);
  const t = dictionary(lang);
  const [filter, setFilter] = useState("all");
  const collections = [
    ...new Set(items.map((x) => x.collection || "My evidence")),
  ];
  function update(id: string, props: Partial<SavedEvidence>) {
    setItems(items.map((x) => (x.id === id ? { ...x, ...props } : x)));
  }
  return (
    <div className="notebook-view">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{t.privacy}</p>
          <h1>{t.notebook}</h1>
        </div>
        <Button
          variant="outline"
          disabled={!items.length}
          onClick={() =>
            downloadText(
              "ayah-atlas-notebook.md",
              notebookMarkdown(items, lang),
            )
          }
        >
          <Download />
          {t.export}
        </Button>
      </div>
      <div className="notebook-toolbar">
        <NativeSelect
          aria-label={t.collection}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">
            {t.showAll} · {items.length}
          </option>
          {collections.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </NativeSelect>
        <Button disabled={!items.length} onClick={() => toTalk()}>
          <FileText />
          {t.talk}
        </Button>
      </div>
      <p className="meta-text">{t.localNote}</p>
      {!items.length ? (
        <div className="empty-card">
          <Bookmark size={38} />
          <h2>{t.noNotes}</h2>
          <p>{t.talkEmpty}</p>
          <Link href="/?view=read">{t.read} ↗</Link>
        </div>
      ) : (
        <div className="notebook-items">
          {items
            .filter((x) => filter === "all" || x.collection === filter)
            .map((item, index) => {
              const e = item.evidence;
              const tr = translationFor(e, lang);
              return (
                <article className="notebook-card" key={item.id}>
                  <div className="notebook-evidence">
                    {activeEditions &&
                      !activeEditions.has(e.citation.edition) && (
                        <p className="status-note">
                          This saved quotation uses an older edition. Its text
                          and citation are preserved; open Sources to inspect
                          the current edition.
                        </p>
                      )}
                    <div className="result-top">
                      <span className="kind-label">{e.kind}</span>
                      <span className="meta-text">
                        {new Date(item.savedAt).toLocaleDateString(lang)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t.order}
                        disabled={index === 0}
                        onClick={() => {
                          const copy = [...items];
                          const i = copy.findIndex((x) => x.id === item.id);
                          [copy[i - 1], copy[i]] = [copy[i], copy[i - 1]];
                          setItems(copy);
                        }}
                      >
                        <ArrowUp />
                      </Button>
                    </div>
                    <h2>
                      <button onClick={() => open(e.id)}>
                        {evidenceLabel(e)}
                        <ArrowUpRight size={17} />
                      </button>
                    </h2>
                    {e.arabic && (
                      <div className="arabic" lang="ar" dir="rtl">
                        {e.arabic}
                      </div>
                    )}
                    <div className="notebook-quote">
                      <SourceText
                        text={tr?.text || e.passage?.text || ""}
                        language={tr?.language || e.passage?.language}
                      />
                    </div>
                    <p className="meta-text">
                      {tr?.sourceTitle || e.passage?.sourceTitle} ·{" "}
                      {tr?.version || e.passage?.version}
                    </p>
                    <Button variant="ghost" onClick={() => toTalk(item.id)}>
                      <Plus />
                      {t.addToTalk}
                    </Button>
                  </div>
                  <div className="notebook-note">
                    <label>
                      {t.collection}
                      <Input
                        value={item.collection}
                        onChange={(ev) =>
                          update(item.id, { collection: ev.target.value })
                        }
                        maxLength={100}
                      />
                    </label>
                    <label>
                      {t.note}
                      <Textarea
                        value={item.note}
                        placeholder={t.personal}
                        onChange={(ev) =>
                          update(item.id, { note: ev.target.value })
                        }
                        maxLength={10000}
                      />
                    </label>
                    <div className="notebook-note-footer">
                      <span>{t.privacy}</span>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t.delete}
                          >
                            <Trash2 />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {t.remove} {e.key}?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {t.note} + {t.source}. Export your notebook first
                              if needed.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                setItems(items.filter((x) => x.id !== item.id))
                              }
                            >
                              {t.delete}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </article>
              );
            })}
        </div>
      )}
    </div>
  );
}
const defaults = {
  en: {
    intro: "Introduction",
    themes: "Main themes",
    evidence: "Read the evidence in context",
    reflections: "Personal reflections and practical conclusions",
    refs: "References",
    draft:
      "This is an editable connective draft, not a religious source. Introduce the question in your own words. Read the cited passages below, explain only what the sources support, and distinguish your personal reflections from quotations.",
  },
  bn: {
    intro: "ভূমিকা",
    themes: "মূল বিষয়সমূহ",
    evidence: "প্রসঙ্গসহ প্রমাণ পাঠ",
    reflections: "ব্যক্তিগত ভাবনা ও ব্যবহারিক উপসংহার",
    refs: "সূত্রসমূহ",
    draft:
      "এটি সম্পাদনাযোগ্য বক্তব্যের খসড়া, ধর্মীয় উৎস নয়। নিজের ভাষায় বিষয়টি তুলে ধরুন। সূত্রযুক্ত অংশ পড়ুন, উৎসসমর্থিত বিষয় ব্যাখ্যা করুন এবং ব্যক্তিগত ভাবনাকে উদ্ধৃতি থেকে আলাদা রাখুন।",
  },
  ja: {
    intro: "導入",
    themes: "主なテーマ",
    evidence: "文脈とともに根拠を読む",
    reflections: "個人的な考察と実践的な結び",
    refs: "参考文献",
    draft:
      "これは編集可能なつなぎの文章の下書きであり、宗教的な出典ではありません。問いを自分の言葉で紹介し、引用を文脈とともに読み、出典が裏付ける内容だけを説明してください。個人的な考察は引用と区別します。",
  },
};
export function TalkStudio({
  lang,
  items,
  talk,
  setTalk,
  open,
  notify,
}: {
  lang: Language;
  items: SavedEvidence[];
  talk: Talk;
  setTalk: (t: Talk) => void;
  open: (id: string) => void;
  notify: (s: string) => void;
}) {
  const t = dictionary(lang);
  const [checks, setChecks] = useState<{
    checks: CitationCheck[];
    exact: number;
    unresolved: number;
    disclaimer: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [rehearse, setRehearse] = useState(false);
  const [font, setFont] = useState(22);
  const selected = items.filter((x) => talk.evidenceIds.includes(x.id));
  const u = (x: Partial<Talk>) => {
    setTalk({ ...talk, ...x, updated: new Date().toISOString() });
    setChecks(null);
  };
  function build() {
    const d = defaults[talk.language];
    u({
      outline: `1. ${d.intro}\n2. ${d.themes}\n${selected.map((x, i) => `   ${i + 1}. ${evidenceLabel(x.evidence)}`).join("\n")}\n3. ${d.evidence}\n4. ${d.reflections}\n5. ${d.refs}`,
      draft: d.draft,
    });
  }
  const md = () =>
    `# ${talk.title || "Untitled talk"}\n\nAudience: ${talk.audience}\nApproximate length: ${talk.minutes} minutes\nLanguage: ${talk.language}\n\n## Outline\n${talk.outline}\n\n## Connective draft / personal wording\n${talk.draft}\n\n## Published evidence\n${selected.map((x, i) => evidenceMarkdown(x.evidence, talk.language, i + 1)).join("\n---\n\n")}\n\nReview: exact source records preserved; no scholarly approval claimed.\n`;
  async function check() {
    setBusy(true);
    setError("");
    try {
      const quotations = selected.map((x) => {
        const e = x.evidence;
        const p = translationFor(e, talk.language);
        return {
          id: p?.id || e.id,
          text: textOnly(p?.text || e.verse?.text || e.passage?.text || ""),
        };
      });
      setChecks(await api("/api/check", { draft: talk.draft, quotations }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={"talk-view " + (rehearse ? "rehearsing" : "")}>
      <div className="page-heading no-print">
        <div>
          <p className="eyebrow">
            {t.privacy} · {t.evidence}
          </p>
          <h1>{t.talk}</h1>
        </div>
        <Button variant="outline" onClick={() => setRehearse((v) => !v)}>
          <Play />
          {rehearse ? t.close : t.rehearse}
        </Button>
      </div>
      {!rehearse && (
        <>
          <div className="talk-settings no-print">
            <label>
              {t.title}
              <Input
                value={talk.title}
                onChange={(e) => u({ title: e.target.value })}
                maxLength={200}
              />
            </label>
            <label>
              {lang === "bn"
                ? "বক্তৃতার ভাষা"
                : lang === "ja"
                  ? "講話の言語"
                  : "Talk language"}
              <NativeSelect
                value={talk.language}
                onChange={(e) => u({ language: e.target.value as Language })}
              >
                <option value="en">English</option>
                <option value="bn">বাংলা</option>
                <option value="ja">日本語</option>
              </NativeSelect>
            </label>
            <label>
              {t.audience}
              <Input
                value={talk.audience}
                onChange={(e) => u({ audience: e.target.value })}
                maxLength={200}
              />
            </label>
            <label>
              {t.minutesLabel}
              <Input
                type="number"
                min="3"
                max="120"
                value={talk.minutes}
                onChange={(e) =>
                  u({ minutes: Math.max(3, Math.min(120, +e.target.value)) })
                }
              />
            </label>
          </div>
          <div className="talk-layout">
            <aside className="talk-evidence-picker no-print">
              <h2>{t.evidence}</h2>
              <p>{t.evidenceNote}</p>
              {items.length ? (
                items.map((x) => (
                  <label className="talk-pick" key={x.id}>
                    <input
                      type="checkbox"
                      checked={talk.evidenceIds.includes(x.id)}
                      onChange={() =>
                        u({
                          evidenceIds: talk.evidenceIds.includes(x.id)
                            ? talk.evidenceIds.filter((id) => id !== x.id)
                            : [...talk.evidenceIds, x.id],
                        })
                      }
                    />
                    <span>
                      {evidenceLabel(x.evidence)}
                      <small>
                        {x.evidence.passage?.sourceTitle ||
                          "Tanzil + published translations"}
                      </small>
                    </span>
                  </label>
                ))
              ) : (
                <p className="status-note">{t.talkEmpty}</p>
              )}
              <Button onClick={build} disabled={!selected.length}>
                <Plus />
                {t.newTalk}
              </Button>
            </aside>
            <div className="talk-editor">
              <label className="no-print">
                {t.outline}
                <Textarea
                  value={talk.outline}
                  onChange={(e) => u({ outline: e.target.value })}
                  placeholder={t.newTalk}
                  maxLength={10000}
                />
              </label>
              <label className="no-print">
                {t.draft}
                <Textarea
                  className="draft-textarea"
                  value={talk.draft}
                  onChange={(e) => u({ draft: e.target.value })}
                  maxLength={20000}
                  placeholder={defaults[talk.language].draft}
                />
              </label>
              <p className="editor-note no-print">
                {t.personal} · {t.noClaim}
              </p>
            </div>
          </div>
        </>
      )}
      {rehearse && (
        <label className="rehearsal-size no-print">
          Text size
          <input
            type="range"
            min="18"
            max="36"
            value={font}
            onChange={(e) => setFont(+e.target.value)}
          />
        </label>
      )}
      <article
        className="talk-print"
        style={{ fontSize: rehearse ? font : undefined }}
      >
        <h1>{talk.title || t.talk}</h1>
        <p className="meta-text">
          {talk.audience} · {talk.minutes} {t.minutes}
        </p>
        <div className="talk-prose">{talk.draft}</div>
        <div className="talk-citations">
          {selected.map((item, i) => {
            const e = item.evidence;
            const tr = translationFor(e, talk.language);
            return (
              <section className="talk-quotation" key={item.id}>
                <div className="talk-citation-head">
                  <h2>
                    [{i + 1}] {evidenceLabel(e)}
                  </h2>
                  <Button
                    className="no-print"
                    variant="ghost"
                    onClick={() => open(e.id)}
                  >
                    {t.open}
                    <ArrowUpRight />
                  </Button>
                </div>
                {e.arabic && (
                  <div className="arabic" lang="ar" dir="rtl">
                    {e.arabic}
                  </div>
                )}
                <SourceText
                  text={tr?.text || e.passage?.text || ""}
                  language={tr?.language || e.passage?.language}
                />
                <p className="citation-attribution">
                  {tr?.sourceTitle || e.passage?.sourceTitle} ·{" "}
                  {tr?.author || e.passage?.author} · v
                  {tr?.version || e.passage?.version}
                  <br />
                  <a href={tr?.url || e.citation.url}>
                    {tr?.url || e.citation.url}
                  </a>
                </p>
                {tr?.footnotes && (
                  <details className="print-footnotes">
                    <summary>{t.footnotes}</summary>
                    <SourceText text={tr.footnotes} language={tr.language} />
                  </details>
                )}
                {e.passage?.grade && (
                  <p>
                    Reported grade: {e.passage.grade} —{" "}
                    {e.passage.gradeAttribution}
                  </p>
                )}
                <p className="citation-id">
                  {e.citation.id}
                  {tr && (
                    <>
                      <br />
                      {tr.id} · SHA-256 {tr.checksum}
                    </>
                  )}
                </p>
              </section>
            );
          })}
        </div>
      </article>
      <div className="talk-bottom-actions no-print">
        <Button
          onClick={check}
          disabled={busy || (!talk.draft && !selected.length)}
        >
          <Check />
          {busy ? t.loading : t.check}
        </Button>
        <Button
          variant="outline"
          onClick={() => downloadText("ayah-atlas-talk.md", md())}
        >
          <Download />
          {t.export}
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer />
          {t.print}
        </Button>
        <Button
          variant="ghost"
          onClick={() =>
            navigator.clipboard
              .writeText(md())
              .then(() => notify(t.copied))
              .catch(() => notify("Clipboard unavailable"))
          }
        >
          <Copy />
          {t.copy}
        </Button>
      </div>
      <p className="meta-text no-print">{t.checkNote}</p>
      {error && <p role="alert">{error}</p>}
      {checks && (
        <section className="citation-checks no-print">
          <h2>
            {t.check} · {checks.exact} exact · {checks.unresolved} unresolved
          </h2>
          {checks.checks.map((c, i) => (
            <article
              key={i}
              className={
                c.status === "exact match" ? "check-pass" : "check-review"
              }
            >
              <span>{c.status}</span>
              <p>{c.input}</p>
              <small>{c.detail}</small>
              {c.evidenceId && (
                <Button variant="ghost" onClick={() => open(c.evidenceId!)}>
                  {t.open}
                  <ArrowUpRight />
                </Button>
              )}
            </article>
          ))}
          {!checks.checks.length && <p>{t.insufficient}</p>}
          <p>{checks.disclaimer}</p>
        </section>
      )}
    </div>
  );
}
