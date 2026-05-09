import rateLimit from "express-rate-limit";

const limiter = (max, windowMs, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message },
    skipSuccessfulRequests: false,
  });

export const generalLimiter = limiter(
  100,
  60 * 1000,
  "Too many requests, please slow down."
);

export const authLimiter = limiter(
  5,
  60 * 1000,
  "Too many auth attempts. Try again in a minute."
);

export const uploadLimiter = limiter(
  10,
  60 * 60 * 1000,
  "Upload limit reached (10/hour). Try again later."
);

export const commentLimiter = limiter(
  30,
  60 * 60 * 1000,
  "Comment limit reached (30/hour). Try again later."
);
