import { evidence, research } from "./library";
import { row, rows, passageSelect } from "./db";
import { normalize } from "../topics";
import type { Passage } from "../types";
export type Check = {
  input: string;
  status:
    | "exact match"
    | "likely paraphrase"
    | "reference mismatch"
    | "insufficient indexed evidence";
  detail: string;
  evidenceId?: string;
  url?: string;
};
export function cleanHtml(s: string) {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}
export async function checkDraft(
  draft: string,
  quotations: { id: string; text: string }[] = [],
) {
  const out: Check[] = [];
  for (const q of quotations) {
    const e = await evidence(q.id);
    const stored = e?.passage?.text || e?.verse?.text;
    const exact = !!stored && cleanHtml(stored) === cleanHtml(q.text);
    out.push({
      input: q.text,
      status: exact
        ? "exact match"
        : e
          ? "reference mismatch"
          : "insufficient indexed evidence",
      detail: exact
        ? "The complete selected quotation matches this source record and edition. Interpretive support is not certified."
        : "The complete quotation does not match this indexed source record.",
      evidenceId: e?.id,
      url: e?.citation.url,
    });
  }
  const lines = draft
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 100);
  for (const line of lines) {
    const refs = [...line.matchAll(/(?:Quran\s*)?\b(\d{1,3}):(\d{1,3})\b/gi)];
    const hr = line.match(
      /(?:Sahih\s+)?(Muslim|(?:al-)?Bukhari)\s*:?\s*(\d+)/i,
    );
    const quoted = [...line.matchAll(/[“"]([^”"]{8,})[”"]/gu)].map((m) => m[1]);
    const internal = line.match(/\[source:([^\]]+)\]/);
    if (internal) {
      const e = await evidence(decodeURIComponent(internal[1]));
      const text = e?.passage ? cleanHtml(e.passage.text) : e?.arabic || "";
      for (const q of quoted.length ? quoted : [""]) {
        const exact = !!q && text.includes(q);
        out.push({
          input: q || line,
          status: exact
            ? "exact match"
            : e && q
              ? "reference mismatch"
              : "insufficient indexed evidence",
          detail: exact
            ? "Exact quotation matches this stored source and edition. Interpretive support remains unchecked."
            : "Inspect this citation and the published wording.",
          evidenceId: e?.id,
          url: e?.citation.url,
        });
      }
    } else if (refs.length) {
      for (const ref of refs) {
        const e = await evidence("q:" + ref[1] + ":" + ref[2]);
        if (!e) {
          out.push({
            input: line,
            status: "reference mismatch",
            detail:
              "This verse identifier is outside the imported canonical inventory.",
          });
          continue;
        }
        if (!quoted.length) {
          out.push({
            input: line,
            status: "insufficient indexed evidence",
            detail:
              "The reference exists. Its presence does not verify the surrounding claim.",
            evidenceId: e.id,
            url: e.citation.url,
          });
          continue;
        }
        for (const q of quoted) {
          const stored = [
            e.verse!.text,
            ...e.verse!.translations.map((p) => cleanHtml(p.text)),
          ];
          const exact = stored.some((t) => t.includes(q));
          const near = stored.some((t) => normalize(t).includes(normalize(q)));
          out.push({
            input: q,
            status: exact
              ? "exact match"
              : near
                ? "likely paraphrase"
                : "reference mismatch",
            detail: exact
              ? "Quotation is an exact substring of the stored Arabic or a published translation. Inspect edition before sharing."
              : near
                ? "Only normalized wording matches; check the original spelling and edition."
                : "Quoted wording does not match the cited verse in the indexed editions. This may be another translation; it is not a fabrication verdict.",
            evidenceId: e.id,
            url: e.citation.url,
          });
        }
      }
    } else if (hr) {
      const id =
        (hr[1].toLowerCase().includes("muslim") ? "muslim" : "bukhari") +
        ":" +
        hr[2];
      const alias = await row<{ hadith_id: string }>(
        "SELECT hadith_id FROM numbering_aliases WHERE id=?",
        [id],
      );
      if (!alias) {
        out.push({
          input: line,
          status: "insufficient indexed evidence",
          detail:
            "This narration number is not in the imported numbering aliases.",
        });
        continue;
      }
      const ps = await rows<Passage>(passageSelect + " WHERE p.key=?", [
        "h:" + alias.hadith_id,
      ]);
      const original = await evidence("h:" + alias.hadith_id);
      const texts = [
        ...ps.map((p) => cleanHtml(p.text)),
        original?.arabic || "",
      ];
      for (const q of quoted.length ? quoted : [""]) {
        const exact = !!q && texts.some((t) => t.includes(q));
        const near =
          !!q && texts.some((t) => normalize(t).includes(normalize(q)));
        out.push({
          input: q || line,
          status: exact
            ? "exact match"
            : near
              ? "likely paraphrase"
              : q
                ? "reference mismatch"
                : "insufficient indexed evidence",
          detail: exact
            ? "Quotation exactly matches an imported published narration. Interpretive support remains unchecked."
            : near
              ? "Normalized wording matches; inspect the exact source."
              : q
                ? "Numbering resolves, but the quotation does not match the indexed Arabic or translations. This is not a fabrication verdict."
                : "Reference resolves; a religious claim still needs passage-level review.",
          evidenceId: ps[0]?.id,
          url: ps[0]?.url,
        });
      }
    } else if (quoted.length) {
      for (const q of quoted) {
        const r = await research(q, 1, "all", "all");
        const exact = r.results.find((x) => cleanHtml(x.text).includes(q));
        out.push({
          input: q,
          status: exact ? "exact match" : "insufficient indexed evidence",
          detail: exact
            ? "Exact quotation found in the indexed source."
            : "No exact quotation was located. Missing indexed evidence does not establish fabrication.",
          evidenceId: exact?.id,
          url: exact?.url,
        });
      }
    } else if (
      /allah|prophet|quran|hadith|forbid|punish|অাল্লাহ|আল্লাহ|হাদিস|কুরআন|預言者|アッラー|禁止|罰/i.test(
        line,
      )
    )
      out.push({
        input: line,
        status: "insufficient indexed evidence",
        detail:
          "Uncited religious assertion. Add exact evidence; semantic and scholarly verification is not automated.",
      });
  }
  return {
    checks: out,
    exact: out.filter((x) => x.status === "exact match").length,
    unresolved: out.filter((x) => x.status !== "exact match").length,
    disclaimer:
      "Exact text and reference checks only. Semantic support, conflicting interpretations, and scholarly review require a qualified human.",
  };
}
