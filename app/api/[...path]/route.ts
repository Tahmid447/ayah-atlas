export const runtime = "nodejs";
export const maxDuration = 60;
const env = process.env;
import {
  chapter,
  evidence,
  research,
  sources,
  story,
} from "@/lib/server/library";
import { checkDraft } from "@/lib/server/checker";
import { db, rows, row, noStore } from "@/lib/server/db";
import { z } from "zod";
const rates = new Map<string, { n: number; until: number }>();
function response(body: unknown, status = 200) {
  return Response.json(body, { status, headers: noStore });
}
function parts(req: Request) {
  return new URL(req.url).pathname
    .replace(/^\/api\//, "")
    .split("/")
    .map(decodeURIComponent);
}
function limit(req: Request) {
  const k = req.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  const now = Date.now();
  const prev = rates.get(k);
  if (!prev || prev.until < now) {
    rates.set(k, { n: 1, until: now + 60000 });
    return true;
  }
  return ++prev.n <= 90;
}
export async function GET(req: Request) {
  try {
    const [kind, id] = parts(req);
    const u = new URL(req.url);
    if (kind === "health")
      return response({
        ok: true,
        inventory: await row("SELECT COUNT(*) ayat FROM ayat"),
      });
    if (kind === "sources" || kind === "coverage")
      return response({
        sources: await sources(),
        surahs: await rows("SELECT * FROM surahs ORDER BY id"),
        imports: await rows(
          "SELECT * FROM import_runs ORDER BY started DESC LIMIT 10",
        ),
        reviewed: await row(
          "SELECT COUNT(*) count FROM reviews WHERE status='approved'",
        ),
        revisions: await rows("SELECT * FROM revisions ORDER BY created DESC"),
      });
    if (kind === "story") {
      const data = await story(
        z.enum(["musa", "yusuf", "ibrahim", "nuh", "isa"]).parse(id),
        z
          .enum(["en", "bn", "ja"])
          .parse(u.searchParams.get("language") || "en"),
      );
      return response(data);
    }
    if (kind === "surahs")
      return response(await rows("SELECT * FROM surahs ORDER BY id"));
    if (kind === "juz-starts")
      return response(
        await rows(
          "SELECT a.key,a.juz FROM ayat a JOIN (SELECT juz,MIN(rowid) first_row FROM ayat GROUP BY juz) j ON a.rowid=j.first_row ORDER BY a.juz",
        ),
      );
    if (kind === "revisions") {
      const current = (await fetch(
        "https://quranenc.com/api/v1/translations/list",
      ).then((r) => r.json())) as {
        translations: { key: string; version: string }[];
      };
      const stored = await sources();
      const provider = stored.filter((s) => s.publisher === "QuranEnc");
      return response({
        updates: provider.flatMap((s) => {
          const now = current.translations.find((x) => x.key === s.id);
          return now && now.version !== s.version
            ? [{ title: s.title, stored: s.version, current: now.version }]
            : [];
        }),
        omitted: provider
          .filter((s) => !current.translations.some((x) => x.key === s.id))
          .map((s) => s.id),
      });
    }
    if (kind === "juz")
      return response(
        await rows(
          "SELECT juz,MIN(rowid) first,MIN(key) FROM ayat GROUP BY juz",
        ),
      );
    if (kind === "chapter") {
      const n = z.coerce.number().int().min(1).max(114).parse(id);
      const d = await chapter(n);
      return d ? response(d) : response({ error: "Chapter not found" }, 404);
    }
    if (kind === "verse" || kind === "evidence") {
      const e = await evidence(id || "");
      return e
        ? response(e)
        : response(
            { error: "Evidence not found in the validated corpus" },
            404,
          );
    }
    if (kind === "search" || kind === "research") {
      if (!limit(req))
        return response(
          { error: "Please wait before another research request." },
          429,
        );
      const q = z.string().min(1).max(400).parse(u.searchParams.get("q"));
      const page = z.coerce
        .number()
        .int()
        .min(1)
        .max(300)
        .parse(u.searchParams.get("page") || 1);
      return response(
        await research(
          q,
          page,
          u.searchParams.get("kind") || "all",
          u.searchParams.get("language") || "all",
        ),
      );
    }
    if (kind === "admin") {
      const token = (env as unknown as { EDITORIAL_TOKEN?: string })
        .EDITORIAL_TOKEN;
      if (
        !token ||
        token.length < 32 ||
        req.headers.get("authorization") !== "Bearer " + token
      )
        return response(
          { error: "Authenticated editorial token required." },
          401,
        );
      return response({
        reviews: await rows(
          "SELECT * FROM reviews ORDER BY created DESC LIMIT 200",
        ),
      });
    }
    return response({ error: "Unknown API endpoint" }, 404);
  } catch (e) {
    return response(
      {
        error:
          e instanceof z.ZodError
            ? "Invalid request parameters"
            : e instanceof Error
              ? e.message
              : "Source library unavailable",
      },
      e instanceof z.ZodError ? 400 : 503,
    );
  }
}
export async function POST(req: Request) {
  try {
    if (!limit(req)) return response({ error: "Rate limit reached" }, 429);
    if (
      Number(req.headers.get("content-length") || 0) >
      (parts(req)[0] === "export" ? 8388608 : 80000)
    )
      return response({ error: "Request too large" }, 413);
    if (parts(req)[0] === "export") {
      const chunks: Uint8Array[] = [];
      let size = 0;
      const reader = req.body?.getReader();
      if (!reader) return response({ error: "Empty export" }, 400);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 8388608) {
          await reader.cancel();
          return response({ error: "Export too large" }, 413);
        }
        chunks.push(value);
      }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
      }
      const form = new URLSearchParams(new TextDecoder().decode(bytes));
      const name = z
        .string()
        .regex(/^ayah-atlas-[a-z-]+\.(?:md|json)$/)
        .parse(form.get("name"));
      const content = z.string().min(1).max(2000000).parse(form.get("content"));
      return new Response(content, {
        headers: {
          ...noStore,
          "Content-Type": name.endsWith(".json")
            ? "application/json; charset=utf-8"
            : "text/markdown; charset=utf-8",
          "Content-Disposition": 'attachment; filename="' + name + '"',
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
    const raw = await req.text();
    if (raw.length > 80000)
      return response({ error: "Request too large" }, 413);
    const [kind] = parts(req);
    const body = JSON.parse(raw);
    if (kind === "corrections") {
      const v = z
        .object({
          reviewer: z.string().min(3).max(100),
          scope: z.enum(["source", "citation", "interpretation"]),
          evidenceId: z.string().min(1).max(300),
          note: z.string().min(5).max(5000),
        })
        .parse(body);
      const known =
        v.scope === "source"
          ? await row("SELECT id FROM sources WHERE id=?", [v.evidenceId])
          : await evidence(v.evidenceId);
      if (!known)
        return response(
          { error: "The evidence or source ID must resolve." },
          400,
        );
      const id = crypto.randomUUID();
      await db()
        .prepare(
          "INSERT INTO reviews(id,reviewer,scope,evidence_id,status,note,created) VALUES(?,?,?,?,?,?,?)",
        )
        .bind(
          id,
          v.reviewer,
          v.scope,
          v.evidenceId,
          "pending",
          v.note,
          new Date().toISOString(),
        )
        .run();
      return response({ id, status: "pending" }, 201);
    }
    if (kind === "check") {
      const { draft, quotations } = z
        .object({
          draft: z.string().max(30000),
          quotations: z
            .array(
              z.object({
                id: z.string().max(300),
                text: z.string().max(15000),
              }),
            )
            .max(30)
            .default([]),
        })
        .parse(body);
      return response(await checkDraft(draft, quotations));
    }
    if (kind === "research") {
      const { query } = z
        .object({ query: z.string().min(1).max(400) })
        .parse(body);
      return response(await research(query));
    }
    if (kind === "admin") {
      const expected = (env as unknown as { EDITORIAL_TOKEN?: string })
        .EDITORIAL_TOKEN;
      if (
        !expected ||
        expected.length < 32 ||
        req.headers.get("authorization") !== "Bearer " + expected
      )
        return response({ error: "Editorial access denied" }, 401);
      const v = z
        .object({
          reviewer: z.string().min(3).max(100),
          scope: z.enum(["source", "citation", "interpretation"]),
          evidenceId: z.string().min(1).max(300),
          status: z.enum(["pending", "approved", "rejected"]),
          note: z.string().min(5).max(5000),
        })
        .parse(body);
      const known =
        v.scope === "source"
          ? await row("SELECT id FROM sources WHERE id=?", [v.evidenceId])
          : await evidence(v.evidenceId);
      if (!known)
        return response({ error: "Evidence must resolve before review" }, 400);
      const id = crypto.randomUUID();
      await db()
        .prepare(
          "INSERT INTO reviews(id,reviewer,scope,evidence_id,status,note,created) VALUES(?,?,?,?,?,?,?)",
        )
        .bind(
          id,
          v.reviewer,
          v.scope,
          v.evidenceId,
          v.status,
          v.note,
          new Date().toISOString(),
        )
        .run();
      return response({ id, ...v }, 201);
    }
    return response({ error: "Unknown action" }, 404);
  } catch (e) {
    return response(
      { error: e instanceof Error ? e.message : "Invalid request" },
      400,
    );
  }
}
