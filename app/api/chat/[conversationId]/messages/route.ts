import { NextRequest } from "next/server";
import { Types } from "mongoose";

import { fail, ok } from "@/lib/api";
import { getSessionUser } from "@/lib/session";
import { conversationIdParamSchema, createMessageSchema } from "@/lib/validation";
import { Conversation } from "@/models/Conversation";
import { getConversationMessages, sendMessageAndRespond } from "@/services/chatService";
import { ensureProjectAccess } from "@/access/authz";
import { connectToDatabase } from "@/lib/db";

async function getConversationProjectId(conversationId: string) {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(conversationId)) return null;
  const conversation = await Conversation.findById(conversationId).lean();
  if (!conversation) return null;
  return {
    projectId: String(conversation.projectId),
    productInstanceId: String(conversation.productInstanceId)
  };
}

export async function GET(_request: NextRequest, context: { params: Promise<{ conversationId: string }> }) {
  const parsedParams = conversationIdParamSchema.safeParse(await context.params);
  if (!parsedParams.success) return fail("Invalid route params", 422);
  const { conversationId } = parsedParams.data;
  const conversationMeta = await getConversationProjectId(conversationId);
  if (!conversationMeta) return fail("Conversation not found", 404);

  const user = await getSessionUser();
  try {
    ensureProjectAccess(user, conversationMeta.projectId);
  } catch (error) {
    const message = (error as Error).message;
    return fail(message, message === "UNAUTHORIZED" ? 401 : 403);
  }

  const messages = await getConversationMessages(conversationId, conversationMeta.projectId);
  return ok({ messages });
}

export async function POST(request: NextRequest, context: { params: Promise<{ conversationId: string }> }) {
  const parsedParams = conversationIdParamSchema.safeParse(await context.params);
  if (!parsedParams.success) return fail("Invalid route params", 422);
  const { conversationId } = parsedParams.data;
  const parsed = createMessageSchema.safeParse(await request.json());
  if (!parsed.success) return fail("Invalid payload", 422);

  const conversationMeta = await getConversationProjectId(conversationId);
  if (!conversationMeta) return fail("Conversation not found", 404);
  const user = await getSessionUser();

  try {
    ensureProjectAccess(user, conversationMeta.projectId);
  } catch (error) {
    const message = (error as Error).message;
    return fail(message, message === "UNAUTHORIZED" ? 401 : 403);
  }

  try {
    const result = await sendMessageAndRespond({
      conversationId,
      projectId: conversationMeta.projectId,
      productInstanceId: conversationMeta.productInstanceId,
      content: parsed.data.content
    });
    return ok(result);
  } catch (error) {
    return fail((error as Error).message, 500);
  }
}
