"use client";

import { useEffect, useMemo, useState } from "react";
import { usePulpAuthContext } from "./auth-context";
import { pulpUploadService } from "@/services/pulp/upload-service";
import { PulpUploadItem } from "@/services/pulp/types";

function extractOffset(raw: string | null): number | null {
  if (!raw) return null;
  const hrefMatch = raw.match(/href="([^"]+)"/i);
  const normalized = hrefMatch?.[1] ?? raw;

  try {
    const url = new URL(normalized);
    const offset = url.searchParams.get("offset");
    if (!offset) return null;
    return Number(offset);
  } catch {
    return null;
  }
}

export function usePulpUploads(enabled: boolean, limit = 50) {
  const { setError } = usePulpAuthContext();
  const [items, setItems] = useState<PulpUploadItem[]>([]);
  const [count, setCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [previousOffset, setPreviousOffset] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!enabled) {
        setItems([]);
        setCount(0);
        setOffset(0);
        setNextOffset(null);
        setPreviousOffset(null);
        return;
      }

      try {
        const page = await pulpUploadService.list(limit, offset);
        if (!active) return;

        setItems(page.results);
        setCount(page.count);
        setNextOffset(extractOffset(page.next));
        setPreviousOffset(extractOffset(page.previous));
      } catch (error) {
        if (active) {
          setError(error instanceof Error ? error.message : "Failed to load uploads.");
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [enabled, limit, offset, setError]);

  const page = useMemo(() => Math.floor(offset / limit) + 1, [offset, limit]);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / limit)), [count, limit]);

  return {
    uploads: items,
    count,
    page,
    totalPages,
    canGoNext: nextOffset !== null,
    canGoPrevious: previousOffset !== null,
    goNext: () => {
      if (nextOffset !== null) setOffset(nextOffset);
    },
    goPrevious: () => {
      if (previousOffset !== null) setOffset(previousOffset);
    },
  };
}
