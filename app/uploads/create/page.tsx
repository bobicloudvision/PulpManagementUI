"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/pulp/admin-shell";
import { usePulpAuthContext } from "@/components/pulp/auth-context";
import { usePulpGroups } from "@/components/pulp/use-pulp-groups";
import { useRequireAuth } from "@/components/pulp/use-require-auth";
import { usePulpUsers } from "@/components/pulp/use-pulp-users";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { pulpUploadService } from "@/services/pulp/upload-service";
import { PulpUploadAsRpmResult, PulpUploadCreateResult } from "@/services/pulp/types";

function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "-";
  if (value === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exp = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const formatted = value / 1024 ** exp;
  return `${formatted.toFixed(exp === 0 ? 0 : 2)} ${units[exp]}`;
}

export default function UploadsCreatePage() {
  const { sessionUser, isLoading, isCheckingSession, hasSession, error, setError, logout } =
    usePulpAuthContext();
  const isRedirectingToLogin = useRequireAuth({ hasSession, isCheckingSession });
  const { users } = usePulpUsers(hasSession);
  const { groups } = usePulpGroups(hasSession);

  const [isUploading, setIsUploading] = useState(false);
  const [isCreatingRpm, setIsCreatingRpm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<PulpUploadCreateResult | null>(null);
  const [rpmResult, setRpmResult] = useState<PulpUploadAsRpmResult | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFile) {
      setError("Please select a file.");
      return;
    }

    setError(null);
    setIsUploading(true);
    setResult(null);
    setRpmResult(null);

    try {
      const uploaded = await pulpUploadService.upload(selectedFile);
      setResult(uploaded);
      setSelectedFile(null);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleUploadAsRpm() {
    if (!result?.artifact) {
      setError("No artifact available for RPM creation.");
      return;
    }

    setError(null);
    setIsCreatingRpm(true);
    setRpmResult(null);

    try {
      const created = await pulpUploadService.uploadAsRpm(result.artifact);
      setRpmResult(created);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Failed to create RPM content.");
    } finally {
      setIsCreatingRpm(false);
    }
  }

  return (
    <AdminShell
      title="Upload File"
      description="Upload a file to Pulp using chunked upload."
      hasSession={hasSession}
      sessionUser={sessionUser}
      isLoading={isLoading || isUploading}
      usersCount={users.length}
      groupsCount={groups.length}
      error={error}
      onLogout={logout}
    >
      {isCheckingSession || isRedirectingToLogin ? (
        <Card>Checking existing session...</Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardTitle>New Upload</CardTitle>
            <CardContent>
              <form className="flex flex-col gap-4 md:max-w-2xl" onSubmit={handleSubmit}>
                <FormField label="File">
                  <Input
                    type="file"
                    onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                    required
                  />
                </FormField>
                {selectedFile ? (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Selected: {selectedFile.name} ({formatBytes(selectedFile.size)})
                  </p>
                ) : null}
                <div>
                  <Button type="submit" disabled={isUploading}>
                    {isUploading ? "Uploading..." : "Upload to Pulp"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {result ? (
            <Card>
              <CardTitle>Upload Result</CardTitle>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Filename:</span> {result.filename}
                </p>
                <p>
                  <span className="font-medium">Size:</span> {formatBytes(result.size)}
                </p>
                <p className="break-all">
                  <span className="font-medium">SHA256:</span> {result.sha256}
                </p>
                <p className="break-all">
                  <span className="font-medium">Upload Href:</span> {result.upload ?? "-"}
                </p>
                <p className="break-all">
                  <span className="font-medium">Artifact:</span> {result.artifact ?? "-"}
                </p>
                <p className="break-all">
                  <span className="font-medium">Task:</span> {result.task ?? "-"}
                </p>
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleUploadAsRpm}
                    disabled={!result.artifact || isCreatingRpm}
                  >
                    {isCreatingRpm ? "Uploading as RPM..." : "Upload as RPM"}
                  </Button>
                </div>
                {rpmResult ? (
                  <div className="space-y-2 rounded-md border border-zinc-200 p-3 dark:border-zinc-700">
                    <p className="break-all">
                      <span className="font-medium">RPM Content:</span> {rpmResult.content ?? "-"}
                    </p>
                    <p className="break-all">
                      <span className="font-medium">Task:</span> {rpmResult.task ?? "-"}
                    </p>
                    {rpmResult.content ? (
                      <Link
                        href={`/content/preview?href=${encodeURIComponent(rpmResult.content)}`}
                        className="inline-flex rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
                      >
                        Preview package
                      </Link>
                    ) : null}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}
    </AdminShell>
  );
}
