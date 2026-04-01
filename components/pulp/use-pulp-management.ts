"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CreatePulpUserPayload,
  PulpGroup,
  PulpUser,
  pulpClientService,
} from "@/services/pulp-client";

export type { CreatePulpUserPayload, PulpGroup, PulpUser };

export function usePulpManagement() {
  const [sessionUser, setSessionUser] = useState<string | null>(null);
  const [users, setUsers] = useState<PulpUser[]>([]);
  const [groups, setGroups] = useState<PulpGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsersAndGroups = useCallback(async () => {
    const data = await pulpClientService.getUsersAndGroups();
    setUsers(data.users);
    setGroups(data.groups);
  }, []);

  const checkSession = useCallback(async () => {
    setIsCheckingSession(true);

    const authenticatedUser = await pulpClientService.getSessionUser();
    if (!authenticatedUser) {
      setSessionUser(null);
      setIsCheckingSession(false);
      return;
    }

    setSessionUser(authenticatedUser);

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

      const result = await pulpClientService.login(username, password);
      if (!result.ok) {
        setError(result.detail);
        setIsLoading(false);
        return false;
      }

      setSessionUser(result.username);

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

    await pulpClientService.logout();

    setSessionUser(null);
    setUsers([]);
    setGroups([]);
    setIsLoading(false);
  }, []);

  const createUser = useCallback(
    async (payload: CreatePulpUserPayload) => {
      setError(null);
      setIsLoading(true);

      const result = await pulpClientService.createUser(payload);
      if (!result.ok) {
        setError(result.detail);
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
