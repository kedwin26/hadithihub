import "dotenv/config";
import express from "express";
import { createServer } from "node:http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import * as Sentry from "@sentry/node";

import { connectDB } from "./src/config/db.js";
import { initSocket } from "./src/sockets/index.js";
import { globalErrorHandler, notFound } from "./src/middleware/error.js";
import { generalLimiter } from "./src/middleware/rateLimiter.js";

// ── Routes ─────────────────────────────────────────────────────────────────────
import authRoutes from "./src/routes/auth.js";
import videoRoutes from "./src/routes/videos.js";
import userRoutes from "./src/routes/users.js";
import commentRoutes from "./src/routes/comments.js";
import likeRoutes from "./src/routes/likes.js";
import followRoutes from "./src/routes/follows.js";
import adminRoutes from "./src/routes/admin.js";
import notificationRoutes from "./src/routes/notifications.js";
import flagRoutes from "./src/routes/flags.js";

// ── Sentry ─────────────────────────────────────────────────────────────────────
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.2,
});

const app = express();
const httpServer = createServer(app);

// ── Core Middleware ─────────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  })
);

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(generalLimiter);

// ── Socket.io ──────────────────────────────────────────────────────────────────
initSocket(httpServer);

// ── API Routes ─────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/users", userRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/follows", followRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/flags", flagRoutes);

// ── Health Check ───────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Error Handling ─────────────────────────────────────────────────────────────
app.use(notFound);
app.use(globalErrorHandler);

// ── Boot ───────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`🚀 HadithiHub server running on port ${PORT}`);
  });
});
