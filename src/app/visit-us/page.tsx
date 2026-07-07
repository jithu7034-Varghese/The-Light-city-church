// src/app/visit-us/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "../page.module.css";
import visitStyles from "./visit-us.module.css";

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

export default function VisitUsPage() {
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
    
    // Simulate API request
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

  const expectData = [
    {
      title: "Free Parking",
      desc: "Convenient free parking is available close to the venue for all visitors. Follow signs on arrival.",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="1" y="3" width="22" height="18" rx="2" ry="2"></rect>
          <line x1="12" y1="8" x2="12" y2="16"></line>
          <path d="M12 8h2.5a2.5 2.5 0 0 1 0 5H12"></path>
        </svg>
      )
    },
    {
      title: "Welcome Team",
      desc: "Our friendly welcome hosts will meet you at the doors, help you find a seat, and answer any questions.",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      )
    },
    {
      title: "TLCC Kids",
      desc: "A fun, safe, and engaging children's ministry is provided during the service for ages 2 to 11.",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
          <line x1="4" y1="22" x2="4" y2="15"></line>
        </svg>
      )
    },
    {
      title: "Come As You Are",
      desc: "We are a diverse community with no formal dress code. Wear whatever makes you comfortable.",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      )
    }
  ];

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
              <Link href="/visit-us" className={styles.activeNavLink}>Visit Us</Link>
            </li>
          </ul>
        </nav>

        <button className={styles.preOrderBtn} id="header-preorder-btn" onClick={() => {
          window.location.href = '/visit-us';
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          Get Involved
        </button>
      </header>

      {/* Hero Section */}
      <section className={visitStyles.hero}>
        <div className={visitStyles.heroBackground}>
          <Image
            src="/thecitylight.webp"
            alt="The Light City Church Location"
            fill
            priority
            className={visitStyles.heroImage}
          />
          <div className={visitStyles.heroOverlay} />
        </div>

        <div className={visitStyles.heroContent}>
          <span className={`${visitStyles.heroTag} animate-fade-in-up`} style={{ animationDelay: '0.1s' }}>Join Us in Nottingham</span>
          <h1 className={visitStyles.heroTitle}>
            <SplitText text="Plan Your Visit" delayOffset={0.3} />
          </h1>
          <p className={`${visitStyles.heroSubtitle} animate-fade-in-up`} style={{ animationDelay: '0.8s' }}>
            We gather in person every Sunday. Whether you have questions or want to request prayer, we would love to connect.
          </p>
        </div>
      </section>

      {/* Form and Map Grid */}
      <ViewportSection as="section" className={visitStyles.visitSection}>
        <div className={visitStyles.container}>
          <div className={visitStyles.grid}>
            
            {/* Left Column: Form & Info */}
            <div className={visitStyles.contactArea}>
              <div>
                <h2 className={visitStyles.sectionTitle}>Get In Touch</h2>
                <p className={visitStyles.sectionSubtitle}>
                  Have a question about our services, ministries, or need prayer agreement? Reach out using the form below or standard details.
                </p>
              </div>

              {/* Detail Rows */}
              <div className={visitStyles.infoGrid}>
                <div className={visitStyles.infoItem}>
                  <div className={visitStyles.infoIconWrapper}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </div>
                  <div className={visitStyles.infoContent}>
                    <span className={visitStyles.infoTitle}>Service Time</span>
                    <span className={visitStyles.infoText}>Sundays at 10:30 AM</span>
                  </div>
                </div>

                <div className={visitStyles.infoItem}>
                  <div className={visitStyles.infoIconWrapper}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </div>
                  <div className={visitStyles.infoContent}>
                    <span className={visitStyles.infoTitle}>Location</span>
                    <span className={visitStyles.infoText}>Motorpoint Arena,<br />Nottingham, NG1 1LA</span>
                  </div>
                </div>

                <div className={visitStyles.infoItem}>
                  <div className={visitStyles.infoIconWrapper}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                  </div>
                  <div className={visitStyles.infoContent}>
                    <span className={visitStyles.infoTitle}>Email</span>
                    <span className={visitStyles.infoText}>
                      <a href="mailto:info@thelightcitychurch.org">info@thelightcitychurch.org</a>
                    </span>
                  </div>
                </div>

                <div className={visitStyles.infoItem}>
                  <div className={visitStyles.infoIconWrapper}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                  </div>
                  <div className={visitStyles.infoContent}>
                    <span className={visitStyles.infoTitle}>Office</span>
                    <span className={visitStyles.infoText}>+44 (0) 115 900 0000</span>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className={visitStyles.form}>
                <div className={visitStyles.formRow}>
                  <div className={visitStyles.formGroup}>
                    <label htmlFor="name" className={visitStyles.label}>Full Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={visitStyles.input}
                      style={errors.name ? { borderColor: "#dc2626" } : undefined}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className={visitStyles.formGroup}>
                    <label htmlFor="email" className={visitStyles.label}>Email Address *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={visitStyles.input}
                      style={errors.email ? { borderColor: "#dc2626" } : undefined}
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className={visitStyles.formRow}>
                  <div className={visitStyles.formGroup}>
                    <label htmlFor="phone" className={visitStyles.label}>Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={visitStyles.input}
                      placeholder="+44 7123 456789"
                    />
                  </div>
                  <div className={visitStyles.formGroup}>
                    <label htmlFor="subject" className={visitStyles.label}>Subject</label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className={visitStyles.input}
                      placeholder="How can we help?"
                    />
                  </div>
                </div>

                <div className={visitStyles.formGroup}>
                  <label htmlFor="message" className={visitStyles.label}>Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    className={visitStyles.textarea}
                    style={errors.message ? { borderColor: "#dc2626" } : undefined}
                    placeholder="Write your message or prayer request here..."
                  />
                </div>

                {submitStatus === "success" && (
                  <div className={visitStyles.successMsg}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <div>
                      <strong>Message sent successfully!</strong>
                      <p style={{ marginTop: "4px", fontSize: "0.9rem", color: "inherit", opacity: 0.9 }}>
                        Thank you for reaching out. A member of our welcome or pastoral team will get back to you shortly.
                      </p>
                    </div>
                  </div>
                )}

                {submitStatus === "error" && (
                  <div className={visitStyles.errorMsg}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <div>
                      <strong>Failed to send message.</strong>
                      <p style={{ marginTop: "4px", fontSize: "0.9rem", color: "inherit", opacity: 0.9 }}>
                        There was an error processing your request. Please try again or email us directly at info@thelightcitychurch.org.
                      </p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitStatus === "submitting"}
                  className={visitStyles.submitBtn}
                >
                  {submitStatus === "submitting" ? (
                    <>Sending Message...</>
                  ) : (
                    <>
                      Send Message
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                      </svg>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Right Column: Google Map Embed */}
            <div className={visitStyles.mapArea}>
              <h2 className={visitStyles.sectionTitle} style={{ opacity: 0, height: 0, overflow: "hidden" }}>Our Location</h2>
              <div className={visitStyles.mapWrapper}>
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2402.730303649666!2d-1.1448831230006277!3d52.9531818722421!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4879c3d4abfca783%3A0xb3515cf8bfa00cb3!2sMotorpoint%20Arena%20Nottingham!5e0!3m2!1sen!2suk!4v1710000000000!5m2!1sen!2suk"
                  className={visitStyles.mapIframe}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Motorpoint Arena Nottingham Location"
                ></iframe>
              </div>
            </div>

          </div>
        </div>
      </ViewportSection>

      {/* What to Expect Section */}
      <ViewportSection as="section" className={visitStyles.expectSection}>
        <div className={visitStyles.container}>
          <div className={visitStyles.expectHeader}>
            <h2 className={visitStyles.expectTitle}>
              What to <span className={visitStyles.italicSerif}>Expect</span>
            </h2>
            <p className={visitStyles.expectSubtitle}>
              Visiting a new church can be intimidating. Here is what you can look forward to when you join us this Sunday.
            </p>
          </div>

          <div className={visitStyles.expectGrid}>
            {expectData.map((item, idx) => (
              <div
                key={idx}
                className={`${visitStyles.expectCard} animate-premium-block`}
                style={{ animationDelay: `${0.2 + idx * 0.08}s` }}
              >
                <div className={visitStyles.expectCardIconWrapper}>
                  {item.icon}
                </div>
                <h3 className={visitStyles.expectCardTitle}>{item.title}</h3>
                <p className={visitStyles.expectCardText}>{item.desc}</p>
              </div>
            ))}
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
                  <li><Link href="/ministries" className={styles.footerNavLink}>Ministries</Link></li>
                  <li><Link href="/gallery" className={styles.footerNavLink}>Gallery</Link></li>
                  <li><Link href="/blog" className={styles.footerNavLink}>Blog</Link></li>
                  <li><Link href="/visit-us" className={styles.footerNavLink}>Visit Us</Link></li>
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
