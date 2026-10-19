import React, { useState } from 'react';
import type { SiteConfig } from '../types';
import { Carousel } from './Carousel';
import {
  Menu,
  X,
  FileText,
  GraduationCap,
  Calendar,
  Award,
  BookOpen,
  User,
  Phone,
  Mail,
  MapPin,
  Target,
  Users,
  FileQuestion,
  Home,
  ExternalLink,
  ArrowUpRight
} from 'lucide-react';

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
  const [viewingPdf, setViewingPdf] = useState<{ url: string; title: string } | null>(null);

  const handleNavClick = (page: PageRoute) => {
    onNavigate(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', color: '#37352f', display: 'flex', flexDirection: 'column' }}>

      {/* 1. NAVIGATION BAR (No Contact link, No Emoji) */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--notion-border)',
        height: '52px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px'
      }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Logo and Name */}
          <div
            onClick={() => handleNavClick('home')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}
          >
            <img
              src="/logo-tnk.jpg"
              alt="Logo"
              style={{
                height: '34px',
                width: 'auto',
                display: 'block',
                borderRadius: 'var(--radius-xs)',
                objectFit: 'contain'
              }}
            />
            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--notion-text)', letterSpacing: '-0.01em' }}>
              014 Woradech Panphuech
            </span>
          </div>

          {/* Desktop Nav Items: Only Home, About, Portfolio */}
          <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => handleNavClick('home')}
              className="notion-btn notion-btn-subtle"
              style={{
                fontSize: '0.85rem',
                padding: '6px 12px',
                fontWeight: currentPage === 'home' ? 600 : 400,
                color: currentPage === 'home' ? 'var(--notion-text)' : 'var(--notion-text-muted)',
                backgroundColor: currentPage === 'home' ? 'var(--notion-hover)' : 'transparent'
              }}
            >
              {config.navLinks.home}
            </button>
            <button
              onClick={() => handleNavClick('about')}
              className="notion-btn notion-btn-subtle"
              style={{
                fontSize: '0.85rem',
                padding: '6px 12px',
                fontWeight: currentPage === 'about' ? 600 : 400,
                color: currentPage === 'about' ? 'var(--notion-text)' : 'var(--notion-text-muted)',
                backgroundColor: currentPage === 'about' ? 'var(--notion-hover)' : 'transparent'
              }}
            >
              {config.navLinks.about}
            </button>
            <button
              onClick={() => handleNavClick('portfolio')}
              className="notion-btn notion-btn-subtle"
              style={{
                fontSize: '0.85rem',
                padding: '6px 12px',
                fontWeight: currentPage === 'portfolio' ? 600 : 400,
                color: currentPage === 'portfolio' ? 'var(--notion-text)' : 'var(--notion-text-muted)',
                backgroundColor: currentPage === 'portfolio' ? 'var(--notion-hover)' : 'transparent'
              }}
            >
              {config.navLinks.portfolio}
            </button>
          </nav>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-toggle"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'none',
              color: 'var(--notion-text)'
            }}
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Drawer (Inside sticky header container with slide & blur) */}
        {mobileMenuOpen && (
          <div style={{
            position: 'absolute',
            top: '52px',
            left: 0,
            right: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--notion-border)',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
            padding: '12px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            zIndex: 100
          }}>
            <button
              onClick={() => handleNavClick('home')}
              className="notion-btn notion-btn-subtle"
              style={{ justifyContent: 'flex-start', fontWeight: currentPage === 'home' ? 600 : 400 }}
            >
              {config.navLinks.home}
            </button>
            <button
              onClick={() => handleNavClick('about')}
              className="notion-btn notion-btn-subtle"
              style={{ justifyContent: 'flex-start', fontWeight: currentPage === 'about' ? 600 : 400 }}
            >
              {config.navLinks.about}
            </button>
            <button
              onClick={() => handleNavClick('portfolio')}
              className="notion-btn notion-btn-subtle"
              style={{ justifyContent: 'flex-start', fontWeight: currentPage === 'portfolio' ? 600 : 400 }}
            >
              {config.navLinks.portfolio}
            </button>
          </div>
        )}
      </header>

      {/* ================= PAGE ROUTING ================= */}
      <main style={{ flex: 1 }}>

        {/* ----------------- PAGE 1: HOME ----------------- */}
        {/* Strict Order: Nav -> Hero Section (Image only) -> Carousel -> Footer */}
        {currentPage === 'home' && (
          <div>
            {/* 2. HERO SECTION: Full-width Edge-to-Edge and Full Screen */}
            <section
              className="hero-section"
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

        {/* ----------------- PAGE 2: ABOUT (แยกหน้า) ----------------- */}
        {currentPage === 'about' && (
          <section style={{ maxWidth: '960px', margin: '0 auto', padding: '48px 24px 80px' }}>
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

              {/* Profile Card */}
              <div className="notion-card" style={{ padding: '24px', textAlign: 'center', position: 'sticky', top: '70px' }}>
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

              {/* Main Information Sections */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                
                {/* 1. ประวัติส่วนตัว */}
                <div className="notion-card" style={{ padding: '28px' }}>
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
                        <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--notion-text)' }}>แผนกเทคโนโลยีสารสนเทศ</div>
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
                <div className="notion-card" style={{ padding: '28px' }}>
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
                        นาง สุรางคนา ชูวาลา
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

              </div>

            </div>

            {/* Section แสดงประวัติการศึกษา (Education Timeline) */}
            {config.about.education && config.about.education.length > 0 && (
              <div style={{ marginTop: '64px', borderTop: '1px solid var(--notion-border)', paddingTop: '48px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
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
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--notion-text)', margin: 0 }}>
                    ประวัติการศึกษา (Education)
                  </h2>
                </div>

                {/* Timeline Container */}
                <div style={{ position: 'relative', paddingLeft: '24px' }}>
                  {/* Vertical Timeline Rule */}
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    bottom: '24px',
                    left: '7px',
                    width: '2px',
                    backgroundColor: 'var(--notion-border-dark)'
                  }} />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    {config.about.education.map((edu, idx) => (
                      <div key={edu.id || idx} style={{ position: 'relative' }}>
                        {/* Timeline Node Dot */}
                        <div style={{
                          position: 'absolute',
                          top: '6px',
                          left: '-24px',
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          backgroundColor: edu.current ? 'var(--notion-text)' : '#ffffff',
                          border: '3px solid var(--notion-text)',
                          boxShadow: '0 0 0 3px rgba(255, 255, 255, 1)'
                        }} />

                        {/* Education Card */}
                        <div
                          className="notion-card edu-card"
                          style={{
                            padding: '24px 28px',
                            display: 'flex',
                            gap: '24px',
                            alignItems: 'center',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--notion-border)',
                            backgroundColor: '#ffffff'
                          }}
                        >
                          {/* School Logo */}
                          <div style={{
                            width: '72px',
                            height: '72px',
                            minWidth: '72px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            border: '1.5px solid var(--notion-border)',
                            backgroundColor: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                            padding: '2px'
                          }}>
                            <img
                              src={edu.logoUrl}
                              alt={edu.institution}
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/logo-tnk.jpg";
                              }}
                            />
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--notion-text)', margin: 0 }}>
                                {edu.institution}
                              </h3>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '0.85rem',
                                color: edu.current ? '#166534' : 'var(--notion-text-muted)',
                                backgroundColor: edu.current ? '#dcfce7' : 'var(--notion-sidebar)',
                                padding: '4px 12px',
                                borderRadius: '16px',
                                fontWeight: 600,
                                border: edu.current ? '1px solid #bbf7d0' : '1px solid var(--notion-border)'
                              }}>
                                <Calendar size={13} />
                                {edu.period}
                              </span>
                            </div>

                            {edu.institutionEn && (
                              <div style={{ fontSize: '0.88rem', color: 'var(--notion-text-muted)', marginBottom: '10px', fontWeight: 500 }}>
                                {edu.institutionEn}
                              </div>
                            )}

                              {/* ระดับการศึกษา (Degree) */}
                              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: edu.major ? '8px' : '0' }}>
                                <div
                                  className="edu-degree-badge"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontSize: '0.88rem',
                                    color: 'var(--notion-text)',
                                    fontWeight: 600,
                                    backgroundColor: 'var(--notion-sidebar)',
                                    padding: '5px 12px',
                                    borderRadius: 'var(--radius-xs)',
                                    border: '1px solid var(--notion-border)',
                                    maxWidth: '100%',
                                    lineHeight: 1.4
                                  }}
                                >
                                  <Award size={15} color="var(--notion-text)" style={{ flexShrink: 0 }} />
                                  <span style={{ wordBreak: 'break-word' }}>{edu.degree}</span>
                                </div>

                              {/* สาขาวิชา (Major / Field of Study) แยกกล่องต่างหาก */}
                              {edu.major && (
                                <div style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  fontSize: '0.88rem',
                                  color: 'var(--notion-text-muted)',
                                  fontWeight: 500,
                                  backgroundColor: '#ffffff',
                                  padding: '5px 12px',
                                  borderRadius: 'var(--radius-xs)',
                                  border: '1px solid var(--notion-border)'
                                }}>
                                  <BookOpen size={14} color="var(--notion-text-muted)" />
                                  <span>{edu.major}</span>
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
        )}

        {/* ----------------- PAGE 3: PORTFOLIO (แยกหน้า) ----------------- */}
        {currentPage === 'portfolio' && (
          <section style={{ maxWidth: '1080px', margin: '0 auto', padding: '48px 24px 80px' }}>
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ fontSize: '2.4rem', fontWeight: 700, color: 'var(--notion-text)' }}>
                {config.portfolio.title}
              </h1>
            </div>

            {/* Portfolio Grid or Empty State or Initial Loading Skeleton */}
            {config.portfolio.items.length === 0 ? (
              isInitialLoading ? (
                <div className="portfolio-grid">
                  {[1, 2].map((k) => (
                    <div
                      key={k}
                      className="notion-card"
                      style={{ height: '360px', backgroundColor: '#ffffff', opacity: 0.6, animation: 'pulse 1.5s infinite ease-in-out' }}
                    >
                      <div style={{ height: '230px', backgroundColor: 'var(--notion-sidebar)', borderBottom: '1px solid var(--notion-border)' }} />
                      <div style={{ padding: '22px' }}>
                        <div style={{ height: '20px', width: '60%', backgroundColor: 'var(--notion-sidebar)', borderRadius: '4px', marginBottom: '12px' }} />
                        <div style={{ height: '14px', width: '85%', backgroundColor: 'var(--notion-sidebar)', borderRadius: '4px' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '60px 24px',
                  textAlign: 'center',
                  backgroundColor: 'var(--notion-sidebar)',
                  border: '1px dashed var(--notion-border-dark)',
                  borderRadius: 'var(--radius-sm)',
                  margin: '20px 0'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--notion-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    color: 'var(--notion-text-muted)'
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--notion-text)', margin: 0 }}>
                    ยังไม่มีผลงานใน Portfolio
                  </h3>
                </div>
              )
            ) : (
              <div className="portfolio-grid">
                {config.portfolio.items.map((item) => {
                  // Check if this item is a section divider banner
                  if (item.itemType === 'section') {
                    const bg = item.sectionBg || '#f3f4f6';
                    const textColor = item.sectionColor || '#1f2937';
                    const borderColor = item.sectionBorder || '#e5e7eb';

                    const showBar = item.sectionShowBar !== false;
                    const fontSize = item.sectionFontSize || '1.28rem';
                    const align = item.sectionAlign || 'left';
                    const justifyContent = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';

                    return (
                      <div
                        key={item.id}
                        style={{
                          gridColumn: '1 / -1',
                          backgroundColor: bg,
                          color: textColor,
                          border: `1.5px solid ${borderColor}`,
                          borderRadius: '12px',
                          padding: '16px 24px',
                          marginTop: '20px',
                          marginBottom: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: justifyContent,
                          textAlign: align,
                          gap: '16px',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
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
                              width: '8px',
                              height: '24px',
                              borderRadius: '4px',
                              backgroundColor: textColor,
                              opacity: 0.8,
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
                    );
                  }

                  return (
                  <div
                    key={item.id}
                    className="notion-card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      height: '100%'
                    }}
                  >
                    {/* Clickable Image to view PDF directly */}
                    <div
                      onClick={() => {
                        if (item.pdfUrl) {
                          setViewingPdf({ url: item.pdfUrl, title: item.title });
                        } else if (item.link) {
                          window.open(item.link, '_blank');
                        }
                      }}
                      style={{
                        height: '210px',
                        overflow: 'hidden',
                        borderBottom: '1px solid var(--notion-border)',
                        cursor: (item.pdfUrl || item.link) ? 'pointer' : 'default',
                        position: 'relative'
                      }}
                      title={item.pdfUrl ? "คลิกเพื่อเปิดดูเอกสาร" : item.title}
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.2s ease'
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80";
                        }}
                      />
                    </div>

                    <div style={{
                      padding: '18px 20px',
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      backgroundColor: '#ffffff'
                    }}>
                      <div>
                        {/* Title with subtle category / format indicator */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '12px',
                          marginBottom: item.description ? '8px' : '0px'
                        }}>
                          <h3
                            onClick={() => {
                              if (item.pdfUrl) {
                                setViewingPdf({ url: item.pdfUrl, title: item.title });
                              } else if (item.link) {
                                window.open(item.link, '_blank');
                              }
                            }}
                            style={{
                              fontSize: '1.12rem',
                              fontWeight: 650,
                              color: 'var(--notion-text)',
                              lineHeight: 1.4,
                              margin: 0,
                              cursor: (item.pdfUrl || item.link) ? 'pointer' : 'default',
                              transition: 'color 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              if (item.pdfUrl || item.link) (e.currentTarget as HTMLElement).style.color = '#2563eb';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.color = 'var(--notion-text)';
                            }}
                          >
                            {item.title}
                          </h3>

                          {(item.pdfUrl || item.link) && (
                            <span style={{ color: 'var(--notion-text-muted)', flexShrink: 0, marginTop: '2px' }}>
                              <ArrowUpRight size={17} />
                            </span>
                          )}
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

                      {/* Footer Actions / Meta */}
                      <div style={{
                        paddingTop: '14px',
                        borderTop: '1px solid var(--notion-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: item.description ? 'auto' : '14px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--notion-text-muted)' }}>
                          <FileText size={15} color="#6b7280" />
                          <span style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.fileName || 'เอกสารแนบ'}
                          </span>
                        </div>

                        {(item.pdfUrl || item.link) && (
                          <button
                            type="button"
                            onClick={() => {
                              if (item.pdfUrl) {
                                setViewingPdf({ url: item.pdfUrl, title: item.title });
                              } else if (item.link) {
                                window.open(item.link, '_blank');
                              }
                            }}
                            className="notion-btn notion-btn-subtle"
                            style={{
                              fontSize: '0.84rem',
                              fontWeight: 500,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 14px',
                              borderRadius: '6px',
                              color: '#2563eb',
                              backgroundColor: '#eff6ff',
                              border: '1px solid #bfdbfe'
                            }}
                          >
                            <span>เปิดดูเอกสาร</span>
                            <ExternalLink size={13} />
                          </button>
                        )}
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
        backgroundColor: '#fbfbfa',
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
            backgroundColor: 'rgba(15, 15, 15, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setViewingPdf(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-md)',
              width: '100%',
              maxWidth: '960px',
              height: '92vh',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--notion-border)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 18px',
              borderBottom: '1px solid var(--notion-border)',
              backgroundColor: '#fbfbfa'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <FileText size={16} color="var(--notion-text)" />
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--notion-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {viewingPdf.title}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setViewingPdf(null)}
                  className="notion-btn"
                  style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--notion-border)', background: '#ffffff', cursor: 'pointer' }}
                  title="ปิดหน้าต่าง"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Embedded Viewer (Supports Images and PDF) */}
            <div style={{ flex: 1, width: '100%', height: '100%', backgroundColor: '#1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto' }}>
              {viewingPdf.url.startsWith('data:image/') || /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(viewingPdf.url) ? (
                <img
                  src={viewingPdf.url}
                  alt={viewingPdf.title}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    padding: '16px'
                  }}
                />
              ) : (
                <iframe
                  src={viewingPdf.url}
                  title={viewingPdf.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    display: 'block'
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
