import { cookies } from "next/headers";
import {
  getPulpApiUrl,
  PULP_AUTH_COOKIE,
  pulpFetch,
  toBasicAuthHeader,
  type PulpAuth,
} from "@/lib/pulp";
import { requirePulpAuth } from "@/app/api/pulp/_helpers";
import {
  authHeaders,
  extractNextApiPath,
  normalizePulpHrefToApiPath,
  readDetail,
  TaskRefResponse,
  TaskResponse,
  toPulpHrefPath,
  waitForTask,
} from "@/app/api/pulp/repositories/_server";

type CreateBody = {
  repository?: string;
  name?: string;
  base_path?: string;
};

type PulpRpmDistribution = {
  pulp_href: string;
  base_url: string;
  base_path: string;
  name: string;
  repository: string | null;
};

function firstCreatedResourceHref(task: TaskResponse): string | null {
  const cr = task.created_resources;
  if (!cr?.length) return null;
  const first = cr[0];
  if (typeof first === "string") return first;
  if (first && typeof first === "object") {
    const o = first as Record<string, unknown>;
    const h = o.pulp_href ?? o.href;
    if (typeof h === "string") return h;
  }
  return null;
}

function isRpmRepositoryPath(path: string): boolean {
  return path.includes("/repositories/rpm/rpm/");
}

function repoRefKey(href: string): string {
  return normalizePulpHrefToApiPath(href).replace(/\/+$/, "");
}

type RpmDistListPage = {
  next: string | null;
  results: Array<{ pulp_href: string; repository: string | null }>;
};

async function findFirstLinkedRpmDistributionHref(
  repoHref: string,
  auth: PulpAuth
): Promise<
  | { ok: true; pulp_href: string | null }
  | { ok: false; status: number; detail: string }
> {
  const want = repoRefKey(repoHref);
  let listPath: string | null = "/distributions/rpm/rpm/?limit=200";

  while (listPath) {
    const pageResult = await pulpFetch<RpmDistListPage>(listPath, auth);
    if (!pageResult.ok) {
      return { ok: false, status: pageResult.status, detail: pageResult.detail };
    }
    const page = pageResult.data;
    for (const row of page.results) {
      if (row.repository && repoRefKey(row.repository) === want) {
        return { ok: true, pulp_href: row.pulp_href };
      }
    }
    listPath = extractNextApiPath(page.next);
  }

  return { ok: true, pulp_href: null };
}

async function finalizeDistributionWrite(
  authHeader: string,
  pulpHref: string | null,
  fallbackName: string,
  fallbackBasePath: string,
  taskHref: string | null
): Promise<Response> {
  let hrefOut = pulpHref;

  try {
    if (taskHref) {
      const task = await waitForTask(taskHref, authHeader);
      hrefOut = firstCreatedResourceHref(task) ?? hrefOut;
    }
  } catch (error) {
    return Response.json(
      { detail: error instanceof Error ? error.message : "Distribution task failed." },
      { status: 500 }
    );
  }

  let baseUrl: string | null = null;
  let distName: string | null = null;
  let basePathOut = fallbackBasePath;

  if (hrefOut) {
    const detailPath = normalizePulpHrefToApiPath(hrefOut);
    const detailRes = await fetch(getPulpApiUrl(detailPath), {
      method: "GET",
      headers: authHeaders(authHeader),
      cache: "no-store",
    });
    if (detailRes.ok) {
      const dist = (await detailRes.json()) as PulpRpmDistribution;
      baseUrl = dist.base_url ?? baseUrl;
      distName = dist.name ?? distName;
      basePathOut = dist.base_path ?? basePathOut;
    }
  }

  return Response.json({
    name: distName ?? fallbackName,
    pulp_href: hrefOut,
    base_url: baseUrl,
    base_path: basePathOut,
    task: taskHref,
  });
}

export async function POST(request: Request) {
  const authResult = await requirePulpAuth();
  if (!authResult.ok) {
    return authResult.response;
  }

  const body = (await request.json()) as CreateBody;
  const repoHref = body.repository?.trim();
  const name = body.name?.trim();
  const basePath = body.base_path?.trim();

  if (!repoHref) {
    return Response.json({ detail: "repository (pulp_href) is required." }, { status: 400 });
  }
  if (!name) {
    return Response.json({ detail: "Distribution name is required." }, { status: 400 });
  }
  if (!basePath) {
    return Response.json({ detail: "base_path is required." }, { status: 400 });
  }

  const apiPath = normalizePulpHrefToApiPath(repoHref);
  if (!isRpmRepositoryPath(apiPath)) {
    return Response.json(
      { detail: "Only RPM repository hrefs can be bound to an RPM distribution." },
      { status: 400 }
    );
  }

  const authHeader = toBasicAuthHeader(authResult.auth);
  const headers = authHeaders(authHeader);
  headers.set("Content-Type", "application/json");

  const repositoryField = toPulpHrefPath(repoHref);

  const linked = await findFirstLinkedRpmDistributionHref(repoHref, authResult.auth);
  if (!linked.ok) {
    if (linked.status === 401 || linked.status === 403) {
      const cookieStore = await cookies();
      cookieStore.delete(PULP_AUTH_COOKIE);
    }
    return Response.json({ detail: linked.detail }, { status: linked.status });
  }

  if (linked.pulp_href) {
    const patchPath = normalizePulpHrefToApiPath(linked.pulp_href);
    const patchResponse = await fetch(getPulpApiUrl(patchPath), {
      method: "PATCH",
      headers,
      body: JSON.stringify({ name, base_path: basePath }),
      cache: "no-store",
    });

    if (!patchResponse.ok) {
      if (patchResponse.status === 401 || patchResponse.status === 403) {
        const cookieStore = await cookies();
        cookieStore.delete(PULP_AUTH_COOKIE);
      }
      return Response.json({ detail: await readDetail(patchResponse) }, { status: patchResponse.status });
    }

    let taskHref: string | null = null;
    const ct = patchResponse.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
      const rawText = await patchResponse.text();
      if (rawText) {
        try {
          const parsed = JSON.parse(rawText) as TaskRefResponse;
          taskHref = parsed.task ?? null;
        } catch {
          // Non-task JSON body — ignore.
        }
      }
    }

    return finalizeDistributionWrite(authHeader, linked.pulp_href, name, basePath, taskHref);
  }

  const createResponse = await fetch(getPulpApiUrl("/distributions/rpm/rpm/"), {
    method: "POST",
    headers,
    body: JSON.stringify({
      name,
      base_path: basePath,
      repository: repositoryField,
    }),
    cache: "no-store",
  });

  if (!createResponse.ok) {
    if (createResponse.status === 401 || createResponse.status === 403) {
      const cookieStore = await cookies();
      cookieStore.delete(PULP_AUTH_COOKIE);
    }
    return Response.json({ detail: await readDetail(createResponse) }, { status: createResponse.status });
  }

  const raw = (await createResponse.json()) as TaskRefResponse & Partial<PulpRpmDistribution>;
  const pulpHref = raw.pulp_href ?? raw.href ?? null;

  return finalizeDistributionWrite(authHeader, pulpHref, name, basePath, raw.task ?? null);
}
