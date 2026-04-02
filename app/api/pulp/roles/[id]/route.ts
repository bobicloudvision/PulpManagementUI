import { cookies } from "next/headers";
import { PULP_AUTH_COOKIE, pulpFetch } from "@/lib/pulp";
import { requirePulpAuth } from "../../_helpers";
import {
  PutPulpRolePayload,
  PulpRole,
  UpdatePulpRolePayload,
} from "@/services/pulp/types";

const ROLE_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidRoleId(id: string): boolean {
  return ROLE_ID_RE.test(id.trim());
}

function normalizePermissions(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((s) => s.length > 0);
}

function roleDetailPath(id: string): string {
  return `/roles/${id.trim()}/`;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePulpAuth();
  if (!authResult.ok) {
    return authResult.response;
  }

  const { id: rawId } = await params;
  const id = rawId?.trim() ?? "";
  if (!id || !isValidRoleId(id)) {
    return Response.json({ detail: "Invalid role id." }, { status: 400 });
  }

  let payload: Partial<UpdatePulpRolePayload> | null = null;
  try {
    payload = (await request.json()) as Partial<UpdatePulpRolePayload>;
  } catch {
    return Response.json({ detail: "Invalid request body." }, { status: 400 });
  }

  const updateBody: Record<string, unknown> = {};

  if (typeof payload?.name === "string") {
    const name = payload.name.trim();
    if (!name) {
      return Response.json({ detail: "Role name cannot be empty." }, { status: 400 });
    }
    updateBody.name = name;
  }

  if ("description" in (payload ?? {})) {
    if (payload?.description === null) {
      updateBody.description = null;
    } else if (typeof payload?.description === "string") {
      const d = payload.description.trim();
      updateBody.description = d.length > 0 ? d : null;
    }
  }

  if (payload?.permissions !== undefined) {
    const permissions = normalizePermissions(payload.permissions);
    if (permissions.length === 0) {
      return Response.json(
        { detail: "At least one permission is required when updating permissions." },
        { status: 400 }
      );
    }
    updateBody.permissions = permissions;
  }

  if (Object.keys(updateBody).length === 0) {
    return Response.json(
      { detail: "At least one field must be provided (name, description, or permissions)." },
      { status: 400 }
    );
  }

  const result = await pulpFetch<PulpRole>(roleDetailPath(id), authResult.auth, {
    method: "PATCH",
    body: JSON.stringify(updateBody),
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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePulpAuth();
  if (!authResult.ok) {
    return authResult.response;
  }

  const { id: rawId } = await params;
  const id = rawId?.trim() ?? "";
  if (!id || !isValidRoleId(id)) {
    return Response.json({ detail: "Invalid role id." }, { status: 400 });
  }

  let payload: Partial<PutPulpRolePayload> | null = null;
  try {
    payload = (await request.json()) as Partial<PutPulpRolePayload>;
  } catch {
    return Response.json({ detail: "Invalid request body." }, { status: 400 });
  }

  const name = typeof payload?.name === "string" ? payload.name.trim() : "";
  const permissions = normalizePermissions(payload?.permissions);

  if (!name) {
    return Response.json({ detail: "Role name is required." }, { status: 400 });
  }

  if (permissions.length === 0) {
    return Response.json(
      { detail: "At least one permission is required." },
      { status: 400 }
    );
  }

  const putBody: PutPulpRolePayload = { name, permissions };

  if (payload?.description === null) {
    putBody.description = null;
  } else if (typeof payload?.description === "string") {
    const d = payload.description.trim();
    putBody.description = d.length > 0 ? d : null;
  }

  const result = await pulpFetch<PulpRole>(roleDetailPath(id), authResult.auth, {
    method: "PUT",
    body: JSON.stringify(putBody),
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

  const { id: rawId } = await params;
  const id = rawId?.trim() ?? "";
  if (!id || !isValidRoleId(id)) {
    return Response.json({ detail: "Invalid role id." }, { status: 400 });
  }

  const result = await pulpFetch(roleDetailPath(id), authResult.auth, {
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
