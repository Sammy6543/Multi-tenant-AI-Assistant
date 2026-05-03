"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { useLogin, useUsers } from "@/hooks/useAuth";

export default function LoginCard() {
  const router = useRouter();
  const [projectSlug, setProjectSlug] = useState("");
  const { data, isLoading, error } = useUsers(projectSlug.trim());
  const login = useLogin();
  const [selectedUser, setSelectedUser] = useState("");

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedUser) return;
    const loggedIn = await login.mutateAsync(selectedUser);
    router.push(`/project/${loggedIn.projectSlug}`);
  };

  return (
    <div className="mx-auto mt-20 max-w-xl rounded-xl bg-white p-6 shadow">
      <h1 className="text-2xl font-bold">Login</h1>
      <p className="mt-1 text-sm text-slate-600">
        Enter your project slug (tenant), then pick a user stored in the database.
      </p>
      <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="slug">
        Project slug
      </label>
      <input
        id="slug"
        className="mt-1 w-full rounded border border-slate-300 p-2"
        value={projectSlug}
        onChange={(e) => {
          setProjectSlug(e.target.value);
          setSelectedUser("");
        }}
        placeholder="e.g. demo-tenant"
        autoComplete="off"
      />
      {projectSlug.trim().length > 0 && isLoading && <p className="mt-4 text-sm">Loading users...</p>}
      {error && <p className="mt-4 text-sm text-red-600">{(error as Error).message}</p>}
      {projectSlug.trim().length > 0 && !isLoading && !error && data?.users?.length === 0 && (
        <p className="mt-4 text-sm text-slate-600">No users for this project. Check the slug or run the seed script.</p>
      )}
      {!!data?.users?.length && (
        <form className="mt-4 space-y-3" onSubmit={onSubmit}>
          <select
            className="w-full rounded border border-slate-300 p-2"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
          >
            <option value="">Select user</option>
            {data.users.map((user) => (
              <option key={user._id} value={user._id}>
                {user.name} ({user.role})
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
            disabled={!selectedUser || login.isPending}
          >
            {login.isPending ? "Signing in..." : "Sign in"}
          </button>
        </form>
      )}
    </div>
  );
}
