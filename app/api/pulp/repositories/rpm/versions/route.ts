import { cookies } from "next/headers";
import { PULP_AUTH_COOKIE, pulpFetch } from "@/lib/pulp";
import { requirePulpAuth } from "@/app/api/pulp/_helpers";
import type { PulpRpmRepositoryVersion } from "@/services/pulp/types";
import { mapPulpRpmRepositoryVersion } from "../rpm-version-map";
import { extractNextApiPath, normalizePulpHrefToApiPath, PulpPaginatedJson } from "../../_server";

function resolveVersionsListPath(apiPath: string): string | { error: string } {
  if (!apiPath.includes("/repositories/rpm/rpm/")) {
    return { error: "Only RPM repository hrefs are supported." };
  }

  if (/\/versions\/\d+\/?$/.test(apiPath)) {
    return { error: "Use the repository href, not a single version href." };
  }

  if (apiPath.endsWith("/versions/") || apiPath.endsWith("/versions")) {
    return apiPath.endsWith("/") ? apiPath : `${apiPath}/`;
  }

  const base = apiPath.endsWith("/") ? apiPath : `${apiPath}/`;
  return `${base}versions/`;
}

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
  const resolved = resolveVersionsListPath(apiPath);
  if (typeof resolved !== "string") {
    return Response.json({ detail: resolved.error }, { status: 400 });
  }

  const allResults: PulpRpmRepositoryVersion[] = [];
  let nextPath: string | null = resolved;

  while (nextPath) {
    const result = await pulpFetch<PulpPaginatedJson<Record<string, unknown>>>(
      nextPath,
      authResult.auth
    );
    if (!result.ok) {
      if (result.status === 401 || result.status === 403) {
        const cookieStore = await cookies();
        cookieStore.delete(PULP_AUTH_COOKIE);
      }
      return Response.json({ detail: result.detail }, { status: result.status });
    }

    for (const row of result.data.results) {
      allResults.push(mapPulpRpmRepositoryVersion(row));
    }
    nextPath = extractNextApiPath(result.data.next);
  }

  return Response.json({
    count: allResults.length,
    results: allResults,
  });
}
