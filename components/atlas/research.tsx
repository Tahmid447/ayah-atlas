"use client";
import { useEffect, useState } from "react";
import {
  Search,
  ArrowUpRight,
  BookOpen,
  Bookmark,
  ArrowRight,
  Layers,
  Network,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { topics, type Language } from "@/lib/topics";
import type { Research } from "@/lib/types";
import { dictionary } from "@/lib/i18n";
import { api, Load, SourceText, textOnly } from "./shared";
export function ResearchView({
  lang,
  query,
  onQuery,
  open,
  save,
}: {
  lang: Language;
  query: string;
  onQuery: (s: string) => void;
  open: (id: string) => void;
  save: (id: string) => void;
}) {
  const t = dictionary(lang);
  const [input, setInput] = useState(query);
  const [data, setData] = useState<Research | null>(null);
  const [error, setError] = useState("");
  const [finished, setFinished] = useState("");
  const [kind, setKind] = useState("all");
  const [language, setLanguage] = useState("all");
  const [page, setPage] = useState(1);
  useEffect(() => {
    if (!query) return;
    let live = true;
    api<Research>(
      "/api/search?q=" +
        encodeURIComponent(query) +
        "&page=" +
        page +
        "&kind=" +
        kind +
        "&language=" +
        language,
    )
      .then((d) => {
        if (live) {
          setData(d);
          setError("");
        }
      })
      .catch((e) => live && setError(e.message))
      .finally(
        () =>
          live && setFinished(query + "|" + kind + "|" + language + "|" + page),
      );
    return () => {
      live = false;
    };
  }, [query, kind, language, page]);
  const loading = finished !== query + "|" + kind + "|" + language + "|" + page;
  const matched = topics.filter((x) => data?.topics.includes(x.id));
  return (
    <div className="research-view">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{t.queryScope}</p>
          <h1>{t.research}</h1>
        </div>
        <span className="scope-badge">
          <BookOpen size={16} />
          6,236 ayat
        </span>
      </div>
      <form
        className="research-search"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          onQuery(input.trim());
        }}
      >
        <Search size={23} />
        <Input
          aria-label={t.searchPrompt}
          placeholder={t.searchPrompt}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={400}
        />
        <Button type="submit" disabled={!input.trim()}>
          {t.search}
          <ArrowRight />
        </Button>
      </form>
      <div className="suggestions">
        {["backbiting", "hypocrisy", "patience", "musa"].map((id) => {
          const x = topics.find((y) => y.id === id)!;
          return (
            <button key={id} onClick={() => onQuery(x.labels[lang])}>
              {x.labels[lang]}
              <ArrowUpRight size={13} />
            </button>
          );
        })}
      </div>
      {!query ? (
        <div className="research-intro">
          <div className="large-line-icon">
            <Layers />
          </div>
          <h2>
            {lang === "bn"
              ? "একটি প্রশ্ন থেকে তার উৎসে"
              : lang === "ja"
                ? "問いから、その根拠へ"
                : "Follow a question to its sources"}
          </h2>
          <p>
            {lang === "bn"
              ? "আয়াত, প্রকাশিত তাফসীর ও হাদিস খুঁজুন। প্রতিটি উৎস দেখে আপনার নোটবুকে সংরক্ষণ করুন।"
              : lang === "ja"
                ? "節、公開された注釈、ハディースを検索し、文脈を確認してノートに保存できます。"
                : "Search across Quran translations, published tafsir, and the imported hadith collection. Open the passage, inspect its context, and keep the evidence that matters."}
          </p>
          <div className="research-example">
            <p>
              {lang === "bn"
                ? "গীবত ও পরনিন্দা নিয়ে বক্তৃতার জন্য কুরআন ও হাদিসের সূত্র খুঁজুন।"
                : lang === "ja"
                  ? "陰口や噂話についての講話のために、クルアーンとハディースの出典を探してください。"
                  : "I am preparing a talk about gossip and backbiting. Find Quran passages, hadith, and accessible explanations."}
            </p>
            <Button
              variant="ghost"
              onClick={() =>
                onQuery(
                  lang === "bn"
                    ? "গীবত ও চোগলখুরি"
                    : lang === "ja"
                      ? "陰口と噂話"
                      : "gossip and backbiting",
                )
              }
            >
              {t.find}
              <ArrowRight />
            </Button>
          </div>
        </div>
      ) : (
        <>
          {matched.length > 0 && (
            <section className="query-orientation">
              <p className="eyebrow">{t.related}</p>
              <div className="concept-chips">
                {matched.map((x) => (
                  <span key={x.id}>{x.labels[lang]}</span>
                ))}
              </div>
              <p>
                {!matched.some((x) =>
                  ["backbiting", "gossip", "slander"].includes(x.id),
                )
                  ? lang === "bn"
                    ? "এই ধারণাগুলো অনুসন্ধান প্রসারিত করে; ফলাফলের প্রসঙ্গ যাচাই করুন।"
                    : lang === "ja"
                      ? "これらの概念で検索を広げます。結果の文脈を確認してください。"
                      : "These editorial topic aliases expand the search. Inspect each result in its original context."
                  : lang === "bn"
                    ? "এগুলো অনুসন্ধানের জন্য আলাদা ধারণা। গীবত, অপবাদ ও চোগলখুরিকে একই অর্থে ব্যবহার করা হয়নি।"
                    : lang === "ja"
                      ? "これらは検索を助ける別々の概念です。陰口、中傷、告げ口を同じ意味として扱いません。"
                      : "These concepts guide retrieval separately. Backbiting, false accusations, and carrying tales are not treated as interchangeable."}
              </p>
              {matched.some((x) => x.id === "hypocrisy") && (
                <p className="status-note">
                  Traits in general texts do not justify declaring a named
                  living person a hypocrite.
                </p>
              )}
            </section>
          )}
          <div className="result-toolbar">
            <Tabs
              value={kind}
              onValueChange={(v) => {
                setKind(v);
                setPage(1);
              }}
            >
              <TabsList className="result-tabs">
                <TabsTrigger value="all">{t.all}</TabsTrigger>
                {(["quran", "tafsir", "hadith"] as const).map((k) => (
                  <TabsTrigger key={k} value={k}>
                    {t[k]} <span>{data?.counts[k] ?? ""}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <NativeSelect
              aria-label="Result language"
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">EN · বাংলা · 日本語 · العربية</option>
              <option value="en">English</option>
              <option value="bn">বাংলা</option>
              <option value="ja">日本語</option>
            </NativeSelect>
          </div>
          {loading ? (
            <Load label={t.loading} />
          ) : error ? (
            <Load error={error} retry={() => setPage((p) => p)} />
          ) : (
            data && (
              <>
                <p className="results-count">
                  {data.total} {t.results} · {t.queryScope}
                </p>
                <div className="research-results">
                  {data.results.length ? (
                    data.results.map((r) => (
                      <article key={r.id} className="result-card">
                        <div className="result-top">
                          <span className={"kind-label " + r.kind}>
                            {r.kind === "quran"
                              ? t.quran
                              : r.kind === "tafsir"
                                ? t.tafsir
                                : t.hadith}
                          </span>
                          <span className="meta-text">
                            {r.language.toUpperCase()}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`${t.save} ${r.title}`}
                            onClick={() => save(r.id)}
                          >
                            <Bookmark />
                          </Button>
                        </div>
                        <h2>
                          <button onClick={() => open(r.id)}>
                            {r.title}
                            <ArrowUpRight size={18} />
                          </button>
                        </h2>
                        <div className="result-excerpt">
                          <SourceText
                            text={
                              textOnly(r.text).length > 480
                                ? textOnly(r.text).slice(0, 480) + "…"
                                : r.text
                            }
                            language={r.language}
                          />
                        </div>
                        <p className="result-source">
                          {r.sourceTitle}
                          {r.grade && " · " + r.grade + " (publisher)"}
                        </p>
                        <div className="result-bottom">
                          <details>
                            <summary>{t.why}</summary>
                            <p>{r.relevance}</p>
                          </details>
                          <Button variant="ghost" onClick={() => open(r.id)}>
                            {t.open}
                            <ArrowRight />
                          </Button>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="empty-card">{t.empty}</div>
                  )}
                </div>
                <div className="page-pagination">
                  <Button
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage((v) => v - 1)}
                  >
                    {t.previous}
                  </Button>
                  <span>
                    {page} /{" "}
                    {Math.max(1, Math.ceil(data.total / data.pageSize))}
                  </span>
                  <Button
                    variant="outline"
                    disabled={page * data.pageSize >= data.total}
                    onClick={() => setPage((v) => v + 1)}
                  >
                    {t.next}
                  </Button>
                </div>
                <details className="corpus-disclosure">
                  <summary>
                    {t.coverage} · {data.coverage.editions} editions ·{" "}
                    {data.coverage.hadith} hadith records
                  </summary>
                  <p>{data.scope}</p>
                  <ul>
                    {data.limitations.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                  <p>Expansion terms: {data.terms.join(" · ")}</p>
                </details>
              </>
            )
          )}
        </>
      )}
    </div>
  );
}
export function TopicsView({
  lang,
  research,
}: {
  lang: Language;
  research: (q: string) => void;
}) {
  const t = dictionary(lang);
  const [group, setGroup] = useState("all");
  const [map, setMap] = useState(false);
  const groups = [...new Set(topics.map((x) => x.group))];
  return (
    <div className="topics-view">
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            {t.quran} · {t.tafsir} · {t.hadith}
          </p>
          <h1>{t.topics}</h1>
        </div>
        <Button variant="outline" onClick={() => setMap((v) => !v)}>
          <Network />
          {map ? "List" : "Connections"}
        </Button>
      </div>
      <div className="topic-filter">
        <NativeSelect
          aria-label="Topic category"
          value={group}
          onChange={(e) => setGroup(e.target.value)}
        >
          <option value="all">{t.showAll}</option>
          {groups.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </NativeSelect>
        <p>{t.noClaim}</p>
      </div>
      <div className={map ? "topic-grid connection-list" : "topic-grid"}>
        {topics
          .filter((x) => group === "all" || x.group === group)
          .map((x, i) => (
            <article key={x.id} className="topic-card">
              <div className="topic-number">
                {String(i + 1).padStart(2, "0")}
              </div>
              <p className="eyebrow">
                {x.group === "Prophetic stories" ? t.stories : x.group}
              </p>
              <h2>{x.labels[lang]}</h2>
              <p className="topic-aliases">
                {x.aliases.slice(1, 4).join(" · ")}
              </p>
              {map && (
                <div className="topic-connections">
                  {x.related.map((id) => (
                    <button
                      key={id}
                      onClick={() =>
                        research(topics.find((z) => z.id === id)!.labels[lang])
                      }
                    >
                      ↳ {topics.find((z) => z.id === id)!.labels[lang]}
                    </button>
                  ))}
                  <small>
                    Editorial navigation links · thematic, not equivalence
                  </small>
                </div>
              )}
              {x.group === "Prophetic stories" && (
                <p className="story-note">{t.storyNote}</p>
              )}
              <Button variant="ghost" onClick={() => research(x.labels[lang])}>
                {t.find}
                <ArrowRight />
              </Button>
            </article>
          ))}
      </div>
    </div>
  );
}
