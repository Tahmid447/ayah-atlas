"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { topics, type Language } from "@/lib/topics";
import type { Passage } from "@/lib/types";
import { dictionary } from "@/lib/i18n";
import { api, Load, SourceText, SourceLink } from "./shared";
export function StoryExplorer({
  lang,
  open,
  save,
  research,
}: {
  lang: Language;
  open: (id: string, tab?: string) => void;
  save: (id: string) => void;
  research: (q: string) => void;
}) {
  const t = dictionary(lang);
  const [id, setId] = useState("musa");
  const [data, setData] = useState<{
    total: number;
    method: string;
    groups: { surah: number; name: string; passages: Passage[] }[];
  } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    api<NonNullable<typeof data>>("/api/story/" + id + "?language=" + lang)
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
  }, [id, lang]);
  return (
    <section className="story-explorer">
      <div className="page-heading">
        <h2>{t.stories}</h2>
        <NativeSelect
          aria-label="Prophet"
          value={id}
          onChange={(e) => {
            setData(null);
            setId(e.target.value);
          }}
        >
          {topics
            .filter((x) => x.group === "Prophetic stories")
            .map((x) => (
              <option key={x.id} value={x.id}>
                {x.labels[lang]}
              </option>
            ))}
        </NativeSelect>
      </div>
      <p>{t.storyNote}</p>
      <p className="meta-text">
        {data?.total} published passages · Quran chapter order · no inferred
        chronology. Passage excerpts show each chapter’s wording; open the
        commentary to study its emphasis.
      </p>
      <Button
        variant="outline"
        onClick={() => research(topics.find((x) => x.id === id)!.labels[lang])}
      >
        {t.research}
      </Button>
      {!data ? (
        <Load error={error} />
      ) : (
        data.groups.map((g) => (
          <details className="story-group" key={g.surah}>
            <summary>
              {g.surah}. {g.name} · {g.passages.length} passages
            </summary>
            {g.passages.map((p) => (
              <article key={p.id}>
                <h3>Quran {p.key}</h3>
                <SourceText text={p.text} language={p.language} />
                <SourceLink p={p} />
                <div>
                  <Button
                    variant="ghost"
                    onClick={() => open("q:" + p.key, "explanation")}
                  >
                    {t.explanation}
                  </Button>
                  <Button variant="ghost" onClick={() => save("q:" + p.key)}>
                    {t.save}
                  </Button>
                </div>
              </article>
            ))}
          </details>
        ))
      )}
    </section>
  );
}
