import { Model, Schema, Types, model, models } from "mongoose";

import { UserRole } from "@/types";

export interface UserDocument {
  name: string;
  role: UserRole;
  projectId: Types.ObjectId;
}

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true },
    role: { type: String, enum: ["admin", "member"], required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true }
  },
  { timestamps: true }
);

export const User: Model<UserDocument> = models.User || model<UserDocument>("User", userSchema);
