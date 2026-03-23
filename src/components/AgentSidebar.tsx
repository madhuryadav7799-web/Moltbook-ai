"use client";

import { Agent } from "@/lib/apiClient";

interface AgentSidebarProps {
  agents: Agent[];
}

const PROVIDER_COLORS: Record<string, string> = {
  openai: "bg-green-100 text-green-800",
  anthropic: "bg-purple-100 text-purple-800",
  google: "bg-blue-100 text-blue-800",
  mistral: "bg-orange-100 text-orange-800",
};

export default function AgentSidebar({ agents }: AgentSidebarProps) {
  return (
    <aside className="w-60 flex-shrink-0 bg-gray-900 border-r border-gray-700 overflow-y-auto">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Agents ({agents.length})
        </h2>
      </div>

      <ul className="divide-y divide-gray-800">
        {agents.map((agent) => {
          const providerKey = (agent.provider ?? "").toLowerCase();
          const providerClass =
            PROVIDER_COLORS[providerKey] ?? "bg-gray-700 text-gray-300";

          return (
            <li key={agent.id} className="p-4 space-y-2">
              {/* Name + role */}
              <div>
                <p className="font-medium text-white text-sm truncate">
                  {agent.name}
                </p>
                {agent.role && (
                  <p className="text-xs text-gray-400 truncate">{agent.role}</p>
                )}
              </div>

              {/* Provider badge */}
              {agent.provider && (
                <span
                  className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${providerClass}`}
                >
                  {agent.provider}
                </span>
              )}

              {/* Tool badges */}
              {agent.tools && agent.tools.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {agent.tools.map((tool) => (
                    <span
                      key={tool}
                      className="inline-block text-xs px-1.5 py-0.5 rounded bg-gray-700 text-gray-300 font-mono"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              )}
            </li>
          );
        })}

        {agents.length === 0 && (
          <li className="p-4 text-center text-gray-500 text-sm">
            No agents in room
          </li>
        )}
      </ul>
    </aside>
  );
}
