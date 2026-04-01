import { cookies } from "next/headers";
import { PULP_AUTH_COOKIE, pulpFetch } from "@/lib/pulp";
import { requirePulpAuth } from "../_helpers";

type PulpUploadItem = {
  pulp_href: string;
  pulp_created: string;
  size: number;
};

type PulpPaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export async function GET(request: Request) {
  const authResult = await requirePulpAuth();
  if (!authResult.ok) {
    return authResult.response;
  }

  const url = new URL(request.url);
  const limit = url.searchParams.get("limit") ?? "50";
  const offset = url.searchParams.get("offset") ?? "0";

  const result = await pulpFetch<PulpPaginatedResponse<PulpUploadItem>>(
    `/uploads/?limit=${encodeURIComponent(limit)}&offset=${encodeURIComponent(offset)}`,
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
