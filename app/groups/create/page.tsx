"use client";

import { FormEvent, useState } from "react";
import { AdminShell } from "@/components/pulp/admin-shell";
import { usePulpAuthContext } from "@/components/pulp/auth-context";
import { usePulpGroups } from "@/components/pulp/use-pulp-groups";
import { useRequireAuth } from "@/components/pulp/use-require-auth";
import { usePulpUsers } from "@/components/pulp/use-pulp-users";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { CreatePulpGroupPayload } from "@/services/pulp/types";

export default function GroupsCreatePage() {
  const { sessionUser, isLoading, isCheckingSession, hasSession, error, logout } =
    usePulpAuthContext();
  const isRedirectingToLogin = useRequireAuth({ hasSession, isCheckingSession });
  const { groups, createGroup } = usePulpGroups(hasSession);
  const { users } = usePulpUsers(hasSession);

  const [groupName, setGroupName] = useState("");

  async function handleCreateGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload: CreatePulpGroupPayload = {
      name: groupName,
    };

    const success = await createGroup(payload);
    if (success) {
      setGroupName("");
    }
  }

  return (
    <AdminShell
      title="Create Group"
      description="Create new groups directly in your connected Pulp server."
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
          <CardTitle>New Group</CardTitle>
          <form className="grid gap-3 md:max-w-lg" onSubmit={handleCreateGroup}>
            <FormField label="Group name">
              <Input
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
                required
              />
            </FormField>

            <div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create group"}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </AdminShell>
  );
}
