import { cookies } from "next/headers";
import { PULP_AUTH_COOKIE, pulpFetch } from "@/lib/pulp";
import { requirePulpAuth } from "../_helpers";

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

type PulpListResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

type CreatePulpUserPayload = {
  username: string;
  password: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  is_staff?: boolean;
  is_active?: boolean;
};

export async function GET() {
  const authResult = await requirePulpAuth();
  if (!authResult.ok) {
    return authResult.response;
  }

  const result = await pulpFetch<PulpListResponse<PulpUser>>("/users/", authResult.auth);
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

  let payload: Partial<CreatePulpUserPayload> | null = null;
  try {
    payload = (await request.json()) as Partial<CreatePulpUserPayload>;
  } catch {
    return Response.json({ detail: "Invalid request body." }, { status: 400 });
  }

  if (!payload?.username?.trim() || !payload?.password) {
    return Response.json(
      { detail: "Both username and password are required." },
      { status: 400 }
    );
  }

  const createPayload: CreatePulpUserPayload = {
    username: payload.username.trim(),
    password: payload.password,
    first_name: payload.first_name?.trim() || "",
    last_name: payload.last_name?.trim() || "",
    email: payload.email?.trim() || "",
    is_staff: Boolean(payload.is_staff),
    is_active: payload.is_active ?? true,
  };

  const result = await pulpFetch<PulpUser>("/users/", authResult.auth, {
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
