"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { AdminShell } from "@/components/pulp/admin-shell";
import { usePulpAuthContext } from "@/components/pulp/auth-context";
import { usePulpGroups } from "@/components/pulp/use-pulp-groups";
import { usePulpTaskSchedules } from "@/components/pulp/use-pulp-task-schedules";
import { useRequireAuth } from "@/components/pulp/use-require-auth";
import { usePulpUsers } from "@/components/pulp/use-pulp-users";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableWrapper,
} from "@/components/ui/table";
import { cn } from "@/components/ui/cn";

const PAGE_SIZE = 100;

function formatIso(iso: string | null): string {
  if (!iso) {
    return "—";
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  return d.toLocaleString();
}

function idFromHref(href: string): string {
  const trimmed = href.replace(/\/+$/, "");
  const last = trimmed.split("/").pop();
  return last && last.length > 0 ? last : href;
}

function shortTaskName(name: string): string {
  const parts = name.split(".");
  return parts.length > 2 ? parts.slice(-2).join(".") : name;
}

function paginationItems(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 1) {
    return [1];
  }
  const delta = 2;
  const range: number[] = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      range.push(i);
    }
  }
  const out: (number | "ellipsis")[] = [];
  let prev: number | undefined;
  for (const i of range) {
    if (prev !== undefined && i - prev > 1) {
      out.push("ellipsis");
    }
    out.push(i);
    prev = i;
  }
  return out;
}

function TaskSchedulesListPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawPage = searchParams.get("page");
  const parsed = Number.parseInt(rawPage ?? "1", 10);
  const page = Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;

  const { sessionUser, isLoading, isCheckingSession, hasSession, error, logout } =
    usePulpAuthContext();
  const isRedirectingToLogin = useRequireAuth({ hasSession, isCheckingSession });
  const { users } = usePulpUsers(hasSession);
  const { groups } = usePulpGroups(hasSession);
  const { data, loading, totalPages } = usePulpTaskSchedules(hasSession, page, PAGE_SIZE);

  useEffect(() => {
    if (!data || totalPages < 1 || page <= totalPages) {
      return;
    }
    const next = new URLSearchParams(searchParams.toString());
    next.set("page", String(totalPages));
    router.replace(`/task-schedules/list?${next.toString()}`);
  }, [data, page, router, searchParams, totalPages]);

  const rows = data?.results ?? [];
  const count = data?.count ?? 0;
  const pages = paginationItems(page, totalPages);

  return (
    <AdminShell
      title="Task schedules"
      description="Pulp periodic task schedules and dispatch windows."
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
          <CardTitle>
            Schedules
            {count > 0 ? (
              <span className="ml-2 font-normal text-zinc-500 dark:text-zinc-400">
                ({count.toLocaleString()} total)
              </span>
            ) : null}
          </CardTitle>
          <CardContent className="space-y-4">
            {totalPages > 1 ? (
              <nav
                className="flex flex-wrap items-center gap-1 text-sm"
                aria-label="Task schedules pagination"
              >
                <PaginationLink
                  href={page > 1 ? `/task-schedules/list?page=${page - 1}` : null}
                  label="«"
                  disabled={page <= 1 || loading}
                />
                {pages.map((item, idx) =>
                  item === "ellipsis" ? (
                    <span
                      key={`e-${idx}`}
                      className="px-2 text-zinc-400 dark:text-zinc-500"
                      aria-hidden
                    >
                      …
                    </span>
                  ) : (
                    <PaginationLink
                      key={item}
                      href={`/task-schedules/list?page=${item}`}
                      label={String(item)}
                      active={item === page}
                      disabled={loading}
                    />
                  )
                )}
                <PaginationLink
                  href={page < totalPages ? `/task-schedules/list?page=${page + 1}` : null}
                  label="»"
                  disabled={page >= totalPages || loading}
                />
              </nav>
            ) : null}

            <TableWrapper>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Name</TableHeaderCell>
                    <TableHeaderCell>Task</TableHeaderCell>
                    <TableHeaderCell>Interval</TableHeaderCell>
                    <TableHeaderCell>Next dispatch</TableHeaderCell>
                    <TableHeaderCell>Created</TableHeaderCell>
                    <TableHeaderCell>Last task</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading && rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-zinc-500">
                        Loading schedules…
                      </TableCell>
                    </TableRow>
                  ) : !loading && rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-zinc-500">
                        No task schedules on this page.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((s) => (
                      <TableRow key={s.pulp_href}>
                        <TableCell className="max-w-[14rem] font-medium">{s.name}</TableCell>
                        <TableCell className="max-w-[16rem] truncate font-mono text-xs" title={s.task_name}>
                          {shortTaskName(s.task_name)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-mono text-xs text-zinc-600 dark:text-zinc-400">
                          {s.dispatch_interval}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {formatIso(s.next_dispatch)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {formatIso(s.pulp_created)}
                        </TableCell>
                        <TableCell className="max-w-[10rem] truncate font-mono text-xs">
                          {s.last_task ? idFromHref(s.last_task) : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableWrapper>
          </CardContent>
        </Card>
      )}
    </AdminShell>
  );
}

function TaskSchedulesListSuspenseFallback() {
  const { sessionUser, isLoading, hasSession, error, logout } = usePulpAuthContext();
  const { users } = usePulpUsers(hasSession);
  const { groups } = usePulpGroups(hasSession);

  return (
    <AdminShell
      title="Task schedules"
      description="Pulp periodic task schedules and dispatch windows."
      hasSession={hasSession}
      sessionUser={sessionUser}
      isLoading={isLoading}
      usersCount={users.length}
      groupsCount={groups.length}
      error={error}
      onLogout={logout}
    >
      <Card>Loading task schedules…</Card>
    </AdminShell>
  );
}

export default function TaskSchedulesListPage() {
  return (
    <Suspense fallback={<TaskSchedulesListSuspenseFallback />}>
      <TaskSchedulesListPageContent />
    </Suspense>
  );
}

const paginationBtnBase =
  "inline-flex min-w-[2.25rem] items-center justify-center rounded-md px-2 py-1.5 text-sm transition-opacity";

function PaginationLink({
  href,
  label,
  disabled,
  active,
}: {
  href: string | null;
  label: string;
  disabled?: boolean;
  active?: boolean;
}) {
  if (!href || disabled) {
    return (
      <span
        className={cn(
          paginationBtnBase,
          "cursor-not-allowed border border-zinc-300 opacity-40 dark:border-zinc-700"
        )}
        aria-disabled
      >
        {label}
      </span>
    );
  }

  return (
    <Link
      href={href}
      scroll={false}
      className={cn(
        paginationBtnBase,
        active
          ? "bg-black text-white dark:bg-white dark:text-black"
          : "border border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900/80",
        active && "pointer-events-none"
      )}
      aria-current={active ? "page" : undefined}
    >
      {label}
    </Link>
  );
}
