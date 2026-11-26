"use client";
// Public site header, driven by the published "navbar" global (passed in by the layout).
// Two looks from the design: "light" (dark text on white pages) and "on photo" (glass nav pill,
// logo on a white badge) when the page starts with a photo hero (`data-hero-photo`).
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import c from "./chrome.module.css";

export type HeaderProps = {
  logoText: string;
  logoAccent: string;
  logo: { url: string; alt: string } | null;
  items: { id: string; label: string; href: string }[];
  cta: { label: string; href: string };
};

const isCurrent = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

/** True when the first thing under the header is a photo hero. */
function usePhotoHero(pathname: string) {
  const [onPhoto, setOnPhoto] = useState(pathname !== "/");
  useEffect(() => {
    const check = () => {
      const hero = document.querySelector("[data-hero-photo]");
      setOnPhoto(Boolean(hero && hero.getBoundingClientRect().top + window.scrollY < 120));
    };
    check();
    // Sections stream in; check again once the page has settled.
    const t = window.setTimeout(check, 300);
    return () => window.clearTimeout(t);
  }, [pathname]);
  return onPhoto;
}

/** Crown mark + the navbar wording, no badge behind it. */
export function Logo({ logoText, logoAccent, logo, className = "" }: Pick<HeaderProps, "logoText" | "logoAccent" | "logo"> & { className?: string }) {
  return (
    <Link href="/" className={`${c.logo} ${className}`.trim()} aria-label={`${logoText} ${logoAccent} home`.replace(/\s+/g, " ").trim()}>
      {logo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo.url} alt="" className={c.logoMark} />
      )}
      {(logoText || logoAccent) && (
        <span className={c.logoWords}>
          {logoText && <strong>{logoText}</strong>}
          {logoText && logoAccent ? " " : ""}
          {logoAccent && <span className={c.logoLight}>{logoAccent}</span>}
        </span>
      )}
    </Link>
  );
}

export function SiteHeader({ logoText, logoAccent, logo, items, cta }: HeaderProps) {
  const pathname = usePathname();
  // The menu belongs to the page it was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (v: boolean) => setOpenOn(v ? pathname : null);
  const onPhoto = usePhotoHero(pathname);
  const links = items.filter((i) => i.label && i.href);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenOn(null);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className={`${c.header} ${onPhoto ? c.onPhoto : c.light}`}>
        <div className={c.headerInner}>
          <Logo logoText={logoText} logoAccent={logoAccent} logo={logo} />
          {links.length > 0 && (
            <nav className={c.nav} aria-label="Main Navigation">
              <ul className={c.navList}>
                {links.map((n) => {
                  const current = isCurrent(pathname, n.href);
                  return (
                    <li key={n.id}>
                      <Link href={n.href} className={current ? c.navLinkActive : c.navLink} aria-current={current ? "page" : undefined}>
                        {n.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          )}
          <div className={c.headerEnd}>
            {cta.href && (
              <Link href={cta.href} className={c.cta}>{cta.label || "Get Involved"}</Link>
            )}
            <button
              type="button"
              className={`${c.menuButton} ${open ? c.menuButtonOpen : ""}`}
              onClick={() => setOpen(!open)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-menu"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>
      <div id="mobile-menu" className={`${c.mobileMenu} ${open ? c.mobileMenuOpen : ""}`} aria-hidden={!open}>
        <nav aria-label="Mobile Navigation">
          <ul className={c.mobileList}>
            {links.map((n) => (
              <li key={n.id}>
                <Link
                  href={n.href}
                  className={isCurrent(pathname, n.href) ? c.mobileLinkActive : c.mobileLink}
                  onClick={() => setOpen(false)}
                  tabIndex={open ? 0 : -1}
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
          {cta.href && (
            <div className={c.mobileCta}>
              <Link href={cta.href} className={c.mobileCtaButton} onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>
                {cta.label || "Get Involved"}
              </Link>
            </div>
          )}
        </nav>
      </div>
    </>
  );
}
