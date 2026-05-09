import { auth } from "express-oauth2-jwt-bearer";
import User from "../models/User.js";

// ── Auth0 JWT Verifier ──────────────────────────────────────────────────────────
export const verifyToken = auth({
  issuerBaseURL: `https://dev-eedmka678fydxtgm.us.auth0.com/`,
  audience: "https://api.hadithihub.com",
  tokenSigningAlg: "RS256"
});

// Fallback introspection for opaque tokens
export const introspectToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token" });

  const token = authHeader.split(" ")[1];

  try {
    const response = await fetch(
      `https://dev-eedmka678fydxtgm.us.auth0.com/oauth/token/introspect`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          token,
          client_id: process.env.AUTH0_CLIENT_ID,
          client_secret: process.env.AUTH0_CLIENT_SECRET,
        }),
      }
    );

    const data = await response.json();
    if (!data.active) return res.status(401).json({ message: "Token inactive" });

    req.auth = { payload: { sub: data.sub, ...data } };
    next();
  } catch (err) {
    res.status(401).json({ message: "Token introspection failed" });
  }
};

// Combined: try JWT first, fall back to introspection
export const flexVerify = (req, res, next) => {
  verifyToken(req, res, (err) => {
    if (!err) return next();
    introspectToken(req, res, next);
  });
};
// ── Attach MongoDB user to req.user ─────────────────────────────────────────────
// Used after verifyToken; performs an upsert so profile always stays fresh.
export const attachUser = async (req, res, next) => {
  try {
    const auth0Id = req.auth?.payload?.sub;
    if (!auth0Id) return res.status(401).json({ message: "Unauthorized" });

    const payload = req.auth.payload;
    const name = payload.name || payload["https://hadithihub.com/name"] || "Anonymous";
    const email = payload.email || payload["https://hadithihub.com/email"] || "";
    const avatar = payload.picture || payload["https://hadithihub.com/picture"] || "";

    // Upsert: keeps local profile in sync with Auth0 identity on every request
    const user = await User.findOneAndUpdate(
      { auth0Id },
      {
        $setOnInsert: {
          auth0Id,
          email,
          username: generateUsername(name),
        },
        $set: { name, avatar },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (user.isSuspended) {
      return res.status(403).json({ message: "Account suspended. Contact support." });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

// ── Require Admin ───────────────────────────────────────────────────────────────
export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

// ── Combine both (convenience) ──────────────────────────────────────────────────
export const protect = [flexVerify, attachUser];
export const adminOnly = [verifyToken, attachUser, requireAdmin];

// ── Helpers ─────────────────────────────────────────────────────────────────────
function generateUsername(name) {
  const base = name
    .toLowerCase()
    .replaceAll(/\s+/g, "_")
    .replaceAll(/[^a-z0-9_]/g, "")
    .slice(0, 20);
  return `${base}_${Math.random().toString(36).slice(2, 7)}`;
}
