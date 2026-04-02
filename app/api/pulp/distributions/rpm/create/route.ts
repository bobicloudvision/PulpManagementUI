import { cookies } from "next/headers";
import { getPulpApiUrl, PULP_AUTH_COOKIE, toBasicAuthHeader } from "@/lib/pulp";
import { requirePulpAuth } from "@/app/api/pulp/_helpers";
import {
  authHeaders,
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

  let pulpHref = raw.pulp_href ?? raw.href ?? null;
  let baseUrl: string | null = typeof raw.base_url === "string" ? raw.base_url : null;
  let distName: string | null = typeof raw.name === "string" ? raw.name : null;

  try {
    if (raw.task) {
      const task = await waitForTask(raw.task, authHeader);
      pulpHref = firstCreatedResourceHref(task) ?? pulpHref;
    }
  } catch (error) {
    return Response.json(
      { detail: error instanceof Error ? error.message : "Distribution creation task failed." },
      { status: 500 }
    );
  }

  if (pulpHref && (!baseUrl || !distName)) {
    const detailPath = normalizePulpHrefToApiPath(pulpHref);
    const detailRes = await fetch(getPulpApiUrl(detailPath), {
      method: "GET",
      headers: authHeaders(authHeader),
      cache: "no-store",
    });
    if (detailRes.ok) {
      const dist = (await detailRes.json()) as PulpRpmDistribution;
      baseUrl = dist.base_url ?? baseUrl;
      distName = dist.name ?? distName;
    }
  }

  return Response.json({
    name: distName ?? name,
    pulp_href: pulpHref,
    base_url: baseUrl,
    base_path: basePath,
    task: raw.task ?? null,
  });
}
