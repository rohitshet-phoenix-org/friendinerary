import { Router } from "express";
import Stripe from "stripe";
import { prisma } from "@friendinerary/db";
import { logger } from "../utils/logger";

const router = Router();
function getStripe() {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key, { apiVersion: "2024-04-10" });
}

// POST /api/webhooks/stripe
router.post("/stripe", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  if (!sig) return res.status(400).send("Missing stripe-signature");

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      req.body as Buffer,
      sig,
      process.env["STRIPE_WEBHOOK_SECRET"] ?? ""
    );
  } catch (err) {
    logger.error("Stripe webhook signature verification failed:", err);
    return res.status(400).send("Webhook signature verification failed");
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        if (!userId || !session.subscription) break;

        const stripeSubscription = await getStripe().subscriptions.retrieve(
          session.subscription as string
        );

        await prisma.subscription.upsert({
          where: { userId },
          update: {
            stripeSubscriptionId: stripeSubscription.id,
            status: "active",
            currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          },
          create: {
            userId,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: stripeSubscription.id,
            tier: "pro",
            interval: session.metadata?.interval === "annual" ? "annual" : "monthly",
            status: "active",
            currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          },
        });

        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionTier: "pro",
            subscriptionExpiry: new Date(stripeSubscription.current_period_end * 1000),
          },
        });

        logger.info(`User ${userId} upgraded to Pro`);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const dbSub = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: sub.id },
        });
        if (!dbSub) break;

        await prisma.subscription.update({
          where: { id: dbSub.id },
          data: {
            status: sub.status as "active" | "cancelled" | "past_due" | "trialing",
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const dbSub = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: sub.id },
        });
        if (!dbSub) break;

        await Promise.all([
          prisma.subscription.update({ where: { id: dbSub.id }, data: { status: "cancelled" } }),
          prisma.user.update({
            where: { id: dbSub.userId },
            data: { subscriptionTier: "free", subscriptionExpiry: null },
          }),
        ]);

        logger.info(`User ${dbSub.userId} downgraded to Free`);
        break;
      }

      default:
        logger.info(`Unhandled Stripe event: ${event.type}`);
    }

    return res.json({ received: true });
  } catch (err) {
    logger.error("Stripe webhook handler error:", err);
    return res.status(500).json({ error: "Webhook handler failed" });
  }
});

// POST /api/webhooks/inbound-email — handle forwarded reservation emails
router.post("/inbound-email", async (req, res) => {
  try {
    const { to, text, html } = req.body as { to: string; text: string; html?: string };

    // Find trip by inbound email address
    const trip = await prisma.trip.findFirst({ where: { inboundEmail: to } });
    if (!trip) return res.status(200).send("ok");

    // Parse and create reservation
    const { parseEmailReservation } = await import("../services/emailParser");
    const parsed = await parseEmailReservation(text, html);

    if (parsed) {
      await prisma.reservation.create({
        data: {
          tripId: trip.id,
          type: parsed.type,
          source: "email_forward",
          detailsJson: parsed.details,
          status: "confirmed",
        },
      });
    }

    return res.status(200).send("ok");
  } catch (err) {
    logger.error("Inbound email webhook error:", err);
    return res.status(200).send("ok"); // Always 200 to avoid retries
  }
});

export default router;
