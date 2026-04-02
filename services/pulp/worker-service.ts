import { readApiDetail } from "./http";
import { PulpWorker } from "./types";

type PulpListResponse<T> = {
  results: T[];
};

const WORKERS_PATH = "/api/pulp/workers";

export const pulpWorkerService = {
  async list(): Promise<PulpWorker[]> {
    const response = await fetch(WORKERS_PATH);
    if (!response.ok) {
      throw new Error(await readApiDetail(response));
    }

    const payload = (await response.json()) as PulpListResponse<PulpWorker>;
    return payload.results;
  },
};
