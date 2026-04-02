"use client";

import { useEffect, useState } from "react";
import { usePulpAuthContext } from "./auth-context";
import { PulpPaginatedResponse, PulpTask } from "@/services/pulp/types";
import { pulpTaskService } from "@/services/pulp/task-service";

export function usePulpTasks(enabled: boolean, page: number, pageSize: number) {
  const { setError } = usePulpAuthContext();
  const [data, setData] = useState<PulpPaginatedResponse<PulpTask> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!enabled || page < 1) {
        setData(null);
        return;
      }

      setLoading(true);
      try {
        const next = await pulpTaskService.list({
          limit: pageSize,
          offset: (page - 1) * pageSize,
        });
        if (active) {
          setData(next);
        }
      } catch (error) {
        if (active) {
          setData(null);
          setError(error instanceof Error ? error.message : "Failed to load tasks.");
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
  }, [enabled, page, pageSize, setError]);

  const totalPages = data == null ? 0 : Math.max(1, Math.ceil(data.count / pageSize));

  return { data, loading, totalPages };
}
