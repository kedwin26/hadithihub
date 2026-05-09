import User from "../models/User.js";
import Video from "../models/Video.js";
import Comment from "../models/Comment.js";
import { Flag, ModerationLog, Like } from "../models/index.js";
import cloudinary from "../config/cloudinary.js";
import { AppError } from "../middleware/error.js";

export const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalVideos,
      totalComments,
      pendingFlags,
      suspendedUsers,
    ] = await Promise.all([
      User.countDocuments(),
      Video.countDocuments({ isDeleted: false }),
      Comment.countDocuments({ isDeleted: false }),
      Flag.countDocuments({ status: "pending" }),
      User.countDocuments({ isSuspended: true }),
    ]);

    // Top 5 most viewed videos
    const topVideos = await Video.find({ isDeleted: false })
      .sort({ viewCount: -1 })
      .limit(5)
      .populate("uploader", "name username");

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalVideos,
        totalComments,
        pendingFlags,
        suspendedUsers,
        topVideos,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, q, suspended } = req.query;
    const limit = 20;
    const skip = (Number.parseInt(page) - 1) * limit;
    const filter = {};
    if (q) filter.$text = { $search: q };
    if (suspended === "true") filter.isSuspended = true;

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select("-__v"),
      User.countDocuments(filter),
    ]);

    res.json({ success: true, users, pagination: { page, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
};

export const suspendUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isSuspended: true, suspendedAt: new Date(), suspendedReason: req.body.reason },
      { new: true }
    );
    if (!user) throw new AppError("User not found", 404);

    await ModerationLog.create({
      admin: req.user._id,
      action: "suspend_user",
      targetUser: user._id,
      notes: req.body.reason,
    });

    res.json({ success: true, message: "User suspended", user });
  } catch (err) {
    next(err);
  }
};

export const unsuspendUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isSuspended: false, $unset: { suspendedAt: 1, suspendedReason: 1 } },
      { new: true }
    );
    if (!user) throw new AppError("User not found", 404);

    await ModerationLog.create({
      admin: req.user._id,
      action: "unsuspend_user",
      targetUser: user._id,
    });

    res.json({ success: true, message: "User unsuspended", user });
  } catch (err) {
    next(err);
  }
};

export const getFlaggedContent = async (req, res, next) => {
  try {
    const { status = "pending", page = 1 } = req.query;
    const limit = 20;
    const skip = (Number.parseInt(page) - 1) * limit;

    const [flags, total] = await Promise.all([
      Flag.find({ status })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("reporter", "name username")
        .populate({ path: "video", populate: { path: "uploader", select: "name username" } }),
      Flag.countDocuments({ status }),
    ]);

    res.json({ success: true, flags, pagination: { page, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
};

export const resolveFlag = async (req, res, next) => {
  try {
    const { action } = req.body; // "dismiss" | "delete"
    const flag = await Flag.findById(req.params.id).populate("video");
    if (!flag) throw new AppError("Flag not found", 404);

    flag.status = "reviewed";
    flag.reviewedBy = req.user._id;
    flag.reviewedAt = new Date();
    await flag.save();

    if (action === "delete" && flag.video) {
      await cloudinary.uploader.destroy(flag.video.cloudinaryId, { resource_type: "video" });
      flag.video.isDeleted = true;
      await flag.video.save();

      await ModerationLog.create({
        admin: req.user._id,
        action: "delete_video",
        targetVideo: flag.video._id,
        notes: `Deleted via flag resolution`,
      });
    }

    res.json({ success: true, message: `Flag ${action}d` });
  } catch (err) {
    next(err);
  }
};

export const deleteVideoAdmin = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) throw new AppError("Video not found", 404);

    await cloudinary.uploader.destroy(video.cloudinaryId, { resource_type: "video" });
    video.isDeleted = true;
    await video.save();

    await ModerationLog.create({
      admin: req.user._id,
      action: "delete_video",
      targetVideo: video._id,
      notes: req.body.reason || "Admin deletion",
    });

    res.json({ success: true, message: "Video deleted" });
  } catch (err) {
    next(err);
  }
};

export const getModerationLogs = async (req, res, next) => {
  try {
    const logs = await ModerationLog.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("admin", "name username")
      .populate("targetUser", "name username")
      .populate("targetVideo", "title");
    res.json({ success: true, logs });
  } catch (err) {
    next(err);
  }
};
