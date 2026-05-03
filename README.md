# Multi-tenant AI Assistant (OpenRouter + Config-Driven Admin)

Production-ready Next.js App Router app: all product data, users, conversations, messages, and dashboard metrics are read from **MongoDB**. **OpenRouter** (`OPENROUTER_API_KEY`) generates assistant replies; prompt context is built from **fields stored on your `ProductInstance` documents** and live project stats (counts from the database).

## Deploy to Vercel (production website)

1. Push this repository to GitHub (or connect the folder in Vercel).
2. In the Vercel project, set **Environment Variables**:
   - `MONGODB_URI` — use a [MongoDB Atlas](https://www.mongodb.com/atlas) connection string (SRV), with a database user and **Network Access** that allows Vercel (often `0.0.0.0/0` for serverless, or Vercel’s IP ranges if you restrict).
   - `OPENROUTER_API_KEY` — from [OpenRouter](https://openrouter.ai/) (API key in account settings).
   - `OPENROUTER_MODEL` — e.g. `openrouter/auto` or a specific model id (see OpenRouter model list).
   - `NEXT_PUBLIC_APP_URL` — your production URL, e.g. `https://your-app.vercel.app` (used for OpenRouter `HTTP-Referer` / `X-Title` when set).
3. Deploy (Vercel runs `npm run build` and `npm run start` automatically for Next.js).
4. **Seed production MongoDB once** from your machine (or CI) with the same `MONGODB_URI` as production:

```bash
npm run seed
```

5. Open your site, enter the **project slug** from the seed (default: `demo-tenant`), sign in as a user from the list, and use chat/admin.

Local and production both use the same codebase; there is no separate “mock” data path in the application layer.

## Tech Stack

- Next.js (App Router), React, TypeScript
- Tailwind CSS
- MongoDB + Mongoose
- TanStack Query
- Zod validation
- OpenRouter API (`/api/v1/chat/completions`)

## Architecture (Strict Layering)

- `access/` authorization policy functions (`canAccessProject`, `isAdmin`)
- `services/` business logic + all DB operations + OpenRouter calls
- `app/api/` thin route handlers with Zod validation
- `hooks/` frontend data fetching/mutations (TanStack Query)
- `components/` + `app/` UI only

## Project Structure

```txt
app/
  api/
    auth/login
    auth/users
    projects/[slug]
    conversations
    chat/send
    chat/[conversationId]/messages
    admin/dashboard
    admin/[projectId]
  project/[slug]
  chat/[conversationId]
  admin/[projectId]
components/
hooks/
models/
services/
access/
lib/
scripts/
```

## Environment Variables

Create `.env.local`:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/multi_tenant_ai
# Production (Atlas example):
# MONGODB_URI=mongodb+srv://USER:PASS@cluster.mongodb.net/multi_tenant_ai?retryWrites=true&w=majority
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=openrouter/auto
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Setup

1. Install dependencies

```bash
npm install
```

2. Seed MongoDB with real records

```bash
npm run seed
```

3. Run development server

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## OpenRouter integration

- AI logic lives only in `services/aiService.ts`.
- Uses `POST https://openrouter.ai/api/v1/chat/completions` with OpenAI-compatible `messages`.
- Sends full conversation history from MongoDB plus integration/project context in the system block.
- Configure `OPENROUTER_MODEL` (default `openrouter/auto`). Pick any model your key supports on OpenRouter.
- Set `NEXT_PUBLIC_APP_URL` so OpenRouter receives `HTTP-Referer` and `X-Title` (recommended by OpenRouter).
- Handles missing API key, API errors, rate limit (`429`), and empty responses.

## Multi-tenant Isolation

- Tenant boundary is `Project`.
- Every chat/admin query is scoped by `projectId`.
- Access is enforced server-side before service execution.
- Members/admins can only access their own project.
- Admin dashboard endpoints require admin role.

## Admin Dashboard (Config Driven + Real Data)

Dashboard layout comes from `AdminDashboardConfig.widgets`.

Widget schema:

- `type`: `card` | `list` | `stat`
- `label`
- `dataSource`: `users_count` | `messages_count` | `conversations_count` | `product_instances_count`

Real counts are computed in service layer from MongoDB on each request.

## API Endpoints

- `POST /api/auth/login`
- `GET /api/auth/users`
- `GET /api/projects/[slug]`
- `GET /api/conversations?projectId=...`
- `POST /api/conversations`
- `POST /api/chat/send`
- `POST /api/chat/[conversationId]/stream`
- `GET /api/chat/[conversationId]/messages`
- `POST /api/chat/[conversationId]/messages`
- `GET /api/admin/dashboard?projectId=...`
- `GET /api/admin/[projectId]`

## Seed Data

`scripts/seed.ts` inserts records **into MongoDB** (run after `MONGODB_URI` is set):

- 1 project (slug: **`demo-tenant`**)
- 1 admin + 1 member
- 1 product instance with **Shopify/CRM metrics stored on the document** (`integrations.shopify`, `integrations.crm`)
- multiple conversations and messages
- admin dashboard config widgets

Login flow: enter project slug **`demo-tenant`**, then select a user.

## Updating Dashboard Without Code Changes

Edit the `AdminDashboardConfig` document in MongoDB and change widgets/types/data sources.  
Refresh admin page to get new widget layout and values.
