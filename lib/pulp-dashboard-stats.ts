import { unstable_cache } from "next/cache";
import { decodePulpAuth, pulpFetch } from "@/lib/pulp";

type PulpCountListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: unknown[];
};

export type PulpDashboardStatsResult =
  | {
      ok: true;
      usersCount: number;
      groupsCount: number;
      rpmRepositories: number;
      debRepositories: number;
      repositoriesTotal: number;
    }
  | { ok: false; detail: string; status?: number };

async function loadPulpDashboardStats(authEncoded: string): Promise<PulpDashboardStatsResult> {
  const auth = decodePulpAuth(authEncoded);
  if (!auth) {
    return { ok: false, detail: "Invalid session." };
  }

  const [usersRes, groupsRes, rpmRes, debRes] = await Promise.all([
    pulpFetch<PulpCountListResponse>("/users/?limit=1&offset=0", auth),
    pulpFetch<PulpCountListResponse>("/groups/?limit=1&offset=0", auth),
    pulpFetch<PulpCountListResponse>("/repositories/rpm/rpm/?limit=1&offset=0", auth),
    pulpFetch<PulpCountListResponse>("/repositories/deb/apt/?limit=1&offset=0", auth),
  ]);

  for (const res of [usersRes, groupsRes, rpmRes, debRes]) {
    if (!res.ok) {
      return { ok: false, detail: res.detail, status: res.status };
    }
  }

  const rpm = rpmRes.data.count;
  const deb = debRes.data.count;

  return {
    ok: true,
    usersCount: usersRes.data.count,
    groupsCount: groupsRes.data.count,
    rpmRepositories: rpm,
    debRepositories: deb,
    repositoriesTotal: rpm + deb,
  };
}

export const getCachedPulpDashboardStats = unstable_cache(
  async (authEncoded: string) => loadPulpDashboardStats(authEncoded),
  ["pulp-dashboard-stats"],
  { revalidate: 60, tags: ["pulp-dashboard"] }
);
