/**
 * seed.js — populates HadithiHub with realistic test data.
 * Usage:
 *   npm run seed          → insert 100 users + 100 videos
 *   npm run seed:clear    → drop all seeded data first
 */
import { setServers } from 'node:dns/promises';
import "dotenv/config";
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import User from "../models/User.js";
import Video from "../models/Video.js";
import Comment from "../models/Comment.js";
import { Like, Follow } from "../models/index.js";

setServers(['1.1.1.1', '8.8.8.8']);

const CLEAR = process.argv.includes("--clear");

const PROFESSIONS = [
  "Software Engineer",
  "UI/UX Designer",
  "Product Manager",
  "Data Scientist",
  "DevOps Engineer",
  "Filmmaker",
  "Photographer",
  "Musician",
  "Artist",
  "Educator",
  "Entrepreneur",
  "Content Creator",
  "Journalist",
  "Chef",
  "Architect",
];

const SAMPLE_VIDEO_IDS = [
  // These are placeholder Cloudinary IDs — replace with real ones in your cloud
  "hadithihub/videos/sample_1",
  "hadithihub/videos/sample_2",
  "hadithihub/videos/sample_3",
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  if (CLEAR) {
    await User.deleteMany({ isSeeded: true });
    await Video.deleteMany({ isSeeded: true });
    await Comment.deleteMany({});
    await Like.deleteMany({});
    await Follow.deleteMany({});
    console.log("🗑️  Cleared seeded data");
  }

  // ── Create 100 Users ──────────────────────────────────────────────────────
  console.log("👤 Seeding 100 users...");
  const users = [];
  for (let i = 0; i < 100; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const name = `${firstName} ${lastName}`;

    users.push({
      auth0Id: `seed|${faker.string.uuid()}`,
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      name,
      username: `${firstName.toLowerCase()}_${faker.string.alphanumeric(4)}`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      bio: faker.lorem.sentences({ min: 1, max: 3 }),
      profession: faker.helpers.arrayElement(PROFESSIONS),
      location: `${faker.location.city()}, ${faker.location.country()}`,
      links: {
        github: `https://github.com/${faker.internet.username()}`,
        portfolio: `https://${faker.internet.domainName()}`,
        linkedin: `https://linkedin.com/in/${faker.internet.username()}`,
      },
      isSeeded: true,
    });
  }

  const createdUsers = await User.insertMany(users);
  console.log(`✅ Created ${createdUsers.length} users`);

  // ── Create 100 Videos ─────────────────────────────────────────────────────
  console.log("🎬 Seeding 100 videos...");
  const videoTopics = [
    "Quick cooking tip",
    "Morning routine",
    "Coding trick",
    "Design inspiration",
    "Travel moment",
    "Life hack",
    "Music clip",
    "Art process",
    "Workout move",
    "Funny moment",
  ];

  const videos = [];
  for (let i = 0; i < 100; i++) {
    const uploader = faker.helpers.arrayElement(createdUsers);
    const topic = faker.helpers.arrayElement(videoTopics);
    const cloudId = faker.helpers.arrayElement(SAMPLE_VIDEO_IDS);

    videos.push({
      uploader: uploader._id,
      title: `${topic}: ${faker.lorem.words({ min: 2, max: 5 })}`,
      description: faker.lorem.sentences({ min: 1, max: 2 }),
      cloudinaryId: `${cloudId}_${i}`,
      videoUrl: `https://res.cloudinary.com/demo/video/upload/${cloudId}.mp4`,
      thumbnailUrl: `https://picsum.photos/seed/${i}/640/360`,
      duration: faker.number.float({ min: 3, max: 10, fractionDigits: 1 }),
      fileSize: faker.number.int({ min: 1_000_000, max: 30_000_000 }),
      viewCount: faker.number.int({ min: 0, max: 50000 }),
      likeCount: faker.number.int({ min: 0, max: 5000 }),
      commentCount: faker.number.int({ min: 0, max: 200 }),
      tags: faker.helpers
        .arrayElements(["coding", "design", "life", "music", "food", "travel", "art"], {
          min: 1,
          max: 4,
        }),
      isSeeded: true,
    });
  }

  const createdVideos = await Video.insertMany(videos);
  console.log(`✅ Created ${createdVideos.length} videos`);

  // ── Create some Follows ───────────────────────────────────────────────────
  console.log("👥 Seeding follow relationships...");
  const followPairs = new Set();
  const follows = [];
  for (let i = 0; i < 300; i++) {
    const follower = faker.helpers.arrayElement(createdUsers);
    const following = faker.helpers.arrayElement(createdUsers);
    const key = `${follower._id}_${following._id}`;
    if (follower._id.toString() !== following._id.toString() && !followPairs.has(key)) {
      followPairs.add(key);
      follows.push({ follower: follower._id, following: following._id });
    }
  }
  await Follow.insertMany(follows);
  console.log(`✅ Created ${follows.length} follow relationships`);

  // ── Update follower/following counts ──────────────────────────────────────
  for (const follow of follows) {
    await User.findByIdAndUpdate(follow.following, { $inc: { followerCount: 1 } });
    await User.findByIdAndUpdate(follow.follower, { $inc: { followingCount: 1 } });
  }

  // ── Update video counts per user ──────────────────────────────────────────
  for (const user of createdUsers) {
    const count = createdVideos.filter((v) => v.uploader.toString() === user._id.toString()).length;
    await User.findByIdAndUpdate(user._id, { videoCount: count });
  }

  console.log("🌱 Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
