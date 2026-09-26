import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import path from "node:path";
// Published source corpus is immutable. Personal data belongs in Supabase.
let database: DatabaseSync;
export function db() {
  database ??= new DatabaseSync(path.join(process.cwd(), "data/corpus.sqlite"), { readOnly: true });
  return { prepare(sql: string) {
    const statement = database.prepare(sql);
    return { bind(...args: unknown[]) {
      const values = args as SQLInputValue[];
      return {
        async all<T>() { return { results: statement.all(...values) as T[] }; },
        async first<T>() { return (statement.get(...values) as T) ?? null; },
        async run() { throw new Error("Editorial writes require the authenticated cloud review service."); },
      };
    } };
  } };
}
export async function rows<T = Record<string, unknown>>(sql: string, args: unknown[] = []) {
  return (await db().prepare(sql).bind(...args).all<T>()).results;
}
export async function row<T = Record<string, unknown>>(sql: string, args: unknown[] = []) {
  return db().prepare(sql).bind(...args).first<T>();
}
export const passageSelect = `SELECT p.*,s.title sourceTitle,s.author,s.publisher,s.id sourceId,e.version,e.retrieved FROM passages p JOIN editions e ON e.id=p.edition_id JOIN sources s ON s.id=e.source_id`;
export const noStore = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
