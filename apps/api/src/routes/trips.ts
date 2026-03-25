import { Router } from "express";
import { prisma } from "@friendinerary/db";
import { requireAuth, optionalAuth } from "../middleware/auth";
import { requireTripAccess } from "../middleware/tripAccess";
import { sendSuccess, sendError, sendPaginated } from "../utils/response";
import { deleteCachePattern } from "../services/redis";
import type { AuthRequest } from "../middleware/auth";
import type { User } from "@friendinerary/db";
import slugify from "slugify";
import { nanoid } from "nanoid";

const router = Router();

// GET /api/trips — list user's trips
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const user = (req as AuthRequest).user as User;
    const page = Number(req.query["page"] ?? 1);
    const limit = Number(req.query["limit"] ?? 20);
    const skip = (page - 1) * limit;

    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        where: {
          OR: [
            { ownerId: user.id },
            { collaborators: { some: { userId: user.id } } },
          ],
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
        include: {
          _count: { select: { collaborators: true } },
          sections: { select: { _count: { select: { placeItems: true } } } },
        },
      }),
      prisma.trip.count({
        where: {
          OR: [
            { ownerId: user.id },
            { collaborators: { some: { userId: user.id } } },
          ],
        },
      }),
    ]);

    return sendPaginated(res, trips, total, page, limit);
  } catch (err) {
    return next(err);
  }
});

// POST /api/trips — create trip
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const user = (req as AuthRequest).user as User;
    const { name, destinations, startDate, endDate, privacyLevel, coverPhotoUrl } = req.body as {
      name: string;
      destinations: string[];
      startDate?: string;
      endDate?: string;
      privacyLevel?: "public" | "friends" | "private";
      coverPhotoUrl?: string;
    };

    if (!name) return sendError(res, "name is required", 400);

    const baseSlug = slugify(name, { lower: true, strict: true });
    const slug = `${baseSlug}-${nanoid(6)}`;

    // Create day sections if dates are provided
    const dayCount =
      startDate && endDate
        ? Math.ceil(
            (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
          ) + 1
        : 0;

    const SECTION_COLORS = [
      "#F97316", "#8B5CF6", "#3B82F6", "#10B981",
      "#F59E0B", "#EF4444", "#EC4899", "#06B6D4",
    ];

    const daySections = Array.from({ length: dayCount }, (_, i) => {
      const date = new Date(startDate!);
      date.setDate(date.getDate() + i);
      return {
        type: "day" as const,
        name: `Day ${i + 1}${destinations[0] ? ` — ${destinations[0].split(",")[0]}` : ""}`,
        date,
        color: SECTION_COLORS[i % SECTION_COLORS.length] ?? "#F97316",
        order: i + 1,
      };
    });

    const trip = await prisma.trip.create({
      data: {
        slug,
        name,
        ownerId: user.id,
        destinations: destinations ?? [],
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        privacyLevel: privacyLevel ?? "private",
        coverPhotoUrl: coverPhotoUrl ?? null,
        inboundEmail: `trip+${nanoid(10)}@${process.env["INBOUND_EMAIL_DOMAIN"] ?? "friendinerary.com"}`,
        sections: {
          create: [
            { type: "ideas", name: "Ideas", color: "#9CA3AF", order: 0 },
            ...daySections,
          ],
        },
      },
      include: { sections: { orderBy: { order: "asc" }, include: { placeItems: true } } },
    });

    return sendSuccess(res, trip, 201);
  } catch (err) {
    return next(err);
  }
});

// GET /api/trips/:tripId — get full trip
router.get("/:tripId", optionalAuth, requireTripAccess("view"), async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        sections: {
          orderBy: { order: "asc" },
          include: {
            placeItems: {
              orderBy: { order: "asc" },
              include: { place: true, votes: true },
            },
          },
        },
        collaborators: {
          include: { user: { select: { id: true, displayName: true, profilePhoto: true, email: true } } },
        },
        reservations: true,
        expenses: { include: { splits: true } },
        budget: true,
        attachments: true,
      },
    });

    return sendSuccess(res, trip);
  } catch (err) {
    return next(err);
  }
});

// PUT /api/trips/:tripId — update trip
router.put("/:tripId", requireAuth, requireTripAccess("edit"), async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const { name, destinations, startDate, endDate, privacyLevel, coverPhotoUrl, status } =
      req.body as {
        name?: string;
        destinations?: string[];
        startDate?: string | null;
        endDate?: string | null;
        privacyLevel?: "public" | "friends" | "private";
        coverPhotoUrl?: string | null;
        status?: "planning" | "active" | "completed";
      };

    const updated = await prisma.trip.update({
      where: { id: tripId },
      data: {
        ...(name && { name }),
        ...(destinations && { destinations }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(privacyLevel && { privacyLevel }),
        ...(coverPhotoUrl !== undefined && { coverPhotoUrl }),
        ...(status && { status }),
      },
    });

    await deleteCachePattern(`trip:${tripId}:*`);
    return sendSuccess(res, updated);
  } catch (err) {
    return next(err);
  }
});

// DELETE /api/trips/:tripId
router.delete("/:tripId", requireAuth, async (req, res, next) => {
  try {
    const user = (req as AuthRequest).user as User;
    const { tripId } = req.params;

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return sendError(res, "Trip not found", 404);
    if (trip.ownerId !== user.id) return sendError(res, "Only the owner can delete a trip", 403);

    await prisma.trip.delete({ where: { id: tripId } });
    return sendSuccess(res, null, 200, "Trip deleted");
  } catch (err) {
    return next(err);
  }
});

// POST /api/trips/:tripId/duplicate — duplicate trip
router.post("/:tripId/duplicate", requireAuth, requireTripAccess("view"), async (req, res, next) => {
  try {
    const user = (req as AuthRequest).user as User;
    const { tripId } = req.params;

    const original = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        sections: {
          orderBy: { order: "asc" },
          include: { placeItems: { orderBy: { order: "asc" } } },
        },
        budget: true,
      },
    });

    if (!original) return sendError(res, "Trip not found", 404);

    const newSlug = `${original.slug}-copy-${nanoid(4)}`;

    const newTrip = await prisma.trip.create({
      data: {
        slug: newSlug,
        name: `${original.name} (Copy)`,
        ownerId: user.id,
        destinations: original.destinations,
        startDate: original.startDate,
        endDate: original.endDate,
        privacyLevel: "private",
        inboundEmail: `trip+${nanoid(10)}@${process.env["INBOUND_EMAIL_DOMAIN"] ?? "friendinerary.com"}`,
        sections: {
          create: original.sections.map((s) => ({
            type: s.type,
            name: s.name,
            date: s.date,
            color: s.color,
            icon: s.icon,
            order: s.order,
            placeItems: {
              create: s.placeItems.map((pi) => ({
                placeId: pi.placeId,
                order: pi.order,
                startTime: pi.startTime,
                endTime: pi.endTime,
                notes: pi.notes,
                transportMode: pi.transportMode,
                durationMins: pi.durationMins,
                distanceKm: pi.distanceKm,
                addedByUserId: user.id,
                tripId: "",
              })),
            },
          })),
        },
        ...(original.budget && {
          budget: {
            create: {
              totalBudget: original.budget.totalBudget,
              currency: original.budget.currency,
              categoryBudgetsJson: original.budget.categoryBudgetsJson ?? {},
            },
          },
        }),
      },
      include: { sections: { orderBy: { order: "asc" }, include: { placeItems: true } } },
    });

    return sendSuccess(res, newTrip, 201);
  } catch (err) {
    return next(err);
  }
});

export default router;
