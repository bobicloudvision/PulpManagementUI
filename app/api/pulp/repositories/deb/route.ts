import { cookies } from "next/headers";
import { getPulpApiUrl, PULP_AUTH_COOKIE, pulpFetch, toBasicAuthHeader } from "@/lib/pulp";
import { requirePulpAuth } from "@/app/api/pulp/_helpers";
import {
  authHeaders,
  normalizePulpHrefToApiPath,
  readDetail,
  TaskRefResponse,
  waitForTask,
} from "../_server";

type PulpDebRepositoryRow = {
  name: string;
  pulp_href: string;
};

type PulpDebRepositoryListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: PulpDebRepositoryRow[];
};

type DeleteBody = {
  pulp_href?: string;
};

export async function GET(request: Request) {
  const authResult = await requirePulpAuth();
  if (!authResult.ok) {
    return authResult.response;
  }

  const url = new URL(request.url);
  const limit = url.searchParams.get("limit") ?? "200";
  const offset = url.searchParams.get("offset") ?? "0";

  const result = await pulpFetch<PulpDebRepositoryListResponse>(
    `/repositories/deb/apt/?limit=${encodeURIComponent(limit)}&offset=${encodeURIComponent(offset)}`,
    authResult.auth
  );

  if (!result.ok) {
    if (result.status === 401 || result.status === 403) {
      const cookieStore = await cookies();
      cookieStore.delete(PULP_AUTH_COOKIE);
    }

    return Response.json({ detail: result.detail }, { status: result.status });
  }

  return Response.json(result.data);
}

export async function DELETE(request: Request) {
  const authResult = await requirePulpAuth();
  if (!authResult.ok) {
    return authResult.response;
  }

  const body = (await request.json()) as DeleteBody;
  const pulpHref = body.pulp_href?.trim();
  if (!pulpHref) {
    return Response.json({ detail: "pulp_href is required." }, { status: 400 });
  }

  const authHeader = toBasicAuthHeader(authResult.auth);
  const apiPath = normalizePulpHrefToApiPath(pulpHref);
  const deleteResponse = await fetch(getPulpApiUrl(apiPath), {
    method: "DELETE",
    headers: authHeaders(authHeader),
    cache: "no-store",
  });

  if (deleteResponse.status === 204 || deleteResponse.status === 202) {
    if (deleteResponse.status === 202) {
      const ct = deleteResponse.headers.get("content-type") ?? "";
      if (ct.includes("application/json")) {
        const payload = (await deleteResponse.json()) as TaskRefResponse;
        if (payload.task) {
          await waitForTask(payload.task, authHeader);
        }
      }
    }
    return Response.json({ ok: true });
  }

  if (!deleteResponse.ok) {
    if (deleteResponse.status === 401 || deleteResponse.status === 403) {
      const cookieStore = await cookies();
      cookieStore.delete(PULP_AUTH_COOKIE);
    }
    return Response.json({ detail: await readDetail(deleteResponse) }, { status: deleteResponse.status });
  }

  const ct = deleteResponse.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    const payload = (await deleteResponse.json()) as TaskRefResponse;
    if (payload.task) {
      await waitForTask(payload.task, authHeader);
    }
  }

  return Response.json({ ok: true });
}
