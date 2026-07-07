// src/app/ministries/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "../page.module.css";
import ministryStyles from "./ministries.module.css";

interface SplitTextProps {
  text: string;
  className?: string;
  delayOffset?: number;
  by?: 'letters' | 'words';
}

// Reuse the text reveal animation from the homepage
function SplitText({ text, className, delayOffset = 0, by = 'letters' }: SplitTextProps) {
  const [isInView, setIsInView] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px -20px 0px" }
    );
    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  const words = text.split(" ");
  let index = 0;
  
  return (
    <span ref={ref} className={className} style={{ display: 'inline-block' }}>
      {words.map((word, wordIdx) => {
        if (by === 'words') {
          const delay = delayOffset + index * 0.08;
          index++;
          
          let animClass = "letter-anim letter-anim-words";
          if (mounted) {
            animClass += isInView ? " letter-reveal" : " letter-hidden";
          }
          
          return (
            <span key={wordIdx} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom' }}>
              <span
                className={animClass}
                style={{
                  animationDelay: isInView ? `${delay}s` : '0s',
                  display: 'inline-block',
                  marginRight: '0.25em',
                }}
              >
                {word}
              </span>
            </span>
          );
        } else {
          const chars = Array.from(word);
          return (
            <span key={wordIdx} style={{ display: 'inline-block', whiteSpace: 'nowrap', marginRight: '0.22em', verticalAlign: 'bottom' }}>
              {chars.map((char, charIdx) => {
                const delay = delayOffset + index * 0.035;
                const charKey = `${wordIdx}-${charIdx}-${index}`;
                index++;
                
                let animClass = "letter-anim";
                if (mounted) {
                  animClass += isInView ? " letter-reveal" : " letter-hidden";
                }
                
                return (
                  <span key={charKey} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom' }}>
                    <span
                      className={animClass}
                      style={{
                        animationDelay: isInView ? `${delay}s` : '0s',
                        display: 'inline-block',
                      }}
                    >
                      {char}
                    </span>
                  </span>
                );
              })}
            </span>
          );
        }
      })}
    </span>
  );
}

// Reuse the viewport tracker from the homepage
interface ViewportSectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  as?: 'section' | 'main' | 'div';
}

function ViewportSection({ children, className = "", id, as: Component = 'section' }: ViewportSectionProps) {
  const [isInView, setIsInView] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  let sectionClass = className;
  if (mounted) {
    sectionClass += isInView ? " viewport-active" : " viewport-hidden";
  }

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Component ref={ref as any} className={sectionClass} id={id}>
      {children}
    </Component>
  );
}

