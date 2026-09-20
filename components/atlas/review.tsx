"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { api } from "./shared";
type Review = {
  id: string;
  reviewer: string;
  scope: string;
  evidence_id: string;
  status: string;
  note: string;
  created: string;
};
export function ReviewConsole() {
  const [token, setToken] = useState("");
  const [name, setName] = useState("");
  const [id, setId] = useState("q:49:12");
  const [note, setNote] = useState("");
  const [scope, setScope] = useState("citation");
  const [status, setStatus] = useState("pending");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [message, setMessage] = useState("");
  async function load() {
    try {
      const r = await fetch("/api/admin", {
        headers: { Authorization: "Bearer " + token },
      });
      const d = (await r.json()) as { error: string; reviews: Review[] };
      if (!r.ok) throw new Error(d.error);
      setReviews(d.reviews);
      setMessage("Editorial history loaded.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unavailable");
    }
  }
  async function submit(community: boolean) {
    try {
      const body = { reviewer: name, evidenceId: id, note, scope, status };
      if (community) {
        await api("/api/corrections", body);
        setMessage("Correction queued for review. Source text is unchanged.");
      } else {
        const r = await fetch("/api/admin", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify(body),
        });
        const d = (await r.json()) as { error: string; reviews: Review[] };
        if (!r.ok) throw new Error(d.error);
        setMessage(
          "Named editorial decision recorded. Source text is unchanged.",
        );
        await load();
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Review failed");
    }
  }
  return (
    <div className="review-console">
      <div className="page-heading">
        <h1>Corrections & editorial review</h1>
      </div>
      <p>
        Report a source or citation issue for review. Corrections never rewrite
        the published text. An editorial decision has an identified reviewer,
        scope, timestamp, and preserved history.
      </p>
      <div className="talk-settings">
        <label>
          Your name
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
          />
        </label>
        <label>
          Evidence or source ID
          <Input
            value={id}
            onChange={(e) => setId(e.target.value)}
            maxLength={300}
          />
        </label>
        <label>
          Review scope
          <NativeSelect
            value={scope}
            onChange={(e) => setScope(e.target.value)}
          >
            <option value="citation">Citation</option>
            <option value="source">Source edition</option>
            <option value="interpretation">Interpretation</option>
          </NativeSelect>
        </label>
      </div>
      <label>
        Issue and supporting source
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={5000}
        />
      </label>
      <Button
        onClick={() => submit(true)}
        disabled={name.length < 3 || note.length < 5}
      >
        Submit correction for review
      </Button>
      <details className="corpus-disclosure">
        <summary>Protected editorial access</summary>
        <p>
          Configure EDITORIAL_TOKEN on the server. The token is used only for
          these requests and is never stored in the notebook or browser storage.
        </p>
        <label>
          Editorial token
          <Input
            type="password"
            autoComplete="off"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        </label>
        <label>
          Decision
          <NativeSelect
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </NativeSelect>
        </label>
        <Button variant="outline" onClick={load}>
          Load review history
        </Button>
        <Button
          onClick={() => submit(false)}
          disabled={token.length < 32 || name.length < 3 || note.length < 5}
        >
          Record editorial decision
        </Button>
        {reviews.map((r) => (
          <article key={r.id}>
            <h3>
              {r.scope} · {r.status} · {r.evidence_id}
            </h3>
            <p>{r.note}</p>
            <small>
              {r.reviewer} · {r.created}
            </small>
          </article>
        ))}
      </details>
      {message && (
        <p role="status" className="status-note">
          {message}
        </p>
      )}
    </div>
  );
}
