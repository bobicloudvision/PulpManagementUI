"use client";

import { FormEvent, useState } from "react";
import { ManagementSidebar } from "@/components/pulp/management-sidebar";
import { LoginCard } from "@/components/pulp/login-card";
import {
  CreatePulpUserPayload,
  usePulpManagement,
} from "@/components/pulp/use-pulp-management";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { CheckboxField, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

export default function UsersCreatePage() {
  const {
    sessionUser,
    users,
    groups,
    isLoading,
    isCheckingSession,
    hasSession,
    error,
    login,
    logout,
    createUser,
  } = usePulpManagement();

  const [createUsername, setCreateUsername] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createFirstName, setCreateFirstName] = useState("");
  const [createLastName, setCreateLastName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createIsStaff, setCreateIsStaff] = useState(false);
  const [createIsActive, setCreateIsActive] = useState(true);

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload: CreatePulpUserPayload = {
      username: createUsername,
      password: createPassword,
      first_name: createFirstName,
      last_name: createLastName,
      email: createEmail,
      is_staff: createIsStaff,
      is_active: createIsActive,
    };

    const success = await createUser(payload);
    if (!success) {
      return;
    }

    setCreateUsername("");
    setCreatePassword("");
    setCreateFirstName("");
    setCreateLastName("");
    setCreateEmail("");
    setCreateIsStaff(false);
    setCreateIsActive(true);
  }

  return (
    <main className="mx-auto w-full max-w-7xl p-6 md:p-10">
      <div className="flex flex-col gap-6 md:flex-row">
        <ManagementSidebar
          hasSession={hasSession}
          sessionUser={sessionUser}
          isLoading={isLoading}
          usersCount={users.length}
          groupsCount={groups.length}
          onLogout={logout}
        />

        <section className="flex min-w-0 flex-1 flex-col gap-6">
          <div>
            <h1 className="text-2xl font-semibold">Create User</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Create new users directly in your connected Pulp server.
            </p>
          </div>

          {isCheckingSession ? (
            <Card>Checking existing session...</Card>
          ) : !hasSession ? (
            <LoginCard isLoading={isLoading} onLogin={login} />
          ) : (
            <Card>
              <CardTitle>New User</CardTitle>
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
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Creating..." : "Create user"}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {error ? (
            <section className="rounded-lg border border-red-400 bg-red-50 p-3 text-sm text-red-700 dark:border-red-600 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </section>
          ) : null}
        </section>
      </div>
    </main>
  );
}
