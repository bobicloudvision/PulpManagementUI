"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { AdminShell } from "@/components/pulp/admin-shell";
import { usePulpAuthContext } from "@/components/pulp/auth-context";
import { usePulpGroups } from "@/components/pulp/use-pulp-groups";
import { usePulpTasks } from "@/components/pulp/use-pulp-tasks";
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

function taskIdFromHref(href: string): string {
  const trimmed = href.replace(/\/+$/, "");
  const last = trimmed.split("/").pop();
  return last && last.length > 0 ? last : href;
}

function workerIdFromHref(href: string | null): string {
  if (!href) {
    return "—";
  }
  return taskIdFromHref(href);
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

function TasksListPageContent() {
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
  const { data, loading, totalPages } = usePulpTasks(hasSession, page, PAGE_SIZE);

  useEffect(() => {
    if (!data || totalPages < 1 || page <= totalPages) {
      return;
    }
    const next = new URLSearchParams(searchParams.toString());
    next.set("page", String(totalPages));
    router.replace(`/tasks/list?${next.toString()}`);
  }, [data, page, router, searchParams, totalPages]);

  const tasks = data?.results ?? [];
  const count = data?.count ?? 0;
  const pages = paginationItems(page, totalPages);

  return (
    <AdminShell
      title="Task list"
      description="Pulp asynchronous tasks and status."
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
            Tasks
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
                aria-label="Task list pagination"
              >
                <PaginationLink
                  href={page > 1 ? `/tasks/list?page=${page - 1}` : null}
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
                      href={`/tasks/list?page=${item}`}
                      label={String(item)}
                      active={item === page}
                      disabled={loading}
                    />
                  )
                )}
                <PaginationLink
                  href={page < totalPages ? `/tasks/list?page=${page + 1}` : null}
                  label="»"
                  disabled={page >= totalPages || loading}
                />
              </nav>
            ) : null}

            <TableWrapper>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>State</TableHeaderCell>
                    <TableHeaderCell>Task</TableHeaderCell>
                    <TableHeaderCell>Name</TableHeaderCell>
                    <TableHeaderCell>Created</TableHeaderCell>
                    <TableHeaderCell>Started</TableHeaderCell>
                    <TableHeaderCell>Finished</TableHeaderCell>
                    <TableHeaderCell>Worker</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading && tasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-zinc-500">
                        Loading tasks…
                      </TableCell>
                    </TableRow>
                  ) : !loading && tasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-zinc-500">
                        No tasks on this page.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tasks.map((t) => (
                      <TableRow key={t.pulp_href}>
                        <TableCell>
                          <span
                            className={cn(
                              "rounded-md px-2 py-0.5 text-xs font-medium",
                              t.state === "completed" &&
                                "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
                              t.state === "failed" &&
                                "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
                              t.state === "running" &&
                                "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
                              t.state === "waiting" &&
                                "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
                              !["completed", "failed", "running", "waiting"].includes(t.state) &&
                                "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                            )}
                          >
                            {t.state}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                          {taskIdFromHref(t.pulp_href)}
                        </TableCell>
                        <TableCell className="max-w-[18rem] truncate font-mono text-xs" title={t.name}>
                          {shortTaskName(t.name)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {formatIso(t.pulp_created)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {formatIso(t.started_at)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {formatIso(t.finished_at)}
                        </TableCell>
                        <TableCell className="max-w-[10rem] truncate font-mono text-xs">
                          {workerIdFromHref(t.worker)}
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

function TasksListSuspenseFallback() {
  const { sessionUser, isLoading, hasSession, error, logout } = usePulpAuthContext();
  const { users } = usePulpUsers(hasSession);
  const { groups } = usePulpGroups(hasSession);

  return (
    <AdminShell
      title="Task list"
      description="Pulp asynchronous tasks and status."
      hasSession={hasSession}
      sessionUser={sessionUser}
      isLoading={isLoading}
      usersCount={users.length}
      groupsCount={groups.length}
      error={error}
      onLogout={logout}
    >
      <Card>Loading task list…</Card>
    </AdminShell>
  );
}

export default function TasksListPage() {
  return (
    <Suspense fallback={<TasksListSuspenseFallback />}>
      <TasksListPageContent />
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
