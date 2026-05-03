"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

async function parseJsonSafe(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export function useConversationMessages(conversationId: string) {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      const res = await fetch(`/api/chat/${conversationId}/messages`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to load messages");
      return body.data.messages as Array<{ _id: string; role: "user" | "assistant"; content: string }>;
    },
    enabled: Boolean(conversationId)
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { projectId: string; productInstanceId: string }) => {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to create conversation");
      return body.data.conversation as { _id: string };
    },
    onSuccess: (_data, payload) => {
      queryClient.invalidateQueries({ queryKey: ["conversations", payload.projectId] });
    }
  });
}

export function useConversations(projectId: string) {
  return useQuery({
    queryKey: ["conversations", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/conversations?projectId=${projectId}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to load conversations");
      return body.data.conversations as Array<{ _id: string; title: string; updatedAt: string }>;
    },
    enabled: Boolean(projectId)
  });
}

export function useSendMessage(params: { conversationId: string; projectId?: string; productInstanceId?: string }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      const res =
        params.projectId && params.productInstanceId
          ? await fetch("/api/chat/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                conversationId: params.conversationId,
                projectId: params.projectId,
                productInstanceId: params.productInstanceId,
                content
              })
            })
          : await fetch(`/api/chat/${params.conversationId}/messages`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ content })
            });
      const body = await parseJsonSafe(res);
      if (!res.ok) throw new Error(body?.error || `Failed to send message (${res.status})`);
      if (params.projectId && params.productInstanceId) {
        return body.data as {
          conversationId: string;
          assistantMessage: { _id: string; role: "assistant"; content: string };
        };
      }
      return {
        conversationId: params.conversationId,
        assistantMessage: body.data.assistantMessage as { _id: string; role: "assistant"; content: string }
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["messages", data.conversationId] });
      if (params.projectId) {
        queryClient.invalidateQueries({ queryKey: ["conversations", params.projectId] });
      }
    }
  });
}

export function useSendMessageStream(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ content, onChunk }: { content: string; onChunk: (chunk: string) => void }) => {
      const res = await fetch(`/api/chat/${conversationId}/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      });

      if (!res.ok || !res.body) {
        const body = await parseJsonSafe(res);
        throw new Error(body?.error || `Failed to stream response (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let final = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const event of events) {
          const dataLine = event
            .split("\n")
            .map((line) => line.trim())
            .find((line) => line.startsWith("data:"));
          if (!dataLine) continue;
          const raw = dataLine.replace(/^data:\s*/, "");
          const payload = JSON.parse(raw) as { chunk?: string; done?: boolean; final?: string; error?: string };
          if (payload.error) throw new Error(payload.error);
          if (payload.chunk) {
            final += payload.chunk;
            onChunk(payload.chunk);
          }
          if (payload.done && payload.final) {
            final = payload.final;
          }
        }
      }

      return final;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
    }
  });
}
