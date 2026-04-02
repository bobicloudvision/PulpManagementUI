"use client";

import { useCallback, useEffect, useState } from "react";
import { usePulpAuthContext } from "./auth-context";
import {
  CreatePulpRolePayload,
  PulpPaginatedResponse,
  PulpRole,
  ServiceResult,
  UpdatePulpRolePayload,
} from "@/services/pulp/types";
import { pulpRoleService } from "@/services/pulp/role-service";

export function usePulpRoles(enabled: boolean, page: number, pageSize: number) {
  const { setError, setIsLoading } = usePulpAuthContext();
  const [data, setData] = useState<PulpPaginatedResponse<PulpRole> | null>(null);
  const [loading, setLoading] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  const refetch = useCallback(() => setReloadTick((t) => t + 1), []);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!enabled || page < 1) {
        setData(null);
        return;
      }

      setLoading(true);
      try {
        const next = await pulpRoleService.list({
          limit: pageSize,
          offset: (page - 1) * pageSize,
        });
        if (active) {
          setData(next);
        }
      } catch (error) {
        if (active) {
          setData(null);
          setError(error instanceof Error ? error.message : "Failed to load roles.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [enabled, page, pageSize, setError, reloadTick]);

  const totalPages = data == null ? 0 : Math.max(1, Math.ceil(data.count / pageSize));

  const createRole = useCallback(
    async (payload: CreatePulpRolePayload): Promise<ServiceResult> => {
      setError(null);
      setIsLoading(true);
      const result = await pulpRoleService.create(payload);
      if (!result.ok) {
        setIsLoading(false);
        return result;
      }
      refetch();
      setIsLoading(false);
      return { ok: true };
    },
    [refetch, setError, setIsLoading]
  );

  const patchRole = useCallback(
    async (id: string, payload: UpdatePulpRolePayload): Promise<ServiceResult> => {
      setError(null);
      setIsLoading(true);
      const result = await pulpRoleService.patch(id, payload);
      if (!result.ok) {
        setIsLoading(false);
        return result;
      }
      refetch();
      setIsLoading(false);
      return { ok: true };
    },
    [refetch, setError, setIsLoading]
  );

  const deleteRole = useCallback(
    async (id: string): Promise<ServiceResult> => {
      setError(null);
      setIsLoading(true);
      const result = await pulpRoleService.remove(id);
      if (!result.ok) {
        setIsLoading(false);
        return result;
      }
      refetch();
      setIsLoading(false);
      return { ok: true };
    },
    [refetch, setError, setIsLoading]
  );

  return { data, loading, totalPages, refetch, createRole, patchRole, deleteRole };
}
