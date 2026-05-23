import Redis from "ioredis";
import { logger } from "../utils/logger";

let connection: Redis | null = null;

export function getRedisConnection(): Redis | null {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    logger.warn("REDIS_URL missing; BullMQ will run in-process.");
    return null;
  }

  if (!connection) {
    try {
      connection = new Redis(redisUrl, {
        maxRetriesPerRequest: null,
        lazyConnect: true,
      });
    } catch {
      logger.warn("Redis unavailable; BullMQ will run in-process.");
      return null;
    }
  }

  return connection;
}

export async function isRedisReady(): Promise<boolean> {
  const conn = getRedisConnection();
  if (!conn) return false;
  try {
    await conn.ping();
    return true;
  } catch {
    return false;
  }
}
