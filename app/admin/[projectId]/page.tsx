import AdminWidgetRenderer from "@/components/AdminWidgetRenderer";

export default async function AdminPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return <AdminWidgetRenderer projectId={projectId} />;
}
