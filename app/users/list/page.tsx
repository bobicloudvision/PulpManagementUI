"use client";

import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { ManagementSidebar } from "@/components/pulp/management-sidebar";
import { LoginCard } from "@/components/pulp/login-card";
import { usePulpManagement } from "@/components/pulp/use-pulp-management";

export default function UsersListPage() {
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
            <h1 className="text-2xl font-semibold">Users List</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              View users and groups from your connected Pulp server.
            </p>
          </div>

          {isCheckingSession ? (
            <Card>Checking existing session...</Card>
          ) : !hasSession ? (
            <LoginCard isLoading={isLoading} onLogin={login} />
          ) : (
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
