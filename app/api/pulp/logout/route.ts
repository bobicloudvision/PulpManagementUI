import { cookies } from "next/headers";
import { PULP_AUTH_COOKIE } from "@/lib/pulp";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(PULP_AUTH_COOKIE);

  return Response.json({ ok: true });
}
