import { NextRequest } from "next/server";

import { ensureProjectAccess } from "@/access/authz";
import { fail, ok } from "@/lib/api";
import { getSessionUser } from "@/lib/session";
import { slugParamSchema } from "@/lib/validation";
import { getProjectBySlug, listProductInstances } from "@/services/projectService";

export async function GET(_request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const parsed = slugParamSchema.safeParse(await context.params);
  if (!parsed.success) return fail("Invalid route params", 422);

  const project = await getProjectBySlug(parsed.data.slug);
  if (!project) return fail("Project not found", 404);

  const user = await getSessionUser();
  try {
    ensureProjectAccess(user, String(project._id));
  } catch (error) {
    const message = (error as Error).message;
    return fail(message, message === "UNAUTHORIZED" ? 401 : 403);
  }

  const productInstances = await listProductInstances(String(project._id));
  return ok({
    project,
    productInstances
  });
}
