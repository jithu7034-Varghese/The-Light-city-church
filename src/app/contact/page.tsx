// src/app/contact/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "../page.module.css";
import contactStyles from "./contact.module.css";

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

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email address is invalid";
    }
    if (!formData.message.trim()) newErrors.message = "Message is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitStatus("submitting");
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSubmitStatus("success");
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: ""
      });
    } catch {
      setSubmitStatus("error");
    }
  };

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
              <Link href="/gallery" className={styles.navLink}>Gallery</Link>
            </li>
            <li>
              <Link href="/blog" className={styles.navLink}>Blog</Link>
            </li>
            <li>
              <Link href="/contact" className={styles.activeNavLink}>Contact</Link>
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

      {/* Hero Map Section (BrickWise Style) */}
      <section className={contactStyles.hero}>
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2402.730303649666!2d-1.1448831230006277!3d52.9531818722421!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4879c3d4abfca783%3A0xb3515cf8bfa00cb3!2sMotorpoint%20Arena%20Nottingham!5e0!3m2!1sen!2suk!4v1710000000000!5m2!1sen!2suk"
          className={contactStyles.heroMap}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Motorpoint Arena Nottingham Location Map"
        ></iframe>

        <div className={contactStyles.heroHeaderBg} />

        <div className={contactStyles.heroHeader}>
          <span className={`${contactStyles.heroTag} animate-fade-in-up`} style={{ animationDelay: '0.1s' }}>
            <span className={contactStyles.heroTagIcon}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="10 8 16 12 10 16 10 8"></polygon>
              </svg>
            </span>
            Our Weekly Sunday Services
          </span>
          
          <h1 className={contactStyles.heroTitle}>
            <SplitText text="Easily Join Our Sunday" delayOffset={0.3} />
            <br />
            <SplitText text="Service to Grow Your Faith" delayOffset={0.8} />
          </h1>
          
          <p className={`${contactStyles.heroSubtitle} animate-fade-in-up`} style={{ animationDelay: '1.2s' }}>
            Empowering every man, woman, and child to live in the fullness of their inheritance in Christ. Join us in Nottingham.
          </p>
        </div>

        {/* Floating Service invitation Card in Center */}
        <div className={`${contactStyles.floatingCard} animate-fade-in-up`} style={{ animationDelay: '1.4s' }}>
          <div className={contactStyles.cardImageWrapper}>
            <span className={contactStyles.cardBadge}>Next Service</span>
            <Image
              src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=600&auto=format&fit=crop"
              alt="Sunday Worship Service"
              fill
              sizes="380px"
              priority
              className={contactStyles.cardImage}
            />
          </div>
          
          <div className={contactStyles.cardContent}>
            <div className={contactStyles.cardHeader}>
              <h3 className={contactStyles.cardTitle}>Motorpoint Arena Nottingham</h3>
              <p className={contactStyles.cardSubtitle}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={contactStyles.cardSubtitleIcon}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                Bolero Square, Nottingham, NG1 1LA
              </p>
            </div>

            <div className={contactStyles.cardStats}>
              <div className={contactStyles.cardStatItem}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>Sundays 10:30 AM</span>
              </div>
              <div className={contactStyles.cardStatItem}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>All Welcomed</span>
              </div>
            </div>

            <div className={contactStyles.cardFooter}>
              <div>
                <span className={contactStyles.cardLabel}>Co-Founder</span>
                <span className={contactStyles.cardVal}>Ronnie Dube</span>
              </div>
              <a
                href="https://maps.google.com/?q=Motorpoint+Arena+Nottingham"
                target="_blank"
                rel="noopener noreferrer"
                className={contactStyles.cardBtn}
              >
                Get Directions
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Divider Bar (BrickWise Style) */}
      <section className={contactStyles.statsBar}>
        <div className={contactStyles.statColumn}>
          <span className={contactStyles.statVal}>10:30 AM</span>
          <span className={contactStyles.statLabel}>Sunday Worship</span>
        </div>
        <div className={contactStyles.statColumn}>
          <span className={contactStyles.statVal}>Arena</span>
          <span className={contactStyles.statLabel}>Location Venue</span>
        </div>
        <div className={contactStyles.statColumn} style={{ cursor: "pointer" }} onClick={() => window.location.href = 'mailto:info@thelightcitychurch.org'}>
          <span className={contactStyles.statVal} style={{ fontSize: "1.2rem", fontWeight: "800", height: "40px", display: "flex", alignItems: "center" }}>info@thelightcitychurch.org</span>
          <span className={contactStyles.statLabel}>Email Contact</span>
        </div>
        <div className={contactStyles.statColumn}>
          <span className={contactStyles.statVal}>+44 115</span>
          <span className={contactStyles.statLabel}>Office Line</span>
        </div>
      </section>

      {/* Split Form / Bento expectations Section (BrickWise Style) */}
      <ViewportSection as="section" className={contactStyles.splitSection}>
        <div className={contactStyles.splitGrid}>
          
          {/* Left Column: Contact Form */}
          <div className={contactStyles.formArea}>
            <span className={contactStyles.formTag}>- Write to Us</span>
            
            <h2 className={contactStyles.formTitle}>
              Discover the value behind fellowship & community
            </h2>
            
            <p className={contactStyles.formParagraph}>
              We handle the heavy lifting by standing in agreement with you in prayer, answering your theological questions, and helping you find a home group in Nottingham.
            </p>

            <form onSubmit={handleSubmit} className={contactStyles.form}>
              {submitStatus === "success" && (
                <div className={contactStyles.successAlert}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <div>
                    <strong>Message sent successfully!</strong>
                    <p style={{ marginTop: "2px", fontSize: "0.9rem", color: "inherit", opacity: 0.9 }}>
                      Thank you. A member of our welcome or pastoral team will get back to you shortly.
                    </p>
                  </div>
                </div>
              )}

              {submitStatus === "error" && (
                <div className={contactStyles.errorAlert}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <div>
                    <strong>Failed to send message.</strong>
                    <p style={{ marginTop: "2px", fontSize: "0.9rem", color: "inherit", opacity: 0.9 }}>
                      There was a problem submitting your request. Please try again.
                    </p>
                  </div>
                </div>
              )}

              <div className={contactStyles.formRow}>
                <div className={contactStyles.formGroup}>
                  <label htmlFor="name" className={contactStyles.formLabel}>Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={contactStyles.formInput}
                    style={errors.name ? { borderColor: "#dc2626" } : undefined}
                    placeholder="John Doe"
                    required
                  />
                </div>
                
                <div className={contactStyles.formGroup}>
                  <label htmlFor="email" className={contactStyles.formLabel}>Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={contactStyles.formInput}
                    style={errors.email ? { borderColor: "#dc2626" } : undefined}
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>

              <div className={contactStyles.formRow}>
                <div className={contactStyles.formGroup}>
                  <label htmlFor="phone" className={contactStyles.formLabel}>Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={contactStyles.formInput}
                    placeholder="+44 7123 456789"
                  />
                </div>
                
                <div className={contactStyles.formGroup}>
                  <label htmlFor="subject" className={contactStyles.formLabel}>Subject</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className={contactStyles.formInput}
                    placeholder="How can we help?"
                  />
                </div>
              </div>

              <div className={contactStyles.formGroup}>
                <label htmlFor="message" className={contactStyles.formLabel}>Message *</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  className={contactStyles.formTextarea}
                  style={errors.message ? { borderColor: "#dc2626" } : undefined}
                  placeholder="Write your message or prayer request here..."
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitStatus === "submitting"}
                className={contactStyles.formBtn}
              >
                {submitStatus === "submitting" ? (
                  <>Sending Message...</>
                ) : (
                  <>
                    Send Message
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Asymmetric Bento Grid (BrickWise Style) */}
          <div className={contactStyles.bentoGrid}>
            
            {/* Small Card 1 */}
            <div className={contactStyles.bentoCard}>
              <div className={contactStyles.bentoIconWrapper}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h3 className={contactStyles.bentoCardTitle}>Welcome Hosts</h3>
              <p className={contactStyles.bentoCardText}>
                Our hosts stand at the main Arena entrance to guide you and answer any questions upon arrival.
              </p>
            </div>

            {/* Small Card 2 */}
            <div className={contactStyles.bentoCard}>
              <div className={contactStyles.bentoIconWrapper}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </div>
              <h3 className={contactStyles.bentoCardTitle}>99% Friendly Parish</h3>
              <p className={contactStyles.bentoCardText}>
                We are a diverse, casual, and warm church family. Feel free to come exactly as you are.
              </p>
            </div>

            {/* Asymmetrical Wide Card 3 with stacked photo card details */}
            <div className={`${contactStyles.bentoCard} ${contactStyles.bentoCardWide}`}>
              <div>
                <h3 className={contactStyles.bentoCardTitle}>Kids Sunday Church</h3>
                <p className={contactStyles.bentoCardText}>
                  A fun, safe, and engaging children's ministry is provided during the service for ages 2 to 11.
                </p>
              </div>
              
              <div className={contactStyles.bentoStackContainer}>
                <div className={contactStyles.bentoGridPattern} />
                
                {/* Visual trace elements matching reference */}
                <span className={contactStyles.bentoTraceBadge}>Sundays</span>
                <div className={contactStyles.bentoTraceMarker} />
                <div className={contactStyles.bentoTraceLine} />
                
                <div className={contactStyles.stackedPhotoCard}>
                  <div className={contactStyles.stackedPhoto}>
                    <Image
                      src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=400&auto=format&fit=crop"
                      alt="Children learning about grace"
                      fill
                      sizes="220px"
                      className={contactStyles.cardImage}
                    />
                  </div>
                  <h4 className={contactStyles.stackedPhotoTitle}>Grace-Filled Children</h4>
                  <p className={contactStyles.stackedPhotoMeta}>Sunday School Classroom</p>
                </div>
              </div>
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
// Note: Map grayscale styles in dark mode are handled in contact.module.css
