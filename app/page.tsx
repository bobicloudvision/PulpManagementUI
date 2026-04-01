"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { CheckboxField, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

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
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createUsername, setCreateUsername] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createFirstName, setCreateFirstName] = useState("");
  const [createLastName, setCreateLastName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createIsStaff, setCreateIsStaff] = useState(false);
  const [createIsActive, setCreateIsActive] = useState(true);

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

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsCreatingUser(true);

    const response = await fetch("/api/pulp/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: createUsername,
        password: createPassword,
        first_name: createFirstName,
        last_name: createLastName,
        email: createEmail,
        is_staff: createIsStaff,
        is_active: createIsActive,
      }),
    });

    if (!response.ok) {
      setError(await readDetail(response));
      setIsCreatingUser(false);
      return;
    }

    setCreateUsername("");
    setCreatePassword("");
    setCreateFirstName("");
    setCreateLastName("");
    setCreateEmail("");
    setCreateIsStaff(false);
    setCreateIsActive(true);

    try {
      await loadUsersAndGroups();
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to reload users.");
    } finally {
      setIsCreatingUser(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6 md:p-10">
      <h1 className="text-2xl font-semibold">Pulp Server Management</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Login with your Pulp username and password to manage users and groups.
      </p>

      {isCheckingSession ? (
        <Card>
          Checking existing session...
        </Card>
      ) : !hasSession ? (
        <Card>
          <form className="flex flex-col gap-4" onSubmit={handleLogin}>
            <FormField label="Username">
              <Input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                required
              />
            </FormField>

            <FormField label="Password">
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </FormField>

            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </Card>
      ) : (
        <>
          <Card className="flex items-center justify-between">
            <span className="text-sm">
              Logged in as <strong>{sessionUser}</strong>
            </span>
            <Button
              onClick={handleLogout}
              disabled={isLoading}
              variant="outline"
            >
              Logout
            </Button>
          </Card>

          <Card>
            <CardTitle>Create User</CardTitle>
            <form className="grid gap-3 md:grid-cols-2" onSubmit={handleCreateUser}>
              <FormField label="Username">
                <Input
                  value={createUsername}
                  onChange={(event) => setCreateUsername(event.target.value)}
                  required
                />
              </FormField>

              <FormField label="Password">
                <Input
                  type="password"
                  value={createPassword}
                  onChange={(event) => setCreatePassword(event.target.value)}
                  required
                />
              </FormField>

              <FormField label="First name">
                <Input
                  value={createFirstName}
                  onChange={(event) => setCreateFirstName(event.target.value)}
                />
              </FormField>

              <FormField label="Last name">
                <Input
                  value={createLastName}
                  onChange={(event) => setCreateLastName(event.target.value)}
                />
              </FormField>

              <FormField label="Email" className="md:col-span-2">
                <Input
                  type="email"
                  value={createEmail}
                  onChange={(event) => setCreateEmail(event.target.value)}
                />
              </FormField>

              <CheckboxField label="Is staff">
                <Input
                  type="checkbox"
                  className="h-4 w-4 rounded border-zinc-300 p-0 dark:border-zinc-700"
                  checked={createIsStaff}
                  onChange={(event) => setCreateIsStaff(event.target.checked)}
                />
              </CheckboxField>

              <CheckboxField label="Is active">
                <Input
                  type="checkbox"
                  className="h-4 w-4 rounded border-zinc-300 p-0 dark:border-zinc-700"
                  checked={createIsActive}
                  onChange={(event) => setCreateIsActive(event.target.checked)}
                />
              </CheckboxField>

              <div className="md:col-span-2">
                <Button
                  type="submit"
                  disabled={isCreatingUser}
                >
                  {isCreatingUser ? "Creating..." : "Create user"}
                </Button>
              </div>
            </form>
          </Card>

          <section className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardTitle>Users ({users.length})</CardTitle>
              <CardContent className="space-y-2">
                {users.map((user) => (
                  <Card key={user.id} className="p-3 text-sm">
                    <div className="font-medium">{user.username}</div>
                    <div className="text-zinc-600 dark:text-zinc-400">
                      {user.first_name} {user.last_name}
                    </div>
                    <div className="text-zinc-600 dark:text-zinc-400">{user.email || "-"}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-500">
                      Staff: {String(user.is_staff)} | Active: {String(user.is_active)}
                    </div>
                  </Card>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardTitle>Groups ({groups.length})</CardTitle>
              <CardContent className="space-y-2">
                {groups.map((group) => (
                  <Card key={group.id} className="p-3 text-sm">
                    <div className="font-medium">{group.name}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-500">ID: {group.id}</div>
                  </Card>
                ))}
              </CardContent>
            </Card>
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
