import { HTMLAttributes } from "react";
import { cn } from "./cn";

type CardProps = HTMLAttributes<HTMLElement>;
type CardTitleProps = HTMLAttributes<HTMLHeadingElement>;
type CardContentProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <section
      className={cn("rounded-lg border border-zinc-200 p-4 dark:border-zinc-800", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: CardTitleProps) {
  return <h2 className={cn("mb-3 text-lg font-medium", className)} {...props} />;
}

export function CardContent({ className, ...props }: CardContentProps) {
  return <div className={cn(className)} {...props} />;
}
