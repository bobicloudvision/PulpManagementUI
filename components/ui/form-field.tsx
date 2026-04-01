import { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

type FormFieldProps = HTMLAttributes<HTMLLabelElement> & {
  label: ReactNode;
};

export function FormField({ label, className, children, ...props }: FormFieldProps) {
  return (
    <label className={cn("flex flex-col gap-2 text-sm", className)} {...props}>
      {label}
      {children}
    </label>
  );
}

type CheckboxFieldProps = Omit<HTMLAttributes<HTMLLabelElement>, "children"> & {
  label: ReactNode;
  children: ReactNode;
};

export function CheckboxField({
  label,
  children,
  className,
  ...props
}: CheckboxFieldProps) {
  return (
    <label className={cn("inline-flex items-center gap-2 text-sm", className)} {...props}>
      {children}
      {label}
    </label>
  );
}
