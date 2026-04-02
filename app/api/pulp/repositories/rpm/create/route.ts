import { cookies } from "next/headers";
import { getPulpApiUrl, PULP_AUTH_COOKIE, toBasicAuthHeader } from "@/lib/pulp";
import { requirePulpAuth } from "@/app/api/pulp/_helpers";
import { authHeaders, readDetail, TaskRefResponse, waitForTask } from "../../_server";

type CreateBody = {
  name?: string;
};

export async function POST(request: Request) {
  const authResult = await requirePulpAuth();
  if (!authResult.ok) {
    return authResult.response;
  }

  const body = (await request.json()) as CreateBody;
  const name = body.name?.trim();
  if (!name) {
    return Response.json({ detail: "Repository name is required." }, { status: 400 });
  }

  const authHeader = toBasicAuthHeader(authResult.auth);
  const headers = authHeaders(authHeader);
  headers.set("Content-Type", "application/json");

  const createResponse = await fetch(getPulpApiUrl("/repositories/rpm/rpm/"), {
    method: "POST",
    headers,
    body: JSON.stringify({ name }),
    cache: "no-store",
  });

  if (!createResponse.ok) {
    if (createResponse.status === 401 || createResponse.status === 403) {
      const cookieStore = await cookies();
      cookieStore.delete(PULP_AUTH_COOKIE);
    }
    return Response.json({ detail: await readDetail(createResponse) }, { status: createResponse.status });
  }

  const created = (await createResponse.json()) as TaskRefResponse;
  let pulpHref = created.pulp_href ?? created.href ?? null;

  try {
    if (created.task) {
      const task = await waitForTask(created.task, authHeader);
      pulpHref = task.created_resources?.[0] ?? pulpHref;
    }
  } catch (error) {
    return Response.json(
      { detail: error instanceof Error ? error.message : "Repository creation task failed." },
      { status: 500 }
    );
  }

  return Response.json({
    name,
    pulp_href: pulpHref,
    task: created.task ?? null,
  });
}
