"use client";
/* Original GIFs intentionally bypass image transforms to preserve the supplied source. */
import { AnnotatedPage } from "./annotations";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Search,
  SlidersHorizontal,
  BookOpen,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { dictionary } from "@/lib/i18n";
import type { Language } from "@/lib/topics";
import type { Chapter, Verse } from "@/lib/types";
import surahs from "@/data/surahs.json";
import { api, Load, SourceText, SourceLink, useLocal } from "./shared";
export type ReaderProps = {
  lang: Language;
  position: string;
  setPosition: (key: string) => void;
  open: (id: string, tab?: string) => void;
  save: (id: string) => void;
  research: (q: string) => void;
  bookmarks: string[];
  toggleBookmark: (k: string) => void;
  languages: Language[];
  setLanguages: React.Dispatch<React.SetStateAction<Language[]>>;
};
export function Reader({
  lang,
  position,
  setPosition,
  open,
  save,
  research,
  bookmarks,
  toggleBookmark,
  languages,
  setLanguages,
}: ReaderProps) {
  const t = dictionary(lang);
  const [s, a] = position.split(":").map(Number);
  const [data, setData] = useState<Chapter | null>(null);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [mode, setMode] = useLocal("atlas.readMode", "page");
  const [editions, setEditions] = useLocal("atlas.editions", {
    en: "english_rwwad",
    bn: "bengali_zakaria",
    ja: "japanese_saeedsato",
  });
  const [size, setSize] = useLocal("atlas.arabicSize", 32);
  const [spacing, setSpacing] = useLocal("atlas.lineSpacing", 2.25);
  const [imageIndex, setImageIndex] = useLocal("atlas.pageImage", 2);
  const [surahQuery, setSurahQuery] = useState("");
  const [pageZoom, setPageZoom] = useState(false);
  useEffect(() => {
    let live = true;
    api<Chapter>("/api/chapter/" + s)
      .then((d) => {
        if (live) {
          setData(d);
          setError("");
        }
      })
      .catch((e) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [s, reload]);
  const selected = data?.verses.find((v) => v.ayah === a);
  const translated = (v: Verse) =>
    languages
      .map((l) => v.translations.find((p) => p.sourceId === editions[l]))
      .filter((p) => !!p);
  const sections = data?.pages || [];
  const section =
    sections.find((x) => a >= x.start_ayah && a <= x.end_ayah) || sections[0];
  const images: string[] = section
    ? JSON.parse(section.images)
    : s === 68
      ? ["/reference/p566.gif"]
      : [];
  const currentImage = images[Math.min(imageIndex, images.length - 1)];
  const start = Math.floor((a - 1) / 12) * 12;
  const visible = data?.verses.slice(start, start + 12) || [];
  function movePage(direction: number) {
    const index = sections.findIndex((x) => x.id === section?.id);
    if (
      direction > 0 &&
      imageIndex >= images.length - 1 &&
      index < sections.length - 1
    ) {
      setAyah(sections[index + 1].start_ayah);
      setImageIndex(0);
    } else if (direction < 0 && imageIndex <= 0 && index > 0) {
      setAyah(sections[index - 1].start_ayah);
      setImageIndex(JSON.parse(sections[index - 1].images).length - 1);
    } else
      setImageIndex((v) =>
        Math.max(0, Math.min(images.length - 1, v + direction)),
      );
  }
  function goSurah(n: number) {
    setImageIndex(0);
    setPosition(n + ":1");
  }
  function setAyah(n: number) {
    setPosition(s + ":" + n);
  }
  return (
    <div className="reader-view">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{t.library}</p>
          <h1>
            {t.read}{" "}
            <span className="heading-ar" lang="ar" dir="rtl">
              القرآن الكريم
            </span>
          </h1>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <SlidersHorizontal />
              {t.settings}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="settings-popover" align="end">
            <h3>{t.settings}</h3>
            <label>
              {t.fontSize}
              <input
                aria-label={t.fontSize}
                type="range"
                min="24"
                max="54"
                value={size}
                onChange={(e) => setSize(+e.target.value)}
              />
            </label>
            <label>
              {t.lineHeight}
              <input
                aria-label={t.lineHeight}
                type="range"
                min="1.8"
                max="3"
                step="0.1"
                value={spacing}
                onChange={(e) => setSpacing(+e.target.value)}
              />
            </label>
            <p>{t.translations}</p>
            {(["en", "bn", "ja"] as Language[]).map((l) => (
              <label className="check-row" key={l}>
                <input
                  type="checkbox"
                  checked={languages.includes(l)}
                  onChange={() =>
                    setLanguages((v) =>
                      v.includes(l)
                        ? v.length > 1
                          ? v.filter((x) => x !== l)
                          : v
                        : [...v, l],
                    )
                  }
                />
                {{ en: "English", bn: "বাংলা", ja: "日本語" }[l]}
              </label>
            ))}
            {languages.includes("en") && (
              <NativeSelect
                aria-label="English edition"
                value={editions.en}
                onChange={(e) =>
                  setEditions({ ...editions, en: e.target.value })
                }
              >
                <option value="english_rwwad">Rowwad · v1.0.19</option>
                <option value="english_saheeh">
                  Noor International · v1.1.2
                </option>
              </NativeSelect>
            )}
            {languages.includes("bn") && (
              <NativeSelect
                aria-label="Bengali edition"
                value={editions.bn}
                onChange={(e) =>
                  setEditions({ ...editions, bn: e.target.value })
                }
              >
                <option value="bengali_zakaria">
                  Abu Bakr Zakaria · v1.1.1
                </option>
                <option value="bengali_rwwad">Rowwad · v1.1.2</option>
              </NativeSelect>
            )}
          </PopoverContent>
        </Popover>
      </div>
      <div className="reader-toolbar">
        <div className="chapter-select">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <BookOpen />
                {data?.surah.name || surahs.find((x) => x.id === s)?.name}
                <ChevronRight size={14} />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="surah-popover">
              <Input
                aria-label={t.searchSurah}
                placeholder={t.searchSurah}
                value={surahQuery}
                onChange={(e) => setSurahQuery(e.target.value)}
              />
              <div className="surah-list">
                {surahs
                  .filter((x) =>
                    (x.id + " " + x.name + " " + x.arabic + " " + x.meaning)
                      .toLowerCase()
                      .includes(surahQuery.toLowerCase()),
                  )
                  .map((x) => (
                    <Button
                      className="surah-option"
                      variant={x.id === s ? "secondary" : "ghost"}
                      key={x.id}
                      onClick={() => goSurah(x.id)}
                    >
                      <span>{x.id.toString().padStart(2, "0")}</span>
                      <span>
                        {x.name}
                        <small>{x.count} ayat</small>
                      </span>
                      <span lang="ar">{x.arabic}</span>
                    </Button>
                  ))}
              </div>
            </PopoverContent>
          </Popover>
          <NativeSelect
            aria-label={t.ayah}
            value={a}
            onChange={(e) => setAyah(+e.target.value)}
          >
            {Array.from(
              { length: surahs.find((x) => x.id === s)?.count || 1 },
              (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {t.ayah} {i + 1}
                </option>
              ),
            )}
          </NativeSelect>
          <NativeSelect
            aria-label={t.juz}
            value={selected?.juz || 29}
            onChange={(e) => {
              api<{ key: string }[]>("/api/juz-starts")
                .then((list) => {
                  const x = list[+e.target.value - 1];
                  if (x) {
                    setPosition(x.key);
                    setImageIndex(0);
                  }
                })
                .catch(() => {});
            }}
          >
            {Array.from({ length: 30 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {t.juz} {i + 1}
              </option>
            ))}
          </NativeSelect>
        </div>
        <Tabs
          value={mode}
          onValueChange={(v) => {
            setMode(v);
            setPageZoom(false);
          }}
        >
          <TabsList className="mode-tabs">
            <TabsTrigger value="page">{t.page}</TabsTrigger>
            <TabsTrigger value="study">{t.study}</TabsTrigger>
            <TabsTrigger value="continuous">{t.continuous}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {!data || data.surah.id !== s ? (
        <Load
          error={error}
          retry={() => setReload((v) => v + 1)}
          label={t.loading}
        />
      ) : (
        <div className={"reading-layout " + (pageZoom ? "page-expanded" : "")}>
          <div className="reading-main">
            <div className="chapter-heading">
              <div>
                <span className="chapter-number">
                  {s.toString().padStart(2, "0")}
                </span>
                <div>
                  <h2>{data.surah.name}</h2>
                  <p>
                    {data.surah.meaning}{" "}
                    <span>
                      · {data.surah.count} ayat · {data.surah.revelation}
                    </span>
                  </p>
                </div>
              </div>
              <span className="surah-arabic" lang="ar" dir="rtl">
                {data.surah.arabic}
              </span>
            </div>
            {mode === "page" ? (
              <>
                <div className="raster-tools">
                  <span>
                    <span className="small-diamond">◇</span>
                    {t.rasterFaithful}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Expand page"
                    onClick={() => setPageZoom((v) => !v)}
                  >
                    <Maximize2 />
                  </Button>
                </div>
                {currentImage ? (
                  <div
                    className={
                      "manuscript " + (pageZoom ? "manuscript-zoom" : "")
                    }
                  >
                    <AnnotatedPage
                      src={currentImage}
                      alt={`${data.surah.name}: original printed Quran page. ${section?.section || "68:7–31"}. Select an ayah in the toolbar for accessible Unicode and translations.`}
                    />
                  </div>
                ) : (
                  <div className="empty-card">
                    Original pages are not imported for this section.{" "}
                    <Button onClick={() => setMode("study")}>{t.study}</Button>
                  </div>
                )}
                <div className="page-pagination">
                  <Button
                    variant="ghost"
                    disabled={imageIndex <= 0 && section === sections[0]}
                    onClick={() => movePage(-1)}
                  >
                    <ChevronLeft />
                    {t.previous}
                  </Button>
                  <span>
                    {Math.min(imageIndex + 1, images.length)} / {images.length}{" "}
                    · {section?.section}
                  </span>
                  <Button
                    variant="ghost"
                    disabled={
                      imageIndex >= images.length - 1 &&
                      section === sections[sections.length - 1]
                    }
                    onClick={() => movePage(1)}
                  >
                    {t.next}
                    <ChevronRight />
                  </Button>
                </div>
                <p className="renderer-note">
                  Original images:{" "}
                  <a
                    href={
                      section?.source_url ||
                      "https://www.equraninstitute.com/quranreading/068_alqalam_565_568.htm"
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    eQuran Institute ↗
                  </a>
                </p>
              </>
            ) : (
              <>
                <p className="renderer-note">
                  {t.arabicFallback} ·{" "}
                  <Link href="/?view=typography">{t.typography}</Link>
                </p>
                {mode === "continuous" ? (
                  <div
                    className="continuous-text"
                    lang="ar"
                    dir="rtl"
                    style={{ fontSize: size, lineHeight: spacing }}
                  >
                    {visible.map((v) => (
                      <button
                        key={v.key}
                        onClick={() => {
                          setAyah(v.ayah);
                          open("q:" + v.key);
                        }}
                      >
                        {v.text}
                        <span className="verse-marker">
                          {v.ayah.toLocaleString("ar")}
                        </span>{" "}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="verse-list">
                    {visible.map((v) => (
                      <article
                        className={"verse " + (v.ayah === a ? "selected" : "")}
                        key={v.key}
                        id={"v-" + v.key}
                      >
                        <div className="verse-meta">
                          <button
                            className="verse-key"
                            onClick={() => setAyah(v.ayah)}
                          >
                            {v.key}
                          </button>
                          <div>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`${t.bookmark} ${v.key}`}
                              onClick={() => toggleBookmark(v.key)}
                            >
                              <Bookmark
                                fill={
                                  bookmarks.includes(v.key)
                                    ? "currentColor"
                                    : "none"
                                }
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`${t.open} ${v.key}`}
                              onClick={() => {
                                setAyah(v.ayah);
                                open("q:" + v.key);
                              }}
                            >
                              <ArrowUpRight />
                            </Button>
                          </div>
                        </div>
                        <button
                          className="arabic verse-arabic"
                          lang="ar"
                          dir="rtl"
                          style={{ fontSize: size, lineHeight: spacing }}
                          onClick={() => {
                            setAyah(v.ayah);
                            open("q:" + v.key);
                          }}
                        >
                          {v.text}
                          <span className="verse-marker">
                            {v.ayah.toLocaleString("ar")}
                          </span>
                        </button>
                        <div
                          className={
                            "translation-grid count-" + languages.length
                          }
                        >
                          {translated(v).map((p) => (
                            <div key={p.id}>
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
                            </div>
                          ))}
                        </div>
                        <div className="verse-actions">
                          <Button
                            variant="ghost"
                            onClick={() => open("q:" + v.key, "explanation")}
                          >
                            {t.explanation}
                            <ArrowUpRight />
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => save("q:" + v.key)}
                          >
                            {t.save}
                          </Button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
                <div className="page-pagination">
                  <Button
                    variant="outline"
                    disabled={start === 0}
                    onClick={() => setAyah(Math.max(1, start - 11))}
                  >
                    <ChevronLeft />
                    {t.previous}
                  </Button>
                  <span>
                    {start + 1}–{Math.min(start + 12, data.surah.count)} /{" "}
                    {data.surah.count}
                  </span>
                  <Button
                    variant="outline"
                    disabled={start + 12 >= data.surah.count}
                    onClick={() => setAyah(start + 13)}
                  >
                    {t.next}
                    <ChevronRight />
                  </Button>
                </div>
              </>
            )}
            <div className="chapter-pagination">
              <Button
                variant="ghost"
                disabled={s === 1}
                onClick={() => goSurah(s - 1)}
              >
                <ChevronLeft />
                {t.surah} {s - 1}
              </Button>
              <a href="https://tanzil.net" target="_blank" rel="noreferrer">
                Tanzil Quran Text · v1.1
              </a>
              <Button
                variant="ghost"
                disabled={s === 114}
                onClick={() => goSurah(s + 1)}
              >
                {t.surah} {s + 1}
                <ChevronRight />
              </Button>
            </div>
          </div>
          {!pageZoom && (
            <aside className="study-companion">
              <p className="eyebrow">
                {t.study} · {t.ayah} {a}
              </p>
              <div className="companion-heading">
                <h2>
                  {data.surah.name} <span>{position}</span>
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t.bookmark}
                  onClick={() => toggleBookmark(position)}
                >
                  <Bookmark
                    fill={
                      bookmarks.includes(position) ? "currentColor" : "none"
                    }
                  />
                </Button>
              </div>
              {selected && (
                <>
                  <div className="arabic companion-arabic" lang="ar" dir="rtl">
                    {selected.text}
                  </div>
                  <div className="language-pills">
                    {(["en", "bn", "ja"] as Language[]).map((l) => (
                      <button
                        key={l}
                        className={languages[0] === l ? "active" : ""}
                        onClick={() => setLanguages([l])}
                      >
                        {{ en: "English", bn: "বাংলা", ja: "日本語" }[l]}
                      </button>
                    ))}
                  </div>
                  {translated(selected).map((p) => (
                    <div key={p.id} className="companion-translation">
                      <SourceText text={p.text} language={p.language} />
                      <SourceLink p={p} />
                    </div>
                  ))}
                  <div className="companion-actions">
                    <Button
                      onClick={() => open("q:" + position, "explanation")}
                    >
                      {t.explanation}
                      <ArrowUpRight />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => save("q:" + position)}
                    >
                      <Bookmark />
                      {t.save}
                    </Button>
                    <Button variant="ghost" onClick={() => research(position)}>
                      <Search />
                      {t.research}
                    </Button>
                  </div>
                  <div className="context-callout">
                    <BookOpen size={20} />
                    <div>
                      <h3>{t.contextNote}</h3>
                      <p>{t.evidenceNote}</p>
                      <button onClick={() => open("q:" + position)}>
                        {t.open} <span>↗</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
              <div className="companion-foot">
                <span className="tiny-rule" />
                <p>{t.noClaim}</p>
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
