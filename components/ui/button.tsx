import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "./cn";

type ButtonVariant = "primary" | "outline";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClassName: Record<ButtonVariant, string> = {
  primary:
    "bg-black text-white dark:bg-white dark:text-black border border-transparent",
  outline: "border border-zinc-300 bg-transparent text-inherit dark:border-zinc-700",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "w-fit rounded-md px-4 py-2 text-sm disabled:opacity-50",
          variantClassName[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
