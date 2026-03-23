"use client";

import Link from "next/link";
import { AutonomousRunStatus } from "@/lib/apiClient";

interface TopBarProps {
  roomName: string;
  runStatus: AutonomousRunStatus | null;
  wsConnected: boolean;
  autoScroll: boolean;
  onToggleAutoScroll: () => void;
  onStart: () => void;
  onStop: () => void;
  isStarting: boolean;
  isStopping: boolean;
}

export default function TopBar({
  roomName,
  runStatus,
  wsConnected,
  autoScroll,
  onToggleAutoScroll,
  onStart,
  onStop,
  isStarting,
  isStopping,
}: TopBarProps) {
  const isRunning = runStatus?.running ?? false;

  return (
    <header className="flex items-center gap-4 px-4 py-2.5 bg-gray-900 border-b border-gray-700 flex-shrink-0">
      {/* Back */}
      <Link
        href="/rooms"
        className="text-gray-400 hover:text-white text-sm transition-colors"
      >
        ← Rooms
      </Link>

      {/* Room name */}
      <h1 className="font-semibold text-white text-base truncate flex-1">
        {roomName}
      </h1>

      {/* Rounds */}
      {runStatus && (
        <span className="text-sm text-gray-300 whitespace-nowrap">
          Round{" "}
          <span className="font-mono text-white">
            {runStatus.rounds_completed}
          </span>
          {runStatus.max_rounds > 0 && (
            <span className="text-gray-500">/{runStatus.max_rounds}</span>
          )}
        </span>
      )}

      {/* Status badge */}
      <span
        className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${
          isRunning
            ? "bg-emerald-900 text-emerald-300 animate-pulse"
            : "bg-gray-700 text-gray-400"
        }`}
      >
        {isRunning ? "● Running" : "■ Stopped"}
      </span>

      {/* WS indicator */}
      <span
        className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
          wsConnected
            ? "bg-blue-900 text-blue-300"
            : "bg-gray-700 text-gray-500"
        }`}
        title={wsConnected ? "WebSocket connected" : "Polling fallback"}
      >
        {wsConnected ? "WS" : "Poll"}
      </span>

      {/* Auto-scroll toggle */}
      <button
        onClick={onToggleAutoScroll}
        className={`text-xs px-2.5 py-1 rounded border transition-colors ${
          autoScroll
            ? "border-blue-600 text-blue-400 bg-blue-900/30"
            : "border-gray-600 text-gray-500 hover:border-gray-500"
        }`}
      >
        Auto-scroll {autoScroll ? "ON" : "OFF"}
      </button>

      {/* Start / Stop */}
      {!isRunning ? (
        <button
          onClick={onStart}
          disabled={isStarting}
          className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium transition-colors whitespace-nowrap"
        >
          {isStarting ? "Starting…" : "▶ Start Autonomous"}
        </button>
      ) : (
        <button
          onClick={onStop}
          disabled={isStopping}
          className="px-3 py-1.5 rounded bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium transition-colors whitespace-nowrap"
        >
          {isStopping ? "Stopping…" : "■ Stop"}
        </button>
      )}
    </header>
  );
}
