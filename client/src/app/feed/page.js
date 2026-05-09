"use client";

import { useState, useEffect } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/navigation";
import VideoGrid from "../../components/video/VideoGrid";
import api from "../../lib/api";

export default function FeedPage() {
  const { user, isLoading: authLoading } = useUser();
  const router = useRouter();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("api/auth/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const data = await api.get(`/videos/feed/following?page=1`);
        setVideos(data.videos || []);
        setHasMore(1 < (data.pagination?.pages || 1));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const loadMore = async () => {
    const next = page + 1;
    setPage(next);
    const data = await api.get(`/videos/feed/following?page=${next}`);
    setVideos((prev) => [...prev, ...(data.videos || [])]);
    setHasMore(next < (data.pagination?.pages || 1));
  };

  if (authLoading) return null;

  return (
    <div className="container" style={{ paddingTop: "var(--s6)", paddingBottom: "var(--s8)" }}>
      <div style={{ marginBottom: "var(--s6)" }}>
        <h1 className="display-lg">Your Feed</h1>
        <p className="muted text-sm" style={{ marginTop: "var(--s2)" }}>
          Latest videos from creators you follow
        </p>
      </div>

      {!loading && videos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">🎯</div>
          <p className="display-sm" style={{ marginBottom: "var(--s3)" }}>Your feed is empty</p>
          <p className="muted" style={{ marginBottom: "var(--s5)" }}>
            Follow some creators to see their videos here
          </p>
          <a href="/explore" className="btn btn-primary">Discover creators</a>
        </div>
      ) : (
        <>
          <VideoGrid videos={videos} loading={loading} />
          {hasMore && (
            <div style={{ textAlign: "center", marginTop: "var(--s7)" }}>
              <button className="btn btn-secondary" onClick={loadMore}>Load more</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
