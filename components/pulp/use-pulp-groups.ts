"use client";

import { useCallback, useEffect, useState } from "react";
import { usePulpAuthContext } from "./auth-context";
import {
  CreatePulpGroupPayload,
  PulpGroup,
  UpdatePulpGroupPayload,
} from "@/services/pulp/types";
import { pulpGroupService } from "@/services/pulp/group-service";

export function usePulpGroups(enabled: boolean) {
  const { setError, setIsLoading } = usePulpAuthContext();
  const [groups, setGroups] = useState<PulpGroup[]>([]);

  const refreshGroups = useCallback(async () => {
    if (!enabled) {
      setGroups([]);
      return;
    }

    const nextGroups = await pulpGroupService.list();
    setGroups(nextGroups);
  }, [enabled]);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!enabled) {
        setGroups([]);
        return;
      }

      try {
        const nextGroups = await pulpGroupService.list();
        if (active) {
          setGroups(nextGroups);
        }
      } catch (error) {
        if (active) {
          setError(error instanceof Error ? error.message : "Failed to load groups.");
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [enabled, setError]);

  const runMutation = useCallback(
    async (mutate: () => Promise<{ ok: true } | { ok: false; detail: string }>) => {
      setError(null);
      setIsLoading(true);

      const result = await mutate();
      if (!result.ok) {
        setError(result.detail);
        setIsLoading(false);
        return false;
      }

      try {
        await refreshGroups();
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to reload groups.");
      } finally {
        setIsLoading(false);
      }

      return true;
    },
    [refreshGroups, setError, setIsLoading]
  );

  const createGroup = useCallback(
    async (payload: CreatePulpGroupPayload) =>
      runMutation(() => pulpGroupService.create(payload)),
    [runMutation]
  );

  const updateGroup = useCallback(
    async (id: number, payload: UpdatePulpGroupPayload) =>
      runMutation(() => pulpGroupService.update(id, payload)),
    [runMutation]
  );

  const deleteGroup = useCallback(
    async (id: number) => runMutation(() => pulpGroupService.remove(id)),
    [runMutation]
  );

  return {
    groups,
    refreshGroups,
    createGroup,
    updateGroup,
    deleteGroup,
  };
}
