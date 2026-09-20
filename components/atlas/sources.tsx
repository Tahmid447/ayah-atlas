"use client";
/* Original reference raster is displayed without transcoding. */
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ExternalLink,
  Download,
  Database,
  BookOpen,
  ShieldCheck,
  RefreshCw,
  Trash2,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { dictionary } from "@/lib/i18n";
import type { Language } from "@/lib/topics";
import type { Source, Chapter } from "@/lib/types";
import { api, Load, useLocal, downloadText } from "./shared";
import specimen from "@/data/indopak-specimen.json";
import { installReadingPack, removeReadingPack } from "@/lib/offline";
export function SourcesView({
  lang,
  goTypography,
  notify,
}: {
  lang: Language;
  goTypography: () => void;
  notify: (s: string) => void;
}) {
  const t = dictionary(lang);
  const [data, setData] = useState<{
    sources: Source[];
    reviewed: { count: number };
    imports: { id: string; report: string; completed: string }[];
  } | null>(null);
  const [error, setError] = useState("");
  const [type, setType] = useState("all");
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [pack, setPack] = useLocal("atlas.offlinePack", "");
  const [updates, setUpdates] = useState("");
  useEffect(() => {
    api<typeof data>("/api/sources")
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);
  async function install() {
    setBusy(true);
    setError("");
    try {
      setPack(await installReadingPack(setProgress));
      notify(
        "114 chapters and five published translations passed integrity checks and are available offline.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
    } finally {
      setBusy(false);
    }
  }
  async function checkUpdates() {
    setUpdates("Checking publisher catalog…");
    try {
      const d = await api<{
        updates: { title: string; stored: string; current: string }[];
        omitted: string[];
      }>("/api/revisions");
      setUpdates(
        d.updates.length
          ? d.updates
              .map(
                (x) =>
                  `${x.title}: stored ${x.stored}; publisher ${x.current}. Saved quotations retain their previous editions.`,
              )
              .join("\n")
          : "No version changes in the editions reported by the live catalog. " +
              d.omitted.length +
              " editions are omitted by that catalog and require a publisher-page check.",
      );
    } catch (e) {
      setUpdates(e instanceof Error ? e.message : "Update check unavailable");
    }
  }
  return (
    <div className="sources-view">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{t.sourceDetails}</p>
          <h1>{t.sources}</h1>
        </div>
        <Button variant="outline" onClick={goTypography}>
          {t.typography}
          <ArrowUpRight />
        </Button>
      </div>
      <p className="section-intro">
        {t.sourceScope} {t.noClaim}
      </p>
      {!data ? (
        <Load error={error} label={t.loading} />
      ) : (
        <>
          <div className="coverage-strip">
            <div>
              <BookOpen />
              <strong>6,236</strong>
              <span>
                {t.quran} · 114 {t.surah}
              </span>
            </div>
            <div>
              <Database />
              <strong>
                {data.sources.filter((x) => x.type === "translation").length}
              </strong>
              <span>{t.translations} · EN / BN / JA</span>
            </div>
            <div>
              <BookOpen />
              <strong>
                {data.sources.filter((x) => x.type === "tafsir").length}
              </strong>
              <span>{t.tafsir} · full ayah coverage</span>
            </div>
            <div>
              <ShieldCheck />
              <strong>{data.reviewed.count}</strong>
              <span>Identified human reviews</span>
            </div>
          </div>
          <div className="sources-toolbar">
            <NativeSelect
              aria-label="Source type"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="all">{t.all}</option>
              <option value="quran">{t.quran}</option>
              <option value="translation">{t.translation}</option>
              <option value="tafsir">{t.tafsir}</option>
              <option value="hadith">{t.hadith}</option>
            </NativeSelect>
            <Button variant="ghost" onClick={checkUpdates}>
              <RefreshCw />
              {t.revisions}
            </Button>
          </div>
          {updates && (
            <p className="status-note" role="status">
              {updates}
            </p>
          )}
          <div className="source-registry">
            {data.sources
              .filter((s) => type === "all" || s.type === type)
              .map((s) => (
                <article className="source-card" key={s.id}>
                  <div>
                    <span className="kind-label">
                      {s.type} · {s.language.toUpperCase()}
                    </span>
                    <h2>{s.title}</h2>
                    <p>
                      {s.author} · {s.publisher}
                    </p>
                  </div>
                  <div className="source-card-meta">
                    <span>v{s.version}</span>
                    <strong>
                      {s.count.toLocaleString()}{" "}
                      {s.type === "hadith" ? "records" : "ayat"}
                    </strong>
                  </div>
                  <details>
                    <summary>{t.sourceDetails}</summary>
                    <p>{s.scope}</p>
                    <dl className="source-dl">
                      <dt>{t.version}</dt>
                      <dd>{s.editionId}</dd>
                      <dt>Retrieved</dt>
                      <dd>{s.retrieved}</dd>
                      <dt>SHA-256</dt>
                      <dd>{s.checksum}</dd>
                      <dt>{t.review}</dt>
                      <dd>{s.status}</dd>
                    </dl>
                    <a href={s.terms} target="_blank" rel="noreferrer">
                      {t.terms} ↗
                    </a>
                  </details>
                  <a
                    className="source-link"
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t.source}
                    <ExternalLink size={14} />
                  </a>
                </article>
              ))}
          </div>
          <p>
            <Link className="source-link" href="/?view=review">
              Report a correction or open editorial review ↗
            </Link>
          </p>
          <section className="source-notes">
            <div>
              <h2>Device workspace backup</h2>
              <p>
                Save this browser’s notebook, talk, bookmarks, reading position,
                and preferences as a JSON file before changing accounts or
                devices.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  const entries: Record<string, unknown> = {};
                  for (const key of Object.keys(localStorage)) {
                    if (key.startsWith("atlas.")) {
                      try {
                        entries[key] = JSON.parse(
                          localStorage.getItem(key) || "null",
                        );
                      } catch {}
                    }
                  }
                  downloadText(
                    "ayah-atlas-workspace.json",
                    JSON.stringify(
                      {
                        format: "ayah-atlas-device-backup",
                        version: 1,
                        created: new Date().toISOString(),
                        entries,
                      },
                      null,
                      2,
                    ),
                  );
                }}
              >
                Export device backup
              </Button>
            </div>
          </section>
          <div className="source-notes">
            <section>
              <h2>{t.offline}</h2>
              <p>{t.offlineNotice}</p>
              <p className="meta-text">
                Selectable Arabic and translations only. Reference images,
                tafsir, and research require the local server. Switch to Study
                or Continuous reading after downloading.{" "}
                {pack && "Pack saved: " + new Date(pack).toLocaleString()}
              </p>
              <Button onClick={install} disabled={busy}>
                <Download />
                {busy ? `${progress} / 114` : t.download}
              </Button>
              {pack && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    removeReadingPack().then(() => {
                      setPack("");
                      notify("Offline pack deleted.");
                    });
                  }}
                >
                  <Trash2 />
                  {t.remove}
                </Button>
              )}
              {error && <p role="alert">{error}</p>}
            </section>
            <section>
              <h2>{t.notIndexed}</h2>
              <p>
                Semantic retrieval and AI summaries are disabled. No external AI
                key is needed for the reader and source search.
              </p>
              <p>
                The initial tafsir collection represents selected Sunni works.
                Contemporary lectures and other interpretive traditions are not
                indexed. The hadith library is a bounded selection, not entire
                collections.
              </p>
              <p>
                English Ibn Kathir’s digital resource does not supply a
                print-edition identifier. Original page images do not identify
                their copyright holder. These limits remain visible in the
                source records.
              </p>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
