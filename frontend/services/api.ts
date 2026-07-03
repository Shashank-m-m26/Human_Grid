import { MissionEngineOutput } from "../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const getAuthHeaders = () => {
  const username = process.env.NEXT_PUBLIC_API_USERNAME || "admin";
  const password = process.env.NEXT_PUBLIC_API_PASSWORD || "humangrid";
  const credentials = btoa(`${username}:${password}`);
  return {
    "Authorization": `Basic ${credentials}`,
    "Content-Type": "application/json",
  };
};

export async function checkHealth(): Promise<{ status: string; timestamp: string }> {
  const res = await fetch(`${API_BASE_URL}/health`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Health check failed: ${res.statusText}`);
  }
  return res.json();
}

export async function createMission(prompt: string, requesterId: string = "emp-001"): Promise<MissionEngineOutput> {
  const res = await fetch(`${API_BASE_URL}/mission`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      requester_id: requesterId,
      prompt,
    }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to create mission: ${res.statusText}`);
  }
  return res.json();
}
