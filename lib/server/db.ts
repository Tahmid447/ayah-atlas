import { env } from "cloudflare:workers";
export function db(): D1Database {
  const binding = (env as unknown as { DB?: D1Database }).DB;
  if (!binding)
    throw new Error(
      "The validated source library is unavailable. Run the local corpus setup.",
    );
  return binding;
}
export async function rows<T = Record<string, unknown>>(
  sql: string,
  args: unknown[] = [],
) {
  const r = await db()
    .prepare(sql)
    .bind(...args)
    .all<T>();
  return r.results;
}
export async function row<T = Record<string, unknown>>(
  sql: string,
  args: unknown[] = [],
) {
  return db()
    .prepare(sql)
    .bind(...args)
    .first<T>();
}
export const passageSelect = `SELECT p.*,s.title sourceTitle,s.author,s.publisher,s.id sourceId,e.version,e.retrieved FROM passages p JOIN editions e ON e.id=p.edition_id JOIN sources s ON s.id=e.source_id`;
export const noStore = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};
