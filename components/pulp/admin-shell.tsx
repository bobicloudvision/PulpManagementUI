"use client";

import { ReactNode } from "react";
import { ManagementSidebar } from "@/components/pulp/management-sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type AdminShellProps = {
  title: string;
  description: string;
  hasSession: boolean;
  sessionUser: string | null;
  isLoading: boolean;
  usersCount: number;
  groupsCount: number;
  error: string | null;
  onLogout: () => void;
  children: ReactNode;
};

export function AdminShell({
  title,
  description,
  hasSession,
  sessionUser,
  isLoading,
  usersCount,
  groupsCount,
  error,
  onLogout,
  children,
}: AdminShellProps) {
  return (
    <main className="min-h-screen w-full bg-zinc-100/70 dark:bg-zinc-950">
      <div className="flex min-h-screen flex-col md:flex-row">
        <ManagementSidebar
          usersCount={usersCount}
          groupsCount={groupsCount}
        />

        <section className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-8">
          <Card className="flex flex-col gap-4 border-zinc-200 bg-white/90 md:flex-row md:items-start md:justify-between dark:border-zinc-800 dark:bg-zinc-900/70">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Administration
              </p>
              <h1 className="text-2xl font-semibold">{title}</h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
            </div>
            <div className="w-full rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 md:w-auto md:min-w-72 dark:border-zinc-800 dark:bg-zinc-950/50">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Session</p>
              <div className="mt-2 flex items-center justify-between gap-4">
                <div className="text-sm">
                  {hasSession ? (
                    <>
                      <p className="font-medium">{sessionUser}</p>
                      <p className="text-zinc-600 dark:text-zinc-400">Connected to Pulp server</p>
                    </>
                  ) : (
                    <p className="text-zinc-600 dark:text-zinc-400">Authentication required</p>
                  )}
                </div>
                {hasSession ? (
                  <Button onClick={onLogout} disabled={isLoading} variant="outline">
                    Logout
                  </Button>
                ) : (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
                    Offline
                  </span>
                )}
              </div>
            </div>
          </Card>

          {children}

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
