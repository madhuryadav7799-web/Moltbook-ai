/**
 * apiClient.ts
 *
 * Central module for all AgentVerse V2 API calls.
 * Store tenantSlug and token here so tenant routing can be added later
 * without touching individual pages.
 */

// ---------------------------------------------------------------------------
// Configuration – override via environment variables or update directly here.
// ---------------------------------------------------------------------------
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_BASE_URL ?? "ws://localhost:8000";

/** Bearer token sent with every request. */
export let tenantToken: string =
  typeof window !== "undefined"
    ? (localStorage.getItem("agentverse_token") ?? "")
    : "";

/** Slug that identifies the tenant (reserved for multi-tenant routing). */
export let tenantSlug: string =
  typeof window !== "undefined"
    ? (localStorage.getItem("agentverse_slug") ?? "")
    : "";

export function setCredentials(slug: string, token: string) {
  tenantSlug = slug;
  tenantToken = token;
  if (typeof window !== "undefined") {
    localStorage.setItem("agentverse_token", token);
    localStorage.setItem("agentverse_slug", slug);
  }
}

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------
async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(tenantToken ? { Authorization: `Bearer ${tenantToken}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Agent {
  id: string;
  name: string;
  role?: string;
  provider?: string;
  tools?: string[];
  description?: string;
}

export interface Room {
  id: string;
  name: string;
  agent_ids: string[];
  created_at?: string;
  status?: "idle" | "running" | "stopped";
  rounds?: number;
}

export interface Message {
  id: string;
  room_id: string;
  agent_id?: string;
  agent_name?: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  tool_outputs?: ToolOutput[];
  created_at: string;
  round?: number;
}

export interface ToolOutput {
  tool: string;
  result: unknown;
  duration_ms?: number;
}

export interface UsageStats {
  total_tokens?: number;
  prompt_tokens?: number;
  completion_tokens?: number;
  cost_usd?: number;
}

export interface AutonomousRunStatus {
  running: boolean;
  rounds_completed: number;
  max_rounds: number;
  topic?: string;
}

// ---------------------------------------------------------------------------
// Agent endpoints
// ---------------------------------------------------------------------------

export async function listAgents(): Promise<Agent[]> {
  return request<Agent[]>("/api/v2/agents");
}

// ---------------------------------------------------------------------------
// Room endpoints
// ---------------------------------------------------------------------------

export async function listRooms(): Promise<Room[]> {
  return request<Room[]>("/api/v2/rooms");
}

export async function createRoom(
  name: string,
  agent_ids: string[]
): Promise<Room> {
  return request<Room>("/api/v2/rooms", {
    method: "POST",
    body: JSON.stringify({ name, agent_ids }),
  });
}

export async function getRoom(roomId: string): Promise<Room> {
  return request<Room>(`/api/v2/rooms/${roomId}`);
}

export async function getRoomMessages(
  roomId: string,
  limit = 50
): Promise<Message[]> {
  return request<Message[]>(
    `/api/v2/rooms/${roomId}/messages?limit=${limit}`
  );
}

// ---------------------------------------------------------------------------
// Autonomous run endpoints
// ---------------------------------------------------------------------------

export async function startAutonomous(
  roomId: string,
  topic: string,
  max_rounds: number,
  agent_ids: string[]
): Promise<AutonomousRunStatus> {
  return request<AutonomousRunStatus>(
    `/api/v2/rooms/${roomId}/start-autonomous`,
    {
      method: "POST",
      body: JSON.stringify({ topic, max_rounds, agent_ids }),
    }
  );
}

export async function stopAutonomous(
  roomId: string
): Promise<AutonomousRunStatus> {
  return request<AutonomousRunStatus>(
    `/api/v2/rooms/${roomId}/stop-autonomous`,
    { method: "POST" }
  );
}

export async function getRunStatus(
  roomId: string
): Promise<AutonomousRunStatus> {
  return request<AutonomousRunStatus>(`/api/v2/rooms/${roomId}/status`);
}

// ---------------------------------------------------------------------------
// WebSocket URL builder
// ---------------------------------------------------------------------------

export function buildWsUrl(roomId: string): string {
  const token = tenantToken ? `?token=${encodeURIComponent(tenantToken)}` : "";
  return `${WS_BASE_URL}/ws/room/${roomId}${token}`;
}
