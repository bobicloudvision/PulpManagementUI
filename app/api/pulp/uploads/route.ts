import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { getPulpApiUrl, getPulpBaseUrl, PULP_AUTH_COOKIE, toBasicAuthHeader } from "@/lib/pulp";
import { requirePulpAuth } from "../_helpers";

const CHUNK_SIZE = 8 * 1024 * 1024;

type CreateUploadResponse = {
  pulp_href: string;
  href?: string;
};

type CommitUploadResponse = {
  task?: string;
  artifact?: string;
  pulp_href?: string;
  href?: string;
};

type TaskResponse = {
  state?: string;
  error?: unknown;
  created_resources?: string[];
  pulp_href?: string;
  artifact?: string;
};

type PulpArtifactItem = {
  pulp_href?: string;
  href?: string;
};

type PulpArtifactListResponse = {
  results?: PulpArtifactItem[];
};

async function readDetail(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { detail?: string };
    if (typeof payload.detail === "string" && payload.detail.length > 0) {
      return payload.detail;
    }
  } catch {
    // Ignore parse errors and return fallback.
  }

  return response.statusText || `Pulp request failed with status ${response.status}.`;
}

function authHeaders(authHeader: string): Headers {
  const headers = new Headers();
  headers.set("Authorization", authHeader);
  headers.set("Accept", "application/json");
  return headers;
}

function normalizePulpHrefToApiPath(href: string): string {
  const rawPath = href.startsWith("http://") || href.startsWith("https://") ? new URL(href).pathname : href;
  const normalizedRawPath = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;

  const baseUrlPath = new URL(getPulpBaseUrl()).pathname.replace(/\/+$/, "");
  if (baseUrlPath && normalizedRawPath.startsWith(baseUrlPath)) {
    const withoutBase = normalizedRawPath.slice(baseUrlPath.length);
    return withoutBase.startsWith("/") ? withoutBase : `/${withoutBase}`;
  }

  return normalizedRawPath;
}

