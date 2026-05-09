import mongoose from "mongoose";

// ── Like ───────────────────────────────────────────────────────────────────────
const likeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    video: { type: mongoose.Schema.Types.ObjectId, ref: "Video", required: true },
  },
  { timestamps: true }
);
likeSchema.index({ user: 1, video: 1 }, { unique: true });
likeSchema.index({ video: 1 });

export const Like = mongoose.model("Like", likeSchema);

// ── Follow ─────────────────────────────────────────────────────────────────────
const followSchema = new mongoose.Schema(
  {
    follower: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    following: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);
followSchema.index({ follower: 1, following: 1 }, { unique: true });
followSchema.index({ following: 1 });

export const Follow = mongoose.model("Follow", followSchema);

// ── Flag ───────────────────────────────────────────────────────────────────────
const flagSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    video: { type: mongoose.Schema.Types.ObjectId, ref: "Video", required: true },
    reason: {
      type: String,
      enum: ["inappropriate", "spam", "copyright", "other"],
      required: true,
    },
    notes: { type: String, maxlength: 500, default: "" },
    status: {
      type: String,
      enum: ["pending", "reviewed", "dismissed"],
      default: "pending",
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
  },
  { timestamps: true }
);
flagSchema.index({ video: 1, status: 1 });
flagSchema.index({ reporter: 1, video: 1 }, { unique: true });

export const Flag = mongoose.model("Flag", flagSchema);

// ── Notification ───────────────────────────────────────────────────────────────
const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: {
      type: String,
      enum: ["follow", "comment", "mention", "like", "system"],
      required: true,
    },
    message: { type: String, required: true },
    link: String,
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model("Notification", notificationSchema);

// ── ModerationLog ──────────────────────────────────────────────────────────────
const moderationLogSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: {
      type: String,
      enum: ["delete_video", "suspend_user", "unsuspend_user", "dismiss_flag", "warn_user"],
      required: true,
    },
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    targetVideo: { type: mongoose.Schema.Types.ObjectId, ref: "Video" },
    notes: { type: String, maxlength: 1000 },
  },
  { timestamps: true }
);

export const ModerationLog = mongoose.model("ModerationLog", moderationLogSchema);
