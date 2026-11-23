"use client";
import { forwardRef, useId, useState, cloneElement, isValidElement } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "./cn";

const fieldBase =
  "w-full rounded-lg border border-border bg-surface px-3 text-sm text-fg placeholder:text-muted " +
  "transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30 " +
  "disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-danger";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(fieldBase, "h-10", className)} {...props} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn(fieldBase, "min-h-24 py-2", className)} {...props} />;
  },
);

/** Password input with a show/hide toggle. */
export const PasswordInput = forwardRef<HTMLInputElement, Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">>(
  function PasswordInput({ className, ...props }, ref) {
    const [visible, setVisible] = useState(false);
    return (
      <div className="relative">
        <input ref={ref} type={visible ? "text" : "password"} className={cn(fieldBase, "h-10 pr-10", className)} {...props} />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted hover:text-fg"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    );
  },
);

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-medium text-fg", className)} {...props} />;
}

type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  /** Extra content on the label row, e.g. a "Forgot password?" link. */
  aside?: React.ReactNode;
  className?: string;
  /** A single input element; Field wires up id, aria-invalid and aria-describedby. */
  children: React.ReactElement<{ id?: string; "aria-invalid"?: boolean; "aria-describedby"?: string }>;
};

/** Label + input + hint + error, with accessible wiring. */
export function Field({ label, hint, error, aside, className, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const control = isValidElement(children)
    ? cloneElement(children, { id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy })
    : children;
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {aside}
      </div>
      {control}
      {hint && <p id={hintId} className="text-xs text-muted">{hint}</p>}
      {error && <p id={errorId} className="text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}
