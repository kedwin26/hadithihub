import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { Flag } from "../models/index.js";
import Video from "../models/Video.js";
import { AppError } from "../middleware/error.js";
import { sanitizeInput } from "../middleware/sanitize.js";

const router = Router();

// POST /api/flags/:videoId
router.post("/:videoId", protect, sanitizeInput, async (req, res, next) => {
  try {
    const { reason, notes } = req.body;
    const VALID_REASONS = ["inappropriate", "spam", "copyright", "other"];
    if (!VALID_REASONS.includes(reason)) {
      throw new AppError("Invalid reason", 400);
    }

    const video = await Video.findOne({ _id: req.params.videoId, isDeleted: false });
    if (!video) throw new AppError("Video not found", 404);

    // One flag per user per video
    const existing = await Flag.findOne({ reporter: req.user._id, video: req.params.videoId });
    if (existing) throw new AppError("You have already reported this video", 400);

    await Flag.create({
      reporter: req.user._id,
      video: req.params.videoId,
      reason,
      notes: notes || "",
    });

    // Increment flag count on video
    video.isFlagged = true;
    video.flagCount = (video.flagCount || 0) + 1;
    await video.save();

    res.status(201).json({ success: true, message: "Video reported. Thank you." });
  } catch (err) {
    next(err);
  }
});

export default router;
