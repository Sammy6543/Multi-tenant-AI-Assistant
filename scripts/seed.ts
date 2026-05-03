import { existsSync, readFileSync } from "fs";
import { join } from "path";

import { connectToDatabase } from "../lib/db";
import { AdminDashboardConfig } from "../models/AdminDashboardConfig";
import { Conversation } from "../models/Conversation";
import { Message } from "../models/Message";
import { ProductInstance } from "../models/ProductInstance";
import { Project } from "../models/Project";
import { User } from "../models/User";

function loadLocalEnv() {
  const envPath = join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  const raw = readFileSync(envPath, "utf8");
  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const idx = trimmed.indexOf("=");
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  });
}

async function seed() {
  loadLocalEnv();
  await connectToDatabase();

  await Promise.all([
    Message.deleteMany({}),
    Conversation.deleteMany({}),
    AdminDashboardConfig.deleteMany({}),
    ProductInstance.deleteMany({}),
    User.deleteMany({}),
    Project.deleteMany({})
  ]);

  const project = await Project.create({
    name: "Demo Tenant",
    slug: "demo-tenant"
  });

  const admin = await User.create({
    name: "Alice Admin",
    role: "admin",
    projectId: project._id
  });

  await User.create({
    name: "Mark Member",
    role: "member",
    projectId: project._id
  });

  const product = await ProductInstance.create({
    projectId: project._id,
    name: "Customer Assistant",
    integrations: {
      shopifyEnabled: true,
      crmEnabled: true,
      shopify: {
        totalOrders: 120,
        topProductName: "Enterprise Desk Lamp"
      },
      crm: {
        openDealsCount: 5,
        pipelineValueUsd: 26000
      }
    }
  });

  const conversationA = await Conversation.create({
    projectId: project._id,
    productInstanceId: product._id,
    title: "Customer asks about delayed order"
  });
  const conversationB = await Conversation.create({
    projectId: project._id,
    productInstanceId: product._id,
    title: "Sales follow-up for enterprise lead"
  });

  await Message.insertMany([
    {
      conversationId: conversationA._id,
      role: "user",
      content: "My order is delayed by 3 days. Can you help?",
      createdAt: new Date(Date.now() - 1000 * 60 * 12)
    },
    {
      conversationId: conversationA._id,
      role: "assistant",
      content: "I checked your shipment timeline and it is currently in transit with an expected delivery tomorrow.",
      createdAt: new Date(Date.now() - 1000 * 60 * 11)
    },
    {
      conversationId: conversationB._id,
      role: "user",
      content: "What should I send to our top enterprise lead as a follow-up?",
      createdAt: new Date(Date.now() - 1000 * 60 * 8)
    },
    {
      conversationId: conversationB._id,
      role: "assistant",
      content: "Share a concise ROI summary and propose two implementation timeline options based on their priorities.",
      createdAt: new Date(Date.now() - 1000 * 60 * 7)
    }
  ]);

  await AdminDashboardConfig.create({
    projectId: project._id,
    widgets: [
      { type: "card", label: "Total Users", dataSource: "users_count" },
      { type: "stat", label: "Total Messages", dataSource: "messages_count" },
      { type: "list", label: "Conversations", dataSource: "conversations_count" },
      { type: "card", label: "Assistant Instances", dataSource: "product_instances_count" }
    ]
  });

  console.log("Seed complete");
  console.log("Project slug:", project.slug);
  console.log("Admin user id:", String(admin._id));
  console.log("Product instance id:", String(product._id));
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
