"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";

type ManagementSidebarProps = {
  usersCount: number;
  groupsCount: number;
};

type NavIconName =
  | "users"
  | "user-plus"
  | "groups"
  | "group-plus"
  | "distribution"
  | "content"
  | "upload";
type NavItem = {
  href: string;
  label: string;
  hint: string;
  icon: NavIconName;
};

const navSections = [
  {
    title: "Identity",
    items: [
      { href: "/users/list", label: "Users", hint: "Browse all users", icon: "users" },
      { href: "/users/create", label: "Create User", hint: "Add a new account", icon: "user-plus" },
    ] satisfies NavItem[],
  },
  {
    title: "Access",
    items: [
      { href: "/groups/list", label: "Groups", hint: "Manage team groups", icon: "groups" },
      { href: "/groups/create", label: "Create Group", hint: "Create access group", icon: "group-plus" },
    ] satisfies NavItem[],
  },
  {
    title: "Delivery",
    items: [
      {
        href: "/distributions/list",
        label: "Distributions",
        hint: "Publish endpoints",
        icon: "distribution",
      },
    ] satisfies NavItem[],
  },
  {
    title: "Repository",
    items: [
      { href: "/content/list", label: "Content", hint: "Packages and metadata", icon: "content" },
      { href: "/uploads/list", label: "Uploads", hint: "Chunked upload sessions", icon: "upload" },
    ] satisfies NavItem[],
  },
];

function SidebarIcon({ name }: { name: NavIconName }) {
  const iconClassName = "h-4 w-4";

  switch (name) {
    case "users":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="M16 19c0-2.2-1.8-4-4-4s-4 1.8-4 4" />
          <circle cx="12" cy="9" r="3.25" />
          <path d="M21 19c0-1.8-1.1-3.3-2.8-3.8" />
          <path d="M17.5 5.3A3 3 0 0 1 18.3 11" />
        </svg>
      );
    case "user-plus":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <circle cx="9" cy="8.5" r="3" />
          <path d="M4 19c0-2.5 2-4.5 4.5-4.5h1" />
          <path d="M16.5 8v6" />
          <path d="M13.5 11h6" />
        </svg>
      );
    case "groups":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <circle cx="8" cy="9" r="2.8" />
          <circle cx="16.5" cy="8.5" r="2.3" />
          <path d="M3.5 18c0-2.4 2-4.3 4.5-4.3S12.5 15.6 12.5 18" />
          <path d="M13.2 18c0-1.9 1.6-3.4 3.6-3.4S20.4 16.1 20.4 18" />
        </svg>
      );
    case "group-plus":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <circle cx="8" cy="9" r="2.8" />
          <path d="M3.5 18c0-2.4 2-4.3 4.5-4.3S12.5 15.6 12.5 18" />
          <path d="M18 8.5v5" />
          <path d="M15.5 11h5" />
        </svg>
      );
    case "distribution":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
          <path d="m12 12 8-4.5" />
          <path d="m12 12-8-4.5" />
          <path d="M12 21v-9" />
        </svg>
      );
    case "content":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <rect x="4" y="4" width="16" height="16" rx="2.5" />
          <path d="M8 9.5h8" />
          <path d="M8 13h8" />
          <path d="M8 16.5h5" />
        </svg>
      );
    case "upload":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="M12 15V5" />
          <path d="m8.5 8.5 3.5-3.5 3.5 3.5" />
          <rect x="4" y="15" width="16" height="5" rx="1.5" />
        </svg>
      );
    default:
      return null;
  }
}

export function ManagementSidebar({
  usersCount,
  groupsCount,
}: ManagementSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-full border-b border-zinc-200 bg-zinc-50 md:h-screen md:w-80 md:shrink-0 md:border-r md:border-b-0 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex h-full flex-col gap-5 p-4 md:sticky md:top-0 md:overflow-y-auto">
        <header className="rounded-2xl border border-zinc-200 bg-gradient-to-b from-white to-zinc-100 p-4 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950">
          <div className="mb-3 flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
              <Image
                src="/pulp_logo_icon.svg"
                alt="Pulp logo"
                width={22}
                height={22}
                className="h-[22px] w-[22px]"
                priority
              />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Pulp Management
              </p>
              <h2 className="text-base font-semibold tracking-tight">Admin Console</h2>
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            Centralized control panel for identity, access, and content delivery.
          </div>
        </header>

        <nav className="space-y-4" aria-label="Main navigation">
          {navSections.map((section) => (
            <section
              key={section.title}
              className="rounded-2xl border border-zinc-200 bg-white p-2.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50"
            >
              <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                {section.title}
              </p>
              <div className="space-y-1.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition-all",
                      isActive
                        ? "border-zinc-900 bg-zinc-900 text-white shadow-sm dark:border-white dark:bg-white dark:text-black"
                        : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                          isActive
                            ? "border-white/20 bg-white/10 dark:border-black/20 dark:bg-black/10"
                            : "border-zinc-200 bg-zinc-50 text-zinc-600 group-hover:border-zinc-300 group-hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:group-hover:border-zinc-700 dark:group-hover:bg-zinc-800"
                        )}
                      >
                        <SidebarIcon name={item.icon} />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{item.label}</span>
                        <span
                          className={cn(
                            "block truncate text-xs",
                            isActive ? "text-white/80 dark:text-black/70" : "text-zinc-500 dark:text-zinc-400"
                          )}
                        >
                          {item.hint}
                        </span>
                      </span>
                    </span>
                    <span
                      className={cn(
                        "text-base leading-none",
                        isActive ? "opacity-100" : "opacity-40 group-hover:opacity-80"
                      )}
                    >
                      &#8250;
                    </span>
                  </Link>
                );
              })}
              </div>
            </section>
          ))}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Card className="rounded-xl border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Users</p>
              <p className="text-xl font-semibold leading-tight">{usersCount}</p>
            </Card>
            <Card className="rounded-xl border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Groups</p>
              <p className="text-xl font-semibold leading-tight">{groupsCount}</p>
            </Card>
          </div>

          <Card className="rounded-xl border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Environment Status
            </p>
            <div className="mt-2 flex items-center gap-2 text-sm font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Pulp services reachable
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Navigation is grouped by responsibility for faster operations.
            </p>
          </Card>
        </div>
      </div>
    </aside>
  );
}
