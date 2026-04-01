"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";

type ManagementSidebarProps = {
  hasSession: boolean;
  sessionUser: string | null;
  isLoading: boolean;
  usersCount: number;
  groupsCount: number;
  onLogout: () => void;
};

const navItems = [
  { href: "/users/list", label: "Users List" },
  { href: "/users/create", label: "Create User" },
];

export function ManagementSidebar({
  hasSession,
  sessionUser,
  isLoading,
  usersCount,
  groupsCount,
  onLogout,
}: ManagementSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-full border-b border-zinc-200 bg-white/90 md:h-screen md:w-80 md:shrink-0 md:border-r md:border-b-0 dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="flex h-full flex-col gap-6 p-5 md:sticky md:top-0">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Pulp Management
          </p>
          <h2 className="text-xl font-semibold">Control Center</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Manage users and access from a single place.
          </p>
        </div>

        <nav className="space-y-4">
          <div className="space-y-2">
            <p className="px-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
              User Management
            </p>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm font-medium",
                    isActive
                      ? "border-transparent bg-black text-white dark:bg-white dark:text-black"
                      : "border-zinc-200 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
                  )}
                >
                  <span>{item.label}</span>
                  {isActive ? (
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs dark:bg-black/15">
                      Active
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="space-y-3 rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Session</p>
          <div className="text-sm">
            {hasSession ? (
              <>
                <p className="font-medium">{sessionUser}</p>
                <p className="text-zinc-600 dark:text-zinc-400">Connected to Pulp server</p>
              </>
            ) : (
              <p className="text-zinc-600 dark:text-zinc-400">Not authenticated</p>
            )}
          </div>
          {hasSession ? (
            <Button onClick={onLogout} disabled={isLoading} variant="outline" className="w-full">
              Logout
            </Button>
          ) : null}
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2">
          <Card className="p-3">
            <p className="text-xs text-zinc-500">Users</p>
            <p className="text-lg font-semibold">{usersCount}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-zinc-500">Groups</p>
            <p className="text-lg font-semibold">{groupsCount}</p>
          </Card>
        </div>
      </div>
    </aside>
  );
}
