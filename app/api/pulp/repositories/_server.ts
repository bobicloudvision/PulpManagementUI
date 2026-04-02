import { getPulpApiUrl, getPulpBaseUrl } from "@/lib/pulp";

export type TaskResponse = {
  state?: string;
  error?: unknown;
  created_resources?: string[];
};

export type TaskRefResponse = {
  task?: string;
  pulp_href?: string;
  href?: string;
};

export type PulpPaginatedJson<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export async function readDetail(response: Response): Promise<string> {
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

export function getBaseApiPath(): string {
  return new URL(getPulpBaseUrl()).pathname.replace(/\/+$/, "");
}

export function normalizePulpHrefToApiPath(href: string): string {
  const rawPath = href.startsWith("http://") || href.startsWith("https://") ? new URL(href).pathname : href;
  const normalizedRawPath = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
  const baseApiPath = getBaseApiPath();

  if (baseApiPath && normalizedRawPath.startsWith(baseApiPath)) {
    const withoutBase = normalizedRawPath.slice(baseApiPath.length);
    return withoutBase.startsWith("/") ? withoutBase : `/${withoutBase}`;
  }

  return normalizedRawPath;
}

export function toPulpHrefPath(href: string): string {
  const rawPath = href.startsWith("http://") || href.startsWith("https://") ? new URL(href).pathname : href;
  const normalizedRawPath = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
  const baseApiPath = getBaseApiPath();

  if (baseApiPath && normalizedRawPath.startsWith(baseApiPath)) {
    return normalizedRawPath;
  }

  return `${baseApiPath}${normalizedRawPath}`;
}

export function authHeaders(authHeader: string): Headers {
  const headers = new Headers();
  headers.set("Authorization", authHeader);
  headers.set("Accept", "application/json");
  return headers;
}

export function extractNextApiPath(next: string | null): string | null {
  if (!next) return null;
  const hrefMatch = next.match(/href="([^"]+)"/i);
  const normalized = hrefMatch?.[1] ?? next;
  try {
    const url = new URL(normalized);
    return normalizePulpHrefToApiPath(url.pathname + url.search);
  } catch {
    return normalizePulpHrefToApiPath(normalized);
  }
}

export async function waitForTask(taskHref: string, authHeader: string): Promise<TaskResponse> {
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
