"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/pulp/admin-shell";
import { usePulpAuthContext } from "@/components/pulp/auth-context";
import { usePulpGroups } from "@/components/pulp/use-pulp-groups";
import { useRequireAuth } from "@/components/pulp/use-require-auth";
import { usePulpUsers } from "@/components/pulp/use-pulp-users";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import {
  pulpDashboardService,
  type PulpDashboardSummary,
} from "@/services/pulp/dashboard-service";

const quickLinks: { href: string; label: string; description: string }[] = [
  { href: "/users/list", label: "Users", description: "Accounts and permissions" },
  { href: "/groups/list", label: "Groups", description: "Access groups" },
  { href: "/repositories/list", label: "Repositories", description: "RPM and Debian" },
  { href: "/content/list", label: "Content", description: "Packages and metadata" },
  { href: "/uploads/create", label: "Upload", description: "Send artifacts to Pulp" },
];

export default function DashboardPage() {
  const { sessionUser, isLoading, isCheckingSession, hasSession, error, logout } =
    usePulpAuthContext();
  const isRedirectingToLogin = useRequireAuth({ hasSession, isCheckingSession });
  const { users } = usePulpUsers(hasSession);
  const { groups } = usePulpGroups(hasSession);

  const [summary, setSummary] = useState<PulpDashboardSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    if (!hasSession) {
      setSummary(null);
      setSummaryError(null);
      return;
    }

    try {
      setSummaryError(null);
      const data = await pulpDashboardService.summary();
      setSummary(data);
    } catch (err) {
      setSummary(null);
      setSummaryError(err instanceof Error ? err.message : "Failed to load dashboard stats.");
    }
  }, [hasSession]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  return (
    <AdminShell
      title="Dashboard"
      description="Overview of your Pulp server. Summary counts are cached on the server for about a minute."
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
        <div className="flex flex-col gap-6">
          <div className="rounded-lg border border-sky-200/90 bg-sky-50/90 px-4 py-3 text-sm text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/35 dark:text-sky-100">
            <p className="font-medium">Server-side cache</p>
            <p className="mt-1 text-sky-900/90 dark:text-sky-200/90">
              Totals below are served from a short-lived server cache (60s revalidation) so
              repeated visits stay fast. Use refresh if you need numbers immediately after a change.
            </p>
          </div>

          {summaryError ? (
            <Card className="border-amber-300 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-950/30">
              <CardTitle>Summary</CardTitle>
              <CardContent className="text-sm text-amber-900 dark:text-amber-200">
                {summaryError}
              </CardContent>
            </Card>
          ) : null}

          {summary ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Card>
                <CardTitle>Users</CardTitle>
                <CardContent>
                  <p className="text-3xl font-semibold tabular-nums">{summary.usersCount}</p>
                </CardContent>
              </Card>
              <Card>
                <CardTitle>Groups</CardTitle>
                <CardContent>
                  <p className="text-3xl font-semibold tabular-nums">{summary.groupsCount}</p>
                </CardContent>
              </Card>
              <Card>
                <CardTitle>RPM repositories</CardTitle>
                <CardContent>
                  <p className="text-3xl font-semibold tabular-nums">{summary.rpmRepositories}</p>
                </CardContent>
              </Card>
              <Card>
                <CardTitle>Debian repositories</CardTitle>
                <CardContent>
                  <p className="text-3xl font-semibold tabular-nums">{summary.debRepositories}</p>
                </CardContent>
              </Card>
            </div>
          ) : !summaryError && hasSession ? (
            <Card>Loading summary…</Card>
          ) : null}

          <Card>
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="mb-0">Shortcuts</CardTitle>
              {hasSession ? (
                <Button type="button" variant="outline" onClick={() => void loadSummary()} disabled={isLoading}>
                  Refresh summary
                </Button>
              ) : null}
            </div>
            <CardContent>
              <ul className="grid gap-3 sm:grid-cols-2">
                {quickLinks.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="block rounded-lg border border-zinc-200 bg-white/60 p-3 transition hover:border-zinc-300 hover:bg-white dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/80"
                    >
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {item.label}
                      </span>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">{item.description}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </AdminShell>
  );
}
