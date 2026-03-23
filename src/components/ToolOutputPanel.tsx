"use client";

import { Message, ToolOutput } from "@/lib/apiClient";

interface ToolOutputPanelProps {
  messages: Message[];
}

interface FlatOutput {
  msgId: string;
  agentName?: string;
  time: string;
  tool: string;
  result: unknown;
  duration_ms?: number;
}

function computeStats(messages: Message[]) {
  let totalTokens = 0;
  let promptTokens = 0;
  let completionTokens = 0;
  let costUsd = 0;

  for (const msg of messages) {
    const stats = (msg as unknown as { usage?: { total_tokens?: number; prompt_tokens?: number; completion_tokens?: number; cost_usd?: number } }).usage;
    if (stats) {
      totalTokens += stats.total_tokens ?? 0;
      promptTokens += stats.prompt_tokens ?? 0;
      completionTokens += stats.completion_tokens ?? 0;
      costUsd += stats.cost_usd ?? 0;
    }
  }
  return { totalTokens, promptTokens, completionTokens, costUsd };
}

function formatResult(result: unknown): string {
  if (typeof result === "string") return result;
  try {
    return JSON.stringify(result, null, 2);
  } catch {
    return String(result);
  }
}

export default function ToolOutputPanel({ messages }: ToolOutputPanelProps) {
  const outputs: FlatOutput[] = [];
  for (const msg of messages) {
    if (msg.tool_outputs && msg.tool_outputs.length > 0) {
      for (const to of msg.tool_outputs) {
        outputs.push({
          msgId: msg.id,
          agentName: msg.agent_name,
          time: msg.created_at,
          tool: to.tool,
          result: to.result,
          duration_ms: to.duration_ms,
        });
      }
    }
  }

  const stats = computeStats(messages);

  return (
    <aside className="w-72 flex-shrink-0 bg-gray-900 border-l border-gray-700 overflow-y-auto flex flex-col">
      {/* Usage stats */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
          Usage Stats
        </h2>
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-400">Total tokens</dt>
            <dd className="text-white font-mono">{stats.totalTokens.toLocaleString()}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-400">Prompt</dt>
            <dd className="text-white font-mono">{stats.promptTokens.toLocaleString()}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-400">Completion</dt>
            <dd className="text-white font-mono">{stats.completionTokens.toLocaleString()}</dd>
          </div>
          {stats.costUsd > 0 && (
            <div className="flex justify-between">
              <dt className="text-gray-400">Estimated cost</dt>
              <dd className="text-white font-mono">${stats.costUsd.toFixed(4)}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Tool outputs */}
      <div className="p-4 flex-1">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
          Tool Outputs ({outputs.length})
        </h2>

        {outputs.length === 0 && (
          <p className="text-gray-600 text-sm text-center mt-8">
            No tool calls yet
          </p>
        )}

        <div className="space-y-3">
          {outputs.map((o, i) => (
            <div key={i} className="bg-gray-800 rounded-lg p-3 text-xs space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-emerald-400 font-mono">
                  {o.tool}
                </span>
                {o.duration_ms !== undefined && (
                  <span className="text-gray-500">{o.duration_ms}ms</span>
                )}
              </div>
              {o.agentName && (
                <p className="text-gray-400">by {o.agentName}</p>
              )}
              <pre className="text-gray-300 whitespace-pre-wrap break-all bg-black/30 rounded p-2 max-h-32 overflow-y-auto">
                {formatResult(o.result)}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
