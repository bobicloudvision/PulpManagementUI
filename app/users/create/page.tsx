"use client";

import { FormEvent, useState } from "react";
import { AdminShell } from "@/components/pulp/admin-shell";
import { usePulpAuthContext } from "@/components/pulp/auth-context";
import { usePulpGroups } from "@/components/pulp/use-pulp-groups";
import { useRequireAuth } from "@/components/pulp/use-require-auth";
import { usePulpUsers } from "@/components/pulp/use-pulp-users";
import { CreatePulpUserPayload } from "@/services/pulp/types";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { CheckboxField, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

export default function UsersCreatePage() {
  const { sessionUser, isLoading, isCheckingSession, hasSession, error, logout } =
    usePulpAuthContext();
  const isRedirectingToLogin = useRequireAuth({ hasSession, isCheckingSession });
  const { users, createUser } = usePulpUsers(hasSession);
  const { groups } = usePulpGroups(hasSession);

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
    <AdminShell
      title="Create User"
      description="Create new users directly in your connected Pulp server."
      hasSession={hasSession}
      sessionUser={sessionUser}
      isLoading={isLoading}
      usersCount={users.length}
      groupsCount={groups.length}
      error={error}
      onLogout={logout}
    >
      {isCheckingSession || isRedirectingToLogin ? (
        <Card>Checking existing session...</Card>
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
    </AdminShell>
  );
}
