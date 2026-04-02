import { readApiDetail } from "./http";
import { PulpPaginatedResponse, PulpTaskSchedule } from "./types";

const TASK_SCHEDULES_PATH = "/api/pulp/task-schedules";

export const pulpTaskScheduleService = {
  async list(params: { limit: number; offset: number }): Promise<PulpPaginatedResponse<PulpTaskSchedule>> {
    const qs = new URLSearchParams({
      limit: String(params.limit),
      offset: String(params.offset),
    });
    const response = await fetch(`${TASK_SCHEDULES_PATH}?${qs}`);
    if (!response.ok) {
      throw new Error(await readApiDetail(response));
    }

    return (await response.json()) as PulpPaginatedResponse<PulpTaskSchedule>;
  },
};
