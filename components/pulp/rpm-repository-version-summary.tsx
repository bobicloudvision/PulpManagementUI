import type {
  PulpRpmRepositoryVersion,
  PulpRpmRepositoryVersionContentKind,
} from "@/services/pulp/types";

function SummaryBucket({
  bucket,
}: {
  bucket: Record<string, PulpRpmRepositoryVersionContentKind>;
}) {
  const keys = Object.keys(bucket);
  if (keys.length === 0) {
    return <span className="text-zinc-400">—</span>;
  }
  return (
    <ul className="space-y-1 text-xs">
      {keys.map((k) => (
        <li key={k}>
          <span className="font-mono text-zinc-800 dark:text-zinc-200">{k}</span>
          <span className="mx-1 text-zinc-400">×</span>
          <span>{bucket[k].count}</span>
        </li>
      ))}
    </ul>
  );
}

export function RpmRepositoryVersionSummary({ version }: { version: PulpRpmRepositoryVersion }) {
  const s = version.content_summary;
  return (
    <div className="grid min-w-[12rem] gap-3 sm:grid-cols-3">
      <div>
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Added</p>
        <SummaryBucket bucket={s.added} />
      </div>
      <div>
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Removed</p>
        <SummaryBucket bucket={s.removed} />
      </div>
      <div>
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Present</p>
        <SummaryBucket bucket={s.present} />
      </div>
    </div>
  );
}
