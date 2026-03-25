import type { Response } from "express";

export function sendSuccess<T>(res: Response, data: T, statusCode = 200, message?: string) {
  return res.status(statusCode).json({ success: true, data, ...(message && { message }) });
}

export function sendError(res: Response, error: string, statusCode = 400, code?: string) {
  return res.status(statusCode).json({ success: false, error, ...(code && { code }) });
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  const totalPages = Math.ceil(total / limit);
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  });
}
