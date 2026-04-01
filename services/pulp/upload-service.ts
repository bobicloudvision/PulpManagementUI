import { readApiDetail } from "./http";
import {
  PulpPaginatedResponse,
  PulpUploadAsRpmResult,
  PulpUploadCreateResult,
  PulpUploadItem,
} from "./types";

const UPLOADS_PATH = "/api/pulp/uploads";

export const pulpUploadService = {
  async list(limit: number, offset: number): Promise<PulpPaginatedResponse<PulpUploadItem>> {
    const response = await fetch(`${UPLOADS_PATH}?limit=${limit}&offset=${offset}`);
    if (!response.ok) {
      throw new Error(await readApiDetail(response));
    }

    return (await response.json()) as PulpPaginatedResponse<PulpUploadItem>;
  },

  async upload(file: File): Promise<PulpUploadCreateResult> {
    const formData = new FormData();
    formData.set("file", file);

    const response = await fetch("/api/pulp/uploads", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(await readApiDetail(response));
    }

    return (await response.json()) as PulpUploadCreateResult;
  },

  async uploadAsRpm(artifact: string): Promise<PulpUploadAsRpmResult> {
    const response = await fetch("/api/pulp/content/rpm/packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ artifact }),
    });

    if (!response.ok) {
      throw new Error(await readApiDetail(response));
    }

    return (await response.json()) as PulpUploadAsRpmResult;
  },
};
