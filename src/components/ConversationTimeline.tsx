"use client";

import { useEffect, useRef } from "react";
import { Message } from "@/lib/apiClient";

interface ConversationTimelineProps {
  messages: Message[];
  autoScroll: boolean;
  thinking: boolean;
}

const ROLE_COLORS: Record<string, string> = {
  user: "bg-blue-600",
  assistant: "bg-gray-700",
  system: "bg-yellow-700",
  tool: "bg-emerald-700",
};

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function ConversationTimeline({
  messages,
  autoScroll,
  thinking,
}: ConversationTimelineProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, thinking, autoScroll]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-950">
      {messages.length === 0 && !thinking && (
        <p className="text-center text-gray-600 mt-20 text-sm">
          No messages yet. Start an autonomous run to begin.
        </p>
      )}

      {messages.map((msg) => {
        const isUser = msg.role === "user";
        const bubbleColor = ROLE_COLORS[msg.role] ?? "bg-gray-700";

        return (
          <div
            key={msg.id}
            className={`flex ${isUser ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-xl w-fit rounded-2xl px-4 py-2.5 ${bubbleColor}`}>
              {/* Header row */}
              <div className="flex items-center gap-2 mb-1">
                {msg.agent_name && (
                  <span className="text-xs font-semibold text-white/80">
                    {msg.agent_name}
                  </span>
                )}
                {msg.round !== undefined && (
                  <span className="text-xs text-white/50">
                    round {msg.round}
                  </span>
                )}
                <span className="text-xs text-white/40 ml-auto">
                  {formatTime(msg.created_at)}
                </span>
              </div>

              {/* Content */}
              <p className="text-sm text-white whitespace-pre-wrap break-words">
                {msg.content}
              </p>

              {/* Tool outputs inline preview */}
              {msg.tool_outputs && msg.tool_outputs.length > 0 && (
                <div className="mt-2 space-y-1">
                  {msg.tool_outputs.map((to, i) => (
                    <div
                      key={i}
                      className="text-xs bg-black/30 rounded px-2 py-1 font-mono"
                    >
                      <span className="text-emerald-400">{to.tool}</span>
                      {to.duration_ms !== undefined && (
                        <span className="text-white/40 ml-2">
                          {to.duration_ms}ms
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Thinking indicator */}
      {thinking && (
        <div className="flex justify-start">
          <div className="bg-gray-700 rounded-2xl px-4 py-2.5 flex items-center gap-1.5">
            <span className="text-xs text-gray-300 italic">Thinking</span>
            <span className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
