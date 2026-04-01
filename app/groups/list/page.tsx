"use client";

import { AdminShell } from "@/components/pulp/admin-shell";
import { LoginCard } from "@/components/pulp/login-card";
import { usePulpManagement } from "@/components/pulp/use-pulp-management";
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

export default function GroupsListPage() {
  const {
    sessionUser,
    users,
    groups,
    isLoading,
    isCheckingSession,
    hasSession,
    error,
    login,
    logout,
  } = usePulpManagement();

  return (
    <AdminShell
      title="Groups List"
      description="View groups from your connected Pulp server."
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
          <CardTitle>Groups ({groups.length})</CardTitle>
          <CardContent>
            <TableWrapper>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>ID</TableHeaderCell>
                    <TableHeaderCell>Name</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {groups.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell>{group.id}</TableCell>
                      <TableCell className="font-medium">{group.name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableWrapper>
          </CardContent>
        </Card>
      )}
    </AdminShell>
  );
}
