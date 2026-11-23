"use client";
import { forwardRef } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "./cn";
import { Spinner } from "./spinner";

const variants = {
  primary: "bg-primary text-primary-fg hover:bg-primary-hover",
  secondary: "bg-surface text-fg border border-border hover:bg-subtle",
  ghost: "text-fg hover:bg-subtle",
  danger: "bg-danger text-white hover:opacity-90",
} as const;

const sizes = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-base gap-2",
  icon: "h-10 w-10 justify-center",
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

/** Button classes, for links that should look like buttons. */
export function buttonStyles(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(
    "inline-flex items-center justify-center rounded-lg font-medium transition-colors",
    "disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
    variants[variant],
    sizes[size],
    className,
  );
}

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading = false, className, children, disabled, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonStyles(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
});

/** Submit button that shows a spinner while its parent <form action={…}> is pending. */
export function SubmitButton({ children, pendingText, ...props }: ButtonProps & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} {...props}>
      {pending && pendingText ? pendingText : children}
    </Button>
  );
}
