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

// GET /api/users/:userId/profile — public profile with trips, stories, traveled places
router.get("/:userId/profile", requireAuth, async (req, res, next) => {
  try {
    const currentUser = (req as AuthRequest).user as User;
    const { userId } = req.params;

    const profile = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: { select: { following: true, followers: true } },
        ownedTrips: {
          orderBy: { startDate: "desc" },
          select: {
            id: true,
            name: true,
            coverPhotoUrl: true,
            startDate: true,
            endDate: true,
            destinations: true,
            _count: { select: { sections: true } },
          },
        },
        stories: {
          where: { publishedAt: { not: null } },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            shareSlug: true,
            coverPhotoUrl: true,
            createdAt: true,
          },
        },
        traveledPlaces: {
          orderBy: { visitedAt: "desc" },
        },
      },
    });

    if (!profile) return sendError(res, "User not found", 404);

    // Check if current user follows this profile
    let isFollowing = false;
    if (currentUser.id !== userId) {
      const follow = await prisma.userFollow.findUnique({
        where: { followerId_followingId: { followerId: currentUser.id, followingId: userId } },
      });
      isFollowing = !!follow;
    }

    const countries = new Set(profile.traveledPlaces.map((p) => p.country).filter(Boolean));

    const { passwordHash: _ph, ...safe } = profile;
    return sendSuccess(res, {
      ...safe,
      followerCount: profile._count.followers,
      followingCount: profile._count.following,
      trips: profile.ownedTrips.map((t) => ({
        id: t.id,
        name: t.name,
        coverPhotoUrl: t.coverPhotoUrl,
        startDate: t.startDate,
        endDate: t.endDate,
        destinations: t.destinations,
        placeCount: t._count.sections,
      })),
      stories: profile.stories,
      visitedPlaces: profile.traveledPlaces.map((p) => ({
        id: p.id,
        name: p.name,
        country: p.country,
        lat: p.lat,
        lng: p.lng,
        visitedAt: p.visitedAt,
      })),
      visitedPlacesCount: profile.traveledPlaces.length,
      countriesCount: countries.size,
      isFollowing,
    });
  } catch (err) {
    return next(err);
  }
});

// POST /api/users/:userId/follow
router.post("/:userId/follow", requireAuth, async (req, res, next) => {
  try {
    const currentUser = (req as AuthRequest).user as User;
    const { userId } = req.params;
    if (currentUser.id === userId) return sendError(res, "Cannot follow yourself", 400);

    await prisma.userFollow.create({
      data: { followerId: currentUser.id, followingId: userId },
    });
    return sendSuccess(res, null, 201, "Followed");
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === "P2002") return sendSuccess(res, null, 200, "Already following");
    return next(err);
  }
});

// DELETE /api/users/:userId/follow
router.delete("/:userId/follow", requireAuth, async (req, res, next) => {
  try {
    const currentUser = (req as AuthRequest).user as User;
    const { userId } = req.params;

    await prisma.userFollow.deleteMany({
      where: { followerId: currentUser.id, followingId: userId },
    });
    return sendSuccess(res, null, 200, "Unfollowed");
  } catch (err) {
    return next(err);
  }
});

// GET /api/users/me/traveled-places
router.get("/me/traveled-places", requireAuth, async (req, res, next) => {
  try {
    const user = (req as AuthRequest).user as User;
    const places = await prisma.traveledPlace.findMany({
      where: { userId: user.id },
      orderBy: { visitedAt: "desc" },
    });
    return sendSuccess(res, places);
  } catch (err) {
    return next(err);
  }
});

// POST /api/users/me/traveled-places
router.post("/me/traveled-places", requireAuth, async (req, res, next) => {
  try {
    const user = (req as AuthRequest).user as User;
    const { name, country, lat, lng } = req.body as {
      name: string;
      country?: string;
      lat: number;
      lng: number;
    };

    if (!name || lat == null || lng == null) {
      return sendError(res, "name, lat, and lng are required", 400);
    }

    const place = await prisma.traveledPlace.create({
      data: { userId: user.id, name, country: country ?? null, lat, lng },
    });
    return sendSuccess(res, place, 201);
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === "P2002") return sendError(res, "Place already added", 409);
    return next(err);
  }
});

// DELETE /api/users/me/traveled-places/:placeId
router.delete("/me/traveled-places/:placeId", requireAuth, async (req, res, next) => {
  try {
    const user = (req as AuthRequest).user as User;
    const { placeId } = req.params;

    await prisma.traveledPlace.deleteMany({
      where: { id: placeId, userId: user.id },
    });
    return sendSuccess(res, null, 200, "Removed");
  } catch (err) {
    return next(err);
  }
});

