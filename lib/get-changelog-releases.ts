import { readdir, readFile } from "fs/promises";
import path from "path";

export type ChangelogReleaseFile = {
  version: string;
  filename: string;
  markdown: string;
};

const SEMVER_FILE_RE = /^v?(\d+)\.(\d+)\.(\d+)\.md$/i;

function semverKey(filename: string): [number, number, number] | null {
  const m = filename.match(SEMVER_FILE_RE);
  if (!m) {
    return null;
  }
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function compareSemverDesc(a: string, b: string): number {
  const ka = semverKey(a);
  const kb = semverKey(b);
  if (!ka || !kb) {
    return b.localeCompare(a);
  }
  for (let i = 0; i < 3; i++) {
    if (ka[i] !== kb[i]) {
      return kb[i] - ka[i];
    }
  }
  return 0;
}

/**
 * Reads every `changelog/<semver>.md` file (optional leading `v`), newest version first.
 */
export async function getChangelogReleases(): Promise<ChangelogReleaseFile[]> {
  const dir = path.join(process.cwd(), "changelog");
  let names: string[];
  try {
    names = await readdir(dir);
  } catch {
    return [];
  }

  const mdFiles = names.filter((n) => n.toLowerCase().endsWith(".md") && semverKey(n) !== null);

  const out: ChangelogReleaseFile[] = [];
  for (const filename of mdFiles) {
    const version = filename.replace(/\.md$/i, "").replace(/^v/i, "");
    const fullPath = path.join(dir, filename);
    const markdown = await readFile(fullPath, "utf-8");
    out.push({ version, filename, markdown });
  }

  out.sort((x, y) => compareSemverDesc(x.filename, y.filename));
  return out;
}
