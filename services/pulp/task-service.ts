import { readApiDetail } from "./http";
import { PulpPaginatedResponse, PulpTask } from "./types";

const TASKS_PATH = "/api/pulp/tasks";

export const pulpTaskService = {
  async list(params: { limit: number; offset: number }): Promise<PulpPaginatedResponse<PulpTask>> {
    const qs = new URLSearchParams({
      limit: String(params.limit),
      offset: String(params.offset),
    });
    const response = await fetch(`${TASKS_PATH}?${qs}`);
    if (!response.ok) {
      throw new Error(await readApiDetail(response));
    }

    return (await response.json()) as PulpPaginatedResponse<PulpTask>;
  },
};
