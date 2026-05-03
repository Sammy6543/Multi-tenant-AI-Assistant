"use client";

import { useRouter } from "next/navigation";

import { useConversations, useCreateConversation } from "@/hooks/useChat";
import { useProject } from "@/hooks/useProject";

export default function ProjectOverview({ slug }: { slug: string }) {
  const router = useRouter();
  const { data, isLoading, error } = useProject(slug);
  const createConversation = useCreateConversation();
  const projectId = data?.project?._id ?? "";
  const conversations = useConversations(projectId);

  const openConversation = async (productInstanceId: string) => {
    if (!data?.project?._id) return;
    const conversation = await createConversation.mutateAsync({
      projectId: data.project._id,
      productInstanceId
    });
    router.push(`/chat/${conversation._id}`);
  };

  if (isLoading) return <p className="p-6">Loading project...</p>;
  if (error) return <p className="p-6 text-red-600">{(error as Error).message}</p>;
  if (!data) return <p className="p-6">Project not found.</p>;

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">{data.project.name}</h1>
      <p className="text-sm text-slate-600">Choose a product instance to start a conversation.</p>
      {data.productInstances.length === 0 ? (
        <p className="rounded bg-white p-4 shadow">No product instances available.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {data.productInstances.map((instance) => (
            <button
              key={instance._id}
              className="rounded border bg-white p-4 text-left shadow-sm"
              onClick={() => openConversation(instance._id)}
              disabled={createConversation.isPending}
            >
              <p className="font-semibold">{instance.name}</p>
              <p className="text-sm text-slate-500">Open chat</p>
            </button>
          ))}
        </div>
      )}
      <div className="rounded bg-white p-4 shadow">
        <h2 className="font-semibold">Recent conversations</h2>
        {conversations.isLoading && <p className="mt-2 text-sm text-slate-600">Loading conversations...</p>}
        {conversations.error && <p className="mt-2 text-sm text-red-600">{(conversations.error as Error).message}</p>}
        {!conversations.isLoading && !conversations.error && conversations.data?.length === 0 && (
          <p className="mt-2 text-sm text-slate-600">No conversations yet.</p>
        )}
        <div className="mt-2 space-y-2">
          {conversations.data?.slice(0, 5).map((conversation) => (
            <button
              key={conversation._id}
              className="block w-full rounded border p-2 text-left hover:bg-slate-50"
              onClick={() => router.push(`/chat/${conversation._id}`)}
            >
              <p className="font-medium">{conversation.title}</p>
            </button>
          ))}
        </div>
      </div>
      <button className="rounded bg-indigo-600 px-4 py-2 text-white" onClick={() => router.push(`/admin/${data.project._id}`)}>
        Go to Admin Dashboard
      </button>
    </div>
  );
}
