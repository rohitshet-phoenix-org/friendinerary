import Redis from "ioredis";
import { logger } from "../utils/logger";

let redis: Redis;

export async function connectRedis(): Promise<void> {
  redis = new Redis(process.env["REDIS_URL"] ?? "redis://localhost:6379", {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

  redis.on("error", (err) => logger.error("Redis error:", err));
  redis.on("connect", () => logger.info("✅ Redis connected"));

  await redis.connect();
}

export function getRedis(): Redis {
  if (!redis) throw new Error("Redis not initialized. Call connectRedis() first.");
  return redis;
}

export async function setCache<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
  await getRedis().setex(key, ttlSeconds, JSON.stringify(value));
}

export async function getCache<T>(key: string): Promise<T | null> {
  const val = await getRedis().get(key);
  return val ? (JSON.parse(val) as T) : null;
}

export async function deleteCache(key: string): Promise<void> {
  await getRedis().del(key);
}

export async function deleteCachePattern(pattern: string): Promise<void> {
  const keys = await getRedis().keys(pattern);
  if (keys.length > 0) await getRedis().del(...keys);
}
