import "dotenv/config";
import http from "node:http";
import cors from "cors";
import express from "express";
import { connectMongo } from "./config/db";
import { isRedisReady } from "./config/redis";
import { AssignmentStore } from "./store";
import { assignmentRoutes } from "./routes/assignments.routes";
import { healthRoutes } from "./routes/health.routes";
import { errorHandler } from "./middleware/errorHandler";
import { createWebSocketServer } from "./websocket/ws.server";
import { getGenerationQueue } from "./queues/generation.queue";
import { startWorker } from "./queues/generation.worker";
import { logger } from "./utils/logger";

const port = Number(process.env.PORT ?? 4000);
const app = express();
const server = http.createServer(app);

// ── Express middleware ──────────────────────────────────────
app.use(
  cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:3000" }),
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Routes ──────────────────────────────────────────────────
app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/assignments", assignmentRoutes);

// Legacy route for backward compat
app.use("/health", healthRoutes);
app.use("/api/assignments", assignmentRoutes);

// ── Error handler ───────────────────────────────────────────
app.use(errorHandler);

// ── WebSocket ───────────────────────────────────────────────
const wss = createWebSocketServer();
server.on("upgrade", (request, socket, head) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);
  if (url.pathname === "/ws") {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});

// ── Bootstrap ───────────────────────────────────────────────
async function bootstrap(): Promise<void> {
  const mongoReady = await connectMongo();
  const store = new AssignmentStore(mongoReady);

  // Make store accessible to controllers via a global
  (globalThis as Record<string, unknown>).__assignmentStore = store;

  // Init queue
  getGenerationQueue();

  // Start worker
  try {
    startWorker(store);
  } catch (error) {
    logger.warn("Worker start failed, using in-process:", error);
  }

  const redisReady = await isRedisReady();

  server.listen(port, () => {
    logger.info(`VedaAI API listening on http://localhost:${port}`);
    logger.info(
      `Storage: ${mongoReady ? "MongoDB" : "In-Memory"} | Redis: ${redisReady ? "Connected" : "Unavailable"} | AI: ${process.env.GEMINI_API_KEY ? "Gemini" : "Fallback"}`,
    );
  });
}

void bootstrap();

