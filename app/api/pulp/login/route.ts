import { cookies } from "next/headers";
import {
  decodePulpAuth,
  encodePulpAuth,
  PULP_AUTH_COOKIE,
  PulpAuth,
  pulpFetch,
} from "@/lib/pulp";

type PulpUser = {
  username: string;
};

type PulpListResponse<T> = {
  results: T[];
};

export async function POST(request: Request) {
  let payload: Partial<PulpAuth> | null = null;

  try {
    payload = (await request.json()) as Partial<PulpAuth>;
  } catch {
    return Response.json({ detail: "Invalid request body." }, { status: 400 });
  }

  if (!payload?.username || !payload?.password) {
    return Response.json(
      { detail: "Both username and password are required." },
      { status: 400 }
    );
  }

  const auth: PulpAuth = {
    username: payload.username.trim(),
    password: payload.password,
  };

  const result = await pulpFetch<PulpListResponse<PulpUser>>(
    "/users/?limit=1000",
    auth
  );

  if (!result.ok) {
    return Response.json({ detail: result.detail }, { status: result.status });
  }

  const hasUser = result.data.results.some((user) => user.username === auth.username);
  if (!hasUser) {
    return Response.json(
      { detail: "Authenticated but user cannot be found in Pulp users list." },
      { status: 403 }
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(PULP_AUTH_COOKIE, encodePulpAuth(auth), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return Response.json({ username: auth.username });
}

export async function GET() {
  const cookieStore = await cookies();
  const encoded = cookieStore.get(PULP_AUTH_COOKIE)?.value;

  if (!encoded) {
    return Response.json({ detail: "Not authenticated." }, { status: 401 });
  }

  const auth = decodePulpAuth(encoded);
  if (!auth) {
    cookieStore.delete(PULP_AUTH_COOKIE);
    return Response.json({ detail: "Invalid session." }, { status: 401 });
  }

  const result = await pulpFetch("/users/?limit=1", auth);
  if (!result.ok) {
    cookieStore.delete(PULP_AUTH_COOKIE);
    return Response.json({ detail: "Session expired." }, { status: 401 });
  }

  return Response.json({ username: auth.username });
}
