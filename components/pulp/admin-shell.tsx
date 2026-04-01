"use client";

import { ReactNode } from "react";
import { ManagementSidebar } from "@/components/pulp/management-sidebar";
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
    <main className="mx-auto w-full max-w-7xl p-6 md:p-10">
      <div className="flex flex-col gap-6 md:flex-row">
        <ManagementSidebar
          hasSession={hasSession}
          sessionUser={sessionUser}
          isLoading={isLoading}
          usersCount={usersCount}
          groupsCount={groupsCount}
          onLogout={onLogout}
        />

        <section className="flex min-w-0 flex-1 flex-col gap-6">
          <Card className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Administration
              </p>
              <h1 className="text-2xl font-semibold">{title}</h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span
                className={
                  hasSession
                    ? "rounded-full border border-green-200 bg-green-50 px-3 py-1 text-green-700 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-300"
                    : "rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300"
                }
              >
                {hasSession ? "Connected" : "Authentication Required"}
              </span>
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
