"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { AdminShell } from "@/components/pulp/admin-shell";
import { usePulpAuthContext } from "@/components/pulp/auth-context";
import { usePulpGroups } from "@/components/pulp/use-pulp-groups";
import { useRequireAuth } from "@/components/pulp/use-require-auth";
import { usePulpUsers } from "@/components/pulp/use-pulp-users";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import {
  pulpRepositoryManagementService,
  type RepositoryCreateResult,
} from "@/services/pulp/repository-management-service";

type RepoKind = "rpm" | "deb";

export default function RepositoriesCreatePage() {
  const { sessionUser, isLoading, isCheckingSession, hasSession, error, setError, logout } =
    usePulpAuthContext();
  const isRedirectingToLogin = useRequireAuth({ hasSession, isCheckingSession });
  const { users } = usePulpUsers(hasSession);
  const { groups } = usePulpGroups(hasSession);

  const [kind, setKind] = useState<RepoKind>("rpm");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [created, setCreated] = useState<RepositoryCreateResult | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Repository name is required.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    setCreated(null);
    try {
      const result =
        kind === "rpm"
          ? await pulpRepositoryManagementService.createRpm(trimmed)
          : await pulpRepositoryManagementService.createDeb(trimmed);
      setCreated(result);
      setName("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AdminShell
      title="Create repository"
      description="Create a new RPM or Debian APT repository in Pulp."
      hasSession={hasSession}
      sessionUser={sessionUser}
      isLoading={isLoading || isSubmitting}
      usersCount={users.length}
      groupsCount={groups.length}
      error={error}
      onLogout={logout}
    >
      {isCheckingSession || isRedirectingToLogin ? (
        <Card>Checking existing session...</Card>
      ) : (
        <div className="space-y-4">
          <Card className="border-amber-200/80 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/25">
            <CardTitle>How to name the repository</CardTitle>
            <CardContent className="space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
              <p>
                Use a path-style name: product or stream, distro family, major version, then
                architecture (matches how you organize RHEL-style trees).
              </p>
              <div>
                <p className="mb-1.5 font-medium text-zinc-900 dark:text-zinc-100">Examples</p>
                <ul className="space-y-1 rounded-md border border-amber-200/60 bg-white/80 px-3 py-2 font-mono text-xs text-zinc-800 dark:border-amber-900/50 dark:bg-zinc-950/40 dark:text-zinc-200 sm:text-sm">
                  <li>adminbolt-devel/rhel/10/noarch</li>
                  <li>adminbolt-devel/rhel/10/x86_64</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardTitle>New repository</CardTitle>
            <CardContent>
              <form className="flex max-w-lg flex-col gap-4" onSubmit={handleSubmit}>
                <div className="flex flex-wrap gap-2">
                  {(["rpm", "deb"] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setKind(k)}
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
                </div>
                <FormField label="Name">
                  <Input value={name} onChange={(e) => setName(e.target.value)} required />
                </FormField>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating…" : "Create"}
                  </Button>
                  <Link
                    href="/repositories/list"
                    className="inline-flex items-center rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
                  >
                    Back to list
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>

          {created ? (
            <Card>
              <CardTitle>Created</CardTitle>
              <CardContent className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">Name:</span> {created.name}
                </p>
                <p className="break-all">
                  <span className="font-medium">Href:</span> {created.pulp_href ?? "-"}
                </p>
                <p className="break-all">
                  <span className="font-medium">Task:</span> {created.task ?? "-"}
                </p>
                {created.pulp_href ? (
                  <Link
                    href={`/repositories/content?pulp_href=${encodeURIComponent(created.pulp_href)}`}
                    className="mt-2 inline-flex rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
                  >
                    View content
                  </Link>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}
    </AdminShell>
  );
}
