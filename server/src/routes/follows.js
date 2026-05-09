import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { Follow, Notification } from "../models/index.js";
import User from "../models/User.js";
import { AppError } from "../middleware/error.js";

const router = Router();

// POST /api/follows/:userId  — toggle follow
router.post("/:userId", protect, async (req, res, next) => {
  try {
    if (req.params.userId === req.user._id.toString()) {
      throw new AppError("Cannot follow yourself", 400);
    }

    const target = await User.findById(req.params.userId);
    if (!target || target.isSuspended) throw new AppError("User not found", 404);

    const existing = await Follow.findOne({
      follower: req.user._id,
      following: req.params.userId,
    });

    if (existing) {
      await existing.deleteOne();
      await User.findByIdAndUpdate(req.params.userId, { $inc: { followerCount: -1 } });
      await User.findByIdAndUpdate(req.user._id, { $inc: { followingCount: -1 } });
      return res.json({ success: true, following: false });
    }

    await Follow.create({ follower: req.user._id, following: req.params.userId });
    await User.findByIdAndUpdate(req.params.userId, { $inc: { followerCount: 1 } });
    await User.findByIdAndUpdate(req.user._id, { $inc: { followingCount: 1 } });

    // Create notification (Phase 2)
    Notification.create({
      recipient: req.params.userId,
      sender: req.user._id,
      type: "follow",
      message: `${req.user.name} started following you`,
      link: `profile/${req.user._id}`,
    }).catch(() => {}); // non-blocking

    res.json({ success: true, following: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/follows/status/:userId
router.get("/status/:userId", protect, async (req, res, next) => {
  try {
    const follow = await Follow.findOne({
      follower: req.user._id,
      following: req.params.userId,
    });
    res.json({ success: true, following: !!follow });
  } catch (err) {
    next(err);
  }
});

// GET /api/follows/:userId/followers
router.get("/:userId/followers", async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 20;
    const follows = await Follow.find({ following: req.params.userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("follower", "name username avatar bio followerCount");
    res.json({ success: true, users: follows.map((f) => f.follower) });
  } catch (err) {
    next(err);
  }
});

// GET /api/follows/:userId/following
router.get("/:userId/following", async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 20;
    const follows = await Follow.find({ follower: req.params.userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("following", "name username avatar bio followerCount");
    res.json({ success: true, users: follows.map((f) => f.following) });
  } catch (err) {
    next(err);
  }
});

export default router;
