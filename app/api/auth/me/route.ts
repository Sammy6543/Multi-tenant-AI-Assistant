import { getSessionUser } from "@/lib/session";
import { fail, ok } from "@/lib/api";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return fail("Not authenticated", 401);
  return ok({ user });
}