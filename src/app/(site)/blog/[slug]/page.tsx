// src/app/blog/[slug]/page.tsx
"use client";

import { use, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "../../page.module.css";
import blogStyles from "../blog.module.css";
import blogsData from "@/data/blogs.json";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function BlogDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { slug } = resolvedParams;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Find the current article
  const article = blogsData.find(b => b.slug === slug);

  if (!article) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: "center", padding: "180px 0" }}>
          <h1 style={{ fontSize: "2rem", marginBottom: "16px" }}>Article Not Found</h1>
          <p style={{ color: "var(--text-secondary)", marginBottom: "32px" }}>The article you are looking for does not exist.</p>
          <Link href="/blog" className={blogStyles.backButton}>
            ← Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  // Get related articles (same category or others, excluding current)
  const relatedArticles = blogsData
    .filter(b => b.slug !== slug)
    .filter(b => b.category === article.category)
    .slice(0, 3);

  // If we don't have enough matching category, fill with others
  if (relatedArticles.length < 3) {
    const remaining = blogsData
      .filter(b => b.slug !== slug && !relatedArticles.some(r => r.slug === b.slug))
      .slice(0, 3 - relatedArticles.length);
    relatedArticles.push(...remaining);
  }

  return (
    <div className={styles.container} style={{ background: "transparent" }}>
      {/* Header */}
      <header className={`${styles.header} animate-fade-in`} style={{ animationDelay: '0.1s', background: "var(--glass-bg)" }}>
        <div className={styles.logoContainer}>
          <Link href="/" className={styles.textLogo}>
            City<span className={styles.textLogoLight}>Light</span>
          </Link>
        </div>

        <nav className={styles.nav} aria-label="Main Navigation">
          <ul className={styles.navUl}>
            <li>
              <Link href="/" className={styles.navLink}>Home</Link>
            </li>
            <li>
              <Link href="/about" className={styles.navLink}>About</Link>
            </li>
            <li>
              <Link href="/ministries" className={styles.navLink}>Ministries</Link>
            </li>
            <li>
              <Link href="/gallery" className={styles.navLink}>Gallery</Link>
            </li>
            <li>
              <Link href="/blog" className={styles.activeNavLink}>Blog</Link>
            </li>
            <li>
              <Link href="/contact" className={styles.navLink}>Contact</Link>
            </li>
          </ul>
        </nav>

        <button className={styles.preOrderBtn} id="header-preorder-btn" onClick={() => {
          window.location.href = '/#contact';
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          Get Involved
        </button>

        <button
          className={`${styles.hamburgerButton} ${isMobileMenuOpen ? styles.hamburgerActive : ""}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle Navigation Menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      <div className={`${styles.mobileMenuOverlay} ${isMobileMenuOpen ? styles.mobileMenuOpen : ""}`}>
        <nav className={styles.mobileNav} aria-label="Mobile Navigation">
          <ul className={styles.mobileNavUl}>
            <li>
              <Link href="/" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
            </li>
            <li>
              <Link href="/about" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>About</Link>
            </li>
            <li>
              <Link href="/ministries" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>Ministries</Link>
            </li>
            <li>
              <Link href="/gallery" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>Gallery</Link>
            </li>
            <li>
              <Link href="/blog" className={styles.mobileActiveNavLink} onClick={() => setIsMobileMenuOpen(false)}>Blog</Link>
            </li>
            <li>
              <Link href="/contact" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>Contact</Link>
            </li>
            <li>
              <button className={styles.mobileMenuBtn} onClick={() => {
                setIsMobileMenuOpen(false);
                window.location.href = '/#contact';
              }}>
                Get Involved
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Article Detail */}
      <article className={blogStyles.articleWrapper}>
        <Link href="/blog" className={blogStyles.backButton}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Blog
        </Link>

        <div className={blogStyles.articleCard}>
          <header className={blogStyles.articleHeader}>
          <span className={blogStyles.articleCategory}>{article.category}</span>
          <h1 className={blogStyles.articleTitle}>{article.title}</h1>
          
          <div className={blogStyles.metaRow}>
            <div className={blogStyles.authorMeta}>
              <div className={styles.authorAvatarWrapper} style={{ width: "36px", height: "36px" }}>
                <Image
                  src="/pastorronny.jpeg"
                  alt="Pastor Ronnie Dube"
                  width={36}
                  height={36}
                  className={blogStyles.authorAvatar}
                />
              </div>
              <span className={blogStyles.authorName}>{article.author}</span>
            </div>
            <span>•</span>
            <span>{new Date(article.pubDate).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric"
            })}</span>
          </div>
        </header>

        <div className={blogStyles.heroImageContainer}>
          <Image
            src={article.image}
            alt={article.title}
            fill
            sizes="(max-width: 1024px) 100vw, 720px"
            className={styles.blogCardImage}
            priority
          />
        </div>

        {/* Dynamic Body Content Parser */}
        <div className={blogStyles.articleBody}>
          {article.content.map((block, idx) => {
            switch (block.tag) {
              case "h2":
                return <h2 key={idx}>{block.text}</h2>;
              case "h3":
                return <h3 key={idx}>{block.text}</h3>;
              case "h4":
                return <h4 key={idx}>{block.text}</h4>;
              case "blockquote":
                return <blockquote key={idx}>“{block.text}”</blockquote>;
              case "li":
                return <li key={idx}>{block.text}</li>;
              default:
                return <p key={idx}>{block.text}</p>;
            }
          })}
          </div>
        </div>
      </article>

      {/* Related Posts Section */}
      <section className={blogStyles.relatedSection}>
        <div className={blogStyles.relatedContainer}>
          <h2 className={blogStyles.relatedTitle}>Related Articles</h2>
          <div className={blogStyles.relatedGrid}>
            {relatedArticles.map((rel, idx) => (
              <Link
                href={`/blog/${rel.slug}`}
                key={rel.slug}
                className={`${styles.blogCard} animate-premium-block`}
                style={{ animationDelay: `${0.1 + idx * 0.1}s` }}
              >
                <div className={styles.blogCardImageWrapper}>
                  <Image
                    src={rel.image}
                    alt={rel.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className={styles.blogCardImage}
                  />
                </div>
                <div className={styles.blogCardContent}>
                  <div className={styles.badgeRow}>
                    <span className={styles.blogPillBadge}>{rel.category}</span>
                  </div>
                  <h3 className={blogStyles.blogCardTitle} style={{ fontSize: "1.2rem", fontWeight: "600" }}>{rel.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.ctaFooterSection} id="contact">
        <div className={styles.ctaFooterContainer}>
          {/* Top Half: CTA Area */}
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaHeadline}>
              Ready to Experience His Extravagant{" "}
              <span className={styles.ctaBadgeWrapper}>
                <Image
                  src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=150&auto=format&fit=crop"
                  alt="Worship badge"
                  width={64}
                  height={32}
                  className={styles.ctaInlineBadge}
                />
              </span>{" "}
              Love?
            </h2>
            
            <p className={styles.ctaSubtext}>
              Join us every Sunday 10:30am at The Motorpoint Arena in Nottingham. We would love to welcome you and stand in agreement with you in prayer.
            </p>
            
            <div className={styles.ctaButtonWrapper}>
              <button className={styles.ctaButton} onClick={() => {
                window.location.href = 'mailto:info@thelightcitychurch.org?subject=Prayer%20Request%20/%20Contact';
              }}>
                Send Us a Prayer Request
                <span className={styles.ctaButtonArrow}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="7" y1="17" x2="17" y2="7" />
                    <polyline points="7 7 17 7 17 17" />
                  </svg>
                </span>
              </button>
            </div>
          </div>

          {/* Bottom Half: Glassmorphism Footer Overlay */}
          <div className={styles.footerOverlay}>
            <div className={styles.footerTopRow}>
              <span className={styles.footerCopyrightText}>© Copyright 2026</span>
              <div className={styles.footerDividerLine} />
              <span className={styles.footerCopyrightText}>The Light City Church. All Rights Reserved.</span>
            </div>
            
            <nav className={styles.footerNav}>
              <ul className={styles.footerNavList}>
                <li><Link href="/" className={styles.footerNavLink}>Home</Link></li>
                <li><Link href="/about" className={styles.footerNavLink}>About</Link></li>
                <li><Link href="/ministries" className={styles.footerNavLink}>Ministries</Link></li>
                <li><Link href="/gallery" className={styles.footerNavLink}>Gallery</Link></li>
                <li><Link href="/blog" className={styles.footerNavLink}>Blog</Link></li>
                <li><Link href="/contact" className={styles.footerNavLink}>Contact</Link></li>
              </ul>
            </nav>
            
            <div className={styles.giantBrandContainer}>
              <h1 className={styles.giantBrandText}>LIGHT CITY</h1>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
