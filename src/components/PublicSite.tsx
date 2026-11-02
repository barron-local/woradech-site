import React, { useState, useEffect, useMemo } from 'react';
import type { SiteConfig } from '../types';
import { Carousel } from './Carousel';
import {
  Menu,
  X,
  FileText,
  User,
  Phone,
  Mail,
  MapPin,
  Target,
  Users,
  FileQuestion,
  Home,
  ArrowUpRight,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  BookOpen,
  ExternalLink,
  FolderOpen,
  Download,
  GraduationCap,
  Copy,
  Check
} from 'lucide-react';
import { PdfCardThumbnail } from './PdfCardThumbnail';
import { PdfDocViewer } from './PdfDocViewer';
import Folder from './Folder';
import { NavbarSearch } from './NavbarSearch';
import Lanyard from './Lanyard';
import { isCanvaUrl, toCanvaEmbedUrl } from '../utils/embedHelper';
import { motion } from 'motion/react';


export type PageRoute = 'home' | 'about' | 'portfolio' | '404';

interface PublicSiteProps {
  config: SiteConfig;
  currentPage: PageRoute;
  onNavigate: (page: PageRoute) => void;
  onOpenEditor?: () => void;
  isInitialLoading?: boolean;
}

export const PublicSite: React.FC<PublicSiteProps> = ({
  config,
  currentPage,
  onNavigate,
  isInitialLoading = false
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [viewingPdf, setViewingPdf] = useState<{ url: string; title: string; docId?: string } | null>(null);
  const [isPdfFullscreen, setIsPdfFullscreen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Portfolio Layout Grid Columns: 4 columns base layout to allow 1, 2, 3, 4 span per card
  const portfolioColumns = (config.portfolio?.gridColumns && config.portfolio.gridColumns > 1)
    ? config.portfolio.gridColumns
    : 4;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleCopyDocLink = (_url: string, title: string, docId?: string) => {
    // Generate clean web portfolio deep link that opens this exact project modal
    const baseUrl = window.location.origin + window.location.pathname;
    const shareParam = docId ? ('doc=' + encodeURIComponent(docId)) : ('file=' + encodeURIComponent(title));
    const shareLink = `${baseUrl}#portfolio?${shareParam}`;

    navigator.clipboard.writeText(shareLink).then(() => {
      showToast('คัดลอกลิงก์เปิดหน้านี้เรียบร้อยแล้ว!');
    }).catch(() => {
      // Fallback
      prompt('คัดลอกลิงก์:', shareLink);
    });
  };

  // Auto-open document modal if shared via deep link (e.g. #portfolio?doc=xxx or ?doc=xxx)
  useEffect(() => {
    const handleCheckDeepLink = () => {
      const hash = window.location.hash;
      const search = window.location.search;
      let docTarget = '';

      if (hash.includes('doc=')) {
        const parts = hash.split('doc=');
        if (parts[1]) docTarget = decodeURIComponent(parts[1].split('&')[0]);
      } else if (hash.includes('file=')) {
        const parts = hash.split('file=');
        if (parts[1]) docTarget = decodeURIComponent(parts[1].split('&')[0]);
      } else if (search.includes('doc=')) {
        const params = new URLSearchParams(search);
        docTarget = params.get('doc') || '';
      }

      if (docTarget && config.portfolio?.items?.length) {
        // Find matching item by ID or Title or fileName
        for (const item of config.portfolio.items) {
          if (item.id === docTarget || item.title === docTarget || item.fileName === docTarget) {
            const viewUrl = item.pdfUrl || item.link || item.imageUrl;
            if (viewUrl) {
              setViewingPdf({ url: viewUrl, title: item.title, docId: item.id });
              return;
            }
          }
          if (item.subItems) {
            for (const sub of item.subItems) {
              if (sub.title === docTarget || (sub.url && sub.url.includes(docTarget))) {
                setViewingPdf({ url: sub.url, title: sub.title || item.title, docId: item.id });
                return;
              }
            }
          }
        }
      }
    };

    handleCheckDeepLink();
    window.addEventListener('hashchange', handleCheckDeepLink);
    return () => window.removeEventListener('hashchange', handleCheckDeepLink);
  }, [config.portfolio?.items]);

  const [activeFolderProject, setActiveFolderProject] = useState<import('../types').PortfolioItem | null>(null);
  const [isFolderOpen, setIsFolderOpen] = useState(false);

  // Responsive window dimensions tracking
  const [windowDimensions, setWindowDimensions] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  }));

  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Compute optimal 3D Folder scale based on screen size (100% responsive on all devices)
  const folderSize = useMemo(() => {
    const { width, height } = windowDimensions;
    let s = 1.35;
    if (width < 360) s = 0.72;
    else if (width < 420) s = 0.82;
    else if (width < 600) s = 0.95;
    else if (width < 768) s = 1.12;
    else if (width < 1024) s = 1.25;
    else s = 1.35;

    // Landscape orientation on mobile devices (e.g. height < 520px)
    if (height < 520) {
      s = Math.min(s, 0.82);
    }
    return s;
  }, [windowDimensions]);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('site-theme');
      if (saved === 'dark' || saved === 'light') return saved;
      // ค่าเริ่มต้นเข้าเว็บครั้งแรกให้เป็น light เสมอ
      return 'light';
    }
    return 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('site-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Lock body scroll when modal is open so the background page does not scroll
  useEffect(() => {
    if (viewingPdf || activeFolderProject) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (viewingPdf) {
            setViewingPdf(null);
            setIsPdfFullscreen(false);
          } else if (activeFolderProject) {
            setActiveFolderProject(null);
          }
        }
      };
      window.addEventListener('keydown', handleEsc);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [viewingPdf, activeFolderProject]);

  const handleNavClick = (page: PageRoute) => {
    onNavigate(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownloadFile = async (url: string, filename: string) => {
    try {
      if (url.startsWith('data:') || url.startsWith('blob:')) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'download';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }

      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      let safeFilename = filename || 'download';
      if (!safeFilename.includes('.')) {
        if (blob.type.includes('pdf')) safeFilename += '.pdf';
        else if (blob.type.includes('png')) safeFilename += '.png';
        else if (blob.type.includes('jpeg') || blob.type.includes('jpg')) safeFilename += '.jpg';
      }
      a.download = safeFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.download = filename || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--notion-bg)', color: 'var(--notion-text)', display: 'flex', flexDirection: 'column' }}>

      {/* 1. NAVIGATION BAR (Floating Dynamic Island Deluxe) */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, width: '100%', pointerEvents: 'none' }}>
        <header
          className="navbar-header"
          style={{
            pointerEvents: 'auto',
            
          }}
        >
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>

            {/* Logo and Name with Emerald Live Pulse */}
            <div
              onClick={() => handleNavClick('home')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                userSelect: 'none',
                flexShrink: 0
              }}
            >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              padding: '2px',
              backgroundColor: 'var(--notion-bg)',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
              border: '1px solid var(--notion-border)',
              transition: 'transform 0.2s ease'
            }}>
              <img
                src="/logo-tnk-circle.png"
                alt="Logo"
                style={{
                  height: '28px',
                  width: '28px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
            </div>

            <span style={{
              fontSize: '0.92rem',
              fontWeight: 600,
              color: 'var(--notion-text)',
              letterSpacing: '-0.015em'
            }}>
              014 Woradech Panphuech
            </span>
          </div>

          {/* Right Group: Search Bar + Nav Links + Mobile Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <NavbarSearch
              config={config}
              currentPage={currentPage}
              onNavigate={(page) => {
                onNavigate(page);
                setMobileMenuOpen(false);
              }}
            />

            {/* Desktop Nav Items: Smooth Sliding Pill Indicator */}
            <nav
              className="desktop-nav"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                padding: '3px',
                borderRadius: '10px',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                position: 'relative'
              }}
            >
              {[
                { key: 'home', label: config.navLinks.home },
                { key: 'about', label: config.navLinks.about },
                { key: 'portfolio', label: config.navLinks.portfolio }
              ].map((tab) => {
                const isActive = currentPage === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => handleNavClick(tab.key as PageRoute)}
                    style={{
                      position: 'relative',
                      fontSize: '0.84rem',
                      padding: '6px 15px',
                      borderRadius: '7px',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? 'var(--notion-text)' : 'var(--notion-text-muted)',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      outline: 'none',
                      userSelect: 'none',
                      transition: 'color 0.15s ease'
                    }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-nav-pill"
                        transition={{
                          type: 'spring',
                          stiffness: 420,
                          damping: 32,
                          mass: 0.8
                        }}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: '7px',
                          backgroundColor: 'var(--notion-bg)',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 1px rgba(0, 0, 0, 0.06)',
                          zIndex: 0
                        }}
                      />
                    )}
                    <span style={{ position: 'relative', zIndex: 1 }}>
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* Dark Mode Toggle Button */}
            <button
              onClick={toggleTheme}
              className="notion-btn notion-btn-subtle theme-toggle-btn"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.035)',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                color: 'var(--notion-text)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
              title={theme === 'dark' ? 'เปลี่ยนเป็นโหมดสว่าง (Light Mode)' : 'เปลี่ยนเป็นโหมดมืด (Dark Mode)'}
              aria-label="Toggle Dark Mode"
            >
              {theme === 'dark' ? (
                <Sun size={17} style={{ color: '#f59e0b' }} />
              ) : (
                <Moon size={17} style={{ color: 'var(--notion-text)' }} />
              )}
            </button>

            {/* Mobile Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mobile-toggle"
              style={{
                background: 'rgba(0, 0, 0, 0.035)',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                borderRadius: '8px',
                cursor: 'pointer',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--notion-text)',
                transition: 'all 0.15s ease'
              }}
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer (Inside sticky header container with slide & blur) */}
        {mobileMenuOpen && (
          <div
            className="mobile-drawer"
            style={{
              position: 'absolute',
              top: '56px',
              left: 0,
              right: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.96)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderBottom: '1px solid var(--notion-border)',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.15)',
              padding: '12px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              zIndex: 100,
              animation: 'fadeIn 0.15s ease'
            }}
          >
            <button
              onClick={() => handleNavClick('home')}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: currentPage === 'home' ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
                fontWeight: currentPage === 'home' ? 600 : 500,
                color: currentPage === 'home' ? 'var(--notion-text)' : 'var(--notion-text-muted)',
                fontSize: '0.9rem',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              {config.navLinks.home}
            </button>
            <button
              onClick={() => handleNavClick('about')}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: currentPage === 'about' ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
                fontWeight: currentPage === 'about' ? 600 : 500,
                color: currentPage === 'about' ? 'var(--notion-text)' : 'var(--notion-text-muted)',
                fontSize: '0.9rem',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              {config.navLinks.about}
            </button>
            <button
              onClick={() => handleNavClick('portfolio')}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: currentPage === 'portfolio' ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
                fontWeight: currentPage === 'portfolio' ? 600 : 500,
                color: currentPage === 'portfolio' ? 'var(--notion-text)' : 'var(--notion-text-muted)',
                fontSize: '0.9rem',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              {config.navLinks.portfolio}
            </button>
          </div>
        )}
      </header>
      </div>

      {/* ================= PAGE ROUTING ================= */}
      <main style={{ flex: 1 }}>

        {/* ----------------- PAGE 1: HOME ----------------- */}
        {/* Strict Order: Nav -> Hero Section (Image only) -> Carousel -> Footer */}
        {currentPage === 'home' && (
          <div>
            {/* 2. HERO SECTION: Full-width Edge-to-Edge and Full Screen */}
            <section
              id="home-hero"
              className="hero-section search-scroll-target"
              style={{
                width: '100%',
                height: 'calc(100vh - 52px)',
                maxHeight: '780px',
                minHeight: '460px',
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: '#0f0f11',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {/* Blurred atmospheric backdrop to blend edges */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `url(${config.heroImage.imageUrl || "/banner.png"})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'blur(30px) brightness(0.35)',
                  transform: 'scale(1.1)',
                  pointerEvents: 'none'
                }}
              />

              {/* Main banner spanning the container */}
              <img
                src={config.heroImage.imageUrl || "/banner.png"}
                alt={config.heroImage.altText || "Hero Section Banner"}
                style={{
                  position: 'relative',
                  zIndex: 1,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center 44%',
                  display: 'block'
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/banner.png";
                }}
              />
            </section>

            {/* 3. CAROUSEL SECTION: ต่อจาก Hero */}
            <Carousel
              slides={config.carousel.slides}
              autoplay={config.carousel.autoplay}
              interval={config.carousel.interval}
              title={config.carousel.title}
              subtitle={config.carousel.subtitle}
            />
          </div>
        )}

        {/* ----------------- PAGE 2: ABOUT (แยกหน้า - คง State ไว้เพื่อให้เปิดได้ทันทีโดยไม่โหลดซ้ำ 0ms) ----------------- */}
        <div style={{ display: currentPage === 'about' ? 'block' : 'none' }}>
          <section className="responsive-page-container" style={{ maxWidth: '960px', margin: '0 auto' }}>
            <div style={{ marginBottom: '36px' }}>
              <h1 style={{ fontSize: '2.4rem', fontWeight: 700, color: 'var(--notion-text)', margin: 0 }}>
                {config.about.title}
              </h1>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '280px 1fr',
              gap: '36px',
              alignItems: 'start'
            }} className="about-grid">

              {/* Profile Card (3D Lanyard Card & Backup of Original) */}
              {/* BACKUP: หากต้องการย้อนกลับมาใช้รูปภาพแบบเดิม สามารถนำโค้ดด้านล่างนี้กลับมาใช้แทนได้:
              <div id="about-profile" className="notion-card search-scroll-target" style={{ padding: '24px', textAlign: 'center', position: 'sticky', top: '70px' }}>
                <div style={{ width: '100%', height: '280px', borderRadius: 'var(--radius-xs)', overflow: 'hidden', marginBottom: '16px', border: '1px solid var(--notion-border)' }}>
                  <img
                    src={config.about.avatarUrl || "/me.jpeg"}
                    alt="Woradech"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/me.jpeg";
                    }}
                  />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0', color: 'var(--notion-text)' }}>
                  นาย วรเดช พันธ์พืช
                </h3>
              </div>
              */}

              <div id="about-profile" className="notion-card search-scroll-target" style={{ padding: '12px', textAlign: 'center', position: 'sticky', top: '70px' }}>
                <div style={{ width: '100%', height: '360px', borderRadius: 'var(--radius-xs)', overflow: 'hidden', position: 'relative', background: 'radial-gradient(circle at center, rgba(0,0,0,0.03) 0%, transparent 70%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Lanyard
                    frontImage={config.about.avatarUrl || "/me.jpeg"}
                    backImage="/logo-tnk-circle.png"
                    imageFit="cover"
                    backImageFit="contain"
                    backPadding={0.13}
                    cardColor="#ffffff"
                    backCardColor="#ffffff"
                    finish="glossy"
                    metal="silver"
                    size={0.68}
                    strapLength={0.4}
                    strapColor="#1e293b"
                    interactive={true}
                    intro={true}
                  />
                </div>
              </div>

              {/* Main Information Sections */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

                {/* 1. ประวัติส่วนตัว */}
                <div id="about-bio" className="notion-card search-scroll-target" style={{ padding: '28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid var(--notion-border)', paddingBottom: '12px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'var(--notion-sidebar)',
                      border: '1px solid var(--notion-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--notion-text)'
                    }}>
                      <User size={18} />
                    </div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--notion-text)', margin: 0 }}>
                      ประวัติส่วนตัว
                    </h2>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                    <div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--notion-text-muted)', marginBottom: '3px' }}>ชื่อ-สกุล / ชื่อเล่น</div>
                      <div style={{ fontSize: '0.96rem', fontWeight: 600, color: 'var(--notion-text)' }}>นาย วรเดช พันธ์พืช (ทาม)</div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--notion-text-muted)', marginBottom: '3px' }}>วัน/เดือน/ปีเกิด</div>
                      <div style={{ fontSize: '0.96rem', fontWeight: 600, color: 'var(--notion-text)' }}>20 กุมภาพันธ์ 2551 (อายุ 18 ปี)</div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--notion-text-muted)', marginBottom: '3px' }}>กำลังศึกษาอยู่ระดับชั้น</div>
                      <div style={{ fontSize: '0.96rem', fontWeight: 600, color: 'var(--notion-text)', lineHeight: 1.5 }}>
                        <div>ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส. 1)</div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--notion-text)' }}>แผนกวิชาเทคโนโลยีสารสนเทศ</div>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--notion-text-muted)', marginBottom: '3px' }}>รหัสนักศึกษา / กลุ่ม</div>
                      <div style={{ fontSize: '0.96rem', fontWeight: 600, color: 'var(--notion-text)' }}>69319010014 (กลุ่ม 1)</div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--notion-text-muted)', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={13} />
                        <span>เบอร์โทรศัพท์</span>
                      </div>
                      <div style={{ fontSize: '0.96rem', fontWeight: 600, color: 'var(--notion-text)' }}>
                        <a href="tel:0810090625" style={{ color: 'var(--notion-text)', textDecoration: 'none' }}>081-009-0625</a>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--notion-text-muted)', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Mail size={13} />
                        <span>อีเมล (E-mail)</span>
                      </div>
                      <div style={{ fontSize: '0.96rem', fontWeight: 600 }}>
                        <span style={{ color: '#2563eb', userSelect: 'text' }}>69319010014@tnk.ac.th</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--notion-border)', paddingTop: '16px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <MapPin size={16} color="var(--notion-text-muted)" style={{ marginTop: '3px', flexShrink: 0 }} />
                    <div style={{ fontSize: '0.92rem', color: 'var(--notion-text)', lineHeight: 1.6 }}>
                      <strong style={{ color: 'var(--notion-text)' }}>ที่อยู่ปัจจุบัน:</strong> 90/4 ตำบลขุนทะเล อำเภอลานสกา จังหวัดนครศรีธรรมราช 80230
                    </div>
                  </div>

                  <div style={{ marginTop: '16px', backgroundColor: 'var(--notion-sidebar)', padding: '14px 18px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--notion-border)', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <Target size={18} color="var(--notion-text)" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--notion-text)', marginBottom: '2px' }}>เป้าหมายในอนาคต</div>
                      <div style={{ fontSize: '0.92rem', color: 'var(--notion-text)', lineHeight: 1.6 }}>
                        ตั้งใจจะพัฒนาทักษะและประสบการณ์ในการทำงานให้ประสบความสำเร็จ
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. ข้อมูลผู้ปกครอง */}
                <div id="about-parents" className="notion-card search-scroll-target" style={{ padding: '28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid var(--notion-border)', paddingBottom: '12px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'var(--notion-sidebar)',
                      border: '1px solid var(--notion-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--notion-text)'
                    }}>
                      <Users size={18} />
                    </div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--notion-text)', margin: 0 }}>
                      ข้อมูลผู้ปกครอง
                    </h2>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                    {/* บิดา */}
                    <div style={{
                      backgroundColor: 'var(--notion-sidebar)',
                      border: '1px solid var(--notion-border)',
                      borderRadius: 'var(--radius-xs)',
                      padding: '18px 20px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--notion-text)' }}>ข้อมูลบิดา</span>
                        <span className="notion-tag" style={{ fontSize: '0.75rem' }}>อายุ 54 ปี</span>
                      </div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--notion-text)', marginBottom: '8px' }}>
                        นายอภินันท์ พันธ์พืช
                      </div>
                      <div style={{ fontSize: '0.88rem', color: 'var(--notion-text-muted)', marginBottom: '6px' }}>
                        อาชีพ: <strong style={{ color: 'var(--notion-text)' }}>โปรแกรมเมอร์ & หัวหน้าช่างสำรวจ</strong>
                      </div>
                      <div style={{ fontSize: '0.88rem', color: 'var(--notion-text-muted)' }}>
                        เบอร์โทรศัพท์: <span style={{ color: '#2563eb', fontWeight: 600, userSelect: 'text' }}>095-068-8249</span>
                      </div>
                    </div>

                    {/* มารดา */}
                    <div style={{
                      backgroundColor: 'var(--notion-sidebar)',
                      border: '1px solid var(--notion-border)',
                      borderRadius: 'var(--radius-xs)',
                      padding: '18px 20px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--notion-text)' }}>ข้อมูลมารดา</span>
                        <span className="notion-tag" style={{ fontSize: '0.75rem' }}>อายุ 42 ปี</span>
                      </div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--notion-text)', marginBottom: '8px' }}>
                        นาง สุรางคนา พันธ์พืช
                      </div>
                      <div style={{ fontSize: '0.88rem', color: 'var(--notion-text-muted)', marginBottom: '6px' }}>
                        อาชีพ: <strong style={{ color: 'var(--notion-text)' }}>รับจ้างทั่วไป</strong>
                      </div>
                      <div style={{ fontSize: '0.88rem', color: 'var(--notion-text-muted)' }}>
                        เบอร์โทรศัพท์: <a href="tel:0923729142" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>092-372-9142</a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. ข้อมูลครูที่ปรึกษา (Advisor) */}
                <div id="about-advisor" className="notion-card search-scroll-target" style={{ padding: '28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid var(--notion-border)', paddingBottom: '12px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'var(--notion-sidebar)',
                      border: '1px solid var(--notion-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--notion-text)'
                    }}>
                      <GraduationCap size={18} />
                    </div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--notion-text)', margin: 0 }}>
                      ครูที่ปรึกษา
                    </h2>
                  </div>

                  <div style={{
                    backgroundColor: 'var(--notion-sidebar)',
                    border: '1px solid var(--notion-border)',
                    borderRadius: 'var(--radius-xs)',
                    padding: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    flexWrap: 'wrap'
                  }}>
                    {/* รูปถ่ายครูที่ปรึกษา - กรอบวงกลมสัดส่วน 1:1 ชัดเจน */}
                    <div style={{
                      width: '84px',
                      height: '84px',
                      minWidth: '84px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: '2px solid var(--notion-border)',
                      backgroundColor: 'var(--notion-bg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                      aspectRatio: '1 / 1'
                    }}>
                      <img
                        src="/29153_21110216161211.jpg"
                        alt="ครูที่ปรึกษา"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: 'center 20%',
                          display: 'block'
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          if (target.parentElement) {
                            target.parentElement.innerHTML = `<span style="color: var(--notion-text-muted); font-size: 32px; font-weight: 600;">👨‍🏫</span>`;
                          }
                        }}
                      />
                    </div>

                    <div style={{ flex: 1, minWidth: '220px' }}>
                      <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--notion-text)', marginBottom: '4px' }}>
                        นายทนงค์ศักดิ์ คงศรีลังก์
                      </div>
                      <div style={{ fontSize: '0.88rem', color: 'var(--notion-text-muted)' }}>
                        แผนกวิชาเทคโนโลยีสารสนเทศ วิทยาลัยเทคนิคนครศรีธรรมราช
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Section แสดงประวัติการศึกษา (Education Timeline) */}
            {config.about.education && config.about.education.length > 0 && (
              <div id="about-education" className="search-scroll-target" style={{ marginTop: '64px', borderTop: '1px solid var(--notion-border)', paddingTop: '48px' }}>
                {/* Section Header */}
                <div style={{ marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--notion-text)', margin: 0, letterSpacing: '-0.02em' }}>
                    ประวัติการศึกษา (Education)
                  </h2>
                </div>

                <div className="edu-timeline-track" style={{ marginTop: '16px' }}>
                  <div className="edu-timeline-spine" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {config.about.education.map((edu, idx) => (
                      <div key={edu.id || idx} id={`edu-${edu.id || idx}`} style={{ position: 'relative' }}>
                        <div className={`edu-timeline-minimal-dot ${edu.current ? 'is-current' : ''}`} />
                        <div className={`edu-timeline-card edu-card ${edu.current ? 'is-current' : ''}`}>
                          <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}>
                            <h3 style={{ fontSize: '1.28rem', fontWeight: 700, color: 'var(--notion-text)', margin: 0 }}>{edu.degree}</h3>
                          </div>
                          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }} className="edu-body-layout">
                            <div className="edu-logo-box" style={{ width: '64px', height: '64px', minWidth: '64px', borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--notion-border)', backgroundColor: 'var(--notion-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                              <img
                                src={edu.logoUrl}
                                alt={edu.institution}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "/logo-tnk-circle.png";
                                }}
                              />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <h4 style={{ fontSize: '1.18rem', fontWeight: 600, color: 'var(--notion-text)', margin: '0 0 3px 0' }}>{edu.institution}</h4>
                              {edu.institutionEn && <div style={{ fontSize: '0.86rem', color: 'var(--notion-text-muted)', marginBottom: edu.major ? '12px' : '0' }}>{edu.institutionEn}</div>}
                              {edu.major && (
                                <div className="edu-major-pill">
                                  <BookOpen size={13} />
                                  <span>{edu.major === 'สาขา เทคโนโลยีสารสนเทศ' ? 'แผนกวิชาเทคโนโลยีสารสนเทศ' : edu.major}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ----------------- PAGE 3: PORTFOLIO (แยกหน้า) ----------------- */}
        {currentPage === 'portfolio' && (
          <section id="portfolio-root" className="responsive-page-container search-scroll-target" style={{ maxWidth: portfolioColumns === 4 ? '1280px' : '1080px', margin: '0 auto', transition: 'max-width 0.25s ease' }}>
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ fontSize: '2.4rem', fontWeight: 700, color: 'var(--notion-text)', margin: 0 }}>
                {config.portfolio.title}
              </h1>
            </div>

            {/* Portfolio Grid or Empty State or Initial Loading Skeleton */}
            {config.portfolio.items.length === 0 ? (
              isInitialLoading ? (
                <div className={`portfolio-grid cols-${portfolioColumns}`}>
                  {[1, 2].map((k) => (
                    <div
                      key={k}
                      className="notion-card"
                      style={{ height: '360px', backgroundColor: '#ffffff', opacity: 0.6, animation: 'pulse 1.5s infinite ease-in-out' }}
                    >
                      <div style={{ height: '230px', backgroundColor: 'var(--notion-sidebar)' }} />
                      <div style={{ padding: '20px' }}>
                        <div style={{ height: '20px', width: '70%', backgroundColor: 'var(--notion-sidebar)', borderRadius: '4px', marginBottom: '10px' }} />
                        <div style={{ height: '14px', width: '40%', backgroundColor: 'var(--notion-sidebar)', borderRadius: '4px' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>ยังไม่มีรายการผลงาน</p>
                </div>
              )
            ) : (
              <div
                className={`portfolio-grid cols-${portfolioColumns}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${portfolioColumns}, minmax(0, 1fr))`,
                  gap: '22px',
                  width: '100%'
                }}
              >
                {config.portfolio.items.map((item, idx) => {
                  /* Section Banner */
                  if (item.itemType === 'section') {
                    const rawBg = item.sectionBg;
                    const rawColor = item.sectionColor;
                    const rawBorder = item.sectionBorder;
                    const isDark = theme === 'dark';
                    const bg = rawBg || (isDark ? 'var(--notion-sidebar)' : '#f8fafc');
                    const textColor = rawColor || (isDark ? 'var(--notion-text)' : '#1e293b');
                    const finalBorder = isDark ? 'none' : `1.5px solid ${rawBorder || '#e2e8f0'}`;
                    const showBar = item.sectionShowBar !== false;
                    const fontSize = item.sectionFontSize || '1.32rem';
                    const align = item.sectionAlign || 'left';
                    const justifyContent = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';

                    return (
                      <div
                        key={item.id || idx}
                        id={`section-${item.id}`}
                        className="search-scroll-target"
                        style={{
                          gridColumn: '1 / -1',
                          marginTop: idx > 0 ? '24px' : '0px',
                          marginBottom: '4px'
                        }}
                      >
                        {item.imageUrl && item.sectionBannerType !== 'text' ? (
                          <div
                            className="portfolio-section-banner portfolio-section-image-banner"
                            style={{
                              position: 'relative',
                              width: '100%',
                              borderRadius: '14px',
                              overflow: 'hidden',
                              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                              backgroundColor: isDark ? '#1e293b' : '#f1f5f9'
                            }}
                          >
                            <img
                              src={item.imageUrl}
                              alt={item.title || "Section Banner"}
                              style={{
                                width: '100%',
                                height: 'auto',
                                maxHeight: '380px',
                                display: 'block',
                                objectFit: 'cover'
                              }}
                            />
                            {!item.sectionHideTitle && item.title && (
                              <div
                                style={{
                                  position: 'absolute',
                                  inset: 0,
                                  background: 'linear-gradient(to top, rgba(0, 0, 0, 0.75) 0%, rgba(0, 0, 0, 0.25) 50%, transparent 100%)',
                                  pointerEvents: 'none'
                                }}
                              >
                                <div
                                  style={{
                                    position: 'absolute',
                                    left: '5%',
                                    top: '88%',
                                    transform: 'translate(-5%, -88%)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '7px 14px',
                                    borderRadius: '8px',
                                    backgroundColor: 'rgba(15, 23, 42, 0.52)',
                                    backdropFilter: 'blur(8px)',
                                    border: '1px solid rgba(255, 255, 255, 0.22)',
                                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)',
                                    maxWidth: '92%'
                                  }}
                                >
                                  {showBar && (
                                    <div
                                      style={{
                                        width: '5px',
                                        height: '22px',
                                        borderRadius: '3px',
                                        backgroundColor: '#ffffff',
                                        opacity: 0.95,
                                        flexShrink: 0
                                      }}
                                    />
                                  )}
                                  <h2
                                    style={{
                                      fontSize: fontSize,
                                      fontWeight: 700,
                                      color: '#ffffff',
                                      textShadow: '0 2px 6px rgba(0, 0, 0, 0.8)',
                                      margin: 0,
                                      letterSpacing: '-0.01em',
                                      lineHeight: 1.3
                                    }}
                                  >
                                    {item.title}
                                  </h2>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div
                            className="portfolio-section-banner"
                            style={{
                              backgroundColor: bg,
                              color: textColor,
                              border: finalBorder,
                              borderRadius: '12px',
                              padding: '16px 24px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: justifyContent,
                              textAlign: align,
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                              position: 'relative'
                            }}
                          >
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: justifyContent,
                              gap: '12px',
                              width: align === 'center' ? '100%' : 'auto'
                            }}>
                              {showBar && (
                                <div style={{
                                  width: '4px',
                                  height: '22px',
                                  borderRadius: '2px',
                                  backgroundColor: textColor,
                                  opacity: 0.85,
                                  flexShrink: 0
                                }} />
                              )}
                              <h2 style={{
                                fontSize: fontSize,
                                fontWeight: 700,
                                color: textColor,
                                margin: 0,
                                letterSpacing: '-0.01em',
                                lineHeight: 1.3
                              }}>
                                {item.title}
                              </h2>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  /* Project Card */
                  const hasSubItems = item.subItems && item.subItems.length > 0;
                  const hasMain = Boolean(item.pdfUrl || item.link || item.imageUrl);
                  const totalPieces = (hasMain ? 1 : 0) + (hasSubItems ? item.subItems!.length : 0);
                  const subCount = totalPieces;

                  const handleOpenProject = () => {
                    if (hasSubItems) {
                      setIsFolderOpen(false);
                      setActiveFolderProject(item);
                    } else {
                      const viewUrl = item.pdfUrl || item.link || item.imageUrl;
                      if (viewUrl) {
                        setViewingPdf({ url: viewUrl, title: item.title, docId: item.id });
                      }
                    }
                  };

                  const span = item.cardSpan || 1;
                  const isWide = span === 2;
                  const isThree = span === 3;
                  const isFullRow = span === 4;

                  return (
                    <div
                      key={item.id || idx}
                      id={`portfolio-item-${item.id}`}
                      className={`notion-card search-scroll-target ${isFullRow ? 'card-span-full' : isThree ? 'card-span-3' : isWide ? 'card-span-2' : ''}`}
                      style={{
                        gridColumn: isFullRow ? '1 / -1' : isThree ? 'span 3 / span 3' : isWide ? 'span 2 / span 2' : 'span 1 / span 1',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                        height: '100%',
                        position: 'relative'
                      }}
                    >
                      {/* Card Thumbnail on top */}
                      <div
                        onClick={handleOpenProject}
                        style={{
                          height: isFullRow ? '320px' : isThree ? '260px' : isWide ? '230px' : '210px',
                          overflow: 'hidden',
                          borderBottom: '1px solid var(--notion-border)',
                          cursor: 'pointer',
                          position: 'relative'
                        }}
                        title={hasSubItems ? `คลิกเพื่อเปิดแฟ้มดูผลงานทั้งหมด (${subCount} ชิ้น)` : "คลิกเพื่อเปิดดูรูปภาพ / เอกสาร"}
                      >
                        <PdfCardThumbnail
                          imageUrl={item.imageUrl}
                          pdfUrl={item.pdfUrl || item.link}
                          title={item.title}
                        />
                      </div>

                      {/* Bottom Info Section (Clean & Clear standard layout) */}
                      <div style={{
                        padding: '18px 20px',
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        backgroundColor: 'var(--notion-bg)'
                      }}>
                        <div>
                          {/* Title & Icon */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: '12px',
                            marginBottom: item.description ? '8px' : '0px'
                          }}>
                            <h3
                              onClick={handleOpenProject}
                              style={{
                                fontSize: isFullRow ? '1.25rem' : '1.12rem',
                                fontWeight: 650,
                                color: 'var(--notion-text)',
                                lineHeight: 1.4,
                                margin: 0,
                                cursor: 'pointer',
                                transition: 'color 0.15s ease'
                              }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.color = '#2563eb';
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.color = 'var(--notion-text)';
                              }}
                            >
                              {item.title}
                            </h3>

                            <span style={{ color: 'var(--notion-text-muted)', flexShrink: 0, marginTop: '2px', cursor: 'pointer' }}
                              onClick={handleOpenProject}
                              title={hasSubItems ? "เปิดดูแฟ้มงาน" : "เปิดดูเอกสาร"}
                            >
                              {hasSubItems ? <FolderOpen size={isFullRow ? 20 : 17} color="#2563eb" /> : <ArrowUpRight size={isFullRow ? 20 : 17} />}
                            </span>
                          </div>

                          {/* Description */}
                          {item.description ? (
                            <p style={{
                              fontSize: '0.88rem',
                              color: 'var(--notion-text-muted)',
                              lineHeight: 1.55,
                              margin: '0 0 14px 0'
                            }}>
                              {item.description}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}


        {/* ----------------- PAGE 4: 404 NOT FOUND ----------------- */}
        {currentPage === '404' && (
          <section style={{
            maxWidth: '640px',
            margin: '0 auto',
            padding: '90px 24px 120px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: '84px',
              height: '84px',
              borderRadius: '24px',
              backgroundColor: 'var(--notion-sidebar)',
              border: '1px solid var(--notion-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)'
            }}>
              <FileQuestion size={40} color="var(--notion-text-muted)" strokeWidth={1.75} />
            </div>

            <div style={{
              fontSize: '3.5rem',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              color: 'var(--notion-text)',
              marginBottom: '12px'
            }}>
              404
            </div>

            <h1 style={{
              fontSize: '1.4rem',
              fontWeight: 700,
              color: 'var(--notion-text)',
              marginBottom: '12px',
              letterSpacing: '-0.01em'
            }}>
              ไม่พบหน้าที่คุณต้องการ
            </h1>

            <p style={{
              fontSize: '0.96rem',
              color: 'var(--notion-text-muted)',
              lineHeight: 1.65,
              maxWidth: '460px',
              marginBottom: '32px'
            }}>
              หน้าที่คุณกำลังพยายามเข้าถึงอาจถูกย้าย ลบออก หรือพิมพ์ที่อยู่ URL ไม่ถูกต้อง กรุณาตรวจสอบลิงก์อีกครั้งหรือกลับสู่หน้าหลัก
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={() => onNavigate('home')}
                className="notion-btn notion-btn-primary"
                style={{
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  padding: '10px 20px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Home size={16} />
                <span>กลับสู่หน้าแรก</span>
              </button>

              <button
                onClick={() => onNavigate('portfolio')}
                className="notion-btn"
                style={{
                  fontSize: '0.92rem',
                  fontWeight: 500,
                  padding: '10px 18px',
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--notion-border)',
                  color: 'var(--notion-text)'
                }}
              >
                <span>ดูผลงาน (Portfolio)</span>
              </button>
            </div>
          </section>
        )}

      </main>

      {/* 4. FOOTER: ข้อมูลผู้จัดทำ */}
      <footer style={{
        borderTop: '1px solid var(--notion-border)',
        backgroundColor: 'var(--notion-sidebar)',
        padding: '36px 24px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--notion-text)' }}>
            นาย วรเดช พันธ์พืช
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--notion-text-muted)' }}>
            แผนกวิชาเทคโนโลยีสารสนเทศ
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--notion-text-muted)' }}>
            วิทยาลัยเทคนิคนครศรีธรรมราช
          </div>
        </div>
      </footer>

      {/* In-page PDF Viewer Modal (ดูเอกสารในเว็บได้ทันที ไม่ต้องกดโหลด) */}
      {viewingPdf && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 15, 15, 0.75)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 100000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isPdfFullscreen ? '0px' : '16px'
          }}
          onClick={() => {
            setViewingPdf(null);
            setIsPdfFullscreen(false);
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--notion-bg)',
              borderRadius: isPdfFullscreen ? '0px' : 'var(--radius-md)',
              width: '100%',
              maxWidth: isPdfFullscreen ? '100vw' : '1080px',
              height: isPdfFullscreen ? '100vh' : '92vh',
              maxHeight: isPdfFullscreen ? '100vh' : '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
              border: isPdfFullscreen ? 'none' : '1px solid var(--notion-border)',
              overflow: 'hidden',
              transition: 'all 0.15s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 16px',
              borderBottom: '1px solid var(--notion-border)',
              backgroundColor: 'var(--notion-sidebar)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <FileText size={16} color="var(--notion-text)" />
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--notion-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {viewingPdf.title}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {/* Direct Share Link button */}
                <button
                  type="button"
                  onClick={() => handleCopyDocLink(viewingPdf.url, viewingPdf.title, viewingPdf.docId)}
                  className="notion-btn"
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '1px solid var(--notion-border)',
                    background: 'var(--notion-bg)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.78rem',
                    color: 'var(--notion-text)',
                    transition: 'all 0.15s ease'
                  }}
                  title="คัดลอกลิงก์ไฟล์เอกสารนี้"
                >
                  <Copy size={13} />
                  <span className="btn-text-responsive">แชร์ลิงก์</span>
                </button>
                {/* Download Button (Direct Download original PDF / Word / Image / File) */}
                {!isCanvaUrl(viewingPdf.url) ? (
                  <button
                    type="button"
                    onClick={() => handleDownloadFile(viewingPdf.url, viewingPdf.title)}
                    className="notion-btn"
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid var(--notion-border)',
                      background: 'var(--notion-bg)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.78rem',
                      color: 'var(--notion-text)'
                    }}
                    title="ดาวน์โหลดไฟล์ต้นฉบับลงเครื่อง"
                  >
                    <Download size={13} />
                    <span className="btn-text-responsive">ดาวน์โหลด</span>
                  </button>
                ) : (
                  <a
                    href={viewingPdf.url}
                    target="_blank"
                    rel="noreferrer"
                    className="notion-btn"
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid var(--notion-border)',
                      background: 'var(--notion-bg)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.78rem',
                      color: '#2563eb',
                      textDecoration: 'none'
                    }}
                    title="เปิดในแท็บใหม่"
                  >
                    <ExternalLink size={13} />
                    <span className="btn-text-responsive">เปิดลิงก์</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setIsPdfFullscreen(!isPdfFullscreen)}
                  className="notion-btn"
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '1px solid var(--notion-border)',
                    background: 'var(--notion-bg)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.78rem',
                    color: 'var(--notion-text)'
                  }}
                  title={isPdfFullscreen ? "ย่อหน้าต่าง" : "ขยายเต็มจอ"}
                >
                  {isPdfFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                  <span className="btn-text-responsive">{isPdfFullscreen ? "ย่อ" : "เต็มจอ"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewingPdf(null);
                    setIsPdfFullscreen(false);
                          }}
                  className="notion-btn"
                  style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--notion-border)', background: 'var(--notion-bg)', color: 'var(--notion-text)', cursor: 'pointer' }}
                  title="ปิดหน้าต่าง (Esc)"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Embedded Viewer (Supports Images, Canva Presentation Embeds, and Full-featured PDF viewer) */}
            <div style={{ flex: 1, width: '100%', height: '100%', backgroundColor: 'var(--notion-sidebar)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
              {isCanvaUrl(viewingPdf.url) ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#000000' }}>
                  <iframe
                    src={toCanvaEmbedUrl(viewingPdf.url)}
                    title={viewingPdf.title || "Canva Presentation"}
                    allow="fullscreen; autoplay"
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      flex: 1
                    }}
                  />
                </div>
              ) : (viewingPdf.url.startsWith('data:image/') || /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(viewingPdf.url)) ? (
                <div style={{ width: '100%', height: '100%', overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                  <img
                    src={viewingPdf.url}
                    alt={viewingPdf.title}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      borderRadius: '4px',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
                    }}
                  />
                </div>
              ) : /\.(doc|docx)($|\?)/i.test(viewingPdf.url) || viewingPdf.url.includes('application/msword') || viewingPdf.url.includes('wordprocessingml') ? (
                /* Microsoft Office Live Viewer for .doc / .docx files */
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--notion-bg)', position: 'relative' }}>
                  {viewingPdf.url.startsWith('http://') || viewingPdf.url.startsWith('https://') ? (
                    <iframe
                      src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(viewingPdf.url)}`}
                      title={viewingPdf.title || "เอกสาร Word"}
                      style={{ width: '100%', height: '100%', border: 'none', flex: 1 }}
                    />
                  ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', textAlign: 'center' }}>
                      <FileText size={48} color="#2563eb" style={{ marginBottom: '16px' }} />
                      <h3 style={{ fontSize: '1.18rem', fontWeight: 700, color: 'var(--notion-text)', marginBottom: '8px' }}>
                        {viewingPdf.title}
                      </h3>
                      <p style={{ fontSize: '0.88rem', color: 'var(--notion-text-muted)', marginBottom: '20px', maxWidth: '380px' }}>
                        เอกสาร Microsoft Word (.doc, .docx) พร้อมสำหรับดาวน์โหลดหรือเปิดด้วยแอปในเครื่องของคุณ
                      </p>
                      <button
                        type="button"
                        onClick={() => handleDownloadFile(viewingPdf.url, viewingPdf.title)}
                        className="notion-btn notion-btn-primary"
                        style={{ padding: '9px 20px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                      >
                        <Download size={15} />
                        <span>ดาวน์โหลดไฟล์ Word</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <PdfDocViewer url={viewingPdf.url} title={viewingPdf.title} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3D FOLDER VIEWER MODAL (When clicking a multi-item project - 100% Responsive) */}
      {activeFolderProject && (
        <div
          className="folder-modal-overlay"
          onClick={() => setActiveFolderProject(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="folder-modal-container"
            style={{
              backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
            }}
          >
            {/* Modal Header */}
            <div
              className="folder-modal-header"
              style={{
                backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.6)' : '#f8fafc'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    minWidth: '34px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(37, 99, 235, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2563eb',
                    flexShrink: 0
                  }}
                >
                  <FolderOpen size={18} />
                </div>
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <h3 className="folder-modal-title">
                    {activeFolderProject.title}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveFolderProject(null)}
                className="notion-btn"
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--notion-border)',
                  background: 'var(--notion-bg)',
                  color: 'var(--notion-text)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.82rem',
                  flexShrink: 0
                }}
                title="ปิดแฟ้ม (Esc)"
              >
                <X size={16} />
                <span>ปิด</span>
              </button>
            </div>

            {/* 3D Interactive Folder Stage */}
            <div
              className="folder-modal-stage"
              style={{
                background: theme === 'dark'
                  ? 'radial-gradient(ellipse at center, #1e293b 0%, #0b0f19 100%)'
                  : 'radial-gradient(ellipse at center, #f1f5f9 0%, #e2e8f0 100%)',
              }}
            >
              <div className="folder-stage-inner">
                <Folder
                  label={activeFolderProject.title.slice(0, 20)}
                  mode="flap"
                  variant="solid"
                  color="#2563eb"
                  paperColor="#ffffff"
                  layout="spread"
                  size={folderSize}
                  open={isFolderOpen}
                  onOpenChange={setIsFolderOpen}
                  closeOnOutsideClick={false}
                  openOn="click"
                  draggable={true}
                  zoomOnClick={false}
                  peek={true}
                  theme={theme}
                  items={[
                    // ชิ้นงานหลัก (Main project piece)
                    ...(activeFolderProject.pdfUrl || activeFolderProject.link || activeFolderProject.imageUrl ? [{
                      title: activeFolderProject.mainItemTitle || activeFolderProject.title || activeFolderProject.fileName,
                      image: activeFolderProject.imageUrl || (activeFolderProject.pdfUrl && /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(activeFolderProject.pdfUrl) ? activeFolderProject.pdfUrl : undefined),
                      url: activeFolderProject.pdfUrl || activeFolderProject.link || activeFolderProject.imageUrl,
                      description: activeFolderProject.description
                    }] : []),
                    // ชิ้นงานย่อยทั้งหมด (All sub-items)
                    ...(activeFolderProject.subItems || []).map((sub, idx) => ({
                      title: sub.title || `ชิ้นงานที่ ${idx + 2}`,
                      image: sub.imageUrl || (sub.url && /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(sub.url) ? sub.url : undefined),
                      url: sub.url,
                      description: sub.description
                    }))
                  ]}
                  onItemClick={(item) => {
                    const viewUrl = item.url || item.image || item.imageUrl;
                    if (viewUrl) {
                      setViewingPdf({ url: viewUrl, title: item.title || activeFolderProject.title, docId: activeFolderProject.id });
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Toast Notification for Direct Link Copying */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#18181b',
            color: '#f4f4f5',
            padding: '10px 18px',
            borderRadius: '9999px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.15)',
            fontSize: '0.88rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 100001,
            animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <Check size={16} color="#10b981" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
