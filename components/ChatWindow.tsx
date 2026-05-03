"use client";

import { FormEvent, useState } from "react";

import { useConversationMessages, useSendMessageStream } from "@/hooks/useChat";

export default function ChatWindow({ conversationId }: { conversationId: string }) {
  const [content, setContent] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [streamError, setStreamError] = useState<string | null>(null);
  const { data, isLoading, error } = useConversationMessages(conversationId);
  const sendMessage = useSendMessageStream(conversationId);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const text = content.trim();
    if (!text) return;
    setContent("");
    setStreamingText("");
    setStreamError(null);
    try {
      await sendMessage.mutateAsync({
        content: text,
        onChunk: (chunk) => setStreamingText((prev) => prev + chunk)
      });
      setStreamingText("");
    } catch (err) {
      setStreamError((err as Error).message);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold">Conversation</h1>
      <div className="flex-1 space-y-3 rounded-xl bg-white p-4 shadow">
        {isLoading && <p>Loading messages...</p>}
        {error && <p className="text-red-600">{(error as Error).message}</p>}
        {streamError && <p className="text-red-600">{streamError}</p>}
        {!isLoading && !error && data?.length === 0 && <p className="text-slate-600">No messages yet.</p>}
        {data?.map((message) => (
          <div
            key={message._id}
            className={`rounded p-3 ${message.role === "user" ? "bg-indigo-50" : "bg-slate-100"}`}
          >
            <p className="text-xs uppercase text-slate-500">{message.role}</p>
            <p>{message.content}</p>
          </div>
        ))}
        {sendMessage.isPending && (
          <div className="rounded bg-slate-100 p-3">
            <p className="text-xs uppercase text-slate-500">assistant</p>
            <p>{streamingText || "Thinking..."}</p>
          </div>
        )}
      </div>
      <form className="flex gap-2" onSubmit={onSubmit}>
        <input
          className="flex-1 rounded border p-2"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type your message..."
        />
        <button className="rounded bg-slate-900 px-4 py-2 text-white" disabled={sendMessage.isPending}>
          {sendMessage.isPending ? "Thinking..." : "Send"}
        </button>
      </form>
    </div>
  );
}
