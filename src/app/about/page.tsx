// src/app/about/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "../page.module.css";
import aboutStyles from "./about.module.css";

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

export default function AboutUsPage() {
  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={`${styles.header} animate-fade-in`} style={{ animationDelay: '0.1s' }}>
        <div className={styles.logoContainer}>
          <Link href="/">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.logoSvg}>
              <circle cx="11" cy="11" r="7.5" stroke="currentColor" strokeWidth="2.5"/>
              <circle cx="19" cy="19" r="1.5" fill="currentColor"/>
            </svg>
          </Link>
        </div>

        <nav className={styles.nav} aria-label="Main Navigation">
          <ul className={styles.navUl}>
            <li>
              <Link href="/" className={styles.navLink}>Home</Link>
            </li>
            <li>
              <Link href="/about" className={styles.activeNavLink}>About</Link>
            </li>
            <li>
              <Link href="/#services" className={styles.navLink}>Ministries</Link>
            </li>
            <li>
              <Link href="/#gallery" className={styles.navLink}>Gallery</Link>
            </li>
            <li>
              <Link href="/blog" className={styles.navLink}>Devotionals</Link>
            </li>
            <li>
              <Link href="/#contact" className={styles.navLink}>Visit Us</Link>
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

      {/* Hero Banner */}
      <section className={aboutStyles.aboutHeaderContainer}>
        <h1 className={aboutStyles.aboutTitle}>
          About <span className={aboutStyles.italicSerif}>Our House</span>
        </h1>
        <p className={aboutStyles.aboutSubtitle}>
          We are passionate about empowering every man, woman, and child to live in the fulness of their inheritance in Christ.
        </p>
      </section>

      {/* Mission Section */}
      <ViewportSection className={aboutStyles.missionSection}>
        <div className={aboutStyles.missionContainer}>
          <span className={`${aboutStyles.missionTag} animate-fade-in-up`} style={{ animationDelay: '0.1s' }}>Our Mission</span>
          <h2 className={`${aboutStyles.missionHeadline} animate-fade-in-up`} style={{ animationDelay: '0.3s' }}>
            Empowering Lives Through the <em>Gospel of Grace</em>
          </h2>
          <p className={`${aboutStyles.missionText} animate-fade-in-up`} style={{ animationDelay: '0.5s' }}>
            To empower every man, woman, and child to live in the fulness of their inheritance in Christ through the accurate teaching of the Gospel. To bring light where there was once darkness and to prepare the church for the coming of our Lord and Saviour.
          </p>
        </div>
      </ViewportSection>

      {/* Core Values Section */}
      <ViewportSection className={aboutStyles.valuesSection}>
        <div className={aboutStyles.valuesContainer}>
          <div className={aboutStyles.sectionHeader}>
            <span className={`${aboutStyles.sectionTag} animate-fade-in-up`} style={{ animationDelay: '0.1s' }}>Guiding Pillars</span>
            <h2 className={`${aboutStyles.sectionTitle} animate-fade-in-up`} style={{ animationDelay: '0.2s' }}>Our Core Values</h2>
          </div>

          <div className={aboutStyles.valuesGrid}>
            {/* Value 1: Love above all */}
            <div className={`${aboutStyles.valueCard} animate-premium-block`} style={{ animationDelay: '0.3s' }}>
              <div className={aboutStyles.valueCardIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </div>
              <h3 className={aboutStyles.valueCardTitle}>Love above all</h3>
              <p className={aboutStyles.valueCardText}>
                The love of God is shed abroad in our hearts and it is when we love that we demonstrate the divine nature of God in our lives. We love and value every person because of the price tag God put on their life, which is His own blood.
              </p>
            </div>

            {/* Value 2: Standard of excellence */}
            <div className={`${aboutStyles.valueCard} animate-premium-block`} style={{ animationDelay: '0.5s' }}>
              <div className={aboutStyles.valueCardIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              </div>
              <h3 className={aboutStyles.valueCardTitle}>Standard of excellence</h3>
              <p className={aboutStyles.valueCardText}>
                We seek to excel in everything we do because Christ is made unto us wisdom and we have the mind of Christ.
              </p>
            </div>

            {/* Value 3: Honour */}
            <div className={`${aboutStyles.valueCard} animate-premium-block`} style={{ animationDelay: '0.7s' }}>
              <div className={aboutStyles.valueCardIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <h3 className={aboutStyles.valueCardTitle}>Honour</h3>
              <p className={aboutStyles.valueCardText}>
                We treat each other with respect and integrity, we honour and submit to our leaders as unto the Lord.
              </p>
            </div>
          </div>
        </div>
      </ViewportSection>

      {/* Leadership Section */}
      <ViewportSection className={aboutStyles.leadershipSection}>
        <div className={aboutStyles.leadershipContainer}>
          <div className={aboutStyles.sectionHeader}>
            <span className={`${aboutStyles.sectionTag} animate-fade-in-up`} style={{ animationDelay: '0.1s' }}>Our Leadership</span>
            <h2 className={`${aboutStyles.sectionTitle} animate-fade-in-up`} style={{ animationDelay: '0.2s' }}>Pastoral Team</h2>
          </div>

          <div className={aboutStyles.leadershipGrid}>
            {/* Pastor 1: Ronnie Dube */}
            <div className={`${aboutStyles.pastorCard} animate-premium-block`} style={{ animationDelay: '0.3s' }}>
              <div className={aboutStyles.pastorImageArea}>
                <Image
                  src="/avatar_ryan.png"
                  alt="Pastor Ronnie Dube"
                  fill
                  sizes="(max-width: 768px) 100vw, 500px"
                  className={aboutStyles.pastorImage}
                  priority
                />
              </div>
              <div className={aboutStyles.pastorDetails}>
                <div className={aboutStyles.pastorHeader}>
                  <h3 className={aboutStyles.pastorName}>Pastor Ronnie Dube</h3>
                  <span className={aboutStyles.pastorRole}>Co-Founder & Senior Pastor</span>
                </div>
                <p className={aboutStyles.pastorBio}>
                  Pastor Ronnie is the co-founder and senior pastor at The Light City Church. His ministry as a pastor, teacher, author, and healing minister continues to transform many lives around the world, helping people to experience a victorious and purposeful life in God’s Word.
                </p>
                <blockquote className={aboutStyles.pastorQuote}>
                  "The Word of God is building material for your life; you cannot afford to treat it casually."
                </blockquote>
              </div>
            </div>

            {/* Pastor 2: Annalene Dube */}
            <div className={`${aboutStyles.pastorCard} animate-premium-block`} style={{ animationDelay: '0.5s' }}>
              <div className={aboutStyles.pastorImageArea}>
                <Image
                  src="/pastor_portrait.png"
                  alt="Pastor Annalene Dube"
                  fill
                  sizes="(max-width: 768px) 100vw, 500px"
                  className={aboutStyles.pastorImage}
                />
              </div>
              <div className={aboutStyles.pastorDetails}>
                <div className={aboutStyles.pastorHeader}>
                  <h3 className={aboutStyles.pastorName}>Pastor Annalene Dube</h3>
                  <span className={aboutStyles.pastorRole}>Co-Founder & Worship Leader</span>
                </div>
                <p className={aboutStyles.pastorBio}>
                  A devoted wife to Pastor Ronnie and a loving mother to Ronnie Jnr, Ariel, and Christian, Pastor Annalene is a seasoned minister of the Word and an anointed worship leader. Her humility, warmth, and genuine love for God and people have led to her touching many lives globally through her music and teaching ministry.
                </p>
                <blockquote className={aboutStyles.pastorQuote}>
                  "When we love, we demonstrate the divine nature of God in our lives."
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      </ViewportSection>

      {/* Visit Section */}
      <ViewportSection className={aboutStyles.visitSection}>
        <div className={aboutStyles.visitContainer}>
          <div className={`${aboutStyles.visitCard} animate-premium-block`}>
            <h2 className={aboutStyles.visitTitle}>Visit Us in Nottingham</h2>
            <p className={aboutStyles.visitText}>
              The Light City Church is located in the metropolitan city of Nottingham in the United Kingdom. Join our vibrant community in person or online.
            </p>

            <div className={aboutStyles.visitDetails}>
              <div className={aboutStyles.visitItem}>
                <div className={aboutStyles.visitItemIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
                <span className={aboutStyles.visitItemLabel}>Service Time</span>
                <span className={aboutStyles.visitItemValue}>Every Sunday at 10:30 AM</span>
              </div>

              <div className={aboutStyles.visitItem}>
                <div className={aboutStyles.visitItemIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </div>
                <span className={aboutStyles.visitItemLabel}>Location</span>
                <span className={aboutStyles.visitItemValue}>Motorpoint Arena<br/>Nottingham City Centre</span>
              </div>
            </div>

            <div className={aboutStyles.visitCtaContainer}>
              <button className={aboutStyles.visitCtaBtn} onClick={() => {
                window.location.href = '/#contact';
              }}>
                Find Out More
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </ViewportSection>

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
            <div className={styles.footerBrand}>
              <h3 className={styles.footerLogo}>TLCC</h3>
              <p className={styles.footerTagline}>The Light City Church</p>
            </div>
            
            <div className={styles.footerLinksGrid}>
              <div>
                <h4 className={styles.footerLinkTitle}>Explore</h4>
                <ul className={styles.footerLinkList}>
                  <li><Link href="/" className={styles.footerNavLink}>Home</Link></li>
                  <li><Link href="/about" className={styles.footerNavLink}>About</Link></li>
                  <li><Link href="/#services" className={styles.footerNavLink}>Ministries</Link></li>
                  <li><Link href="/#gallery" className={styles.footerNavLink}>Gallery</Link></li>
                  <li><Link href="/blog" className={styles.footerNavLink}>Devotionals</Link></li>
                  <li><Link href="/#contact" className={styles.footerNavLink}>Visit Us</Link></li>
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
