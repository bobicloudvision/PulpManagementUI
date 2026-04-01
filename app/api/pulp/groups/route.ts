import { cookies } from "next/headers";
import { PULP_AUTH_COOKIE, pulpFetch } from "@/lib/pulp";
import { requirePulpAuth } from "../_helpers";

type PulpGroup = {
  pulp_href: string;
  id: number;
  name: string;
};

type PulpListResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export async function GET() {
  const authResult = await requirePulpAuth();
  if (!authResult.ok) {
    return authResult.response;
  }

  const result = await pulpFetch<PulpListResponse<PulpGroup>>("/groups/", authResult.auth);
  if (!result.ok) {
    if (result.status === 401 || result.status === 403) {
      const cookieStore = await cookies();
      cookieStore.delete(PULP_AUTH_COOKIE);
    }

    return Response.json({ detail: result.detail }, { status: result.status });
  }

  return Response.json(result.data);
}
