import mongoose from "mongoose";
import { logger } from "../utils/logger";

let isConnected = false;

export async function connectMongo(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    logger.warn("MONGODB_URI missing; using in-memory store.");
    return false;
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    isConnected = true;
    logger.info("MongoDB connected");
    return true;
  } catch (error) {
    logger.warn("MongoDB unavailable; using in-memory store.");
    return false;
  }
}

export function isMongoConnected(): boolean {
  return isConnected;
}
