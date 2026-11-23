import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Alert } from "@/components/admin/ui";
import { getSessionUser } from "@/lib/auth/session";
import { safeAdminRedirect } from "@/lib/auth/gate";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

const MESSAGES: Record<string, { tone: "info" | "warning" | "danger"; text: string }> = {
  "link-expired": { tone: "warning", text: "That link has expired or was already used. Request a new one below or ask an administrator." },
  inactive: { tone: "danger", text: "This account isn't active. Please ask an administrator to give you access." },
  idle: { tone: "info", text: "You were signed out after 30 minutes of inactivity." },
};

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;
  const error = typeof params.error === "string" ? params.error : undefined;

  const user = await getSessionUser();
  if (user?.gate === "ok") redirect(safeAdminRedirect(next));

  const message = error ? MESSAGES[error] : undefined;
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-muted">Use the email address your invite was sent to.</p>
      </div>
      {message && <Alert tone={message.tone}>{message.text}</Alert>}
      <LoginForm next={next} />
    </div>
  );
}
