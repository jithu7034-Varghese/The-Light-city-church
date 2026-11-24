import { connection } from "next/server";
import { Church } from "lucide-react";

// Session-checked, so navigating into these pages may block; ./loading.tsx covers the pages.
export const instant = false;

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  // Login, reset, invite and MFA pages check the session: always render per request.
  await connection();
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
