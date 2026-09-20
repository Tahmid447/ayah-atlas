"use client";
import { useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { z } from "zod";
import type { Evidence } from "@/lib/types";
import { api } from "./shared";
type Actions = {
  research: (q: string) => void;
  save: (e: Evidence) => void;
  savedCount: number;
};
type ModelTool = {
  name: string;
  title: string;
  description: string;
  inputSchema: object;
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
  execute: (input: unknown) => unknown | Promise<unknown>;
};
export function useAgentTools(actions: Actions) {
  const current = useRef(actions);
  useEffect(() => {
    current.current = actions;
  });
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: ModelTool,
            options: { signal: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const definitions: ModelTool[] = [
      {
        name: "open_source_research",
        title: "Open source research",
        description:
          "Navigate this workspace to a source search. Does not generate religious findings or save private notes.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", minLength: 1, maxLength: 400 },
          },
          required: ["query"],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: true },
        execute(input) {
          const v = z
            .object({ query: z.string().trim().min(1).max(400) })
            .strict()
            .parse(input);
          flushSync(() => current.current.research(v.query));
          return { query: v.query, view: "research", status: "search started" };
        },
      },
      {
        name: "save_evidence_to_notebook",
        title: "Save published evidence",
        description:
          "Save up to ten resolved evidence snapshots to this device’s notebook, preserving source editions. Does not publish or transmit notes.",
        inputSchema: {
          type: "object",
          properties: {
            ids: {
              type: "array",
              items: { type: "string" },
              minItems: 1,
              maxItems: 10,
            },
          },
          required: ["ids"],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: true },
        async execute(input) {
          const v = z
            .object({ ids: z.array(z.string().min(1).max(300)).min(1).max(10) })
            .strict()
            .parse(input);
          const records = await Promise.all(
            [...new Set(v.ids)].map((id) =>
              api<Evidence>("/api/evidence/" + encodeURIComponent(id)),
            ),
          );
          flushSync(() => records.forEach((e) => current.current.save(e)));
          return {
            saved: records.map((e) => e.citation.id),
            location: "this device",
          };
        },
      },
      {
        name: "read_workspace_summary",
        title: "Read workspace summary",
        description:
          "Read current view and saved evidence count, without returning private note content.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute(input) {
          z.object({}).strict().parse(input);
          return {
            view: new URL(location.href).searchParams.get("view") || "read",
            savedCount: current.current.savedCount,
          };
        },
      },
    ];
    for (const tool of definitions)
      try {
        void Promise.resolve(
          context.registerTool(tool, { signal: lifecycle.signal }),
        ).catch(() => {});
      } catch {}
    return () => lifecycle.abort();
  }, []);
}
