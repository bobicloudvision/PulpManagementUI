"use client";

import { useState } from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { AdminShell } from "@/components/pulp/admin-shell";
import { usePulpAuthContext } from "@/components/pulp/auth-context";
import { usePulpGroups } from "@/components/pulp/use-pulp-groups";
import { useRequireAuth } from "@/components/pulp/use-require-auth";
import { usePulpUsers } from "@/components/pulp/use-pulp-users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const { sessionUser, isLoading, isCheckingSession, hasSession, error, logout } =
    usePulpAuthContext();
  const isRedirectingToLogin = useRequireAuth({ hasSession, isCheckingSession });
  const { users, updateUser, deleteUser } = usePulpUsers(hasSession);
  const { groups } = usePulpGroups(hasSession);

  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editIsStaff, setEditIsStaff] = useState(false);
  const [editIsActive, setEditIsActive] = useState(true);

  function startEditUser(user: (typeof users)[number]) {
    setEditingUserId(user.id);
    setEditUsername(user.username);
    setEditEmail(user.email);
    setEditIsStaff(user.is_staff);
    setEditIsActive(user.is_active);
  }

  function cancelEditUser() {
    setEditingUserId(null);
  }

  async function saveUser(userId: number) {
    const success = await updateUser(userId, {
      username: editUsername,
      email: editEmail,
      is_staff: editIsStaff,
      is_active: editIsActive,
    });

    if (success) {
      setEditingUserId(null);
    }
  }

  async function removeUser(userId: number) {
    if (!window.confirm("Delete this user?")) {
      return;
    }

    await deleteUser(userId);
  }

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
      {isCheckingSession || isRedirectingToLogin ? (
        <Card>Checking existing session...</Card>
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
                      <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                        {editingUserId === user.id ? (
                          <>
                            <TableCell>
                              <Input
                                value={editUsername}
                                onChange={(event) => setEditUsername(event.target.value)}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="email"
                                value={editEmail}
                                onChange={(event) => setEditEmail(event.target.value)}
                              />
                            </TableCell>
                            <TableCell>
                              <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={editIsStaff}
                                onChange={(event) => setEditIsStaff(event.target.checked)}
                              />
                            </TableCell>
                            <TableCell>
                              <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={editIsActive}
                                onChange={(event) => setEditIsActive(event.target.checked)}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={cancelEditUser}
                                  disabled={isLoading}
                                >
                                  Cancel
                                </Button>
                                <Button type="button" onClick={() => saveUser(user.id)} disabled={isLoading}>
                                  Save
                                </Button>
                              </div>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className="font-medium">{user.username}</TableCell>
                            <TableCell>{user.email || "-"}</TableCell>
                            <TableCell>{String(user.is_staff)}</TableCell>
                            <TableCell>{String(user.is_active)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => startEditUser(user)}
                                  disabled={isLoading}
                                >
                                  Edit
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40"
                                  onClick={() => removeUser(user.id)}
                                  disabled={isLoading}
                                >
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </>
                        )}
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
