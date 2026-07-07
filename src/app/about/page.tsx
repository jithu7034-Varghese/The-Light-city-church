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
  const [activePastor, setActivePastor] = useState<"ronnie" | "annalene">("ronnie");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const pastorsData = {
    ronnie: {
      name: "Pastor Ronnie Dube",
      role: "Co-Founder & Senior Pastor",
      image: "/avatar_ryan.png",
      bio: "Pastor Ronnie is co-founder and senior pastor at The Light City Church. His ministry as a pastor, teacher, author, and healing minister continues to transform many lives around the world, helping them to experience a victorious and purposeful life in God’s Word. He is passionate about explaining the clear realities of right standing with God through faith in Christ Jesus.",
      quote: "The Word of God is building material for your life; you cannot afford to treat it casually. Esteem the Word highly in your life and watch the changes."
    },
    annalene: {
      name: "Pastor Annalene Dube",
      role: "Co-Founder & Worship Leader",
      image: "/pastor_portrait.png",
      bio: "A devoted wife to Pastor Ronnie and a loving mother to Ronnie Jnr, Ariel, and Christian, Pastor Annalene is a seasoned minister of the Word and an anointed worship leader. Her humility, warmth, and genuine love for God and people have led to her touching many lives around the world through her music and teaching ministry.",
      quote: "The love of God is shed abroad in our hearts, and it is when we love that we demonstrate the divine nature of God in our lives."
    }
  };

  const currentPastor = pastorsData[activePastor];

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={`${styles.header} animate-fade-in`} style={{ animationDelay: '0.1s' }}>
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
              <Link href="/about" className={styles.activeNavLink}>About</Link>
            </li>
            <li>
              <Link href="/ministries" className={styles.navLink}>Ministries</Link>
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
              <Link href="/about" className={styles.mobileActiveNavLink} onClick={() => setIsMobileMenuOpen(false)}>About</Link>
            </li>
            <li>
              <Link href="/ministries" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>Ministries</Link>
            </li>
            <li>
              <Link href="/gallery" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>Gallery</Link>
            </li>
            <li>
              <Link href="/blog" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>Blog</Link>
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

      {/* Hero Parallax Section */}
      <section className={aboutStyles.hero}>
        <div className={aboutStyles.heroBackground}>
          <Image
            src="/thecitylight.webp"
            alt="The Light City Church"
            fill
            priority
            className={aboutStyles.heroImage}
          />
          <div className={aboutStyles.heroOverlay} />
        </div>

        <div className={aboutStyles.heroContent}>
          <span className={`${aboutStyles.heroTag} animate-fade-in-up`} style={{ animationDelay: '0.1s' }}>Welcome to Our House</span>
          <h1 className={aboutStyles.heroTitle}>
            <SplitText text="Our Story & Vision" delayOffset={0.3} />
          </h1>
          <p className={`${aboutStyles.heroSubtitle} animate-fade-in-up`} style={{ animationDelay: '0.8s' }}>
            To empower every man, woman, and child to live in the fulness of their inheritance in Christ.
          </p>
        </div>
      </section>

      {/* Split Story / Mission Section */}
      <ViewportSection className={aboutStyles.storySection} id="story">
        <div className={aboutStyles.storyContainer}>
          <div className={aboutStyles.storyGrid}>
            <div className={`${aboutStyles.storyImageWrapper} animate-premium-block`}>
              <Image
                src="/feature_sculpture.png"
                alt="Worship Atmosphere"
                fill
                className={aboutStyles.storyImage}
              />
              <div className={aboutStyles.storyFloatingBadge}>
                <h4 className={aboutStyles.storyBadgeTitle}>"Christ in you"</h4>
                <p className={aboutStyles.storyBadgeSub}>The Hope of Glory — Colossians 1:27</p>
              </div>
            </div>

            <div className={aboutStyles.storyTextContent}>
              <span className={`${aboutStyles.sectionTag} animate-fade-in-up`} style={{ animationDelay: '0.1s' }}>Our Mission</span>
              <h2 className={`${aboutStyles.storyTitle} animate-fade-in-up`} style={{ animationDelay: '0.2s' }}>
                Bringing Light Where There Was <span className={aboutStyles.italicSerif}>Darkness</span>
              </h2>
              <p className={`${aboutStyles.storyParagraph} animate-fade-in-up`} style={{ animationDelay: '0.4s' }}>
                At The Light City Church, our mission is to empower every man, woman, and child to live in the fulness of their inheritance in Christ through the accurate teaching of the Gospel. We believe that when grace is revealed, lives are fundamentally transformed.
              </p>
              <p className={`${aboutStyles.storyParagraph} animate-fade-in-up`} style={{ animationDelay: '0.6s' }}>
                We are dedicated to preparing the church for the coming of our Lord and Saviour, cultivating a community where faith flourishes, healing is realized, and the love of God is felt tangibly.
              </p>
            </div>
          </div>
        </div>
      </ViewportSection>

      {/* Core Values Bento Grid */}
      <ViewportSection className={aboutStyles.valuesSection} id="values">
        <div className={aboutStyles.valuesContainer}>
          <div className={aboutStyles.valuesHeader}>
            <span className={`${aboutStyles.sectionTag} animate-fade-in-up`} style={{ animationDelay: '0.1s' }}>What We Stand For</span>
            <h2 className={`${aboutStyles.valuesTitle} animate-fade-in-up`} style={{ animationDelay: '0.2s' }}>Our Core Values</h2>
          </div>

          <div className={aboutStyles.bentoGrid}>
            {/* Card 1: Large Double Grid for Love Above All */}
            <div className={`${aboutStyles.bentoCard} ${aboutStyles.bentoCardLarge} animate-premium-block`} style={{ animationDelay: '0.3s' }}>
              <div className={aboutStyles.cardBgImage}>
                <Image
                  src="https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=800&auto=format&fit=crop"
                  alt="Community Fellowship"
                  fill
                  className={aboutStyles.cardImage}
                />
                <div className={aboutStyles.heroOverlay} />
              </div>
              <div className={aboutStyles.cardContentOverlay}>
                <div className={`${aboutStyles.valueIcon} ${aboutStyles.largeIcon}`}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </div>
                <h3 className={`${aboutStyles.valueTitle} ${aboutStyles.largeTitle}`}>Love above all</h3>
                <p className={`${aboutStyles.valueText} ${aboutStyles.largeText}`}>
                  The love of God is shed abroad in our hearts and it is when we love that we demonstrate the divine nature of God in our lives. We love and value every person because of the price tag God put on their life, which is His own blood.
                </p>
              </div>
            </div>

            {/* Card 2: Standard Bento Card for Excellence */}
            <div className={`${aboutStyles.bentoCard} animate-premium-block`} style={{ animationDelay: '0.5s' }}>
              <div className={aboutStyles.valueIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              </div>
              <h3 className={aboutStyles.valueTitle}>Standard of excellence</h3>
              <p className={aboutStyles.valueText}>
                We seek to excel in everything we do because Christ is made unto us wisdom and we have the mind of Christ. We believe in offering our best as an expression of worship.
              </p>
            </div>

            {/* Card 3: Standard Bento Card for Honour */}
            <div className={`${aboutStyles.bentoCard} animate-premium-block`} style={{ animationDelay: '0.7s' }}>
              <div className={aboutStyles.valueIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <h3 className={aboutStyles.valueTitle}>Honour</h3>
              <p className={aboutStyles.valueText}>
                We treat each other with respect and integrity. We honour and submit to our leaders as unto the Lord, establishing a culture of mutual uplift and support.
              </p>
            </div>
          </div>
        </div>
      </ViewportSection>

      {/* Interactive Leadership Magazine Layout */}
      <ViewportSection className={aboutStyles.leadershipSection} id="leadership">
        <div className={aboutStyles.leadershipContainer}>
          <div className={aboutStyles.leadershipHeader}>
            <span className={aboutStyles.sectionTag}>Our Leadership</span>
            <h2 className={aboutStyles.valuesTitle}>Pastoral Oversight</h2>
            
            <div className={aboutStyles.tabSwitcher}>
              <button
                className={`${aboutStyles.tabBtn} ${activePastor === "ronnie" ? aboutStyles.tabBtnActive : ""}`}
                onClick={() => setActivePastor("ronnie")}
              >
                Pastor Ronnie
              </button>
              <button
                className={`${aboutStyles.tabBtn} ${activePastor === "annalene" ? aboutStyles.tabBtnActive : ""}`}
                onClick={() => setActivePastor("annalene")}
              >
                Pastor Annalene
              </button>
            </div>
          </div>

          <div className={aboutStyles.magazineGrid}>
            <div className={`${aboutStyles.pastorImageWrapper} animate-premium-block`}>
              <Image
                src={currentPastor.image}
                alt={currentPastor.name}
                fill
                className={aboutStyles.pastorImage}
                key={activePastor} // Force re-render to trigger smooth animation/fade
              />
            </div>

            <div className={aboutStyles.pastorDetailsArea} key={`details-${activePastor}`}>
              <h3 className={aboutStyles.pastorName}>{currentPastor.name}</h3>
              <span className={aboutStyles.pastorRole}>{currentPastor.role}</span>
              <p className={aboutStyles.pastorBio}>{currentPastor.bio}</p>
              <blockquote className={aboutStyles.pastorQuote}>
                {currentPastor.quote}
              </blockquote>
            </div>
          </div>
        </div>
      </ViewportSection>

      {/* Nottingham Visit Bento Card Section */}
      <ViewportSection className={aboutStyles.visitSection} id="visit">
        <div className={aboutStyles.visitContainer}>
          <div className={aboutStyles.visitBento}>
            <div className={aboutStyles.visitImageWrapper}>
              <Image
                src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800&auto=format&fit=crop"
                alt="Worship Gathering"
                fill
                className={aboutStyles.visitImage}
              />
            </div>

            <div className={aboutStyles.visitContent}>
              <h2 className={aboutStyles.visitTitle}>Our Gathering Place</h2>
              <p className={aboutStyles.visitText}>
                We gather in the heart of Nottingham, welcoming anyone seeking to grow in faith, hear the Gospel, and experience true community.
              </p>

              <div className={aboutStyles.visitDetailsList}>
                <div className={aboutStyles.visitRow}>
                  <div className={aboutStyles.visitRowIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                  </div>
                  <div>
                    <h4 className={aboutStyles.visitRowTitle}>Worship Service</h4>
                    <span className={aboutStyles.visitRowValue}>Every Sunday at 10:30 AM</span>
                  </div>
                </div>

                <div className={aboutStyles.visitRow}>
                  <div className={aboutStyles.visitRowIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </div>
                  <div>
                    <h4 className={aboutStyles.visitRowTitle}>Location</h4>
                    <span className={aboutStyles.visitRowValue}>Motorpoint Arena, Nottingham</span>
                  </div>
                </div>
              </div>

              <button className={aboutStyles.visitCtaBtn} onClick={() => {
                window.location.href = '/#contact';
              }}>
                Plan Your Visit
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
              <h3 className={styles.footerLogo}>
                City <span style={{ fontWeight: 400, opacity: 0.85 }}>Light</span>
              </h3>
              <p className={styles.footerTagline}>The Light City Church</p>
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
