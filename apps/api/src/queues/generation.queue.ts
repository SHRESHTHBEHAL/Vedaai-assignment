import { Queue } from "bullmq";
import { getRedisConnection } from "../config/redis";
import { logger } from "../utils/logger";
import type { AssignmentInput } from "@shared/types";

export type JobData = {
  assignmentId: string;
  jobId: string;
  input: AssignmentInput;
};

const QUEUE_NAME = "paper-generation";

let queue: Queue<JobData> | null = null;

export function getGenerationQueue(): Queue<JobData> | null {
  const connection = getRedisConnection();
  if (!connection || !queue) {
    try {
      if (connection) {
        queue = new Queue<JobData>(QUEUE_NAME, {
          connection,
          defaultJobOptions: {
            attempts: 3,
            backoff: { type: "exponential", delay: 5000 },
            removeOnComplete: { count: 100 },
            removeOnFail: { count: 50 },
          },
        });
        logger.info("BullMQ queue initialized");
      }
    } catch (error) {
      logger.warn("BullMQ queue unavailable, jobs will run in-process");
      return null;
    }
  }
  return queue;
}
