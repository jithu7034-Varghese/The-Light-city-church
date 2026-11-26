"use client";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "./cn";

/**
 * Side panel (drawer) on native <dialog>: focus trap, Escape and inert background for free.
 * Full-width on phones, a right-hand panel from `sm` up.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="sheet-title"
      className={cn(
        "fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-full max-w-full border-l border-border bg-surface p-0 text-fg shadow-xl sm:max-w-xl",
        className,
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0 space-y-1">
            <h2 id="sheet-title" className="truncate text-lg font-semibold">{title}</h2>
            {description && <div className="text-sm text-muted">{description}</div>}
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 text-muted hover:bg-subtle hover:text-fg" aria-label="Close">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-border px-5 py-3">{footer}</div>}
      </div>
    </dialog>
  );
}
