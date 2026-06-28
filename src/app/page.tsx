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
              <a href="#product" className={styles.activeNavLink}>Product</a>
            </li>
            <li>
              <a href="#case-study" className={styles.navLink}>Case Study</a>
            </li>
            <li>
              <a href="#resources" className={styles.navLink}>Resources</a>
            </li>
            <li>
              <a href="#pricing" className={styles.navLink}>Pricing</a>
            </li>
            <li>
              <a href="#contact" className={styles.navLink}>Contact</a>
            </li>
          </ul>
        </nav>

        <button className={styles.preOrderBtn} id="header-preorder-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          Pre-Order Now
        </button>
      </header>

      {/* Hero Section */}
      <ViewportSection as="main" className={styles.hero} id="hero">
        <div className={styles.heroContent}>
          <span className={`${styles.heroTag} animate-fade-in-up`} style={{ animationDelay: '0.1s' }}>Aero-Shield X1</span>
          <h1 className={styles.heroTitle}>
            <SplitText text="Breathe Pure in" delayOffset={0.3} />
            <br />
            <SplitText text="a Polluted World" delayOffset={0.8} />
          </h1>
          <div className={`${styles.heroButtons} animate-fade-in-up`} style={{ animationDelay: '1.3s' }}>
            <button className={styles.exploreBtn} id="explore-btn">Explore</button>
            <button className={styles.demoBtn} id="demo-btn">Watch Demo</button>
          </div>
        </div>
      </ViewportSection>

      {/* Features Section */}
      <ViewportSection as="section" className={styles.featuresSection} id="features-detail">
        <div className={styles.featuresCard}>
          <div className={styles.featuresHeader}>
            <span className={styles.featuresTag}>
              <SplitText text="/Features" delayOffset={0.0} />
            </span>
            <h2 className={styles.featuresTitle}>
              <span className={styles.highlightText}>
                <SplitText 
                  text="We are a team of visionary designers, strategists, and innovators" 
                  delayOffset={0.15} 
                  by="words" 
                />
              </span>{" "}
              <span className={styles.mutedText}>
                <SplitText 
                  text="dedicated to crafting exceptional digital experiences. Our mission is to bridge creativity with functionality," 
                  delayOffset={0.75} 
                  by="words" 
                />
              </span>
            </h2>
          </div>

          <div className={`${styles.cardsGrid} animate-fade-in-up`}>
            {/* Left Video Card */}
            <div className={styles.videoCard}>
              <Image
                src="/feature_sculpture.png"
                alt="Visionary Design Sculpture"
                fill
                sizes="(max-width: 1024px) 100vw, 800px"
                className={styles.videoBgImage}
              />
              <div className={styles.playButton} role="button" aria-label="Play video">
                <svg width="18" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 21 12 5 21 5 3"></polygon>
                </svg>
              </div>
              <div className={styles.videoBadges}>
                <div className={styles.quoteBadge}>
                  &quot;Can&apos;t imagine without them&quot;
                </div>
                <div className={styles.authorBadge}>
                  Ryhan
                </div>
              </div>
            </div>

            {/* Right Insights Audio Card */}
            <div className={styles.audioCard}>
              <div className={styles.audioHeader}>
                <span className={styles.audioBrand}>Woodmetal</span>
                <span className={styles.audioBrand}>insights</span>
              </div>
              
              <div className={styles.audioBody}>
                <h3 className={styles.audioTitle}>Ryan Said</h3>
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
                  Global best agency Sative Digital recommended...
                </p>
                <div className={styles.avatarWrapper}>
                  <Image
                    src="/avatar_ryan.png"
                    alt="Ryan Portrait"
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
            <div className={`${styles.lightCard} ${styles.engagementCard} animate-fade-in-up delay-1`}>
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

            <div className={`${styles.lightCard} ${styles.growthCard} animate-fade-in-up delay-2`}>
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

            <div className={`${styles.lightCard} ${styles.trendCard} animate-fade-in-up delay-3`}>
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

            <div className={`${styles.darkCard} ${styles.hubCard} animate-fade-in-up delay-4`}>
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
            <div className={`${styles.pastorImageWrapper} animate-fade-in-up`}>
              <Image
                src="/pastor_portrait.png"
                alt="Pastor David Cole"
                fill
                sizes="(max-width: 1024px) 100vw, 600px"
                className={styles.pastorImage}
                priority
              />
              <div className={styles.pastorFloatingBadge}>
                <h4 className={styles.badgeName}>David & Sarah Cole</h4>
                <p className={styles.badgeRole}>Lead Pastors, Light City</p>
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
                        In 2018, Pastor David and Sarah Cole started Light City Church with a simple yet profound vision: to build a modern, inclusive community where people can discover grace, experience authentic relationship, and shine their light in the city.
                      </p>
                      <p style={{ marginTop: '12px' }}>
                        With backgrounds in youth leadership and community development, they have spent the last decade dedicated to fostering spaces of hope and spiritual growth.
                      </p>
                    </div>
                  )}

                  {activeTab === 'vision' && (
                    <div className={`${styles.tabContent} animate-fade-in-up`}>
                      <p>
                        We believe in a church that is culturally engaging, spiritually deep, and socially active. Our core vision revolves around three main pillars:
                      </p>
                      <ul className={styles.visionList}>
                        <li><strong>Encounter:</strong> Experiencing God’s presence in worship and prayer.</li>
                        <li><strong>Belong:</strong> Growing together through authentic small groups.</li>
                        <li><strong>Impact:</strong> Serving our local community with compassion and action.</li>
                      </ul>
                    </div>
                  )}

                  {activeTab === 'connect' && (
                    <div className={`${styles.tabContent} animate-fade-in-up`}>
                      <p>
                        Pastor David and Sarah would love to meet you! Join us for a cup of coffee immediately after our Sunday services, or reach out to us online.
                      </p>
                      <div className={styles.connectButtons}>
                        <a href="mailto:david@lightcity.church" className={styles.connectMailBtn}>
                          Email David
                        </a>
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className={styles.connectInstaBtn}>
                          Follow Instagram
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
                  <a href="#" aria-label="Instagram" className={styles.socialIconLink}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                  </a>
                  <a href="#" aria-label="Twitter" className={styles.socialIconLink}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
                  </a>
                  <a href="#" aria-label="Facebook" className={styles.socialIconLink}>
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
            <h2 className={styles.servicesTitle}>Services we provide</h2>
            <div className={styles.servicesNavArrows}>
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
                title: "Arch Design",
                desc: "From initial concept development and schematic design",
                image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600&auto=format&fit=crop"
              },
              {
                id: "02",
                title: "Interior Design",
                desc: "Creating cohesive interior spaces that reflect your style",
                image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=600&auto=format&fit=crop"
              },
              {
                id: "03",
                title: "Urban Planning",
                desc: "Designing the spaces between buildings & outdoors",
                image: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=600&auto=format&fit=crop"
              },
              {
                id: "04",
                title: "Project Manage",
                desc: "Overseeing & control the entire construction process",
                image: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=600&auto=format&fit=crop"
              }
            ].map((service) => (
              <div key={service.id} className={styles.serviceCard}>
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
              <h2 className={styles.portfolioIntroTitle}>Our Portfolio of Pioneering Design</h2>
              <p className={styles.portfolioIntroText}>
                Explore our selected works that demonstrate our commitment to design excellence, innovation, and client satisfaction.
              </p>
            </div>
            
            <div className={`${styles.portfolioCard} ${styles.stretchCard}`}>
              <div className={`${styles.portfolioImageWrapper} ${styles.stretchImage}`}>
                <Image
                  src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=600&auto=format&fit=crop"
                  alt="New York Office"
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className={styles.portfolioCardImage}
                />
                <span className={styles.portfolioCardTextBadge}>New York Office</span>
              </div>
            </div>
          </div>

          {/* Middle Column */}
          <div className={styles.portfolioColumn}>
            <div className={`${styles.portfolioCard} ${styles.middleCard}`}>
              <div className={styles.portfolioImageWrapper}>
                <Image
                  src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=600&auto=format&fit=crop"
                  alt="Commercial Restaurant"
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className={styles.portfolioCardImage}
                />
                <span className={styles.portfolioCardTextBadge}>Commercial Restaurant</span>
              </div>
            </div>

            <div className={`${styles.portfolioCard} ${styles.middleCard}`}>
              <div className={styles.portfolioImageWrapper}>
                <Image
                  src="https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=600&auto=format&fit=crop"
                  alt="Hotel Rooms"
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className={styles.portfolioCardImage}
                />
                <span className={styles.portfolioCardTextBadge}>Hotel Rooms</span>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className={styles.portfolioColumn}>
            <div className={`${styles.portfolioCard} ${styles.tallCard} ${styles.stretchCard}`}>
              <div className={`${styles.portfolioImageWrapper} ${styles.stretchImage}`}>
                <Image
                  src="https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=600&auto=format&fit=crop"
                  alt="Private House"
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className={styles.portfolioCardImage}
                />
                <span className={styles.portfolioCardTextBadge}>Private House</span>
              </div>
            </div>

            <div className={styles.portfolioCta}>
              <button className={styles.portfolioBtn}>See More Projects</button>
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
            <div className={styles.portraitColumn}>
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
            <div className={styles.copyColumn}>
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
            <span className={styles.blogLabel}>Blog</span>
            <h2 className={styles.blogHeadline}>
              Visual insights to sell homes <span className={styles.italicSerif}>faster</span>
            </h2>
          </div>

          {/* Featured Post Card (Split layout: Image Left, Content Right) */}
          <div className={`${styles.featuredCard} animate-fade-in-up`} style={{ animationDelay: '0.2s' }}>
            <div className={styles.featuredImageArea}>
              <Image
                src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=1000&auto=format&fit=crop"
                alt="How video tours boost property sales"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className={styles.blogCardImage}
                priority
              />
            </div>
            <div className={styles.featuredTextArea}>
              <div className={styles.badgeRow}>
                <span className={styles.blogPillBadge}>Marketing</span>
              </div>
              <h3 className={styles.featuredTitle}>How video tours boost property sales</h3>
              <p className={styles.featuredExcerpt}>
                Short-form video and cinematic tours aren&apos;t just content — they&apos;re conversion tools. Here&apos;s how real estate teams can turn views into inquiries.
              </p>
              
              <div className={styles.featuredFooter}>
                <div className={styles.authorGroup}>
                  <div className={styles.authorAvatarWrapper}>
                    <Image
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop"
                      alt="Sophia Martinez"
                      width={32}
                      height={32}
                      className={styles.authorAvatar}
                    />
                  </div>
                  <span className={styles.authorName}>Sophia Martinez</span>
                </div>
                <span className={styles.postDate}>September 8, 2025</span>
              </div>
            </div>
          </div>

          {/* Bottom Grid: 3 columns */}
          <div className={styles.blogGrid}>
            {[
              {
                id: "grid-1",
                category: "Strategy",
                title: "Why listings with video sell 30% faster",
                image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=600&auto=format&fit=crop"
              },
              {
                id: "grid-2",
                category: "Luxury",
                title: "The power of drone videos in marketing",
                image: "https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=600&auto=format&fit=crop"
              },
              {
                id: "grid-3",
                category: "Social Media",
                title: "Why Instagram Reels drive property inquiries",
                image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=600&auto=format&fit=crop"
              }
            ].map((article, idx) => (
              <div
                key={article.id}
                className={`${styles.blogCard} animate-fade-in-up`}
                style={{ animationDelay: `${0.3 + idx * 0.1}s` }}
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
            <button className={styles.loadMoreBtn}>
              Load More
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
              Ready to Build Your Space as One{" "}
              <span className={styles.ctaBadgeWrapper}>
                <Image
                  src="https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=150&auto=format&fit=crop"
                  alt="Vision badge"
                  width={64}
                  height={32}
                  className={styles.ctaInlineBadge}
                />
              </span>{" "}
              Vision?
            </h2>
            
            <p className={styles.ctaSubtext}>
              Explore how our design studio helps you plan, visualize, and build modern spaces across any scale.
            </p>
            
            <div className={styles.ctaButtonWrapper}>
              <button className={styles.ctaButton}>
                <span className={styles.ctaButtonText}>Get in Touch</span>
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
              <span className={styles.footerCopyrightText}>All Rights Reserved</span>
            </div>
            
            <nav className={styles.footerNav}>
              <ul className={styles.footerNavList}>
                <li><a href="#hero" className={styles.footerNavLink}>Home</a></li>
                <li><a href="#about" className={styles.footerNavLink}>About</a></li>
                <li><a href="#services" className={styles.footerNavLink}>Service</a></li>
                <li><a href="#gallery" className={styles.footerNavLink}>Portfolio</a></li>
                <li><a href="#blog" className={styles.footerNavLink}>Blog</a></li>
                <li><a href="#contact" className={styles.footerNavLink}>Contact</a></li>
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

