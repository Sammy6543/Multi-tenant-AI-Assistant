import { connectToDatabase } from "@/lib/db";
import { Conversation } from "@/models/Conversation";
import { Message } from "@/models/Message";
import { ProductInstance } from "@/models/ProductInstance";
import { generateAIResponse, generateAIResponseStream } from "@/services/aiService";

function buildIntegrationContext(product: {
  name?: string;
  integrations?: {
    shopifyEnabled?: boolean;
    crmEnabled?: boolean;
    shopify?: { totalOrders?: number; topProductName?: string };
    crm?: { openDealsCount?: number; pipelineValueUsd?: number };
  };
}) {
  const chunks: string[] = [];
  if (product.integrations?.shopifyEnabled && product.integrations.shopify) {
    const s = product.integrations.shopify;
    chunks.push(
      `Shopify (from database): total_orders=${s.totalOrders ?? 0}, top_product="${s.topProductName ?? "unknown"}".`
    );
  } else if (product.integrations?.shopifyEnabled) {
    chunks.push("Shopify is enabled but no metrics row exists on this product instance in the database.");
  }
  if (product.integrations?.crmEnabled && product.integrations.crm) {
    const c = product.integrations.crm;
    chunks.push(
      `CRM (from database): open_deals=${c.openDealsCount ?? 0}, pipeline_value_usd=${c.pipelineValueUsd ?? 0}.`
    );
  } else if (product.integrations?.crmEnabled) {
    chunks.push("CRM is enabled but no metrics row exists on this product instance in the database.");
  }
  return chunks.length ? chunks.join(" ") : "No external integrations are enabled for this product instance.";
}

async function buildProjectContext(projectId: string) {
  const [conversationCount, messageCount] = await Promise.all([
    Conversation.countDocuments({ projectId }),
    Message.countDocuments({
      conversationId: {
        $in: (await Conversation.find({ projectId }).select("_id").lean()).map((c) => c._id)
      }
    })
  ]);
  return { conversationCount, messageCount };
}

function buildConversationTitle(firstMessage: string) {
  const trimmed = firstMessage.trim().replace(/\s+/g, " ");
  return trimmed.length > 60 ? `${trimmed.slice(0, 57)}...` : trimmed;
}

export async function getConversationMessages(conversationId: string, projectId: string) {
  await connectToDatabase();
  const conversation = await Conversation.findOne({ _id: conversationId, projectId }).lean();
  if (!conversation) throw new Error("NOT_FOUND");
  return Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 }).lean();
}

export async function listConversationsByProject(projectId: string) {
  await connectToDatabase();
  return Conversation.find({ projectId }).sort({ updatedAt: -1 }).lean();
}

export async function createConversation(projectId: string, productInstanceId: string, title?: string) {
  await connectToDatabase();
  return Conversation.create({
    projectId,
    productInstanceId,
    title: title?.trim() || "New conversation"
  });
}

export async function sendMessageAndRespond(params: {
  conversationId?: string;
  projectId: string;
  productInstanceId: string;
  content: string;
}) {
  await connectToDatabase();
  let conversation = params.conversationId
    ? await Conversation.findOne({
        _id: params.conversationId,
        projectId: params.projectId,
        productInstanceId: params.productInstanceId
      }).lean()
    : null;

  if (!conversation) {
    const created = await createConversation(params.projectId, params.productInstanceId, buildConversationTitle(params.content));
    conversation = created.toObject();
  }

  await Message.create({
    conversationId: conversation._id,
    role: "user",
    content: params.content
  });

  const history = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 }).lean();
  const product = await ProductInstance.findById(conversation.productInstanceId).lean();
  if (!product) throw new Error("NOT_FOUND");

  const projectContext = await buildProjectContext(params.projectId);
  const integrationsContext = [
    buildIntegrationContext(product),
    `Project metrics: conversations=${projectContext.conversationCount}, messages=${projectContext.messageCount}.`
  ].join("\n");

  const assistantResponse = await generateAIResponse({
    conversationMessages: history.map((item) => ({ role: item.role, content: item.content })),
    integrationsContext
  });

  const assistantMessage = await Message.create({
    conversationId: conversation._id,
    role: "assistant",
    content: assistantResponse
  });

  return {
    conversationId: String(conversation._id),
    assistantMessage: assistantMessage.toObject()
  };
}

export async function sendMessageAndStreamResponse(params: {
  conversationId: string;
  projectId: string;
  productInstanceId: string;
  content: string;
}) {
  await connectToDatabase();
  const conversation = await Conversation.findOne({
    _id: params.conversationId,
    projectId: params.projectId,
    productInstanceId: params.productInstanceId
  }).lean();
  if (!conversation) throw new Error("NOT_FOUND");

  await Message.create({
    conversationId: conversation._id,
    role: "user",
    content: params.content
  });

  const history = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 }).lean();
  const product = await ProductInstance.findById(conversation.productInstanceId).lean();
  if (!product) throw new Error("NOT_FOUND");

  const projectContext = await buildProjectContext(params.projectId);
  const integrationsContext = [
    buildIntegrationContext(product),
    `Project metrics: conversations=${projectContext.conversationCount}, messages=${projectContext.messageCount}.`
  ].join("\n");

  const stream = generateAIResponseStream({
    conversationMessages: history.map((item) => ({ role: item.role, content: item.content })),
    integrationsContext
  });

  return {
    conversationId: String(conversation._id),
    stream
  };
}

export async function saveAssistantMessage(conversationId: string, content: string) {
  await connectToDatabase();
  const created = await Message.create({
    conversationId,
    role: "assistant",
    content
  });
  return created.toObject();
}
