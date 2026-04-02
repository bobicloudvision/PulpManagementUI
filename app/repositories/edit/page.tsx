"use client";

import Link from "next/link";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AdminShell } from "@/components/pulp/admin-shell";
import { usePulpAuthContext } from "@/components/pulp/auth-context";
import { usePulpGroups } from "@/components/pulp/use-pulp-groups";
import { useRequireAuth } from "@/components/pulp/use-require-auth";
import { usePulpUsers } from "@/components/pulp/use-pulp-users";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import {
  pulpRepositoryManagementService,
  type RepositoryUpdateResult,
} from "@/services/pulp/repository-management-service";
import type {
  DebRepositoryUpdatePayload,
  PulpDebRepositoryDetail,
  PulpRpmRepositoryDetail,
  RpmRepositoryUpdatePayload,
} from "@/services/pulp/types";

type RepoKind = "rpm" | "deb";

const checksumAlgorithms = ["sha256", "sha1", "md5", "sha224", "sha384", "sha512"] as const;

const textareaClass =
  "min-h-[5rem] w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700";

const selectClass =
  "w-full max-w-md rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700";

function rpmDetailToForm(d: PulpRpmRepositoryDetail): RpmRepositoryUpdatePayload {
  return {
    name: d.name,
    description: d.description,
    retain_repo_versions: d.retain_repo_versions,
    remote: d.remote,
    autopublish: d.autopublish,
    metadata_signing_service: d.metadata_signing_service,
    retain_package_versions: d.retain_package_versions,
    metadata_checksum_type: d.metadata_checksum_type,
    package_checksum_type: d.package_checksum_type,
    gpgcheck: d.gpgcheck,
    repo_gpgcheck: d.repo_gpgcheck,
    sqlite_metadata: d.sqlite_metadata,
  };
}

function debDetailToForm(d: PulpDebRepositoryDetail): DebRepositoryUpdatePayload {
  return {
    name: d.name,
    description: d.description,
    retain_repo_versions: d.retain_repo_versions,
    remote: d.remote,
    autopublish: d.autopublish,
    structured_repo: d.structured_repo,
  };
}

type RpmReadOnlyMeta = {
  pulp_href: string;
  pulp_created: string | null;
  versions_href: string | null;
  latest_version_href: string | null;
};

function ChecksumSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <FormField label={label}>
      <select
        className={selectClass}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
      >
        <option value="">(none)</option>
        {checksumAlgorithms.map((alg) => (
          <option key={alg} value={alg}>
            {alg}
          </option>
        ))}
      </select>
    </FormField>
  );
}

