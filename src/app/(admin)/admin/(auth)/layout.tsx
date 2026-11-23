import { Church } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="mb-6 flex items-center gap-2.5 text-fg">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-fg">
          <Church className="size-5" aria-hidden />
        </span>
        <span className="text-lg font-semibold tracking-tight">The Light City Church</span>
      </div>
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8">{children}</div>
      <p className="mt-6 text-xs text-muted">Staff access only</p>
    </main>
  );
}