// GET /api/users/check-username/:username — real-time availability check
router.get("/check-username/:username", requireAuth, async (req, res, next) => {
  try {
    const currentUser = (req as AuthRequest).user as User;
    const { username } = req.params;
    const lower = username.toLowerCase();

    // Format validation
    const usernameRegex = /^[a-z0-9._]{5,14}$/;
    if (!usernameRegex.test(lower)) {
      return sendSuccess(res, {
        available: false,
        reason: "Username must be 5-14 characters, lowercase letters, numbers, periods, and underscores only",
      });
    }

    // Check if it's the user's own current username
    const self = await prisma.user.findUnique({ where: { id: currentUser.id }, select: { username: true } });
    if (self?.username === lower) {
      return sendSuccess(res, { available: true, reason: "This is your current username" });
    }

    // Check if taken by another user
    const existing = await prisma.user.findUnique({ where: { username: lower } });
    if (existing) {
      return sendSuccess(res, { available: false, reason: `"${lower}" is already taken` });
    }

    // Check if locked in username history (14-day lock on old usernames)
    const locked = await prisma.usernameHistory.findUnique({ where: { username: lower } });
    if (locked && locked.lockedUntil > new Date()) {
      return sendSuccess(res, { available: false, reason: `"${lower}" is temporarily unavailable` });
    }

    return sendSuccess(res, { available: true, reason: "Username is available" });
  } catch (err) {
    return next(err);
  }
});

// PUT /api/users/me/username — change username with rules
router.put("/me/username", requireAuth, async (req, res, next) => {
  try {
    const user = (req as AuthRequest).user as User;
    const { username } = req.body as { username: string };
    const lower = username.toLowerCase();

    // Format validation
    const usernameRegex = /^[a-z0-9._]{5,14}$/;
    if (!usernameRegex.test(lower)) {
      return sendError(res, "Username must be 5-14 characters: lowercase letters, numbers, periods, underscores only", 400);
    }

    // Get current user data
    const current = await prisma.user.findUnique({ where: { id: user.id } });
    if (!current) return sendError(res, "User not found", 404);

    // Same username check
    if (current.username === lower) {
      return sendError(res, "This is already your username", 400);
    }

    // 14-day / 2-change rule
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    if (current.usernameChangedAt && current.usernameChangedAt > fourteenDaysAgo && current.usernameChangeCount >= 2) {
      const nextChangeDate = new Date(current.usernameChangedAt.getTime() + 14 * 24 * 60 * 60 * 1000);
      return sendError(res, `You can change your username again after ${nextChangeDate.toLocaleDateString()}`, 429);
    }

    // Reset count if outside 14-day window
    const changeCount = (current.usernameChangedAt && current.usernameChangedAt > fourteenDaysAgo)
      ? current.usernameChangeCount + 1
      : 1;

    // Check uniqueness
    const existing = await prisma.user.findUnique({ where: { username: lower } });
    if (existing && existing.id !== user.id) {
      return sendError(res, `"${lower}" is already taken`, 409);
    }

    // Check locked usernames
    const locked = await prisma.usernameHistory.findUnique({ where: { username: lower } });
    if (locked && locked.lockedUntil > new Date() && locked.userId !== user.id) {
      return sendError(res, `"${lower}" is temporarily unavailable`, 409);
    }

    // Lock old username for 14 days
    if (current.username) {
      await prisma.usernameHistory.upsert({
        where: { username: current.username },
        update: { releasedAt: new Date(), lockedUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
        create: {
          userId: user.id,
          username: current.username,
          lockedUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      });
    }

    // Update username
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        username: lower,
        usernameChangedAt: new Date(),
        usernameChangeCount: changeCount,
      },
    });

    const { passwordHash: _ph, ...safe } = updated;
    return sendSuccess(res, {
      ...safe,
      changesRemaining: 2 - changeCount,
      nextResetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (err) {
    return next(err);
  }
});

// DELETE /api/users/me/profile-photo — remove profile photo
router.delete("/me/profile-photo", requireAuth, async (req, res, next) => {
  try {
    const user = (req as AuthRequest).user as User;
    await prisma.user.update({ where: { id: user.id }, data: { profilePhoto: null } });
    return sendSuccess(res, null, 200, "Profile photo removed");
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
