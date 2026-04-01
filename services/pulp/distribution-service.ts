import { readApiDetail } from "./http";
import { PulpDistribution, ServiceResult, UpdatePulpDistributionPayload } from "./types";

type PulpListResponse<T> = {
  results: T[];
};

const DISTRIBUTIONS_PATH = "/api/pulp/distributions";

function extractDistributionId(pulpHref: string): string | null {
  const match = pulpHref.match(/\/distributions\/rpm\/rpm\/([^/]+)\/?$/);
  return match?.[1] ?? null;
}

export const pulpDistributionService = {
  async list(): Promise<PulpDistribution[]> {
    const response = await fetch(DISTRIBUTIONS_PATH);
    if (!response.ok) {
      throw new Error(await readApiDetail(response));
    }

    const payload = (await response.json()) as PulpListResponse<PulpDistribution>;
    return payload.results;
  },

  async update(
    pulpHref: string,
    payload: UpdatePulpDistributionPayload
  ): Promise<ServiceResult> {
    const id = extractDistributionId(pulpHref);
    if (!id) {
      return { ok: false, detail: "Invalid distribution identifier." };
    }

    const response = await fetch(`${DISTRIBUTIONS_PATH}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return {
        ok: false,
        detail: await readApiDetail(response),
      };
    }

    return { ok: true };
  },

  async remove(pulpHref: string): Promise<ServiceResult> {
    const id = extractDistributionId(pulpHref);
    if (!id) {
      return { ok: false, detail: "Invalid distribution identifier." };
    }

    const response = await fetch(`${DISTRIBUTIONS_PATH}/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      return {
        ok: false,
        detail: await readApiDetail(response),
      };
    }

    return { ok: true };
  },
};
