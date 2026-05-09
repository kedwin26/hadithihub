"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "../../lib/api";


export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/stats").then((d) => {
      setStats(d.stats);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ height: 36, width: 200, marginBottom: "var(--s6)" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--s4)" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 100, borderRadius: "var(--r-md)" }} />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers, icon: "👥", href: "admin/users" },
    { label: "Total Videos", value: stats?.totalVideos, icon: "🎬", href: "admin/content" },
    { label: "Pending Flags", value: stats?.pendingFlags, icon: "🚩", href: "admin/flags", alert: stats?.pendingFlags > 0 },
    { label: "Suspended Users", value: stats?.suspendedUsers, icon: "🚫", href: "admin/users?suspended=true" },
  ];

  return (
    <div>
      <div style={{ marginBottom: "var(--s7)" }}>
        <h1 className="display-lg">Dashboard</h1>
        <p className="muted text-sm" style={{ marginTop: "var(--s2)" }}>
          Platform overview — {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--s4)", marginBottom: "var(--s8)" }}>
        {statCards.map((s) => (
          <Link key={s.label} href={s.href} style={{ textDecoration: "none" }}>
            <div className="stat-card" style={{ cursor: "pointer", borderColor: s.alert ? "var(--terra)" : undefined }}>
              <div style={{ fontSize: "1.75rem", marginBottom: "var(--s2)" }}>{s.icon}</div>
              <div className="stat-card__value" style={{ color: s.alert ? "var(--terra)" : undefined }}>
                {s.value?.toLocaleString() ?? "—"}
              </div>
              <div className="stat-card__label">{s.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Top Videos */}
      <div>
        <h2 className="display-sm" style={{ marginBottom: "var(--s5)" }}>Top 5 Videos</h2>
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Title</th>
              <th>Uploader</th>
              <th>Views</th>
              <th>Likes</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {stats?.topVideos?.map((v, i) => (
              <tr key={v._id}>
                <td style={{ color: "var(--ink-muted)", fontWeight: 600 }}>{i + 1}</td>
                <td style={{ maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.title}</td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--s2)" }}>
                    <img src={v.uploader?.avatar} alt="" width={32} height={32} className="avatar avatar-xs" />
                    <span className="text-sm">{v.uploader?.name}</span>
                  </div>
                </td>
                <td>{v.viewCount?.toLocaleString()}</td>
                <td>{v.likeCount?.toLocaleString()}</td>
                <td>
                  <Link href={`/video/${v._id}`} className="btn btn-ghost btn-sm">
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
