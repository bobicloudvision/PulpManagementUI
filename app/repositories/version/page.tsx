"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminShell } from "@/components/pulp/admin-shell";
import { usePulpAuthContext } from "@/components/pulp/auth-context";
import { RpmRepositoryVersionSummary } from "@/components/pulp/rpm-repository-version-summary";
import { usePulpGroups } from "@/components/pulp/use-pulp-groups";
import { useRequireAuth } from "@/components/pulp/use-require-auth";
import { usePulpUsers } from "@/components/pulp/use-pulp-users";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { pulpRepositoryManagementService } from "@/services/pulp/repository-management-service";
import type { PulpRpmRepositoryVersion } from "@/services/pulp/types";

function RepositoryVersionInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pulpHref = searchParams.get("pulp_href")?.trim() ?? "";

  const { sessionUser, isLoading, isCheckingSession, hasSession, error, setError, logout } =
    usePulpAuthContext();
  const isRedirectingToLogin = useRequireAuth({ hasSession, isCheckingSession });
  const { users } = usePulpUsers(hasSession);
  const { groups } = usePulpGroups(hasSession);

  const [version, setVersion] = useState<PulpRpmRepositoryVersion | null>(null);
  const [isLoadingVersion, setIsLoadingVersion] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!hasSession || !pulpHref) {
      setVersion(null);
      return;
    }

    let active = true;

    async function load() {
      setIsLoadingVersion(true);
      setError(null);
      try {
        const data = await pulpRepositoryManagementService.getRpmRepositoryVersion(pulpHref);
        if (!active) return;
        setVersion(data);
      } catch (e) {
        if (active) {
          setVersion(null);
          setError(e instanceof Error ? e.message : "Failed to load repository version.");
        }
      } finally {
        if (active) setIsLoadingVersion(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [hasSession, pulpHref, setError]);

  async function handleDelete() {
    if (!version || !pulpHref) return;
    if (
      !window.confirm(
        `Delete repository version ${version.number}? This cannot be undone. Pulp may reject removal of the latest version.`
      )
    ) {
      return;
    }
    setError(null);
    setIsDeleting(true);
    try {
      await pulpRepositoryManagementService.deleteRpmRepositoryVersion(pulpHref);
      const repoHref = version.repository;
      if (repoHref) {
        router.push(`/repositories/versions?pulp_href=${encodeURIComponent(repoHref)}`);
      } else {
        router.push("/repositories/list");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setIsDeleting(false);
    }
  }

  const repoHref = version?.repository ?? "";

  return (
    <AdminShell
      title="RPM repository version"
      description="Single version instance from Pulp (GET/DELETE …/versions/{n}/)."
      hasSession={hasSession}
      sessionUser={sessionUser}
      isLoading={isLoading || isLoadingVersion || isDeleting}
      usersCount={users.length}
      groupsCount={groups.length}
      error={error}
      onLogout={logout}
    >
      {isCheckingSession || isRedirectingToLogin ? (
        <Card>Checking existing session...</Card>
      ) : !pulpHref ? (
        <Card>Missing pulp_href query parameter (use a version href ending in /versions/…/).</Card>
      ) : !version && !isLoadingVersion ? (
        <Card>Version not found or could not be loaded.</Card>
      ) : version ? (
        <div className="space-y-4">
          <Card>
            <CardTitle>Version {version.number}</CardTitle>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Created</p>
                <p>{version.pulp_created || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">pulp_href</p>
                <p className="break-all font-mono text-xs">{version.pulp_href}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Repository</p>
                <p className="break-all font-mono text-xs">{version.repository || "—"}</p>
              </div>
              {version.base_version ? (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Base version
                  </p>
                  <p className="break-all font-mono text-xs">{version.base_version}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardTitle>Content summary</CardTitle>
            <CardContent>
              <RpmRepositoryVersionSummary version={version} />
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2">
            {repoHref ? (
              <Link
                href={`/repositories/versions?pulp_href=${encodeURIComponent(repoHref)}`}
                className="inline-flex rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
              >
                All versions
              </Link>
            ) : null}
            {repoHref ? (
              <Link
                href={`/repositories/edit?kind=rpm&pulp_href=${encodeURIComponent(repoHref)}`}
                className="inline-flex rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
              >
                Edit repository
              </Link>
            ) : null}
            <Link
              href="/repositories/list"
              className="inline-flex rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              Repository list
            </Link>
            <Button
              type="button"
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40"
              disabled={isDeleting}
              onClick={() => void handleDelete()}
            >
              {isDeleting ? "Deleting…" : "Delete version"}
            </Button>
          </div>
        </div>
      ) : (
        <Card>Loading…</Card>
      )}
    </AdminShell>
  );
}

export default function RepositoryVersionPage() {
  return (
    <Suspense fallback={<Card className="p-6">Loading…</Card>}>
      <RepositoryVersionInner />
    </Suspense>
  );
}
