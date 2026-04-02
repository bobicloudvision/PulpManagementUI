"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/pulp/admin-shell";
import { usePulpAuthContext } from "@/components/pulp/auth-context";
import { usePulpGroups } from "@/components/pulp/use-pulp-groups";
import { usePulpRoles } from "@/components/pulp/use-pulp-roles";
import { useRequireAuth } from "@/components/pulp/use-require-auth";
import { usePulpUsers } from "@/components/pulp/use-pulp-users";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
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
import { cn } from "@/components/ui/cn";
import { pulpRoleIdFromHref } from "@/services/pulp/role-service";
import {
  CreatePulpRolePayload,
  PulpRole,
  UpdatePulpRolePayload,
} from "@/services/pulp/types";

const PAGE_SIZE = 100;

const textareaClassName =
  "min-h-[9rem] w-full resize-y rounded-md border border-zinc-300 bg-transparent px-3 py-2 font-mono text-sm dark:border-zinc-700";

function parsePermissionInput(raw: string): string[] {
  return raw
    .split(/[\n,;\s]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function formatIso(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  return d.toLocaleString();
}

function paginationItems(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 1) {
    return [1];
  }
  const delta = 2;
  const range: number[] = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      range.push(i);
    }
  }
  const out: (number | "ellipsis")[] = [];
  let prev: number | undefined;
  for (const i of range) {
    if (prev !== undefined && i - prev > 1) {
      out.push("ellipsis");
    }
    out.push(i);
    prev = i;
  }
  return out;
}

function RolesListPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawPage = searchParams.get("page");
  const parsed = Number.parseInt(rawPage ?? "1", 10);
  const page = Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;

  const { sessionUser, isLoading, isCheckingSession, hasSession, error, logout, setError } =
    usePulpAuthContext();
  const isRedirectingToLogin = useRequireAuth({ hasSession, isCheckingSession });
  const { users } = usePulpUsers(hasSession);
  const { groups } = usePulpGroups(hasSession);
  const { data, loading, totalPages, createRole, patchRole, deleteRole } = usePulpRoles(
    hasSession,
    page,
    PAGE_SIZE
  );

  const [createModalFromUi, setCreateModalFromUi] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [newRolePermissions, setNewRolePermissions] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);

  const [editingRole, setEditingRole] = useState<PulpRole | null>(null);
  const [editRoleName, setEditRoleName] = useState("");
  const [editRoleDescription, setEditRoleDescription] = useState("");
  const [editRolePermissions, setEditRolePermissions] = useState("");

  const createFromQuery = searchParams.get("create") === "1";
  const createModalOpen = (createModalFromUi || createFromQuery) && editingRole === null;

  const closeEditModal = useCallback(() => {
    setEditingRole(null);
    setEditRoleName("");
    setEditRoleDescription("");
    setEditRolePermissions("");
    setModalError(null);
  }, []);

  const openEditRole = useCallback(
    (role: PulpRole) => {
      setCreateModalFromUi(false);
      setModalError(null);
      setEditingRole(role);
      setEditRoleName(role.name);
      setEditRoleDescription(role.description ?? "");
      setEditRolePermissions(role.permissions.join("\n"));
      if (searchParams.get("create") === "1") {
        const next = new URLSearchParams(searchParams.toString());
        next.delete("create");
        const qs = next.toString();
        router.replace(qs ? `/roles/list?${qs}` : "/roles/list", { scroll: false });
      }
    },
    [router, searchParams]
  );

  const closeCreateModal = useCallback(() => {
    setCreateModalFromUi(false);
    setNewRoleName("");
    setNewRoleDescription("");
    setNewRolePermissions("");
    setModalError(null);
    if (searchParams.get("create") === "1") {
      const next = new URLSearchParams(searchParams.toString());
      next.delete("create");
      const qs = next.toString();
      router.replace(qs ? `/roles/list?${qs}` : "/roles/list", { scroll: false });
    }
  }, [router, searchParams]);

  useEffect(() => {
    if (!createModalOpen && !editingRole) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (editingRole) {
          closeEditModal();
        } else {
          closeCreateModal();
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [createModalOpen, closeCreateModal, closeEditModal, editingRole]);

  async function handleCreateRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setModalError(null);
    setError(null);

    const name = newRoleName.trim();
    if (!name) {
      setModalError("Enter a role name.");
      return;
    }

    const permissions = parsePermissionInput(newRolePermissions);
    if (permissions.length === 0) {
      setModalError("Add at least one permission (space, comma, or newline separated).");
      return;
    }

    const payload: CreatePulpRolePayload = {
      name,
      permissions,
    };
    const desc = newRoleDescription.trim();
    if (desc) {
      payload.description = desc;
    }

    const result = await createRole(payload);
    if (result.ok) {
      closeCreateModal();
    } else {
      setModalError(result.detail);
    }
  }

  async function handleSaveEditRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingRole) {
      return;
    }
    setModalError(null);
    setError(null);

    const id = pulpRoleIdFromHref(editingRole.pulp_href);
    if (!id) {
      setModalError("Could not read role id from href.");
      return;
    }

    const name = editRoleName.trim();
    if (!name) {
      setModalError("Enter a role name.");
      return;
    }

    const permissions = parsePermissionInput(editRolePermissions);
    if (permissions.length === 0) {
      setModalError("Add at least one permission (space, comma, or newline separated).");
      return;
    }

    const payload: UpdatePulpRolePayload = {
      name,
      permissions,
      description: editRoleDescription.trim() || null,
    };

    const result = await patchRole(id, payload);
    if (result.ok) {
      closeEditModal();
    } else {
      setModalError(result.detail);
    }
  }

  async function handleDeleteRole(role: PulpRole) {
    const id = pulpRoleIdFromHref(role.pulp_href);
    if (!id) {
      setError("Could not read role id from href.");
      return;
    }
    if (!window.confirm(`Delete role “${role.name}”? This cannot be undone.`)) {
      return;
    }
    setError(null);
    const result = await deleteRole(id);
    if (!result.ok) {
      setError(result.detail);
    }
  }

  useEffect(() => {
    if (!data || totalPages < 1 || page <= totalPages) {
      return;
    }
    const next = new URLSearchParams(searchParams.toString());
    next.set("page", String(totalPages));
    router.replace(`/roles/list?${next.toString()}`);
  }, [data, page, router, searchParams, totalPages]);

  const roles = data?.results ?? [];
  const count = data?.count ?? 0;
  const pages = paginationItems(page, totalPages);

  return (
    <AdminShell
      title="Roles"
      description="Pulp RBAC roles and bundled permissions."
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
            <CardTitle className="mb-0">
              Roles
              {count > 0 ? (
                <span className="ml-2 font-normal text-zinc-500 dark:text-zinc-400">
                  ({count.toLocaleString()} total)
                </span>
              ) : null}
            </CardTitle>
            <Button
              type="button"
              onClick={() => {
                setModalError(null);
                closeEditModal();
                setCreateModalFromUi(true);
              }}
              disabled={isLoading}
            >
              Create role
            </Button>
          </div>
          <CardContent className="space-y-4 p-5">
            {totalPages > 1 ? (
              <nav
                className="flex flex-wrap items-center gap-1 text-sm"
                aria-label="Role list pagination"
              >
                <PaginationLink
                  href={page > 1 ? `/roles/list?page=${page - 1}` : null}
                  label="«"
                  disabled={page <= 1 || loading}
                />
                {pages.map((item, idx) =>
                  item === "ellipsis" ? (
                    <span
                      key={`e-${idx}`}
                      className="px-2 text-zinc-400 dark:text-zinc-500"
                      aria-hidden
                    >
                      …
                    </span>
                  ) : (
                    <PaginationLink
                      key={item}
                      href={`/roles/list?page=${item}`}
                      label={String(item)}
                      active={item === page}
                      disabled={loading}
                    />
                  )
                )}
                <PaginationLink
                  href={page < totalPages ? `/roles/list?page=${page + 1}` : null}
                  label="»"
                  disabled={page >= totalPages || loading}
                />
              </nav>
            ) : null}

            <TableWrapper>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Name</TableHeaderCell>
                    <TableHeaderCell>Locked</TableHeaderCell>
                    <TableHeaderCell>Permissions</TableHeaderCell>
                    <TableHeaderCell>Description</TableHeaderCell>
                    <TableHeaderCell>Created</TableHeaderCell>
                    <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading && roles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-zinc-500">
                        Loading roles…
                      </TableCell>
                    </TableRow>
                  ) : !loading && roles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-zinc-500">
                        No roles on this page.
                      </TableCell>
                    </TableRow>
                  ) : (
                    roles.map((r) => (
                      <TableRow key={r.pulp_href}>
                        <TableCell className="max-w-[20rem] font-mono text-xs font-medium">
                          <span title={r.name}>{r.name}</span>
                        </TableCell>
                        <TableCell>
                          {r.locked ? (
                            <span className="rounded-md bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                              Locked
                            </span>
                          ) : (
                            <span className="text-zinc-500">—</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[28rem]">
                          <div
                            className="max-h-28 overflow-y-auto text-xs leading-relaxed text-zinc-700 dark:text-zinc-300"
                            title={r.permissions.join(", ")}
                          >
                            <ul className="list-inside list-disc font-mono">
                              {r.permissions.map((p) => (
                                <li key={p} className="break-all">
                                  {p}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[14rem] text-sm text-zinc-600 dark:text-zinc-400">
                          {r.description?.trim() ? r.description : "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {formatIso(r.pulp_created)}
                        </TableCell>
                        <TableCell className="text-right">
                          {r.locked ? (
                            <span className="text-xs text-zinc-400">—</span>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                className="px-3 py-1.5 text-xs"
                                onClick={() => openEditRole(r)}
                                disabled={isLoading}
                              >
                                Edit
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                className="border-red-300 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40"
                                onClick={() => void handleDeleteRole(r)}
                                disabled={isLoading}
                              >
                                Delete
                              </Button>
                            </div>
                          )}
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

      {createModalOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0 bg-black/50"
            onClick={closeCreateModal}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-role-title"
            className="relative z-[101] max-h-[min(90vh,40rem)] w-full max-w-lg overflow-y-auto rounded-xl border border-zinc-200/90 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
          >
            <h2 id="create-role-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              New role
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Pulp&apos;s roles API is in tech preview. Custom roles need a unique name and at least one
              permission string (e.g. <span className="font-mono">core.view_task</span>).
            </p>
            <form className="mt-5 grid gap-4" onSubmit={handleCreateRole} noValidate>
              {modalError ? (
                <p
                  role="alert"
                  className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200"
                >
                  {modalError}
                </p>
              ) : null}
              <FormField label="Name">
                <Input
                  value={newRoleName}
                  onChange={(event) => {
                    setModalError(null);
                    setNewRoleName(event.target.value);
                  }}
                  autoFocus
                  className="font-mono"
                  placeholder="my.custom_role"
                />
              </FormField>
              <FormField label="Description (optional)">
                <textarea
                  value={newRoleDescription}
                  onChange={(event) => {
                    setModalError(null);
                    setNewRoleDescription(event.target.value);
                  }}
                  rows={2}
                  className={textareaClassName}
                />
              </FormField>
              <FormField label="Permissions" className="text-sm">
                <textarea
                  value={newRolePermissions}
                  onChange={(event) => {
                    setModalError(null);
                    setNewRolePermissions(event.target.value);
                  }}
                  placeholder={"core.view_task rpm.view_rpmrepository"}
                  className={textareaClassName}
                  aria-describedby="create-role-perms-hint"
                />
                <span id="create-role-perms-hint" className="text-xs text-zinc-500 dark:text-zinc-400">
                  Space, comma, semicolon, or newline separated.
                </span>
              </FormField>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeCreateModal} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating…" : "Create role"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {editingRole ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0 bg-black/50"
            onClick={closeEditModal}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-role-title"
            className="relative z-[101] max-h-[min(90vh,40rem)] w-full max-w-lg overflow-y-auto rounded-xl border border-zinc-200/90 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
          >
            <h2 id="edit-role-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Edit role
            </h2>
            <p className="mt-1 font-mono text-xs text-zinc-500 dark:text-zinc-400">
              {editingRole.name}
            </p>
            <form className="mt-5 grid gap-4" onSubmit={handleSaveEditRole} noValidate>
              {modalError ? (
                <p
                  role="alert"
                  className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200"
                >
                  {modalError}
                </p>
              ) : null}
              <FormField label="Name">
                <Input
                  value={editRoleName}
                  onChange={(event) => {
                    setModalError(null);
                    setEditRoleName(event.target.value);
                  }}
                  className="font-mono"
                />
              </FormField>
              <FormField label="Description (optional)">
                <textarea
                  value={editRoleDescription}
                  onChange={(event) => {
                    setModalError(null);
                    setEditRoleDescription(event.target.value);
                  }}
                  rows={2}
                  className={textareaClassName}
                />
              </FormField>
              <FormField label="Permissions" className="text-sm">
                <textarea
                  value={editRolePermissions}
                  onChange={(event) => {
                    setModalError(null);
                    setEditRolePermissions(event.target.value);
                  }}
                  className={textareaClassName}
                  aria-describedby="edit-role-perms-hint"
                />
                <span id="edit-role-perms-hint" className="text-xs text-zinc-500 dark:text-zinc-400">
                  Space, comma, semicolon, or newline separated.
                </span>
              </FormField>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeEditModal} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}

function RolesListSuspenseFallback() {
  const { sessionUser, isLoading, hasSession, error, logout } = usePulpAuthContext();
  const { users } = usePulpUsers(hasSession);
  const { groups } = usePulpGroups(hasSession);

  return (
    <AdminShell
      title="Roles"
      description="Pulp RBAC roles and bundled permissions."
      hasSession={hasSession}
      sessionUser={sessionUser}
      isLoading={isLoading}
      usersCount={users.length}
      groupsCount={groups.length}
      error={error}
      onLogout={logout}
    >
      <Card>Loading role list…</Card>
    </AdminShell>
  );
}

export default function RolesListPage() {
  return (
    <Suspense fallback={<RolesListSuspenseFallback />}>
      <RolesListPageContent />
    </Suspense>
  );
}

const paginationBtnBase =
  "inline-flex min-w-[2.25rem] items-center justify-center rounded-md px-2 py-1.5 text-sm transition-opacity";

function PaginationLink({
  href,
  label,
  disabled,
  active,
}: {
  href: string | null;
  label: string;
  disabled?: boolean;
  active?: boolean;
}) {
  if (!href || disabled) {
    return (
      <span
        className={cn(
          paginationBtnBase,
          "cursor-not-allowed border border-zinc-300 opacity-40 dark:border-zinc-700"
        )}
        aria-disabled
      >
        {label}
      </span>
    );
  }

  return (
    <Link
      href={href}
      scroll={false}
      className={cn(
        paginationBtnBase,
        active
          ? "bg-black text-white dark:bg-white dark:text-black"
          : "border border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900/80",
        active && "pointer-events-none"
      )}
      aria-current={active ? "page" : undefined}
    >
      {label}
    </Link>
  );
}
