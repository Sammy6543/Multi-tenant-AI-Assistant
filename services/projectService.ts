import { connectToDatabase } from "@/lib/db";
import { ProductInstance } from "@/models/ProductInstance";
import { Project } from "@/models/Project";

export async function getProjectBySlug(slug: string) {
  await connectToDatabase();
  return Project.findOne({ slug }).lean();
}

export async function listProductInstances(projectId: string) {
  await connectToDatabase();
  return ProductInstance.find({ projectId }).lean();
}
