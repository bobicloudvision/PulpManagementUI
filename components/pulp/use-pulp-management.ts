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
import {
  CreatePulpGroupPayload,
  CreatePulpUserPayload,
  PulpGroup,
  PulpUser,
  pulpClientService,
} from "@/services/pulp-client";

export type { CreatePulpGroupPayload, CreatePulpUserPayload, PulpGroup, PulpUser };

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

  const createGroup = useCallback(
    async (payload: CreatePulpGroupPayload) => {
      setError(null);
      setIsLoading(true);

      const result = await pulpClientService.createGroup(payload);
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
