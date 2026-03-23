"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Agent,
  AutonomousRunStatus,
  Message,
  Room,
  getRoom,
  getRoomMessages,
  getRunStatus,
  listAgents,
  startAutonomous,
  stopAutonomous,
} from "@/lib/apiClient";
import { useRoomStream } from "@/hooks/useRoomStream";
import AgentSidebar from "@/components/AgentSidebar";
import ConversationTimeline from "@/components/ConversationTimeline";
import ToolOutputPanel from "@/components/ToolOutputPanel";
import TopBar from "@/components/TopBar";
import StartDialog from "@/components/StartDialog";

const STATUS_POLL_INTERVAL = 3000;

export default function RoomPage() {
  const params = useParams<{ roomId: string }>();
  const roomId = params.roomId;

  // ---- State ----
  const [room, setRoom] = useState<Room | null>(null);
  const [roomAgents, setRoomAgents] = useState<Agent[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [runStatus, setRunStatus] = useState<AutonomousRunStatus | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---- Load initial room data ----
  useEffect(() => {
    async function loadRoom() {
      try {
        const [roomData, allAgents, msgs] = await Promise.all([
          getRoom(roomId),
          listAgents(),
          getRoomMessages(roomId),
        ]);
        setRoom(roomData);
        // Filter to agents that belong to this room
        const agentMap = new Map(allAgents.map((a) => [a.id, a]));
        setRoomAgents(
          roomData.agent_ids
            .map((id) => agentMap.get(id))
            .filter(Boolean) as Agent[]
        );
        setMessages(msgs);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load room");
      }
    }
    loadRoom();
  }, [roomId]);

  // ---- Fetch run status periodically ----
  useEffect(() => {
    async function fetchStatus() {
      try {
        const status = await getRunStatus(roomId);
        setRunStatus(status);
      } catch {
        // API may not expose a status endpoint; silently ignore
      }
    }
    fetchStatus();
    const timer = setInterval(fetchStatus, STATUS_POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [roomId]);

  // ---- Live message stream (WS + polling fallback) ----
  const handleMessages = useCallback((msgs: Message[]) => {
    setMessages(msgs);
  }, []);

  const { connected: wsConnected } = useRoomStream({
    roomId,
    onMessages: handleMessages,
  });

  // ---- Actions ----
  async function handleStart(topic: string, maxRounds: number) {
    setShowStartDialog(false);
    setIsStarting(true);
    setError(null);
    try {
      const status = await startAutonomous(
        roomId,
        topic,
        maxRounds,
        room?.agent_ids ?? []
      );
      setRunStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start run");
    } finally {
      setIsStarting(false);
    }
  }

  async function handleStop() {
    setIsStopping(true);
    setError(null);
    try {
      const status = await stopAutonomous(roomId);
      setRunStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to stop run");
    } finally {
      setIsStopping(false);
    }
  }

  const isRunning = runStatus?.running ?? false;

  // ---- Render ----
  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <TopBar
        roomName={room?.name ?? roomId}
        runStatus={runStatus}
        wsConnected={wsConnected}
        autoScroll={autoScroll}
        onToggleAutoScroll={() => setAutoScroll((v) => !v)}
        onStart={() => setShowStartDialog(true)}
        onStop={handleStop}
        isStarting={isStarting}
        isStopping={isStopping}
      />

      {/* Error banner */}
      {error && (
        <div className="bg-red-900/40 border-b border-red-700 px-4 py-2 text-sm text-red-300 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-4 text-red-400 hover:text-red-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <AgentSidebar agents={roomAgents} />

        {/* Center conversation */}
        <ConversationTimeline
          messages={messages}
          autoScroll={autoScroll}
          thinking={isRunning}
        />

        {/* Right panel */}
        <ToolOutputPanel messages={messages} />
      </div>

      {/* Start dialog */}
      {showStartDialog && (
        <StartDialog
          onConfirm={handleStart}
          onCancel={() => setShowStartDialog(false)}
        />
      )}
    </div>
  );
}
