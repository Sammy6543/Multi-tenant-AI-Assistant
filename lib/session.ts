import { cookies } from "next/headers";

import { SessionUser } from "@/types";

const SESSION_KEY = "mock_session";

export async function setSession(user: SessionUser) {
  const store = await cookies();
  store.set(SESSION_KEY, JSON.stringify(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const raw = store.get(SESSION_KEY)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}
