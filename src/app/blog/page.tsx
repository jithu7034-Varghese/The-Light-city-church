// src/app/blog/page.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "../page.module.css";
import blogStyles from "./blog.module.css";
import blogsData from "../../data/blogs.json";

export default function BlogListingPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Get all unique categories
  const categories = ["All", ...Array.from(new Set(blogsData.map(b => b.category)))];

  // Filter articles based on selection
  const filteredBlogs = selectedCategory === "All"
    ? blogsData
    : blogsData.filter(b => b.category === selectedCategory);

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={`${styles.header} animate-fade-in`} style={{ animationDelay: '0.1s' }}>
        <div className={styles.logoContainer}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
            <Image src="/logo1.png" alt="TLCC Logo" width={32} height={32} />
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
      </header>

      {/* Main Banner */}
      <section className={blogStyles.blogHeaderContainer}>
        <h1 className={blogStyles.blogTitle}>
          Daily Blog & <span className={blogStyles.italicSerif}>Resources</span>
        </h1>
        <p className={blogStyles.blogSubtitle}>
          Grow in the accurate teaching of the Gospel of grace. Explore faith articles, spiritual revelations, and study resources from Pastor Ronnie Dube.
        </p>

        {/* Category Selector Tabs */}
        <div className={blogStyles.categoryFilters}>
          {categories.map(category => (
            <button
              key={category}
              className={`${blogStyles.filterPill} ${selectedCategory === category ? blogStyles.filterPillActive : ""}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {/* Blog Grid Section */}
      <section className={styles.blogSection} style={{ paddingTop: 0 }}>
        <div className={styles.blogContainer}>
          <div className={styles.blogGrid}>
            {filteredBlogs.map((article, idx) => (
              <Link
                href={`/blog/${article.slug}`}
                key={article.slug}
                className={`${styles.blogCard} animate-premium-block`}
                style={{ animationDelay: `${0.1 + idx * 0.05}s` }}
              >
                <div className={styles.blogCardImageWrapper}>
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className={styles.blogCardImage}
                  />
                </div>
                <div className={styles.blogCardContent}>
                  <div className={styles.badgeRow}>
                    <span className={styles.blogPillBadge}>{article.category}</span>
                  </div>
                  <h3 className={styles.blogCardTitle}>{article.title}</h3>
                  <p className={styles.blogCardExcerpt} style={{
                    fontSize: "0.95rem",
                    color: "var(--text-secondary)",
                    marginTop: "12px",
                    lineHeight: "1.5"
                  }}>
                    {article.excerpt}
                  </p>
                  <div className={styles.blogCardFooter} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "24px",
                    borderTop: "1px solid var(--border-color)",
                    paddingTop: "16px",
                    fontSize: "0.85rem",
                    color: "var(--text-secondary)"
                  }}>
                    <span>{article.author}</span>
                    <span>{new Date(article.pubDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                    })}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {filteredBlogs.length === 0 && (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>No articles found in this category.</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.ctaFooterSection}>
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </div>
          
          {/* Bottom Half: Footer Links & Details */}
          <div className={styles.footerBottom}>
            <div className={styles.footerBrand} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Image src="/logo1.png" alt="TLCC Logo" width={40} height={40} />
              <div>
                <h3 className={styles.footerLogo} style={{ margin: 0 }}>TLCC</h3>
                <p className={styles.footerTagline} style={{ margin: 0 }}>The Light City Church</p>
              </div>
            </div>
            
            <div className={styles.footerLinksGrid}>
              <div>
                <h4 className={styles.footerLinkTitle}>Explore</h4>
                <ul className={styles.footerLinkList}>
                  <li><Link href="/" className={styles.footerNavLink}>Home</Link></li>
                  <li><Link href="/about" className={styles.footerNavLink}>About</Link></li>
                  <li><Link href="/ministries" className={styles.footerNavLink}>Ministries</Link></li>
                  <li><Link href="/gallery" className={styles.footerNavLink}>Gallery</Link></li>
                  <li><Link href="/blog" className={styles.footerNavLink}>Blog</Link></li>
                  <li><Link href="/contact" className={styles.footerNavLink}>Contact</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className={styles.footerLinkTitle}>Connect</h4>
                <ul className={styles.footerLinkList}>
                  <li>
                    <a href="https://instagram.com/thelovedcircle" target="_blank" rel="noopener noreferrer" className={styles.footerSocialLink}>
                      Instagram
                    </a>
                  </li>
                  <li>
                    <a href="https://x.com/thelightcitychurch" target="_blank" rel="noopener noreferrer" className={styles.footerSocialLink}>
                      Twitter
                    </a>
                  </li>
                  <li>
                    <a href="https://facebook.com/102820662239782" target="_blank" rel="noopener noreferrer" className={styles.footerSocialLink}>
                      Facebook
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className={styles.footerDivider}></div>
          
          <div className={styles.footerCopyrightRow}>
            <p className={styles.copyrightText}>
              © Copyright 2026 The Light City Church. All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
