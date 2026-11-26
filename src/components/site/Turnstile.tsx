"use client";
// Cloudflare Turnstile spam check for public forms. Renders nothing when
// NEXT_PUBLIC_TURNSTILE_SITE_KEY isn't set (the server then skips the check too).
import Script from "next/script";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export type TurnstileHandle = { reset: () => void };

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export const Turnstile = forwardRef<TurnstileHandle, { onToken: (token: string | undefined) => void }>(
  function Turnstile({ onToken }, ref) {
    const container = useRef<HTMLDivElement>(null);
    const widgetId = useRef<string | null>(null);
    const [loaded, setLoaded] = useState(() => typeof window !== "undefined" && Boolean(window.turnstile));

    const render = useCallback(() => {
      if (!SITE_KEY || !window.turnstile || !container.current || widgetId.current) return;
      widgetId.current = window.turnstile.render(container.current, {
        sitekey: SITE_KEY,
        theme: "auto",
        callback: (token: string) => onToken(token),
        "expired-callback": () => onToken(undefined),
        "error-callback": () => onToken(undefined),
      });
    }, [onToken]);

    useEffect(() => {
      if (loaded) render();
      return () => {
        if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      };
    }, [loaded, render]);

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
        onToken(undefined);
      },
    }));

    if (!SITE_KEY) return null;
    return (
      <>
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onReady={() => setLoaded(true)}
        />
        <div ref={container} />
      </>
    );
  },
);
