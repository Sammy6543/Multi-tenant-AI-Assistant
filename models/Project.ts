import { Model, Schema, model, models } from "mongoose";

export interface ProjectDocument {
  name: string;
  slug: string;
}

const projectSchema = new Schema<ProjectDocument>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true }
  },
  { timestamps: true }
);

export const Project: Model<ProjectDocument> =
  models.Project || model<ProjectDocument>("Project", projectSchema);
