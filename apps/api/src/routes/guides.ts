import { Router } from "express";
import { prisma } from "@friendinerary/db";
import { sendSuccess } from "../utils/response";
import { setCache, getCache } from "../services/redis";

const router = Router();

// GET /api/guides?destination=&category=&page=
router.get("/", async (req, res, next) => {
  try {
    const { destination, category, page = "1", limit = "20" } = req.query as {
      destination?: string;
      category?: string;
      page?: string;
      limit?: string;
    };

    const cacheKey = `guides:${destination}:${category}:${page}`;
    const cached = await getCache(cacheKey);
    if (cached) return sendSuccess(res, cached);

    const where = {
      ...(destination && { destination: { contains: destination, mode: "insensitive" as const } }),
      ...(category && { categories: { has: category } }),
    };

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [guides, total] = await Promise.all([
      prisma.guide.findMany({
        where,
        orderBy: [{ likeCount: "desc" }, { viewCount: "desc" }],
        skip,
        take: limitNum,
        select: {
          id: true,
          slug: true,
          title: true,
          destination: true,
          authorName: true,
          coverPhotoUrl: true,
          categories: true,
          isUserGenerated: true,
          likeCount: true,
          viewCount: true,
        },
      }),
      prisma.guide.count({ where }),
    ]);

    const result = { guides, total, page: pageNum, totalPages: Math.ceil(total / limitNum) };
    await setCache(cacheKey, result, 600);
    return sendSuccess(res, result);
  } catch (err) {
    return next(err);
  }
});

// GET /api/guides/:guideId
router.get("/:guideId", async (req, res, next) => {
  try {
    const { guideId } = req.params;
    const cacheKey = `guides:detail:${guideId}`;
    const cached = await getCache(cacheKey);
    if (cached) return sendSuccess(res, cached);

    const guide = await prisma.guide.findFirst({
      where: { OR: [{ id: guideId }, { slug: guideId }] },
    });

    if (!guide) return res.status(404).json({ success: false, error: "Guide not found" });

    // Increment view count async
    prisma.guide.update({ where: { id: guide.id }, data: { viewCount: { increment: 1 } } }).catch(() => null);

    await setCache(cacheKey, guide, 3600);
    return sendSuccess(res, guide);
  } catch (err) {
    return next(err);
  }
});

export default router;
