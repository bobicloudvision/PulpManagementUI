import { readApiDetail } from "./http";
import {
  PulpAddToRepositoryResult,
  PulpUploadAsRpmResult,
  PulpUploadCreateResult,
} from "./types";

export const pulpUploadService = {
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

  async addToRepository(
    content: string,
    repositoryName: string
  ): Promise<PulpAddToRepositoryResult> {
    const response = await fetch("/api/pulp/repositories/rpm/add-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, repositoryName }),
    });

    if (!response.ok) {
      throw new Error(await readApiDetail(response));
    }

    return (await response.json()) as PulpAddToRepositoryResult;
  },
};
