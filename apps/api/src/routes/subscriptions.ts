import { Router } from "express";
import Stripe from "stripe";
import { prisma } from "@friendinerary/db";
import { requireAuth } from "../middleware/auth";
import { sendSuccess, sendError } from "../utils/response";
import type { AuthRequest } from "../middleware/auth";
import type { User } from "@friendinerary/db";

const router = Router();
function getStripe() {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key, { apiVersion: "2024-04-10" });
}

// GET /api/subscriptions/plans
router.get("/plans", (_req, res) => {
  return sendSuccess(res, [
    {
      id: "free",
      name: "Free",
      tier: "free",
      interval: null,
      price: 0,
      currency: "USD",
      stripePriceId: null,
      features: [
        "Unlimited trips",
        "Unlimited places",
        "Real-time collaboration",
        "Budget tracking",
        "Basic AI Assistant (5 messages)",
        "Packing lists & checklists",
        "Embeddable maps",
        "Pinboard",
        "Chrome extension",
      ],
    },
    {
      id: "pro-monthly",
      name: "Pro (Monthly)",
      tier: "pro",
      interval: "monthly",
      price: 499,
      currency: "USD",
      stripePriceId: process.env["STRIPE_PRO_MONTHLY_PRICE_ID"],
      features: [
        "Everything in Free",
        "Route optimizer",
        "Gmail auto-import",
        "Export to Google Maps",
        "Unlimited AI messages",
        "Offline access",
        "Offline map downloads",
        "Hotel price drop alerts",
        "Unlimited file attachments",
      ],
    },
    {
      id: "pro-annual",
      name: "Pro (Annual)",
      tier: "pro",
      interval: "annual",
      price: 2999,
      currency: "USD",
      stripePriceId: process.env["STRIPE_PRO_ANNUAL_PRICE_ID"],
      features: ["Everything in Pro Monthly", "Save 50% vs monthly"],
    },
  ]);
});

// POST /api/subscriptions/checkout — create Stripe checkout session
router.post("/checkout", requireAuth, async (req, res, next) => {
  try {
    const user = (req as AuthRequest).user as User;
    const { priceId, interval } = req.body as { priceId: string; interval: "monthly" | "annual" };

    // Get or create Stripe customer
    let sub = await prisma.subscription.findUnique({ where: { userId: user.id } });
    let customerId = sub?.stripeCustomerId;

    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: user.email,
        name: user.displayName,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
    }

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env["WEB_URL"]}/pro/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env["WEB_URL"]}/pro`,
      metadata: { userId: user.id, interval },
    });

    return sendSuccess(res, { checkoutUrl: session.url });
  } catch (err) {
    return next(err);
  }
});

// GET /api/subscriptions/portal — customer portal
router.get("/portal", requireAuth, async (req, res, next) => {
  try {
    const user = (req as AuthRequest).user as User;
    const sub = await prisma.subscription.findUnique({ where: { userId: user.id } });
    if (!sub) return sendError(res, "No active subscription found", 404);

    const session = await getStripe().billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${process.env["WEB_URL"]}/settings`,
    });

    return sendSuccess(res, { portalUrl: session.url });
  } catch (err) {
    return next(err);
  }
});

// GET /api/subscriptions/status
router.get("/status", requireAuth, async (req, res, next) => {
  try {
    const user = (req as AuthRequest).user as User;
    const sub = await prisma.subscription.findUnique({ where: { userId: user.id } });
    return sendSuccess(res, { tier: user.subscriptionTier, subscription: sub });
  } catch (err) {
    return next(err);
  }
});

export default router;
