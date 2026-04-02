import { readApiDetail } from "./http";
import { PulpPaginatedResponse, PulpRpmRepository } from "./types";

export type RepositoryPublishResult = {
  publication: string | null;
  repository: string;
  task: string | null;
};

export type RepositoryCreateResult = {
  name: string;
  pulp_href: string | null;
  task: string | null;
};

export type RepositoryContentListResult = {
  count: number;
  results: Record<string, unknown>[];
};

export const pulpRepositoryManagementService = {
  async listRpm(limit = 200, offset = 0): Promise<PulpPaginatedResponse<PulpRpmRepository>> {
    const response = await fetch(`/api/pulp/repositories/rpm?limit=${limit}&offset=${offset}`);
    if (!response.ok) throw new Error(await readApiDetail(response));
    return (await response.json()) as PulpPaginatedResponse<PulpRpmRepository>;
  },

  async listDeb(limit = 200, offset = 0): Promise<PulpPaginatedResponse<PulpRpmRepository>> {
    const response = await fetch(`/api/pulp/repositories/deb?limit=${limit}&offset=${offset}`);
    if (!response.ok) throw new Error(await readApiDetail(response));
    return (await response.json()) as PulpPaginatedResponse<PulpRpmRepository>;
  },

  async createRpm(name: string): Promise<RepositoryCreateResult> {
    const response = await fetch("/api/pulp/repositories/rpm/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) throw new Error(await readApiDetail(response));
    return (await response.json()) as RepositoryCreateResult;
  },

  async createDeb(name: string): Promise<RepositoryCreateResult> {
    const response = await fetch("/api/pulp/repositories/deb/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) throw new Error(await readApiDetail(response));
    return (await response.json()) as RepositoryCreateResult;
  },

  async deleteRpm(pulpHref: string): Promise<void> {
    const response = await fetch("/api/pulp/repositories/rpm", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pulp_href: pulpHref }),
    });
    if (!response.ok) throw new Error(await readApiDetail(response));
  },

  async deleteDeb(pulpHref: string): Promise<void> {
    const response = await fetch("/api/pulp/repositories/deb", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pulp_href: pulpHref }),
    });
    if (!response.ok) throw new Error(await readApiDetail(response));
  },

  async publishRpm(pulpHref: string): Promise<RepositoryPublishResult> {
    const response = await fetch("/api/pulp/repositories/rpm/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pulp_href: pulpHref }),
    });
    if (!response.ok) throw new Error(await readApiDetail(response));
    return (await response.json()) as RepositoryPublishResult;
  },

  async publishDeb(pulpHref: string): Promise<RepositoryPublishResult> {
    const response = await fetch("/api/pulp/repositories/deb/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pulp_href: pulpHref }),
    });
    if (!response.ok) throw new Error(await readApiDetail(response));
    return (await response.json()) as RepositoryPublishResult;
  },

  async listRepositoryContent(pulpHref: string): Promise<RepositoryContentListResult> {
    const response = await fetch(
      `/api/pulp/repositories/content?pulp_href=${encodeURIComponent(pulpHref)}`
    );
    if (!response.ok) throw new Error(await readApiDetail(response));
    return (await response.json()) as RepositoryContentListResult;
  },
};
