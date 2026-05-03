import { connectToDatabase } from "@/lib/db";
import { AdminDashboardConfig } from "@/models/AdminDashboardConfig";
import { Conversation } from "@/models/Conversation";
import { Message } from "@/models/Message";
import { ProductInstance } from "@/models/ProductInstance";
import { User } from "@/models/User";
import { WidgetDataSource } from "@/types";

export async function getDashboardConfig(projectId: string) {
  await connectToDatabase();
  return AdminDashboardConfig.findOne({ projectId }).lean();
}

export async function getDashboardStats(projectId: string) {
  await connectToDatabase();
  const [usersCount, productInstancesCount, conversationsCount, conversationIds] = await Promise.all([
    User.countDocuments({ projectId }),
    ProductInstance.countDocuments({ projectId }),
    Conversation.countDocuments({ projectId }),
    Conversation.find({ projectId }).select("_id").lean()
  ]);

  const messagesCount = await Message.countDocuments({
    conversationId: { $in: conversationIds.map((c) => c._id) }
  });

  const stats: Record<WidgetDataSource, number> = {
    users_count: usersCount,
    messages_count: messagesCount,
    conversations_count: conversationsCount,
    product_instances_count: productInstancesCount
  };
  return stats;
}
