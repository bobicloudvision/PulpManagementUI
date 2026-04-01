export type ApiErrorResponse = {
  detail?: string;
};

export type PulpUser = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  is_staff: boolean;
  is_active: boolean;
};

export type PulpGroup = {
  id: number;
  name: string;
};

type PulpListResponse<T> = {
  results: T[];
};

export type CreatePulpUserPayload = {
  username: string;
  password: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  is_staff?: boolean;
  is_active?: boolean;
};

export type CreatePulpGroupPayload = {
  name: string;
};

export type PulpUsersAndGroups = {
  users: PulpUser[];
  groups: PulpGroup[];
};

const API_PATHS = {
  login: "/api/pulp/login",
  logout: "/api/pulp/logout",
  users: "/api/pulp/users",
  groups: "/api/pulp/groups",
} as const;

export async function readApiDetail(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ApiErrorResponse;
    if (body.detail) {
      return body.detail;
    }
  } catch {
    // Ignore parsing failure and fallback to status text.
  }

  return response.statusText || "Unexpected server error.";
}

export const pulpClientService = {
  async getSessionUser(): Promise<string | null> {
    const response = await fetch(API_PATHS.login);
    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { username: string };
    return payload.username;
  },

  async login(username: string, password: string): Promise<{ ok: true; username: string } | { ok: false; detail: string }> {
    const response = await fetch(API_PATHS.login, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      return {
        ok: false,
        detail: await readApiDetail(response),
      };
    }

    const payload = (await response.json()) as { username: string };
    return {
      ok: true,
      username: payload.username,
    };
  },

  async logout(): Promise<void> {
    await fetch(API_PATHS.logout, { method: "POST" });
  },

  async getUsersAndGroups(): Promise<PulpUsersAndGroups> {
    const [usersResponse, groupsResponse] = await Promise.all([
      fetch(API_PATHS.users),
      fetch(API_PATHS.groups),
    ]);

    if (!usersResponse.ok) {
      throw new Error(await readApiDetail(usersResponse));
    }

    if (!groupsResponse.ok) {
      throw new Error(await readApiDetail(groupsResponse));
    }

    const usersPayload = (await usersResponse.json()) as PulpListResponse<PulpUser>;
    const groupsPayload = (await groupsResponse.json()) as PulpListResponse<PulpGroup>;

    return {
      users: usersPayload.results,
      groups: groupsPayload.results,
    };
  },

  async createUser(
    payload: CreatePulpUserPayload
  ): Promise<{ ok: true } | { ok: false; detail: string }> {
    const response = await fetch(API_PATHS.users, {
      method: "POST",
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

  async createGroup(
    payload: CreatePulpGroupPayload
  ): Promise<{ ok: true } | { ok: false; detail: string }> {
    const response = await fetch(API_PATHS.groups, {
      method: "POST",
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
};
