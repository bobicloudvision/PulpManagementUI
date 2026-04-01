import { cookies } from "next/headers";
import { PULP_AUTH_COOKIE, pulpFetch } from "@/lib/pulp";
import { requirePulpAuth } from "../../_helpers";

type PulpDistribution = {
  pulp_href: string;
  pulp_created: string;
  base_path: string;
  base_url: string;
  content_guard: string | null;
  pulp_labels: Record<string, string>;
  name: string;
  repository: string | null;
  publication?: string | null;
};

type UpdatePulpDistributionPayload = {
  name?: string;
  base_path?: string;
  repository?: string | null;
  publication?: string | null;
  content_guard?: string | null;
};

function getRpmDistributionPath(id: string): string {
  return `/distributions/rpm/rpm/${id}/`;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePulpAuth();
  if (!authResult.ok) {
    return authResult.response;
  }

  const { id } = await params;
  if (!id) {
    return Response.json({ detail: "Distribution id is required." }, { status: 400 });
  }

  let payload: Partial<UpdatePulpDistributionPayload> | null = null;
  try {
    payload = (await request.json()) as Partial<UpdatePulpDistributionPayload>;
  } catch {
    return Response.json({ detail: "Invalid request body." }, { status: 400 });
  }

  const updatePayload: UpdatePulpDistributionPayload = {};
  if (typeof payload.name === "string") updatePayload.name = payload.name.trim();
  if (typeof payload.base_path === "string")
    updatePayload.base_path = payload.base_path.trim();
  if ("repository" in (payload ?? {})) {
    updatePayload.repository = payload.repository ?? null;
  }
  if ("publication" in (payload ?? {})) {
    updatePayload.publication = payload.publication ?? null;
  }
  if ("content_guard" in (payload ?? {})) {
    updatePayload.content_guard = payload.content_guard ?? null;
  }

  if (Object.keys(updatePayload).length === 0) {
    return Response.json(
      { detail: "At least one distribution field must be provided." },
      { status: 400 }
    );
  }

  const result = await pulpFetch<PulpDistribution>(
    getRpmDistributionPath(id),
    authResult.auth,
    {
      method: "PATCH",
      body: JSON.stringify(updatePayload),
    }
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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePulpAuth();
  if (!authResult.ok) {
    return authResult.response;
  }

  const { id } = await params;
  if (!id) {
    return Response.json({ detail: "Distribution id is required." }, { status: 400 });
  }

  const result = await pulpFetch(getRpmDistributionPath(id), authResult.auth, {
    method: "DELETE",
  });

  if (!result.ok) {
    if (result.status === 401 || result.status === 403) {
      const cookieStore = await cookies();
      cookieStore.delete(PULP_AUTH_COOKIE);
    }

    return Response.json({ detail: result.detail }, { status: result.status });
  }

  return Response.json({ ok: true });
}
