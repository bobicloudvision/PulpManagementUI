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
import { cn } from "@/components/ui/cn";
import { pulpDistributionService } from "@/services/pulp/distribution-service";
import { pulpRepositoryManagementService } from "@/services/pulp/repository-management-service";
import { PulpDistribution, PulpRpmRepository } from "@/services/pulp/types";

function distributionUrlByRepositoryHref(distributions: PulpDistribution[]): Record<string, string> {
  const sorted = [...distributions].sort((a, b) => a.name.localeCompare(b.name));
  const map: Record<string, string> = {};
  for (const d of sorted) {
    if (d.repository && d.base_url && map[d.repository] === undefined) {
      map[d.repository] = d.base_url;
    }
  }
  return map;
}
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableWrapper,
} from "@/components/ui/table";

type RepoKind = "rpm" | "deb";

export default function RepositoriesListPage() {
  const { sessionUser, isLoading, isCheckingSession, hasSession, error, setError, logout } =
    usePulpAuthContext();
  const isRedirectingToLogin = useRequireAuth({ hasSession, isCheckingSession });
  const { users } = usePulpUsers(hasSession);
  const { groups } = usePulpGroups(hasSession);

  const [kind, setKind] = useState<RepoKind>("rpm");
  const [items, setItems] = useState<PulpRpmRepository[]>([]);
  const [count, setCount] = useState(0);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [distributionUrlByRepo, setDistributionUrlByRepo] = useState<Record<string, string>>({});
  const [busyHref, setBusyHref] = useState<string | null>(null);
  const [publishResult, setPublishResult] = useState<{
    repoName: string;
    publication: string | null;
    task: string | null;
  } | null>(null);
  const [distributeResult, setDistributeResult] = useState<{
    repoName: string;
    name: string;
    pulp_href: string | null;
    base_url: string | null;
    base_path: string;
    task: string | null;
  } | null>(null);

  const load = useCallback(async () => {
    if (!hasSession) return;
    setIsLoadingRepos(true);
    setError(null);
    try {
      const page =
        kind === "rpm"
          ? await pulpRepositoryManagementService.listRpm()
          : await pulpRepositoryManagementService.listDeb();
      setItems(page.results);
      setCount(page.count);
      try {
        const distributions = await pulpDistributionService.list();
        setDistributionUrlByRepo(distributionUrlByRepositoryHref(distributions));
      } catch {
        setDistributionUrlByRepo({});
      }
    } catch (e) {
      setItems([]);
      setCount(0);
      setDistributionUrlByRepo({});
      setError(e instanceof Error ? e.message : "Failed to load repositories.");
    } finally {
      setIsLoadingRepos(false);
    }
  }, [hasSession, kind, setError]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handlePublish(repo: PulpRpmRepository) {
    setBusyHref(repo.pulp_href);
    setError(null);
    setPublishResult(null);
    setDistributeResult(null);
    try {
      const result =
        kind === "rpm"
          ? await pulpRepositoryManagementService.publishRpm(repo.pulp_href)
          : await pulpRepositoryManagementService.publishDeb(repo.pulp_href);
      setPublishResult({
        repoName: repo.name,
        publication: result.publication,
        task: result.task,
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Publish failed.");
    } finally {
      setBusyHref(null);
    }
  }

  async function handleDistribute(repo: PulpRpmRepository) {
    setBusyHref(repo.pulp_href);
    setError(null);
    setDistributeResult(null);
    try {
      const result = await pulpDistributionService.createRpmDistributionForRepository(
        repo.pulp_href,
        repo.name
      );
      setDistributeResult({
        repoName: repo.name,
        name: result.name,
        pulp_href: result.pulp_href,
        base_url: result.base_url,
        base_path: result.base_path,
        task: result.task,
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create distribution.");
    } finally {
      setBusyHref(null);
    }
  }

  async function handleDelete(repo: PulpRpmRepository) {
    if (!window.confirm(`Delete repository "${repo.name}"?`)) return;
    setBusyHref(repo.pulp_href);
    setError(null);
    try {
      if (kind === "rpm") {
        await pulpRepositoryManagementService.deleteRpm(repo.pulp_href);
      } else {
        await pulpRepositoryManagementService.deleteDeb(repo.pulp_href);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setBusyHref(null);
    }
  }

  return (
    <AdminShell
      title="Repositories"
      description="List RPM and Debian repositories, publish, create RPM distributions, inspect content, or remove a repository."
      hasSession={hasSession}
      sessionUser={sessionUser}
      isLoading={isLoading || isLoadingRepos}
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
            Repositories ({count}) — {kind.toUpperCase()}
          </CardTitle>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(["rpm", "deb"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    setPublishResult(null);
                    setDistributeResult(null);
                    setKind(k);
                  }}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-sm",
                    kind === k
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-black"
                      : "border-zinc-300 dark:border-zinc-700"
                  )}
                >
                  {k.toUpperCase()}
                </button>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPublishResult(null);
                  setDistributeResult(null);
                  void load();
                }}
                disabled={isLoadingRepos}
              >
                Refresh
              </Button>
              <Link
                href="/repositories/create"
                className="inline-flex items-center rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
              >
                Create repository
              </Link>
            </div>

            {publishResult ? (
              <div className="rounded-lg border border-emerald-300/80 bg-emerald-50/90 p-4 text-sm dark:border-emerald-800 dark:bg-emerald-950/35">
                <p className="font-medium text-emerald-900 dark:text-emerald-100">
                  Published “{publishResult.repoName}” ({kind.toUpperCase()})
                </p>
                {publishResult.publication ? (
                  <p className="mt-2 break-all font-mono text-xs text-emerald-800 dark:text-emerald-200/90">
                    <span className="font-sans font-medium text-emerald-900 dark:text-emerald-100">
                      Publication:{" "}
                    </span>
                    {publishResult.publication}
                  </p>
                ) : (
                  <p className="mt-2 text-emerald-800/90 dark:text-emerald-200/80">
                    Publication href was not returned by Pulp (task may still have succeeded).
                  </p>
                )}
                {publishResult.task ? (
                  <p className="mt-1 break-all font-mono text-xs text-emerald-800/80 dark:text-emerald-300/70">
                    Task: {publishResult.task}
                  </p>
                ) : null}
              </div>
            ) : null}

            {distributeResult ? (
              <div className="rounded-lg border border-sky-300/80 bg-sky-50/90 p-4 text-sm dark:border-sky-800 dark:bg-sky-950/35">
                <p className="font-medium text-sky-900 dark:text-sky-100">
                  RPM distribution created for “{distributeResult.repoName}”
                </p>
                <p className="mt-1 text-sky-800 dark:text-sky-200/90">
                  <span className="font-medium">Distribution name:</span> {distributeResult.name}
                </p>
                <p className="mt-1 text-sky-800 dark:text-sky-200/90">
                  <span className="font-medium">base_path:</span>{" "}
                  <span className="font-mono text-xs">{distributeResult.base_path}</span>
                </p>
                {distributeResult.base_url ? (
                  <p className="mt-2">
                    <a
                      href={distributeResult.base_url}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all font-mono text-xs text-sky-800 underline decoration-sky-400 underline-offset-2 hover:text-sky-950 dark:text-sky-200 dark:hover:text-sky-50"
                    >
                      {distributeResult.base_url}
                    </a>
                  </p>
                ) : null}
                {distributeResult.pulp_href ? (
                  <p className="mt-1 break-all font-mono text-xs text-sky-800/90 dark:text-sky-300/80">
                    {distributeResult.pulp_href}
                  </p>
                ) : null}
                {distributeResult.task ? (
                  <p className="mt-1 break-all font-mono text-xs text-sky-800/80 dark:text-sky-300/70">
                    Task: {distributeResult.task}
                  </p>
                ) : null}
                <Link
                  href="/distributions/list"
                  className="mt-3 inline-flex rounded-md border border-sky-400/60 bg-white/80 px-3 py-1.5 text-xs font-medium text-sky-900 hover:bg-sky-100/80 dark:border-sky-700 dark:bg-sky-950/50 dark:text-sky-100 dark:hover:bg-sky-900/60"
                >
                  Open distributions
                </Link>
              </div>
            ) : null}

            <TableWrapper>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Name</TableHeaderCell>
                    <TableHeaderCell>Distribution URL</TableHeaderCell>
                    <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                  </TableRow>  
                </TableHead> 
                <TableBody>
                  {items.map((repo) => {
                    const distributionUrl = distributionUrlByRepo[repo.pulp_href];
                    return (
                    <TableRow key={repo.pulp_href} frozen={busyHref === repo.pulp_href}>
                      <TableCell className="font-medium">{repo.name}</TableCell>
                      <TableCell className="max-w-md">
                        {distributionUrl ? (
                          <a
                            href={distributionUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="break-all font-mono text-xs text-sky-800 underline decoration-sky-400/80 underline-offset-2 hover:text-sky-950 dark:text-sky-300 dark:hover:text-sky-100"
                          >
                            {distributionUrl}
                          </a>
                        ) : (
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Link
                            href={`/repositories/edit?kind=${kind}&pulp_href=${encodeURIComponent(repo.pulp_href)}`}
                            className="inline-flex rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
                          >
                            Edit
                          </Link>
                          {kind === "rpm" ? (
                            <Link
                              href={`/repositories/versions?pulp_href=${encodeURIComponent(repo.pulp_href)}`}
                              className="inline-flex rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
                            >
                              Versions
                            </Link>
                          ) : null}
                          <Link
                            href={`/repositories/content?pulp_href=${encodeURIComponent(repo.pulp_href)}`}
                            className="inline-flex rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
                          >
                            Content
                          </Link>
                          <Button
                            type="button"
                            variant="outline"
                            className="text-xs"
                            disabled={busyHref === repo.pulp_href}
                            onClick={() => handlePublish(repo)}
                          >
                            Publish
                          </Button>
                          {kind === "rpm" ? (
                            <Button
                              type="button"
                              variant="outline"
                              className="text-xs"
                              disabled={busyHref === repo.pulp_href}
                              onClick={() => handleDistribute(repo)}
                            >
                              Distribute
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            variant="outline"
                            className="border-red-300 text-xs text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40"
                            disabled={busyHref === repo.pulp_href}
                            onClick={() => handleDelete(repo)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableWrapper>
          </CardContent>
        </Card>
      )}
    </AdminShell>
  );
}
