"use client";

import { AdminShell } from "@/components/pulp/admin-shell";
import { usePulpAuthContext } from "@/components/pulp/auth-context";
import { usePulpGroups } from "@/components/pulp/use-pulp-groups";
import { useRequireAuth } from "@/components/pulp/use-require-auth";
import { usePulpUploads } from "@/components/pulp/use-pulp-uploads";
import { usePulpUsers } from "@/components/pulp/use-pulp-users";
import { Button } from "@/components/ui/button";
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

function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "-";
  if (value === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exp = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const formatted = value / 1024 ** exp;
  return `${formatted.toFixed(exp === 0 ? 0 : 2)} ${units[exp]}`;
}

export default function UploadsListPage() {
  const { sessionUser, isLoading, isCheckingSession, hasSession, error, logout } =
    usePulpAuthContext();
  const isRedirectingToLogin = useRequireAuth({ hasSession, isCheckingSession });
  const { users } = usePulpUsers(hasSession);
  const { groups } = usePulpGroups(hasSession);
  const { uploads, count, page, totalPages, canGoNext, canGoPrevious, goNext, goPrevious } =
    usePulpUploads(hasSession, 50);

  return (
    <AdminShell
      title="Upload List"
      description="View chunked uploads from your connected Pulp server."
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
            Uploads ({count}) - Page {page} / {totalPages}
          </CardTitle>
          <CardContent className="space-y-4">
            <TableWrapper>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Pulp Href</TableHeaderCell>
                    <TableHeaderCell>Created</TableHeaderCell>
                    <TableHeaderCell className="text-right">Size</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {uploads.map((upload) => (
                    <TableRow key={upload.pulp_href}>
                      <TableCell className="font-mono text-xs">{upload.pulp_href}</TableCell>
                      <TableCell>{upload.pulp_created}</TableCell>
                      <TableCell className="text-right">{formatBytes(upload.size)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableWrapper>

            <div className="flex items-center justify-between">
              <Button type="button" variant="outline" onClick={goPrevious} disabled={!canGoPrevious}>
                Previous
              </Button>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Page {page} of {totalPages}
              </span>
              <Button type="button" variant="outline" onClick={goNext} disabled={!canGoNext}>
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </AdminShell>
  );
}
