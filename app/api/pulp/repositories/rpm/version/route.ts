import { cookies } from "next/headers";
import { getPulpApiUrl, PULP_AUTH_COOKIE, toBasicAuthHeader } from "@/lib/pulp";
import { requirePulpAuth } from "@/app/api/pulp/_helpers";
import {
  authHeaders,
  normalizePulpHrefToApiPath,
  readDetail,
  TaskRefResponse,
  waitForTask,
} from "../../_server";
import { isRpmRepositoryVersionInstancePath, mapPulpRpmRepositoryVersion } from "../rpm-version-map";

type DeleteBody = {
  pulp_href?: string;
};

export async function GET(request: Request) {
  const authResult = await requirePulpAuth();
  if (!authResult.ok) {
    return authResult.response;
  }

  const url = new URL(request.url);
  const pulpHref = url.searchParams.get("pulp_href")?.trim();
  if (!pulpHref) {
    return Response.json({ detail: "Query pulp_href is required." }, { status: 400 });
  }

  let decodedHref: string;
  try {
    decodedHref = decodeURIComponent(pulpHref);
  } catch {
    decodedHref = pulpHref;
  }

  const apiPath = normalizePulpHrefToApiPath(decodedHref);
  if (!isRpmRepositoryVersionInstancePath(apiPath)) {
    return Response.json(
      { detail: "pulp_href must be a single RPM repository version (…/versions/{number}/)." },
      { status: 400 }
    );
  }

  const authHeader = toBasicAuthHeader(authResult.auth);
  const detailResponse = await fetch(getPulpApiUrl(apiPath), {
    method: "GET",
    headers: authHeaders(authHeader),
    cache: "no-store",
  });

  if (!detailResponse.ok) {
    if (detailResponse.status === 401 || detailResponse.status === 403) {
      const cookieStore = await cookies();
      cookieStore.delete(PULP_AUTH_COOKIE);
    }
    return Response.json({ detail: await readDetail(detailResponse) }, { status: detailResponse.status });
  }

  const row = (await detailResponse.json()) as Record<string, unknown>;
  return Response.json(mapPulpRpmRepositoryVersion(row));
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

  const apiPath = normalizePulpHrefToApiPath(pulpHref);
  if (!isRpmRepositoryVersionInstancePath(apiPath)) {
    return Response.json(
      { detail: "pulp_href must be a single RPM repository version (…/versions/{number}/)." },
      { status: 400 }
    );
  }

  const authHeader = toBasicAuthHeader(authResult.auth);
  const deleteResponse = await fetch(getPulpApiUrl(apiPath), {
    method: "DELETE",
    headers: authHeaders(authHeader),
    cache: "no-store",
  });

  if (deleteResponse.status === 204) {
    return Response.json({ ok: true });
  }

  if (deleteResponse.status === 202) {
    const ct = deleteResponse.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
      try {
        const raw = await deleteResponse.text();
        if (raw) {
          const payload = JSON.parse(raw) as TaskRefResponse;
          if (payload.task) {
            try {
              await waitForTask(payload.task, authHeader);
            } catch (error) {
              return Response.json(
                {
                  detail:
                    error instanceof Error ? error.message : "Repository version delete task failed.",
                },
                { status: 500 }
              );
            }
          }
        }
      } catch {
        // Treat as accepted.
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
    try {
      const raw = await deleteResponse.text();
      if (raw) {
        const payload = JSON.parse(raw) as TaskRefResponse;
        if (payload.task) {
          await waitForTask(payload.task, authHeader);
        }
      }
    } catch {
      // ignore
    }
  }

  return Response.json({ ok: true });
}
