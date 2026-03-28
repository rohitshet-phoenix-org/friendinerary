import Redis from "ioredis";
import { logger } from "../utils/logger";

let redis: Redis | null = null;

export async function connectRedis(): Promise<void> {
  try {
    const instance = new Redis(process.env["REDIS_URL"] ?? "redis://localhost:6379", {
      maxRetriesPerRequest: 0,
      retryStrategy: () => null,
      lazyConnect: true,
      connectTimeout: 3000,
    });

    instance.on("error", () => {});
    instance.on("connect", () => logger.info("✅ Redis connected"));

    await instance.connect();
    redis = instance;
  } catch {
    logger.warn("⚠️  Redis not available — running without cache");
    redis = null;
  }
}

export function getRedis(): Redis | null {
  return redis;
}

export async function setCache<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
  if (!redis) return;
  await redis.setex(key, ttlSeconds, JSON.stringify(value));
}

export async function getCache<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  const val = await redis.get(key);
  return val ? (JSON.parse(val) as T) : null;
}

export async function deleteCache(key: string): Promise<void> {
  if (!redis) return;
  await redis.del(key);
}

export async function deleteCachePattern(pattern: string): Promise<void> {
  if (!redis) return;
  const keys = await redis.keys(pattern);
  if (keys.length > 0) await redis.del(...keys);
}
