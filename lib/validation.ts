import { z } from "zod";

export const loginSchema = z.object({
  userId: z.string().min(1)
});

export const createConversationSchema = z.object({
  projectId: z.string().min(1),
  productInstanceId: z.string().min(1),
  title: z.string().trim().min(1).max(120).optional()
});

export const createMessageSchema = z.object({
  content: z.string().min(1).max(4000)
});

export const chatSendSchema = z.object({
  conversationId: z.string().min(1).optional(),
  projectId: z.string().min(1),
  productInstanceId: z.string().min(1),
  content: z.string().min(1).max(4000)
});

export const listConversationsSchema = z.object({
  projectId: z.string().min(1)
});

export const adminDashboardQuerySchema = z.object({
  projectId: z.string().min(1)
});

export const slugParamSchema = z.object({
  slug: z.string().min(1)
});

export const projectIdParamSchema = z.object({
  projectId: z.string().min(1)
});

export const conversationIdParamSchema = z.object({
  conversationId: z.string().min(1)
});

export const authUsersQuerySchema = z.object({
  projectSlug: z.string().trim().min(1).max(120)
});
