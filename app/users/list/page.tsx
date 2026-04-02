"use client";

import { FormEvent, useCallback, useEffect, useId, useState } from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { AdminShell } from "@/components/pulp/admin-shell";
import { usePulpAuthContext } from "@/components/pulp/auth-context";
import { usePulpGroups } from "@/components/pulp/use-pulp-groups";
import { useRequireAuth } from "@/components/pulp/use-require-auth";
import { usePulpUsers } from "@/components/pulp/use-pulp-users";
import { CreatePulpUserPayload } from "@/services/pulp/types";
import { Button } from "@/components/ui/button";
import { CheckboxField, FormField } from "@/components/ui/form-field";
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
  const { users, createUser, updateUser, deleteUser } = usePulpUsers(hasSession);
  const { groups } = usePulpGroups(hasSession);

  const createDialogTitleId = useId();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createUsername, setCreateUsername] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createFirstName, setCreateFirstName] = useState("");
  const [createLastName, setCreateLastName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createIsStaff, setCreateIsStaff] = useState(false);
  const [createIsActive, setCreateIsActive] = useState(true);

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

  const resetCreateForm = useCallback(() => {
    setCreateUsername("");
    setCreatePassword("");
    setCreateFirstName("");
    setCreateLastName("");
    setCreateEmail("");
    setCreateIsStaff(false);
    setCreateIsActive(true);
  }, []);

  function closeCreateModal() {
    setCreateModalOpen(false);
    resetCreateForm();
  }

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload: CreatePulpUserPayload = {
      username: createUsername,
      password: createPassword,
      first_name: createFirstName,
      last_name: createLastName,
      email: createEmail,
      is_staff: createIsStaff,
      is_active: createIsActive,
    };

    const success = await createUser(payload);
    if (!success) {
      return;
    }

    closeCreateModal();
  }

  useEffect(() => {
    if (!createModalOpen) {
      return;
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setCreateModalOpen(false);
        resetCreateForm();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [createModalOpen, resetCreateForm]);

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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Users ({users.length})</CardTitle>
            <Button type="button" onClick={() => setCreateModalOpen(true)} disabled={isLoading}>
              Create user
            </Button>
          </div>
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

      {createModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/50 p-4 sm:items-center"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeCreateModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={createDialogTitleId}
            className="max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto rounded-xl border border-zinc-200 bg-white p-5 shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 id={createDialogTitleId} className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              New user
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Create an account on your connected Pulp server.
            </p>
            <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={handleCreateUser}>
              <FormField label="Username">
                <Input
                  value={createUsername}
                  onChange={(event) => setCreateUsername(event.target.value)}
                  required
                  autoComplete="username"
                />
              </FormField>

              <FormField label="Password">
                <Input
                  type="password"
                  value={createPassword}
                  onChange={(event) => setCreatePassword(event.target.value)}
                  required
                  autoComplete="new-password"
                />
              </FormField>

              <FormField label="First name">
                <Input
                  value={createFirstName}
                  onChange={(event) => setCreateFirstName(event.target.value)}
                  autoComplete="given-name"
                />
              </FormField>

              <FormField label="Last name">
                <Input
                  value={createLastName}
                  onChange={(event) => setCreateLastName(event.target.value)}
                  autoComplete="family-name"
                />
              </FormField>

              <FormField label="Email" className="sm:col-span-2">
                <Input
                  type="email"
                  value={createEmail}
                  onChange={(event) => setCreateEmail(event.target.value)}
                  autoComplete="email"
                />
              </FormField>

              <CheckboxField label="Is staff">
                <Input
                  type="checkbox"
                  className="h-4 w-4 rounded border-zinc-300 p-0 dark:border-zinc-700"
                  checked={createIsStaff}
                  onChange={(event) => setCreateIsStaff(event.target.checked)}
                />
              </CheckboxField>

              <CheckboxField label="Is active">
                <Input
                  type="checkbox"
                  className="h-4 w-4 rounded border-zinc-300 p-0 dark:border-zinc-700"
                  checked={createIsActive}
                  onChange={(event) => setCreateIsActive(event.target.checked)}
                />
              </CheckboxField>

              <div className="flex flex-wrap gap-2 sm:col-span-2">
                <Button type="button" variant="outline" onClick={closeCreateModal} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create user"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
