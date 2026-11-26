"use client";
// Public form islands. Validation happens on the server (submitForm builds Zod from the form's
// definition); these only collect input and show the result.
import { useRef, useState } from "react";
import { submitForm } from "@/cms/actions/submit-form";
import { Turnstile, type TurnstileHandle } from "@/components/site/Turnstile";
import type { PublicFormField } from "@/cms/queries";
import s from "./shared.module.css";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "ok"; message: string } | { kind: "error"; message: string };

function useSubmit(slug: string, sourcePage: string) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [token, setToken] = useState<string | undefined>();
  const turnstile = useRef<TurnstileHandle>(null);

  async function send(data: Record<string, unknown>, honeypot: string) {
    setStatus({ kind: "sending" });
    setFieldErrors({});
    try {
      const r = await submitForm(slug, data, { turnstileToken: token, sourcePage, website: honeypot });
      if (r.ok) setStatus({ kind: "ok", message: r.message });
      else {
        setFieldErrors(r.fieldErrors ?? {});
        setStatus({ kind: "error", message: r.error });
      }
    } catch {
      setStatus({ kind: "error", message: "Sorry, something went wrong. Please try again." });
    } finally {
      turnstile.current?.reset();
    }
  }
  return { status, fieldErrors, send, turnstile, setToken };
}

function Honeypot() {
  return (
    <div aria-hidden="true" className={s.honeypot}>
      <label>Website <input name="website" type="text" tabIndex={-1} autoComplete="off" /></label>
    </div>
  );
}

export function EnquiryFormClient({ slug, fields, buttonLabel, sourcePage }: { slug: string; fields: PublicFormField[]; buttonLabel: string; sourcePage: string }) {
  const { status, fieldErrors, send, turnstile, setToken } = useSubmit(slug, sourcePage);
  if (status.kind === "ok") return <p className={s.alertOk} role="status" style={{ marginTop: 24 }}>{status.message}</p>;

  const control = (fld: PublicFormField) => {
    const id = `f-${slug}-${fld.key}`;
    const err = fieldErrors[fld.key];
    const common = { id, name: fld.key, required: fld.required, "aria-invalid": err ? true : undefined, "aria-describedby": err ? `${id}-err` : undefined } as const;
    const label = `${fld.label}${fld.required ? " *" : ""}`;
    const error = err ? <p id={`${id}-err`} className={s.fieldError}>{err}</p> : null;
    if (fld.type === "checkbox" || fld.type === "consent") {
      return (
        <div key={fld.key}>
          <label className={s.checkboxRow}><input type="checkbox" {...common} /> <span>{label}</span></label>
          {error}
        </div>
      );
    }
    let input: React.ReactNode;
    if (fld.type === "textarea") input = <textarea className={s.textarea} placeholder={fld.placeholder} {...common} />;
    else if (fld.type === "select")
      input = (
        <select className={s.input} defaultValue="" {...common}>
          <option value="" disabled>Choose…</option>
          {(fld.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    else input = <input className={s.input} type={fld.type === "email" ? "email" : fld.type === "phone" ? "tel" : "text"} placeholder={fld.placeholder} autoComplete={fld.type === "email" ? "email" : fld.key === "name" ? "name" : fld.type === "phone" ? "tel" : undefined} {...common} />;
    return (
      <div key={fld.key}>
        <label htmlFor={id} className={s.label}>{label}</label>
        {input}
        {error}
      </div>
    );
  };

  return (
    <form
      className={s.form}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const data: Record<string, unknown> = {};
        for (const fld of fields) data[fld.key] = fld.type === "checkbox" || fld.type === "consent" ? fd.get(fld.key) === "on" : String(fd.get(fld.key) ?? "");
        void send(data, String(fd.get("website") ?? ""));
      }}
    >
      {status.kind === "error" && <p className={s.alertError} role="alert">{status.message}</p>}
      {fields.map(control)}
      <Honeypot />
      <Turnstile ref={turnstile} onToken={setToken} />
      <div><button type="submit" className={s.button} disabled={status.kind === "sending"}>{status.kind === "sending" ? "Sending…" : buttonLabel}</button></div>
    </form>
  );
}

export function NewsletterFormClient({ buttonLabel }: { buttonLabel: string }) {
  const { status, fieldErrors, send, turnstile, setToken } = useSubmit("newsletter", "/");
  if (status.kind === "ok") return <p className={s.alertOk} role="status" style={{ marginTop: 24 }}>{status.message}</p>;
  return (
    <form
      noValidate
      style={{ marginTop: 28 }}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        void send({ email: String(fd.get("email") ?? "") }, String(fd.get("website") ?? ""));
      }}
    >
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <label htmlFor="newsletter-email" className="sr-only" style={{ position: "absolute", left: -10000 }}>Email</label>
        <input id="newsletter-email" name="email" type="email" required autoComplete="email" placeholder="Email" className={s.input} style={{ maxWidth: 360 }} aria-invalid={fieldErrors.email ? true : undefined} />
        <button type="submit" className={s.button} disabled={status.kind === "sending"}>{status.kind === "sending" ? "Signing up…" : buttonLabel}</button>
      </div>
      {fieldErrors.email && <p className={s.fieldError}>{fieldErrors.email}</p>}
      {status.kind === "error" && <p className={s.alertError} role="alert" style={{ marginTop: 16 }}>{status.message}</p>}
      <Honeypot />
      <Turnstile ref={turnstile} onToken={setToken} />
    </form>
  );
}
