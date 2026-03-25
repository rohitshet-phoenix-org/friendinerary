import { Worker } from "bullmq";
import { connection, notificationQueue, type HotelAlertJob } from "../queues";
import { prisma } from "@friendinerary/db";
import axios from "axios";
import logger from "../utils/logger";

export const hotelPriceAlertWorker = new Worker<HotelAlertJob>(
  "hotel-alerts",
  async (job) => {
    const { alertId, hotelId, tripId, userId, targetPrice, currency, checkIn, checkOut } = job.data;

    // Check current hotel price via aggregation API
    try {
      const apiKey = process.env["HOTELS_API_KEY"];
      if (!apiKey) {
        logger.warn("HOTELS_API_KEY not configured, skipping price check");
        return;
      }

      // Example: query a hotels API (stub for Amadeus, Booking.com API, etc.)
      const res = await axios.get("https://api.example-hotels.com/v1/hotels/price", {
        params: { hotelId, checkIn, checkOut, currency },
        headers: { "X-API-Key": apiKey },
        timeout: 10000,
      });

      const currentPrice = res.data.pricePerNight as number;

      if (currentPrice <= targetPrice) {
        // Price dropped! Send notification
        const trip = await prisma.trip.findUnique({ where: { id: tripId }, select: { name: true } });

        await notificationQueue.add("price-alert", {
          userId,
          type: "price_alert",
          payload: {
            hotelId,
            hotelName: res.data.name ?? "Hotel",
            tripName: trip?.name ?? "Your trip",
            currentPrice,
            targetPrice,
            bookingUrl: res.data.bookingUrl,
          },
        });

        // Update alert: mark as triggered
        await prisma.hotelPriceAlert.update({
          where: { id: alertId },
          data: { isActive: false },
        });

        logger.info(`Price alert triggered for hotel ${hotelId}: $${currentPrice} <= $${targetPrice}`);
      } else {
        logger.info(`Hotel ${hotelId} price $${currentPrice} still above target $${targetPrice}`);
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        logger.warn(`Hotel ${hotelId} not found in price API`);
      } else {
        throw err; // Let BullMQ retry
      }
    }
  },
  {
    connection,
    concurrency: 3,
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: "exponential", delay: 5000 },
    },
  }
);

hotelPriceAlertWorker.on("failed", (job, err) => {
  logger.error(`Hotel alert job ${job?.id} failed:`, err);
});
