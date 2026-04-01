"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type PulpUser = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  is_staff: boolean;
  is_active: boolean;
};

type PulpGroup = {
  id: number;
  name: string;
};

type PulpListResponse<T> = {
  count: number;
  results: T[];
};

type ApiErrorResponse = {
  detail?: string;
};

async function readDetail(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ApiErrorResponse;
    if (body.detail) {
      return body.detail;
    }
  } catch {
    // Ignore parsing failure and fallback to status text.
  }

  return response.statusText || "Unexpected server error.";
}

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [sessionUser, setSessionUser] = useState<string | null>(null);
  const [users, setUsers] = useState<PulpUser[]>([]);
  const [groups, setGroups] = useState<PulpGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsersAndGroups = useCallback(async () => {
    const [usersResponse, groupsResponse] = await Promise.all([
      fetch("/api/pulp/users"),
      fetch("/api/pulp/groups"),
    ]);

    if (!usersResponse.ok) {
      throw new Error(await readDetail(usersResponse));
    }

    if (!groupsResponse.ok) {
      throw new Error(await readDetail(groupsResponse));
    }

    const usersPayload = (await usersResponse.json()) as PulpListResponse<PulpUser>;
    const groupsPayload = (await groupsResponse.json()) as PulpListResponse<PulpGroup>;

    setUsers(usersPayload.results);
    setGroups(groupsPayload.results);
  }, []);

  const checkSession = useCallback(async () => {
    setIsCheckingSession(true);

    const response = await fetch("/api/pulp/login");
    if (!response.ok) {
      setSessionUser(null);
      setIsCheckingSession(false);
      return;
    }

    const payload = (await response.json()) as { username: string };
    setSessionUser(payload.username);

    try {
      await loadUsersAndGroups();
    } catch (sessionLoadError) {
      setError(
        sessionLoadError instanceof Error
          ? sessionLoadError.message
          : "Failed to load users and groups."
      );
    } finally {
      setIsCheckingSession(false);
    }
  }, [loadUsersAndGroups]);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  const hasSession = useMemo(() => sessionUser !== null, [sessionUser]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const response = await fetch("/api/pulp/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      setError(await readDetail(response));
      setIsLoading(false);
      return;
    }

    const payload = (await response.json()) as { username: string };
    setSessionUser(payload.username);
    setPassword("");

    try {
      await loadUsersAndGroups();
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load data.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogout() {
    setIsLoading(true);
    setError(null);

    await fetch("/api/pulp/logout", { method: "POST" });

    setSessionUser(null);
    setUsers([]);
    setGroups([]);
    setPassword("");
    setIsLoading(false);
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6 md:p-10">
      <h1 className="text-2xl font-semibold">Pulp Server Management</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Login with your Pulp username and password to manage users and groups.
      </p>

      {isCheckingSession ? (
        <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          Checking existing session...
        </section>
      ) : !hasSession ? (
        <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <form className="flex flex-col gap-4" onSubmit={handleLogin}>
            <label className="flex flex-col gap-2 text-sm">
              Username
              <input
                className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                required
              />
            </label>

            <label className="flex flex-col gap-2 text-sm">
              Password
              <input
                type="password"
                className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="w-fit rounded-md bg-black px-4 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black"
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>
        </section>
      ) : (
        <>
          <section className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <span className="text-sm">
              Logged in as <strong>{sessionUser}</strong>
            </span>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoading}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm disabled:opacity-50 dark:border-zinc-700"
            >
              Logout
            </button>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <h2 className="mb-3 text-lg font-medium">Users ({users.length})</h2>
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="rounded-md border border-zinc-200 p-3 text-sm dark:border-zinc-800"
                  >
                    <div className="font-medium">{user.username}</div>
                    <div className="text-zinc-600 dark:text-zinc-400">
                      {user.first_name} {user.last_name}
                    </div>
                    <div className="text-zinc-600 dark:text-zinc-400">{user.email || "-"}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-500">
                      Staff: {String(user.is_staff)} | Active: {String(user.is_active)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <h2 className="mb-3 text-lg font-medium">Groups ({groups.length})</h2>
              <div className="space-y-2">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="rounded-md border border-zinc-200 p-3 text-sm dark:border-zinc-800"
                  >
                    <div className="font-medium">{group.name}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-500">ID: {group.id}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {error ? (
        <section className="rounded-lg border border-red-400 bg-red-50 p-3 text-sm text-red-700 dark:border-red-600 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </section>
      ) : null}
    </main>
  );
}
