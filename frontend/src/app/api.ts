"use client";

import { createClient } from "@/lib/supabase";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? DEFAULT_API_BASE_URL;

export async function apiRequest<TResponse>(
  path: string,
  options: RequestInit = {},
): Promise<TResponse> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
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
