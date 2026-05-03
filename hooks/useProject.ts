"use client";

import { useQuery } from "@tanstack/react-query";

export function useProject(slug: string) {
  return useQuery({
    queryKey: ["project", slug],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${slug}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to load project");
      return body.data as {
        project: { _id: string; name: string; slug: string };
        productInstances: Array<{ _id: string; name: string }>;
      };
    },
    enabled: Boolean(slug)
  });
}
