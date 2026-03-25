import type { Server as HttpServer } from "http";
import { Server as SocketServer } from "socket.io";
import jwt from "jsonwebtoken";
import { prisma } from "@friendinerary/db";
import { logger } from "../utils/logger";
import type { SocketEvent } from "@friendinerary/types";

let io: SocketServer;

// Active users per trip room: Map<tripId, Map<userId, socketId>>
const activeUsers = new Map<string, Map<string, { socketId: string; displayName: string; profilePhoto: string | null }>>();

export function initSocket(httpServer: HttpServer) {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env["WEB_URL"] ?? "http://localhost:3000",
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // JWT auth middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth["token"] as string | undefined;
    if (!token) return next(new Error("Authentication required"));

    try {
      const decoded = jwt.verify(token, process.env["JWT_SECRET"] ?? "secret") as { sub: string };
      const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
      if (!user) return next(new Error("User not found"));
      socket.data["user"] = user;
      return next();
    } catch {
      return next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data["user"] as { id: string; displayName: string; profilePhoto: string | null };
    logger.info(`Socket connected: ${user.displayName} (${socket.id})`);

    // Join a trip room
    socket.on("join_trip", async ({ tripId }: { tripId: string }) => {
      // Verify access
      const trip = await prisma.trip.findUnique({
        where: { id: tripId },
        include: { collaborators: { select: { userId: true } } },
      });
      if (!trip) return;

      const hasAccess =
        trip.ownerId === user.id ||
        trip.collaborators.some((c) => c.userId === user.id);

      if (!hasAccess && trip.privacyLevel === "private") return;

      socket.join(tripId);

      if (!activeUsers.has(tripId)) activeUsers.set(tripId, new Map());
      activeUsers.get(tripId)!.set(user.id, {
        socketId: socket.id,
        displayName: user.displayName,
        profilePhoto: user.profilePhoto,
      });

      // Notify others
      socket.to(tripId).emit("user_joined", {
        userId: user.id,
        displayName: user.displayName,
        profilePhoto: user.profilePhoto,
        connectedAt: new Date().toISOString(),
      });

      // Send current active users to the joining user
      const roomUsers = Array.from(activeUsers.get(tripId)!.entries()).map(([uid, info]) => ({
        userId: uid,
        displayName: info.displayName,
        profilePhoto: info.profilePhoto,
      }));
      socket.emit("active_users", roomUsers);

      logger.info(`User ${user.displayName} joined trip ${tripId}`);
    });

    // Leave trip room
    socket.on("leave_trip", ({ tripId }: { tripId: string }) => {
      socket.leave(tripId);
      activeUsers.get(tripId)?.delete(user.id);
      socket.to(tripId).emit("user_left", { userId: user.id });
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      // Remove user from all rooms
      for (const [tripId, users] of activeUsers.entries()) {
        if (users.has(user.id)) {
          users.delete(user.id);
          io.to(tripId).emit("user_left", { userId: user.id });
        }
      }
      logger.info(`Socket disconnected: ${user.displayName}`);
    });
  });

  logger.info("✅ WebSocket server initialized");
  return io;
}

/** Emit a trip event to all connected users in that trip's room */
export function emitToTrip(tripId: string, event: SocketEvent, data: unknown) {
  if (!io) return;
  io.to(tripId).emit(event, data);
}

export function getIO() {
  return io;
}
