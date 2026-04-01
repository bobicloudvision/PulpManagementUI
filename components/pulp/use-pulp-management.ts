"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type ApiErrorResponse = {
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

async function readDetail(response: Response): Promise<string> {
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

export function usePulpManagement() {
  const [sessionUser, setSessionUser] = useState<string | null>(null);
  const [users, setUsers] = useState<PulpUser[]>([]);
  const [groups, setGroups] = useState<PulpGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsersAndGroups = useCallback(async () => {
    const [usersResponse, groupsResponse] = await Promise.all([
      fetch("/api/pulp/users"),
      fetch("/api/pulp/groups"),
    ]);

    if (!usersResponse.ok) {
      throw new Error(await readDetail(usersResponse));
    }

    if (!groupsResponse.ok) {
      throw new Error(await readDetail(groupsResponse));
    }

    const usersPayload = (await usersResponse.json()) as PulpListResponse<PulpUser>;
    const groupsPayload = (await groupsResponse.json()) as PulpListResponse<PulpGroup>;

    setUsers(usersPayload.results);
    setGroups(groupsPayload.results);
  }, []);

  const checkSession = useCallback(async () => {
    setIsCheckingSession(true);

    const response = await fetch("/api/pulp/login");
    if (!response.ok) {
      setSessionUser(null);
      setIsCheckingSession(false);
      return;
    }

    const payload = (await response.json()) as { username: string };
    setSessionUser(payload.username);

    try {
      await loadUsersAndGroups();
    } catch (sessionLoadError) {
      setError(
        sessionLoadError instanceof Error
          ? sessionLoadError.message
          : "Failed to load users and groups."
      );
    } finally {
      setIsCheckingSession(false);
    }
  }, [loadUsersAndGroups]);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  const hasSession = useMemo(() => sessionUser !== null, [sessionUser]);

  const login = useCallback(
    async (username: string, password: string) => {
      setError(null);
      setIsLoading(true);

      const response = await fetch("/api/pulp/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        setError(await readDetail(response));
        setIsLoading(false);
        return false;
      }

      const payload = (await response.json()) as { username: string };
      setSessionUser(payload.username);

      try {
        await loadUsersAndGroups();
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load data.");
      } finally {
        setIsLoading(false);
      }

      return true;
    },
    [loadUsersAndGroups]
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    await fetch("/api/pulp/logout", { method: "POST" });

    setSessionUser(null);
    setUsers([]);
    setGroups([]);
    setIsLoading(false);
  }, []);

  const createUser = useCallback(
    async (payload: CreatePulpUserPayload) => {
      setError(null);
      setIsLoading(true);

      const response = await fetch("/api/pulp/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setError(await readDetail(response));
        setIsLoading(false);
        return false;
      }

      try {
        await loadUsersAndGroups();
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to reload users.");
      } finally {
        setIsLoading(false);
      }

      return true;
    },
    [loadUsersAndGroups]
  );

  return {
    sessionUser,
    users,
    groups,
    isLoading,
    isCheckingSession,
    hasSession,
    error,
    setError,
    login,
    logout,
    createUser,
  };
}
