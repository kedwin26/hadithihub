import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    auth0Id: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
    },
    avatar: {
      type: String,
      default: "https://res.cloudinary.com/placeholder/image/upload/avatar_default.png",
    },
    avatarPublicId: String,
    bio: { type: String, maxlength: 500, default: "" },
    profession: { type: String, maxlength: 100, default: "" },
    location: { type: String, maxlength: 100, default: "" },
    links: {
      github: { type: String, default: "" },
      portfolio: { type: String, default: "" },
      linkedin: { type: String, default: "" },
    },

    // Counters (denormalized for performance)
    videoCount: { type: Number, default: 0 },
    followerCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    totalViews: { type: Number, default: 0 },

    // Roles & Status
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isSuspended: { type: Boolean, default: false },
    suspendedAt: Date,
    suspendedReason: String,

    // Seeded flag
    isSeeded: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.index({ name: "text", profession: "text", location: "text" });
userSchema.index({ followerCount: -1 });
userSchema.index({ totalViews: -1 });

export default mongoose.model("User", userSchema);
