"use client";

import { useEffect } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const NAV = [
  { href: "admin", label: "Dashboard", icon: "📊" },
  { href: "admin/users", label: "Users", icon: "👥" },
  { href: "admin/content", label: "Content", icon: "🎬" },
  { href: "admin/flags", label: "Flags", icon: "🚩" },
  { href: "admin/logs", label: "Mod Logs", icon: "📋" },
];



export default function AdminLayout({ children }) {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!user) router.push("/api/auth/login");
      else if (user["https://hadithihub.com/role"] !== "admin") router.push("/");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) return null;

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 64px)" }}>
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div style={{ padding: "var(--s4) var(--s5)", marginBottom: "var(--s3)" }}>
          <p className="text-xs muted" style={{ textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>
            Admin Panel
          </p>
        </div>
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`admin-nav-item ${path === item.href ? "active" : ""}`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
        <div className="divider" style={{ margin: "var(--s4) var(--s5)" }} />
        <Link href="/" className="admin-nav-item">
          <span>←</span>
          <span>Back to site</span>
        </Link>
      </aside>

      {/* Content */}
      <div style={{ flex: 1, padding: "var(--s6) var(--s7)", overflowX: "auto" }}>
        {children}
      </div>
    </div>
  );
}