function RepositoriesEditInner() {
  const searchParams = useSearchParams();
  const kindParam = (searchParams.get("kind") === "deb" ? "deb" : "rpm") as RepoKind;
  const pulpHref = searchParams.get("pulp_href")?.trim() ?? "";

  const { sessionUser, isLoading, isCheckingSession, hasSession, error, setError, logout } =
    usePulpAuthContext();
  const isRedirectingToLogin = useRequireAuth({ hasSession, isCheckingSession });
  const { users } = usePulpUsers(hasSession);
  const { groups } = usePulpGroups(hasSession);

  const [loadedKind, setLoadedKind] = useState<RepoKind | null>(null);
  const [rpm, setRpm] = useState<RpmRepositoryUpdatePayload | null>(null);
  const [rpmMeta, setRpmMeta] = useState<RpmReadOnlyMeta | null>(null);
  const [deb, setDeb] = useState<DebRepositoryUpdatePayload | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updated, setUpdated] = useState<RepositoryUpdateResult | null>(null);

  useEffect(() => {
    if (!hasSession || !pulpHref) {
      setLoadedKind(null);
      setRpm(null);
      setRpmMeta(null);
      setDeb(null);
      return;
    }

    let active = true;

    async function load() {
      setIsLoadingDetail(true);
      setError(null);
      setUpdated(null);
      try {
        const detail = await pulpRepositoryManagementService.getRepositoryDetail(pulpHref);
        if (!active) return;
        setLoadedKind(detail.kind);
        if (detail.kind === "rpm") {
          setRpm(rpmDetailToForm(detail));
          setRpmMeta({
            pulp_href: detail.pulp_href,
            pulp_created: detail.pulp_created,
            versions_href: detail.versions_href,
            latest_version_href: detail.latest_version_href,
          });
          setDeb(null);
        } else {
          setDeb(debDetailToForm(detail));
          setRpm(null);
          setRpmMeta(null);
        }
      } catch (e) {
        if (!active) return;
        setLoadedKind(null);
        setRpm(null);
        setRpmMeta(null);
        setDeb(null);
        setError(e instanceof Error ? e.message : "Failed to load repository.");
      } finally {
        if (active) setIsLoadingDetail(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [hasSession, pulpHref, setError]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pulpHref || !loadedKind) return;

    if (loadedKind === "rpm") {
      if (!rpm?.name.trim()) {
        setError("Repository name is required.");
        return;
      }
    } else if (!deb?.name.trim()) {
      setError("Repository name is required.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    setUpdated(null);
    try {
      const result =
        loadedKind === "rpm" && rpm
          ? await pulpRepositoryManagementService.updateRpm(pulpHref, rpm)
          : loadedKind === "deb" && deb
            ? await pulpRepositoryManagementService.updateDeb(pulpHref, deb)
            : null;
      if (!result) {
        setError("Nothing to save.");
        return;
      }
      setUpdated(result);
      if (loadedKind === "rpm" && rpm) {
        setRpm({ ...rpm, name: result.name });
      }
      if (loadedKind === "deb" && deb) {
        setDeb({ ...deb, name: result.name });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const missingParams = !pulpHref;
  const kindMismatch =
    loadedKind !== null && kindParam !== loadedKind
      ? `This href is a ${loadedKind.toUpperCase()} repository; list opened it as ${kindParam.toUpperCase()}.`
      : null;

  return (
    <AdminShell
      title="Edit repository"
      description="Update repository settings (matches Pulp RPM / Debian APT repository APIs)."
      hasSession={hasSession}
      sessionUser={sessionUser}
      isLoading={isLoading || isLoadingDetail || isSubmitting}
      usersCount={users.length}
      groupsCount={groups.length}
      error={error}
      onLogout={logout}
    >
      {isCheckingSession || isRedirectingToLogin ? (
        <Card>Checking existing session...</Card>
      ) : missingParams ? (
        <Card>
          <CardTitle>Missing repository</CardTitle>
          <CardContent className="space-y-3 text-sm">
            <p>Open this page from the repository list using Edit, or append query parameters:</p>
            <p className="break-all font-mono text-xs text-zinc-600 dark:text-zinc-400">
              /repositories/edit?kind=rpm&amp;pulp_href=…
            </p>
            <Link
              href="/repositories/list"
              className="inline-flex rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              Back to list
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {kindMismatch ? (
            <Card className="border-amber-200 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-950/30">
              <CardContent className="pt-6 text-sm text-amber-900 dark:text-amber-100">
                {kindMismatch}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardTitle>Repository {loadedKind ? `(${loadedKind.toUpperCase()})` : ""}</CardTitle>
            <CardContent className="space-y-3">
              <p className="break-all font-mono text-xs text-zinc-600 dark:text-zinc-400">
                {rpmMeta?.pulp_href ?? pulpHref}
              </p>
              {rpmMeta ? (
                <>
                  <dl className="grid gap-2 border-t border-zinc-200 pt-3 text-xs text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
                    {rpmMeta.pulp_created ? (
                      <div className="flex flex-wrap gap-x-2">
                        <dt className="font-medium text-zinc-700 dark:text-zinc-300">Created</dt>
                        <dd>{rpmMeta.pulp_created}</dd>
                      </div>
                    ) : null}
                    {rpmMeta.latest_version_href ? (
                      <div className="flex flex-col gap-0.5">
                        <dt className="font-medium text-zinc-700 dark:text-zinc-300">Latest version</dt>
                        <dd className="break-all font-mono">{rpmMeta.latest_version_href}</dd>
                      </div>
                    ) : null}
                    {rpmMeta.versions_href ? (
                      <div className="flex flex-col gap-0.5">
                        <dt className="font-medium text-zinc-700 dark:text-zinc-300">Versions list</dt>
                        <dd className="break-all font-mono">{rpmMeta.versions_href}</dd>
                      </div>
                    ) : null}
                  </dl>
                  {loadedKind === "rpm" && pulpHref ? (
                    <div className="pt-2">
                      <Link
                        href={`/repositories/versions?pulp_href=${encodeURIComponent(pulpHref)}`}
                        className="inline-flex rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
                      >
                        Version history
                      </Link>
                    </div>
                  ) : null}
                </>
              ) : null}

              {isLoadingDetail ? (
                <p className="text-sm text-zinc-500">Loading…</p>
              ) : loadedKind === null ? (
                <p className="text-sm text-zinc-500">Could not load this repository.</p>
              ) : loadedKind === "rpm" && rpm ? (
                <form className="flex max-w-2xl flex-col gap-4" onSubmit={handleSubmit}>
                  <FormField label="Name">
                    <Input
                      value={rpm.name}
                      onChange={(e) => setRpm({ ...rpm, name: e.target.value })}
                      required
                    />
                  </FormField>
                  <FormField label="Description">
                    <textarea
                      className={textareaClass}
                      value={rpm.description ?? ""}
                      onChange={(e) =>
                        setRpm({
                          ...rpm,
                          description: e.target.value === "" ? null : e.target.value,
                        })
                      }
                      rows={3}
                    />
                  </FormField>
                  <FormField label="Retain repository versions">
                    <Input
                      type="number"
                      min={0}
                      placeholder="empty = no limit"
                      value={rpm.retain_repo_versions === null ? "" : rpm.retain_repo_versions}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "") {
                          setRpm({ ...rpm, retain_repo_versions: null });
                          return;
                        }
                        const n = Number(v);
                        setRpm({
                          ...rpm,
                          retain_repo_versions: Number.isFinite(n) ? Math.trunc(n) : null,
                        });
                      }}
                    />
                  </FormField>
                  <FormField label="Remote (Pulp href)">
                    <Input
                      value={rpm.remote ?? ""}
                      onChange={(e) =>
                        setRpm({
                          ...rpm,
                          remote: e.target.value.trim() === "" ? null : e.target.value.trim(),
                        })
                      }
                      placeholder="null"
                      className="font-mono text-xs"
                    />
                  </FormField>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={rpm.autopublish}
                      onChange={(e) => setRpm({ ...rpm, autopublish: e.target.checked })}
                    />
                    Autopublish
                  </label>
                  <FormField label="Metadata signing service (href)">
                    <Input
                      value={rpm.metadata_signing_service ?? ""}
                      onChange={(e) =>
                        setRpm({
                          ...rpm,
                          metadata_signing_service:
                            e.target.value.trim() === "" ? null : e.target.value.trim(),
                        })
                      }
                      className="font-mono text-xs"
                    />
                  </FormField>
                  <FormField label="Retain package versions">
                    <Input
                      type="number"
                      min={0}
                      value={rpm.retain_package_versions}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        setRpm({
                          ...rpm,
                          retain_package_versions:
                            Number.isFinite(n) && n >= 0 ? Math.trunc(n) : 0,
                        });
                      }}
                    />
                  </FormField>
                  <ChecksumSelect
                    label="Metadata checksum type"
                    value={rpm.metadata_checksum_type}
                    onChange={(v) => setRpm({ ...rpm, metadata_checksum_type: v })}
                  />
                  <ChecksumSelect
                    label="Package checksum type"
                    value={rpm.package_checksum_type}
                    onChange={(v) => setRpm({ ...rpm, package_checksum_type: v })}
                  />
                  <FormField label="GPG check (0 or 1)">
                    <select
                      className={selectClass}
                      value={rpm.gpgcheck ? 1 : 0}
                      onChange={(e) =>
                        setRpm({ ...rpm, gpgcheck: e.target.value === "1" ? 1 : 0 })
                      }
                    >
                      <option value={0}>0</option>
                      <option value={1}>1</option>
                    </select>
                  </FormField>
                  <FormField label="Repo GPG check (0 or 1)">
                    <select
                      className={selectClass}
                      value={rpm.repo_gpgcheck ? 1 : 0}
                      onChange={(e) =>
                        setRpm({ ...rpm, repo_gpgcheck: e.target.value === "1" ? 1 : 0 })
                      }
                    >
                      <option value={0}>0</option>
                      <option value={1}>1</option>
                    </select>
                  </FormField>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={rpm.sqlite_metadata}
                      onChange={(e) => setRpm({ ...rpm, sqlite_metadata: e.target.checked })}
                    />
                    SQLite metadata
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Saving…" : "Save"}
                    </Button>
                    <Link
                      href="/repositories/list"
                      className="inline-flex items-center rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
                    >
                      Back to list
                    </Link>
                    <Link
                      href={`/repositories/content?pulp_href=${encodeURIComponent(pulpHref)}`}
                      className="inline-flex items-center rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
                    >
                      Content
                    </Link>
                  </div>
                </form>
              ) : loadedKind === "deb" && deb ? (
                <form className="flex max-w-lg flex-col gap-4" onSubmit={handleSubmit}>
                  <FormField label="Name">
                    <Input
                      value={deb.name}
                      onChange={(e) => setDeb({ ...deb, name: e.target.value })}
                      required
                    />
                  </FormField>
                  <FormField label="Description">
                    <textarea
                      className={textareaClass}
                      value={deb.description ?? ""}
                      onChange={(e) =>
                        setDeb({
                          ...deb,
                          description: e.target.value === "" ? null : e.target.value,
                        })
                      }
                      rows={3}
                    />
                  </FormField>
                  <FormField label="Retain repository versions">
                    <Input
                      type="number"
                      min={0}
                      placeholder="empty = no limit"
                      value={deb.retain_repo_versions === null ? "" : deb.retain_repo_versions}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "") {
                          setDeb({ ...deb, retain_repo_versions: null });
                          return;
                        }
                        const n = Number(v);
                        setDeb({
                          ...deb,
                          retain_repo_versions: Number.isFinite(n) ? Math.trunc(n) : null,
                        });
                      }}
                    />
                  </FormField>
                  <FormField label="Remote (Pulp href)">
                    <Input
                      value={deb.remote ?? ""}
                      onChange={(e) =>
                        setDeb({
                          ...deb,
                          remote: e.target.value.trim() === "" ? null : e.target.value.trim(),
                        })
                      }
                      className="font-mono text-xs"
                    />
                  </FormField>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={deb.autopublish}
                      onChange={(e) => setDeb({ ...deb, autopublish: e.target.checked })}
                    />
                    Autopublish
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={deb.structured_repo}
                      onChange={(e) => setDeb({ ...deb, structured_repo: e.target.checked })}
                    />
                    Structured repo
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Saving…" : "Save"}
                    </Button>
                    <Link
                      href="/repositories/list"
                      className="inline-flex items-center rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
                    >
                      Back to list
                    </Link>
                    <Link
                      href={`/repositories/content?pulp_href=${encodeURIComponent(pulpHref)}`}
                      className="inline-flex items-center rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
                    >
                      Content
                    </Link>
                  </div>
                </form>
              ) : null}
            </CardContent>
          </Card>

          {updated ? (
            <Card className="border-emerald-200/80 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/30">
              <CardTitle>Saved</CardTitle>
              <CardContent className="text-sm">
                <p>
                  <span className="font-medium">Name:</span> {updated.name}
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}
    </AdminShell>
  );
}

export default function RepositoriesEditPage() {
  return (
    <Suspense fallback={<Card className="p-6">Loading…</Card>}>
      <RepositoriesEditInner />
    </Suspense>
  );
}
