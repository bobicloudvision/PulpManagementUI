"use client";

import { AdminShell } from "@/components/pulp/admin-shell";
import { ChangelogMarkdown } from "@/components/pulp/changelog-markdown";
import { usePulpAuthContext } from "@/components/pulp/auth-context";
import { usePulpGroups } from "@/components/pulp/use-pulp-groups";
import { useRequireAuth } from "@/components/pulp/use-require-auth";
import { usePulpUsers } from "@/components/pulp/use-pulp-users";
import { Card, CardContent } from "@/components/ui/card";
import type { ChangelogReleaseFile } from "@/lib/get-changelog-releases";

type ChangelogPageClientProps = {
  releases: ChangelogReleaseFile[];
};

export function ChangelogPageClient({ releases }: ChangelogPageClientProps) {
  const { sessionUser, isLoading, isCheckingSession, hasSession, error, logout } =
    usePulpAuthContext();
  const isRedirectingToLogin = useRequireAuth({ hasSession, isCheckingSession });
  const { users } = usePulpUsers(hasSession);
  const { groups } = usePulpGroups(hasSession);

  return (
    <AdminShell
      title="Changelog"
      description="Release notes from markdown files in the changelog/ folder."
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
      ) : releases.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-zinc-500">
            No changelog files found. Add <code className="font-mono">changelog/x.y.z.md</code>{" "}
            (optional leading <code className="font-mono">v</code>).
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {releases.map((release) => (
            <Card key={release.filename}>
              <CardContent className="pt-6">
                <ChangelogMarkdown source={release.markdown} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
