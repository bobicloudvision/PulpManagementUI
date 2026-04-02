import { cookies } from "next/headers";
import { PULP_AUTH_COOKIE, pulpFetch } from "@/lib/pulp";
import { requirePulpAuth } from "@/app/api/pulp/_helpers";
import { extractNextApiPath, normalizePulpHrefToApiPath, PulpPaginatedJson } from "../_server";

type ContentRow = Record<string, unknown>;

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

  const apiRelative = normalizePulpHrefToApiPath(decodedHref);
  const basePath = apiRelative.endsWith("/") ? apiRelative : `${apiRelative}/`;
  const contentListPath = `${basePath}content/`;

  const allResults: ContentRow[] = [];
  let nextPath: string | null = contentListPath;

  while (nextPath) {
    const result = await pulpFetch<PulpPaginatedJson<ContentRow>>(nextPath, authResult.auth);
    if (!result.ok) {
      if (result.status === 401 || result.status === 403) {
        const cookieStore = await cookies();
        cookieStore.delete(PULP_AUTH_COOKIE);
      }
      return Response.json({ detail: result.detail }, { status: result.status });
    }

    allResults.push(...result.data.results);
    nextPath = extractNextApiPath(result.data.next);
  }

  return Response.json({
    count: allResults.length,
    results: allResults,
  });
}
