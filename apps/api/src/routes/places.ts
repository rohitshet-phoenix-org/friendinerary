import { Router } from "express";
import axios from "axios";
import { prisma } from "@friendinerary/db";
import { optionalAuth } from "../middleware/auth";
import { sendSuccess, sendError } from "../utils/response";
import { setCache, getCache } from "../services/redis";

const router = Router();
const MAPS_KEY = process.env["GOOGLE_MAPS_SERVER_KEY"] ?? "";

// GET /api/places/search?q=&lat=&lng=
router.get("/search", optionalAuth, async (req, res, next) => {
  try {
    const { q, lat, lng, radius = "50000" } = req.query as {
      q?: string;
      lat?: string;
      lng?: string;
      radius?: string;
    };

    if (!q) return sendError(res, "q (query) is required", 400);

    const cacheKey = `places:search:${q}:${lat}:${lng}`;
    const cached = await getCache(cacheKey);
    if (cached) return sendSuccess(res, cached);

    const params: Record<string, string> = {
      input: q,
      key: MAPS_KEY,
      inputtype: "textquery",
      fields: "place_id,name,formatted_address,geometry,photos,rating,types,opening_hours",
    };

    if (lat && lng) {
      params["locationbias"] = `circle:${radius}@${lat},${lng}`;
    }

    const { data } = await axios.get(
      "https://maps.googleapis.com/maps/api/place/findplacefromtext/json",
      { params }
    );

    const results = (data.candidates ?? []).map((p: Record<string, unknown>) => ({
      googlePlaceId: p["place_id"],
      name: p["name"],
      address: p["formatted_address"],
      coordinates: {
        lat: (p["geometry"] as { location: { lat: number } } | undefined)?.location.lat,
        lng: (p["geometry"] as { location: { lng: number } } | undefined)?.location.lng,
      },
      photoUrl: (p["photos"] as Array<{ photo_reference: string }> | undefined)?.[0]
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${(p["photos"] as Array<{ photo_reference: string }>)[0]!.photo_reference}&key=${MAPS_KEY}`
        : null,
      rating: p["rating"] ?? null,
    }));

    await setCache(cacheKey, results, 3600);
    return sendSuccess(res, results);
  } catch (err) {
    return next(err);
  }
});

// GET /api/places/autocomplete?input=&lat=&lng=
router.get("/autocomplete", async (req, res, next) => {
  try {
    const { input, lat, lng } = req.query as { input?: string; lat?: string; lng?: string };
    if (!input) return sendError(res, "input is required", 400);

    const cacheKey = `places:autocomplete:${input}`;
    const cached = await getCache(cacheKey);
    if (cached) return sendSuccess(res, cached);

    const params: Record<string, string> = {
      input,
      key: MAPS_KEY,
      types: "establishment|geocode",
    };
    if (lat && lng) params["location"] = `${lat},${lng}`;

    const { data } = await axios.get(
      "https://maps.googleapis.com/maps/api/place/autocomplete/json",
      { params }
    );

    const results = (data.predictions ?? []).map((p: Record<string, unknown>) => ({
      googlePlaceId: p["place_id"],
      description: p["description"],
      mainText: (p["structured_formatting"] as Record<string, string> | undefined)?.["main_text"],
      secondaryText: (p["structured_formatting"] as Record<string, string> | undefined)?.["secondary_text"],
    }));

    await setCache(cacheKey, results, 300);
    return sendSuccess(res, results);
  } catch (err) {
    return next(err);
  }
});

// GET /api/places/:googlePlaceId — full place details
router.get("/:googlePlaceId", async (req, res, next) => {
  try {
    const { googlePlaceId } = req.params;
    const cacheKey = `places:detail:${googlePlaceId}`;
    const cached = await getCache(cacheKey);
    if (cached) return sendSuccess(res, cached);

    // Check DB first
    const dbPlace = await prisma.place.findUnique({ where: { googlePlaceId } });
    if (dbPlace) {
      await setCache(cacheKey, dbPlace, 3600);
      return sendSuccess(res, dbPlace);
    }

    // Fetch from Google
    const { data } = await axios.get(
      "https://maps.googleapis.com/maps/api/place/details/json",
      {
        params: {
          place_id: googlePlaceId,
          key: MAPS_KEY,
          fields: "place_id,name,formatted_address,geometry,photos,rating,user_ratings_total,opening_hours,formatted_phone_number,website,types,editorial_summary",
        },
      }
    );

    const p = data.result;
    if (!p) return sendError(res, "Place not found", 404);

    const photoUrls = (p.photos ?? []).slice(0, 5).map(
      (ph: { photo_reference: string }) =>
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${ph.photo_reference}&key=${MAPS_KEY}`
    );

    const place = await prisma.place.upsert({
      where: { googlePlaceId },
      update: {},
      create: {
        googlePlaceId,
        name: p.name,
        address: p.formatted_address,
        lat: p.geometry.location.lat,
        lng: p.geometry.location.lng,
        photoUrls,
        rating: p.rating ?? null,
        reviewCount: p.user_ratings_total ?? null,
        openingHoursJson: p.opening_hours ?? null,
        phoneNumber: p.formatted_phone_number ?? null,
        website: p.website ?? null,
        description: p.editorial_summary?.overview ?? null,
        category: "other",
      },
    });

    await setCache(cacheKey, place, 3600 * 24);
    return sendSuccess(res, place);
  } catch (err) {
    return next(err);
  }
});

export default router;
