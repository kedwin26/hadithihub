import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

// ── Video Storage ──────────────────────────────────────────────────────────────
const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "hadithihub/videos",
    resource_type: "video",
    allowed_formats: ["mp4", "webm", "mov"],
    transformation: [{ quality: "auto", fetch_format: "mp4" }],
    eager: [
      // Thumbnail at 1 second
      { start_offset: "1", format: "jpg", transformation: [{ width: 640, crop: "scale" }] },
    ],
    eager_async: true,
  },
});

// ── Avatar Storage ─────────────────────────────────────────────────────────────
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "hadithihub/avatars",
    resource_type: "image",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 400, height: 400, crop: "fill", quality: "auto" }],
  },
});

const videoFilter = (req, file, cb) => {
  const allowed = ["video/mp4", "video/webm", "video/quicktime"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Invalid video format. Allowed: mp4, webm, mov"), false);
};

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only image files allowed"), false);
};

export const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB
  fileFilter: videoFilter,
}).single("video");

export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: imageFilter,
}).single("avatar");
