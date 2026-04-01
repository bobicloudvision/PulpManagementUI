"use client";

import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { AdminShell } from "@/components/pulp/admin-shell";
import { LoginCard } from "@/components/pulp/login-card";
import { usePulpManagement } from "@/components/pulp/use-pulp-management";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableWrapper,
} from "@/components/ui/table";

export default function UsersListPage() {
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
      title="Users List"
      description="View users from your connected Pulp server."
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
          <CardTitle>Users ({users.length})</CardTitle>
          <CardContent>
            <TableWrapper>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Username</TableHeaderCell>
                    <TableHeaderCell>Email</TableHeaderCell>
                    <TableHeaderCell>Staff</TableHeaderCell>
                    <TableHeaderCell>Active</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.email || "-"}</TableCell>
                      <TableCell>{String(user.is_staff)}</TableCell>
                      <TableCell>{String(user.is_active)}</TableCell>
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
