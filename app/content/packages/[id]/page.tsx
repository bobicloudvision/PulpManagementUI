"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/pulp/admin-shell";
import { usePulpAuthContext } from "@/components/pulp/auth-context";
import { usePulpGroups } from "@/components/pulp/use-pulp-groups";
import { useRequireAuth } from "@/components/pulp/use-require-auth";
import { usePulpUsers } from "@/components/pulp/use-pulp-users";
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
import { pulpContentService } from "@/services/pulp/content-service";
import { PulpRpmPackage } from "@/services/pulp/types";

function valueOf(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function formatBytes(value: unknown): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  if (value === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exp = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const formatted = value / 1024 ** exp;
  return `${formatted.toFixed(exp === 0 ? 0 : 2)} ${units[exp]}`;
}

function normalizeUrl(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length === 0) return null;
  const hrefMatch = raw.match(/href="([^"]+)"/i);
  return hrefMatch?.[1] ?? raw;
}

export default function PackageDetailsPage() {
  const params = useParams<{ id: string }>();
  const packageId = useMemo(() => params?.id ?? "", [params]);
  const { sessionUser, isLoading, isCheckingSession, hasSession, error, setError, logout } =
    usePulpAuthContext();
  const isRedirectingToLogin = useRequireAuth({ hasSession, isCheckingSession });
  const { users } = usePulpUsers(hasSession);
  const { groups } = usePulpGroups(hasSession);
  const [pkg, setPkg] = useState<PulpRpmPackage | null>(null);

  useEffect(() => {
    let active = true;

    async function loadPackage() {
      if (!hasSession || !packageId) {
        setPkg(null);
        return;
      }

      try {
        const nextPackage = await pulpContentService.getRpmPackage(packageId);
        if (active) {
          setPkg(nextPackage);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load package.");
        }
      }
    }

    void loadPackage();

    return () => {
      active = false;
    };
  }, [hasSession, packageId, setError]);

  return (
    <AdminShell
      title="Package Instance"
      description="View details for an RPM package content instance."
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
      ) : !pkg ? (
        <Card>Loading package details...</Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardTitle className="mb-2">{pkg.name}</CardTitle>
            <CardContent className="space-y-3 text-sm">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-md bg-zinc-900 px-2 py-1 text-xs font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
                  {pkg.version}-{pkg.release}
                </span>
                <span className="rounded-md border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700">
                  arch: {pkg.arch}
                </span>
                <span className="rounded-md border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700">
                  checksum: {pkg.checksum_type}
                </span>
              </div>
              <p>{valueOf(pkg.summary)}</p>
              <p className="whitespace-pre-wrap text-zinc-600 dark:text-zinc-400">
                {valueOf(pkg.description)}
              </p>
              {normalizeUrl(pkg.url) ? (
                <a
                  href={normalizeUrl(pkg.url) ?? ""}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  {normalizeUrl(pkg.url)}
                </a>
              ) : null}
            </CardContent>
          </Card>

          <section className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardTitle className="mb-1 text-sm">Package Size</CardTitle>
              <CardContent className="text-xl font-semibold">
                {formatBytes(pkg.size_package)}
              </CardContent>
            </Card>
            <Card>
              <CardTitle className="mb-1 text-sm">Installed Size</CardTitle>
              <CardContent className="text-xl font-semibold">
                {formatBytes(pkg.size_installed)}
              </CardContent>
            </Card>
            <Card>
              <CardTitle className="mb-1 text-sm">Archive Size</CardTitle>
              <CardContent className="text-xl font-semibold">
                {formatBytes(pkg.size_archive)}
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardTitle className="mb-2">Checksums</CardTitle>
            <CardContent>
              <TableWrapper>
                <Table>
                  <TableBody>
                    {[
                      ["MD5", pkg.md5],
                      ["SHA1", pkg.sha1],
                      ["SHA224", pkg.sha224],
                      ["SHA256", pkg.sha256],
                      ["SHA384", pkg.sha384],
                      ["SHA512", pkg.sha512],
                    ].map(([label, value]) => (
                      <TableRow key={label}>
                        <TableCell className="w-32 font-medium">{label}</TableCell>
                        <TableCell className="font-mono text-xs">{valueOf(value)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableWrapper>
            </CardContent>
          </Card>

          <section className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardTitle className="mb-2">Requires ({pkg.requires.length})</CardTitle>
              <CardContent>
                <TableWrapper>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeaderCell>Name</TableHeaderCell>
                        <TableHeaderCell>Relation</TableHeaderCell>
                        <TableHeaderCell>Version</TableHeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pkg.requires.slice(0, 30).map((dep, idx) => (
                        <TableRow key={`req-${idx}`}>
                          <TableCell>{valueOf(dep[0])}</TableCell>
                          <TableCell>{valueOf(dep[1])}</TableCell>
                          <TableCell>{`${valueOf(dep[3])}-${valueOf(dep[4])}`}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableWrapper>
              </CardContent>
            </Card>

            <Card>
              <CardTitle className="mb-2">Provides ({pkg.provides.length})</CardTitle>
              <CardContent>
                <TableWrapper>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeaderCell>Name</TableHeaderCell>
                        <TableHeaderCell>Relation</TableHeaderCell>
                        <TableHeaderCell>Version</TableHeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pkg.provides.slice(0, 30).map((dep, idx) => (
                        <TableRow key={`prov-${idx}`}>
                          <TableCell>{valueOf(dep[0])}</TableCell>
                          <TableCell>{valueOf(dep[1])}</TableCell>
                          <TableCell>{`${valueOf(dep[3])}-${valueOf(dep[4])}`}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableWrapper>
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardTitle className="mb-2">Files ({pkg.files.length})</CardTitle>
            <CardContent>
              <TableWrapper>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Directory</TableHeaderCell>
                      <TableHeaderCell>Filename</TableHeaderCell>
                      <TableHeaderCell>Checksum</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pkg.files.slice(0, 80).map((file, idx) => (
                      <TableRow key={`file-${idx}`}>
                        <TableCell className="font-mono text-xs">{valueOf(file[1])}</TableCell>
                        <TableCell>{valueOf(file[2])}</TableCell>
                        <TableCell className="font-mono text-xs">{valueOf(file[3])}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableWrapper>
            </CardContent>
          </Card>

          <Card>
            <CardTitle className="mb-2">Changelog ({pkg.changelogs.length})</CardTitle>
            <CardContent className="space-y-2 text-sm">
              {pkg.changelogs.map((entry, idx) => (
                <div key={`changelog-${idx}`} className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
                  <div className="font-medium">{valueOf(entry[0])}</div>
                  <div className="text-xs text-zinc-500">{valueOf(entry[1])}</div>
                  <div className="mt-1 whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
                    {valueOf(entry[2])}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div>
            <Link
              href="/content/list"
              className="inline-flex rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              Back to Content List
            </Link>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
