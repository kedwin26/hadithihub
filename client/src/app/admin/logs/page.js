"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "../../../lib/api";

const ACTION_ICONS = {
  delete_video: "🗑️",
  suspend_user: "🚫",
  unsuspend_user: "✅",
  dismiss_flag: "👋",
  warn_user: "⚠️",
};

const ACTION_LABELS = {
  delete_video: "Deleted video",
  suspend_user: "Suspended user",
  unsuspend_user: "Unsuspended user",
  dismiss_flag: "Dismissed flag",
  warn_user: "Warned user",
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/moderation-logs").then((d) => {
      setLogs(d.logs || []);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <div style={{ marginBottom: "var(--s6)" }}>
        <h1 className="display-lg">Moderation Logs</h1>
        <p className="muted text-sm" style={{ marginTop: "var(--s1)" }}>Last 100 admin actions</p>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s3)" }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 64, borderRadius: "var(--r-md)" }} />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">📋</div>
          <p className="display-sm">No moderation actions yet</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s2)" }}>
          {logs.map((log) => (
            <div key={log._id} className="card" style={{ padding: "var(--s4) var(--s5)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--s4)" }}>
                <span style={{ fontSize: "1.5rem" }}>{ACTION_ICONS[log.action]}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: "var(--s3)", alignItems: "center", marginBottom: "var(--s1)", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600 }}>{ACTION_LABELS[log.action]}</span>
                    {log.targetUser && (
                      <Link href={`/profile/${log.targetUser._id}`} style={{ color: "var(--terra)", fontSize: "0.875rem" }}>
                        @{log.targetUser.username || log.targetUser.name}
                      </Link>
                    )}
                    {log.targetVideo && (
                      <span className="text-sm muted">
                        &quot;{log.targetVideo.title}&quot;
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "var(--s4)" }}>
                    <span className="text-xs muted">
                      By: {log.admin?.name || "Unknown admin"}
                    </span>
                    <span className="text-xs muted">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                    {log.notes && (
                      <span className="text-xs muted">Note: {log.notes}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
