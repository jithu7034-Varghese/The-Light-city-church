"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "../ui/cn";
import { THEME_COOKIE, type AdminTheme } from "../theme";

const OPTIONS: { value: AdminTheme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

/** Switch instantly in the browser; the cookie makes the server render it on the next load. */
function applyTheme(value: AdminTheme) {
  document.documentElement.dataset.theme = value;
  document.cookie = `${THEME_COOKIE}=${value}; path=/admin; max-age=31536000; samesite=lax`;
}

export function ThemeToggle({ initial }: { initial: AdminTheme }) {
  const [theme, setTheme] = useState<AdminTheme>(initial);
  const router = useRouter();

  function choose(value: AdminTheme) {
    setTheme(value);
    applyTheme(value);
    router.refresh(); // re-render server parts (toaster theme) with the new cookie
  }

  return (
    <div role="radiogroup" aria-label="Colour theme" className="flex rounded-lg border border-border bg-subtle p-0.5">
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          aria-label={label}
          title={label}
          onClick={() => choose(value)}
          className={cn(
            "flex size-7 items-center justify-center rounded-md text-muted transition-colors hover:text-fg",
            theme === value && "bg-surface text-fg shadow-sm",
          )}
        >
          <Icon className="size-3.5" aria-hidden />
        </button>
      ))}
    </div>
  );
}
