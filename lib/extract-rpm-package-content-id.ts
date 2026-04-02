/**
 * Extracts RPM package content UUID from a Pulp href (relative path or full URL).
 */
export function extractRpmPackageContentId(href: string | null | undefined): string | null {
  if (!href || typeof href !== "string") return null;
  const trimmed = href.trim();
  if (!trimmed) return null;

  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const url = new URL(trimmed);
      const match = url.pathname.match(/\/content\/rpm\/packages\/([^/]+)\/?$/);
      return match?.[1] ?? null;
    }
  } catch {
    // Fall through to path-only matching.
  }

  const match = trimmed.match(/\/content\/rpm\/packages\/([^/]+)\/?$/);
  return match?.[1] ?? null;
}
