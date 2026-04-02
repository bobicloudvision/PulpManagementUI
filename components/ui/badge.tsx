import { HTMLAttributes, forwardRef } from "react";
import { cn } from "./cn";

type BadgeVariant = "default" | "success" | "warning" | "destructive" | "outline";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variantClassName: Record<BadgeVariant, string> = {
  default:
    "border-transparent bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100",
  success:
    "border-transparent bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300",
  warning:
    "border-transparent bg-amber-100 text-amber-950 dark:bg-amber-950/40 dark:text-amber-200",
  destructive:
    "border-transparent bg-red-100 text-red-900 dark:bg-red-950/50 dark:text-red-200",
  outline:
    "border-zinc-300 bg-transparent text-zinc-700 dark:border-zinc-600 dark:text-zinc-300",
};

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        variantClassName[variant],
        className
      )}
      {...props}
    />
  )
);

Badge.displayName = "Badge";

export { Badge };
export type { BadgeProps, BadgeVariant };
