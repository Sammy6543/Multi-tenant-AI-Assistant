export type UserRole = "admin" | "member";
export type MessageRole = "user" | "assistant";
export type WidgetType = "card" | "list" | "stat";
export type WidgetDataSource =
  | "users_count"
  | "messages_count"
  | "conversations_count"
  | "product_instances_count";

export interface SessionUser {
  id: string;
  name: string;
  role: UserRole;
  projectId: string;
}
