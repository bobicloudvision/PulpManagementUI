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

type CreatePulpGroupPayload = {
  name: string;
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

export async function POST(request: Request) {
  const authResult = await requirePulpAuth();
  if (!authResult.ok) {
    return authResult.response;
  }

  let payload: Partial<CreatePulpGroupPayload> | null = null;
  try {
    payload = (await request.json()) as Partial<CreatePulpGroupPayload>;
  } catch {
    return Response.json({ detail: "Invalid request body." }, { status: 400 });
  }

  if (!payload?.name?.trim()) {
    return Response.json({ detail: "Group name is required." }, { status: 400 });
  }

  const createPayload: CreatePulpGroupPayload = {
    name: payload.name.trim(),
  };

  const result = await pulpFetch<PulpGroup>("/groups/", authResult.auth, {
    method: "POST",
    body: JSON.stringify(createPayload),
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
