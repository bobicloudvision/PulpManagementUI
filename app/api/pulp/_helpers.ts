import { cookies } from "next/headers";
import { decodePulpAuth, PULP_AUTH_COOKIE, type PulpAuth } from "@/lib/pulp";

export async function requirePulpAuth(): Promise<
  { ok: true; auth: PulpAuth } | { ok: false; response: Response }
> {
  const cookieStore = await cookies();
  const encoded = cookieStore.get(PULP_AUTH_COOKIE)?.value;
  if (!encoded) {
    return {
      ok: false,
      response: Response.json({ detail: "Not authenticated." }, { status: 401 }),
    };
  }

  const auth = decodePulpAuth(encoded);
  if (!auth) {
    cookieStore.delete(PULP_AUTH_COOKIE);
    return {
      ok: false,
      response: Response.json({ detail: "Invalid session." }, { status: 401 }),
    };
  }

  return { ok: true, auth };
}
