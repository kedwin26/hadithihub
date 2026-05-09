"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "../../../lib/api";
import { connectSocket, getSocket } from "../../../lib/socket";



let typingTimeout = null;
let lastEmitTime = 0;

export default function VideoPage() {
  const { id } = useParams();
  const { user } = useUser();
  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [typingText, setTypingText] = useState("");
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [following, setFollowing] = useState(false);
  const viewCounted = useRef(false);

  // ── Load video & comments ────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [vData, cData] = await Promise.all([
          api.get(`/videos/${id}`),
          api.get(`/comments/${id}`),
        ]);
        setVideo(vData.video);
        setComments(cData.comments || []);

        if (user) {
          const [likeData, followData] = await Promise.all([
            api.get(`/likes/status/${id}`).catch(() => ({ liked: false })),
            vData.video.uploader?._id
              ? api.get(`/follows/status/${vData.video.uploader._id}`).catch(() => ({ following: false }))
              : { following: false },
          ]);
          setLiked(likeData.liked);
          setFollowing(followData.following);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user]);

  // ── View count ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (video && !viewCounted.current) {
      viewCounted.current = true;
      api.post(`/videos/${id}/view`).catch(() => {});
    }
  }, [video, id]);

  // ── Socket.io ────────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = connectSocket();
    socket.emit("join_video_room", id);

    socket.on("new_comment", (comment) => {
      setComments((prev) => [comment, ...prev]);
    });

    socket.on("delete_comment", ({ commentId }) => {
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    });

    socket.on("typing_indicator", ({ text }) => {
      setTypingText(text);
      clearTimeout(typingTimeout);
      if (text) {
        typingTimeout = setTimeout(() => setTypingText(""), 3500);
      }
    });

    return () => {
      socket.emit("leave_video_room", id);
      socket.off("new_comment");
      socket.off("delete_comment");
      socket.off("typing_indicator");
    };
  }, [id]);

  // ── Typing emit (debounced: max once per 3s) ─────────────────────────────
  const handleCommentTyping = (val) => {
    setCommentText(val);
    if (!user) return;
    const now = Date.now();
    if (now - lastEmitTime > 3000) {
      lastEmitTime = now;
      getSocket().emit("user_typing", {
        videoId: id,
        userId: user.sub,
        username: user.name,
      });
    }
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      getSocket().emit("typing_stopped", { videoId: id, userId: user.sub });
    }, 2000);
  };

  // ── Post comment ─────────────────────────────────────────────────────────
  const submitComment = async () => {
    if (!commentText.trim() || !user) return;
    setSubmitting(true);
    try {
      await api.post(`/comments/${id}`, { text: commentText.trim() });
      getSocket().emit("typing_stopped", { videoId: id, userId: user.sub });
      setCommentText("");
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLike = async () => {
    if (!user) return alert("Sign in to like videos");
    const prev = liked;
    setLiked(!prev);
    setVideo((v) => ({ ...v, likeCount: v.likeCount + (prev ? -1 : 1) }));
    try {
      await api.post(`/likes/${id}`);
    } catch {
      setLiked(prev);
    }
  };

  const toggleFollow = async () => {
    if (!user) return;
    const prev = following;
    setFollowing(!prev);
    try {
      await api.post(`/follows/${video.uploader._id}`);
    } catch {
      setFollowing(prev);
    }
  };

  const deleteComment = async (commentId) => {
    if (!confirm("Delete this comment?")) return;
    try {
      await api.delete(`/comments/${commentId}`);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: "var(--s7)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "var(--s6)" }}>
          <div className="skeleton" style={{ aspectRatio: "9/16", maxHeight: "70vh", borderRadius: "var(--r-md)" }} />
          <div>
            <div className="skeleton" style={{ height: 28, marginBottom: "var(--s4)" }} />
            <div className="skeleton" style={{ height: 16, width: "60%", marginBottom: "var(--s3)" }} />
          </div>
        </div>
      </div>
    );
  }

  if (!video) return <div className="container" style={{ paddingTop: "var(--s7)" }}><p>Video not found.</p></div>;

  const uploader = video.uploader;
  const isOwner = user?.sub === uploader?.auth0Id;

  return (
    <div className="container" style={{ paddingTop: "var(--s6)", paddingBottom: "var(--s8)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "var(--s7)", alignItems: "start" }}>
        {/* ── Video Player ─────────────────────────────────────────────── */}
        <div>
          <div className="video-player-wrap">
            <video
              src={video.videoUrl}
              controls
              autoPlay
              loop
              playsInline
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
              >
              <track kind="captions" src="../../../../public/empty.vtt" srcLang="en" label="English" default />
              
            </video>
          </div>

          <div style={{ marginTop: "var(--s5)" }}>
            <h1 className="display-sm" style={{ marginBottom: "var(--s3)" }}>{video.title}</h1>
            {video.description && (
              <p className="text-md muted" style={{ marginBottom: "var(--s4)" }}>{video.description}</p>
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              {/* Uploader */}
              <Link href={`/profile/${uploader?._id}`} style={{ display: "flex", alignItems: "center", gap: "var(--s3)" }}>
                <img src={uploader?.avatar || "/default-avatar.svg"} alt={uploader?.name || "User"} style={{ objectFit: "cover" }} className="avatar avatar-md" />
                <div>
                  <p style={{ fontWeight: 600 }}>{uploader?.name}</p>
                  <p className="text-sm muted">{uploader?.followerCount?.toLocaleString()} followers</p>
                </div>
              </Link>

              <div style={{ display: "flex", gap: "var(--s3)" }}>
                <button className={`like-btn ${liked ? "liked" : ""}`} onClick={toggleLike}>
                  <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  {video.likeCount?.toLocaleString()}
                </button>

                {user && !isOwner && (
                  <button
                    className={`btn btn-sm follow-btn ${following ? "btn-secondary" : "btn-primary"}`}
                    onClick={toggleFollow}
                  >
                    {following ? "Following" : "Follow"}
                  </button>
                )}
              </div>
            </div>

            <div className="divider" />
            <p className="text-sm muted">
              👁 {video.viewCount?.toLocaleString()} views · 💬 {video.commentCount?.toLocaleString()} comments
            </p>

            {video.tags?.length > 0 && (
              <div style={{ display: "flex", gap: "var(--s2)", flexWrap: "wrap", marginTop: "var(--s3)" }}>
                {video.tags.map((tag) => (
                  <span key={tag} className="badge badge-terra">#{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Comments ─────────────────────────────────────────────────── */}
        <div style={{ position: "sticky", top: 80 }}>
          <h3 className="display-sm" style={{ marginBottom: "var(--s4)" }}>
            Comments ({video.commentCount || comments.length})
          </h3>

          {/* Comment input */}
          {user ? (
            <div style={{ marginBottom: "var(--s4)" }}>
              <textarea
                className="input"
                placeholder="Leave a comment..."
                value={commentText}
                onChange={(e) => handleCommentTyping(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), submitComment())}
                rows={3}
                style={{ minHeight: 80 }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "var(--s2)" }}>
                <p className="typing-indicator">{typingText}</p>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={submitComment}
                  disabled={submitting || !commentText.trim()}
                >
                  {submitting ? "Posting..." : "Post"}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: "var(--s4)", padding: "var(--s4)", background: "var(--parchment)", borderRadius: "var(--r-md)", textAlign: "center" }}>
              <Link href="/api/auth/login" className="btn btn-primary btn-sm">Sign in to comment</Link>
            </div>
          )}

          {/* Comment list */}
          <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
            {comments.length === 0 ? (
              <p className="muted text-sm" style={{ padding: "var(--s5) 0", textAlign: "center" }}>
                No comments yet. Be the first!
              </p>
            ) : (
              comments.map((c) => (
                <div key={c._id} className="comment">
                  <img src={c.author?.avatar || "/default-avatar.svg"} alt={c.author?.name || "User"} className="avatar avatar-sm" />
                  <div className="comment__body">
                    <p className="comment__author">{c.author?.name}</p>
                    <p className="comment__text">{c.text}</p>
                    <div className="comment__actions">
                      <span className="text-xs muted">{new Date(c.createdAt).toLocaleDateString()}</span>
                      {user && (user.sub === c.author?.auth0Id || user["https://hadithihub.com/role"] === "admin") && (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: "#dc2626", fontSize: "0.75rem" }}
                          onClick={() => deleteComment(c._id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
