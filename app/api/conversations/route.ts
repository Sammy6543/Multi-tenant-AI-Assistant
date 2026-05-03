import { NextRequest } from "next/server";

import { ensureProjectAccess } from "@/access/authz";
import { fail, ok } from "@/lib/api";
import { getSessionUser } from "@/lib/session";
import { createConversationSchema, listConversationsSchema } from "@/lib/validation";
import { createConversation, listConversationsByProject } from "@/services/chatService";

export async function GET(request: NextRequest) {
  const parsed = listConversationsSchema.safeParse({
    projectId: request.nextUrl.searchParams.get("projectId")
  });
  if (!parsed.success) return fail("Invalid query params", 422);

  const user = await getSessionUser();
  try {
    ensureProjectAccess(user, parsed.data.projectId);
  } catch (error) {
    const message = (error as Error).message;
    return fail(message, message === "UNAUTHORIZED" ? 401 : 403);
  }

  const conversations = await listConversationsByProject(parsed.data.projectId);
  return ok({ conversations });
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const parsed = createConversationSchema.safeParse(payload);
  if (!parsed.success) return fail("Invalid payload", 422);

  const user = await getSessionUser();
  try {
    ensureProjectAccess(user, parsed.data.projectId);
  } catch (error) {
    const message = (error as Error).message;
    return fail(message, message === "UNAUTHORIZED" ? 401 : 403);
  }

  const conversation = await createConversation(parsed.data.projectId, parsed.data.productInstanceId, parsed.data.title);
  return ok({ conversation });
}
