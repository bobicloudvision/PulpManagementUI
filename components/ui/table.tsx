import {
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";
import { cn } from "./cn";

export function TableWrapper({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("w-full overflow-x-auto", className)} {...props} />;
}

export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return <table className={cn("w-full text-sm", className)} {...props} />;
}

export function TableHead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("bg-zinc-50 dark:bg-zinc-900/50", className)} {...props} />;
}

export function TableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      className={cn(
        "[&_tr]:transition-[background-color,opacity] [&_tr]:duration-150",
        "[&_tr:hover:not([data-frozen])]:bg-zinc-100/90 dark:[&_tr:hover:not([data-frozen])]:bg-zinc-800/45",
        className
      )}
      {...props}
    />
  );
}

type TableRowProps = HTMLAttributes<HTMLTableRowElement> & {
  /** Row is busy (e.g. async action); dims the row and blocks interaction. */
  frozen?: boolean;
};

export function TableRow({ className, frozen, ...props }: TableRowProps) {
  return (
    <tr
      data-frozen={frozen ? "true" : undefined}
      aria-busy={frozen || undefined}
      className={cn(
        "border-b border-zinc-200 last:border-b-0 dark:border-zinc-800",
        frozen &&
          "pointer-events-none bg-zinc-100/65 opacity-75 dark:bg-zinc-900/55 dark:opacity-80",
        className
      )}
      {...props}
    />
  );
}

export function TableHeaderCell({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500",
        className
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-3 py-2 align-middle", className)} {...props} />;
}
