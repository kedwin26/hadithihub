import cloudinary from "../config/cloudinary.js";
import Video from "../models/Video.js";
import User from "../models/User.js";
import Comment from "../models/Comment.js";
import { Like, Follow } from "../models/index.js";
import { AppError } from "../middleware/error.js";

// POST /api/videos
export const uploadVideoHandler = async (req, res, next) => {
  try {
    if (!req.file) throw new AppError("No video file provided", 400);


    const { title, description, tags } = req.body;
    if (!title) throw new AppError("Title is required", 400);

    const cloudinaryResult = req.file;
    const thumbnailUrl =
      cloudinaryResult.eager?.[0]?.secure_url ||
      `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload/so_1,w_640/${cloudinaryResult.public_id}.jpg`;

    const video = await Video.create({
      uploader: req.user._id,
      title: title.trim(),
      description: description?.trim() || "",
      cloudinaryId: cloudinaryResult.filename,
      videoUrl: cloudinaryResult.path,
      thumbnailUrl,
      duration: cloudinaryResult.duration || 0,
      fileSize: cloudinaryResult.bytes || 0,
      format: cloudinaryResult.format || "mp4",
      tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    });

    // Increment user video count
    await User.findByIdAndUpdate(req.user._id, { $inc: { videoCount: 1 } });

    res.status(201).json({ success: true, video });
  } catch (err) {
    next(err);
  }
};

// GET /api/videos  (paginated, newest first)
export const getVideos = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page) || 1);
    const limit = Math.min(20, Number.parseInt(req.query.limit) || 12);
    const skip = (page - 1) * limit;

    const filter = { isDeleted: false };
    if (req.query.uploader) filter.uploader = req.query.uploader;

    const [videos, total] = await Promise.all([
      Video.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("uploader", "name username avatar"),
      Video.countDocuments(filter),
    ]);

    res.json({
      success: true,
      videos,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/videos/:id
export const getVideo = async (req, res, next) => {
  try {
    const video = await Video.findOne({
      _id: req.params.id,
      isDeleted: false,
    }).populate("uploader", "name username avatar bio followerCount");

    if (!video) throw new AppError("Video not found", 404);

    res.json({ success: true, video });
  } catch (err) {
    next(err);
  }
};

// POST /api/videos/:id/view
export const incrementView = async (req, res, next) => {
  try {
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    );
    if (!video) throw new AppError("Video not found", 404);

    // Update total views on uploader
    await User.findByIdAndUpdate(video.uploader, { $inc: { totalViews: 1 } });

    res.json({ success: true, viewCount: video.viewCount });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/videos/:id
export const deleteVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) throw new AppError("Video not found", 404);

    const isOwner = video.uploader.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) throw new AppError("Not authorized", 403);

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(video.cloudinaryId, {
      resource_type: "video",
    });

    // Soft-mark as deleted in MongoDB
    video.isDeleted = true;
    await video.save();

    // Async cleanup: decrement user videoCount
    User.findByIdAndUpdate(video.uploader, { $inc: { videoCount: -1 } }).exec();

    // Async cleanup: remove likes & comments
    Like.deleteMany({ video: video._id }).exec();
    Comment.updateMany({ video: video._id }, { isDeleted: true }).exec();

    res.json({ success: true, message: "Video deleted" });
  } catch (err) {
    next(err);
  }
};

// GET /api/videos/feed/following
export const getFeedVideos = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page) || 1);
    const limit = 12;
    const skip = (page - 1) * limit;

    const follows = await Follow.find({ follower: req.user._id }).select("following");
    const followingIds = follows.map((f) => f.following);

    if (followingIds.length === 0) {
      return res.json({ success: true, videos: [], pagination: { page, total: 0, pages: 0 } });
    }

    const [videos, total] = await Promise.all([
      Video.find({ uploader: { $in: followingIds }, isDeleted: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("uploader", "name username avatar"),
      Video.countDocuments({ uploader: { $in: followingIds }, isDeleted: false }),
    ]);

    res.json({
      success: true,
      videos,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/videos/search?q=
export const searchVideos = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ success: true, videos: [] });

    const videos = await Video.find({
      $text: { $search: q },
      isDeleted: false,
    })
      .sort({ score: { $meta: "textScore" } })
      .limit(20)
      .populate("uploader", "name username avatar");

    res.json({ success: true, videos });
  } catch (err) {
    next(err);
  }
};
