"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  let data: { data?: T; error?: string } = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Request failed (${response.status})`);
  }
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data.data as T;
}

export function useUsers(projectSlug: string) {
  return useQuery({
    queryKey: ["auth-users", projectSlug],
    queryFn: async () =>
      readJson<{ users: Array<{ _id: string; name: string; role: string; projectId: string }> }>(
        await fetch(`/api/auth/users?projectSlug=${encodeURIComponent(projectSlug)}`)
      ),
    enabled: projectSlug.trim().length > 0
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth-me"],
    queryFn: async () =>
      readJson<{ user: { id: string; name: string; role: string; projectId: string } }>(
        await fetch("/api/auth/me")
      )
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: async (userId: string) =>
      readJson<{ userId: string; role: string; projectId: string; projectSlug: string }>(
        await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId })
        })
      )
  });
}
