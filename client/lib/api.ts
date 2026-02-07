import { getApiUrl } from "./query-client";

const API_BASE = getApiUrl();

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const url = new URL(endpoint, API_BASE);
    const response = await fetch(url.toString(), {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Request failed" };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: "Network error" };
  }
}

// Generate a pairing code
export async function generatePairingCode(
  deviceId: string
): Promise<ApiResponse<{ code: string; expiresAt: string }>> {
  return apiCall("/api/pair/generate", {
    method: "POST",
    body: JSON.stringify({ deviceId }),
  });
}

// Join with a pairing code
export async function joinWithCode(
  deviceId: string,
  code: string
): Promise<
  ApiResponse<{ pairId: string; deviceId: string; partnerDeviceId: string }>
> {
  return apiCall("/api/pair/join", {
    method: "POST",
    body: JSON.stringify({ deviceId, code }),
  });
}

// Send a message
export async function sendMessage(
  pairId: string,
  deviceId: string,
  content: string
): Promise<ApiResponse<{ messageId: string; timestamp: string }>> {
  return apiCall("/api/send", {
    method: "POST",
    body: JSON.stringify({ pairId, deviceId, content }),
  });
}

// Poll for messages
export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  read: boolean;
  delivered?: boolean;
}

export async function pollMessages(
  pairId: string,
  deviceId: string
): Promise<
  ApiResponse<{ messages: Message[]; partnerTyping: boolean }>
> {
  return apiCall(
    `/api/poll?pairId=${encodeURIComponent(pairId)}&deviceId=${encodeURIComponent(deviceId)}`
  );
}

// Send typing indicator
export async function sendTypingIndicator(
  pairId: string,
  deviceId: string,
  isTyping: boolean
): Promise<ApiResponse<{}>> {
  return apiCall("/api/typing", {
    method: "POST",
    body: JSON.stringify({ pairId, deviceId, isTyping }),
  });
}

// Mark messages as read
export async function markMessagesRead(
  pairId: string,
  deviceId: string,
  messageIds: string[]
): Promise<ApiResponse<{}>> {
  return apiCall("/api/read", {
    method: "POST",
    body: JSON.stringify({ pairId, deviceId, messageIds }),
  });
}

// Clear chat
export async function clearChat(
  pairId: string,
  deviceId: string
): Promise<ApiResponse<{}>> {
  return apiCall("/api/clear", {
    method: "POST",
    body: JSON.stringify({ pairId, deviceId }),
  });
}

// Check pairing status
export async function checkPairingStatus(
  deviceId: string,
  code: string
): Promise<
  ApiResponse<{
    status: "pending" | "paired";
    pairId?: string;
    partnerDeviceId?: string;
  }>
> {
  return apiCall(
    `/api/pair/status?deviceId=${encodeURIComponent(deviceId)}&code=${encodeURIComponent(code)}`
  );
}

// Reset device (unpair from server)
export async function resetDevice(
  deviceId: string
): Promise<ApiResponse<{ message: string }>> {
  return apiCall("/api/device/reset", {
    method: "POST",
    body: JSON.stringify({ deviceId }),
  });
}
