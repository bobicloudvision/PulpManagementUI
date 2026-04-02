import { cookies } from "next/headers";
import { getPulpApiUrl, PULP_AUTH_COOKIE, toBasicAuthHeader } from "@/lib/pulp";
import { requirePulpAuth } from "@/app/api/pulp/_helpers";
import {
  authHeaders,
  hrefFromCreatedResource,
  normalizePulpHrefToApiPath,
  readDetail,
  TaskRefResponse,
  toPulpHrefPath,
  waitForTask,
} from "../../_server";

type AddToRepositoryBody = {
  repositoryName?: string;
  content?: string;
};

type PulpRepository = {
  pulp_href?: string;
  href?: string;
};

type ListRepositoriesResponse = {
  results?: PulpRepository[];
};

async function findOrCreateRepository(repositoryName: string, authHeader: string): Promise<string> {
  const listResponse = await fetch(
    getPulpApiUrl(`/repositories/rpm/rpm/?name=${encodeURIComponent(repositoryName)}`),
    { method: "GET", headers: authHeaders(authHeader), cache: "no-store" }
  );
  if (!listResponse.ok) {
    throw new Error(await readDetail(listResponse));
  }

  const listPayload = (await listResponse.json()) as ListRepositoriesResponse;
  const existing = listPayload.results?.[0];
  if (existing?.pulp_href || existing?.href) {
    return existing.pulp_href ?? existing.href ?? "";
  }

  const createHeaders = authHeaders(authHeader);
  createHeaders.set("Content-Type", "application/json");
  const createResponse = await fetch(getPulpApiUrl("/repositories/rpm/rpm/"), {
    method: "POST",
    headers: createHeaders,
    body: JSON.stringify({ name: repositoryName }),
    cache: "no-store",
  });
  if (!createResponse.ok) {
    throw new Error(await readDetail(createResponse));
  }

  const created = (await createResponse.json()) as TaskRefResponse;
  let repoHref = created.pulp_href ?? created.href ?? null;

  if (created.task) {
    const task = await waitForTask(created.task, authHeader);
    repoHref = hrefFromCreatedResource(task.created_resources?.[0]) ?? repoHref;
  }

  if (!repoHref) {
    throw new Error("Repository creation completed without repository href.");
  }

  return repoHref;
}

export async function POST(request: Request) {
  const authResult = await requirePulpAuth();
  if (!authResult.ok) {
    return authResult.response;
  }

  const body = (await request.json()) as AddToRepositoryBody;
  const repositoryName = body.repositoryName?.trim();
  const content = body.content?.trim();
  if (!repositoryName) {
    return Response.json({ detail: "Repository name is required." }, { status: 400 });
  }
  if (!content) {
    return Response.json({ detail: "Content href is required." }, { status: 400 });
  }

  const authHeader = toBasicAuthHeader(authResult.auth);

  try {
    const repositoryHref = await findOrCreateRepository(repositoryName, authHeader);
    const modifyHeaders = authHeaders(authHeader);
    modifyHeaders.set("Content-Type", "application/json");

    const modifyResponse = await fetch(
      getPulpApiUrl(`${normalizePulpHrefToApiPath(repositoryHref)}modify/`),
      {
        method: "POST",
        headers: modifyHeaders,
        body: JSON.stringify({
          add_content_units: [toPulpHrefPath(content)],
        }),
        cache: "no-store",
      }
    );
    if (!modifyResponse.ok) {
      throw new Error(await readDetail(modifyResponse));
    }

    const modifyPayload = (await modifyResponse.json()) as TaskRefResponse;
    if (modifyPayload.task) {
      await waitForTask(modifyPayload.task, authHeader);
    }

    return Response.json({
      repository: repositoryHref,
      content: toPulpHrefPath(content),
      task: modifyPayload.task ?? null,
    });
  } catch (error) {
    if (error instanceof Error && /401|403/.test(error.message)) {
      const cookieStore = await cookies();
      cookieStore.delete(PULP_AUTH_COOKIE);
    }

    return Response.json(
      { detail: error instanceof Error ? error.message : "Failed to add content to repository." },
      { status: 500 }
    );
  }
}
