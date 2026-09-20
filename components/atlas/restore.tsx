"use client";
import { api } from "./shared";
import type { Evidence } from "@/lib/types";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  parseWorkspaceBackup,
  mergeWorkspaceBackup,
  verifySavedSource,
  type WorkspaceBackup,
} from "@/lib/workspace-backup";
export function RestoreWorkspace() {
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<WorkspaceBackup | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function inspect(file: File) {
    setError("");
    setBusy(true);
    try {
      if (file.size > 10000000) throw new Error("Backup exceeds 10 MB.");
      const parsed = await parseWorkspaceBackup(await file.text());
      const records = new Map<string, Evidence>();
      for (const item of parsed.entries["atlas.notebook"] || []) {
        const e = await api<Evidence>(
          "/api/evidence/" + encodeURIComponent(item.evidence.id),
        );
        records.set(e.id, e);
      }
      verifySavedSource(parsed.entries["atlas.notebook"], records);
      setPending(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid backup");
    } finally {
      setBusy(false);
    }
  }
  function restore() {
    try {
      const result = mergeWorkspaceBackup(pending!, localStorage);
      setPending(null);
      // Reload after restoring storage so every device preference rehydrates together.
      history.replaceState(null, "", "/?view=notebook" + (result.recoveredTalk ? "&recoveredTalk=1" : ""));
      location.reload();
    } catch (e) {
      setError(
        e instanceof Error && e.message.startsWith("This restore")
          ? e.message
          : "Device storage could not complete the restore. Existing values were restored where possible. Keep your backup file.",
      );
    }
  }
  return (
    <>
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        aria-label="Device backup file"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void inspect(file);
          e.target.value = "";
        }}
      />
      <Button
        variant="outline"
        disabled={busy}
        onClick={() => input.current?.click()}
      >
        {busy ? "Verifying backup…" : "Restore device backup"}
      </Button>
      {error && <p role="alert">{error}</p>}
      <AlertDialog
        open={!!pending}
        onOpenChange={(v) => !v && setPending(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore this device backup?</AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.entries["atlas.notebook"]?.length || 0} evidence
              snapshots passed content checksums. They will merge with your
              current notebook. Existing notes stay intact; preferences are
              restored. A different current talk is kept, with the recovered
              talk saved separately. Offline packs must be downloaded again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={restore}>
              Restore verified backup
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
