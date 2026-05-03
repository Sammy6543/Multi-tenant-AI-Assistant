import { Model, Schema, Types, model, models } from "mongoose";

import { MessageRole } from "@/types";

export interface MessageDocument {
  conversationId: Types.ObjectId;
  role: MessageRole;
  content: string;
  createdAt: Date;
}

const messageSchema = new Schema<MessageDocument>({
  conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const Message: Model<MessageDocument> = models.Message || model<MessageDocument>("Message", messageSchema);
