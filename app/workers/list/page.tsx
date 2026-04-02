"use client";

import { AdminShell } from "@/components/pulp/admin-shell";
import { usePulpAuthContext } from "@/components/pulp/auth-context";
import { usePulpGroups } from "@/components/pulp/use-pulp-groups";
import { useRequireAuth } from "@/components/pulp/use-require-auth";
import { usePulpUsers } from "@/components/pulp/use-pulp-users";
import { usePulpWorkers } from "@/components/pulp/use-pulp-workers";
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

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, "").trim();
}

function formatIso(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  return d.toLocaleString();
}

export default function WorkersListPage() {
  const { sessionUser, isLoading, isCheckingSession, hasSession, error, logout } =
    usePulpAuthContext();
  const isRedirectingToLogin = useRequireAuth({ hasSession, isCheckingSession });
  const { workers } = usePulpWorkers(hasSession);
  const { users } = usePulpUsers(hasSession);
  const { groups } = usePulpGroups(hasSession);

  return (
    <AdminShell
      title="Worker List"
      description="Pulp task workers and heartbeat status."
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
          <CardTitle>Workers ({workers.length})</CardTitle>
          <CardContent>
            <TableWrapper>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Name</TableHeaderCell>
                    <TableHeaderCell>Created</TableHeaderCell>
                    <TableHeaderCell>Last heartbeat</TableHeaderCell>
                    <TableHeaderCell>Current task</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {workers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-zinc-500">
                        No workers returned.
                      </TableCell>
                    </TableRow>
                  ) : (
                    workers.map((w) => (
                      <TableRow key={w.pulp_href}>
                        <TableCell className="font-medium">{stripHtml(w.name)}</TableCell>
                        <TableCell>{formatIso(w.pulp_created)}</TableCell>
                        <TableCell>{formatIso(w.last_heartbeat)}</TableCell>
                        <TableCell className="max-w-[14rem] truncate font-mono text-xs">
                          {w.current_task ?? "—"}
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
