// src/app/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import styles from "./page.module.css";

interface SplitTextProps {
  text: string;
  className?: string;
  delayOffset?: number;
  by?: 'letters' | 'words';
}

// Progressive enhancement viewport-triggered text reveal
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


// Viewport tracking wrapper section
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

// Bento Gallery elements removed.

const waveformBars = [
  { height: 12, active: true },
  { height: 18, active: true },
  { height: 8, active: true },
  { height: 24, active: true },
  { height: 14, active: true },
  { height: 20, active: true },
  { height: 28, active: true },
  { height: 16, active: true },
  { height: 22, active: true },
  { height: 10, active: true },
  { height: 18, active: false },
  { height: 8, active: false },
  { height: 14, active: false },
  { height: 24, active: false },
  { height: 12, active: false },
  { height: 20, active: false },
  { height: 8, active: false },
  { height: 16, active: false },
  { height: 10, active: false },
  { height: 14, active: false },
];

interface TestimonyItem {
  id: string;
  quote: string;
  author: string;
  role: string;
  pathway: string;
  avatar: string;
  portrait: string;
  accentColor: string;
}

const testimoniesData: TestimonyItem[] = [
  {
    id: "testimony-1",
    quote: "Finding Light City was like finding home after a long storm. The community wrapped around us with no judgment, just pure grace and support. Our lives are forever changed.",
    author: "Sarah Jenkins",
    role: "Community Group Member",
    pathway: "Community Pathway",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop",
    portrait: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=600&auto=format&fit=crop",
    accentColor: "rgba(0, 223, 216, 0.35)"
  },
  {
    id: "testimony-2",
    quote: "As a designer, I always felt my faith and my art were in separate boxes. Creative Night showed me how to bridge the two, using my talents to glorify God and shape culture.",
    author: "Marcus Chen",
    role: "Creative Volunteer",
    pathway: "Creative Pathway",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
    portrait: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop",
    accentColor: "rgba(255, 0, 122, 0.35)"
  },
  {
    id: "testimony-3",
    quote: "Worship here is not a performance; it is a genuine, heart-stirring encounter. It inspired me to take bold next steps in my spiritual walk and start leading a Life Group.",
    author: "Elijah Brooks",
    role: "Worship Team & Life Group Leader",
    pathway: "Worship Pathway",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop",
    portrait: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=600&auto=format&fit=crop",
    accentColor: "rgba(121, 40, 202, 0.35)"
  }
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<'story' | 'vision' | 'connect'>('story');
  // const [dashboardView, setDashboardView] = useState<'attendance' | 'generosity'>('attendance');
  
  // Testimony Cinematic states
  const [activeTestimony, setActiveTestimony] = useState(0);
  const [testimonyFade, setTestimonyFade] = useState(false);
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({});
  const navMenuRef = useRef<HTMLDivElement>(null);
  const portraitRef = useRef<HTMLDivElement>(null);



  const handleTestimonyChange = (index: number) => {
    if (index === activeTestimony) return;
    setTestimonyFade(true);
    setTimeout(() => {
      setActiveTestimony(index);
      setTestimonyFade(false);
    }, 350);
  };

  const handlePortraitMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!portraitRef.current) return;
    const rect = portraitRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    portraitRef.current.style.setProperty("--mouse-x", `${x}px`);
    portraitRef.current.style.setProperty("--mouse-y", `${y}px`);
  };

  useEffect(() => {
    const updateIndicator = () => {
      if (!navMenuRef.current) return;
      const activeEl = navMenuRef.current.querySelector(`.${styles.navItemActive}`) as HTMLElement;
      if (activeEl) {
        setIndicatorStyle({
          width: activeEl.offsetWidth,
          left: activeEl.offsetLeft,
        });
      }
    };
    
    updateIndicator();
    const rafId = requestAnimationFrame(updateIndicator);
    const timer = setTimeout(updateIndicator, 100);
    const timer2 = setTimeout(updateIndicator, 500);
    
    window.addEventListener('resize', updateIndicator);
    return () => {
      window.removeEventListener('resize', updateIndicator);
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, [activeTestimony]);

  // Old Bento states and waveform configs removed.

  // Insights dashboard stats config
  /*
  const attendanceStats = [
    { label: "Worship", percentage: 85, value: "1,200" },
    { label: "Groups", percentage: 65, value: "650" },
    { label: "Serving", percentage: 45, value: "380" },
    { label: "Youth", percentage: 55, value: "450" },
    { label: "Kids", percentage: 40, value: "320" }
  ];

  const generosityStats = [
    { label: "Local", percentage: 90, value: "$18.5K" },
    { label: "Global", percentage: 60, value: "$12.0K" },
    { label: "Food Bank", percentage: 40, value: "$6.2K" },
    { label: "Housing", percentage: 55, value: "$5.1K" },
    { label: "Schools", percentage: 35, value: "$4.0K" }
  ];
  */

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={`${styles.header} animate-fade-in`} style={{ animationDelay: '0.1s' }}>
        <div className={styles.logoContainer}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.logoSvg}>
            <circle cx="11" cy="11" r="7.5" stroke="currentColor" strokeWidth="2.5"/>
            <circle cx="19" cy="19" r="1.5" fill="currentColor"/>
          </svg>
        </div>

        <nav className={styles.nav} aria-label="Main Navigation">
          <ul className={styles.navUl}>
            <li>
              <a href="#hero" className={styles.activeNavLink}>Home</a>
            </li>
            <li>
              <a href="#pastor" className={styles.navLink}>About</a>
            </li>
            <li>
              <a href="#services" className={styles.navLink}>Ministries</a>
            </li>
            <li>
              <a href="#gallery" className={styles.navLink}>Gallery</a>
            </li>
            <li>
              <a href="#blog" className={styles.navLink}>Devotionals</a>
            </li>
            <li>
              <a href="#contact" className={styles.navLink}>Visit Us</a>
            </li>
          </ul>
        </nav>

        <button className={styles.preOrderBtn} id="header-preorder-btn" onClick={() => {
          const el = document.getElementById('contact');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          Get Involved
        </button>
      </header>

      {/* Hero Section */}
      <ViewportSection as="main" className={styles.hero} id="hero">
        <div className={styles.heroContent}>
          <span className={`${styles.heroTag} animate-fade-in-up`} style={{ animationDelay: '0.1s' }}>Welcome to The Light City Church</span>
          <h1 className={styles.heroTitle}>
            <SplitText text="Live in the Fulness of" delayOffset={0.3} />
            <br />
            <SplitText text="Your Inheritance" delayOffset={0.8} />
          </h1>
          <div className={`${styles.heroButtons} animate-fade-in-up`} style={{ animationDelay: '1.3s' }}>
            <button className={styles.exploreBtn} id="explore-btn" onClick={() => {
              const el = document.getElementById('pastor');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}>Get Involved</button>
            <button className={styles.demoBtn} id="demo-btn" onClick={() => {
              const el = document.getElementById('contact');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}>Worship With Us</button>
          </div>
        </div>
      </ViewportSection>

      {/* Features Section */}
      <ViewportSection as="section" className={styles.featuresSection} id="features-detail">
        <div className={styles.featuresCard}>
          <div className={styles.featuresHeader}>
            <span className={styles.featuresTag}>
              <SplitText text="/Our Mission" delayOffset={0.0} />
            </span>
            <h2 className={styles.featuresTitle}>
              <span className={styles.highlightText}>
                <SplitText 
                  text="To empower every man, woman, and child to live in the fulness of their inheritance in Christ" 
                  delayOffset={0.15} 
                  by="words" 
                />
              </span>{" "}
              <span className={styles.mutedText}>
                <SplitText 
                  text="through the accurate teaching of the Gospel. To bring light where there was once darkness and to prepare the church." 
                  delayOffset={0.75} 
                  by="words" 
                />
              </span>
            </h2>
          </div>

          <div className={styles.cardsGrid}>
            {/* Left Video Card */}
            <div className={`${styles.videoCard} animate-premium-block`}>
              <Image
                src="/feature_sculpture.png"
                alt="Worship at The Light City Church"
                fill
                sizes="(max-width: 1024px) 100vw, 800px"
                className={styles.videoBgImage}
              />
              <div className={styles.playButton} role="button" aria-label="Play video" onClick={() => {
                const el = document.getElementById('contact');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}>
                <svg width="18" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 21 12 5 21 5 3"></polygon>
                </svg>
              </div>
              <div className={styles.videoBadges}>
                <div className={styles.quoteBadge}>
                  &quot;Believe in God in you!&quot;
                </div>
                <div className={styles.authorBadge}>
                  Acts 26:18
                </div>
              </div>
            </div>

            {/* Right Insights Audio Card */}
            <div className={`${styles.audioCard} animate-premium-block delay-2`}>
              <div className={styles.audioHeader}>
                <span className={styles.audioBrand}>DAILY LIGHT</span>
                <span className={styles.audioBrand}>devotional</span>
              </div>
              
              <div className={styles.audioBody}>
                <h3 className={styles.audioTitle}>Without miracles Christianity is reduced to philosophy.</h3>
                <div className={styles.waveformContainer}>
                  {waveformBars.map((bar, index) => (
                    <div
                      key={index}
                      className={`${styles.waveformBar} ${bar.active ? styles.activeBar : ""}`}
                      style={{ height: `${bar.height}px` }}
                    />
                  ))}
                </div>
              </div>

              <div className={styles.audioFooter}>
                <p className={styles.audioFooterText}>
                  Christ in you, the hope of glory! Believe in God in you!
                </p>
                <div className={styles.avatarWrapper}>
                  <Image
                    src="/avatar_ryan.png"
                    alt="Pastor Ronnie Dube"
                    width={52}
                    height={52}
                    className={styles.avatarImage}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </ViewportSection>

      {/* Insights Dashboard Section - Hidden for now
      <ViewportSection as="section" className={styles.insightsSection} id="insights">
        <div className={styles.insightsCard}>
          <div className={styles.insightsHeader}>
            <span className={styles.insightsTag}>
              <SplitText text="/Impact Insights" delayOffset={0.0} />
            </span>
            <h2 className={styles.insightsTitle}>
              <span className={styles.highlightText}>
                <SplitText 
                  text="Your key to active connection & strategic growth" 
                  delayOffset={0.15} 
                  by="words" 
                />
              </span>{" "}
              <span className={styles.mutedText}>
                <SplitText 
                  text="empowering every member to discover their purpose in real-time." 
                  delayOffset={0.75} 
                  by="words" 
                />
              </span>
            </h2>
          </div>

          <div className={styles.dashboardGrid}>
            <div className={`${styles.lightCard} ${styles.engagementCard} animate-premium-block`}>
              <div className={styles.cardHeader}>
                <span className={styles.cardSub}>/Pathways</span>
                <h3 className={styles.cardTitle}>Active Connection</h3>
              </div>
              
              <div className={styles.cardBodyCenter}>
                <div className={styles.circularProgressContainer}>
                  <svg className={styles.progressRing} width="160" height="160">
                    <circle 
                      className={styles.progressRingBg} 
                      stroke="var(--border-color)" 
                      strokeWidth="8" 
                      fill="transparent" 
                      r="65" 
                      cx="80" 
                      cy="80" 
                    />
                    <circle 
                      className={styles.progressRingCircle} 
                      stroke="var(--text-primary)" 
                      strokeWidth="8" 
                      strokeLinecap="round"
                      fill="transparent" 
                      r="65" 
                      cx="80" 
                      cy="80" 
                      style={{ '--ring-offset': `${408.4 - (85 / 100) * 408.4}` } as React.CSSProperties}
                    />
                  </svg>
                  <div className={styles.progressText}>
                    <span className={styles.progressNumber}>
                      <CountUp end={85} />%
                    </span>
                    <span className={styles.progressLabel}>Engaged</span>
                  </div>
                </div>
              </div>
              
              <div className={styles.cardFooter}>
                <p className={styles.cardFooterText}>
                  Weekly group attendance and serve-team registration levels.
                </p>
              </div>
            </div>

            <div className={`${styles.lightCard} ${styles.growthCard} animate-premium-block delay-1`}>
              <div className={styles.cardHeaderWithToggle}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardSub}>/{dashboardView === 'attendance' ? 'Attendance' : 'Generosity'}</span>
                  <h3 className={styles.cardTitle}>{dashboardView === 'attendance' ? 'Community Growth' : 'City Impact'}</h3>
                </div>
                
                <div className={styles.toggleContainer}>
                  <button
                    className={`${styles.toggleBtn} ${dashboardView === 'attendance' ? styles.toggleBtnActive : ''}`}
                    onClick={() => setDashboardView('attendance')}
                  >
                    Attendance
                  </button>
                  <button
                    className={`${styles.toggleBtn} ${dashboardView === 'generosity' ? styles.toggleBtnActive : ''}`}
                    onClick={() => setDashboardView('generosity')}
                  >
                    Generosity
                  </button>
                </div>
              </div>
              
              <div className={styles.growthMetricContainer}>
                <div className={styles.growthValue}>
                  {activePrefix}<CountUp end={activeMetric} />{activeSuffix}
                </div>
                <div className={styles.growthTrend}>
                  <span className={styles.trendArrow}>↑</span> {activeTrend}
                </div>
              </div>

              <div className={styles.barChartContainer}>
                {activeStats.map((stat, idx) => (
                  <div key={idx} className={styles.chartBarWrapper}>
                    <div className={styles.barColumnContainer}>
                      <div 
                        className={styles.barColumn} 
                        style={{ '--bar-height': `${stat.percentage}%` } as React.CSSProperties}
                      >
                        <span className={styles.barTooltip}>{stat.value}</span>
                      </div>
                    </div>
                    <span className={styles.barLabel}>{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={`${styles.lightCard} ${styles.trendCard} animate-premium-block delay-2`}>
              <div className={styles.cardHeader}>
                <span className={styles.cardSub}>/Trend</span>
                <h3 className={styles.cardTitle}>Connection Trend</h3>
              </div>
              
              <div className={styles.trendChartContainer}>
                <svg viewBox="0 0 240 120" className={styles.trendSvg}>
                  <line x1="20" y1="15" x2="220" y2="15" className={styles.gridLine} />
                  <line x1="20" y1="50" x2="220" y2="50" className={styles.gridLine} />
                  <line x1="20" y1="85" x2="220" y2="85" className={styles.gridLine} />
                  
                  <path
                    d="M 20 100 C 45 90, 45 75, 70 75 C 95 75, 95 85, 120 85 C 145 85, 145 40, 170 40 C 195 40, 195 15, 220 15"
                    fill="none"
                    stroke="var(--text-primary)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className={styles.trendCurvePath}
                  />

                  {[
                    { cx: 20, cy: 100, val: "450", label: "Week 1" },
                    { cx: 70, cy: 75, val: "580", label: "Week 2" },
                    { cx: 120, cy: 85, val: "620", label: "Week 3" },
                    { cx: 170, cy: 40, val: "780", label: "Week 4" },
                    { cx: 220, cy: 15, val: "920", label: "Week 5" },
                  ].map((pt, idx) => (
                    <g key={idx} className={styles.chartDotGroup}>
                      <circle
                        cx={pt.cx}
                        cy={pt.cy}
                        r="5"
                        fill="var(--bg-secondary)"
                        stroke="var(--text-primary)"
                        strokeWidth="2.5"
                        className={styles.chartDot}
                      />
                      <foreignObject
                        x={pt.cx - 30}
                        y={pt.cy - 38}
                        width="60"
                        height="30"
                        className={styles.tooltipForeign}
                      >
                        <div className={styles.chartTooltip}>
                          <strong>{pt.val}</strong>
                          <span>{pt.label}</span>
                        </div>
                      </foreignObject>
                    </g>
                  ))}
                </svg>
              </div>

              <div className={styles.cardFooter}>
                <p className={styles.cardFooterText}>
                  Steady upward trajectory in new volunteer and visitor onboarding.
                </p>
              </div>
            </div>

            <div className={`${styles.darkCard} ${styles.hubCard} animate-premium-block delay-3`}>
              <div className={styles.cardHeader}>
                <span className={styles.cardSubDark}>/Hub</span>
                <h3 className={styles.cardTitleDark}>Ministry Hub</h3>
              </div>

              <div className={styles.darkCardBody}>
                <p className={styles.darkCardDesc}>
                  Manage serving teams, track milestones & local outreach.
                </p>
                
                <div className={styles.hubWidget}>
                  <div className={styles.widgetHeader}>
                    <span>Total Service Impact</span>
                    <span className={styles.widgetIcon}>❤</span>
                  </div>
                  <div className={styles.widgetMetric}>
                    <CountUp end={15.4} suffix="K" />
                  </div>
                  <div className={styles.widgetFooter}>
                    <span>Hours spent serving the city</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      */}

      {/* Pastor Section */}
      <ViewportSection as="section" className={styles.pastorSection} id="pastor">
        <div className={styles.pastorCard}>
          <div className={styles.pastorGrid}>
            
            {/* Left side: Visual photo with floating glass badge */}
            <div className={`${styles.pastorImageWrapper} animate-premium-block`}>
              <Image
                src="/pastor_portrait.png"
                alt="Pastor Ronnie & Annalene Dube"
                fill
                sizes="(max-width: 1024px) 100vw, 600px"
                className={styles.pastorImage}
                priority
              />
              <div className={styles.pastorFloatingBadge}>
                <h4 className={styles.badgeName}>Ronnie & Annalene Dube</h4>
                <p className={styles.badgeRole}>Senior Pastors, Light City</p>
              </div>
            </div>

            {/* Right side: Editorial text & Interactive Tabs */}
            <div className={styles.pastorInfo}>
              <span className={styles.pastorTag}>
                <SplitText text="// LEADERSHIP" delayOffset={0.0} />
              </span>
              <h2 className={styles.pastorTitle}>
                <SplitText text="Guiding Our Community" delayOffset={0.1} />
                <br />
                <span className={styles.gradientText}>
                  <SplitText text="With Grace & Vision" delayOffset={0.6} />
                </span>
              </h2>
              
              <blockquote className={`${styles.pastorQuote} animate-fade-in-up`} style={{ animationDelay: '1.1s' }}>
                &ldquo;We want to see Light City transformed by the love and grace of Jesus, creating a space where everyone belongs.&rdquo;
              </blockquote>

              {/* Tabs Navigation */}
              <div className={`${styles.tabsContainer} animate-fade-in-up`} style={{ animationDelay: '1.3s' }}>
                <div className={styles.tabButtons}>
                  <button 
                    className={`${styles.tabButton} ${activeTab === 'story' ? styles.tabButtonActive : ''}`}
                    onClick={() => setActiveTab('story')}
                  >
                    Our Story
                  </button>
                  <button 
                    className={`${styles.tabButton} ${activeTab === 'vision' ? styles.tabButtonActive : ''}`}
                    onClick={() => setActiveTab('vision')}
                  >
                    Our Vision
                  </button>
                  <button 
                    className={`${styles.tabButton} ${activeTab === 'connect' ? styles.tabButtonActive : ''}`}
                    onClick={() => setActiveTab('connect')}
                  >
                    Connect
                  </button>
                </div>

                {/* Tab Panel Content */}
                <div className={styles.tabPanel}>
                  {activeTab === 'story' && (
                    <div className={`${styles.tabContent} animate-fade-in-up`}>
                      <p>
                        Pastor Ronnie Dube is the co-founder and senior pastor at The Light City Church. His ministry as a pastor, teacher, author, and healing minister continues to transform many lives around the world, helping people experience a victorious and purposeful life in God’s Word.
                      </p>
                      <p style={{ marginTop: '12px' }}>
                        His wife, Pastor Annalene Dube, is a seasoned minister of the Word and worship leader. Her humility, warmth, and genuine love for God and people have led to her touching many lives globally through her music and teaching ministry.
                      </p>
                    </div>
                  )}

                  {activeTab === 'vision' && (
                    <div className={`${styles.tabContent} animate-fade-in-up`}>
                      <p>
                        We believe in a church that is culturally engaging, spiritually deep, and socially active. Our core values reflect our dedication to the accurate teaching of the Gospel:
                      </p>
                      <ul className={styles.visionList}>
                        <li><strong>Love Above All:</strong> We demonstrate the divine nature of God by loving and valuing every person because of the price tag God put on their life, which is His own blood.</li>
                        <li><strong>Standard of Excellence:</strong> We seek to excel in everything we do because Christ is made unto us wisdom and we have the mind of Christ.</li>
                        <li><strong>Honour:</strong> We treat each other with respect and integrity, and we honour and submit to our leaders as unto the Lord.</li>
                      </ul>
                    </div>
                  )}

                  {activeTab === 'connect' && (
                    <div className={`${styles.tabContent} animate-fade-in-up`}>
                      <p>
                        Pastor Ronnie and Annalene would love to meet you! Join us for worship immediately after our Sunday services at Motorpoint Arena, or reach out to join our global online Light Groups.
                      </p>
                      <div className={styles.connectButtons}>
                        <a href="#contact" className={styles.connectMailBtn}>
                          Worship With Us
                        </a>
                        <a href="https://instagram.com/thelovedcircle" target="_blank" rel="noopener noreferrer" className={styles.connectInstaBtn}>
                          The Loved Circle
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Minimal social row */}
              <div className={`${styles.socialRow} animate-fade-in-up`} style={{ animationDelay: '1.5s' }}>
                <span className={styles.socialLabel}>Follow our journey:</span>
                <div className={styles.socialIcons}>
                  <a href="https://instagram.com/thelovedcircle" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={styles.socialIconLink}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                  </a>
                  <a href="https://x.com/thelightcitychurch" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className={styles.socialIconLink}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
                  </a>
                  <a href="https://facebook.com/102820662239782" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className={styles.socialIconLink}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                  </a>
                </div>
              </div>

            </div>

          </div>
        </div>
      </ViewportSection>

      {/* Services Section */}
      <ViewportSection as="section" className={styles.servicesSection} id="services">
        <div className={styles.servicesContainer}>
          <div className={styles.servicesHeader}>
            <h2 className={styles.servicesTitle}>
              <SplitText text="Ministries & Pathways" delayOffset={0.1} />
            </h2>
            <div className={`${styles.servicesNavArrows} animate-premium-block delay-3`}>
              <button className={styles.arrowBtn} aria-label="Previous services">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
              </button>
              <button className={`${styles.arrowBtn} ${styles.arrowBtnActive}`} aria-label="Next services">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>
          </div>

          <div className={styles.servicesGrid}>
            {[
              {
                id: "01",
                title: "Sunday Worship",
                desc: "Jesus-centred praise, worship, and an anointed message by Pastor Ronnie Dube at Nottingham Motorpoint Arena.",
                image: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?q=80&w=600&auto=format&fit=crop"
              },
              {
                id: "02",
                title: "Daily Devotional",
                desc: "Subscribe to receive our Daily Devotional, monthly newsletter, and updates about special conferences.",
                image: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?q=80&w=600&auto=format&fit=crop"
              },
              {
                id: "03",
                title: "Freedom from Religion",
                desc: "Discover the good news of grace and how salvation through faith in Jesus Christ is completely free.",
                image: "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?q=80&w=600&auto=format&fit=crop"
              },
              {
                id: "04",
                title: "The Loved Circle",
                desc: "A circle of sisterhood helping you on a journey of self-discovery, healing, wellness, and extravagant love.",
                image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=600&auto=format&fit=crop"
              }
            ].map((service, idx) => (
              <div key={service.id} className={`${styles.serviceCard} animate-premium-block${idx > 0 ? ` delay-${idx * 2}` : ""}`}>
                <div className={styles.serviceCardImageArea}>
                  <span className={styles.serviceCardIndex}>{service.id}</span>
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className={styles.serviceCardImage}
                  />
                </div>
                <h3 className={styles.serviceCardTitle}>{service.title}</h3>
                <p className={styles.serviceCardText}>{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </ViewportSection>

      {/* Portfolio / Gallery Section */}
      <ViewportSection as="section" className={styles.portfolioSection} id="gallery">
        <div className={styles.portfolioContainer}>
          
          {/* Left Column */}
          <div className={styles.portfolioColumn}>
            <div className={styles.portfolioIntro}>
              <h2 className={styles.portfolioIntroTitle}>Capturing Our Faith</h2>
              <p className={styles.portfolioIntroText}>
                Explore key moments, ministries, and events that capture the heart of our community in action.
              </p>
            </div>
            
            <div className={`${styles.portfolioCard} ${styles.stretchCard} animate-premium-block`}>
              <div className={`${styles.portfolioImageWrapper} ${styles.stretchImage}`}>
                <Image
                  src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=600&auto=format&fit=crop"
                  alt="Sunday Worship"
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className={styles.portfolioCardImage}
                />
                <span className={styles.portfolioCardTextBadge}>Sunday Worship</span>
              </div>
            </div>
          </div>

          {/* Middle Column */}
          <div className={styles.portfolioColumn}>
            <div className={`${styles.portfolioCard} ${styles.middleCard} animate-premium-block delay-1`}>
              <div className={styles.portfolioImageWrapper}>
                <Image
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=600&auto=format&fit=crop"
                  alt="Light Groups"
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className={styles.portfolioCardImage}
                />
                <span className={styles.portfolioCardTextBadge}>Light Groups</span>
              </div>
            </div>

            <div className={`${styles.portfolioCard} ${styles.middleCard} animate-premium-block delay-2`}>
              <div className={styles.portfolioImageWrapper}>
                <Image
                  src="https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=600&auto=format&fit=crop"
                  alt="Worship Team"
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className={styles.portfolioCardImage}
                />
                <span className={styles.portfolioCardTextBadge}>Worship Team</span>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className={styles.portfolioColumn}>
            <div className={`${styles.portfolioCard} ${styles.tallCard} ${styles.stretchCard} animate-premium-block delay-3`}>
              <div className={`${styles.portfolioImageWrapper} ${styles.stretchImage}`}>
                <Image
                  src="https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=600&auto=format&fit=crop"
                  alt="Community Outreach"
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className={styles.portfolioCardImage}
                />
                <span className={styles.portfolioCardTextBadge}>Community Outreach</span>
              </div>
            </div>

            <div className={styles.portfolioCta}>
              <button className={styles.portfolioBtn} onClick={() => {
                const el = document.getElementById('contact');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}>Connect With Us</button>
            </div>
          </div>

        </div>
      </ViewportSection>

      {/* Testimonies Section */}
      <ViewportSection as="section" className={styles.testimoniesSection} id="testimonies">
        <div 
          className={styles.ambientGlow}
          style={{
            backgroundColor: testimoniesData[activeTestimony].accentColor
          }}
        />

        <div className={styles.testimoniesContainer}>
          <div className={styles.testimoniesHeader}>
            <span className={styles.testimoniesTag}>
              <SplitText text="/Stories" delayOffset={0.0} />
            </span>
            <h2 className={styles.testimoniesTitle}>
              <SplitText text="Shining Their Light" delayOffset={0.1} />
              <br />
              <span className={styles.gradientText}>
                <SplitText text="Stories of Hope & Purpose" delayOffset={0.6} />
              </span>
            </h2>
          </div>

          <div className={styles.testimoniesCinematicGrid}>
            {/* Left Column: Interactive Portrait spotlight card */}
            <div className={`${styles.portraitColumn} animate-premium-block`}>
              <div
                ref={portraitRef}
                onMouseMove={handlePortraitMouseMove}
                className={`${styles.cinematicPortraitWrapper} ${testimonyFade ? styles.fadeExit : styles.fadeEntry}`}
                style={{
                  position: 'relative',
                  '--accent-glow': testimoniesData[activeTestimony].accentColor
                } as React.CSSProperties}
              >
                <div className={styles.portraitGlowOverlay} />
                <Image
                  src={testimoniesData[activeTestimony].portrait}
                  alt={testimoniesData[activeTestimony].author}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                  className={styles.portraitImage}
                />
                <div className={styles.portraitOverlayText}>
                  <span className={styles.portraitPathway}>/{testimoniesData[activeTestimony].pathway}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Giant Quote Block & Pagination */}
            <div className={`${styles.copyColumn} animate-premium-block delay-2`}>
              <div className={`${styles.quoteBlock} ${testimonyFade ? styles.fadeExit : styles.fadeEntry}`}>
                <span className={styles.largeQuoteMark}>“</span>
                <blockquote className={styles.cinematicQuoteText}>
                  {testimoniesData[activeTestimony].quote}
                </blockquote>
                
                <div className={styles.cinematicAuthorMeta}>
                  <h4 className={styles.cinematicAuthorName}>{testimoniesData[activeTestimony].author}</h4>
                  <span className={styles.cinematicAuthorRole}>{testimoniesData[activeTestimony].role}</span>
                </div>
              </div>

              {/* Custom horizontal pagination menu */}
              <div className={styles.cinematicNavWrapper}>
                <div className={styles.cinematicNavMenu} ref={navMenuRef}>
                  {testimoniesData.map((item, idx) => (
                    <button
                      key={item.id}
                      className={`${styles.navItem} ${activeTestimony === idx ? styles.navItemActive : ""}`}
                      onClick={() => handleTestimonyChange(idx)}
                      aria-label={`Show testimony from ${item.author}`}
                    >
                      <span className={styles.navIndex}>{String(idx + 1).padStart(2, '0')}</span>
                      <span className={styles.navDivider}>/</span>
                      <span className={styles.navName}>{item.author.split(' ')[0]}</span>
                    </button>
                  ))}
                  <div 
                    className={styles.navIndicator} 
                    style={indicatorStyle}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </ViewportSection>

      {/* Blog/Insights Section */}
      <ViewportSection as="section" className={styles.blogSection} id="blog">
        <div className={styles.blogContainer}>
          <div className={styles.blogHeader}>
            <span className={styles.blogLabel}>Articles</span>
            <h2 className={styles.blogHeadline}>
              Daily Devotionals & faith <span className={styles.italicSerif}>resources</span>
            </h2>
          </div>

          {/* Featured Post Card (Split layout: Image Left, Content Right) */}
          <div className={`${styles.featuredCard} animate-premium-block`}>
            <div className={styles.featuredImageArea}>
              <Image
                src="https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?q=80&w=1000&auto=format&fit=crop"
                alt="Freedom from Religion: Why Grace Changes Everything"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className={styles.blogCardImage}
                priority
              />
            </div>
            <div className={styles.featuredTextArea}>
              <div className={styles.badgeRow}>
                <span className={styles.blogPillBadge}>Grace & Faith</span>
              </div>
              <h3 className={styles.featuredTitle}>Freedom from Religion: Why Grace Changes Everything</h3>
              <p className={styles.featuredExcerpt}>
                Many view Christianity as a set of rules and commandments. But Jesus came to undo that religious mentality. Discover how right standing with God has nothing to do with keeping the law.
              </p>
              
              <div className={styles.featuredFooter}>
                <div className={styles.authorGroup}>
                  <div className={styles.authorAvatarWrapper}>
                    <Image
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop"
                      alt="Pastor Ronnie Dube"
                      width={32}
                      height={32}
                      className={styles.authorAvatar}
                    />
                  </div>
                  <span className={styles.authorName}>Pastor Ronnie Dube</span>
                </div>
                <span className={styles.postDate}>June 29, 2026</span>
              </div>
            </div>
          </div>

          {/* Bottom Grid: 3 columns */}
          <div className={styles.blogGrid}>
            {[
              {
                id: "grid-1",
                category: "Devotional",
                title: "Without Miracles, Christianity is Reduced to Philosophy",
                image: "https://images.unsplash.com/photo-1504052434569-70ad58565b90?q=80&w=600&auto=format&fit=crop"
              },
              {
                id: "grid-2",
                category: "The Loved Circle",
                title: "Extravagant Love: God's Over-the-Top Emotions for You",
                image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=600&auto=format&fit=crop"
              },
              {
                id: "grid-3",
                category: "Partnership",
                title: "Sowing Seeds: Why Partnering with Us Changes Lives Globally",
                image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=600&auto=format&fit=crop"
              }
            ].map((article, idx) => (
              <div
                key={article.id}
                className={`${styles.blogCard} animate-premium-block`}
                style={{ animationDelay: `${0.2 + idx * 0.1}s` }}
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
                </div>
              </div>
            ))}
          </div>

          {/* Center Load More Button CTA */}
          <div className={styles.blogCtaContainer}>
            <button className={styles.loadMoreBtn} onClick={() => {
              const el = document.getElementById('contact');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}>
              View All Articles
            </button>
          </div>
        </div>
      </ViewportSection>

      {/* Combined CTA & Footer Section */}
      <footer className={styles.ctaFooterSection} id="contact">
        <div className={styles.ctaFooterContainer}>
          {/* Top Half: CTA Area */}
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaHeadline}>
              Ready to Experience His Extravagant{" "}
              <span className={styles.ctaBadgeWrapper}>
                <Image
                  src="https://images.unsplash.com/photo-1461530751191-a53d31a38697?q=80&w=150&auto=format&fit=crop"
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
                <span className={styles.ctaButtonText}>Send Us a Prayer Request</span>
                <span className={styles.ctaButtonIcon}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="7" y1="17" x2="17" y2="7"></line>
                    <polyline points="7 7 17 7 17 17"></polyline>
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
                <li><a href="#hero" className={styles.footerNavLink}>Home</a></li>
                <li><a href="#pastor" className={styles.footerNavLink}>About</a></li>
                <li><a href="#services" className={styles.footerNavLink}>Ministries</a></li>
                <li><a href="#gallery" className={styles.footerNavLink}>Gallery</a></li>
                <li><a href="#blog" className={styles.footerNavLink}>Devotionals</a></li>
                <li><a href="#contact" className={styles.footerNavLink}>Visit Us</a></li>
              </ul>
            </nav>
            
            <div className={styles.giantBrandContainer}>
              <h1 className={styles.giantBrandText}>LIGHT CITY</h1>
            </div>
          </div>
        </div>
      </footer>
      {/* Lightbox Modal removed */}

    </div>
  );
}

