import { cookies } from "next/headers";
import { PULP_AUTH_COOKIE, pulpFetch } from "@/lib/pulp";
import { requirePulpAuth } from "@/app/api/pulp/_helpers";

type PulpRpmPackage = Record<string, unknown>;

function getPackagePath(id: string): string {
  return `/content/rpm/packages/${id}/`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePulpAuth();
  if (!authResult.ok) {
    return authResult.response;
  }

  const { id } = await params;
  if (!id) {
    return Response.json({ detail: "Package id is required." }, { status: 400 });
  }

  const result = await pulpFetch<PulpRpmPackage>(getPackagePath(id), authResult.auth);
  if (!result.ok) {
    if (result.status === 401 || result.status === 403) {
      const cookieStore = await cookies();
      cookieStore.delete(PULP_AUTH_COOKIE);
    }

    return Response.json({ detail: result.detail }, { status: result.status });
  }

  return Response.json(result.data);
}
