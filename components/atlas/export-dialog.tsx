"use client";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
export function ExportDialog() {
  const [file, setFile] = useState<{ name: string; text: string } | null>(null);
  const [status, setStatus] = useState("");
  useEffect(() => {
    const receive = (event: Event) => {
      setFile((event as CustomEvent).detail);
      setStatus("");
    };
    window.addEventListener("atlas-export", receive);
    return () => window.removeEventListener("atlas-export", receive);
  }, []);
  return (
    <Dialog open={!!file} onOpenChange={(v) => !v && setFile(null)}>
      <DialogContent className="export-dialog">
        <DialogHeader>
          <DialogTitle>Export · {file?.name}</DialogTitle>
          <DialogDescription>
            Arabic, published translations, edition identifiers, and source
            links are included. Review or copy the complete document below.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          aria-label="Export content"
          readOnly
          value={file?.text || ""}
          rows={14}
        />
        <div className="talk-bottom-actions">
          <form method="post" action="/api/export">
            <input type="hidden" name="name" value={file?.name || ""} />
            <input type="hidden" name="content" value={file?.text || ""} />
            <Button type="submit">Download file</Button>
          </form>
          <Button
            variant="outline"
            onClick={() =>
              navigator.clipboard
                .writeText(file?.text || "")
                .then(() => setStatus("Copied."))
                .catch(() =>
                  setStatus(
                    "Select the document text and copy it with your keyboard.",
                  ),
                )
            }
          >
            Copy document
          </Button>
        </div>
        {status && <p role="status">{status}</p>}
      </DialogContent>
    </Dialog>
  );
}
