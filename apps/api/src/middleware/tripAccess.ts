import type { Response, NextFunction } from "express";
import { prisma } from "@friendinerary/db";
import type { AuthRequest } from "./auth";

/**
 * Verifies that the authenticated user has access to the requested trip.
 * Attaches `req.trip` for downstream handlers.
 * `permission` = "view" allows both viewers and editors; "edit" requires edit permission.
 */
export function requireTripAccess(permission: "view" | "edit" = "view") {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, error: "Unauthorized" });

    const { tripId } = req.params;
    if (!tripId) return res.status(400).json({ success: false, error: "tripId is required" });

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { collaborators: true },
    });

    if (!trip) return res.status(404).json({ success: false, error: "Trip not found" });

    const isOwner = trip.ownerId === user.id;
    const collaborator = trip.collaborators.find((c) => c.userId === user.id);

    const hasAccess =
      isOwner ||
      (permission === "view" && (collaborator != null)) ||
      (permission === "edit" && (isOwner || collaborator?.permission === "edit"));

    if (!hasAccess) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    // Attach trip to request for reuse
    (req as AuthRequest & { trip: typeof trip }).trip = trip;
    return next();
  };
}
