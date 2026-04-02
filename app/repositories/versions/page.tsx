"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AdminShell } from "@/components/pulp/admin-shell";
import { usePulpAuthContext } from "@/components/pulp/auth-context";
import { usePulpGroups } from "@/components/pulp/use-pulp-groups";
import { useRequireAuth } from "@/components/pulp/use-require-auth";
import { usePulpUsers } from "@/components/pulp/use-pulp-users";
import { RpmRepositoryVersionSummary } from "@/components/pulp/rpm-repository-version-summary";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { pulpRepositoryManagementService } from "@/services/pulp/repository-management-service";
import type { PulpRpmRepositoryVersion } from "@/services/pulp/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableWrapper,
} from "@/components/ui/table";

function RepositoryVersionsInner() {
  const searchParams = useSearchParams();
  const pulpHref = searchParams.get("pulp_href")?.trim() ?? "";

  const { sessionUser, isLoading, isCheckingSession, hasSession, error, setError, logout } =
    usePulpAuthContext();
  const isRedirectingToLogin = useRequireAuth({ hasSession, isCheckingSession });
  const { users } = usePulpUsers(hasSession);
  const { groups } = usePulpGroups(hasSession);

  const [count, setCount] = useState(0);
  const [versions, setVersions] = useState<PulpRpmRepositoryVersion[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);

  useEffect(() => {
    if (!hasSession || !pulpHref) {
      setVersions([]);
      setCount(0);
      return;
    }

    let active = true;

    async function load() {
      setIsLoadingVersions(true);
      setError(null);
      try {
        const data = await pulpRepositoryManagementService.listRpmRepositoryVersions(pulpHref);
        if (!active) return;
        setCount(data.count);
        setVersions(data.results);
      } catch (e) {
        if (active) {
          setVersions([]);
          setCount(0);
          setError(e instanceof Error ? e.message : "Failed to load repository versions.");
        }
      } finally {
        if (active) setIsLoadingVersions(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [hasSession, pulpHref, setError]);

  return (
    <AdminShell
      title="RPM repository versions"
      description="Repository versions from Pulp (content_summary added / removed / present per type)."
      hasSession={hasSession}
      sessionUser={sessionUser}
      isLoading={isLoading || isLoadingVersions}
      usersCount={users.length}
      groupsCount={groups.length}
      error={error}
      onLogout={logout}
    >
      {isCheckingSession || isRedirectingToLogin ? (
        <Card>Checking existing session...</Card>
      ) : !pulpHref ? (
        <Card>Missing pulp_href query parameter.</Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardTitle>Repository</CardTitle>
            <CardContent className="break-all font-mono text-xs">{pulpHref}</CardContent>
          </Card>
          <Card>
            <CardTitle>Versions ({count})</CardTitle>
            <CardContent>
              <TableWrapper>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell className="whitespace-nowrap">#</TableHeaderCell>
                      <TableHeaderCell className="whitespace-nowrap">Created</TableHeaderCell>
                      <TableHeaderCell>Version href</TableHeaderCell>
                      <TableHeaderCell>Content summary</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {versions.map((v) => (
                      <TableRow key={v.pulp_href}>
                        <TableCell className="align-top font-medium tabular-nums">
                          <Link
                            href={`/repositories/version?pulp_href=${encodeURIComponent(v.pulp_href)}`}
                            className="text-zinc-900 underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-600 dark:text-zinc-100 dark:decoration-zinc-600 dark:hover:decoration-zinc-400"
                          >
                            {v.number}
                          </Link>
                        </TableCell>
                        <TableCell className="align-top whitespace-nowrap text-xs text-zinc-600 dark:text-zinc-400">
                          {v.pulp_created || "—"}
                        </TableCell>
                        <TableCell className="align-top break-all font-mono text-xs">
                          <Link
                            href={`/repositories/version?pulp_href=${encodeURIComponent(v.pulp_href)}`}
                            className="text-zinc-800 underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-600 dark:text-zinc-200"
                          >
                            {v.pulp_href}
                          </Link>
                        </TableCell>
                        <TableCell className="align-top">
                          <RpmRepositoryVersionSummary version={v} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableWrapper>
            </CardContent>
          </Card>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/repositories/list"
              className="inline-flex rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              Back to repositories
            </Link>
            <Link
              href={`/repositories/edit?kind=rpm&pulp_href=${encodeURIComponent(pulpHref)}`}
              className="inline-flex rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              Edit repository
            </Link>
            <Link
              href={`/repositories/content?pulp_href=${encodeURIComponent(pulpHref)}`}
              className="inline-flex rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              Content
            </Link>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

export default function RepositoryVersionsPage() {
  return (
    <Suspense fallback={<Card className="p-6">Loading…</Card>}>
      <RepositoryVersionsInner />
    </Suspense>
  );
}
