import { Router } from "express";
import { prisma } from "@friendinerary/db";
import { requireAuth, requirePro } from "../middleware/auth";
import { requireTripAccess } from "../middleware/tripAccess";
import { sendSuccess, sendError } from "../utils/response";
import { Client, TravelMode } from "@googlemaps/google-maps-services-js";

const router = Router();
const mapsClient = new Client({});

interface OptimizePayload {
  placeItemIds: string[]; // ordered list of PlaceItem IDs to reorder
  sectionId: string;
  travelMode?: "driving" | "walking" | "transit" | "bicycling";
}

interface LegInfo {
  fromId: string;
  toId: string;
  distanceMeters: number;
  durationSeconds: number;
  distanceText: string;
  durationText: string;
}

// POST /api/trips/:tripId/optimize-route  (Pro feature)
router.post(
  "/:tripId/optimize-route",
  requireAuth,
  requirePro,
  requireTripAccess("edit"),
  async (req, res, next) => {
    try {
      const { tripId } = req.params;
      const { placeItemIds, sectionId, travelMode = "driving" } = req.body as OptimizePayload;

      if (!placeItemIds || placeItemIds.length < 2) {
        return sendError(res, "At least 2 place items required", 400);
      }

      // Load the place items with their coordinates
      const placeItems = await prisma.placeItem.findMany({
        where: {
          id: { in: placeItemIds },
          section: { tripId, id: sectionId },
        },
        include: { place: true },
      });

      if (placeItems.length !== placeItemIds.length) {
        return sendError(res, "Some place items not found", 404);
      }

      // Build ordered list as requested
      const ordered = placeItemIds
        .map((id) => placeItems.find((p) => p.id === id))
        .filter(Boolean) as typeof placeItems;

      // Check all have coordinates (stored as Json { lat, lng })
      const withCoords = ordered.filter((p) => {
        const coords = p.place?.coordinates as { lat?: number; lng?: number } | null;
        return coords?.lat != null && coords?.lng != null;
      });

      if (withCoords.length < 2) {
        return sendError(res, "Not enough places have coordinates for route optimization", 400);
      }

      const getCoords = (p: (typeof withCoords)[number]) =>
        p.place!.coordinates as { lat: number; lng: number };

      const apiKey = process.env["GOOGLE_MAPS_SERVER_KEY"] ?? "";
      if (!apiKey) {
        return sendError(res, "Maps API not configured", 500);
      }

      // Use Google Maps Directions API with waypoint optimization
      const origin = `${getCoords(withCoords[0]!).lat},${getCoords(withCoords[0]!).lng}`;
      const destination = `${getCoords(withCoords[withCoords.length - 1]!).lat},${getCoords(withCoords[withCoords.length - 1]!).lng}`;
      const waypoints = withCoords.slice(1, -1).map(
        (p) => `${getCoords(p).lat},${getCoords(p).lng}`
      );

      const mode = travelMode.toUpperCase() as TravelMode;

      const directionsRes = await mapsClient.directions({
        params: {
          key: apiKey,
          origin,
          destination,
          waypoints: waypoints.length > 0 ? waypoints : undefined,
          optimize: waypoints.length > 0,
          mode,
        },
      });

      const route = directionsRes.data.routes[0];
      if (!route) {
        return sendError(res, "No route found", 400);
      }

      // Build optimized order from waypoint_order (only middle items are reordered)
      const optimizedMiddleOrder = route.waypoint_order ?? [];
      const middleItems = withCoords.slice(1, -1);
      const reorderedMiddle = optimizedMiddleOrder.map((i) => middleItems[i]!);
      const optimizedItems = [withCoords[0]!, ...reorderedMiddle, withCoords[withCoords.length - 1]!];
      const optimizedIds = optimizedItems.map((p) => p.id);

      // Calculate per-leg info
      const legs: LegInfo[] = route.legs.map((leg, i) => ({
        fromId: optimizedItems[i]!.id,
        toId: optimizedItems[i + 1]!.id,
        distanceMeters: leg.distance?.value ?? 0,
        durationSeconds: leg.duration?.value ?? 0,
        distanceText: leg.distance?.text ?? "",
        durationText: leg.duration?.text ?? "",
      }));

      const totalDistanceMeters = legs.reduce((s, l) => s + l.distanceMeters, 0);
      const totalDurationSeconds = legs.reduce((s, l) => s + l.durationSeconds, 0);

      // Apply the optimized order by updating sortOrder of each PlaceItem
      await prisma.$transaction(
        optimizedIds.map((id, index) =>
          prisma.placeItem.update({ where: { id }, data: { order: index } })
        )
      );

      return sendSuccess(res, {
        optimizedIds,
        legs,
        totalDistanceMeters,
        totalDurationSeconds,
        totalDistanceText: `${(totalDistanceMeters / 1000).toFixed(1)} km`,
        totalDurationText: formatDuration(totalDurationSeconds),
        polyline: route.overview_polyline?.points ?? null,
      });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/trips/:tripId/directions  — get directions between two places (all users)
router.get("/:tripId/directions", requireAuth, requireTripAccess("view"), async (req, res, next) => {
  try {
    const { originPlaceId, destPlaceId, travelMode = "driving" } = req.query as {
      originPlaceId?: string;
      destPlaceId?: string;
      travelMode?: string;
    };

    if (!originPlaceId || !destPlaceId) {
      return sendError(res, "originPlaceId and destPlaceId are required", 400);
    }

    const [origin, dest] = await Promise.all([
      prisma.place.findUnique({ where: { id: originPlaceId } }),
      prisma.place.findUnique({ where: { id: destPlaceId } }),
    ]);

    if (!origin || !dest) return sendError(res, "Places not found", 404);

    const originCoords = origin.coordinates as { lat?: number; lng?: number } | null;
    const destCoords = dest.coordinates as { lat?: number; lng?: number } | null;
    if (!originCoords?.lat || !destCoords?.lat) return sendError(res, "Places missing coordinates", 400);

    const apiKey = process.env["GOOGLE_MAPS_SERVER_KEY"] ?? "";
    if (!apiKey) return sendError(res, "Maps API not configured", 500);

    const mode = (travelMode.toUpperCase()) as TravelMode;
    const directionsRes = await mapsClient.directions({
      params: {
        key: apiKey,
        origin: `${originCoords.lat},${originCoords.lng}`,
        destination: `${destCoords.lat},${destCoords.lng}`,
        mode,
        alternatives: true,
      },
    });

    const routes = directionsRes.data.routes.map((r) => ({
      summary: r.summary,
      distanceText: r.legs[0]?.distance?.text ?? "",
      durationText: r.legs[0]?.duration?.text ?? "",
      distanceMeters: r.legs[0]?.distance?.value ?? 0,
      durationSeconds: r.legs[0]?.duration?.value ?? 0,
      polyline: r.overview_polyline?.points ?? null,
      steps: r.legs[0]?.steps.map((s) => ({
        instruction: s.html_instructions,
        distanceText: s.distance?.text ?? "",
        durationText: s.duration?.text ?? "",
        travelMode: s.travel_mode,
      })) ?? [],
    }));

    return sendSuccess(res, { routes, travelMode });
  } catch (err) {
    return next(err);
  }
});

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export default router;
