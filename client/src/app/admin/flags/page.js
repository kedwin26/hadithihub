"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "../../../lib/api";

export default function AdminFlagsPage() {
  const [flags, setFlags] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);

useEffect(() => {
  let isMounted = true;
  const abortController = new AbortController();

  const fetchFlags = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/admin/flags?status=${status}&page=${page}`, {
        signal: abortController.signal,
      });
      if (isMounted) {
        setFlags(data.flags || []);
        setTotal(data.pagination?.total || 0);
      }
    } catch (error) {
      if (isMounted && error.name !== 'AbortError') {
        // Optionally log or handle other errors
        console.error('Failed to load flags:', error);
      }
    } finally {
      if (isMounted) setLoading(false);
    }
  };

  fetchFlags();

  return () => {
    isMounted = false;
    abortController.abort(); // Cancel pending request on cleanup
  };
}, [status, page]); // Re-run when status or page changes

  const resolve = async (flagId, action) => {
    const label = action === "delete" ? "delete the video" : "dismiss this flag";
    if (!confirm(`Are you sure you want to ${label}?`)) return;
    try {
      await api.patch(`admin/flags/${flagId}/resolve`, { action });
      setFlags((f) => f.filter((x) => x._id !== flagId));
      setTotal((t) => t - 1);
    } catch (err) {
      alert(err.message);
    }
  };

  const REASON_LABELS = {
    inappropriate: "🔞 Inappropriate",
    spam: "📢 Spam",
    copyright: "©️ Copyright",
    other: "❓ Other",
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "var(--s6)" }}>
        <div>
          <h1 className="display-lg">Flagged Content</h1>
          <p className="muted text-sm" style={{ marginTop: "var(--s1)" }}>{total} {status} reports</p>
        </div>
        <div style={{ display: "flex", gap: "var(--s2)" }}>
          {["pending", "reviewed", "dismissed"].map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              className={`btn btn-sm ${status === s ? "btn-primary" : "btn-secondary"}`}
              style={{ textTransform: "capitalize" }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s3)" }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 100, borderRadius: "var(--r-md)" }} />
          ))}
        </div>
      ) : flags.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">✅</div>
          <p className="display-sm">No {status} reports</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s4)" }}>
          {flags.map((flag) => (
            <div key={flag._id} className="card" style={{ padding: "var(--s5)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "120px 1fr auto", gap: "var(--s5)", alignItems: "center" }}>
                {/* Thumbnail */}
                <div style={{ aspectRatio: "9/16", background: "var(--ink)", borderRadius: "var(--r-sm)", overflow: "hidden", maxWidth: 80 }}>
                  {flag.video?.thumbnailUrl && (
                    <img src={flag.video.thumbnailUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  )}
                </div>

                {/* Info */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--s3)", marginBottom: "var(--s2)" }}>
                    <span className="badge badge-terra">{REASON_LABELS[flag.reason] || flag.reason}</span>
                    <span className="text-xs muted">{new Date(flag.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p style={{ fontWeight: 600, marginBottom: "var(--s1)" }}>
                    {flag.video?.title || "Deleted video"}
                  </p>
                  <p className="text-sm muted">
                    Uploaded by: {flag.video?.uploader?.name} · Reported by:{" "}
                    <Link href={`profile/${flag.reporter?._id}`} style={{ color: "var(--terra)" }}>
                      {flag.reporter?.name}
                    </Link>
                  </p>
                  {flag.notes && (
                    <p className="text-sm" style={{ marginTop: "var(--s2)", padding: "var(--s2) var(--s3)", background: "var(--parchment)", borderRadius: "var(--r-sm)", borderLeft: "3px solid var(--terra)" }}>
                      &quot;{flag.notes}&quot;
                    </p>
                  )}
                </div>

                {/* Actions */}
                {status === "pending" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--s2)" }}>
                    <Link href={`video/${flag.video?._id}`} className="btn btn-secondary btn-sm" target="_blank">
                      View video
                    </Link>
                    <button className="btn btn-danger btn-sm" onClick={() => resolve(flag._id, "delete")}>
                      Delete video
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => resolve(flag._id, "dismiss")}>
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {total > 20 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "var(--s3)", marginTop: "var(--s5)" }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
          <span className="text-sm muted" style={{ display: "flex", alignItems: "center" }}>Page {page}</span>
          <button className="btn btn-secondary btn-sm" onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / 20)}>Next →</button>
        </div>
      )}
    </div>
  );
}
