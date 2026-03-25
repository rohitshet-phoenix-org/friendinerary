import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import passport from "passport";

import { configurePassport } from "./middleware/passport";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";

// Routes
import authRoutes from "./routes/auth";
import tripRoutes from "./routes/trips";
import sectionRoutes from "./routes/sections";
import placeRoutes from "./routes/places";
import reservationRoutes from "./routes/reservations";
import expenseRoutes from "./routes/expenses";
import collaboratorRoutes from "./routes/collaborators";
import guideRoutes from "./routes/guides";
import aiRoutes from "./routes/ai";
import hotelRoutes from "./routes/hotels";
import userRoutes from "./routes/users";
import subscriptionRoutes from "./routes/subscriptions";
import webhookRoutes from "./routes/webhooks";
import uploadRoutes from "./routes/uploads";
import pinboardRoutes from "./routes/pinboard";
import storyRoutes from "./routes/stories";
import routeOptimizerRoutes from "./routes/routeOptimizer";

const app = express();

// ─── Security ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env["WEB_URL"] ?? "http://localhost:3000",
    credentials: true,
  })
);

// ─── Rate limiting ───────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

// ─── Body parsing ────────────────────────────────────────────────────────────
// Stripe webhooks need raw body
app.use("/api/webhooks/stripe", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// ─── Logging ─────────────────────────────────────────────────────────────────
if (process.env["NODE_ENV"] !== "test") {
  app.use(morgan("dev"));
}

// ─── Auth ────────────────────────────────────────────────────────────────────
configurePassport(passport);
app.use(passport.initialize());

// ─── Health check ────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "friendinerary-api", timestamp: new Date().toISOString() });
});

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/trips", sectionRoutes);
app.use("/api/trips", placeRoutes);
app.use("/api/trips", reservationRoutes);
app.use("/api/trips", expenseRoutes);
app.use("/api/trips", collaboratorRoutes);
app.use("/api/trips", aiRoutes);
app.use("/api/trips", storyRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/trips", routeOptimizerRoutes);
app.use("/api/guides", guideRoutes);
app.use("/api/hotels", hotelRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/pinboard", pinboardRoutes);

// ─── Error handling ──────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
