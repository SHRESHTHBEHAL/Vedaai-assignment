import { Worker } from "bullmq";
import { getRedisConnection, isRedisReady } from "../config/redis";
import { getGenerationQueue, type JobData } from "./generation.queue";
import { broadcastToAssignment } from "../websocket/ws.server";
import { generatePaperWithAI } from "../services/ai.service";
import { parseAIResponse } from "../services/parser.service";
import { AssignmentStore } from "../store";
import { logger } from "../utils/logger";
import type { WebSocketMessage } from "@shared/types";

const QUEUE_NAME = "paper-generation";

export function startWorker(store: AssignmentStore): void {
  const queue = getGenerationQueue();

  if (!queue) {
    logger.info("No Redis queue; setting up in-process worker");
    return;
  }

  const connection = getRedisConnection();
  if (!connection) return;

  new Worker<JobData>(
    QUEUE_NAME,
    async (job) => {
      await processJob(job.data, store);
    },
    { connection },
  );

  logger.info("BullMQ worker started");
}

export async function processJobInProcess(
  data: JobData,
  store: AssignmentStore,
): Promise<void> {
  await processJob(data, store);
}

async function processJob(
  data: JobData,
  store: AssignmentStore,
): Promise<void> {
  const { assignmentId, jobId, input } = data;

  const broadcast = (
    type: WebSocketMessage["type"],
    status: WebSocketMessage["status"],
    progress: number,
    message: string,
    extra?: Partial<WebSocketMessage>,
  ) => {
    broadcastToAssignment(assignmentId, {
      type,
      assignmentId,
      jobId,
      status,
      progress,
      message,
      ...extra,
    });
  };

  try {
    broadcast("JOB_STATUS", "processing", 0, "Starting paper generation...");
    await store.updateStatus(assignmentId, "processing", 0);
    await sleep(200);

    broadcast("JOB_PROGRESS", "processing", 20, "Building prompt...");
    await sleep(200);

    broadcast("JOB_PROGRESS", "processing", 50, "AI generating questions...");
    const rawResponse = await generatePaperWithAI(input);
    await sleep(200);

    broadcast("JOB_PROGRESS", "processing", 80, "Structuring paper...");
    const paper = parseAIResponse(
      rawResponse,
      assignmentId,
      input.subject,
      input.grade,
      input.topic,
      input.dueDate,
    );
    await sleep(200);

    await store.complete(assignmentId, paper);

    broadcast("JOB_COMPLETE", "completed", 100, "Question paper ready!", {
      paper,
    });

    logger.info(`Job ${jobId} completed for assignment ${assignmentId}`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Generation failed";
    logger.error(`Job ${jobId} failed:`, message);

    await store.updateStatus(assignmentId, "failed", 100, message);

    broadcast("JOB_ERROR", "failed", 100, message, { error: message });
    throw error;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
