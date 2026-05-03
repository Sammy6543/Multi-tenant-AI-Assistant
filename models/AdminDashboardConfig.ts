import { Model, Schema, Types, model, models } from "mongoose";

import { WidgetDataSource, WidgetType } from "@/types";

export interface AdminWidget {
  type: WidgetType;
  label: string;
  dataSource: WidgetDataSource;
}

export interface AdminDashboardConfigDocument {
  projectId: Types.ObjectId;
  widgets: AdminWidget[];
}

const adminWidgetSchema = new Schema<AdminWidget>({
  type: { type: String, enum: ["card", "list", "stat"], required: true },
  label: { type: String, required: true },
  dataSource: {
    type: String,
    enum: ["users_count", "messages_count", "conversations_count", "product_instances_count"],
    required: true
  }
});

const adminDashboardConfigSchema = new Schema<AdminDashboardConfigDocument>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, unique: true, index: true },
    widgets: { type: [adminWidgetSchema], default: [] }
  },
  { timestamps: true }
);

export const AdminDashboardConfig: Model<AdminDashboardConfigDocument> =
  models.AdminDashboardConfig || model<AdminDashboardConfigDocument>("AdminDashboardConfig", adminDashboardConfigSchema);
