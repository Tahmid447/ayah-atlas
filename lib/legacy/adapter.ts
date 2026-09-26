type LegacyResponse = { setHeader: (name: string, value: string) => void; status: (code: number) => LegacyResponse; json: (body: unknown) => void; send: (body: Uint8Array | string) => void; end: () => void; };
export function adapt(handler: (req: { method: string; query: Record<string, string> }, res: LegacyResponse) => Promise<unknown>) {
  return async (request: Request) => {
    const headers = new Headers(); let status = 200; let body: BodyInit | null = null;
    const res: LegacyResponse = {
      setHeader(name, value) { headers.set(name, value); },
      status(code) { status = code; return res; },
      json(value) { headers.set('Content-Type', 'application/json'); body = JSON.stringify(value); },
      send(value) { body = value as BodyInit; }, end() {},
    };
    await handler({ method: request.method, query: Object.fromEntries(new URL(request.url).searchParams) }, res);
    return new Response(body, { status, headers });
  };
}