export function TypographyView({ lang }: { lang: Language }) {
  const t = dictionary(lang);
  const [data, setData] = useState<Chapter | null>(null);
  const [zoom, setZoom] = useState(100);
  useEffect(() => {
    api<Chapter>("/api/chapter/68").then(setData);
  }, []);
  return (
    <div className="typography-view">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Reference verification</p>
          <h1>{t.typography}</h1>
        </div>
        <NativeSelect
          aria-label="Typography zoom"
          value={zoom}
          onChange={(e) => setZoom(+e.target.value)}
        >
          <option value="100">100%</option>
          <option value="150">150%</option>
          <option value="200">200%</option>
        </NativeSelect>
      </div>
      <p className="section-intro">
        The original GIF preserves the requested handwriting. Both selectable
        fonts below are clearly identified alternatives; neither is claimed as
        the reference’s exact typeface.
      </p>
      <div className="typography-grid">
        <section>
          <h2>Original · page 566</h2>
          <img
            className="type-reference"
            src="/reference/p566.gif"
            alt="Supplied reference page 566, Surah Al-Qalam 7–31"
          />
          <a
            className="source-link"
            href="https://www.equraninstitute.com/quranreading/quraan_images/p566.gif"
            target="_blank"
            rel="noreferrer"
          >
            Original asset ↗
          </a>
        </section>
        <section>
          <h2>DigitalKhatt IndoPak · v0.1</h2>
          <p>
            Official companion text; comparison only. No claim of identical
            letterforms or canonical verse mapping.
          </p>
          <div
            className="indopak-specimen"
            lang="ar"
            dir="rtl"
            style={{ fontSize: (26 * zoom) / 100 }}
          >
            {specimen.referenceSpecimen.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
          <a
            className="source-link"
            href="https://github.com/DigitalKhatt/indopakfont"
            target="_blank"
            rel="noreferrer"
          >
            Font origin · SIL OFL 1.1 ↗
          </a>
          <h2>Uthmani · selectable study text</h2>
          <p>
            QPC Uthmanic Hafs v18 with Tanzil Uthmani v1.1; used for source
            copy, accessibility, and text study.
          </p>
          {data?.verses
            .filter((v) => v.ayah >= 7 && v.ayah <= 10)
            .map((v) => (
              <p
                className="arabic"
                lang="ar"
                dir="rtl"
                key={v.key}
                style={{ fontSize: (28 * zoom) / 100, lineHeight: 2.6 }}
              >
                {v.text} <span>{v.ayah.toLocaleString("ar")}</span>
              </p>
            ))}
        </section>
      </div>
      <div className="status-note">
        The reference contains rasterized IndoPak-style calligraphy. Amiri in
        the host page’s CSS does not identify it. QUL Qudratullah page 565
        shares the verse boundaries of printed reference page 566; numbering is
        not interchangeable. Exact font/calligrapher identification is unproven.
      </div>
    </div>
  );
}
