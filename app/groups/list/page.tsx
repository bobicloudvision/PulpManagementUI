"use client";

import { useState } from "react";
import { AdminShell } from "@/components/pulp/admin-shell";
import { LoginCard } from "@/components/pulp/login-card";
import { usePulpAuthContext } from "@/components/pulp/auth-context";
import { usePulpGroups } from "@/components/pulp/use-pulp-groups";
import { usePulpUsers } from "@/components/pulp/use-pulp-users";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
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

export default function GroupsListPage() {
  const { sessionUser, isLoading, isCheckingSession, hasSession, error, login, logout } =
    usePulpAuthContext();
  const { groups, updateGroup, deleteGroup } = usePulpGroups(hasSession);
  const { users } = usePulpUsers(hasSession);

  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [editGroupName, setEditGroupName] = useState("");

  function startEditGroup(group: (typeof groups)[number]) {
    setEditingGroupId(group.id);
    setEditGroupName(group.name);
  }

  function cancelEditGroup() {
    setEditingGroupId(null);
  }

  async function saveGroup(groupId: number) {
    const success = await updateGroup(groupId, {
      name: editGroupName,
    });

    if (success) {
      setEditingGroupId(null);
    }
  }

  async function removeGroup(groupId: number) {
    if (!window.confirm("Delete this group?")) {
      return;
    }

    await deleteGroup(groupId);
  }

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
                      <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {groups.map((group) => (
                    <TableRow key={group.id}>
                        <TableCell>{group.id}</TableCell>
                        {editingGroupId === group.id ? (
                          <>
                            <TableCell>
                              <Input
                                value={editGroupName}
                                onChange={(event) => setEditGroupName(event.target.value)}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={cancelEditGroup}
                                  disabled={isLoading}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="button"
                                  onClick={() => saveGroup(group.id)}
                                  disabled={isLoading}
                                >
                                  Save
                                </Button>
                              </div>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className="font-medium">{group.name}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => startEditGroup(group)}
                                  disabled={isLoading}
                                >
                                  Edit
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40"
                                  onClick={() => removeGroup(group.id)}
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
