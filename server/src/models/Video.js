import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
  {
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, maxlength: 500, default: "" },

    // Cloudinary
    cloudinaryId: { type: String, required: true },
    videoUrl: { type: String, required: true },
    thumbnailUrl: { type: String, default: "" },
    duration: { type: Number, default: 0 }, // seconds
    fileSize: { type: Number, default: 0 }, // bytes
    format: { type: String, default: "mp4" },

    // Engagement (denormalized)
    viewCount: { type: Number, default: 0, index: true },
    likeCount: { type: Number, default: 0, index: true },
    commentCount: { type: Number, default: 0 },

    // Moderation
    isFlagged: { type: Boolean, default: false },
    flagCount: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false, index: true },

    tags: [{ type: String, trim: true, lowercase: true }],

    isSeeded: { type: Boolean, default: false },
  },
  { timestamps: true }
);

videoSchema.index({ uploader: 1, createdAt: -1 });
videoSchema.index({ createdAt: -1 });
videoSchema.index({ title: "text", description: "text", tags: "text" });

export default mongoose.model("Video", videoSchema);
