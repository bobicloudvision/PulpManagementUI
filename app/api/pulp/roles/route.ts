import { cookies } from "next/headers";
import { PULP_AUTH_COOKIE, pulpFetch } from "@/lib/pulp";
import { requirePulpAuth } from "../_helpers";
import {
  CreatePulpRolePayload,
  PulpPaginatedResponse,
  PulpRole,
} from "@/services/pulp/types";

function parseOffset(value: string | null): number {
  const n = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(n) || n < 0) {
    return 0;
  }
  return n;
}

function parseLimit(value: string | null): number {
  const n = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(n) || n < 1) {
    return 100;
  }
  return Math.min(500, n);
}

export async function GET(request: Request) {
  const authResult = await requirePulpAuth();
  if (!authResult.ok) {
    return authResult.response;
  }

  const url = new URL(request.url);
  const limit = parseLimit(url.searchParams.get("limit"));
  const offset = parseOffset(url.searchParams.get("offset"));

  const qs = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  const result = await pulpFetch<PulpPaginatedResponse<PulpRole>>(
    `/roles/?${qs.toString()}`,
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

function normalizePermissions(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((s) => s.length > 0);
}

export async function POST(request: Request) {
  const authResult = await requirePulpAuth();
  if (!authResult.ok) {
    return authResult.response;
  }

  let payload: Partial<CreatePulpRolePayload> | null = null;
  try {
    payload = (await request.json()) as Partial<CreatePulpRolePayload>;
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

  const description =
    typeof payload?.description === "string" ? payload.description.trim() : "";

  const createBody: Record<string, unknown> = {
    name,
    permissions,
  };
  if (description.length > 0) {
    createBody.description = description;
  }

  const result = await pulpFetch<PulpRole>("/roles/", authResult.auth, {
    method: "POST",
    body: JSON.stringify(createBody),
  });

  if (!result.ok) {
    if (result.status === 401 || result.status === 403) {
      const cookieStore = await cookies();
      cookieStore.delete(PULP_AUTH_COOKIE);
    }

    return Response.json({ detail: result.detail }, { status: result.status });
  }

  return Response.json(result.data, { status: 201 });
}
