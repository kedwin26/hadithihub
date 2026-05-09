import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { uploadVideo } from "../middleware/upload.js";
import { uploadLimiter } from "../middleware/rateLimiter.js";
import { sanitizeInput } from "../middleware/sanitize.js";
import {
  uploadVideoHandler,
  getVideos,
  getVideo,
  deleteVideo,
  incrementView,
  getFeedVideos,
  searchVideos,
} from "../controllers/videos.js";

const router = Router();

// Public
router.get("/", getVideos);
router.get("/search", searchVideos);
router.get("/:id", getVideo);
router.post("/:id/view", incrementView);

// Protected
router.post(
  "/",
  protect,
  uploadLimiter,
  (req, res, next) => {
    uploadVideo(req, res, (err) => {
      if (err) return res.status(400).json({ message: err.message });
      next();
    });
  },
  sanitizeInput,
  uploadVideoHandler
);

router.delete("/:id", protect, deleteVideo);
router.get("/feed/following", protect, getFeedVideos);

export default router;
