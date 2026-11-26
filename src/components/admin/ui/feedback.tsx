import { AlertTriangle, CheckCircle2, Info, XCircle, type LucideIcon } from "lucide-react";
import { cn } from "./cn";

type Tone = "neutral" | "info" | "success" | "warning" | "danger";

const badgeTones: Record<Tone, string> = {
  neutral: "bg-subtle text-muted",
  info: "bg-info-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

export function Badge({ tone = "neutral", className, ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", badgeTones[tone], className)}
      {...props}
    />
  );
}

const alertIcons: Record<Exclude<Tone, "neutral">, LucideIcon> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: Exclude<Tone, "neutral">;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const Icon = alertIcons[tone];
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-lg px-3.5 py-3 text-sm", badgeTones[tone], className)}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="space-y-0.5">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="text-fg/90">{children}</div>}
      </div>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 px-6 py-12 text-center", className)}>
      {Icon && (
        <div className="mb-1 rounded-full bg-subtle p-3 text-muted">
          <Icon className="size-6" aria-hidden />
        </div>
      )}
      <p className="font-medium text-fg">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-fg">{title}</h1>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
