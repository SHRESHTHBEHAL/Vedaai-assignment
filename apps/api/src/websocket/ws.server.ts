import { WebSocketServer, WebSocket } from "ws";
import { randomUUID } from "node:crypto";
import type { IncomingMessage } from "node:http";
import type { WebSocketMessage } from "@shared/types";
import { logger } from "../utils/logger";

interface ClientEntry {
  ws: WebSocket;
  subscriptions: Set<string>;
}

const clients = new Map<string, ClientEntry>();

export function createWebSocketServer(): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true, path: "/ws" });

  wss.on("connection", (ws: WebSocket, _req: IncomingMessage) => {
    const connectionId = randomUUID();
    const entry: ClientEntry = { ws, subscriptions: new Set() };
    clients.set(connectionId, entry);

    ws.send(
      JSON.stringify({
        type: "CONNECTED",
        message: "WebSocket connected",
        connectionId,
      }),
    );

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === "SUBSCRIBE" && msg.assignmentId) {
          entry.subscriptions.add(msg.assignmentId);
        } else if (msg.type === "UNSUBSCRIBE" && msg.assignmentId) {
          entry.subscriptions.delete(msg.assignmentId);
        }
      } catch {
        // ignore malformed messages
      }
    });

    ws.on("close", () => {
      clients.delete(connectionId);
    });

    ws.on("error", () => {
      clients.delete(connectionId);
    });
  });

  logger.info("WebSocket server initialized");
  return wss;
}

export function broadcastToAssignment(
  assignmentId: string,
  message: WebSocketMessage,
): void {
  const payload = JSON.stringify(message);
  for (const [, entry] of clients) {
    if (
      entry.subscriptions.has(assignmentId) &&
      entry.ws.readyState === WebSocket.OPEN
    ) {
      entry.ws.send(payload);
    }
  }
}

export function broadcastToAll(message: Record<string, unknown>): void {
  const payload = JSON.stringify(message);
  for (const [, entry] of clients) {
    if (entry.ws.readyState === WebSocket.OPEN) {
      entry.ws.send(payload);
    }
  }
}
