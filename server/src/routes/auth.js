import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { syncUser, getMe } from "../controllers/auth.js";

const router = Router();

// POST /api/auth/sync  — called by frontend after Auth0 login
router.post("/sync", authLimiter, protect, syncUser);

// GET /api/auth/me  — get current user's full profile
router.get("/me", protect, getMe);

export default router;
