import { publicAccount } from "@/lib/public-account";
export function GET() {
  const url = process.env.PUBLIC_SUPABASE_URL || publicAccount.url;
  const key = process.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY || publicAccount.key;
  let safe = key.startsWith('sb_publishable_');
  try { safe ||= JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()).role === 'anon'; } catch {}
  return Response.json({ url, key: safe ? key : '', google: process.env.PUBLIC_GOOGLE_SIGN_IN ? process.env.PUBLIC_GOOGLE_SIGN_IN === 'true' : url === publicAccount.url }, { headers: { 'Cache-Control': 'no-store' } });
}
