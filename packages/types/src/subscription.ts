export type SubscriptionInterval = "monthly" | "annual";
export type SubscriptionStatus = "active" | "cancelled" | "past_due" | "trialing";

export interface Subscription {
  id: string;
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  tier: "pro";
  interval: SubscriptionInterval;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: "free" | "pro";
  interval: SubscriptionInterval | null;
  price: number;
  currency: string;
  stripePriceId: string | null;
  features: string[];
}

export const PRO_FEATURES = [
  "Route optimizer (up to 15 places/day)",
  "Gmail auto-import for reservations",
  "Export itinerary to Google Maps",
  "Unlimited AI Assistant messages",
  "Offline access (mobile)",
  "Offline map download",
  "Hotel price drop alerts",
  "Unlimited file attachments",
  "Download guides offline",
] as const;
