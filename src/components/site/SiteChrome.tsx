"use client";
// Header + footer for the devotional pages, same markup and styles as the existing pages.
// (Phase 4 moves the nav/footer content into the CMS "navbar"/"footer" globals.)
import { useState } from "react";
import Link from "next/link";
import styles from "@/app/(site)/page.module.css";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/ministries", label: "Ministries" },
  { href: "/gallery", label: "Gallery" },
  { href: "/devotionals", label: "Devotionals" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader({ active }: { active?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className={`${styles.header} animate-fade-in`} style={{ animationDelay: "0.1s", background: "var(--glass-bg)" }}>
        <div className={styles.logoContainer}>
          <Link href="/" className={styles.textLogo}>
            City<span className={styles.textLogoLight}>Light</span>
          </Link>
        </div>
        <nav className={styles.nav} aria-label="Main Navigation">
          <ul className={styles.navUl}>
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className={n.href === active ? styles.activeNavLink : styles.navLink} aria-current={n.href === active ? "page" : undefined}>
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <Link href="/contact" className={styles.preOrderBtn} id="header-preorder-btn">
          Get Involved
        </Link>
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
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className={n.href === active ? styles.mobileActiveNavLink : styles.mobileNavLink} onClick={() => setOpen(false)}>
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className={styles.ctaFooterSection} id="contact">
      <div className={styles.ctaFooterContainer}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaHeadline}>Ready to Experience His Extravagant Love?</h2>
          <p className={styles.ctaSubtext}>
            Join us every Sunday 10:30am at The Motorpoint Arena in Nottingham. We would love to welcome you and stand in agreement with you in prayer.
          </p>
          <div className={styles.ctaButtonWrapper}>
            <Link href="/contact" className={styles.ctaButton}>Send Us a Prayer Request</Link>
          </div>
        </div>
        <div className={styles.footerOverlay}>
          <div className={styles.footerTopRow}>
            <span className={styles.footerCopyrightText}>© Copyright 2026</span>
            <div className={styles.footerDividerLine} />
            <span className={styles.footerCopyrightText}>The Light City Church. All Rights Reserved.</span>
          </div>
          <nav className={styles.footerNav} aria-label="Footer">
            <ul className={styles.footerNavList}>
              {NAV.map((n) => (
                <li key={n.href}><Link href={n.href} className={styles.footerNavLink}>{n.label}</Link></li>
              ))}
            </ul>
          </nav>
          <div className={styles.giantBrandContainer}>
            <p className={styles.giantBrandText} aria-hidden>LIGHT CITY</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
