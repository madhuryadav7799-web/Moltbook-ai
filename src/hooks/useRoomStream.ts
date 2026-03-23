"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buildWsUrl, getRoomMessages, Message } from "@/lib/apiClient";

const POLL_INTERVAL_MS = 2000;

interface UseRoomStreamOptions {
  roomId: string;
  /** Called each time a new batch of messages arrives (full list). */
  onMessages: (messages: Message[]) => void;
}

/**
 * Connects via WebSocket; falls back to 2-second polling if the socket
 * cannot be established or is closed unexpectedly.
 *
 * Returns { connected } where `connected` reflects the current WS state.
 */
export function useRoomStream({ roomId, onMessages }: UseRoomStreamOptions) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onMessagesRef = useRef(onMessages);
  onMessagesRef.current = onMessages;

  // ---- polling fallback ----
  const startPolling = useCallback(() => {
    if (pollTimerRef.current) return; // already polling
    const poll = async () => {
      try {
        const msgs = await getRoomMessages(roomId);
        onMessagesRef.current(msgs);
      } catch (err) {
        // Silently suppress polling errors – the backend may not be reachable
        // in dev or the room may not exist yet.
        if (process.env.NODE_ENV === "development") {
          console.debug("[useRoomStream] poll error:", err);
        }
      }
    };
    poll();
    pollTimerRef.current = setInterval(poll, POLL_INTERVAL_MS);
  }, [roomId]);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  // ---- WebSocket ----
  const connectWs = useCallback(() => {
    // Close any existing socket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    let ws: WebSocket;
    try {
      ws = new WebSocket(buildWsUrl(roomId));
    } catch {
      startPolling();
      return;
    }

    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      stopPolling(); // WS is live, no need to poll
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data as string);
        // Server may send a single message or an array
        if (Array.isArray(payload)) {
          onMessagesRef.current(payload as Message[]);
        } else if (payload && typeof payload === "object") {
          // Treat as an incremental append – fetch full list to keep sorted
          getRoomMessages(roomId)
            .then((msgs) => onMessagesRef.current(msgs))
            .catch((err) => {
              // Silently suppress fetch errors triggered by WS messages; the main
              // polling loop will recover. Log in development for easier debugging.
              if (process.env.NODE_ENV === "development") {
                console.debug("[useRoomStream] incremental fetch error:", err);
              }
            });
        }
      } catch {
        /* ignore malformed frames */
      }
    };

    ws.onerror = () => {
      setConnected(false);
      startPolling();
    };

    ws.onclose = () => {
      setConnected(false);
      startPolling();
    };
  }, [roomId, startPolling, stopPolling]);

  useEffect(() => {
    connectWs();
    return () => {
      wsRef.current?.close();
      wsRef.current = null;
      stopPolling();
    };
  }, [connectWs, stopPolling]);

  return { connected };
}
