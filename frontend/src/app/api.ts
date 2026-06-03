"use client";

const DEFAULT_API_BASE_URL = "http://localhost:8000";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? DEFAULT_API_BASE_URL;

export async function apiRequest<TResponse>(
  path: string,
  options: RequestInit = {},
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message =
      typeof errorBody?.detail === "string"
        ? errorBody.detail
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json() as Promise<TResponse>;
}
