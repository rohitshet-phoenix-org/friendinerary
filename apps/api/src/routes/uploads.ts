import { Router } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { prisma } from "@friendinerary/db";
import { requireAuth } from "../middleware/auth";
import { requireTripAccess } from "../middleware/tripAccess";
import { sendSuccess, sendError } from "../utils/response";
import type { AuthRequest } from "../middleware/auth";
import type { User } from "@friendinerary/db";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

cloudinary.config({
  cloud_name: process.env["CLOUDINARY_CLOUD_NAME"],
  api_key: process.env["CLOUDINARY_API_KEY"],
  api_secret: process.env["CLOUDINARY_API_SECRET"],
});

// POST /api/uploads/trips/:tripId/attachment
router.post("/trips/:tripId/attachment", requireAuth, requireTripAccess("edit"), upload.single("file"), async (req, res, next) => {
  try {
    const user = (req as AuthRequest).user as User;

    // Free tier: only allow link-based attachments, not file uploads
    if (user.subscriptionTier !== "pro") {
      return sendError(res, "File uploads require Friendinerary Pro", 403, "PRO_REQUIRED");
    }

    const file = req.file;
    if (!file) return sendError(res, "No file provided", 400);

    const { tripId } = req.params;

    // Upload to Cloudinary
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `friendinerary/trips/${tripId}`, resource_type: "auto" },
        (error, result) => {
          if (error || !result) reject(error);
          else resolve(result);
        }
      );
      stream.end(file.buffer);
    });

    const attachment = await prisma.attachment.create({
      data: {
        tripId,
        filename: file.originalname,
        fileUrl: result.secure_url,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        uploadedByUserId: user.id,
      },
    });

    return sendSuccess(res, attachment, 201);
  } catch (err) {
    return next(err);
  }
});

// POST /api/uploads/avatar — profile photo upload
router.post("/avatar", requireAuth, upload.single("file"), async (req, res, next) => {
  try {
    const user = (req as AuthRequest).user as User;
    const file = req.file;
    if (!file) return sendError(res, "No file provided", 400);

    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "friendinerary/avatars", transformation: [{ width: 400, height: 400, crop: "fill" }] },
        (error, result) => {
          if (error || !result) reject(error);
          else resolve(result);
        }
      );
      stream.end(file.buffer);
    });

    await prisma.user.update({ where: { id: user.id }, data: { profilePhoto: result.secure_url } });
    return sendSuccess(res, { photoUrl: result.secure_url });
  } catch (err) {
    return next(err);
  }
});

export default router;
