"use client";
// Public form islands. Validation happens on the server (submitForm builds Zod from the form's
// definition); these only collect input and show the result.
import { useRef, useState } from "react";
import { submitForm } from "@/cms/actions/submit-form";
import { Turnstile, type TurnstileHandle } from "@/components/site/Turnstile";
import type { PublicFormField } from "@/cms/queries";
import ds from "@/components/site/ds.module.css";
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

/** The design's dark pill with the amber arrow badge, as a real submit button. */
function SubmitButton({ label, disabled }: { label: string; disabled: boolean }) {
  return (
    <button type="submit" className={`${ds.btnPrimary} ${s.submit}`} disabled={disabled}>
      <span>{label}</span>
      <span className={ds.btnBadge} aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/arrow-up-right-dark.svg" alt="" width={16} height={16} />
      </span>
    </button>
  );
}

/** Short fields sit two to a row; textareas and checkboxes take the full row, and so does the
 *  last short field of an odd-sized run. */
function fullWidthKeys(fields: PublicFormField[]): Set<string> {
  const wide = new Set<string>();
  const isShort = (f: PublicFormField) => !["textarea", "checkbox", "consent"].includes(f.type);
  let run: PublicFormField[] = [];
  const flush = () => {
    if (run.length % 2 === 1) wide.add(run[run.length - 1].key);
    run = [];
  };
  for (const f of fields) {
    if (isShort(f)) run.push(f);
    else {
      flush();
      wide.add(f.key);
    }
  }
  flush();
  return wide;
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
  if (status.kind === "ok") return <p className={s.alertOk} role="status">{status.message}</p>;
  const wide = fullWidthKeys(fields);

  const control = (fld: PublicFormField) => {
    const id = `f-${slug}-${fld.key}`;
    const err = fieldErrors[fld.key];
    const common = { id, name: fld.key, required: fld.required, "aria-invalid": err ? true : undefined, "aria-describedby": err ? `${id}-err` : undefined } as const;
    const label = `${fld.label}${fld.required ? " *" : ""}`;
    const error = err ? <p id={`${id}-err`} className={s.fieldError}>{err}</p> : null;
    if (fld.type === "checkbox" || fld.type === "consent") {
      return (
        <div key={fld.key} className={s.fieldWide}>
          <label className={s.checkboxRow}><input type="checkbox" {...common} /> <span>{label}</span></label>
          {error}
        </div>
      );
    }
    let input: React.ReactNode;
    if (fld.type === "textarea") input = <textarea className={s.textarea} placeholder={fld.placeholder} {...common} />;
    else if (fld.type === "select")
      input = (
        <select className={s.select} defaultValue="" {...common}>
          <option value="" disabled>Choose…</option>
          {(fld.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    else input = <input className={s.input} type={fld.type === "email" ? "email" : fld.type === "phone" ? "tel" : "text"} placeholder={fld.placeholder} autoComplete={fld.type === "email" ? "email" : fld.key === "name" ? "name" : fld.type === "phone" ? "tel" : undefined} {...common} />;
    return (
      <div key={fld.key} className={wide.has(fld.key) ? s.fieldWide : undefined}>
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
      {status.kind === "error" && <p className={`${s.alertError} ${s.fieldWide}`} role="alert">{status.message}</p>}
      {fields.map(control)}
      <Honeypot />
      <div className={s.fieldWide}><Turnstile ref={turnstile} onToken={setToken} /></div>
      <div className={s.fieldWide}><SubmitButton label={status.kind === "sending" ? "Sending…" : buttonLabel} disabled={status.kind === "sending"} /></div>
    </form>
  );
}

export function NewsletterFormClient({ buttonLabel }: { buttonLabel: string }) {
  const { status, fieldErrors, send, turnstile, setToken } = useSubmit("newsletter", "/");
  if (status.kind === "ok") return <p className={s.alertOk} role="status">{status.message}</p>;
  return (
    <form
      noValidate
      className={s.newsletterForm}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        void send({ email: String(fd.get("email") ?? "") }, String(fd.get("website") ?? ""));
      }}
    >
      <div className={s.newsletterRow}>
        <label htmlFor="newsletter-email" className={s.srOnly}>Email</label>
        <input id="newsletter-email" name="email" type="email" required autoComplete="email" placeholder="Email" className={s.input} aria-invalid={fieldErrors.email ? true : undefined} aria-describedby={fieldErrors.email ? "newsletter-email-err" : undefined} />
        <SubmitButton label={status.kind === "sending" ? "Signing up…" : buttonLabel} disabled={status.kind === "sending"} />
      </div>
      {fieldErrors.email && <p id="newsletter-email-err" className={s.fieldError}>{fieldErrors.email}</p>}
      {status.kind === "error" && <p className={`${s.alertError} ${s.alertSpaced}`} role="alert">{status.message}</p>}
      <Honeypot />
      <Turnstile ref={turnstile} onToken={setToken} />
    </form>
  );
}
