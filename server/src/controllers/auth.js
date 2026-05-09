import User from "../models/User.js";

// POST /api/auth/sync
export const syncUser = async (req, res, next) => {
  try {
    // req.user is already upserted by attachUser middleware
    res.json({ success: true, user: req.user });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-__v");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};
