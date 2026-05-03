import { NextRequest } from "next/server";

import { fail, ok } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { authUsersQuerySchema } from "@/lib/validation";
import { Project } from "@/models/Project";
import { User } from "@/models/User";

/** Lists users for one tenant only (by project slug). Required for production isolation. */
export async function GET(request: NextRequest) {
  const parsed = authUsersQuerySchema.safeParse({
    projectSlug: request.nextUrl.searchParams.get("projectSlug")
  });
  if (!parsed.success) return fail("Query parameter projectSlug is required", 422);

  try {
    await connectToDatabase();
    const project = await Project.findOne({ slug: parsed.data.projectSlug }).lean();
    console.log("Found project:", project);
    if (!project) return ok({ users: [] });

    const users = await User.find({ projectId: project._id }).select("name role projectId").lean();
    console.log("Found users count:", users.length);
    return ok({ users });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error in GET /api/auth/users:", errorMessage, error);
    return fail(`Internal Server Error: ${errorMessage}`, 500);
  }
}
