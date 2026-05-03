"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAdminDashboard } from "@/hooks/useAdmin";
import { useCurrentUser } from "@/hooks/useAuth";

function renderWidget(
  widget: {
    type: "card" | "list" | "stat";
    label: string;
    dataSource: "users_count" | "messages_count" | "conversations_count" | "product_instances_count";
  },
  stats: Record<string, number>
) {
  const value = stats[widget.dataSource] ?? 0;

  if (widget.type === "card") {
    return (
      <div className="rounded bg-white p-4 shadow">
        <p className="text-sm text-slate-500">{widget.label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    );
  }

  if (widget.type === "stat") {
    return (
      <div className="rounded bg-white p-4 shadow">
        <p className="text-xs uppercase tracking-wider text-slate-500">{widget.label}</p>
        <p className="mt-2 text-3xl font-semibold">{value}</p>
      </div>
    );
  }

  const scaled = Math.max(5, Math.min(100, Number(value) * 8));
  return (
    <div className="rounded bg-white p-4 shadow">
      <p className="text-sm text-slate-500">{widget.label}</p>
      <div className="mt-4 rounded bg-slate-100 p-3">
        <ul className="space-y-2">
          <li className="text-sm text-slate-700">Data source: {widget.dataSource}</li>
          <li className="text-sm text-slate-700">Current value: {value}</li>
          <li className="text-sm text-slate-700">Scaled index: {scaled}</li>
        </ul>
      </div>
    </div>
  );
}

export default function AdminWidgetRenderer({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { data, isLoading, error } = useAdminDashboard(projectId);
  const currentUser = useCurrentUser();

  useEffect(() => {
    if (currentUser.data && currentUser.data.user.role !== "admin") {
      router.push(`/project/${currentUser.data.user.projectId}`);
    }
  }, [currentUser.data, router]);

  if (currentUser.isLoading) return <p className="p-6">Checking permissions...</p>;
  if (currentUser.error) return <p className="p-6 text-red-600">Failed to verify permissions</p>;
  if (currentUser.data?.user?.role !== "admin") return <p className="p-6">Access denied. You must be an admin to view this page.</p>;
  if (error) return <p className="p-6 text-red-600">{(error as Error).message}</p>;
  if (!data?.config?.widgets?.length) return <p className="p-6">No widgets configured for this project.</p>;

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <p className="text-sm text-slate-600">Dashboard is rendered from MongoDB config.</p>
      <div className="grid gap-4 md:grid-cols-3">
        {data.config.widgets.map((widget, idx) => (
          <div key={`${widget.label}-${idx}`}>{renderWidget(widget, data.stats)}</div>
        ))}
      </div>
    </div>
  );
}
