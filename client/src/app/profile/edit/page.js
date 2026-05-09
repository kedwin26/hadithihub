"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/navigation";
import api from "../../../lib/api";


export default function EditProfilePage() {
  const { user: authUser, isLoading } = useUser();
  const router = useRouter();
  const avatarRef = useRef(null);

  const [form, setForm] = useState({
    username: "",
    bio: "",
    profession: "",
    location: "",
    links: { github: "", portfolio: "", linkedin: "" },
  });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [toast, setToast] = useState(null);
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    if (!isLoading && !authUser) router.push("api/auth/login");
  }, [authUser, isLoading, router]);

  useEffect(() => {
    if (!authUser) return;
    api.get("/auth/me").then((d) => {
      const u = d.user;
      setAvatar(u.avatar || "");
      setForm({
        username: u.username || "",
        bio: u.bio || "",
        profession: u.profession || "",
        location: u.location || "",
        links: {
          github: u.links?.github || "",
          portfolio: u.links?.portfolio || "",
          linkedin: u.links?.linkedin || "",
        },
      });
    });
  }, [authUser]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch("/users/me", form);
      showToast("Profile saved!");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const form = new FormData();
      form.append("avatar", file);
      const data = await api.upload("/users/me/avatar", form);
      setAvatar(data.user.avatar);
      showToast("Avatar updated!");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));
  const setLink = (key) => (e) =>
    setForm((p) => ({ ...p, links: { ...p.links, [key]: e.target.value } }));

  if (isLoading) return null;

  return (
    <div className="container-narrow" style={{ paddingTop: "var(--s7)", paddingBottom: "var(--s9)" }}>
      <div style={{ marginBottom: "var(--s7)" }}>
        <button className="btn btn-ghost btn-sm" onClick={() => router.back()} style={{ marginBottom: "var(--s4)" }}>
          ← Back
        </button>
        <h1 className="display-lg">Edit Profile</h1>
      </div>

      {/* Avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--s5)", marginBottom: "var(--s7)" }}>
        <div style={{ position: "relative" }}>
          <img
            src={avatar || "/default-avatar.svg"}
            alt="Avatar"
            className="avatar avatar-xl"
            style={{ border: "3px solid var(--terra)" }}
          />
          {uploadingAvatar && (
            <div style={{
              position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)",
              borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div className="spin" style={{ width: 24, height: 24, border: "3px solid white", borderTopColor: "transparent", borderRadius: "50%" }} />
            </div>
          )}
        </div>
        <div>
          <p style={{ fontWeight: 600, marginBottom: "var(--s2)" }}>Profile photo</p>
          <p className="text-sm muted" style={{ marginBottom: "var(--s3)" }}>JPG, PNG or WebP. Max 5MB.</p>
          <button className="btn btn-secondary btn-sm" onClick={() => avatarRef.current?.click()}>
            Change photo
          </button>
          <input ref={avatarRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
        </div>
      </div>

      <div className="divider" />

      {/* Form fields */}
      <div style={{ display: "grid", gap: "var(--s5)", marginTop: "var(--s6)" }}>
        <div className="form-group">
          <label className="label" htmlFor="username">Username</label>
          <input className="input" value={form.username} onChange={set("username")} placeholder="your_username" maxLength={30} />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="Bio">
            Bio
            <span className="muted" style={{ fontWeight: 400, marginLeft: "var(--s2)" }}>
              ({form.bio.length}/500)
            </span>
          </label>
          <textarea className="input" value={form.bio} onChange={set("bio")} placeholder="Tell the world about yourself..." maxLength={500} rows={4} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s5)" }}>
          <div className="form-group">
            <label className="label" htmlFor="Profession">Profession / Title</label>
            <input className="input" value={form.profession} onChange={set("profession")} placeholder="Software Engineer" maxLength={100} />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="location">Location</label>
            <input className="input" value={form.location} onChange={set("location")} placeholder="Nairobi, Kenya" maxLength={100} />
          </div>
        </div>

        <div className="divider" />
        <p style={{ fontWeight: 600, marginBottom: "var(--s2)" }}>Links</p>

        {[
          { key: "github", label: "GitHub", placeholder: "https://github.com/username" },
          { key: "portfolio", label: "Portfolio", placeholder: "https://yoursite.com" },
          { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/username" },
        ].map(({ key, label, placeholder }) => (
          <div className="form-group" key={key} style={{ margin: 0 }}>
            <label className="label">{label}</label>
            <input className="input" value={form.links[key]} onChange={setLink(key)} placeholder={placeholder} type="url" />
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "var(--s3)", marginTop: "var(--s7)" }}>
        <button className="btn btn-secondary" onClick={() => router.back()}>
          Cancel
        </button>
        <button
          className="btn btn-primary"
          style={{ flex: 1, justifyContent: "center" }}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === "success" ? "✓" : "✗"} {toast.msg}
        </div>
      )}
    </div>
  );
}
