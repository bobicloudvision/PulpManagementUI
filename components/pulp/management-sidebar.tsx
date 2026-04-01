"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Card } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";

type ManagementSidebarProps = {
  usersCount: number;
  groupsCount: number;
};

const navSections = [
  {
    title: "User Management",
    items: [
      { href: "/users/list", label: "Users List" },
      { href: "/users/create", label: "Create User" },
    ],
  },
  {
    title: "Group Management",
    items: [
      { href: "/groups/list", label: "Groups List" },
      { href: "/groups/create", label: "Create Group" },
    ],
  },
];

export function ManagementSidebar({
  usersCount,
  groupsCount,
}: ManagementSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-full border-b border-zinc-200 bg-white md:h-screen md:w-80 md:shrink-0 md:border-r md:border-b-0 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex h-full flex-col gap-6 p-5 md:sticky md:top-0">
        <header className="rounded-xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-4 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black text-sm font-semibold text-white dark:bg-white dark:text-black">
              PM
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                Pulp Management
              </p>
              <h2 className="text-base font-semibold">Admin Console</h2>
            </div>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Manage users and access control for your Pulp environment.
          </p>
        </header>

        <nav className="space-y-4">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1.5">
              <p className="px-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                {section.title}
              </p>
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors",
                      isActive
                        ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-black"
                        : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
                    )}
                  >
                    <span className="font-medium">{item.label}</span>
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        isActive
                          ? "bg-white dark:bg-black"
                          : "bg-zinc-300 group-hover:bg-zinc-500 dark:bg-zinc-700 dark:group-hover:bg-zinc-500"
                      )}
                    />
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="mt-auto grid grid-cols-2 gap-2">
          <Card className="rounded-xl border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs text-zinc-500">Users</p>
            <p className="text-lg font-semibold">{usersCount}</p>
          </Card>
          <Card className="rounded-xl border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs text-zinc-500">Groups</p>
            <p className="text-lg font-semibold">{groupsCount}</p>
          </Card>
        </div>
      </div>
    </aside>
  );
}
