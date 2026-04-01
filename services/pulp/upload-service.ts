import { readApiDetail } from "./http";
import { PulpPaginatedResponse, PulpUploadItem } from "./types";

const UPLOADS_PATH = "/api/pulp/uploads";

export const pulpUploadService = {
  async list(limit: number, offset: number): Promise<PulpPaginatedResponse<PulpUploadItem>> {
    const response = await fetch(`${UPLOADS_PATH}?limit=${limit}&offset=${offset}`);
    if (!response.ok) {
      throw new Error(await readApiDetail(response));
    }

    return (await response.json()) as PulpPaginatedResponse<PulpUploadItem>;
  },
};
