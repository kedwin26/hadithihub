"use client";

import Link from "next/link";


function formatDuration(s) {
  const sec = Math.round(s);
  return `0:${sec.toString().padStart(2, "0")}`;
}

function formatCount(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n?.toString() || "0";
}

function SkeletonCard() {
  return (
    <div className="card">
      <div className="skeleton" style={{ aspectRatio: "9/16" }} />
      <div style={{ padding: "var(--s4)", display: "flex", flexDirection: "column", gap: "var(--s2)" }}>
        <div className="skeleton" style={{ height: 18, width: "80%", borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 14, width: "50%", borderRadius: 4 }} />
      </div>
    </div>
  );
}

export default function VideoGrid({ videos, loading }) {
  if (loading && videos.length === 0) {
    return (
      <div className="video-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (!loading && videos.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">🎬</div>
        <p className="display-sm" style={{ marginBottom: "var(--s3)" }}>No videos yet</p>
        <p className="muted">Be the first to upload something amazing.</p>
      </div>
    );
  }

  return (
    <div className="video-grid">
      {videos.map((video) => (
        <Link key={video._id} href={`video/${video._id}`} style={{ textDecoration: "none" }}>
          <article className="card video-card">
            <div className="video-card__thumb">
              <img
                src={video.thumbnailUrl || "placeholder-thumb.jpg"}
                alt={video.title}
                loading="lazy"
              />
              {video.duration > 0 && (
                <span className="video-card__duration">{formatDuration(video.duration)}</span>
              )}
            </div>
            <div className="video-card__body">
              <h3 className="video-card__title">{video.title}</h3>
              <div className="video-card__uploader">
                <img
                  src={video.uploader?.avatar || "default-avatar.svg"}
                  alt={video.uploader?.name}                  
                  className="avatar avatar-xs"
                />
                <span className="text-sm">{video.uploader?.name}</span>
              </div>
              <div className="video-card__meta">
                <span>👁 {formatCount(video.viewCount)}</span>
                <span>❤️ {formatCount(video.likeCount)}</span>
              </div>
            </div>
          </article>
        </Link>
      ))}
    </div>
  );
}
