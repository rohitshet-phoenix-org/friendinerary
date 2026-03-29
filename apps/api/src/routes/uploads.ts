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

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.mimetype)) {
      return sendError(res, "Only JPEG, PNG, WebP, and GIF images are supported", 400);
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return sendError(res, "Image must be under 5MB", 400);
    }

    let photoUrl: string;

    // Use Cloudinary if configured, otherwise fall back to base64 data URL
    if (process.env["CLOUDINARY_CLOUD_NAME"] && process.env["CLOUDINARY_API_KEY"] && process.env["CLOUDINARY_API_SECRET"]) {
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
      photoUrl = result.secure_url;
    } else {
      // Fallback: store as base64 data URL (works without Cloudinary)
      const base64 = file.buffer.toString("base64");
      photoUrl = `data:${file.mimetype};base64,${base64}`;
    }

    await prisma.user.update({ where: { id: user.id }, data: { profilePhoto: photoUrl } });
    return sendSuccess(res, { photoUrl });
  } catch (err) {
    return next(err);
  }
});

export default router;
