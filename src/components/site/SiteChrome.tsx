"use client";
// Public site header, driven by the published "navbar" global (passed in by the layout).
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "@/app/(site)/page.module.css";
import chrome from "./chrome.module.css";

export type HeaderProps = {
  logoText: string;
  logoAccent: string;
  logo: { url: string; alt: string } | null;
  items: { id: string; label: string; href: string }[];
  cta: { label: string; href: string };
};

const isCurrent = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

export function SiteHeader({ logoText, logoAccent, logo, items, cta }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const links = items.filter((i) => i.label && i.href);

  return (
    <>
      <header className={`${styles.header} animate-fade-in`} style={{ animationDelay: "0.1s" }}>
        <div className={styles.logoContainer}>
          <Link href="/" className={`${styles.textLogo} ${chrome.logo}`} aria-label={`${logoText}${logoAccent} home`}>
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo.url} alt={logo.alt} className={chrome.logoImage} />
            ) : (
              <>
                {logoText}
                <span className={styles.textLogoLight}>{logoAccent}</span>
              </>
            )}
          </Link>
        </div>
        <nav className={styles.nav} aria-label="Main Navigation">
          <ul className={styles.navUl}>
            {links.map((n) => {
              const current = isCurrent(pathname, n.href);
              return (
                <li key={n.id}>
                  <Link href={n.href} className={current ? styles.activeNavLink : styles.navLink} aria-current={current ? "page" : undefined}>
                    {n.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        {cta.href && (
          <Link href={cta.href} className={styles.preOrderBtn} id="header-preorder-btn">
            {cta.label || "Get Involved"}
          </Link>
        )}
        <button
          className={`${styles.hamburgerButton} ${open ? styles.hamburgerActive : ""}`}
          onClick={() => setOpen(!open)}
          aria-label="Toggle Navigation Menu"
          aria-expanded={open}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </header>
      <div className={`${styles.mobileMenuOverlay} ${open ? styles.mobileMenuOpen : ""}`}>
        <nav className={styles.mobileNav} aria-label="Mobile Navigation">
          <ul className={styles.mobileNavUl}>
            {links.map((n) => (
              <li key={n.id}>
                <Link href={n.href} className={isCurrent(pathname, n.href) ? styles.mobileActiveNavLink : styles.mobileNavLink} onClick={() => setOpen(false)}>
                  {n.label}
                </Link>
              </li>
            ))}
            {cta.href && (
              <li>
                <Link href={cta.href} className={styles.mobileMenuBtn} onClick={() => setOpen(false)}>
                  {cta.label || "Get Involved"}
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </>
  );
}
