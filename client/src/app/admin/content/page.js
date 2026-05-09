"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "../../../lib/api";


export default function AdminContentPage() {
  const [videos, setVideos] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const fetchVideos = async () => {
      setLoading(true);
      try {
        const data = await api.get(`/videos?page=${page}&limit=20`, {
          signal: abortController.signal,
        });
        if (isMounted) {
          setVideos(data.videos || []);
          setTotal(data.pagination?.total || 0);
        }
      } catch (error) {
        if (isMounted && error.name !== "AbortError") {
          console.error("Failed to load videos:", error);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchVideos();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [page]);

  const deleteVideo = async (videoId, title) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/videos/${videoId}`, { body: { reason: "Admin deletion" } });
      setVideos((v) => v.filter((x) => x._id !== videoId));
      setTotal((t) => t - 1);
    } catch (err) { alert(err.message); }
  };

  return (
    <div>
      <div style={{ marginBottom: "var(--s6)" }}>
        <h1 className="display-lg">All Videos</h1>
        <p className="muted text-sm" style={{ marginTop: "var(--s1)" }}>{total.toLocaleString()} total videos</p>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Video</th>
            <th>Uploader</th>
            <th>Views</th>
            <th>Likes</th>
            <th>Flags</th>
            <th>Uploaded</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j}><div className="skeleton" style={{ height: 14 }} /></td>
                  ))}
                </tr>
              ))
            : videos.map((v) => (
                <tr key={v._id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--s3)" }}>
                      <img
                        src={v.thumbnailUrl || "/placeholder-thumb.jpg"}
                        alt=""
                        style={{ width: 48, aspectRatio: "9/16", objectFit: "cover", borderRadius: "var(--r-sm)" }}
                      />
                      <span className="text-sm" style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {v.title}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--s2)" }}>
                      <img src={v.uploader?.avatar} alt="" className="avatar avatar-xs" />
                      <span className="text-sm">{v.uploader?.name}</span>
                    </div>
                  </td>
                  <td className="text-sm">{v.viewCount?.toLocaleString()}</td>
                  <td className="text-sm">{v.likeCount?.toLocaleString()}</td>
                  <td>
                    {v.flagCount > 0 && (
                      <span className="badge badge-terra">{v.flagCount} flags</span>
                    )}
                  </td>
                  <td className="text-sm muted">{new Date(v.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: "flex", gap: "var(--s2)" }}>
                      <Link href={`/video/${v._id}`} className="btn btn-ghost btn-sm" target="_blank">View</Link>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteVideo(v._id, v.title)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
        </tbody>
      </table>

      {total > 20 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "var(--s3)", marginTop: "var(--s5)" }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
          <span className="text-sm muted" style={{ display: "flex", alignItems: "center" }}>Page {page} of {Math.ceil(total / 20)}</span>
          <button className="btn btn-secondary btn-sm" onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / 20)}>Next →</button>
        </div>
      )}
    </div>
  );
}
