// CSV export (RFC 4180) with spreadsheet formula-injection protection. Pure; unit-tested.

export type CsvColumn<T> = { header: string; value: (row: T) => unknown };

/** Cells starting with these are run as formulas by Excel/Sheets, so they get a leading '. */
const FORMULA_START = /^[=+\-@\t\r]/;

export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s: string;
  if (value instanceof Date) s = value.toISOString();
  else if (typeof value === "object") s = JSON.stringify(value);
  else s = String(value);
  if (FORMULA_START.test(s)) s = "'" + s;
  return /[",\r\n]/.test(s) || s !== s.trim() ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Build a CSV document. Starts with a UTF-8 BOM so Excel shows accents and emoji correctly,
 * and uses CRLF line endings as the RFC asks.
 */
export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const lines = [columns.map((c) => csvCell(c.header)).join(",")];
  for (const row of rows) lines.push(columns.map((c) => csvCell(c.value(row))).join(","));
  return "﻿" + lines.join("\r\n") + "\r\n";
}
