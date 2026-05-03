"use client";

import { useQuery } from "@tanstack/react-query";

export function useAdminDashboard(projectId: string) {
  return useQuery({
    queryKey: ["admin-dashboard", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/dashboard?projectId=${projectId}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to load dashboard");
      return body.data as {
        config: {
          widgets: Array<{
            type: "card" | "list" | "stat";
            label: string;
            dataSource: "users_count" | "messages_count" | "conversations_count" | "product_instances_count";
          }>;
        };
        stats: Record<string, number>;
      };
    },
    enabled: Boolean(projectId)
  });
}
