import { Worker } from "bullmq";
import { connection, type EmailParserJob } from "../queues";
import { prisma } from "@friendinerary/db";
import OpenAI from "openai";
import logger from "../utils/logger";
import { nanoid } from "nanoid";

const openai = new OpenAI({ apiKey: process.env["OPENAI_API_KEY"] });

export const emailParserWorker = new Worker<EmailParserJob>(
  "email-parser",
  async (job) => {
    const { tripId, emailBody, fromEmail } = job.data;
    logger.info(`Processing email for trip ${tripId} from ${fromEmail}`);

    // Parse with GPT-4o
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a reservation email parser. Extract travel booking details from the email and return valid JSON with these fields:
{
  "type": "flight" | "hotel" | "car_rental" | "activity",
  "title": "string",
  "provider": "string",
  "confirmationCode": "string | null",
  "startDate": "ISO datetime string | null",
  "endDate": "ISO datetime string | null",
  "details": {
    // For flight: { "flightNumber": "...", "departure": "...", "arrival": "...", "departureTime": "...", "arrivalTime": "..." }
    // For hotel: { "hotelName": "...", "address": "...", "checkIn": "...", "checkOut": "...", "roomType": "..." }
    // For car_rental: { "company": "...", "pickupLocation": "...", "dropoffLocation": "...", "carType": "..." }
    // For activity: { "activityName": "...", "location": "...", "startTime": "..." }
  }
}
Return ONLY valid JSON, no markdown.`,
        },
        {
          role: "user",
          content: emailBody.substring(0, 8000), // Limit to 8k chars
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0,
    });

    const parsed = JSON.parse(completion.choices[0]?.message.content ?? "{}");

    // Determine reservation type
    const typeMap: Record<string, string> = {
      flight: "FLIGHT",
      hotel: "HOTEL",
      car_rental: "CAR_RENTAL",
      activity: "ACTIVITY",
    };
    const reservationType = typeMap[parsed.type] ?? "ACTIVITY";

    // Save to database
    const reservation = await prisma.reservation.create({
      data: {
        tripId,
        type: reservationType as any,
        source: "EMAIL" as any,
        title: parsed.title ?? "Unknown reservation",
        provider: parsed.provider ?? fromEmail,
        confirmationCode: parsed.confirmationCode,
        startDate: parsed.startDate ? new Date(parsed.startDate) : null,
        endDate: parsed.endDate ? new Date(parsed.endDate) : null,
        rawData: parsed.details ?? {},
        status: "CONFIRMED" as any,
      },
    });

    logger.info(`Saved reservation ${reservation.id} for trip ${tripId}`);
    return { reservationId: reservation.id };
  },
  {
    connection,
    concurrency: 5,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
    },
  }
);

emailParserWorker.on("failed", (job, err) => {
  logger.error(`Email parser job ${job?.id} failed:`, err);
});

emailParserWorker.on("completed", (job) => {
  logger.info(`Email parser job ${job.id} completed`);
});
