import { Router } from "express";
import { prisma } from "@friendinerary/db";
import { requireAuth } from "../middleware/auth";
import { requireTripAccess } from "../middleware/tripAccess";
import { sendSuccess, sendError } from "../utils/response";
import { emitToTrip } from "../socket/server";

const router = Router();

// POST /api/trips/:tripId/sections
router.post("/:tripId/sections", requireAuth, requireTripAccess("edit"), async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const { type, name, date, color, icon } = req.body as {
      type: "day" | "list" | "ideas" | "checklist";
      name: string;
      date?: string;
      color?: string;
      icon?: string;
    };

    if (!name) return sendError(res, "name is required", 400);

    const maxOrder = await prisma.section.aggregate({
      where: { tripId },
      _max: { order: true },
    });

    const section = await prisma.section.create({
      data: {
        tripId,
        type: type ?? "list",
        name,
        date: date ? new Date(date) : null,
        color: color ?? "#F97316",
        icon: icon ?? null,
        order: (maxOrder._max.order ?? 0) + 1,
      },
      include: { placeItems: true },
    });

    emitToTrip(tripId, "section_created", section);
    return sendSuccess(res, section, 201);
  } catch (err) {
    return next(err);
  }
});

// PUT /api/trips/:tripId/sections/:sectionId
router.put("/:tripId/sections/:sectionId", requireAuth, requireTripAccess("edit"), async (req, res, next) => {
  try {
    const { tripId, sectionId } = req.params;
    const { name, date, color, icon, isCollapsed, order } = req.body as {
      name?: string;
      date?: string | null;
      color?: string;
      icon?: string | null;
      isCollapsed?: boolean;
      order?: number;
    };

    const section = await prisma.section.update({
      where: { id: sectionId },
      data: {
        ...(name !== undefined && { name }),
        ...(date !== undefined && { date: date ? new Date(date) : null }),
        ...(color !== undefined && { color }),
        ...(icon !== undefined && { icon }),
        ...(isCollapsed !== undefined && { isCollapsed }),
        ...(order !== undefined && { order }),
      },
      include: { placeItems: true },
    });

    emitToTrip(tripId, "section_updated", section);
    return sendSuccess(res, section);
  } catch (err) {
    return next(err);
  }
});

// DELETE /api/trips/:tripId/sections/:sectionId
router.delete("/:tripId/sections/:sectionId", requireAuth, requireTripAccess("edit"), async (req, res, next) => {
  try {
    const { tripId, sectionId } = req.params;
    await prisma.section.delete({ where: { id: sectionId } });
    emitToTrip(tripId, "section_deleted", { sectionId });
    return sendSuccess(res, null, 200, "Section deleted");
  } catch (err) {
    return next(err);
  }
});

// POST /api/trips/:tripId/sections/reorder
router.post("/:tripId/sections/reorder", requireAuth, requireTripAccess("edit"), async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const { orderedIds } = req.body as { orderedIds: string[] };

    await Promise.all(
      orderedIds.map((id, index) =>
        prisma.section.update({ where: { id }, data: { order: index } })
      )
    );

    emitToTrip(tripId, "sections_reordered", { orderedIds });
    return sendSuccess(res, { orderedIds });
  } catch (err) {
    return next(err);
  }
});

// POST /api/trips/:tripId/sections/:sectionId/places — add place to section
router.post("/:tripId/sections/:sectionId/places", requireAuth, requireTripAccess("edit"), async (req, res, next) => {
  try {
    const { tripId, sectionId } = req.params;
    const { googlePlaceId, name, address, lat, lng, category, photoUrls, rating, website, phoneNumber, description, notes, startTime, endTime } = req.body as {
      googlePlaceId?: string;
      name: string;
      address: string;
      lat: number;
      lng: number;
      category?: string;
      photoUrls?: string[];
      rating?: number;
      website?: string;
      phoneNumber?: string;
      description?: string;
      notes?: string;
      startTime?: string;
      endTime?: string;
    };

    if (!name || lat == null || lng == null) {
      return sendError(res, "name, lat, lng are required", 400);
    }

    const { user } = req as { user: { id: string } };

    // Upsert the canonical place
    let place = googlePlaceId
      ? await prisma.place.findUnique({ where: { googlePlaceId } })
      : null;

    if (!place) {
      place = await prisma.place.create({
        data: {
          googlePlaceId: googlePlaceId ?? null,
          name,
          address,
          lat,
          lng,
          category: (category as never) ?? "other",
          photoUrls: photoUrls ?? [],
          rating: rating ?? null,
          website: website ?? null,
          phoneNumber: phoneNumber ?? null,
          description: description ?? null,
        },
      });
    }

    const maxOrder = await prisma.placeItem.aggregate({
      where: { sectionId },
      _max: { order: true },
    });

    const placeItem = await prisma.placeItem.create({
      data: {
        sectionId,
        tripId,
        placeId: place.id,
        order: (maxOrder._max.order ?? 0) + 1,
        notes: notes ?? "",
        startTime: startTime ?? null,
        endTime: endTime ?? null,
        addedByUserId: user.id,
      },
      include: { place: true, votes: true },
    });

    emitToTrip(tripId, "place_item_added", placeItem);
    return sendSuccess(res, placeItem, 201);
  } catch (err) {
    return next(err);
  }
});

