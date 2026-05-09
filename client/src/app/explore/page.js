"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import VideoGrid from "../../components/video/VideoGrid";
import api from "../../lib/api";



export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("videos"); // videos | users
  const [videos, setVideos] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  const search = async (q) => {
    if (!q.trim()) {
      setVideos([]);
      setUsers([]);
      return;
    }
    setLoading(true);
    try {
      if (mode === "videos") {
        const data = await api.get(`/videos/search?q=${encodeURIComponent(q)}`);
        setVideos(data.videos || []);
      } else {
        const data = await api.get(`/users/search?q=${encodeURIComponent(q)}`);
        setUsers(data.users || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 350);
    return () => clearTimeout(debounceRef.current);
  }, [query, mode]);

  // Load trending on mount
  useEffect(() => {
    const loadTrending = async () => {
      setLoading(true);
      try {
        const data = await api.get("/videos?limit=12");
        setVideos(data.videos || []);
      } finally {
        setLoading(false);
      }
    };
    loadTrending();
  }, []);

  return (
    <div className="container" style={{ paddingTop: "var(--s6)", paddingBottom: "var(--s8)" }}>
      {/* Search bar */}
      <div style={{ maxWidth: 600, margin: "0 auto var(--s7)" }}>
        <h1 className="display-lg" style={{ textAlign: "center", marginBottom: "var(--s5)" }}>
          Explore <span style={{ color: "var(--terra)", fontStyle: "italic" }}>stories</span>
        </h1>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: "var(--s4)", top: "50%", transform: "translateY(-50%)", fontSize: "1.125rem", pointerEvents: "none" }}>
            🔍
          </span>
          <input
            className="input"
            placeholder={mode === "videos" ? "Search videos..." : "Search creators..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ paddingLeft: "var(--s7)", fontSize: "1rem" }}
            autoFocus
          />
        </div>
        <div style={{ display: "flex", gap: "var(--s2)", marginTop: "var(--s3)", justifyContent: "center" }}>
          {["videos", "users"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`btn btn-sm ${mode === m ? "btn-primary" : "btn-secondary"}`}
              style={{ textTransform: "capitalize" }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {mode === "videos" ? (
        <>
          {!query && (
            <p className="text-sm muted" style={{ marginBottom: "var(--s4)" }}>
              ✨ Trending videos
            </p>
          )}
          <VideoGrid videos={videos} loading={loading} />
        </>
      ) : (
        <div>
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "var(--s4)" }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card" style={{ padding: "var(--s5)", display: "flex", gap: "var(--s4)", alignItems: "center" }}>
                  <div className="skeleton" style={{ width: 48, height: 48, borderRadius: "50%", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: 16, marginBottom: "var(--s2)" }} />
                    <div className="skeleton" style={{ height: 12, width: "60%" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">👤</div>
              <p className="display-sm">No creators found</p>
              {query && <p className="muted">Try a different search term</p>}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "var(--s4)" }}>
              {users.map((u) => (
                <Link key={u._id} href={`profile/${u._id}`} style={{ textDecoration: "none" }}>
                  <div className="card" style={{ padding: "var(--s5)" }}>
                    <div style={{ display: "flex", gap: "var(--s4)", alignItems: "flex-start", marginBottom: "var(--s3)" }}>
                      <img src={u.avatar} alt={u.name} className="avatar avatar-md" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name}</p>
                        {u.username && <p className="text-xs muted">@{u.username}</p>}
                        {u.profession && <p className="text-sm" style={{ color: "var(--terra)", marginTop: 2 }}>{u.profession}</p>}
                      </div>
                    </div>
                    {u.bio && (
                      <p className="text-sm muted" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {u.bio}
                      </p>
                    )}
                    <div style={{ display: "flex", gap: "var(--s4)", marginTop: "var(--s3)" }}>
                      <span className="text-xs muted">👥 {u.followerCount?.toLocaleString()}</span>
                      <span className="text-xs muted">🎬 {u.videoCount}</span>
                      <span className="text-xs muted">👁 {u.totalViews?.toLocaleString()}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
