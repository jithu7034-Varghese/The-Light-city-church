"use client";
// The "Contact / Get Involved" form (forms.slug = 'get-involved'), wired exactly as on the old
// contact page: client checks → submitForm() server action (validated on the server) with the
// Turnstile token and the honeypot. All visible text comes from the section's fields.
import { useRef, useState } from "react";
import { submitForm } from "@/cms/actions/submit-form";
import { Turnstile, type TurnstileHandle } from "@/components/site/Turnstile";
import { ds } from "@/components/site/ds";
import c from "./contact.module.css";

export type ContactFormText = {
  nameLabel: string;
  namePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  phoneLabel: string;
  phonePlaceholder: string;
  subjectLabel: string;
  subjectPlaceholder: string;
  messageLabel: string;
  messagePlaceholder: string;
  buttonLabel: string;
  sendingLabel: string;
  successTitle: string;
  errorTitle: string;
  errorText: string;
};

const EMPTY = { name: "", email: "", phone: "", subject: "", message: "" };
const ERROR_BORDER = { borderColor: "#dc2626" };

export function ContactForm({ text, sourcePage }: { text: ContactFormText; sourcePage: string }) {
  const [formData, setFormData] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>();
  const [honeypot, setHoneypot] = useState("");
  const turnstileRef = useRef<TurnstileHandle>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  // Only marks fields (red border); the wording of any message comes from the server.
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "required";
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "invalid";
    if (!formData.message.trim()) newErrors.message = "required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitStatus("submitting");
    setServerMessage(null);

    try {
      const result = await submitForm("get-involved", formData, {
        turnstileToken,
        sourcePage,
        website: honeypot,
      });
      if (result.ok) {
        setSubmitStatus("success");
        setServerMessage(result.message);
        setFormData(EMPTY);
      } else {
        setSubmitStatus("error");
        setServerMessage(result.error);
        if (result.fieldErrors) setErrors(result.fieldErrors);
      }
    } catch {
      setSubmitStatus("error");
    } finally {
      turnstileRef.current?.reset(); // tokens are single-use
    }
  };

  return (
    <form onSubmit={handleSubmit} className={c.form}>
      {submitStatus === "success" && (
        <div className={c.successAlert} role="status">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }} aria-hidden>
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <div>
            {text.successTitle && <strong>{text.successTitle}</strong>}
            {serverMessage && <p className={c.alertText}>{serverMessage}</p>}
          </div>
        </div>
      )}

      {submitStatus === "error" && (
        <div className={c.errorAlert} role="alert">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }} aria-hidden>
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <div>
            {text.errorTitle && <strong>{text.errorTitle}</strong>}
            <p className={c.alertText}>{serverMessage ?? text.errorText}</p>
          </div>
        </div>
      )}

      <div className={c.fieldRow}>
        <div className={c.formGroup}>
          <label htmlFor="name" className={c.formLabel}>{text.nameLabel}</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={c.formInput}
            style={errors.name ? ERROR_BORDER : undefined}
            aria-invalid={errors.name ? true : undefined}
            placeholder={text.namePlaceholder}
            autoComplete="name"
            required
          />
        </div>

        <div className={c.formGroup}>
          <label htmlFor="email" className={c.formLabel}>{text.emailLabel}</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={c.formInput}
            style={errors.email ? ERROR_BORDER : undefined}
            aria-invalid={errors.email ? true : undefined}
            placeholder={text.emailPlaceholder}
            autoComplete="email"
            required
          />
        </div>
      </div>

      <div className={c.fieldRow}>
        <div className={c.formGroup}>
          <label htmlFor="phone" className={c.formLabel}>{text.phoneLabel}</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={c.formInput}
            style={errors.phone ? ERROR_BORDER : undefined}
            aria-invalid={errors.phone ? true : undefined}
            placeholder={text.phonePlaceholder}
            autoComplete="tel"
          />
        </div>

        <div className={c.formGroup}>
          <label htmlFor="subject" className={c.formLabel}>{text.subjectLabel}</label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className={c.formInput}
            style={errors.subject ? ERROR_BORDER : undefined}
            aria-invalid={errors.subject ? true : undefined}
            placeholder={text.subjectPlaceholder}
          />
        </div>
      </div>

      <div className={c.formGroup}>
        <label htmlFor="message" className={c.formLabel}>{text.messageLabel}</label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          className={c.formTextarea}
          style={errors.message ? ERROR_BORDER : undefined}
          aria-invalid={errors.message ? true : undefined}
          placeholder={text.messagePlaceholder}
          required
        />
      </div>

      {/* Honeypot: hidden from people and screen readers, bots fill it in */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
      </div>

      <Turnstile ref={turnstileRef} onToken={setTurnstileToken} />

      <div className={c.formActions}>
        <button type="submit" disabled={submitStatus === "submitting"} aria-busy={submitStatus === "submitting"} className={`${ds.btnPrimary} ${c.formBtn}`}>
          <span>{submitStatus === "submitting" ? text.sendingLabel : text.buttonLabel}</span>
          <span className={ds.btnBadge} aria-hidden>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/arrow-up-right-dark.svg" alt="" width={16} height={16} />
          </span>
        </button>
      </div>
    </form>
  );
}
