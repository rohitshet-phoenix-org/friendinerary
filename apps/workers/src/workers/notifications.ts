import { Worker } from "bullmq";
import { connection, type NotificationJob } from "../queues";
import { prisma } from "@friendinerary/db";
import nodemailer from "nodemailer";
import logger from "../utils/logger";

const transporter = nodemailer.createTransport({
  host: process.env["SMTP_HOST"] ?? "smtp.resend.com",
  port: parseInt(process.env["SMTP_PORT"] ?? "465"),
  secure: true,
  auth: {
    user: process.env["SMTP_USER"] ?? "resend",
    pass: process.env["SMTP_PASSWORD"] ?? "",
  },
});

const FROM_EMAIL = process.env["FROM_EMAIL"] ?? "noreply@friendinerary.com";

export const notificationWorker = new Worker<NotificationJob>(
  "notifications",
  async (job) => {
    const { userId, type, payload } = job.data;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      logger.warn(`User ${userId} not found for notification`);
      return;
    }

    switch (type) {
      case "trip_invite": {
        await transporter.sendMail({
          from: FROM_EMAIL,
          to: user.email,
          subject: `${payload["inviterName"] ?? "Someone"} invited you to "${payload["tripName"]}"`,
          html: `
            <div style="font-family: sans-serif; max-width: 560px; margin: auto;">
              <h2>✈️ You're invited to join a trip!</h2>
              <p><strong>${payload["inviterName"]}</strong> has invited you to collaborate on <strong>"${payload["tripName"]}"</strong> on Friendinerary.</p>
              <p>
                <a href="${payload["joinUrl"]}" style="background:#F97316;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
                  Accept invitation
                </a>
              </p>
              <p style="color:#9CA3AF;font-size:12px;">Friendinerary — Plan trips together.</p>
            </div>
          `,
        });
        break;
      }

      case "price_alert": {
        await transporter.sendMail({
          from: FROM_EMAIL,
          to: user.email,
          subject: `Price drop alert: ${payload["hotelName"]} is now $${payload["currentPrice"]}`,
          html: `
            <div style="font-family: sans-serif; max-width: 560px; margin: auto;">
              <h2>🔔 Price drop for your hotel!</h2>
              <p><strong>${payload["hotelName"]}</strong> for your trip <strong>"${payload["tripName"]}"</strong> is now <strong>$${payload["currentPrice"]}/night</strong> — below your alert of $${payload["targetPrice"]}/night.</p>
              ${payload["bookingUrl"] ? `<p><a href="${payload["bookingUrl"]}" style="background:#F97316;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Book now</a></p>` : ""}
              <p style="color:#9CA3AF;font-size:12px;">Friendinerary Pro — Stay updated on hotel prices.</p>
            </div>
          `,
        });
        break;
      }

      case "trip_summary": {
        await transporter.sendMail({
          from: FROM_EMAIL,
          to: user.email,
          subject: `Your trip "${payload["tripName"]}" starts in 7 days!`,
          html: `
            <div style="font-family: sans-serif; max-width: 560px; margin: auto;">
              <h2>🗺️ Almost time to go!</h2>
              <p>Your trip <strong>"${payload["tripName"]}"</strong> starts in 7 days. Here's your summary:</p>
              <ul>
                <li>${payload["placeCount"]} places planned</li>
                <li>${payload["dayCount"]} days</li>
                <li>${payload["collaboratorCount"]} travelers</li>
              </ul>
              <p>
                <a href="${payload["tripUrl"]}" style="background:#F97316;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
                  View your itinerary
                </a>
              </p>
              <p style="color:#9CA3AF;font-size:12px;">Friendinerary — Have an amazing trip!</p>
            </div>
          `,
        });
        break;
      }

      default:
        logger.warn(`Unknown notification type: ${type}`);
    }

    logger.info(`Notification sent to ${user.email} (type: ${type})`);
  },
  {
    connection,
    concurrency: 10,
  }
);

notificationWorker.on("failed", (job, err) => {
  logger.error(`Notification job ${job?.id} failed:`, err);
});
