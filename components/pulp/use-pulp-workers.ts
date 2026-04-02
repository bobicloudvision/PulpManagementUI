"use client";

import { useEffect, useState } from "react";
import { usePulpAuthContext } from "./auth-context";
import { PulpWorker } from "@/services/pulp/types";
import { pulpWorkerService } from "@/services/pulp/worker-service";

export function usePulpWorkers(enabled: boolean) {
  const { setError } = usePulpAuthContext();
  const [workers, setWorkers] = useState<PulpWorker[]>([]);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!enabled) {
        setWorkers([]);
        return;
      }

      try {
        const next = await pulpWorkerService.list();
        if (active) {
          setWorkers(next);
        }
      } catch (error) {
        if (active) {
          setError(error instanceof Error ? error.message : "Failed to load workers.");
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [enabled, setError]);

  return { workers };
}
