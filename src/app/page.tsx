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

// Progressive count-up timer component triggered on viewport entrance
function CountUp({ end, duration = 1200, suffix = "" }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isInView) return;
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(progress * end);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [isInView, end, duration]);

  const displayCount = Number.isInteger(end) ? Math.floor(count) : count.toFixed(1);

  return <span ref={ref}>{displayCount}{suffix}</span>;
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

interface BentoGalleryItem {
  id: string;
  type: 'featured' | 'audio' | 'widget-countdown' | 'widget-stats' | 'typography' | 'standard';
  category: 'worship' | 'community' | 'creative' | 'events';
  title: string;
  subtitle: string;
  image?: string;
  badge?: string;
  content: string;
  targetDate?: string;
  statValue?: number;
  statSuffix?: string;
  audioUrl?: string;
  gradient?: string;
}

const bentoGalleryItems: BentoGalleryItem[] = [
  {
    id: "worship-live",
    type: "featured",
    category: "worship",
    title: "Sunday Live Worship",
    subtitle: "Experience the presence & passion",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1000&auto=format&fit=crop",
    badge: "LATEST SERVICE",
    content: "A capture of our Sunday morning worship experience. Join us every Sunday at 9 AM and 11 AM as we lift up the name of Jesus together in spirit and in truth."
  },
  {
    id: "audio-track",
    type: "audio",
    category: "creative",
    title: "Light City Worship — 'Shine'",
    subtitle: "Listen to our new live single",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop",
    badge: "NEW RELEASE",
    content: "Stream our latest worship single 'Shine' recorded live during Creative Night. Now available on all streaming platforms.",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  },
  {
    id: "event-countdown",
    type: "widget-countdown",
    category: "events",
    title: "Creative Night",
    subtitle: "June 28 • 7:00 PM",
    targetDate: "2026-06-28T19:00:00",
    content: "A gathering for all musicians, designers, writers, and technical artists. Come collaborate, worship, and dream together."
  },
  {
    id: "community-groups",
    type: "standard",
    category: "community",
    title: "Life Groups",
    subtitle: "Grow in community",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=600&auto=format&fit=crop",
    badge: "CONNECT",
    content: "Discipleship is lived out in circles, not just rows. Join one of our 50+ Life Groups meeting weekly in homes across the city to share life, study, and grow."
  },
  {
    id: "creative-typography",
    type: "typography",
    category: "creative",
    title: "CREATE. INVOLVE. INSPIRE.",
    subtitle: "Creative Ethos",
    content: "We believe that beauty and excellence honor God and inspire people. Through art, design, media, and technology, we shape the culture.",
    gradient: "linear-gradient(135deg, #FF007A 0%, #7928CA 50%, #FF007A 100%)"
  },
  {
    id: "ministry-stats",
    type: "widget-stats",
    category: "community",
    title: "Impact Hours",
    statValue: 15400,
    statSuffix: "+",
    subtitle: "Hours spent serving our city",
    content: "Through local food banks, school tutoring, and community cleanup projects, our serving teams are showing the love of Christ in practical ways."
  },
  {
    id: "youth-exhibit",
    type: "standard",
    category: "community",
    title: "Light City Youth",
    subtitle: "Friday Nights at 7 PM",
    image: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=600&auto=format&fit=crop",
    badge: "YOUTH",
    content: "Every Friday night, high school students gather for powerful messages, high-energy games, worship, and small groups."
  },
  {
    id: "outreach-project",
    type: "standard",
    category: "events",
    title: "Love Your City Day",
    subtitle: "Next Outreach: July 12",
    image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=600&auto=format&fit=crop",
    badge: "OUTREACH",
    content: "A city-wide volunteer day where we partner with local charities to paint schools, feed the homeless, and bless families in need."
  },
  {
    id: "sermon-series",
    type: "standard",
    category: "worship",
    title: "Current Series: 'Grace & Truth'",
    subtitle: "Watch current & past sermons online",
    image: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?q=80&w=600&auto=format&fit=crop",
    badge: "SERMON SERIES",
    content: "Walk through our current journey into the Gospel of John, exploring the deep intersection of grace and truth in everyday life."
  }
];

interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

function BentoCard({ children, className = "", ...props }: BentoCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ref.current.style.setProperty("--mouse-x", `${x}px`);
    ref.current.style.setProperty("--mouse-y", `${y}px`);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={`${styles.bentoCard} ${className}`}
      {...props}
    >
      <div className={styles.glowOverlay} />
      {children}
    </div>
  );
}

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

interface ServiceItem {
  id: string;
  title: string;
  schedule: string;
  description: string;
  gradient: string;
  pathway: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactNode;
}

const servicesData: ServiceItem[] = [
  {
    id: "service-gatherings",
    title: "Sunday Gatherings",
    schedule: "Sundays at 9:00 AM & 11:00 AM",
    description: "Experience powerful in-person worship, inspiring teaching, and a warm, supportive community. Join us as we gather together to lift up the name of Jesus.",
    gradient: "linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)",
    pathway: "In-Person Campus",
    icon: (props) => (
      <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    )
  },
  {
    id: "service-online",
    title: "Online Campus",
    schedule: "Sundays at 11:00 AM Live",
    description: "Connect with our church family from anywhere in the world. Join our live stream, participate in real-time chat, request digital prayer, and find connection online.",
    gradient: "linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)",
    pathway: "Online Campus",
    icon: (props) => (
      <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
        <polyline points="17 2 12 7 7 2" />
      </svg>
    )
  },
  {
    id: "service-bible",
    title: "Bible Studies",
    schedule: "Wednesdays at 7:00 PM",
    description: "Deepen your understanding of Scripture through our mid-week Bible studies and Life Groups. Engaging discussions, scripture deep-dives, and shared life.",
    gradient: "linear-gradient(135deg, #B12A5B 0%, #FF758C 100%)",
    pathway: "Discipleship Pathway",
    icon: (props) => (
      <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    )
  },
  {
    id: "service-nextgen",
    title: "NextGen Ministries",
    schedule: "Sundays & Mid-Week Gatherings",
    description: "Tailored environments for kids and youth to explore their faith, make life-long friends, and discover their God-given potential in a safe, fun space.",
    gradient: "linear-gradient(135deg, #11998E 0%, #38EF7D 100%)",
    pathway: "Youth & Kids Pathway",
    icon: (props) => (
      <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    )
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

  // Bento states
  const [galleryFilter, setGalleryFilter] = useState<'all' | 'worship' | 'community' | 'creative' | 'events'>('all');
  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Countdown timer hook (target 10 days out from current local time)
  useEffect(() => {
    const target = new Date("2026-06-28T19:00:00").getTime();
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = target - now;
      if (difference <= 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        const d = Math.floor(difference / (1000 * 60 * 60 * 24));
        const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ days: d, hours: h, minutes: m, seconds: s });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleAudio = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
      audioRef.current.loop = true;
      audioRef.current.addEventListener('ended', () => setAudioPlaying(false));
    }
    
    if (audioPlaying) {
      audioRef.current.pause();
      setAudioPlaying(false);
    } else {
      audioRef.current.play().catch(err => console.log("Audio play blocked", err));
      setAudioPlaying(true);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const filteredItems = bentoGalleryItems.filter(item => 
    galleryFilter === 'all' || item.category === galleryFilter
  );

  const openModal = (id: string) => {
    const idx = filteredItems.findIndex(item => item.id === id);
    if (idx !== -1) {
      setModalIndex(idx);
    }
  };

  const closeModal = () => {
    setModalIndex(null);
  };

  const prevModalItem = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (modalIndex !== null) {
      setModalIndex(prev => (prev === 0 ? filteredItems.length - 1 : prev! - 1));
    }
  };

  const nextModalItem = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (modalIndex !== null) {
      setModalIndex(prev => (prev === filteredItems.length - 1 ? 0 : prev! + 1));
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (modalIndex === null) return;
      if (e.key === "Escape") closeModal();
      if (e.key === "ArrowLeft") setModalIndex(prev => (prev === 0 ? filteredItems.length - 1 : prev! - 1));
      if (e.key === "ArrowRight") setModalIndex(prev => (prev === filteredItems.length - 1 ? 0 : prev! + 1));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalIndex, filteredItems]);

  
  // Waveform bars configuration
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

      {/* Gallery Section */}
      <ViewportSection as="section" className={styles.gallerySection} id="gallery">
        <div className={styles.galleryHeader}>
          <h2 className={styles.galleryTitle}>EXHIBITS</h2>
          <nav className={styles.submenuNav}>
            <ul className={styles.submenuUl}>
              <li>
                <button
                  className={galleryFilter === 'all' ? styles.activeSubmenuLink : styles.submenuLink}
                  onClick={() => setGalleryFilter('all')}
                >
                  All
                </button>
              </li>
              <li>
                <button
                  className={galleryFilter === 'worship' ? styles.activeSubmenuLink : styles.submenuLink}
                  onClick={() => setGalleryFilter('worship')}
                >
                  Worship
                </button>
              </li>
              <li>
                <button
                  className={galleryFilter === 'community' ? styles.activeSubmenuLink : styles.submenuLink}
                  onClick={() => setGalleryFilter('community')}
                >
                  Community
                </button>
              </li>
              <li>
                <button
                  className={galleryFilter === 'creative' ? styles.activeSubmenuLink : styles.submenuLink}
                  onClick={() => setGalleryFilter('creative')}
                >
                  Creative
                </button>
              </li>
              <li>
                <button
                  className={galleryFilter === 'events' ? styles.activeSubmenuLink : styles.submenuLink}
                  onClick={() => setGalleryFilter('events')}
                >
                  Events
                </button>
              </li>
            </ul>
          </nav>
        </div>

        {/* Bento Grid Wrapper */}
        <div className={`${styles.bentoGridWrapper} animate-fade-in-up`} style={{ animationDelay: '0.4s' }}>
          <div className={styles.bentoGrid}>
            {filteredItems.map((item) => {
              const cardClass = `${styles.bentoGridCell} ${
                item.type === 'featured' ? styles.cardFeatured :
                item.type === 'audio' ? styles.cardWide :
                item.type === 'typography' ? styles.cardWide :
                item.type === 'widget-countdown' ? styles.cardStandard :
                item.type === 'widget-stats' ? styles.cardStandard :
                item.type === 'standard' && item.id === 'community-groups' ? styles.cardTall :
                styles.cardStandard
              }`;

              if (item.type === 'typography') {
                return (
                  <BentoCard key={item.id} className={`${cardClass} ${styles.typographyCell}`}>
                    <div className={styles.typographyContent}>
                      <span className={styles.cardTag}>{item.subtitle}</span>
                      <h3 className={styles.typographyTitle}>{item.title}</h3>
                      <p className={styles.typographyText}>{item.content}</p>
                    </div>
                  </BentoCard>
                );
              }

              if (item.type === 'widget-countdown') {
                return (
                  <BentoCard key={item.id} className={`${cardClass} ${styles.countdownCell}`} onClick={() => openModal(item.id)}>
                    <div className={styles.widgetHeader}>
                      <span className={styles.widgetTag}>{item.category}</span>
                      <span className={styles.pulseDot} />
                    </div>
                    <div className={styles.countdownTitle}>{item.title}</div>
                    <div className={styles.countdownTimer}>
                      <div className={styles.timeBlock}>
                        <span className={styles.timeNumber}>{timeLeft.days}</span>
                        <span className={styles.timeLabel}>d</span>
                      </div>
                      <div className={styles.timeBlock}>
                        <span className={styles.timeNumber}>{timeLeft.hours}</span>
                        <span className={styles.timeLabel}>h</span>
                      </div>
                      <div className={styles.timeBlock}>
                        <span className={styles.timeNumber}>{timeLeft.minutes}</span>
                        <span className={styles.timeLabel}>m</span>
                      </div>
                      <div className={styles.timeBlock}>
                        <span className={styles.timeNumber}>{timeLeft.seconds}</span>
                        <span className={styles.timeLabel}>s</span>
                      </div>
                    </div>
                    <p className={styles.countdownSubtitle}>{item.subtitle}</p>
                  </BentoCard>
                );
              }

              if (item.type === 'widget-stats') {
                return (
                  <BentoCard key={item.id} className={`${cardClass} ${styles.statsCell}`} onClick={() => openModal(item.id)}>
                    <div className={styles.widgetHeader}>
                      <span className={styles.widgetTag}>{item.category}</span>
                    </div>
                    <div className={styles.statsValueContainer}>
                      <span className={styles.statsValue}>
                        <CountUp end={item.statValue || 0} />
                        {item.statSuffix}
                      </span>
                    </div>
                    <div className={styles.statsTitle}>{item.title}</div>
                    <p className={styles.statsSubtitle}>{item.subtitle}</p>
                  </BentoCard>
                );
              }

              if (item.type === 'audio') {
                return (
                  <BentoCard key={item.id} className={`${cardClass} ${styles.audioCell}`} onClick={() => openModal(item.id)}>
                    {item.image && (
                      <div className={styles.audioImageWrapper}>
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          sizes="(max-width: 1024px) 100vw, 600px"
                          className={styles.bentoPhoto}
                        />
                        <div className={styles.audioDarken} />
                      </div>
                    )}
                    <div className={styles.audioCardContent}>
                      <div className={styles.audioHeader}>
                        <span className={styles.audioTag}>{item.badge}</span>
                        <div className={`${styles.waveVisualizer} ${audioPlaying ? styles.wavePlaying : ""}`}>
                          <span className={styles.waveBar} />
                          <span className={styles.waveBar} />
                          <span className={styles.waveBar} />
                          <span className={styles.waveBar} />
                          <span className={styles.waveBar} />
                        </div>
                      </div>
                      
                      <div className={styles.audioBody}>
                        <h3 className={styles.audioTitleText}>{item.title}</h3>
                        <p className={styles.audioSubtitleText}>{item.subtitle}</p>
                      </div>

                      <div className={styles.audioFooter}>
                        <button
                          className={`${styles.playPauseBtn} ${audioPlaying ? styles.playing : ""}`}
                          onClick={(e) => toggleAudio(e, item.audioUrl || "")}
                          aria-label={audioPlaying ? "Pause preview" : "Play preview"}
                        >
                          {audioPlaying ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <rect x="4" y="4" width="4" height="16" stroke="none" />
                              <rect x="16" y="4" width="4" height="16" stroke="none" />
                            </svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <polygon points="5,3 19,12 5,21" stroke="none" />
                            </svg>
                          )}
                          <span>{audioPlaying ? "PAUSE PREVIEW" : "PLAY PREVIEW"}</span>
                        </button>
                      </div>
                    </div>
                  </BentoCard>
                );
              }

              // Image Cells
              return (
                <BentoCard
                  key={item.id}
                  className={`${cardClass} ${styles.mediaCell}`}
                  onClick={() => openModal(item.id)}
                >
                  {item.image && (
                    <div className={styles.mediaImageWrapper}>
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes={item.type === 'featured' ? "(max-width: 1024px) 100vw, 800px" : "(max-width: 1024px) 50vw, 400px"}
                        className={styles.bentoPhoto}
                      />
                      <div className={styles.mediaOverlay}>
                        <div className={styles.overlayHeader}>
                          <span className={styles.mediaBadge}>{item.badge}</span>
                        </div>
                        <div className={styles.overlayFooter}>
                          <h3 className={styles.mediaTitle}>{item.title}</h3>
                          <p className={styles.mediaSubtitle}>{item.subtitle}</p>
                        </div>
                      </div>
                      <div className={styles.revealArrow}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                          <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                      </div>
                    </div>
                  )}
                </BentoCard>
              );
            })}
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

      {/* Services Section */}
      <ViewportSection as="section" className={styles.servicesSection} id="services">
        <div className={styles.servicesContainer}>
          <div className={styles.servicesHeader}>
            <span className={styles.servicesTag}>
              <SplitText text="/Ministries" delayOffset={0.0} />
            </span>
            <h2 className={styles.servicesTitle}>
              <SplitText text="Where You Belong" delayOffset={0.1} />
              <br />
              <span className={styles.gradientText}>
                <SplitText text="Services & Gatherings" delayOffset={0.6} />
              </span>
            </h2>
          </div>

          <div className={styles.servicesGrid}>
            {servicesData.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.id} className={styles.serviceCard}>
                  <div 
                    className={styles.serviceGlow} 
                    style={{ '--accent-gradient': item.gradient } as React.CSSProperties}
                  />
                  <div className={styles.serviceCardContent}>
                    <div className={styles.serviceIcon}>
                      <Icon className={styles.serviceIconSvg} />
                    </div>
                    <span className={styles.servicePathway}>/{item.pathway}</span>
                    <h3 className={styles.serviceCardTitle}>{item.title}</h3>
                    <span className={styles.serviceCardSchedule}>{item.schedule}</span>
                    <p className={styles.serviceCardDescription}>{item.description}</p>
                    <div className={styles.serviceAction}>
                      <span className={styles.actionText}>Learn More</span>
                      <svg className={styles.actionArrow} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </ViewportSection>

      {/* Lightbox Modal */}
      {modalIndex !== null && filteredItems[modalIndex] && (
        <div className={styles.lightboxModal} onClick={closeModal} role="dialog" aria-modal="true">
          <div className={styles.lightboxOverlay} />
          
          <button className={styles.lightboxClose} onClick={closeModal} aria-label="Close modal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <button className={styles.lightboxPrev} onClick={prevModalItem} aria-label="Previous item">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>

          <button className={styles.lightboxNext} onClick={nextModalItem} aria-label="Next item">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>

          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.lightboxGrid}>
              <div className={styles.lightboxVisual}>
                {filteredItems[modalIndex].image ? (
                  <div className={styles.lightboxImageWrapper}>
                    <Image
                      src={filteredItems[modalIndex].image || ""}
                      alt={filteredItems[modalIndex].title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 800px"
                      className={styles.lightboxImage}
                      priority
                    />
                  </div>
                ) : (
                  <div className={`${styles.lightboxPlaceholder} ${filteredItems[modalIndex].type === 'typography' ? styles.lightboxTypoBg : ''}`}>
                    <span className={styles.placeholderLogo}>✦</span>
                  </div>
                )}
              </div>

              <div className={styles.lightboxMeta}>
                <span className={styles.lightboxCategory}>/{filteredItems[modalIndex].category}</span>
                <h2 className={styles.lightboxTitle}>{filteredItems[modalIndex].title}</h2>
                <h3 className={styles.lightboxSubtitle}>{filteredItems[modalIndex].subtitle}</h3>
                
                <div className={styles.lightboxDivider} />
                
                <p className={styles.lightboxDescription}>{filteredItems[modalIndex].content}</p>
                
                {filteredItems[modalIndex].type === 'audio' && (
                  <div className={styles.lightboxAudioAction}>
                    <button
                      className={`${styles.lightboxPlayBtn} ${audioPlaying ? styles.playing : ""}`}
                      onClick={(e) => toggleAudio(e, filteredItems[modalIndex].audioUrl || "")}
                    >
                      {audioPlaying ? "PAUSE PREVIEW" : "PLAY PREVIEW"}
                    </button>
                  </div>
                )}

                {filteredItems[modalIndex].type === 'widget-countdown' && (
                  <div className={styles.lightboxCountdown}>
                    <span className={styles.countdownAlert}>✦ NEXT GATHERING IN:</span>
                    <div className={styles.lightboxTimerDisplay}>
                      {timeLeft.days}d : {timeLeft.hours}h : {timeLeft.minutes}m : {timeLeft.seconds}s
                    </div>
                  </div>
                )}

                <div className={styles.lightboxFooter}>
                  <span>Item {modalIndex + 1} of {filteredItems.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