function extractSha256FromDuplicateError(errorText: string): string | null {
  const match = errorText.match(/sha256 checksum of ['"]([a-f0-9]{64})['"]/i);
  return match?.[1] ?? null;
}

async function findArtifactBySha256(authHeader: string, sha256: string): Promise<string | null> {
  const response = await fetch(getPulpApiUrl(`/artifacts/?sha256=${encodeURIComponent(sha256)}`), {
    method: "GET",
    headers: authHeaders(authHeader),
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as PulpArtifactListResponse;
  const first = payload.results?.[0];
  return first?.pulp_href ?? first?.href ?? null;
}

async function waitForTask(taskHref: string, authHeader: string): Promise<TaskResponse> {
  const maxAttempts = 60;
  const taskPath = normalizePulpHrefToApiPath(taskHref);

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const taskResponse = await fetch(getPulpApiUrl(taskPath), {
      method: "GET",
      headers: authHeaders(authHeader),
      cache: "no-store",
    });

    if (!taskResponse.ok) {
      throw new Error(await readDetail(taskResponse));
    }

    const task = (await taskResponse.json()) as TaskResponse;
    if (task.state === "completed") {
      return task;
    }

    if (task.state === "failed" || task.state === "canceled") {
      const serializedError =
        typeof task.error === "string" ? task.error : JSON.stringify(task.error ?? "Task failed");
      throw new Error(serializedError);
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  throw new Error("Task did not complete within timeout period.");
}

export async function POST(request: Request) {
  const authResult = await requirePulpAuth();
  if (!authResult.ok) {
    return authResult.response;
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ detail: "Missing file." }, { status: 400 });
  }

  const fileBuffer = Buffer.from(await file.arrayBuffer());
  if (fileBuffer.byteLength === 0) {
    return Response.json({ detail: "File must not be empty." }, { status: 400 });
  }

  const sha256 = createHash("sha256").update(fileBuffer).digest("hex");
  const authHeader = toBasicAuthHeader(authResult.auth);

  const createHeaders = authHeaders(authHeader);
  createHeaders.set("Content-Type", "application/json");
  const createUploadResponse = await fetch(getPulpApiUrl("/uploads/"), {
    method: "POST",
    headers: createHeaders,
    body: JSON.stringify({ size: fileBuffer.byteLength }),
    cache: "no-store",
  });

  if (!createUploadResponse.ok) {
    if (createUploadResponse.status === 401 || createUploadResponse.status === 403) {
      const cookieStore = await cookies();
      cookieStore.delete(PULP_AUTH_COOKIE);
    }

    return Response.json({ detail: await readDetail(createUploadResponse) }, { status: createUploadResponse.status });
  }

  const created = (await createUploadResponse.json()) as CreateUploadResponse;
  const uploadHref = created.pulp_href ?? created.href;
  if (!uploadHref) {
    return Response.json({ detail: "Upload creation failed." }, { status: 502 });
  }

  for (let start = 0; start < fileBuffer.byteLength; start += CHUNK_SIZE) {
    const end = Math.min(fileBuffer.byteLength - 1, start + CHUNK_SIZE - 1);
    const chunk = fileBuffer.subarray(start, end + 1);
    const uploadChunkHeaders = authHeaders(authHeader);
    uploadChunkHeaders.set("Content-Range", `bytes ${start}-${end}/*`);

    const chunkUrl = getPulpApiUrl(normalizePulpHrefToApiPath(uploadHref));
    const chunkForm = new FormData();
    const chunkBlob = new Blob([chunk], { type: "application/octet-stream" });
    chunkForm.set("file", chunkBlob, "chunk");

    const uploadChunkResponse = await fetch(chunkUrl, {
      method: "PUT",
      headers: uploadChunkHeaders,
      body: chunkForm,
      cache: "no-store",
    });

    if (!uploadChunkResponse.ok) {
      if (uploadChunkResponse.status === 401 || uploadChunkResponse.status === 403) {
        const cookieStore = await cookies();
        cookieStore.delete(PULP_AUTH_COOKIE);
      }

      return Response.json({ detail: await readDetail(uploadChunkResponse) }, { status: uploadChunkResponse.status });
    }
  }

  const commitHeaders = authHeaders(authHeader);
  commitHeaders.set("Content-Type", "application/json");
  const commitUploadResponse = await fetch(
    getPulpApiUrl(normalizePulpHrefToApiPath(`${uploadHref}commit/`)),
    {
      method: "POST",
      headers: commitHeaders,
      body: JSON.stringify({ sha256 }),
      cache: "no-store",
    }
  );

  if (!commitUploadResponse.ok) {
    if (commitUploadResponse.status === 401 || commitUploadResponse.status === 403) {
      const cookieStore = await cookies();
      cookieStore.delete(PULP_AUTH_COOKIE);
    }

    return Response.json({ detail: await readDetail(commitUploadResponse) }, { status: commitUploadResponse.status });
  }

  const committed = (await commitUploadResponse.json()) as CommitUploadResponse;
  let artifact: string | null = committed.artifact ?? committed.pulp_href ?? committed.href ?? null;

  if (committed.task) {
    try {
      const task = await waitForTask(committed.task, authHeader);
      artifact =
        task.created_resources?.[0] ??
        task.artifact ??
        task.pulp_href ??
        artifact;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const duplicateSha256 = extractSha256FromDuplicateError(message);

      if (!duplicateSha256) {
        throw error;
      }

      const existingArtifact = await findArtifactBySha256(authHeader, duplicateSha256);
      if (!existingArtifact) {
        throw error;
      }

      artifact = existingArtifact;
    }
  }

  return Response.json({
    filename: file.name,
    size: fileBuffer.byteLength,
    sha256,
    upload: uploadHref,
    artifact,
    task: committed.task ?? null,
  });
}
