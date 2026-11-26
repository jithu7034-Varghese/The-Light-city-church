"use client";
import { useActionState } from "react";
import { Alert, Field, Input, SubmitButton } from "@/components/admin/ui";
import { acceptInvite, type FormState } from "../actions";
import { NewPasswordFields } from "../reset-password/forms";

export function AcceptInviteForm({ defaultName }: { defaultName: string }) {
  const [state, action] = useActionState<FormState, FormData>(acceptInvite, {});
  return (
    <form action={action} className="space-y-4" noValidate>
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      <Field label="Your name" error={state.fieldErrors?.fullName}>
        <Input name="fullName" autoComplete="name" defaultValue={defaultName} required autoFocus />
      </Field>
      <NewPasswordFields state={state} />
      <SubmitButton className="w-full" pendingText="Setting up…">Create account</SubmitButton>
    </form>
  );
}
