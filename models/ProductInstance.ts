import { Model, Schema, Types, model, models } from "mongoose";

export interface ProductInstanceDocument {
  projectId: Types.ObjectId;
  name: string;
  integrations: {
    shopifyEnabled: boolean;
    crmEnabled: boolean;
    /** Stored tenant-specific Shopify metrics (read by AI context builder). */
    shopify?: {
      totalOrders: number;
      topProductName: string;
    };
    /** Stored tenant-specific CRM metrics (read by AI context builder). */
    crm?: {
      openDealsCount: number;
      pipelineValueUsd: number;
    };
  };
}

const productInstanceSchema = new Schema<ProductInstanceDocument>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    name: { type: String, required: true },
    integrations: {
      shopifyEnabled: { type: Boolean, default: false },
      crmEnabled: { type: Boolean, default: false },
      shopify: {
        totalOrders: { type: Number },
        topProductName: { type: String }
      },
      crm: {
        openDealsCount: { type: Number },
        pipelineValueUsd: { type: Number }
      }
    }
  },
  { timestamps: true }
);

export const ProductInstance: Model<ProductInstanceDocument> =
  models.ProductInstance || model<ProductInstanceDocument>("ProductInstance", productInstanceSchema);
