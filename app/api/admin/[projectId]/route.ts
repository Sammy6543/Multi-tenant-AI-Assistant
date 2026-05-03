import { NextRequest } from "next/server";

import { ensureAdminForProject } from "@/access/authz";
import { fail, ok } from "@/lib/api";
import { getSessionUser } from "@/lib/session";
import { projectIdParamSchema } from "@/lib/validation";
import { getDashboardConfig, getDashboardStats } from "@/services/adminService";

export async function GET(_request: NextRequest, context: { params: Promise<{ projectId: string }> }) {
  const parsed = projectIdParamSchema.safeParse(await context.params);
  if (!parsed.success) return fail("Invalid route params", 422);

  const { projectId } = parsed.data;
  const user = await getSessionUser();

  try {
    ensureAdminForProject(user, projectId);
  } catch (error) {
    const message = (error as Error).message;
    return fail(message, message === "UNAUTHORIZED" ? 401 : 403);
  }

  const [config, stats] = await Promise.all([getDashboardConfig(projectId), getDashboardStats(projectId)]);
  if (!config) return fail("Admin config not found", 404);

  return ok({ config, stats });
}
