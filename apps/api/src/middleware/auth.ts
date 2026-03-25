import type { Request, Response, NextFunction } from "express";
import passport from "passport";
import type { User } from "@friendinerary/db";

export interface AuthRequest extends Request {
  user?: User;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  passport.authenticate("jwt", { session: false }, (err: Error, user: User | false) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ success: false, error: "Unauthorized" });
    (req as AuthRequest).user = user;
    return next();
  })(req, res, next);
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  passport.authenticate("jwt", { session: false }, (_err: Error, user: User | false) => {
    if (user) (req as AuthRequest).user = user;
    return next();
  })(req, res, next);
}

export function requirePro(req: Request, res: Response, next: NextFunction) {
  const user = (req as AuthRequest).user;
  if (!user) return res.status(401).json({ success: false, error: "Unauthorized" });
  if (user.subscriptionTier !== "pro") {
    return res.status(403).json({
      success: false,
      error: "This feature requires Friendinerary Pro",
      code: "PRO_REQUIRED",
    });
  }
  return next();
}
