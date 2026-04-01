"use client";

import {
  createElement,
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { pulpAuthService } from "@/services/pulp/auth-service";
import { pulpGroupService } from "@/services/pulp/group-service";
import { pulpUserService } from "@/services/pulp/user-service";
import {
  CreatePulpGroupPayload,
  CreatePulpUserPayload,
  PulpGroup,
  PulpUser,
  UpdatePulpGroupPayload,
  UpdatePulpUserPayload,
} from "@/services/pulp/types";

export type {
  CreatePulpGroupPayload,
  CreatePulpUserPayload,
  PulpGroup,
  PulpUser,
  UpdatePulpGroupPayload,
  UpdatePulpUserPayload,
};

type PulpManagementContextValue = {
  sessionUser: string | null;
  users: PulpUser[];
  groups: PulpGroup[];
  isLoading: boolean;
  isCheckingSession: boolean;
  hasSession: boolean;
  error: string | null;
  setError: (value: string | null) => void;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  createUser: (payload: CreatePulpUserPayload) => Promise<boolean>;
  createGroup: (payload: CreatePulpGroupPayload) => Promise<boolean>;
  updateUser: (id: number, payload: UpdatePulpUserPayload) => Promise<boolean>;
  deleteUser: (id: number) => Promise<boolean>;
  updateGroup: (id: number, payload: UpdatePulpGroupPayload) => Promise<boolean>;
  deleteGroup: (id: number) => Promise<boolean>;
};

const PulpManagementContext = createContext<PulpManagementContextValue | null>(null);

export function PulpManagementProvider({ children }: { children: ReactNode }) {
  const [sessionUser, setSessionUser] = useState<string | null>(null);
  const [users, setUsers] = useState<PulpUser[]>([]);
  const [groups, setGroups] = useState<PulpGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsersAndGroups = useCallback(async () => {
    const [nextUsers, nextGroups] = await Promise.all([
      pulpUserService.list(),
      pulpGroupService.list(),
    ]);
    setUsers(nextUsers);
    setGroups(nextGroups);
  }, []);

  const checkSession = useCallback(async () => {
    setIsCheckingSession(true);

    const authenticatedUser = await pulpAuthService.getSessionUser();
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

      const result = await pulpAuthService.login(username, password);
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

    await pulpAuthService.logout();

    setSessionUser(null);
    setUsers([]);
    setGroups([]);
    setIsLoading(false);
  }, []);

  const createUser = useCallback(
    async (payload: CreatePulpUserPayload) => {
      setError(null);
      setIsLoading(true);

      const result = await pulpUserService.create(payload);
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

  const createGroup = useCallback(
    async (payload: CreatePulpGroupPayload) => {
      setError(null);
      setIsLoading(true);

      const result = await pulpGroupService.create(payload);
      if (!result.ok) {
        setError(result.detail);
        setIsLoading(false);
        return false;
      }

      try {
        await loadUsersAndGroups();
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to reload groups.");
      } finally {
        setIsLoading(false);
      }

      return true;
    },
    [loadUsersAndGroups]
  );

  const updateUser = useCallback(
    async (id: number, payload: UpdatePulpUserPayload) => {
      setError(null);
      setIsLoading(true);

      const result = await pulpUserService.update(id, payload);
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

  const deleteUser = useCallback(
    async (id: number) => {
      setError(null);
      setIsLoading(true);

      const result = await pulpUserService.remove(id);
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

  const updateGroup = useCallback(
    async (id: number, payload: UpdatePulpGroupPayload) => {
      setError(null);
      setIsLoading(true);

      const result = await pulpGroupService.update(id, payload);
      if (!result.ok) {
        setError(result.detail);
        setIsLoading(false);
        return false;
      }

      try {
        await loadUsersAndGroups();
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to reload groups.");
      } finally {
        setIsLoading(false);
      }

      return true;
    },
    [loadUsersAndGroups]
  );

  const deleteGroup = useCallback(
    async (id: number) => {
      setError(null);
      setIsLoading(true);

      const result = await pulpGroupService.remove(id);
      if (!result.ok) {
        setError(result.detail);
        setIsLoading(false);
        return false;
      }

      try {
        await loadUsersAndGroups();
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to reload groups.");
      } finally {
        setIsLoading(false);
      }

      return true;
    },
    [loadUsersAndGroups]
  );

  const value = useMemo(
    () => ({
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
      createGroup,
      updateUser,
      deleteUser,
      updateGroup,
      deleteGroup,
    }),
    [
      sessionUser,
      users,
      groups,
      isLoading,
      isCheckingSession,
      hasSession,
      error,
      login,
      logout,
      createUser,
      createGroup,
      updateUser,
      deleteUser,
      updateGroup,
      deleteGroup,
    ]
  );

  return createElement(PulpManagementContext.Provider, { value }, children);
}

export function usePulpManagement() {
  const context = useContext(PulpManagementContext);
  if (!context) {
    throw new Error("usePulpManagement must be used within PulpManagementProvider.");
  }

  return context;
}
