import { Router } from "express";
import { prisma } from "@friendinerary/db";
import { requireAuth } from "../middleware/auth";
import { requireTripAccess } from "../middleware/tripAccess";
import { sendSuccess, sendError } from "../utils/response";
import type { AuthRequest } from "../middleware/auth";
import type { User } from "@friendinerary/db";
import OpenAI from "openai";

const router = Router();
const openai = new OpenAI({ apiKey: process.env["OPENAI_API_KEY"] });

// GET /api/trips/:tripId/assistant/threads
router.get("/:tripId/assistant/threads", requireAuth, requireTripAccess("view"), async (req, res, next) => {
  try {
    const user = (req as AuthRequest).user as User;
    const { tripId } = req.params;

    const threads = await prisma.chatThread.findMany({
      where: { tripId, userId: user.id },
      include: {
        messages: { orderBy: { timestamp: "asc" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
    });

    return sendSuccess(res, threads);
  } catch (err) {
    return next(err);
  }
});

// POST /api/trips/:tripId/assistant/threads — new thread
router.post("/:tripId/assistant/threads", requireAuth, requireTripAccess("view"), async (req, res, next) => {
  try {
    const user = (req as AuthRequest).user as User;
    const { tripId } = req.params;

    const thread = await prisma.chatThread.create({
      data: { tripId, userId: user.id, title: "New conversation" },
      include: { messages: true },
    });

    return sendSuccess(res, thread, 201);
  } catch (err) {
    return next(err);
  }
});

// POST /api/trips/:tripId/assistant/chat — send message
router.post("/:tripId/assistant/chat", requireAuth, requireTripAccess("view"), async (req, res, next) => {
  try {
    const user = (req as AuthRequest).user as User;
    const { tripId } = req.params;
    const { content, threadId } = req.body as { content: string; threadId?: string };

    if (!content) return sendError(res, "content is required", 400);

    // Free tier: max 5 messages per thread
    if (user.subscriptionTier !== "pro" && threadId) {
      const count = await prisma.chatMessage.count({ where: { threadId, role: "user" } });
      if (count >= 5) {
        return sendError(res, "Free tier limit reached. Upgrade to Pro for unlimited messages.", 403, "PRO_REQUIRED");
      }
    }

    // Get or create thread
    let thread = threadId
      ? await prisma.chatThread.findUnique({ where: { id: threadId }, include: { messages: { orderBy: { timestamp: "asc" } } } })
      : null;

    if (!thread) {
      thread = await prisma.chatThread.create({
        data: { tripId, userId: user.id, title: content.slice(0, 50) },
        include: { messages: true },
      });
    }

    // Get trip context
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { name: true, destinations: true, startDate: true, endDate: true },
    });

    // Save user message
    await prisma.chatMessage.create({
      data: { threadId: thread.id, role: "user", content, suggestedPlaces: [] },
    });

    // Build message history for OpenAI
    const history = thread.messages.slice(-10).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
    history.push({ role: "user", content });

    const completion = await openai.chat.completions.create({
      model: process.env["OPENAI_MODEL"] ?? "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a helpful travel assistant for Friendinerary, a travel planning app.
The user is planning a trip: "${trip?.name}" to ${trip?.destinations.join(", ")}.
${trip?.startDate ? `Travel dates: ${trip.startDate.toDateString()} to ${trip?.endDate?.toDateString() ?? "TBD"}.` : ""}
Provide concise, helpful travel advice. When suggesting specific places, include them in a JSON array at the end of your response in this exact format:
PLACES_JSON:[{"name":"Place Name","description":"Brief description","category":"restaurant|attraction|hotel|activity","address":"Address if known"}]
If no specific places to suggest, omit the PLACES_JSON section.`,
        },
        ...history,
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const rawContent = completion.choices[0]?.message.content ?? "";

    // Extract suggested places from response
    let cleanContent = rawContent;
    let suggestedPlaces: object[] = [];

    const placesMatch = rawContent.match(/PLACES_JSON:(\[.*?\])/s);
    if (placesMatch?.[1]) {
      try {
        suggestedPlaces = JSON.parse(placesMatch[1]) as object[];
        cleanContent = rawContent.replace(/PLACES_JSON:\[.*?\]/s, "").trim();
      } catch {
        // ignore parse error
      }
    }

    // Auto-title thread from first exchange
    if (thread.messages.length === 0) {
      await prisma.chatThread.update({
        where: { id: thread.id },
        data: { title: content.slice(0, 60) },
      });
    }

    // Save assistant response
    const assistantMessage = await prisma.chatMessage.create({
      data: {
        threadId: thread.id,
        role: "assistant",
        content: cleanContent,
        suggestedPlaces,
      },
    });

    // Update thread timestamp
    await prisma.chatThread.update({ where: { id: thread.id }, data: { updatedAt: new Date() } });

    return sendSuccess(res, {
      threadId: thread.id,
      message: assistantMessage,
      suggestedPlaces,
    });
  } catch (err) {
    return next(err);
  }
});

// POST /api/trips/:tripId/assistant/generate-itinerary
router.post("/:tripId/assistant/generate-itinerary", requireAuth, requireTripAccess("edit"), async (req, res, next) => {
  try {
    const { destination, durationDays, preferences, budget, travelStyle } = req.body as {
      destination: string;
      durationDays: number;
      preferences?: string[];
      budget?: "budget" | "mid-range" | "luxury";
      travelStyle?: string;
    };

    if (!destination || !durationDays) {
      return sendError(res, "destination and durationDays are required", 400);
    }

    const completion = await openai.chat.completions.create({
      model: process.env["OPENAI_MODEL"] ?? "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a travel expert. Generate detailed day-by-day itineraries. Respond with valid JSON only.",
        },
        {
          role: "user",
          content: `Generate a ${durationDays}-day itinerary for ${destination}.
${preferences?.length ? `Preferences: ${preferences.join(", ")}` : ""}
${budget ? `Budget: ${budget}` : ""}
${travelStyle ? `Travel style: ${travelStyle}` : ""}

Return JSON in this exact format:
{
  "days": [
    {
      "dayNumber": 1,
      "theme": "Theme for this day",
      "places": [
        {
          "name": "Place Name",
          "description": "Why visit and what to expect",
          "category": "attraction|restaurant|museum|park|shopping|activity",
          "suggestedDurationMinutes": 90,
          "address": "Address if known",
          "tips": "Optional tip"
        }
      ]
    }
  ],
  "notes": "General tips for the trip"
}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message.content;
    if (!content) return sendError(res, "Failed to generate itinerary", 500);

    const itinerary = JSON.parse(content);
    return sendSuccess(res, itinerary);
  } catch (err) {
    return next(err);
  }
});

export default router;
