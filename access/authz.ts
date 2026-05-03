import { SessionUser } from "@/types";

export function canAccessProject(user: SessionUser | null, projectId: string) {
  if (!user) return false;
  return String(user.projectId) === String(projectId);
}

export function isAdmin(user: SessionUser | null) {
  return user?.role === "admin";
}

export function ensureProjectAccess(user: SessionUser | null, projectId: string) {
  if (!user) throw new Error("UNAUTHORIZED");
  if (!canAccessProject(user, projectId)) throw new Error("FORBIDDEN");
}

export function ensureAdminForProject(user: SessionUser | null, projectId: string) {
  ensureProjectAccess(user, projectId);
  if (!isAdmin(user)) throw new Error("FORBIDDEN");
}
