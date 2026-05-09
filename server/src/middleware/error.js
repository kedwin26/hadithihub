import * as Sentry from "@sentry/node";

export const notFound = (req, res, next) => {
  const err = new Error(`Route not found: ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
};

export const globalErrorHandler = (err, req, res, next) => {
  // Report to Sentry for non-4xx errors
  if (!err.statusCode || err.statusCode >= 500) {
    Sentry.captureException(err);
  }

  const statusCode = err.statusCode || err.status || 500;
  const isDev = process.env.NODE_ENV === "development";

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error",
    ...(isDev && { stack: err.stack }),
  });
};

// ── Custom error class ─────────────────────────────────────────────────────────
export class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}
