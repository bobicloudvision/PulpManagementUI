import type {
  PulpRpmRepositoryVersion,
  PulpRpmRepositoryVersionContentKind,
  PulpRpmRepositoryVersionContentSummary,
} from "@/services/pulp/types";

function parseKindEntry(v: unknown): PulpRpmRepositoryVersionContentKind | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const count = typeof o.count === "number" ? o.count : 0;
  const href = typeof o.href === "string" ? o.href : "";
  return { count, href };
}

function parseBucket(v: unknown): Record<string, PulpRpmRepositoryVersionContentKind> {
  const out: Record<string, PulpRpmRepositoryVersionContentKind> = {};
  if (!v || typeof v !== "object") return out;
  for (const [key, val] of Object.entries(v as Record<string, unknown>)) {
    const parsed = parseKindEntry(val);
    if (parsed) {
      out[key] = parsed;
    }
  }
  return out;
}

function parseContentSummary(raw: unknown): PulpRpmRepositoryVersionContentSummary {
  if (!raw || typeof raw !== "object") {
    return { added: {}, removed: {}, present: {} };
  }
  const o = raw as Record<string, unknown>;
  return {
    added: parseBucket(o.added),
    removed: parseBucket(o.removed),
    present: parseBucket(o.present),
  };
}

export function mapPulpRpmRepositoryVersion(row: Record<string, unknown>): PulpRpmRepositoryVersion {
  const base =
    row.base_version === null || typeof row.base_version === "string" ? row.base_version : null;

  return {
    pulp_href: typeof row.pulp_href === "string" ? row.pulp_href : "",
    pulp_created: typeof row.pulp_created === "string" ? row.pulp_created : "",
    number: typeof row.number === "number" ? row.number : 0,
    repository: typeof row.repository === "string" ? row.repository : "",
    base_version: base,
    content_summary: parseContentSummary(row.content_summary),
  };
}

export function isRpmRepositoryVersionInstancePath(apiPath: string): boolean {
  return /\/repositories\/rpm\/rpm\/[^/]+\/versions\/\d+\/?$/.test(apiPath);
}
