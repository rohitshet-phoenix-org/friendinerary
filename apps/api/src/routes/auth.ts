import { Router } from "express";
import passport from "passport";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@friendinerary/db";
import { sendSuccess, sendError } from "../utils/response";
import { requireAuth } from "../middleware/auth";
import type { AuthRequest } from "../middleware/auth";
import type { User } from "@friendinerary/db";

const router = Router();

function generateTokens(userId: string) {
  const accessToken = jwt.sign(
    { sub: userId },
    process.env["JWT_SECRET"] ?? "secret",
    { expiresIn: process.env["JWT_EXPIRES_IN"] ?? "7d" }
  );
  const refreshToken = jwt.sign(
    { sub: userId },
    process.env["REFRESH_TOKEN_SECRET"] ?? "refresh-secret",
    { expiresIn: process.env["REFRESH_TOKEN_EXPIRES_IN"] ?? "30d" }
  );
  return { accessToken, refreshToken };
}

// POST /api/auth/signup
router.post("/signup", async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body as {
      email: string;
      password: string;
      displayName: string;
    };

    if (!email || !password || !displayName) {
      return sendError(res, "email, password, and displayName are required", 400);
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return sendError(res, "Email already in use", 409);

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash, displayName, authProvider: "email" },
    });

    const tokens = generateTokens(user.id);
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    const { passwordHash: _ph, ...safeUser } = user;
    return sendSuccess(res, { user: safeUser, ...tokens }, 201);
  } catch (err) {
    return next(err);
  }
});

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    if (!email || !password) return sendError(res, "email and password are required", 400);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) return sendError(res, "Invalid credentials", 401);

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return sendError(res, "Invalid credentials", 401);

    const tokens = generateTokens(user.id);
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    const { passwordHash: _ph, ...safeUser } = user;
    return sendSuccess(res, { user: safeUser, ...tokens });
  } catch (err) {
    return next(err);
  }
});

// POST /api/auth/refresh
router.post("/refresh", async (req, res, next) => {
  try {
    const { refreshToken } = req.body as { refreshToken: string };
    if (!refreshToken) return sendError(res, "refreshToken required", 400);

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.expiresAt < new Date()) {
      return sendError(res, "Invalid or expired refresh token", 401);
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env["REFRESH_TOKEN_SECRET"] ?? "refresh-secret"
    ) as { sub: string };

    await prisma.refreshToken.delete({ where: { token: refreshToken } });
    const tokens = generateTokens(decoded.sub);
    await prisma.refreshToken.create({
      data: {
        userId: decoded.sub,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return sendSuccess(res, tokens);
  } catch (err) {
    return next(err);
  }
});

// POST /api/auth/logout
router.post("/logout", requireAuth, async (req, res, next) => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    const user = (req as AuthRequest).user as User;
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken, userId: user.id } });
    }
    return sendSuccess(res, null, 200, "Logged out successfully");
  } catch (err) {
    return next(err);
  }
});

// GET /api/auth/me
router.get("/me", requireAuth, (req, res) => {
  const user = (req as AuthRequest).user as User;
  const { passwordHash: _ph, ...safeUser } = user;
  return sendSuccess(res, safeUser);
});

// Google OAuth
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));
router.get("/google/callback", passport.authenticate("google", { session: false }), (req, res) => {
  const user = (req as AuthRequest).user as User;
  const tokens = generateTokens(user.id);
  res.redirect(`${process.env["WEB_URL"]}/auth/callback?token=${tokens.accessToken}&refresh=${tokens.refreshToken}`);
});

// Facebook OAuth
router.get("/facebook", passport.authenticate("facebook", { scope: ["email"], session: false }));
router.get("/facebook/callback", passport.authenticate("facebook", { session: false }), (req, res) => {
  const user = (req as AuthRequest).user as User;
  const tokens = generateTokens(user.id);
  res.redirect(`${process.env["WEB_URL"]}/auth/callback?token=${tokens.accessToken}&refresh=${tokens.refreshToken}`);
});

export default router;
