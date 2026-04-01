"use client";

import { AdminShell } from "@/components/pulp/admin-shell";
import { LoginCard } from "@/components/pulp/login-card";
import { usePulpAuthContext } from "@/components/pulp/auth-context";
import { usePulpContent } from "@/components/pulp/use-pulp-content";
import { usePulpGroups } from "@/components/pulp/use-pulp-groups";
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

export default function ContentListPage() {
  const { sessionUser, isLoading, isCheckingSession, hasSession, error, login, logout } =
    usePulpAuthContext();
  const { users } = usePulpUsers(hasSession);
  const { groups } = usePulpGroups(hasSession);
  const {
    contentItems,
    count,
    page,
    totalPages,
    canGoNext,
    canGoPrevious,
    goNext,
    goPrevious,
  } = usePulpContent(hasSession, 50);

  return (
    <AdminShell
      title="Content List"
      description="View all content records from your connected Pulp server."
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
      ) : (
        <Card>
          <CardTitle>
            Content ({count}) - Page {page} / {totalPages}
          </CardTitle>
          <CardContent className="space-y-4">
            <TableWrapper>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Pulp Href</TableHeaderCell>
                    <TableHeaderCell>Created</TableHeaderCell>
                    <TableHeaderCell>Artifact Names</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {contentItems.map((item) => (
                    <TableRow key={item.pulp_href}>
                      <TableCell className="font-mono text-xs">{item.pulp_href}</TableCell>
                      <TableCell>{item.pulp_created}</TableCell>
                      <TableCell className="text-xs">
                        {Object.keys(item.artifacts).join(", ") || "-"}
                      </TableCell>
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
