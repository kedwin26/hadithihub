/**
 * keepAlive.js — pings the server every 10 minutes to prevent Render free
 * tier from spinning down and breaking Socket.io connections.
 *
 * Usage: import and call startKeepAlive() once in server.js
 * OR deploy as a separate Render cron job:
 *   Command: node src/jobs/keepAlive.js
 *   Schedule: every 10 minutes
 */

const PING_URL = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
const INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

export const startKeepAlive = () => {
  if (process.env.NODE_ENV !== "production") return;

  setInterval(async () => {
    try {
      const res = await fetch(`${PING_URL}/health`);
      console.log(`💓 Keep-alive ping: ${res.status}`);
    } catch (err) {
      console.warn("⚠️  Keep-alive ping failed:", err.message);
    }
  }, INTERVAL_MS);

  console.log("💓 Keep-alive job started (10-min interval)");
};
