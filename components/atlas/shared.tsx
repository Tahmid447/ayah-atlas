"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { ExternalLink, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Language } from "@/lib/topics";
import type { Passage, Evidence, SavedEvidence } from "@/lib/types";
export function textOnly(s: string) {
  return s
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?\s*>|<\/(p|div|h[1-6]|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([a-f\d]+);/gi, (_, n) =>
      String.fromCodePoint(parseInt(n, 16)),
    )
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
export function SourceText({
  text,
  language = "en",
  className = "",
}: {
  text: string;
  language?: string;
  className?: string;
}) {
  return (
    <div
      lang={language}
      dir={language === "ar" ? "rtl" : "ltr"}
      className={
        "source-text " + (language === "ar" ? "arabic " : "") + className
      }
    >
      {textOnly(text)}
    </div>
  );
}
export function SourceLink({ p }: { p: Passage }) {
  return (
    <a className="source-link" href={p.url} target="_blank" rel="noreferrer">
      {p.sourceTitle} · v{p.version}
      <ExternalLink size={12} />
    </a>
  );
}
export function Load({
  error,
  retry,
  label = "Loading verified sources…",
}: {
  error?: string;
  retry?: () => void;
  label?: string;
}) {
  return (
    <div className="load-state" role={error ? "alert" : "status"}>
      {error ? (
        <>
          <p>{error}</p>
          {retry && <Button onClick={retry}>Try again</Button>}
        </>
      ) : (
        <>
          <LoaderCircle className="spin" size={22} />
          <p>{label}</p>
        </>
      )}
    </div>
  );
}
export async function api<T>(url: string, body?: unknown): Promise<T> {
  const r = await fetch(
    url,
    body
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : undefined,
  );
  const d = (await r.json()) as T & { error?: string };
  if (!r.ok) throw new Error(d.error || "Source library unavailable");
  return d;
}
// Hydrate the explicitly device-local store after SSR; initial server/client output stays identical.
/* eslint-disable react-hooks/set-state-in-effect */
export function useLocal<T>(key: string, initial: T) {
  const [value, setValue] = useState(initial);
  const ref = useRef(value);
  const initialRef = useRef(initial);
  const [ready,setReady] = useState(false);
  useEffect(() => {
    const read = () => { try { const raw=window.AtlasStore.getItem(key); const next=raw===null?initialRef.current:JSON.parse(raw); ref.current=next; setValue(next); } catch {} };
    const changed = (event: Event) => { if ((event as CustomEvent).detail?.key===key) read(); };
    read(); setReady(true); window.addEventListener('atlas-workspace-change',changed);
    return()=>window.removeEventListener('atlas-workspace-change',changed);
  },[key]);
  const update = useCallback((next: T | ((current:T)=>T)) => {
    const v = typeof next === 'function' ? (next as (current:T)=>T)(ref.current) : next;
    ref.current=v;setValue(v);
    try { window.AtlasStore.setItem(key,JSON.stringify(v)); }
    catch { window.dispatchEvent(new CustomEvent('atlas-storage-error')); }
  },[key]);
  return [value,update,ready] as const;
}
export function evidenceLabel(e: Evidence) {
  return e.kind === "quran"
    ? "Quran " + e.key
    : e.passage?.reference?.match(
        /Sahih (?:al-)?(?:Muslim|Bukhari)\s+\d+/i,
      )?.[0] ||
        (e.kind === "hadith"
          ? "Hadith · " + e.key.replace("h:", "")
          : e.passage?.sourceTitle + " · " + e.key);
}
export function translationFor(e: Evidence, lang: Language) {
  const defaults = {
    en: "english_rwwad",
    bn: "bengali_zakaria",
    ja: "japanese_saeedsato",
  };
  const preferred = e.preferredTranslations?.[lang] || defaults[lang];
  return (
    e.verse?.translations.find(
      (p) => p.language === lang && p.sourceId === preferred,
    ) ||
    e.verse?.translations.find((p) => p.language === lang) ||
    [e.passage, ...e.related].find(
      (p) => p?.language === lang && p.kind === "hadith",
    )
  );
}
export function withReadingPreferences(e: Evidence): Evidence {
  try {
    const preferred = JSON.parse(
      window.AtlasStore.getItem("atlas.editions") || "{}",
    );
    return { ...e, preferredTranslations: preferred };
  } catch {
    return e;
  }
}

export function evidenceMarkdown(e: Evidence, lang: Language, n?: number) {
  const tr = translationFor(e, lang);
  const p = tr || e.passage;
  return `${n ? `[${n}] ` : ""}${evidenceLabel(e)}\n\n${e.arabic || e.verse?.text || ""}\n\n${tr ? textOnly(tr.text) : p ? textOnly(p.text) : ""}\n\n${tr ? `${tr.sourceTitle} · ${tr.author} · v${tr.version}\n${tr.url}` : p ? `${p.sourceTitle} · ${p.author} · v${p.version}\n${p.url}` : e.citation.url}\n\n${e.kind === "quran" && tr?.footnotes ? "Footnotes:\n" + textOnly(tr.footnotes) + "\n\n" : ""}${e.kind !== "quran" && p?.footnotes ? "Published explanation:\n" + textOnly(p.footnotes) + "\n\n" : ""}${e.passage?.grade ? "Grade: " + e.passage.grade + " — " + e.passage.gradeAttribution + "\n\n" : ""}${e.passage?.reference ? "Reference: " + e.passage.reference + "\n\n" : ""}Citation ID: ${e.citation.id}\nEdition: ${e.citation.edition}\nSHA-256: ${e.citation.checksum}\n${tr ? "Translation citation: " + tr.id + "\nTranslation edition: " + tr.edition_id + "\nTranslation SHA-256: " + tr.checksum + "\n" : ""}`;
}
export function downloadText(name: string, text: string) {
  window.dispatchEvent(
    new CustomEvent("atlas-export", { detail: { name, text } }),
  );
}
export function notebookMarkdown(items: SavedEvidence[], lang: Language) {
  return (
    "# Ayah Atlas · Evidence notebook\n\n" +
    items
      .map(
        (x, i) =>
          evidenceMarkdown(x.evidence, lang, i + 1) +
          (x.note ? "\nPrivate reflection:\n" + x.note : ""),
      )
      .join("\n---\n\n")
  );
}
