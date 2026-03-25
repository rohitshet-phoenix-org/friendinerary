import { Router } from "express";
import { prisma } from "@friendinerary/db";
import { requireAuth } from "../middleware/auth";
import { requireTripAccess } from "../middleware/tripAccess";
import { sendSuccess, sendError } from "../utils/response";
import type { AuthRequest } from "../middleware/auth";
import type { User } from "@friendinerary/db";
import { nanoid } from "nanoid";

const router = Router();

// GET /api/trips/:tripId/collaborators
router.get("/:tripId/collaborators", requireAuth, requireTripAccess("view"), async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const collaborators = await prisma.tripCollaborator.findMany({
      where: { tripId },
      include: { user: { select: { id: true, displayName: true, profilePhoto: true, email: true } } },
    });
    return sendSuccess(res, collaborators);
  } catch (err) {
    return next(err);
  }
});

// POST /api/trips/:tripId/collaborators — invite by email
router.post("/:tripId/collaborators", requireAuth, requireTripAccess("edit"), async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const user = (req as AuthRequest).user as User;
    const { email, permission } = req.body as {
      email: string;
      permission: "view" | "edit";
    };

    if (!email) return sendError(res, "email is required", 400);

    const invitee = await prisma.user.findUnique({ where: { email } });
    if (!invitee) return sendError(res, "No Friendinerary account found for that email", 404);
    if (invitee.id === user.id) return sendError(res, "Cannot invite yourself", 400);

    const existing = await prisma.tripCollaborator.findUnique({
      where: { tripId_userId: { tripId, userId: invitee.id } },
    });
    if (existing) return sendError(res, "User is already a collaborator", 409);

    const collaborator = await prisma.tripCollaborator.create({
      data: { tripId, userId: invitee.id, permission: permission ?? "view" },
      include: { user: { select: { id: true, displayName: true, profilePhoto: true, email: true } } },
    });

    return sendSuccess(res, collaborator, 201);
  } catch (err) {
    return next(err);
  }
});

// PUT /api/trips/:tripId/collaborators/:userId — update permission
router.put("/:tripId/collaborators/:userId", requireAuth, requireTripAccess("edit"), async (req, res, next) => {
  try {
    const { tripId, userId } = req.params;
    const { permission } = req.body as { permission: "view" | "edit" };

    const updated = await prisma.tripCollaborator.update({
      where: { tripId_userId: { tripId, userId } },
      data: { permission },
    });

    return sendSuccess(res, updated);
  } catch (err) {
    return next(err);
  }
});

// DELETE /api/trips/:tripId/collaborators/:userId — remove collaborator
router.delete("/:tripId/collaborators/:userId", requireAuth, requireTripAccess("edit"), async (req, res, next) => {
  try {
    const { tripId, userId } = req.params;
    await prisma.tripCollaborator.delete({ where: { tripId_userId: { tripId, userId } } });
    return sendSuccess(res, null, 200, "Collaborator removed");
  } catch (err) {
    return next(err);
  }
});

// POST /api/trips/:tripId/share-link — generate shareable link
router.post("/:tripId/share-link", requireAuth, requireTripAccess("edit"), async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const { permission, expiresInDays } = req.body as {
      permission: "view" | "edit";
      expiresInDays?: number;
    };

    const token = nanoid(32);
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const link = await prisma.shareLink.create({
      data: { tripId, token, permission: permission ?? "view", expiresAt },
    });

    return sendSuccess(res, {
      ...link,
      url: `${process.env["WEB_URL"]}/join/${token}`,
    });
  } catch (err) {
    return next(err);
  }
});

// POST /api/trips/join/:token — accept share link invitation
router.post("/join/:token", requireAuth, async (req, res, next) => {
  try {
    const user = (req as AuthRequest).user as User;
    const { token } = req.params;

    const link = await prisma.shareLink.findUnique({ where: { token } });
    if (!link) return sendError(res, "Invalid or expired link", 404);
    if (link.expiresAt && link.expiresAt < new Date()) {
      return sendError(res, "This link has expired", 410);
    }

    const existing = await prisma.tripCollaborator.findUnique({
      where: { tripId_userId: { tripId: link.tripId, userId: user.id } },
    });

    if (!existing) {
      await prisma.tripCollaborator.create({
        data: { tripId: link.tripId, userId: user.id, permission: link.permission },
      });
    }

    return sendSuccess(res, { tripId: link.tripId });
  } catch (err) {
    return next(err);
  }
});

export default router;
