import { Router } from "express";
import { prisma } from "@friendinerary/db";
import { requireAuth } from "../middleware/auth";
import { sendSuccess, sendError } from "../utils/response";
import type { AuthRequest } from "../middleware/auth";
import type { User } from "@friendinerary/db";
import bcrypt from "bcryptjs";

const router = Router();

// GET /api/users/me
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = (req as AuthRequest).user as User;
    const full = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        _count: { select: { ownedTrips: true, following: true, followers: true } },
        subscription: true,
      },
    });
    if (!full) return sendError(res, "User not found", 404);
    const { passwordHash: _ph, ...safe } = full;
    return sendSuccess(res, safe);
  } catch (err) {
    return next(err);
  }
});

// PUT /api/users/me
router.put("/me", requireAuth, async (req, res, next) => {
  try {
    const user = (req as AuthRequest).user as User;
    const { displayName, profilePhoto, flightDealAlerts } = req.body as {
      displayName?: string;
      profilePhoto?: string;
      flightDealAlerts?: boolean;
    };

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(displayName && { displayName }),
        ...(profilePhoto !== undefined && { profilePhoto }),
        ...(flightDealAlerts !== undefined && { flightDealAlerts }),
      },
    });

    const { passwordHash: _ph, ...safe } = updated;
    return sendSuccess(res, safe);
  } catch (err) {
    return next(err);
  }
});

// PUT /api/users/me/password
router.put("/me/password", requireAuth, async (req, res, next) => {
  try {
    const user = (req as AuthRequest).user as User;
    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };

    const full = await prisma.user.findUnique({ where: { id: user.id } });
    if (!full?.passwordHash) return sendError(res, "No password set for OAuth accounts", 400);

    const valid = await bcrypt.compare(currentPassword, full.passwordHash);
    if (!valid) return sendError(res, "Current password is incorrect", 401);

    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } });

    // Revoke all refresh tokens
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

    return sendSuccess(res, null, 200, "Password updated");
  } catch (err) {
    return next(err);
  }
});

// GET /api/users/me/pinboard
router.get("/me/pinboard", requireAuth, async (req, res, next) => {
  try {
    const user = (req as AuthRequest).user as User;
    const pins = await prisma.pinboardEntry.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return sendSuccess(res, pins);
  } catch (err) {
    return next(err);
  }
});

export default router;