// PUT /api/trips/:tripId/sections/:sectionId/places/:itemId
router.put("/:tripId/sections/:sectionId/places/:itemId", requireAuth, requireTripAccess("edit"), async (req, res, next) => {
  try {
    const { tripId, itemId } = req.params;
    const { notes, startTime, endTime, transportMode, durationMins, distanceKm, isChecked, order, sectionId: newSectionId } = req.body as {
      notes?: string;
      startTime?: string | null;
      endTime?: string | null;
      transportMode?: string | null;
      durationMins?: number | null;
      distanceKm?: number | null;
      isChecked?: boolean;
      order?: number;
      sectionId?: string;
    };

    const updated = await prisma.placeItem.update({
      where: { id: itemId },
      data: {
        ...(notes !== undefined && { notes }),
        ...(startTime !== undefined && { startTime }),
        ...(endTime !== undefined && { endTime }),
        ...(transportMode !== undefined && { transportMode: transportMode as never }),
        ...(durationMins !== undefined && { durationMins }),
        ...(distanceKm !== undefined && { distanceKm }),
        ...(isChecked !== undefined && { isChecked }),
        ...(order !== undefined && { order }),
        ...(newSectionId !== undefined && { sectionId: newSectionId }),
      },
      include: { place: true, votes: true },
    });

    emitToTrip(tripId, "place_item_updated", updated);
    return sendSuccess(res, updated);
  } catch (err) {
    return next(err);
  }
});

// DELETE /api/trips/:tripId/sections/:sectionId/places/:itemId
router.delete("/:tripId/sections/:sectionId/places/:itemId", requireAuth, requireTripAccess("edit"), async (req, res, next) => {
  try {
    const { tripId, itemId } = req.params;
    await prisma.placeItem.delete({ where: { id: itemId } });
    emitToTrip(tripId, "place_item_deleted", { itemId });
    return sendSuccess(res, null, 200, "Place removed");
  } catch (err) {
    return next(err);
  }
});

// POST /api/trips/:tripId/sections/:sectionId/places/reorder
router.post("/:tripId/sections/:sectionId/places/reorder", requireAuth, requireTripAccess("edit"), async (req, res, next) => {
  try {
    const { tripId, sectionId } = req.params;
    const { orderedIds, targetSectionId } = req.body as {
      orderedIds: string[];
      targetSectionId?: string;
    };

    await Promise.all(
      orderedIds.map((id, index) =>
        prisma.placeItem.update({
          where: { id },
          data: { order: index, ...(targetSectionId && { sectionId: targetSectionId }) },
        })
      )
    );

    emitToTrip(tripId, "place_items_reordered", { sectionId, orderedIds, targetSectionId });
    return sendSuccess(res, { orderedIds });
  } catch (err) {
    return next(err);
  }
});

// POST /api/trips/:tripId/sections/:sectionId/places/:itemId/vote
router.post("/:tripId/sections/:sectionId/places/:itemId/vote", requireAuth, requireTripAccess("view"), async (req, res, next) => {
  try {
    const { tripId, itemId } = req.params;
    const { user } = req as { user: { id: string } };
    const { vote } = req.body as { vote: "up" | "down" };

    const existing = await prisma.placeVote.findUnique({
      where: { placeItemId_userId: { placeItemId: itemId, userId: user.id } },
    });

    let result;
    if (existing) {
      if (existing.vote === vote) {
        await prisma.placeVote.delete({ where: { id: existing.id } });
        result = null;
      } else {
        result = await prisma.placeVote.update({ where: { id: existing.id }, data: { vote } });
      }
    } else {
      result = await prisma.placeVote.create({ data: { placeItemId: itemId, userId: user.id, vote } });
    }

    emitToTrip(tripId, "vote_cast", { itemId, userId: user.id, vote, removed: result === null });
    return sendSuccess(res, result);
  } catch (err) {
    return next(err);
  }
});

export default router;
