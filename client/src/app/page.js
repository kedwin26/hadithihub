"use client";

import { useState, useEffect, useReducer, useCallback } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import VideoGrid from "../components/video/VideoGrid";
import UploadModal from "../components/video/UploadModal";
import api from "../lib/api";
import Link from "next/link";

const initialState = {
  videos: [],
  loading: true,
  hasMore: false,
  page: 1,
};

function reducer(state, action) {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true };
    case "FETCH_SUCCESS":
      return {
        loading: false,
        videos: action.reset ? action.videos : [...state.videos, ...action.videos],
        hasMore: action.hasMore,
        page: action.page,
      };
    default:
      return state;
  }
}

export default function HomePage() {
  const { user } = useUser();
  const [state, dispatch] = useReducer(reducer, initialState);
  const { videos, loading, hasMore, page } = state;
  const [uploadOpen, setUploadOpen] = useState(false);
  const [tab, setTab] = useState("discover");

  const fetchVideos = useCallback(async (p = 1, reset = false) => {
    const endpoint =
      tab === "following"
        ? `/videos/feed/following?page=${p}`
        : `/videos?page=${p}`;
    const data = await api.get(endpoint).catch(() => ({}));
    dispatch({
      type: "FETCH_SUCCESS",
      videos: data.videos || [],
      hasMore: p < (data.pagination?.pages || 1),
      page: p,
      reset,
    });
  }, [tab]);

  useEffect(() => {
    dispatch({ type: "FETCH_START" });
    fetchVideos(1, true);
  }, [tab, fetchVideos]);

  const loadMore = () => fetchVideos(page + 1, false);

  return (
    <div className="container" style={{ paddingTop: "var(--s6)", paddingBottom: "var(--s8)" }}>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      {!user && (
        <div
          style={{
            textAlign: "center",
            padding: "var(--s9) var(--s5) var(--s8)",
            maxWidth: 640,
            margin: "0 auto",
          }}
        >
          <p className="text-sm muted" style={{ letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "var(--s3)" }}>
            Short-form video for creators
          </p>
          <h1 className="display-xl" style={{ marginBottom: "var(--s5)" }}>
            Your story,{" "}
            <span style={{ color: "var(--terra)", fontStyle: "italic" }}>in 10 seconds</span>
          </h1>
          <p className="text-lg muted" style={{ marginBottom: "var(--s6)" }}>
            Upload, showcase, and discover short videos from creators around the world.
          </p>
          <Link href="/api/auth/login" className="btn btn-primary btn-lg">
            Get started — it&apos;s free
          </Link>
        </div>
      )}

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--s5)" }}>
        <div style={{ display: "flex", gap: "var(--s2)" }}>
          {["discover", ...(user ? ["following"] : [])].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`btn btn-sm ${tab === t ? "btn-primary" : "btn-ghost"}`}
              style={{ textTransform: "capitalize" }}
            >
              {t}
            </button>
          ))}
        </div>
        {user && (
          <button className="btn btn-primary btn-sm" onClick={() => setUploadOpen(true)}>
            + Upload
          </button>
        )}
      </div>

      {/* ── Grid ──────────────────────────────────────────────────────────── */}
      <VideoGrid videos={videos} loading={loading} />

      {hasMore && !loading && (
        <div style={{ textAlign: "center", marginTop: "var(--s7)" }}>
          <button className="btn btn-secondary" onClick={loadMore}>
            Load more
          </button>
        </div>
      )}

      {uploadOpen && (
        <UploadModal
          onClose={() => setUploadOpen(false)}
          onSuccess={(v) =>
            dispatch({ type: "FETCH_SUCCESS", videos: [v, ...videos], hasMore, page, reset: true })
          }
        />
      )}
    </div>
  );
}