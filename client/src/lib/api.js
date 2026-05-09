/**
 * api.js — thin fetch wrapper that:
 *  1. Prefixes requests with NEXT_PUBLIC_API_URL
 *  2. Injects Auth0 access token from the Next.js route handler (/api/auth/token)
 *  3. Returns parsed JSON or throws with the error message
 */

const BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/$/, "");

async function getToken() {
  try {
    const res = await fetch("/api/auth/token");
    if (!res.ok) return null;
    const data = await res.json();
    return data.accessToken || null;
  } catch {
    return null;
  }
}

async function request(method, path, body, opts = {}) {
  const token = await getToken();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // Don't set Content-Type for FormData (browser sets boundary automatically)
  if (body instanceof FormData) {
    delete headers["Content-Type"];
  }

  const res = await fetch(`${BASE}${normalizedPath}`,{
    method,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.message || `Request failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return data;
}

const api = {
  get:    (path, opts)       => request("GET",    path, null, opts),
  post:   (path, body, opts) => request("POST",   path, body, opts),
  patch:  (path, body, opts) => request("PATCH",  path, body, opts),
  delete: (path, opts)       => request("DELETE", path, null, opts),
  upload: (path, form, opts) => request("POST",   path, form, opts),
};

export default api;
