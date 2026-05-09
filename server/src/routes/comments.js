import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { commentLimiter } from "../middleware/rateLimiter.js";
import { sanitizeInput } from "../middleware/sanitize.js";
import Comment from "../models/Comment.js";
import Video from "../models/Video.js";
import { AppError } from "../middleware/error.js";
import { getIO } from "../sockets/index.js";

const router = Router();

// GET /api/comments/:videoId  — top-level comments (paginated)
router.get("/:videoId", async (req, res, next) => {
  try {
    const { page = 1 } = req.query;
    const limit = 10;
    const skip = (parseInt(page) - 1) * limit;

    const [comments, total] = await Promise.all([
      Comment.find({
        video: req.params.videoId,
        parentId: null,
        isDeleted: false,
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "name username avatar"),
      Comment.countDocuments({
        video: req.params.videoId,
        parentId: null,
        isDeleted: false,
      }),
    ]);

    res.json({
      success: true,
      comments,
      pagination: { page: parseInt(page), total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/comments/:videoId/replies/:parentId
router.get("/:videoId/replies/:parentId", async (req, res, next) => {
  try {
    const replies = await Comment.find({
      video: req.params.videoId,
      parentId: req.params.parentId,
      isDeleted: false,
    })
      .sort({ createdAt: 1 })
      .limit(50)
      .populate("author", "name username avatar");

    res.json({ success: true, replies });
  } catch (err) {
    next(err);
  }
});

// POST /api/comments/:videoId
router.post(
  "/:videoId",
  protect,
  commentLimiter,
  sanitizeInput,
  async (req, res, next) => {
    try {
      const { text, parentId } = req.body;
      if (!text) throw new AppError("Comment text required", 400);

      const video = await Video.findOne({ _id: req.params.videoId, isDeleted: false });
      if (!video) throw new AppError("Video not found", 404);

      const comment = await Comment.create({
        video: req.params.videoId,
        author: req.user._id,
        text,
        parentId: parentId || null,
      });

      await comment.populate("author", "name username avatar");

      // Increment counts
      if (parentId) {
        Comment.findByIdAndUpdate(parentId, { $inc: { replyCount: 1 } }).exec();
      } else {
        Video.findByIdAndUpdate(req.params.videoId, { $inc: { commentCount: 1 } }).exec();
      }

      // Broadcast via Socket.io
      const io = getIO();
      io.to(`video_${req.params.videoId}_comments`).emit("new_comment", comment);

      res.status(201).json({ success: true, comment });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/comments/:id
router.delete("/:id", protect, async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) throw new AppError("Comment not found", 404);

    const isAuthor = comment.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isAuthor && !isAdmin) throw new AppError("Not authorized", 403);

    comment.isDeleted = true;
    await comment.save();

    // Broadcast deletion
    const io = getIO();
    io.to(`video_${comment.video}_comments`).emit("delete_comment", {
      commentId: comment._id,
    });

    // Decrement count
    if (!comment.parentId) {
      Video.findByIdAndUpdate(comment.video, { $inc: { commentCount: -1 } }).exec();
    }

    res.json({ success: true, message: "Comment deleted" });
  } catch (err) {
    next(err);
  }
});

export default router;
