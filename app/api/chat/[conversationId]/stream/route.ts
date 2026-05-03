import { NextRequest } from "next/server";
import { Types } from "mongoose";

import { ensureProjectAccess } from "@/access/authz";
import { fail } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { conversationIdParamSchema, createMessageSchema } from "@/lib/validation";
import { Conversation } from "@/models/Conversation";
import { saveAssistantMessage, sendMessageAndStreamResponse } from "@/services/chatService";

async function getConversationMeta(conversationId: string) {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(conversationId)) return null;
  const conversation = await Conversation.findById(conversationId).lean();
  if (!conversation) return null;
  return {
    projectId: String(conversation.projectId),
    productInstanceId: String(conversation.productInstanceId)
  };
}

export async function POST(request: NextRequest, context: { params: Promise<{ conversationId: string }> }) {
  const parsedParams = conversationIdParamSchema.safeParse(await context.params);
  if (!parsedParams.success) return fail("Invalid route params", 422);
  const { conversationId } = parsedParams.data;

  const parsedBody = createMessageSchema.safeParse(await request.json());
  if (!parsedBody.success) return fail("Invalid payload", 422);

  const conversationMeta = await getConversationMeta(conversationId);
  if (!conversationMeta) return fail("Conversation not found", 404);

  const user = await getSessionUser();
  try {
    ensureProjectAccess(user, conversationMeta.projectId);
  } catch (error) {
    const message = (error as Error).message;
    return fail(message, message === "UNAUTHORIZED" ? 401 : 403);
  }

  try {
    const { stream } = await sendMessageAndStreamResponse({
      conversationId,
      projectId: conversationMeta.projectId,
      productInstanceId: conversationMeta.productInstanceId,
      content: parsedBody.data.content
    });

    const encoder = new TextEncoder();
    const responseStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let final = "";
        try {
          for await (const chunk of stream) {
            final += chunk;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
          }
          if (final.trim()) {
            await saveAssistantMessage(conversationId, final);
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, final })}\n\n`));
          controller.close();
        } catch (error) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: (error as Error).message || "Stream failed" })}\n\n`)
          );
          controller.close();
        }
      }
    });

    return new Response(responseStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive"
      }
    });
  } catch (error) {
    return fail((error as Error).message, 500);
  }
}
