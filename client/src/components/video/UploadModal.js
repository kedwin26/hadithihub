"use client";

import { useState, useRef, useCallback } from "react";
import api from "../../lib/api";

const MAX_SIZE = 30 * 1024 * 1024; // 30MB
const MAX_DURATION = 10; // seconds
const ALLOWED = ["video/mp4", "video/webm", "video/quicktime"];

export default function UploadModal({ onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [compressing, setCompressing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const validateAndLoad = (f) => {
    setError("");
    if (!ALLOWED.includes(f.type)) {
      return setError("Invalid format. Allowed: MP4, WebM, MOV.");
    }
    if (f.size > MAX_SIZE) {
      return setError("File too large. Max 30MB.");
    }

    const url = URL.createObjectURL(f);
    const vid = document.createElement("video");
    vid.preload = "metadata";
    vid.src = url;
    vid.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      if (vid.duration > MAX_DURATION) {
        return setError(`Video too long (${vid.duration.toFixed(1)}s). Max 10 seconds.`);
      }
      setFile(f);
      setPreview(URL.createObjectURL(f));
    };
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) validateAndLoad(f);
  }, []);

  const compressWithFFmpeg = async (inputFile) => {
    // Lazy-load FFmpeg only when needed
    setCompressing(true);
    try {
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const { fetchFile } = await import("@ffmpeg/util");
      const ffmpeg = new FFmpeg();
      await ffmpeg.load();
      await ffmpeg.writeFile("input.mp4", await fetchFile(inputFile));
      // Compress: 720p, CRF 28, fast preset
      await ffmpeg.exec([
        "-i", "input.mp4",
        "-vf", "scale=-2:720",
        "-c:v", "libx264",
        "-crf", "28",
        "-preset", "fast",
        "-c:a", "aac",
        "-b:a", "96k",
        "output.mp4",
      ]);
      const data = await ffmpeg.readFile("output.mp4");
      const blob = new Blob([data.buffer], { type: "video/mp4" });
      return new File([blob], "compressed.mp4", { type: "video/mp4" });
    } catch {
      // Fallback: use original file if compression fails
      return inputFile;
    } finally {
      setCompressing(false);
    }
  };

  const handleSubmit = async () => {
    if (!file || !title.trim()) {
      return setError("Please select a video and enter a title.");
    }

    setError("");
    setUploading(true);
    setProgress(10);

    try {
      // Compress first
      const compressed = await compressWithFFmpeg(file);
      setProgress(40);

      const form = new FormData();
      form.append("video", compressed);
      form.append("title", title.trim());
      form.append("description", description.trim());
      form.append("tags", tags);
      setProgress(60);

      const data = await api.upload("videos", form);
      setProgress(100);
      onSuccess?.(data.video);
      onClose();
    } catch (err) {
      setError(err.message || "Upload failed. Try again.");
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal__header">
          <div>
            <h2 className="display-sm">Upload a video</h2>
            <p className="text-sm muted">Max 10 seconds · 30MB · MP4, WebM, or MOV</p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ fontSize: "1.25rem" }}>
            ✕
          </button>
        </div>

        {!file ? (
          <div
            className={`dropzone ${dragOver ? "active" : ""}`}
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileRef.current?.click()}
          >
            <div className="dropzone__icon">🎬</div>
            <p style={{ fontWeight: 600 }}>Drag & drop your video here</p>
            <p className="dropzone__hint">or click to browse</p>
            <input
              ref={fileRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              style={{ display: "none" }}
              onChange={(e) => e.target.files[0] && validateAndLoad(e.target.files[0])}
            />
          </div>
        ) : (
          <div>
            <video
              src={preview}
              controls
              style={{ width: "100%", maxHeight: 240, borderRadius: "var(--r-md)", background: "var(--ink)", marginBottom: "var(--s4)" }}
            />
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setFile(null); setPreview(null); }}
              style={{ marginBottom: "var(--s5)" }}
            >
              ← Change video
            </button>
          </div>
        )}

        {file && (
          <div style={{ marginTop: "var(--s5)" }}>
            <div className="form-group">
              <label className="label" htmlFor="title">Title *</label>
              <input
                className="input"
                placeholder="What's this video about?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="form-group">
              <label className="label" htmlFor="description">Description</label>
              <textarea
                className="input"
                placeholder="Add a description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                style={{ minHeight: 80 }}
              />
            </div>

            <div className="form-group">
              <label className="label" htmlFor="comma-separated">Tags (comma-separated)</label>
              <input
                className="input"
                placeholder="coding, design, life..."
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
          </div>
        )}

        {error && (
          <p style={{ color: "#dc2626", fontSize: "0.875rem", marginTop: "var(--s3)" }}>{error}</p>
        )}

        {(compressing || uploading) && (
          <div style={{ marginTop: "var(--s3)" }}>
            <p className="text-sm muted" style={{ marginBottom: "var(--s2)" }}>
              {compressing ? "Compressing video..." : `Uploading... ${progress}%`}
            </p>
            <div className="progress-bar">
              <div className="progress-bar__fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {file && (
          <div style={{ display: "flex", gap: "var(--s3)", marginTop: "var(--s5)" }}>
            <button className="btn btn-secondary" onClick={onClose} disabled={uploading}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: "center" }}
              onClick={handleSubmit}
              disabled={uploading || compressing || !title.trim()}
            >
              {compressing ? "Compressing..." : uploading ? "Uploading..." : "Publish video"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
