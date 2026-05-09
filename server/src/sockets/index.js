import { Server } from "socket.io";

let io;

// Map: roomId → Map(userId → { username, timer })
const typingUsers = new Map();

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // ── Join video comment room ──────────────────────────────────────────────
    socket.on("join_video_room", (videoId) => {
      const room = `video_${videoId}_comments`;
      socket.join(room);
      socket.data.currentRoom = room;
      socket.data.videoId = videoId;
    });

    socket.on("leave_video_room", (videoId) => {
      const room = `video_${videoId}_comments`;
      socket.leave(room);
      cleanupTyping(socket, room);
    });

    // ── Typing Indicator (debounced client-side, every ~3s) ──────────────────
    socket.on("user_typing", ({ videoId, userId, username }) => {
      const room = `video_${videoId}_comments`;

      if (!typingUsers.has(room)) typingUsers.set(room, new Map());
      const roomTypers = typingUsers.get(room);

      // Clear existing timer for this user
      if (roomTypers.has(userId)) {
        clearTimeout(roomTypers.get(userId).timer);
      }

      // Auto-clear after 4 seconds
      const timer = setTimeout(() => {
        roomTypers.delete(userId);
        broadcastTyping(room, roomTypers);
      }, 4000);

      roomTypers.set(userId, { username, timer });

      // Broadcast to everyone else in room
      broadcastTyping(room, roomTypers, socket.id);
    });

    socket.on("typing_stopped", ({ videoId, userId }) => {
      const room = `video_${videoId}_comments`;
      const roomTypers = typingUsers.get(room);
      if (roomTypers) {
        const user = roomTypers.get(userId);
        if (user) clearTimeout(user.timer);
        roomTypers.delete(userId);
        broadcastTyping(room, roomTypers);
      }
    });

    // ── Disconnect cleanup ───────────────────────────────────────────────────
    socket.on("disconnect", () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
      if (socket.data.currentRoom) {
        cleanupTyping(socket, socket.data.currentRoom);
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function broadcastTyping(room, roomTypers, excludeSocketId) {
  const names = Array.from(roomTypers.values())
    .slice(0, 3)
    .map((u) => u.username);

  const event = {
    names,
    text: formatTypingText(names),
  };

  if (excludeSocketId) {
    io.to(room).except(excludeSocketId).emit("typing_indicator", event);
  } else {
    io.to(room).emit("typing_indicator", event);
  }
}

function formatTypingText(names) {
  if (names.length === 0) return "";
  if (names.length === 1) return `${names[0]} is typing...`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`;
  return `${names[0]}, ${names[1]}, and ${names[2] || "others"} are typing...`;
}

function cleanupTyping(socket, room) {
  const roomTypers = typingUsers.get(room);
  if (!roomTypers) return;

  // Find and remove by any userId associated with this socket
  // (socket.data.userId set during typing)
  if (socket.data.userId) {
    const user = roomTypers.get(socket.data.userId);
    if (user) clearTimeout(user.timer);
    roomTypers.delete(socket.data.userId);
    broadcastTyping(room, roomTypers);
  }

  if (roomTypers.size === 0) typingUsers.delete(room);
}
