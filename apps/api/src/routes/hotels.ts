import { Router } from "express";
import { prisma } from "@friendinerary/db";
import { requireAuth } from "../middleware/auth";
import { sendSuccess, sendError } from "../utils/response";
import { setCache, getCache } from "../services/redis";
import type { AuthRequest } from "../middleware/auth";
import type { User } from "@friendinerary/db";
import axios from "axios";

const router = Router();

// GET /api/hotels/search?destination=&checkIn=&checkOut=&guests=
router.get("/search", async (req, res, next) => {
  try {
    const { destination, checkIn, checkOut, guests = "2" } = req.query as {
      destination?: string;
      checkIn?: string;
      checkOut?: string;
      guests?: string;
    };

    if (!destination || !checkIn || !checkOut) {
      return sendError(res, "destination, checkIn, checkOut are required", 400);
    }

    const cacheKey = `hotels:${destination}:${checkIn}:${checkOut}:${guests}`;
    const cached = await getCache(cacheKey);
    if (cached) return sendSuccess(res, cached);

    // In production, this would aggregate from multiple booking APIs.
    // Returning mock data structure that matches the real integration.
    const mockResults = [
      {
        id: "hotel-1",
        name: `${destination} Grand Hotel`,
        address: `123 Main St, ${destination}`,
        coordinates: { lat: 0, lng: 0 },
        starRating: 4,
        guestRating: 8.5,
        reviewCount: 1240,
        photoUrl: null,
        pricePerNight: 120,
        totalPrice: 120 * Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000),
        currency: "USD",
        provider: "booking.com",
        bookingUrl: "https://booking.com",
        amenities: ["WiFi", "Pool", "Breakfast"],
      },
    ];

    await setCache(cacheKey, mockResults, 1800);
    return sendSuccess(res, mockResults);
  } catch (err) {
    return next(err);
  }
});

// POST /api/hotels/price-alert — set price drop alert (Pro)
router.post("/price-alert", requireAuth, async (req, res, next) => {
  try {
    const user = (req as AuthRequest).user as User;
    if (user.subscriptionTier !== "pro") {
      return sendError(res, "Hotel price alerts require Pro", 403, "PRO_REQUIRED");
    }

    const { tripId, hotelId, hotelName, checkIn, checkOut, targetPrice, currency, bookingUrl } =
      req.body as {
        tripId: string;
        hotelId: string;
        hotelName: string;
        checkIn: string;
        checkOut: string;
        targetPrice: number;
        currency: string;
        bookingUrl: string;
      };

    const alert = await prisma.hotelPriceAlert.create({
      data: {
        userId: user.id,
        tripId,
        hotelId,
        hotelName,
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        targetPrice,
        currency,
        bookingUrl,
      },
    });

    return sendSuccess(res, alert, 201);
  } catch (err) {
    return next(err);
  }
});

export default router;
