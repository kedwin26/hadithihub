import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { uploadAvatar } from "../middleware/upload.js";
import { sanitizeInput } from "../middleware/sanitize.js";
import {
  getProfile,
  updateProfile,
  searchUsers,
  updateAvatar,
} from "../controllers/users.js";

const router = Router();

router.get("/search", searchUsers);
router.get("/:id", getProfile);
router.patch("/me", protect, sanitizeInput, updateProfile);
router.post(
  "/me/avatar",
  protect,
  (req, res, next) =>
    uploadAvatar(req, res, (err) => {
      if (err) return res.status(400).json({ message: err.message });
      next();
    }),
  updateAvatar
);

export default router;
