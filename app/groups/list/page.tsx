"use client";

import { AdminShell } from "@/components/pulp/admin-shell";
import { LoginCard } from "@/components/pulp/login-card";
import { usePulpManagement } from "@/components/pulp/use-pulp-management";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

export default function GroupsListPage() {
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
  } = usePulpManagement();

  return (
    <AdminShell
      title="Groups List"
      description="View groups and related users from your connected Pulp server."
      hasSession={hasSession}
      sessionUser={sessionUser}
      isLoading={isLoading}
      usersCount={users.length}
      groupsCount={groups.length}
      error={error}
      onLogout={logout}
    >
      {isCheckingSession ? (
        <Card>Checking existing session...</Card>
      ) : !hasSession ? (
        <LoginCard isLoading={isLoading} onLogin={login} />
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
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

          <Card>
            <CardTitle>Users ({users.length})</CardTitle>
            <CardContent className="space-y-2">
              {users.map((user) => (
                <Card key={user.id} className="p-3 text-sm">
                  <div className="font-medium">{user.username}</div>
                  <div className="text-zinc-600 dark:text-zinc-400">{user.email || "-"}</div>
                </Card>
              ))}
            </CardContent>
          </Card>
        </section>
      )}
    </AdminShell>
  );
}
