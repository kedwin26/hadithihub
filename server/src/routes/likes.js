import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { Like } from "../models/index.js";
import Video from "../models/Video.js";
import { AppError } from "../middleware/error.js";

const router = Router();

// POST /api/likes/:videoId  — toggle like
router.post("/:videoId", protect, async (req, res, next) => {
  try {
    const video = await Video.findOne({ _id: req.params.videoId, isDeleted: false });
    if (!video) throw new AppError("Video not found", 404);

    const existing = await Like.findOne({ user: req.user._id, video: req.params.videoId });

    if (existing) {
      await existing.deleteOne();
      await Video.findByIdAndUpdate(req.params.videoId, { $inc: { likeCount: -1 } });
      return res.json({ success: true, liked: false });
    }

    await Like.create({ user: req.user._id, video: req.params.videoId });
    await Video.findByIdAndUpdate(req.params.videoId, { $inc: { likeCount: 1 } });
    res.json({ success: true, liked: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/likes/me  — user's liked videos
router.get("/me", protect, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 12;
    const skip = (page - 1) * limit;

    const likes = await Like.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "video",
        match: { isDeleted: false },
        populate: { path: "uploader", select: "name username avatar" },
      });

    const videos = likes.map((l) => l.video).filter(Boolean);
    res.json({ success: true, videos });
  } catch (err) {
    next(err);
  }
});

// GET /api/likes/status/:videoId
router.get("/status/:videoId", protect, async (req, res, next) => {
  try {
    const like = await Like.findOne({ user: req.user._id, video: req.params.videoId });
    res.json({ success: true, liked: !!like });
  } catch (err) {
    next(err);
  }
});

export default router;
