import { Router } from "express";
import { prisma } from "@friendinerary/db";
import { requireAuth } from "../middleware/auth";
import { sendSuccess, sendError } from "../utils/response";
import type { AuthRequest } from "../middleware/auth";
import type { User } from "@friendinerary/db";

const router = Router();

// GET /api/pinboard
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const user = (req as AuthRequest).user as User;
    const pins = await prisma.pinboardEntry.findMany({ where: { userId: user.id } });
    return sendSuccess(res, pins);
  } catch (err) {
    return next(err);
  }
});

// POST /api/pinboard
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const user = (req as AuthRequest).user as User;
    const { countryCode, cityName, lat, lng, visitedAt } = req.body as {
      countryCode: string;
      cityName?: string;
      lat?: number;
      lng?: number;
      visitedAt?: string;
    };

    if (!countryCode) return sendError(res, "countryCode is required", 400);

    const pin = await prisma.pinboardEntry.upsert({
      where: { userId_countryCode_cityName: { userId: user.id, countryCode, cityName: cityName ?? "" } },
      update: { visitedAt: visitedAt ? new Date(visitedAt) : null },
      create: {
        userId: user.id,
        countryCode,
        cityName: cityName ?? null,
        lat: lat ?? null,
        lng: lng ?? null,
        visitedAt: visitedAt ? new Date(visitedAt) : null,
      },
    });

    return sendSuccess(res, pin, 201);
  } catch (err) {
    return next(err);
  }
});

// DELETE /api/pinboard/:id
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const user = (req as AuthRequest).user as User;
    const { id } = req.params;
    const pin = await prisma.pinboardEntry.findUnique({ where: { id } });
    if (!pin || pin.userId !== user.id) return sendError(res, "Not found", 404);
    await prisma.pinboardEntry.delete({ where: { id } });
    return sendSuccess(res, null, 200, "Pin removed");
  } catch (err) {
    return next(err);
  }
});

export default router;
