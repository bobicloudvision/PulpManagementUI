import { cookies } from "next/headers";
import { PULP_AUTH_COOKIE, pulpFetch } from "@/lib/pulp";
import { requirePulpAuth } from "../../_helpers";

type PulpUser = {
  pulp_href: string;
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  is_staff: boolean;
  is_active: boolean;
  date_joined: string;
};

type UpdatePulpUserPayload = {
  username?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  is_staff?: boolean;
  is_active?: boolean;
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
    return Response.json({ detail: "User id is required." }, { status: 400 });
  }

  let payload: Partial<UpdatePulpUserPayload> | null = null;
  try {
    payload = (await request.json()) as Partial<UpdatePulpUserPayload>;
  } catch {
    return Response.json({ detail: "Invalid request body." }, { status: 400 });
  }

  const updatePayload: UpdatePulpUserPayload = {};
  if (typeof payload.username === "string") updatePayload.username = payload.username.trim();
  if (typeof payload.first_name === "string") updatePayload.first_name = payload.first_name.trim();
  if (typeof payload.last_name === "string") updatePayload.last_name = payload.last_name.trim();
  if (typeof payload.email === "string") updatePayload.email = payload.email.trim();
  if (typeof payload.is_staff === "boolean") updatePayload.is_staff = payload.is_staff;
  if (typeof payload.is_active === "boolean") updatePayload.is_active = payload.is_active;

  if (Object.keys(updatePayload).length === 0) {
    return Response.json(
      { detail: "At least one user field must be provided." },
      { status: 400 }
    );
  }

  const result = await pulpFetch<PulpUser>(`/users/${id}/`, authResult.auth, {
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
    return Response.json({ detail: "User id is required." }, { status: 400 });
  }

  const result = await pulpFetch(`/users/${id}/`, authResult.auth, {
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
