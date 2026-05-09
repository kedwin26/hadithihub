"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NotificationBell from "./NotificationBell";



export default function Navbar() {
  const { user, isLoading } = useUser();
  const path = usePathname();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link href="/" className="navbar-logo">
          Hadithi<span style={{ color: "var(--ink)" }}>Hub</span>
        </Link>

        {/* Nav links */}
        <div className="navbar-nav">
          <Link href="/" className={`nav-link ${path === "/" ? "active" : ""}`}>
            <span>Discover</span>
          </Link>
          <Link href="explore" className={`nav-link ${path === "/explore" ? "active" : ""}`}>
            <span>Explore</span>
          </Link>
          {user && (
            <Link href="feed" className={`nav-link ${path === "/feed" ? "active" : ""}`}>
              <span>Feed</span>
            </Link>
          )}
        </div>

        {/* Auth */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--s3)" }}>
          {isLoading ? (
            <div className="skeleton" style={{ width: 80, height: 36, borderRadius: "var(--r-full)" }} />
          ) : user ? (
            <>
              <NotificationBell />
              <Link href={`profile/me`}>
                <img
                  src={user.picture || "/default-avatar.svg"}
                  alt={user.name}
                  className="avatar avatar-sm"
                  style={{ border: "2px solid var(--terra)" }}
                />
              </Link>
              {user["https://hadithihub.com/role"] === "admin" && (
                <Link href="admin" className="btn btn-sm btn-secondary">
                  Admin
                </Link>
              )}
              <a href="/auth/logout" className="btn btn-ghost btn-sm">
                Sign out
              </a>
            </>
          ) : (
            <a href="/auth/login" className="btn btn-primary btn-sm">
              Sign in
            </a>
          )}
        </div>
      </div>
    </nav>
  );
}
