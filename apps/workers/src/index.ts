import "dotenv/config";
import { emailParserWorker } from "./workers/emailParser";
import { notificationWorker } from "./workers/notifications";
import { hotelPriceAlertWorker } from "./workers/hotelPriceAlerts";
import logger from "./utils/logger";

logger.info("Starting Friendinerary workers...");

// Start all workers
emailParserWorker.run();
notificationWorker.run();
hotelPriceAlertWorker.run();

logger.info("Workers started successfully");

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("Received SIGTERM, shutting down workers...");
  await Promise.all([
    emailParserWorker.close(),
    notificationWorker.close(),
    hotelPriceAlertWorker.close(),
  ]);
  process.exit(0);
});
