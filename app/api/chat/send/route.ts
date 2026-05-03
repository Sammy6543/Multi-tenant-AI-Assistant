import { NextRequest } from "next/server";
import { Types } from "mongoose";

import { ensureProjectAccess } from "@/access/authz";
import { fail, ok } from "@/lib/api";
import { getSessionUser } from "@/lib/session";
import { chatSendSchema } from "@/lib/validation";
import { Conversation } from "@/models/Conversation";
import { ProductInstance } from "@/models/ProductInstance";
import { sendMessageAndRespond } from "@/services/chatService";
import { connectToDatabase } from "@/lib/db";

async function resolveProjectId(payload: { conversationId?: string; projectId: string; productInstanceId: string }) {
  await connectToDatabase();

  const product = await ProductInstance.findOne({
    _id: payload.productInstanceId,
    projectId: payload.projectId
  }).lean();
  if (!product) return null;

  if (!payload.conversationId) return payload.projectId;
  if (!Types.ObjectId.isValid(payload.conversationId)) return null;

  const conversation = await Conversation.findOne({
    _id: payload.conversationId,
    projectId: payload.projectId,
    productInstanceId: payload.productInstanceId
  }).lean();
  return conversation ? payload.projectId : null;
}

export async function POST(request: NextRequest) {
  const parsed = chatSendSchema.safeParse(await request.json());
  if (!parsed.success) return fail("Invalid payload", 422);

  const effectiveProjectId = await resolveProjectId(parsed.data);
  if (!effectiveProjectId) return fail("Invalid conversation or product instance", 404);

  const user = await getSessionUser();
  try {
    ensureProjectAccess(user, effectiveProjectId);
  } catch (error) {
    const message = (error as Error).message;
    return fail(message, message === "UNAUTHORIZED" ? 401 : 403);
  }

  try {
    const result = await sendMessageAndRespond(parsed.data);
    return ok(result);
  } catch (error) {
    return fail((error as Error).message, 500);
  }
}
