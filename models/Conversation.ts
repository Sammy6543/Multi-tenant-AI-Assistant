import { Model, Schema, Types, model, models } from "mongoose";

export interface ConversationDocument {
  projectId: Types.ObjectId;
  productInstanceId: Types.ObjectId;
  title: string;
}

const conversationSchema = new Schema<ConversationDocument>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    productInstanceId: { type: Schema.Types.ObjectId, ref: "ProductInstance", required: true, index: true },
    title: { type: String, required: true }
  },
  { timestamps: true }
);

export const Conversation: Model<ConversationDocument> =
  models.Conversation || model<ConversationDocument>("Conversation", conversationSchema);
