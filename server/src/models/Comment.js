import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String, required: true, trim: true, maxlength: 1000 },

    // Parent-child one-level deep (Instagram/TikTok style)
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    replyCount: { type: Number, default: 0 },

    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Compound index for fast "View more replies" queries
commentSchema.index({ video: 1, parentId: 1, createdAt: -1 });
commentSchema.index({ author: 1 });

export default mongoose.model("Comment", commentSchema);
