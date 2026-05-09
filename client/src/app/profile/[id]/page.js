"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0/client";
import Link from "next/link";
import VideoGrid from "../../../components/video/VideoGrid";
import api from "../../../lib/api";


export default function ProfilePage() {
  const { id } = useParams();
  const { user: authUser } = useUser();
  const [profile, setProfile] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [tab, setTab] = useState("videos"); // videos | liked

  const isMe = id === "me" || authUser?.sub === profile?.auth0Id;

  useEffect(() => {
  const load = async () => {
    try {
      let profileData;

      if (id === "me") {
        // own profile — requires auth
        profileData = await api.get("/auth/me");
      } else {
        // public profile — no auth needed
        profileData = await api.get(`/users/${id}`);
      }

      setProfile(profileData.user);

      const videoData = await api.get(`/videos?uploader=${profileData.user._id}&limit=20`);
      setVideos(videoData.videos || []);

      if (authUser && id !== "me") {
        const followData = await api
          .get(`/follows/status/${profileData.user._id}`)
          .catch(() => ({ following: false }));
        setFollowing(followData.following);
      }
    } finally {
      setLoading(false);
    }
  };
  load();
}, [id, authUser]);

  const toggleFollow = async () => {
    if (!authUser) return;
    const prev = following;
    setFollowing(!prev);
    setProfile((p) => ({ ...p, followerCount: p.followerCount + (prev ? -1 : 1) }));
    try {
      await api.post(`/follows/${profile._id}`);
    } catch {
      setFollowing(prev);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div style={{ paddingTop: "var(--s7)" }}>
          <div style={{ display: "flex", gap: "var(--s6)", alignItems: "center", marginBottom: "var(--s7)" }}>
            <div className="skeleton" style={{ width: 104, height: 104, borderRadius: "50%" }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ height: 28, width: 200, marginBottom: "var(--s3)" }} />
              <div className="skeleton" style={{ height: 16, width: 300 }} />
            </div>
          </div>
          <VideoGrid videos={[]} loading />
        </div>
      </div>
    );
  }

  if (!profile) return <div className="container" style={{ paddingTop: "var(--s7)" }}><p>User not found.</p></div>;

  return (
    <div className="container">
      <div className="profile-header">
        <div style={{ position: "relative", display: "inline-block" }}>
          <img src={profile.avatar} alt={profile.name} className="avatar avatar-xl" style={{ border: "3px solid var(--terra)" }} />
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--s4)", marginBottom: "var(--s4)", flexWrap: "wrap" }}>
            <div>
              <h1 className="display-lg" style={{ marginBottom: "var(--s1)" }}>{profile.name}</h1>
              {profile.username && <p className="text-sm muted">@{profile.username}</p>}
              {profile.profession && (
                <p className="text-sm" style={{ color: "var(--terra)", fontWeight: 500, marginTop: "var(--s1)" }}>
                  {profile.profession}
                </p>
              )}
            </div>

            {authUser && !isMe && (
              <button
                className={`btn follow-btn ${following ? "btn-secondary" : "btn-primary"}`}
                onClick={toggleFollow}
              >
                {following ? "Following" : "Follow"}
              </button>
            )}

            {isMe && (
              <Link href="profile/edit" className="btn btn-secondary btn-sm">
                Edit profile
              </Link>
            )}
          </div>

          {profile.bio && (
            <p style={{ marginBottom: "var(--s4)", maxWidth: 480 }}>{profile.bio}</p>
          )}

          <div className="profile-stats" style={{ marginBottom: "var(--s4)" }}>
            {[
              { value: profile.videoCount || 0, label: "Videos" },
              { value: profile.followerCount || 0, label: "Followers" },
              { value: profile.followingCount || 0, label: "Following" },
              { value: profile.totalViews || 0, label: "Views" },
            ].map((s) => (
              <div key={s.label} className="stat">
                <span className="stat__value">{s.value?.toLocaleString()}</span>
                <span className="stat__label">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Social links */}
          <div style={{ display: "flex", gap: "var(--s3)" }}>
            {profile.links?.github && (
              <a href={profile.links.github} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                GitHub →
              </a>
            )}
            {profile.links?.portfolio && (
              <a href={profile.links.portfolio} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                Portfolio →
              </a>
            )}
            {profile.links?.linkedin && (
              <a href={profile.links.linkedin} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                LinkedIn →
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "var(--s2)", marginBottom: "var(--s5)", borderBottom: "1px solid var(--border)", paddingBottom: "var(--s3)" }}>
        {["videos", ...(isMe ? ["liked"] : [])].map((t) => (
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

      <VideoGrid videos={videos} loading={false} />
    </div>
  );
}
