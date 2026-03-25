import { Router } from "express";
import { prisma } from "@friendinerary/db";
import { requireAuth } from "../middleware/auth";
import { requireTripAccess } from "../middleware/tripAccess";
import { sendSuccess, sendError } from "../utils/response";
import { parseEmailReservation } from "../services/emailParser";

const router = Router();

// GET /api/trips/:tripId/reservations
router.get("/:tripId/reservations", requireAuth, requireTripAccess("view"), async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const reservations = await prisma.reservation.findMany({
      where: { tripId },
      orderBy: { createdAt: "desc" },
    });
    return sendSuccess(res, reservations);
  } catch (err) {
    return next(err);
  }
});

// POST /api/trips/:tripId/reservations — manual creation
router.post("/:tripId/reservations", requireAuth, requireTripAccess("edit"), async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const { type, details, linkedPlaceId } = req.body as {
      type: "flight" | "hotel" | "rental_car" | "activity";
      details: Record<string, unknown>;
      linkedPlaceId?: string;
    };

    if (!type || !details) return sendError(res, "type and details are required", 400);

    const reservation = await prisma.reservation.create({
      data: {
        tripId,
        type,
        source: "manual",
        detailsJson: details,
        linkedPlaceId: linkedPlaceId ?? null,
        status: "confirmed",
      },
    });

    return sendSuccess(res, reservation, 201);
  } catch (err) {
    return next(err);
  }
});

// PUT /api/trips/:tripId/reservations/:id
router.put("/:tripId/reservations/:id", requireAuth, requireTripAccess("edit"), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { details, status, linkedPlaceId } = req.body as {
      details?: Record<string, unknown>;
      status?: "confirmed" | "cancelled" | "pending";
      linkedPlaceId?: string | null;
    };

    const updated = await prisma.reservation.update({
      where: { id },
      data: {
        ...(details && { detailsJson: details }),
        ...(status && { status }),
        ...(linkedPlaceId !== undefined && { linkedPlaceId }),
      },
    });

    return sendSuccess(res, updated);
  } catch (err) {
    return next(err);
  }
});

// DELETE /api/trips/:tripId/reservations/:id
router.delete("/:tripId/reservations/:id", requireAuth, requireTripAccess("edit"), async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.reservation.delete({ where: { id } });
    return sendSuccess(res, null, 200, "Reservation deleted");
  } catch (err) {
    return next(err);
  }
});

// POST /api/trips/:tripId/reservations/parse-email — parse forwarded email
router.post("/:tripId/reservations/parse-email", requireAuth, requireTripAccess("edit"), async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const { emailText, emailHtml } = req.body as {
      emailText: string;
      emailHtml?: string;
    };

    const parsed = await parseEmailReservation(emailText, emailHtml);
    if (!parsed) return sendError(res, "Could not parse reservation from email", 422);

    const reservation = await prisma.reservation.create({
      data: {
        tripId,
        type: parsed.type,
        source: "email_forward",
        detailsJson: parsed.details,
        status: "confirmed",
      },
    });

    return sendSuccess(res, reservation, 201);
  } catch (err) {
    return next(err);
  }
});

export default router;
