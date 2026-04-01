"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { usePulpAuthContext } from "@/components/pulp/auth-context";
import { usePulpGroups } from "@/components/pulp/use-pulp-groups";
import { usePulpUsers } from "@/components/pulp/use-pulp-users";
import { AdminShell } from "@/components/pulp/admin-shell";
import { LoginCard } from "@/components/pulp/login-card";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { pulpContentService } from "@/services/pulp/content-service";
import { PulpRpmPackage } from "@/services/pulp/types";

function valueOf(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

export default function PackageDetailsPage() {
  const params = useParams<{ id: string }>();
  const packageId = useMemo(() => params?.id ?? "", [params]);
  const { sessionUser, isLoading, isCheckingSession, hasSession, error, setError, login, logout } =
    usePulpAuthContext();
  const { users } = usePulpUsers(hasSession);
  const { groups } = usePulpGroups(hasSession);
  const [pkg, setPkg] = useState<PulpRpmPackage | null>(null);

  useEffect(() => {
    let active = true;

    async function loadPackage() {
      if (!hasSession || !packageId) {
        setPkg(null);
        return;
      }

      try {
        const nextPackage = await pulpContentService.getRpmPackage(packageId);
        if (active) {
          setPkg(nextPackage);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load package.");
        }
      }
    }

    void loadPackage();

    return () => {
      active = false;
    };
  }, [hasSession, packageId, setError]);

  return (
    <AdminShell
      title="Package Instance"
      description="View details for an RPM package content instance."
      hasSession={hasSession}
      sessionUser={sessionUser}
      isLoading={isLoading}
      usersCount={users.length}
      groupsCount={groups.length}
      error={error}
      onLogout={logout}
    >
      {isCheckingSession ? (
        <Card>Checking existing session...</Card>
      ) : !hasSession ? (
        <LoginCard isLoading={isLoading} onLogin={login} />
      ) : !pkg ? (
        <Card>Loading package details...</Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardTitle className="mb-2">Overview</CardTitle>
            <CardContent className="space-y-2 text-sm">
              <div>
                <strong>Name:</strong> {valueOf(pkg.name)}
              </div>
              <div>
                <strong>Version:</strong> {valueOf(pkg.version)}-{valueOf(pkg.release)}
              </div>
              <div>
                <strong>Arch:</strong> {valueOf(pkg.arch)}
              </div>
              <div>
                <strong>Summary:</strong> {valueOf(pkg.summary)}
              </div>
              <div>
                <strong>Created:</strong> {valueOf(pkg.pulp_created)}
              </div>
              <div>
                <strong>Pulp Href:</strong> {valueOf(pkg.pulp_href)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardTitle className="mb-2">Raw JSON</CardTitle>
            <CardContent>
              <pre className="max-h-[480px] overflow-auto rounded-md bg-zinc-950 p-3 text-xs text-zinc-100">
                {JSON.stringify(pkg, null, 2)}
              </pre>
            </CardContent>
          </Card>

          <div>
            <Link
              href="/content/list"
              className="inline-flex rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              Back to Content List
            </Link>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
