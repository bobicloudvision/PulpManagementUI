export const PULP_AUTH_COOKIE = "pulp_auth";

export type PulpAuth = {
  username: string;
  password: string;
};

/**
 * Pulp/DRF may return { detail: "..." }, { detail: [...] }, or field keys like { name: ["..."] }.
 */
export function pulpErrorDetailFromBody(body: unknown): string | null {
  if (body === null || typeof body !== "object") {
    return null;
  }

  const o = body as Record<string, unknown>;
  const detail = o.detail;

  if (typeof detail === "string" && detail.trim().length > 0) {
    return detail.trim();
  }

  if (Array.isArray(detail)) {
    const parts = detail.map((x) => (typeof x === "string" ? x : JSON.stringify(x)));
    const joined = parts.filter((p) => p.length > 0).join(" ");
    if (joined.length > 0) {
      return joined;
    }
  }

  const fieldParts: string[] = [];
  for (const [key, val] of Object.entries(o)) {
    if (key === "detail" || key === "non_field_errors") {
      continue;
    }
    if (typeof val === "string" && val.trim().length > 0) {
      fieldParts.push(`${key}: ${val.trim()}`);
    } else if (Array.isArray(val)) {
      const msgs = val
        .map((x) => (typeof x === "string" ? x.trim() : JSON.stringify(x)))
        .filter((m) => m.length > 0);
      if (msgs.length > 0) {
        fieldParts.push(`${key}: ${msgs.join("; ")}`);
      }
    }
  }

  const nonField = o.non_field_errors;
  if (Array.isArray(nonField)) {
    const msgs = nonField
      .map((x) => (typeof x === "string" ? x.trim() : JSON.stringify(x)))
      .filter((m) => m.length > 0);
    if (msgs.length > 0) {
      fieldParts.unshift(msgs.join("; "));
    }
  }

  if (fieldParts.length > 0) {
    return fieldParts.join(" ");
  }

  return null;
}

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

  const rawText = await response.text();
  let parsed: unknown;
  if (rawText.length > 0) {
    try {
      parsed = JSON.parse(rawText) as unknown;
    } catch {
      parsed = undefined;
    }
  } else {
    parsed = undefined;
  }

  if (!response.ok) {
    const fromJson = pulpErrorDetailFromBody(parsed);
    let detail: string;
    if (fromJson != null) {
      detail = fromJson;
    } else {
      const nonJsonSnippet =
        rawText.length > 0 && parsed === undefined ? rawText.trim().slice(0, 500) : "";
      if (nonJsonSnippet.length > 0) {
        detail = nonJsonSnippet;
      } else {
        const statusText = response.statusText.trim();
        if (statusText.length > 0) {
          detail = statusText;
        } else {
          detail = `Pulp request failed with status ${response.status}.`;
        }
      }
    }
    return { ok: false, status: response.status, detail };
  }

  if (parsed === undefined) {
    return { ok: true, status: response.status, data: {} as TData };
  }

  return {
    ok: true,
    status: response.status,
    data: parsed as TData,
  };
}
