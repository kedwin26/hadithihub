"use client";

import { useState, useEffect, useRef } from "react";
import api from "../../../lib/api";


export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [showSuspended, setShowSuspended] = useState(false);
  const [action, setAction] = useState(null); 
  const [reason, setReason] = useState("");
  const debounce = useRef(null);

   useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page,
          ...(query && { q: query }),
          ...(showSuspended && { suspended: "true" }),
        });
        const data = await api.get(`/admin/users?${params}`);
        setUsers(data.users || []);
        setTotal(data.pagination?.total || 0);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [query, page, showSuspended]);


// Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, []);

  const handleSearch = (val) => {
    setQuery(val);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => { setPage(1);}, 400);
  };

  const executeSuspend = async () => {
    try {
      await api.patch(`admin/users/${action.user._id}/suspend`, { reason });
      setUsers((u) => u.map((x) => x._id === action.user._id ? { ...x, isSuspended: true } : x));
      setAction(null);
      setReason("");
    } catch (err) { alert(err.message); }
  };

  const executeUnsuspend = async (userId) => {
    if (!confirm("Unsuspend this user?")) return;
    try {
      await api.patch(`admin/users/${userId}/unsuspend`);
      setUsers((u) => u.map((x) => x._id === userId ? { ...x, isSuspended: false } : x));
    } catch (err) { alert(err.message); }
  };

  let bodyContent;
  if (loading) {
    bodyContent = Array.from({ length: 8 }).map((_, i) => (
      <tr key={`skeleton-row-${i}`}>
        {Array.from({ length: 8 }).map((_, j) => (
          <td key={`skeleton-cell-${i}-${j}`}>
            <div className="skeleton" style={{ height: 14, borderRadius: 4 }} />
          </td>
        ))}
      </tr>
    ));
  } else if (users.length === 0) {
    bodyContent = (
      <tr>
        <td
          colSpan={8}
          style={{
            textAlign: "center",
            padding: "var(--s7)",
            color: "var(--ink-muted)",
          }}
        >
          No users found
        </td>
      </tr>
    );
  } else {
    bodyContent = users.map((u) => (
      <tr key={u._id}>
        <td>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--s3)" }}>
        
            <img
              src={u.avatar}
              alt={u.name}
              width={32}
              height={32}
              className="avatar avatar-sm"
              style={{ objectFit: "cover", borderRadius: "50%" }}
            />
            <div>
              <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{u.name}</p>
              {u.username && <p className="text-xs muted">@{u.username}</p>}
            </div>
          </div>
        </td>
        <td className="text-sm muted">{u.email}</td>
        <td className="text-sm">{u.profession || "—"}</td>
        <td className="text-sm">{u.videoCount}</td>
        <td className="text-sm">{u.followerCount?.toLocaleString()}</td>
        <td>
          <span className={`badge ${u.isSuspended ? "badge-red" : "badge-sage"}`}>
            {u.isSuspended ? "Suspended" : "Active"}
          </span>
          {u.role === "admin" && (
            <span className="badge badge-ochre" style={{ marginLeft: 4 }}>
              Admin
            </span>
          )}
        </td>
        <td className="text-sm muted">{new Date(u.createdAt).toLocaleDateString()}</td>
        <td>
          <div style={{ display: "flex", gap: "var(--s2)" }}>
            {u.isSuspended ? (
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => executeUnsuspend(u._id)}
              >
                Unsuspend
              </button>
            ) : (
              u.role !== "admin" && (
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => setAction({ type: "suspend", user: u })}
                >
                  Suspend
                </button>
              )
            )}
          </div>
        </td>
      </tr>
    ));
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "var(--s6)",
        }}
      >
        <div>
          <h1 className="display-lg">Users</h1>
          <p className="muted text-sm" style={{ marginTop: "var(--s1)" }}>
            {total.toLocaleString()} total
          </p>
        </div>
        <div style={{ display: "flex", gap: "var(--s3)", alignItems: "center" }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--s2)",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
          <input type="checkbox" checked={showSuspended} onChange={(e) => {setShowSuspended(e.target.checked); setPage(1);}} /> 
            Suspended only
          </label>
          <input
            className="input"
            placeholder="Search users..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 220 }}
          />
        </div>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Profession</th>
            <th>Videos</th>
            <th>Followers</th>
            <th>Status</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>{bodyContent}</tbody>
      </table>

      {/* Pagination */}
      {total > 20 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "var(--s3)",
            marginTop: "var(--s5)",
          }}
        >
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            ← Prev
          </button>
          <span className="text-sm muted" style={{ display: "flex", alignItems: "center" }}>
            Page {page} of {Math.ceil(total / 20)}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(total / 20)}
          >
            Next →
          </button>
        </div>
      )}

      {/* Suspend confirmation modal */}
      {action?.type === "suspend" && (
        <div
          className="modal-overlay"
          onClick={() => setAction(null)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setAction(null);
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setAction(null);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Close modal"
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 420 }}
          >
            <h2 className="display-sm" style={{ marginBottom: "var(--s3)" }}>
              Suspend @{action.user.username || action.user.name}?
            </h2>
            <p className="muted text-sm" style={{ marginBottom: "var(--s4)" }}>
              This will prevent the user from accessing the platform.
            </p>
            <div className="form-group">
              <label className="label" htmlFor="reason">
                Reason (optional)
              </label>
              <textarea
                id="reason"
                className="input"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for suspension..."
              />
            </div>
            <div style={{ display: "flex", gap: "var(--s3)" }}>
              <button className="btn btn-secondary" onClick={() => setAction(null)}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={executeSuspend}
              >
                Suspend user
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}