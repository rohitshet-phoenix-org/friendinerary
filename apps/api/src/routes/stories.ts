import { Router } from "express";
import { prisma } from "@friendinerary/db";
import { requireAuth } from "../middleware/auth";
import { requireTripAccess } from "../middleware/tripAccess";
import { sendSuccess, sendError } from "../utils/response";
import type { AuthRequest } from "../middleware/auth";
import type { User } from "@friendinerary/db";
import { nanoid } from "nanoid";

const router = Router();

// GET /api/trips/:tripId/stories
router.get("/:tripId/stories", requireAuth, requireTripAccess("view"), async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const stories = await prisma.tripStory.findMany({
      where: { tripId },
      orderBy: { createdAt: "desc" },
    });
    return sendSuccess(res, stories);
  } catch (err) {
    return next(err);
  }
});

// POST /api/trips/:tripId/stories
router.post("/:tripId/stories", requireAuth, requireTripAccess("view"), async (req, res, next) => {
  try {
    const user = (req as AuthRequest).user as User;
    const { tripId } = req.params;
    const { title, content, photos, visitedStops } = req.body as {
      title: string;
      content?: string;
      photos?: object[];
      visitedStops?: object[];
    };

    if (!title) return sendError(res, "title is required", 400);

    const story = await prisma.tripStory.create({
      data: {
        tripId,
        authorId: user.id,
        title,
        content: content ?? "",
        photosJson: photos ?? [],
        stopsJson: visitedStops ?? [],
        shareSlug: nanoid(12),
      },
    });

    return sendSuccess(res, story, 201);
  } catch (err) {
    return next(err);
  }
});

// PUT /api/trips/:tripId/stories/:storyId
router.put("/:tripId/stories/:storyId", requireAuth, async (req, res, next) => {
  try {
    const user = (req as AuthRequest).user as User;
    const { storyId } = req.params;
    const { title, content, photos, publishedAt } = req.body as {
      title?: string;
      content?: string;
      photos?: object[];
      publishedAt?: string | null;
    };

    const story = await prisma.tripStory.findUnique({ where: { id: storyId } });
    if (!story || story.authorId !== user.id) {
      return sendError(res, "Story not found or access denied", 404);
    }

    const updated = await prisma.tripStory.update({
      where: { id: storyId },
      data: {
        ...(title && { title }),
        ...(content !== undefined && { content }),
        ...(photos && { photosJson: photos }),
        ...(publishedAt !== undefined && {
          publishedAt: publishedAt ? new Date(publishedAt) : null,
        }),
      },
    });

    return sendSuccess(res, updated);
  } catch (err) {
    return next(err);
  }
});

// GET /stories/:shareSlug — public story view
router.get("/public/:shareSlug", async (req, res, next) => {
  try {
    const { shareSlug } = req.params;
    const story = await prisma.tripStory.findUnique({
      where: { shareSlug },
      include: { author: { select: { displayName: true, profilePhoto: true } } },
    });
    if (!story || !story.publishedAt) return sendError(res, "Story not found", 404);
    return sendSuccess(res, story);
  } catch (err) {
    return next(err);
  }
});

export default router;