export default function MinistriesPage() {
  const ministriesData = [
    {
      id: "01",
      title: "Sunday Worship",
      badge: "Worship & Word",
      desc: "Our weekly gathering where we celebrate the goodness of God. Experience contemporary, Jesus-centred praise and worship, followed by an anointed and life-transforming message by Pastor Ronnie Dube.",
      image: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?q=80&w=600&auto=format&fit=crop",
      schedule: "Every Sunday, 10:30 AM",
      location: "Motorpoint Arena Nottingham"
    },
    {
      id: "02",
      title: "Daily Blog & Resources",
      badge: "Growth & Study",
      desc: "Delve deeper into the Word with our online articles and guides. Curated to help you understand right standing with God through faith in Jesus Christ, these teachings provide daily strength and clarity.",
      image: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?q=80&w=600&auto=format&fit=crop",
      schedule: "Available 24/7 online",
      location: "Online / Blog Section"
    },
    {
      id: "03",
      title: "Freedom from Religion",
      badge: "Grace & Truth",
      desc: "A ministry focused on stripping away religious legalism and introducing the pure, unadulterated message of the gospel of grace. Discover how salvation, healing, and victory are fully completed in Christ.",
      image: "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?q=80&w=600&auto=format&fit=crop",
      schedule: "Special Seminars & Conferences",
      location: "Varies per event"
    },
    {
      id: "04",
      title: "The Loved Circle",
      badge: "Community & Sisterhood",
      desc: "An anointed community of sisterhood focused on supporting women on a journey of self-discovery, healing, wholeness, and spiritual empowerment, resting in the extravagant love of the Father.",
      image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=600&auto=format&fit=crop",
      schedule: "Monthly Gatherings",
      location: "Community Center / Online"
    }
  ];

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={`${styles.header} animate-fade-in`} style={{ animationDelay: '0.1s' }}>
        <div className={styles.logoContainer}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
            <Image src="/logo1.png" alt="TLCC Logo" width={54} height={54} />
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
              <Link href="/ministries" className={styles.activeNavLink}>Ministries</Link>
            </li>
            <li>
              <Link href="/gallery" className={styles.navLink}>Gallery</Link>
            </li>
            <li>
              <Link href="/blog" className={styles.navLink}>Blog</Link>
            </li>
            <li>
              <Link href="/contact" className={styles.navLink}>Contact</Link>
            </li>
          </ul>
        </nav>

        <button className={styles.preOrderBtn} id="header-preorder-btn" onClick={() => {
          window.location.href = '/contact';
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          Get Involved
        </button>
      </header>

      {/* Hero Section */}
      <section className={ministryStyles.hero}>
        <div className={ministryStyles.heroBackground}>
          <Image
            src="/thecitylight.webp"
            alt="The Light City Church Ministries"
            fill
            priority
            className={ministryStyles.heroImage}
          />
          <div className={ministryStyles.heroOverlay} />
        </div>

        <div className={ministryStyles.heroContent}>
          <span className={`${ministryStyles.heroTag} animate-fade-in-up`} style={{ animationDelay: '0.1s' }}>Paths of Faith</span>
          <h1 className={ministryStyles.heroTitle}>
            <SplitText text="Our Ministries" delayOffset={0.3} />
          </h1>
          <p className={`${ministryStyles.heroSubtitle} animate-fade-in-up`} style={{ animationDelay: '0.8s' }}>
            Empowering every person to live out their divine inheritance through worship, study, grace, and fellowship.
          </p>
        </div>
      </section>

      {/* Grid of Ministries */}
      <ViewportSection as="section" className={ministryStyles.ministriesSection}>
        <div className={ministryStyles.container}>
          <div className={ministryStyles.sectionHeader}>
            <h2 className={ministryStyles.sectionTitle}>
              <SplitText text="Ministries & Pathways" delayOffset={0.1} />
            </h2>
            <p className={ministryStyles.sectionSubtitle}>
              Explore our core areas of service and find where you can connect, learn, and grow.
            </p>
          </div>

          <div className={ministryStyles.grid}>
            {ministriesData.map((item, idx) => (
              <div
                key={item.id}
                className={`${ministryStyles.card} animate-premium-block`}
                style={{ animationDelay: `${0.2 + idx * 0.1}s` }}
              >
                <div className={ministryStyles.cardImageWrapper}>
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className={ministryStyles.cardImage}
                  />
                </div>
                
                <div className={ministryStyles.cardContent}>
                  <div className={ministryStyles.cardMeta}>
                    <span className={ministryStyles.cardIndex}>{item.id}</span>
                    <span className={ministryStyles.cardBadge}>{item.badge}</span>
                  </div>
                  
                  <h3 className={ministryStyles.cardTitle}>{item.title}</h3>
                  <p className={ministryStyles.cardDescription}>{item.desc}</p>
                  
                  <div className={ministryStyles.cardDetails}>
                    <div className={ministryStyles.detailRow}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={ministryStyles.detailIcon}>
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      <span>{item.schedule}</span>
                    </div>
                    <div className={ministryStyles.detailRow}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={ministryStyles.detailIcon}>
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      <span>{item.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ViewportSection>

      {/* CTA Get Involved */}
      <section className={ministryStyles.ctaSection}>
        <div className={ministryStyles.ctaContainer}>
          <h2 className={ministryStyles.ctaTitle}>
            Find Your Place in <span className={ministryStyles.italicSerif}>Community</span>
          </h2>
          <p className={ministryStyles.ctaText}>
            Whether you want to serve, connect in fellowship, or grow through Pastor Ronnie’s teaching resources, there is a path designed for you.
          </p>
          <button className={ministryStyles.ctaButton} onClick={() => {
            window.location.href = '/contact';
          }}>
            Connect With Us
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
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
              <Image src="/logo1.png" alt="TLCC Logo" width={54} height={54} />
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
