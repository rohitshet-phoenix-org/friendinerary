import "dotenv/config";
import { createServer } from "http";
import app from "./app";
import { initSocket } from "./socket/server";
import { connectRedis } from "./services/redis";
import { logger } from "./utils/logger";

const PORT = process.env["API_PORT"] ?? 4000;

async function bootstrap() {
  // Connect Redis
  await connectRedis();

  // Create HTTP server
  const httpServer = createServer(app);

  // Init WebSocket
  initSocket(httpServer);

  httpServer.listen(PORT, () => {
    logger.info(`🚀 Friendinerary API running on http://localhost:${PORT}`);
    logger.info(`🌍 Environment: ${process.env["NODE_ENV"] ?? "development"}`);
  });
}

bootstrap().catch((err) => {
  logger.error("Fatal startup error:", err);
  process.exit(1);
});
