// Tiny template renderer for email_templates: {{var}} is HTML-escaped, {{{var}}} is raw
// (only ever given HTML the server built itself). Unknown variables render as "".

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type TemplateVars = Record<string, string | number | null | undefined>;

export function renderTemplate(template: string, vars: TemplateVars, raw: Record<string, string> = {}): string {
  return template
    .replace(/\{\{\{\s*([a-z0-9_]+)\s*\}\}\}/gi, (_, k: string) => raw[k] ?? "")
    .replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (_, k: string) => escapeHtml(vars[k]));
}

/** Plain-text subject line: no HTML escaping, newlines stripped (no header injection). */
export function renderSubject(template: string, vars: TemplateVars): string {
  return template
    .replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (_, k: string) => String(vars[k] ?? ""))
    .replace(/[\r\n]+/g, " ")
    .slice(0, 200);
}

/** A simple two-column HTML table of a submission's fields, escaped. */
export function detailsTable(rows: { label: string; value: string }[]): string {
  if (rows.length === 0) return "";
  const cells = rows
    .map(
      (r) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#5f6775;vertical-align:top;white-space:nowrap">${escapeHtml(r.label)}</td>` +
        `<td style="padding:6px 0;white-space:pre-wrap">${escapeHtml(r.value)}</td></tr>`,
    )
    .join("");
  return `<table style="border-collapse:collapse;margin:12px 0">${cells}</table>`;
}
