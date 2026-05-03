import { NextRequest } from "next/server";

import { ensureAdminForProject } from "@/access/authz";
import { fail, ok } from "@/lib/api";
import { getSessionUser } from "@/lib/session";
import { adminDashboardQuerySchema } from "@/lib/validation";
import { getDashboardConfig, getDashboardStats } from "@/services/adminService";

export async function GET(request: NextRequest) {
  const parsed = adminDashboardQuerySchema.safeParse({
    projectId: request.nextUrl.searchParams.get("projectId")
  });
  if (!parsed.success) return fail("Invalid query params", 422);

  const user = await getSessionUser();
  try {
    ensureAdminForProject(user, parsed.data.projectId);
  } catch (error) {
    const message = (error as Error).message;
    return fail(message, message === "UNAUTHORIZED" ? 401 : 403);
  }

  const [config, stats] = await Promise.all([
    getDashboardConfig(parsed.data.projectId),
    getDashboardStats(parsed.data.projectId)
  ]);
  if (!config) return fail("Admin config not found", 404);

  return ok({ config, stats });
}
