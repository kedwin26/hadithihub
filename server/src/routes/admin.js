import { Router } from "express";
import { adminOnly } from "../middleware/auth.js";
import {
  getDashboardStats,
  getAllUsers,
  suspendUser,
  unsuspendUser,
  getFlaggedContent,
  resolveFlag,
  deleteVideoAdmin,
  getModerationLogs,
} from "../controllers/admin.js";

const router = Router();

// All admin routes require admin role
router.use(adminOnly);

router.get("/stats", getDashboardStats);
router.get("/users", getAllUsers);
router.patch("/users/:id/suspend", suspendUser);
router.patch("/users/:id/unsuspend", unsuspendUser);
router.get("/flags", getFlaggedContent);
router.patch("/flags/:id/resolve", resolveFlag);
router.delete("/videos/:id", deleteVideoAdmin);
router.get("/moderation-logs", getModerationLogs);

export default router;
