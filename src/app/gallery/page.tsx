// src/app/gallery/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "../page.module.css";
import galleryStyles from "./gallery.module.css";

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

export default function GalleryPage() {
  const [activeImage, setActiveImage] = useState<{
    image: string;
    title: string;
    tag: string;
    desc: string;
  } | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const galleryItems = [
    {
      image: "/church/bc9c651c-7cc3-4d0a-916f-1390d02b5c01.jpeg",
      tag: "Sunday Worship",
      title: "Praise & Celebration",
      desc: "Joyful atmosphere and Jesus-centred worship during our Sunday services."
    },
    {
      image: "/church/4f231d85-4120-4689-8ae3-cb10792f21f8.jpeg",
      tag: "Light Groups",
      title: "Midweek Fellowship",
      desc: "Small groups meeting for fellowship, sharing, and community building."
    },
    {
      image: "/ronny/IMG_8047.jpeg",
      tag: "Teaching",
      title: "The Word of Grace",
      desc: "Pastor Ronnie Dube teaching the clear realities of right standing with God."
    },
    {
      image: "/church/e0c03b29-977e-47fb-b410-0a752cc3f171.jpeg",
      tag: "Community",
      title: "Sharing the Light",
      desc: "Warm connections and community life within The Light City Church."
    },
    {
      image: "/ronny/IMG_8436.jpeg",
      tag: "Leadership",
      title: "Anointed Ministry",
      desc: "Pastor Ronnie ministering the Word of God with clarity and power."
    },
    {
      image: "/ronny/PHOTO-2022-02-17-12-59-53.jpeg",
      tag: "Worship",
      title: "Extravagant Praise",
      desc: "Leading the congregation in anointed praise and faith declarations."
    },
    {
      image: "/ronny/cc3c7cf1-c332-47da-9a76-113690e217c4.jpeg",
      tag: "Grace Conferences",
      title: "Faith & Power",
      desc: "Pastor Ronnie preaching the unadulterated message of the gospel of grace."
    },
    {
      image: "/ronny/e4c3ffab-0ef8-4da7-b2ee-2e97f16eab3a.jpeg",
      tag: "Seminars",
      title: "Freedom From Religion",
      desc: "Teaching sessions focused on stripping away religious legalism."
    }
  ];

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
              <Link href="/about" className={styles.navLink}>About</Link>
            </li>
            <li>
              <Link href="/ministries" className={styles.navLink}>Ministries</Link>
            </li>
            <li>
              <Link href="/gallery" className={styles.activeNavLink}>Gallery</Link>
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
              <Link href="/gallery" className={styles.mobileActiveNavLink} onClick={() => setIsMobileMenuOpen(false)}>Gallery</Link>
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
                window.location.href = '/contact';
              }}>
                Get Involved
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Hero Section */}
      <section className={galleryStyles.hero}>
        <div className={galleryStyles.heroBackground}>
          <Image
            src="/thecitylight.webp"
            alt="The Light City Church Gallery"
            fill
            priority
            className={galleryStyles.heroImage}
          />
          <div className={galleryStyles.heroOverlay} />
        </div>

        <div className={galleryStyles.heroContent}>
          <span className={`${galleryStyles.heroTag} animate-fade-in-up`} style={{ animationDelay: '0.1s' }}>Life in Focus</span>
          <h1 className={galleryStyles.heroTitle}>
            <SplitText text="Capturing Our Faith" delayOffset={0.3} />
          </h1>
          <p className={`${galleryStyles.heroSubtitle} animate-fade-in-up`} style={{ animationDelay: '0.8s' }}>
            A glimpse into the worship, community outreach, conferences, and daily fellowship of our church family.
          </p>
        </div>
      </section>

      {/* Gallery Grid */}
      <ViewportSection as="section" className={galleryStyles.gallerySection}>
        <div className={galleryStyles.container}>
          <div className={galleryStyles.sectionHeader}>
            <h2 className={galleryStyles.sectionTitle}>
              <SplitText text="Moments in Community" delayOffset={0.1} />
            </h2>
            <p className={galleryStyles.sectionSubtitle}>
              Click on any photograph to view it in full size and read about the story behind the moment.
            </p>
          </div>

          <div className={galleryStyles.grid}>
            {galleryItems.map((item, idx) => (
              <div
                key={idx}
                className={`${galleryStyles.card} animate-premium-block`}
                style={{ animationDelay: `${0.2 + idx * 0.08}s` }}
                onClick={() => setActiveImage(item)}
              >
                <div className={galleryStyles.cardImageWrapper}>
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className={galleryStyles.cardImage}
                  />
                </div>
                
                <div className={galleryStyles.cardOverlay} />
                
                <div className={galleryStyles.cardContent}>
                  <span className={galleryStyles.cardTag}>{item.tag}</span>
                  <h3 className={galleryStyles.cardTitle}>{item.title}</h3>
                </div>

                <div className={galleryStyles.cardZoomIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    <line x1="11" y1="8" x2="11" y2="14"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ViewportSection>

      {/* Fullscreen Lightbox Modal */}
      {activeImage && (
        <div className={galleryStyles.lightbox} onClick={() => setActiveImage(null)}>
          <button className={galleryStyles.lightboxClose} aria-label="Close lightbox">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          
          <div className={galleryStyles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <div className={galleryStyles.lightboxImageWrapper}>
              <img
                src={activeImage.image}
                alt={activeImage.title}
                className={galleryStyles.lightboxImage}
              />
            </div>
            
            <div className={galleryStyles.lightboxCaption}>
              <h3 className={galleryStyles.lightboxTitle}>{activeImage.title}</h3>
              <p className={galleryStyles.lightboxDesc}>{activeImage.desc}</p>
            </div>
          </div>
        </div>
      )}

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
