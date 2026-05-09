import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";
import { AppError } from "../middleware/error.js";

// GET /api/users/:id
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-__v");
    if (!user || user.isSuspended) throw new AppError("User not found", 404);
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/users/me
export const updateProfile = async (req, res, next) => {
  try {
    const allowed = ["username", "bio", "profession", "location", "links"];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (updates.bio?.length > 500) throw new AppError("Bio max 500 chars", 400);

    // Validate URLs
    const urlFields = ["links.github", "links.portfolio", "links.linkedin"];
    for (const field of urlFields) {
      const val = req.body?.links?.[field.split(".")[1]];
      if (val && !isValidUrl(val)) throw new AppError(`Invalid URL: ${field}`, 400);
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// POST /api/users/me/avatar
export const updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) throw new AppError("No image provided", 400);

    // Delete old avatar from Cloudinary
    if (req.user.avatarPublicId) {
      await cloudinary.uploader.destroy(req.user.avatarPublicId);
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: req.file.secure_url, avatarPublicId: req.file.public_id },
      { new: true }
    );
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/search?q=&page=
export const searchUsers = async (req, res, next) => {
  try {
    const { q, page = 1, filter } = req.query;
    const limit = 20;
    const skip = (Number.parseInt(page) - 1) * limit;

    const query = { isSuspended: false };
    if (q) query.$text = { $search: q };

    const sort = {};
    if (filter === "followers") sort.followerCount = -1;
    else sort.score = { $meta: "textScore" };

    const users = await User.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select("name username avatar bio profession location followerCount totalViews videoCount");

    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
};

function isValidUrl(str) {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}
