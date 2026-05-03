import { NextRequest } from "next/server";

import { fail, ok } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { setSession } from "@/lib/session";
import { loginSchema } from "@/lib/validation";
import { Project } from "@/models/Project";
import { User } from "@/models/User";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid payload", 422);

  await connectToDatabase();
  const user = await User.findById(parsed.data.userId).lean();
  if (!user) return fail("User not found", 404);
  const project = await Project.findById(user.projectId).lean();
  if (!project) return fail("Project not found", 404);

  await setSession({
    id: String(user._id),
    name: user.name,
    role: user.role,
    projectId: String(user.projectId)
  });

  return ok({
    userId: String(user._id),
    role: user.role,
    projectId: String(user.projectId),
    projectSlug: project.slug
  });
}
