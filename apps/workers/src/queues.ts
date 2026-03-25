import { Queue } from "bullmq";
import IORedis from "ioredis";

const redisUrl = process.env["REDIS_URL"] ?? "redis://localhost:6379";
export const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

// Queue definitions
export const emailParserQueue = new Queue("email-parser", { connection });
export const notificationQueue = new Queue("notifications", { connection });
export const hotelAlertQueue = new Queue("hotel-alerts", { connection });

// Job payloads
export interface EmailParserJob {
  tripId: string;
  emailBody: string;
  fromEmail: string;
}

export interface NotificationJob {
  userId: string;
  type: "trip_invite" | "trip_update" | "price_alert" | "trip_summary";
  payload: Record<string, unknown>;
}

export interface HotelAlertJob {
  alertId: string;
  hotelId: string;
  tripId: string;
  userId: string;
  targetPrice: number;
  currency: string;
  checkIn: string;
  checkOut: string;
}
