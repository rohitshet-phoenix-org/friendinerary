import type { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const statusCode = err.statusCode ?? 500;
  const message = statusCode === 500 ? "Internal server error" : err.message;

  if (statusCode === 500) {
    logger.error("Unhandled error:", err);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(err.code && { code: err.code }),
    ...(process.env["NODE_ENV"] === "development" && { stack: err.stack }),
  });
}
