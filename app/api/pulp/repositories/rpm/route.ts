import { cookies } from "next/headers";
import { getPulpApiUrl, getPulpBaseUrl, PULP_AUTH_COOKIE, toBasicAuthHeader } from "@/lib/pulp";
import { requirePulpAuth } from "@/app/api/pulp/_helpers";

type AddToRepositoryBody = {
  repositoryName?: string;
  content?: string;
};

type PulpRepository = {
  pulp_href?: string;
  href?: string;
};

type ListRepositoriesResponse = {
  results?: PulpRepository[];
};

type TaskResponse = {
  state?: string;
  error?: unknown;
  created_resources?: string[];
};

type TaskRefResponse = {
  task?: string;
  pulp_href?: string;
  href?: string;
};

async function readDetail(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { detail?: string };
    if (typeof payload.detail === "string" && payload.detail.length > 0) {
      return payload.detail;
    }
  } catch {
    // Ignore parsing failure.
  }

  return response.statusText || `Pulp request failed with status ${response.status}.`;
}

function getBaseApiPath(): string {
  return new URL(getPulpBaseUrl()).pathname.replace(/\/+$/, "");
}

function normalizePulpHrefToApiPath(href: string): string {
  const rawPath = href.startsWith("http://") || href.startsWith("https://") ? new URL(href).pathname : href;
  const normalizedRawPath = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
  const baseApiPath = getBaseApiPath();

  if (baseApiPath && normalizedRawPath.startsWith(baseApiPath)) {
    const withoutBase = normalizedRawPath.slice(baseApiPath.length);
    return withoutBase.startsWith("/") ? withoutBase : `/${withoutBase}`;
  }

  return normalizedRawPath;
}

function toPulpHrefPath(href: string): string {
  const rawPath = href.startsWith("http://") || href.startsWith("https://") ? new URL(href).pathname : href;
  const normalizedRawPath = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
  const baseApiPath = getBaseApiPath();

  if (baseApiPath && normalizedRawPath.startsWith(baseApiPath)) {
    return normalizedRawPath;
  }

  return `${baseApiPath}${normalizedRawPath}`;
}

function authHeaders(authHeader: string): Headers {
  const headers = new Headers();
  headers.set("Authorization", authHeader);
  headers.set("Accept", "application/json");
  return headers;
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

async function findOrCreateRepository(repositoryName: string, authHeader: string): Promise<string> {
  const listResponse = await fetch(
    getPulpApiUrl(`/repositories/rpm/rpm/?name=${encodeURIComponent(repositoryName)}`),
    { method: "GET", headers: authHeaders(authHeader), cache: "no-store" }
  );
  if (!listResponse.ok) {
    throw new Error(await readDetail(listResponse));
  }

  const listPayload = (await listResponse.json()) as ListRepositoriesResponse;
  const existing = listPayload.results?.[0];
  if (existing?.pulp_href || existing?.href) {
    return existing.pulp_href ?? existing.href ?? "";
  }

  const createHeaders = authHeaders(authHeader);
  createHeaders.set("Content-Type", "application/json");
  const createResponse = await fetch(getPulpApiUrl("/repositories/rpm/rpm/"), {
    method: "POST",
    headers: createHeaders,
    body: JSON.stringify({ name: repositoryName }),
    cache: "no-store",
  });
  if (!createResponse.ok) {
    throw new Error(await readDetail(createResponse));
  }

  const created = (await createResponse.json()) as TaskRefResponse;
  let repoHref = created.pulp_href ?? created.href ?? null;

  if (created.task) {
    const task = await waitForTask(created.task, authHeader);
    repoHref = task.created_resources?.[0] ?? repoHref;
  }

  if (!repoHref) {
    throw new Error("Repository creation completed without repository href.");
  }

  return repoHref;
}

export async function POST(request: Request) {
  const authResult = await requirePulpAuth();
  if (!authResult.ok) {
    return authResult.response;
  }

  const body = (await request.json()) as AddToRepositoryBody;
  const repositoryName = body.repositoryName?.trim();
  const content = body.content?.trim();
  if (!repositoryName) {
    return Response.json({ detail: "Repository name is required." }, { status: 400 });
  }
  if (!content) {
    return Response.json({ detail: "Content href is required." }, { status: 400 });
  }

  const authHeader = toBasicAuthHeader(authResult.auth);

  try {
    const repositoryHref = await findOrCreateRepository(repositoryName, authHeader);
    const modifyHeaders = authHeaders(authHeader);
    modifyHeaders.set("Content-Type", "application/json");

    const modifyResponse = await fetch(
      getPulpApiUrl(`${normalizePulpHrefToApiPath(repositoryHref)}modify/`),
      {
        method: "POST",
        headers: modifyHeaders,
        body: JSON.stringify({
          add_content_units: [toPulpHrefPath(content)],
        }),
        cache: "no-store",
      }
    );
    if (!modifyResponse.ok) {
      throw new Error(await readDetail(modifyResponse));
    }

    const modifyPayload = (await modifyResponse.json()) as TaskRefResponse;
    if (modifyPayload.task) {
      await waitForTask(modifyPayload.task, authHeader);
    }

    return Response.json({
      repository: repositoryHref,
      content: toPulpHrefPath(content),
      task: modifyPayload.task ?? null,
    });
  } catch (error) {
    if (error instanceof Error && /401|403/.test(error.message)) {
      const cookieStore = await cookies();
      cookieStore.delete(PULP_AUTH_COOKIE);
    }

    return Response.json(
      { detail: error instanceof Error ? error.message : "Failed to add content to repository." },
      { status: 500 }
    );
  }
}
