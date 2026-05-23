"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAssignmentStore } from "@web/lib/store";
import type { WebSocketMessage } from "@shared/types";

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ??
  (() => {
    const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
    return api.replace(/\/api\/v1$/, "").replace(/^http/, "ws") + "/ws";
  })();
const MAX_RECONNECT_ATTEMPTS = 5;

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const reconnectAttempts = useRef(0);

  const activeAssignmentId = useAssignmentStore(
    (s) => s.activeAssignmentId,
  );
  const handleWebSocketMessage = useAssignmentStore(
    (s) => s.handleWebSocketMessage,
  );

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttempts.current = 0;

        if (activeAssignmentId) {
          ws.send(
            JSON.stringify({
              type: "SUBSCRIBE",
              assignmentId: activeAssignmentId,
            }),
          );
        }
      };

      ws.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data) as Record<string, unknown>;

          if (raw.type === "CONNECTED") return;

          if (
            raw.type === "JOB_STATUS" ||
            raw.type === "JOB_PROGRESS" ||
            raw.type === "JOB_COMPLETE" ||
            raw.type === "JOB_ERROR"
          ) {
            handleWebSocketMessage(raw as unknown as WebSocketMessage);
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = Math.min(
            1000 * 2 ** reconnectAttempts.current,
            30000,
          );
          reconnectAttempts.current += 1;
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      // WebSocket not available
    }
  }, [activeAssignmentId, handleWebSocketMessage]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const subscribe = useCallback((assignmentId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ type: "SUBSCRIBE", assignmentId }),
      );
    }
  }, []);

  const unsubscribe = useCallback((assignmentId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ type: "UNSUBSCRIBE", assignmentId }),
      );
    }
  }, []);

  return { isConnected, subscribe, unsubscribe };
}
