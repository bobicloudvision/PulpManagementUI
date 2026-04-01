export const PULP_AUTH_COOKIE = "pulp_auth";

export type PulpAuth = {
  username: string;
  password: string;
};

type PulpErrorResponse = {
  detail?: string;
};

export function getPulpBaseUrl(): string {
  const rawValue = process.env.PULP_BASE_URL?.trim();
  if (!rawValue) {
    throw new Error("Missing PULP_BASE_URL environment variable.");
  }

  return rawValue.replace(/\/+$/, "");
}

export function getPulpApiUrl(pathname: string): string {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${getPulpBaseUrl()}${normalizedPath}`;
}

export function toBasicAuthHeader(auth: PulpAuth): string {
  const encoded = Buffer.from(`${auth.username}:${auth.password}`, "utf8").toString(
    "base64"
  );
  return `Basic ${encoded}`;
}

export function encodePulpAuth(auth: PulpAuth): string {
  const serialized = JSON.stringify(auth);
  return Buffer.from(serialized, "utf8").toString("base64url");
}

export function decodePulpAuth(value: string): PulpAuth | null {
  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded) as Partial<PulpAuth>;

    if (
      typeof parsed.username !== "string" ||
      parsed.username.length === 0 ||
      typeof parsed.password !== "string" ||
      parsed.password.length === 0
    ) {
      return null;
    }

    return {
      username: parsed.username,
      password: parsed.password,
    };
  } catch {
    return null;
  }
}

export async function pulpFetch<TData>(
  pathname: string,
  auth: PulpAuth,
  init?: RequestInit
): Promise<{ ok: true; status: number; data: TData } | { ok: false; status: number; detail: string }> {
  const headers = new Headers(init?.headers);
  headers.set("Authorization", toBasicAuthHeader(auth));
  headers.set("Accept", "application/json");

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(getPulpApiUrl(pathname), {
    ...init,
    headers,
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    if (response.ok) {
      return { ok: true, status: response.status, data: {} as TData };
    }

    return {
      ok: false,
      status: response.status,
      detail: `Pulp request failed with status ${response.status}.`,
    };
  }

  const json = (await response.json()) as TData | PulpErrorResponse;
  if (!response.ok) {
    const hasDetail =
      typeof json === "object" &&
      json !== null &&
      "detail" in json &&
      typeof (json as PulpErrorResponse).detail === "string";

    return {
      ok: false,
      status: response.status,
      detail: hasDetail
        ? (json as PulpErrorResponse).detail ?? `Pulp request failed with status ${response.status}.`
        : `Pulp request failed with status ${response.status}.`,
    };
  }

  return {
    ok: true,
    status: response.status,
    data: json as TData,
  };
}
