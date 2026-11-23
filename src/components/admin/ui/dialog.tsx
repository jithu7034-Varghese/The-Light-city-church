"use client";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "./button";
import { cn } from "./cn";

/**
 * Modal built on native <dialog>: focus trap, Escape to close and inert background for free.
 */
export function Dialog({
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
  title: string;
  description?: string;
  children?: React.ReactNode;
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
      aria-labelledby="dialog-title"
      className={cn(
        "m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-border bg-surface p-0 text-fg shadow-xl",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 px-5 pt-5">
        <div className="space-y-1">
          <h2 id="dialog-title" className="text-base font-semibold">{title}</h2>
          {description && <p className="text-sm text-muted">{description}</p>}
        </div>
        <button type="button" onClick={onClose} className="rounded-md p-1 text-muted hover:bg-subtle hover:text-fg" aria-label="Close">
          <X className="size-4" />
        </button>
      </div>
      {children && <div className="px-5 pt-4">{children}</div>}
      {footer && <div className="mt-5 flex justify-end gap-2 border-t border-border px-5 py-3">{footer}</div>}
    </dialog>
  );
}

/** "Are you sure?" dialog for destructive actions (admin UX baseline: confirm before delete). */
export function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title,
  description,
  confirmLabel = "Delete",
  loading = false,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  loading?: boolean;
}) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </>
      }
    />
  );
}
