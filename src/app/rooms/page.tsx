"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Agent,
  Room,
  createRoom,
  listAgents,
  listRooms,
} from "@/lib/apiClient";

// ---- Create Room Modal --------------------------------------------------------
interface CreateRoomModalProps {
  agents: Agent[];
  onCreated: (room: Room) => void;
  onClose: () => void;
}

function CreateRoomModal({ agents, onCreated, onClose }: CreateRoomModalProps) {
  const [name, setName] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleAgent(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || selectedIds.size === 0) return;
    setLoading(true);
    setError(null);
    try {
      const room = await createRoom(name.trim(), Array.from(selectedIds));
      onCreated(room);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create room");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-5">
          Create New Room
        </h2>

        <form onSubmit={handleCreate} className="space-y-4">
          {/* Room name */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Room Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Research Brainstorm"
              className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Agent selection */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Select Agents ({selectedIds.size} selected)
            </label>
            <div className="max-h-52 overflow-y-auto space-y-1 border border-gray-600 rounded-lg p-2">
              {agents.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">
                  No agents available
                </p>
              )}
              {agents.map((agent) => (
                <label
                  key={agent.id}
                  className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-gray-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(agent.id)}
                    onChange={() => toggleAgent(agent.id)}
                    className="accent-blue-500"
                  />
                  <span className="text-sm text-white">{agent.name}</span>
                  {agent.role && (
                    <span className="text-xs text-gray-400">{agent.role}</span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim() || selectedIds.size === 0}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              {loading ? "Creating…" : "Create Room"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---- Main Page ---------------------------------------------------------------
export default function RoomsPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [roomList, agentList] = await Promise.all([
        listRooms(),
        listAgents(),
      ]);
      setRooms(roomList);
      setAgents(agentList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleCreated(room: Room) {
    setShowCreate(false);
    router.push(`/rooms/${room.id}`);
  }

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Moltbook AI</h1>
          <p className="text-xs text-gray-400">AgentVerse Notebook</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
        >
          + New Room
        </button>
      </header>

      {/* Body */}
      <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-300 text-sm">
            {error}
            <button
              onClick={fetchData}
              className="ml-4 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400">
                Rooms ({rooms.length})
              </h2>
              <button
                onClick={fetchData}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                ↻ Refresh
              </button>
            </div>

            {rooms.length === 0 ? (
              <div className="text-center py-20 text-gray-600">
                <p className="text-4xl mb-3">🤖</p>
                <p className="text-lg font-medium text-gray-400">
                  No rooms yet
                </p>
                <p className="text-sm mt-1">
                  Create a room to start a multi-agent conversation.
                </p>
                <button
                  onClick={() => setShowCreate(true)}
                  className="mt-6 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
                >
                  Create First Room
                </button>
              </div>
            ) : (
              <ul className="space-y-3">
                {rooms.map((room) => (
                  <li key={room.id}>
                    <Link
                      href={`/rooms/${room.id}`}
                      className="block bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-gray-600 rounded-xl p-4 transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white group-hover:text-blue-300 transition-colors">
                            {room.name}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {room.agent_ids.length} agent
                            {room.agent_ids.length !== 1 ? "s" : ""}
                            {room.created_at &&
                              ` · ${new Date(room.created_at).toLocaleDateString()}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {room.status === "running" && (
                            <span className="text-xs bg-emerald-900 text-emerald-300 px-2 py-0.5 rounded-full animate-pulse">
                              Running
                            </span>
                          )}
                          <span className="text-gray-500 group-hover:text-gray-300 transition-colors text-lg">
                            →
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>

      {showCreate && (
        <CreateRoomModal
          agents={agents}
          onCreated={handleCreated}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
