"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminShell } from "@/components/pulp/admin-shell";
import { usePulpAuthContext } from "@/components/pulp/auth-context";
import { usePulpGroups } from "@/components/pulp/use-pulp-groups";
import { useRequireAuth } from "@/components/pulp/use-require-auth";
import { usePulpUsers } from "@/components/pulp/use-pulp-users";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
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
import { CreatePulpGroupPayload } from "@/services/pulp/types";

export default function GroupsListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { sessionUser, isLoading, isCheckingSession, hasSession, error, logout } =
    usePulpAuthContext();
  const isRedirectingToLogin = useRequireAuth({ hasSession, isCheckingSession });
  const { groups, createGroup, updateGroup, deleteGroup } = usePulpGroups(hasSession);
  const { users } = usePulpUsers(hasSession);

  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [editGroupName, setEditGroupName] = useState("");
  const [createModalFromUi, setCreateModalFromUi] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  const createFromQuery = searchParams.get("create") === "1";
  const createModalOpen = createModalFromUi || createFromQuery;

  const closeCreateModal = useCallback(() => {
    setCreateModalFromUi(false);
    setNewGroupName("");
    if (searchParams.get("create") === "1") {
      router.replace("/groups/list", { scroll: false });
    }
  }, [router, searchParams]);

  useEffect(() => {
    if (!createModalOpen) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeCreateModal();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [createModalOpen, closeCreateModal]);

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

  async function handleCreateGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload: CreatePulpGroupPayload = {
      name: newGroupName,
    };

    const success = await createGroup(payload);
    if (success) {
      closeCreateModal();
    }
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
      {isCheckingSession || isRedirectingToLogin ? (
        <Card>Checking existing session...</Card>
      ) : (
        <Card className="flex flex-col gap-0 p-0">
          <div className="flex flex-col gap-3 border-b border-zinc-200/80 px-5 py-4 dark:border-zinc-800/80 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="mb-0">Groups ({groups.length})</CardTitle>
            <Button type="button" onClick={() => setCreateModalFromUi(true)} disabled={isLoading}>
              Create group
            </Button>
          </div>
          <CardContent className="p-5">
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

      {createModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0 bg-black/50"
            onClick={closeCreateModal}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-group-title"
            className="relative z-10 w-full max-w-lg rounded-xl border border-zinc-200/90 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
          >
            <h2 id="create-group-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              New group
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Create a new access group on your connected Pulp server.
            </p>
            <form className="mt-5 grid gap-4" onSubmit={handleCreateGroup}>
              <FormField label="Group name">
                <Input
                  value={newGroupName}
                  onChange={(event) => setNewGroupName(event.target.value)}
                  required
                  autoFocus
                />
              </FormField>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeCreateModal} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating…" : "Create group"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
