import { readApiDetail } from "./http";
import { PulpContentItem, PulpPaginatedResponse, PulpRpmPackage } from "./types";

const CONTENT_PATH = "/api/pulp/content";

export const pulpContentService = {
  async list(limit: number, offset: number): Promise<PulpPaginatedResponse<PulpContentItem>> {
    const response = await fetch(`${CONTENT_PATH}?limit=${limit}&offset=${offset}`);
    if (!response.ok) {
      throw new Error(await readApiDetail(response));
    }

    return (await response.json()) as PulpPaginatedResponse<PulpContentItem>;
  },

  async getRpmPackage(id: string): Promise<PulpRpmPackage> {
    const response = await fetch(`/api/pulp/content/rpm/packages/${id}`);
    if (!response.ok) {
      throw new Error(await readApiDetail(response));
    }

    return (await response.json()) as PulpRpmPackage;
  },
};
