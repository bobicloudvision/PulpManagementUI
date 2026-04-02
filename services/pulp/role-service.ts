import { readApiDetail } from "./http";
import {
  CreatePulpRolePayload,
  PutPulpRolePayload,
  PulpPaginatedResponse,
  PulpRole,
  ServiceResult,
  UpdatePulpRolePayload,
} from "./types";

const ROLES_PATH = "/api/pulp/roles";

const ROLE_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function pulpRoleIdFromHref(href: string): string | null {
  const segment = href
    .replace(/\/+$/, "")
    .split("/")
    .filter(Boolean)
    .pop();
  if (!segment || !ROLE_ID_RE.test(segment)) {
    return null;
  }
  return segment;
}

function roleUrl(id: string): string {
  return `${ROLES_PATH}/${encodeURIComponent(id)}`;
}

export const pulpRoleService = {
  async list(params: { limit: number; offset: number }): Promise<PulpPaginatedResponse<PulpRole>> {
    const qs = new URLSearchParams({
      limit: String(params.limit),
      offset: String(params.offset),
    });
    const response = await fetch(`${ROLES_PATH}?${qs}`);
    if (!response.ok) {
      throw new Error(await readApiDetail(response));
    }

    return (await response.json()) as PulpPaginatedResponse<PulpRole>;
  },

  async create(payload: CreatePulpRolePayload): Promise<ServiceResult> {
    const name = payload.name.trim();
    const permissions = payload.permissions.map((p) => p.trim()).filter((p) => p.length > 0);

    if (!name) {
      return { ok: false, detail: "Role name is required." };
    }
    if (permissions.length === 0) {
      return { ok: false, detail: "At least one permission is required." };
    }

    const body: CreatePulpRolePayload = { name, permissions };
    const desc = payload.description?.trim();
    if (desc) {
      body.description = desc;
    }

    const response = await fetch(ROLES_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return {
        ok: false,
        detail: await readApiDetail(response),
      };
    }

    return { ok: true };
  },

  async patch(id: string, payload: UpdatePulpRolePayload): Promise<ServiceResult> {
    const body: UpdatePulpRolePayload = {};
    if (payload.name !== undefined) {
      const name = payload.name.trim();
      if (!name) {
        return { ok: false, detail: "Role name cannot be empty." };
      }
      body.name = name;
    }
    if ("description" in payload) {
      if (payload.description === null) {
        body.description = null;
      } else if (typeof payload.description === "string") {
        const d = payload.description.trim();
        body.description = d.length > 0 ? d : null;
      }
    }
    if (payload.permissions !== undefined) {
      const permissions = payload.permissions.map((p) => p.trim()).filter((p) => p.length > 0);
      if (permissions.length === 0) {
        return { ok: false, detail: "At least one permission is required." };
      }
      body.permissions = permissions;
    }

    if (Object.keys(body).length === 0) {
      return { ok: false, detail: "Nothing to update." };
    }

    const response = await fetch(roleUrl(id), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return { ok: false, detail: await readApiDetail(response) };
    }

    return { ok: true };
  },

  async put(id: string, payload: PutPulpRolePayload): Promise<ServiceResult> {
    const name = payload.name.trim();
    const permissions = payload.permissions.map((p) => p.trim()).filter((p) => p.length > 0);
    if (!name) {
      return { ok: false, detail: "Role name is required." };
    }
    if (permissions.length === 0) {
      return { ok: false, detail: "At least one permission is required." };
    }

    const body: PutPulpRolePayload = { name, permissions };
    if (payload.description === null) {
      body.description = null;
    } else if (typeof payload.description === "string") {
      const d = payload.description.trim();
      body.description = d.length > 0 ? d : null;
    }

    const response = await fetch(roleUrl(id), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return { ok: false, detail: await readApiDetail(response) };
    }

    return { ok: true };
  },

  async remove(id: string): Promise<ServiceResult> {
    const response = await fetch(roleUrl(id), { method: "DELETE" });
    if (!response.ok) {
      return { ok: false, detail: await readApiDetail(response) };
    }
    return { ok: true };
  },
};
