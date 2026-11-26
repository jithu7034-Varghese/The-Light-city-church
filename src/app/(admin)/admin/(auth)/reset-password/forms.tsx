"use client";
import { useActionState } from "react";
import { Alert, Field, Input, PasswordInput, SubmitButton } from "@/components/admin/ui";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/gate";
import { requestPasswordReset, updatePassword, type FormState } from "../actions";

export function RequestResetForm() {
  const [state, action] = useActionState<FormState, FormData>(requestPasswordReset, {});
  if (state.success) return <Alert tone="success">{state.success}</Alert>;
  return (
    <form action={action} className="space-y-4" noValidate>
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      <Field label="Email" error={state.fieldErrors?.email}>
        <Input name="email" type="email" autoComplete="username" required autoFocus />
      </Field>
      <SubmitButton className="w-full" pendingText="Sending…">Send reset link</SubmitButton>
    </form>
  );
}

export function SetPasswordForm() {
  const [state, action] = useActionState<FormState, FormData>(updatePassword, {});
  return (
    <form action={action} className="space-y-4" noValidate>
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      <NewPasswordFields state={state} />
      <SubmitButton className="w-full" pendingText="Saving…">Save password</SubmitButton>
    </form>
  );
}

export function NewPasswordFields({ state }: { state: FormState }) {
  return (
    <>
      <Field label="New password" hint={`At least ${MIN_PASSWORD_LENGTH} characters. A short phrase is easiest to remember.`} error={state.fieldErrors?.password}>
        <PasswordInput name="password" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} required />
      </Field>
      <Field label="Confirm password" error={state.fieldErrors?.confirm}>
        <PasswordInput name="confirm" autoComplete="new-password" required />
      </Field>
    </>
  );
}
