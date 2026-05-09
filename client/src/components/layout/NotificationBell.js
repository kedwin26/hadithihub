"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import Link from "next/link";
import api from "../../lib/api";

export default function NotificationBell() {
  const { user } = useUser();
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    if (!user) return;
    api.get("/notifications/unread-count").then((d) => setCount(d.count || 0)).catch(() => {});
    const interval = setInterval(() => {
      api.get("/notifications/unread-count").then((d) => setCount(d.count || 0)).catch(() => {});
    }, 60_000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const openPanel = async () => {
    setOpen(!open);
    if (!open) {
      try {
        const data = await api.get("/notifications");
        setNotifications(data.notifications || []);
        if (count > 0) {
          api.patch("notifications/read-all").then(() => setCount(0));
        }
      } catch {}
    }
  };

  if (!user) return null;

  const TYPE_ICON = { follow: "👥", comment: "💬", mention: "@", like: "❤️", system: "📢" };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        className="btn btn-ghost btn-icon"
        onClick={openPanel}
        style={{ position: "relative", fontSize: "1.25rem" }}
      >
        🔔
        {count > 0 && (
          <span style={{
            position: "absolute", top: 2, right: 2,
            background: "var(--terra)", color: "white",
            fontSize: "0.625rem", fontWeight: 700,
            width: 16, height: 16,
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 8px)",
          width: 340, background: "white",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-md)",
          boxShadow: "var(--shadow-lg)",
          zIndex: 300,
          overflow: "hidden",
          animation: "slideUp 180ms var(--ease)",
        }}>
          <div style={{ padding: "var(--s4) var(--s5)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
            <p style={{ fontWeight: 600 }}>Notifications</p>
          </div>
          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "var(--s6)", textAlign: "center", color: "var(--ink-muted)", fontSize: "0.875rem" }}>
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n._id}
                  href={n.link || "/"}
                  onClick={() => setOpen(false)}
                  style={{
                    display: "flex", gap: "var(--s3)", padding: "var(--s4) var(--s5)",
                    borderBottom: "1px solid var(--border)",
                    background: n.isRead ? "white" : "var(--terra-pale)",
                    textDecoration: "none",
                  }}
                >
                  <span style={{ fontSize: "1.125rem", flexShrink: 0 }}>{TYPE_ICON[n.type] || "🔔"}</span>
                  <div>
                    <p style={{ fontSize: "0.875rem" }}>{n.message}</p>
                    <p className="text-xs muted">{new Date(n.createdAt).toLocaleDateString()}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
