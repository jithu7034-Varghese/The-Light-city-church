// Admin colour theme, stored in a cookie so the server renders the right theme (no flash).
export const THEME_COOKIE = "admin-theme";
export const THEMES = ["system", "light", "dark"] as const;
export type AdminTheme = (typeof THEMES)[number];

export function parseTheme(value: string | undefined | null): AdminTheme {
  return THEMES.includes(value as AdminTheme) ? (value as AdminTheme) : "system";
}
