"use client";
import Link from "next/link";
import { useActionState } from "react";
import { Alert, Field, Input, PasswordInput, SubmitButton } from "@/components/admin/ui";
import { signIn, type FormState } from "../actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState<FormState, FormData>(signIn, {});
  return (
    <form action={action} className="space-y-4" noValidate>
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      {next && <input type="hidden" name="next" value={next} />}
      <Field label="Email" error={state.fieldErrors?.email}>
        <Input name="email" type="email" autoComplete="username" required autoFocus />
      </Field>
      <Field
        label="Password"
        error={state.fieldErrors?.password}
        aside={
          <Link href="/admin/reset-password" className="text-xs font-medium text-primary hover:underline">
            Forgot password?
          </Link>
        }
      >
        <PasswordInput name="password" autoComplete="current-password" required />
      </Field>
      <SubmitButton className="w-full" pendingText="Signing in…">Sign in</SubmitButton>
    </form>
  );
}
