"use client";

import { useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import api from "../../lib/api";

const REASONS = [
  { value: "inappropriate", label: "🔞 Inappropriate content" },
  { value: "spam", label: "📢 Spam" },
  { value: "copyright", label: "©️ Copyright violation" },
  { value: "other", label: "❓ Other" },
];

export default function FlagButton({ videoId }) {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!user || done) {
    return done ? (
      <span className="text-xs muted">✓ Reported</span>
    ) : null;
  }

  const submit = async () => {
    if (!reason) return;
    setSubmitting(true);
    try {
      await api.post(`/flags/${videoId}`, { reason, notes });
      setDone(true);
      setOpen(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => setOpen(true)}
        style={{ color: "var(--ink-muted)", fontSize: "0.8125rem" }}
      >
        🚩 Report
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal__header">
              <h2 className="display-sm">Report this video</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setOpen(false)}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--s3)", marginBottom: "var(--s4)" }}>
              {REASONS.map((r) => (
                <label
                  key={r.value}
                  style={{
                    display: "flex", alignItems: "center", gap: "var(--s3)",
                    padding: "var(--s3) var(--s4)",
                    border: `1.5px solid ${reason === r.value ? "var(--terra)" : "var(--border)"}`,
                    borderRadius: "var(--r-sm)",
                    cursor: "pointer",
                    background: reason === r.value ? "var(--terra-pale)" : "white",
                    transition: "all var(--trans)",
                  }}
                >
                  <input type="radio" name="reason" value={r.value} onChange={() => setReason(r.value)} style={{ accentColor: "var(--terra)" }} />
                  <span className="text-sm">{r.label}</span>
                </label>
              ))}
            </div>

            <div className="form-group">
              <label className="label" htmlFor="Notes">Additional notes (optional)</label>
              <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Describe the issue..." maxLength={500} />
            </div>

            <div style={{ display: "flex", gap: "var(--s3)" }}>
              <button className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
              <button
                className="btn btn-danger"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={submit}
                disabled={!reason || submitting}
              >
                {submitting ? "Submitting..." : "Submit report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
