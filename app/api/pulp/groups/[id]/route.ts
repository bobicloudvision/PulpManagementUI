import { cookies } from "next/headers";
import { PULP_AUTH_COOKIE, pulpFetch } from "@/lib/pulp";
import { requirePulpAuth } from "../../_helpers";

type PulpGroup = {
  pulp_href: string;
  id: number;
  name: string;
};

type UpdatePulpGroupPayload = {
  name?: string;
};

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
    return Response.json({ detail: "Group id is required." }, { status: 400 });
  }

  let payload: Partial<UpdatePulpGroupPayload> | null = null;
  try {
    payload = (await request.json()) as Partial<UpdatePulpGroupPayload>;
  } catch {
    return Response.json({ detail: "Invalid request body." }, { status: 400 });
  }

  const updatePayload: UpdatePulpGroupPayload = {};
  if (typeof payload.name === "string") updatePayload.name = payload.name.trim();

  if (!updatePayload.name) {
    return Response.json({ detail: "Group name is required." }, { status: 400 });
  }

  const result = await pulpFetch<PulpGroup>(`/groups/${id}/`, authResult.auth, {
    method: "PATCH",
    body: JSON.stringify(updatePayload),
  });

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
    return Response.json({ detail: "Group id is required." }, { status: 400 });
  }

  const result = await pulpFetch(`/groups/${id}/`, authResult.auth, {
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
