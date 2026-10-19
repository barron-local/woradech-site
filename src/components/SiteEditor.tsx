import React, { useState } from 'react';
import type { SiteConfig, PortfolioItem, CarouselSlide } from '../types';
import { UploadPage } from './UploadPage';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Upload,
  CheckCircle2,
  Layers,
  FileText,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Loader2,
  Clock,
  Image as ImageIcon
} from 'lucide-react';
import { compressImage } from '../utils/imageCompress';
import { uploadAssetToSupabase } from '../supabase';

interface SiteEditorProps {
  config: SiteConfig;
  onUpdateConfig: (newConfig: SiteConfig) => void;
  onCloseEditor: () => void;
  projects?: PortfolioItem[];
  onAddProject?: (item: PortfolioItem) => void;
  onUpdateProject?: (item: PortfolioItem) => void;
  onDeleteProject?: (id: string) => void;
  onReorderProjects?: (items: PortfolioItem[]) => void;
}

export const SiteEditor: React.FC<SiteEditorProps> = ({
  config,
  onUpdateConfig,
  onCloseEditor,
  projects = [],
  onAddProject = () => {},
  onUpdateProject = () => {},
  onDeleteProject = () => {},
  onReorderProjects = () => {}
}) => {
  // Tabs: 'carousel' (Banner & Carousel) and 'upload' (Work files)
  const [activeTab, setActiveTab] = useState<'carousel' | 'upload'>('carousel');

  // Filter out any legacy unsplash mock images from initial slides
  const [slides, setSlides] = useState<CarouselSlide[]>(() => {
    const rawSlides = config.carousel?.slides || [];
    const filtered = rawSlides.filter(s => s.imageUrl && !s.imageUrl.includes('unsplash.com'));
    return filtered.length > 0
      ? filtered
      : [{ id: 'slide-1', title: '', caption: '', imageUrl: '/banner.png', link: '#portfolio' }];
  });

  // Hero Banner image URL (purged of any unsplash mockup)
  const [heroBannerUrl, setHeroBannerUrl] = useState<string>(() => {
    const url = config.heroImage?.imageUrl;
    return (url && !url.includes('unsplash.com')) ? url : '/banner.png';
  });

  // Carousel duration in seconds & autoplay state
  const [intervalSeconds, setIntervalSeconds] = useState<number>(() => {
    return config.carousel?.interval ? config.carousel.interval / 1000 : 4;
  });
  const [isAutoplay, setIsAutoplay] = useState<boolean>(() => {
    return config.carousel?.autoplay !== false;
  });

  const [uploadingSlideId, setUploadingSlideId] = useState<string | null>(null);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Handle uploading Hero Banner image
  const handleBannerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingBanner(true);
    try {
      // 1. Instant client-side compression
      const { dataUrl, blob } = await compressImage(file, 2560, 1440, 0.85);
      setHeroBannerUrl(dataUrl);

      // 2. Upload to Supabase Storage
      const publicUrl = await uploadAssetToSupabase(blob, 'banner');
      if (publicUrl) {
        setHeroBannerUrl(publicUrl);
      }
    } catch (err) {
      console.error('Failed to upload hero banner:', err);
    } finally {
      setIsUploadingBanner(false);
    }
  };

  // Reset banner to default local banner
  const resetBannerToDefault = () => {
    setHeroBannerUrl('/banner.png');
  };

  // Handle uploading slide image
  const handleSlideImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, slideId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingSlideId(slideId);
    try {
      // 1. Instant client-side compression (reduces 10MB down to ~120KB)
      const { dataUrl, blob } = await compressImage(file, 1920, 1080, 0.82);
      setSlides(prev => prev.map(s => s.id === slideId ? { ...s, imageUrl: dataUrl } : s));

      // 2. Upload to Supabase Storage
      const publicUrl = await uploadAssetToSupabase(blob, 'carousel');
      if (publicUrl) {
        setSlides(prev => prev.map(s => s.id === slideId ? { ...s, imageUrl: publicUrl } : s));
      }
    } catch (err) {
      console.error('Failed to upload slide image:', err);
    } finally {
      setUploadingSlideId(null);
    }
  };

  const addSlide = () => {
    const newSlide: CarouselSlide = {
      id: "slide-" + Date.now(),
      title: "",
      caption: "",
      imageUrl: "/banner.png",
      link: "#portfolio"
    };
    setSlides(prev => [...prev, newSlide]);
  };

  const removeSlide = (id: string) => {
    if (slides.length <= 1) {
      alert("ต้องมีรูปภาพใน Carousel อย่างน้อย 1 รูป");
      return;
    }
    setSlides(prev => prev.filter(s => s.id !== id));
  };

  const moveSlide = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;
    const copy = [...slides];
    const [item] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, item);
    setSlides(copy);
  };

  const handleSaveAll = () => {
    const cleanSlides = slides.map((s, idx) => ({
      ...s,
      id: s.id || `slide-${idx + 1}`,
      imageUrl: s.imageUrl || '/banner.png'
    }));

    const safeIntervalMs = Math.max(1500, Math.round(Number(intervalSeconds || 4) * 1000));

    const updatedConfig: SiteConfig = {
      ...config,
      heroImage: {
        ...config.heroImage,
        imageUrl: heroBannerUrl || '/banner.png'
      },
      carousel: {
        ...config.carousel,
        autoplay: isAutoplay,
        interval: safeIntervalMs,
        slides: cleanSlides
      }
    };

    onUpdateConfig(updatedConfig);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#fbfbfa',
      color: '#37352f',
      fontFamily: 'var(--font-family)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 1. Header Bar */}
      <header
        className="editor-header"
        style={{
          minHeight: '54px',
          borderBottom: '1px solid var(--notion-border)',
          backgroundColor: '#ffffff',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          gap: '10px',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}
      >
        {/* Left: Back */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onCloseEditor}
            className="notion-btn"
            style={{
              fontSize: '0.84rem',
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--notion-border)',
              backgroundColor: '#ffffff'
            }}
          >
            <ArrowLeft size={15} />
            <span>กลับหน้าหลัก</span>
          </button>
        </div>

        {/* Right: Modern Prominent Tabs Switcher */}
        <div
          className="editor-tabs"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap'
          }}
        >
          <button
            onClick={() => setActiveTab('carousel')}
            style={{
              fontSize: '0.86rem',
              fontWeight: activeTab === 'carousel' ? 700 : 500,
              backgroundColor: activeTab === 'carousel' ? 'var(--notion-text)' : '#ffffff',
              color: activeTab === 'carousel' ? '#ffffff' : 'var(--notion-text)',
              border: '1.5px solid',
              borderColor: activeTab === 'carousel' ? 'var(--notion-text)' : 'var(--notion-border)',
              borderRadius: 'var(--radius-xs)',
              boxShadow: activeTab === 'carousel' ? '0 2px 6px rgba(0,0,0,0.15)' : '0 1px 2px rgba(0,0,0,0.03)',
              padding: '8px 18px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Layers size={17} strokeWidth={activeTab === 'carousel' ? 2.2 : 1.8} />
            <span style={{ whiteSpace: 'nowrap' }}>จัดการรูปภาพ แบนเนอร์ & Carousel</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            style={{
              fontSize: '0.86rem',
              fontWeight: activeTab === 'upload' ? 700 : 500,
              backgroundColor: activeTab === 'upload' ? 'var(--notion-text)' : '#ffffff',
              color: activeTab === 'upload' ? '#ffffff' : 'var(--notion-text)',
              border: '1.5px solid',
              borderColor: activeTab === 'upload' ? 'var(--notion-text)' : 'var(--notion-border)',
              borderRadius: 'var(--radius-xs)',
              boxShadow: activeTab === 'upload' ? '0 2px 6px rgba(0,0,0,0.15)' : '0 1px 2px rgba(0,0,0,0.03)',
              padding: '8px 14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <FileText size={17} strokeWidth={activeTab === 'upload' ? 2.2 : 1.8} />
            <span style={{ whiteSpace: 'nowrap' }}>จัดการไฟล์งาน (PDF & รูปภาพ)</span>
          </button>
        </div>
      </header>

      {/* 2. Main Content Area */}
      <main style={{ flex: 1, padding: '32px 20px', maxWidth: '880px', width: '100%', margin: '0 auto' }}>

        {/* ================= TAB 1: BANNER & CAROUSEL ================= */}
        {activeTab === 'carousel' && (
          <div>
            {/* Top Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--notion-text)', margin: 0 }}>
                  จัดการรูปภาพ Carousel & Banner
                </h1>
                <p style={{ fontSize: '0.88rem', color: 'var(--notion-text-muted)', margin: '4px 0 0' }}>
                  แก้ไขรูปภาพแบนเนอร์หน้าหลัก และรูปภาพสไลด์หมุนเวียน (รูปภาพจะถูกบันทึกถาวร ไม่ติดรูป Mock ตอนรีเฟรช)
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                <button
                  onClick={handleSaveAll}
                  className="notion-btn notion-btn-primary"
                  style={{ fontSize: '0.9rem', padding: '8px 18px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', flexShrink: 0, fontWeight: 600 }}
                >
                  <Save size={16} />
                  <span>บันทึกการเปลี่ยนแปลง</span>
                </button>
              </div>
            </div>

            {/* Notification alert on save */}
            {saveSuccess && (
              <div style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid #bbf7d0',
                backgroundColor: '#f0fdf4',
                color: '#166534',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.9rem',
                fontWeight: 600,
                marginBottom: '24px',
                animation: 'fadeIn 0.2s ease'
              }}>
                <CheckCircle2 size={18} />
                <span>บันทึกรูปภาพเรียบร้อยแล้ว! ข้อมูลถูกอัปเดตลงแคชและระบบคลาวด์ พร้อมแสดงผลทันที</span>
              </div>
            )}

            {/* SECTION 1: HERO BANNER (แบนเนอร์หน้าแรกสุด) */}
            <section style={{
              backgroundColor: '#ffffff',
              border: '1px solid var(--notion-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
              marginBottom: '32px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ImageIcon size={18} color="var(--notion-text)" />
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--notion-text)' }}>
                    1. แบนเนอร์หน้าแรก (Hero Banner)
                  </h2>
                </div>
                <button
                  onClick={resetBannerToDefault}
                  className="notion-btn"
                  style={{ fontSize: '0.8rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  title="รีเซ็ตเป็นแบนเนอร์ค่าเริ่มต้น (/banner.png)"
                >
                  <RotateCcw size={13} />
                  <span>รีเซ็ตเป็นค่าเริ่มต้น</span>
                </button>
              </div>

              {/* Preview Frame */}
              <div style={{
                position: 'relative',
                height: '240px',
                width: '100%',
                borderRadius: 'var(--radius-xs)',
                overflow: 'hidden',
                border: '1px solid var(--notion-border)',
                backgroundColor: '#0f0f11',
                marginBottom: '16px'
              }}>
                <img
                  src={heroBannerUrl || '/banner.png'}
                  alt="Hero Banner Preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/banner.png';
                  }}
                />
                {isUploadingBanner && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    gap: '8px',
                    fontSize: '0.9rem',
                    fontWeight: 600
                  }}>
                    <Loader2 size={20} className="animate-spin" />
                    <span>กำลังอัปโหลดรูปภาพแบนเนอร์...</span>
                  </div>
                )}
              </div>

              {/* Banner Upload & Inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <label className="notion-btn notion-btn-primary" style={{ padding: '8px 14px', cursor: 'pointer', fontSize: '0.86rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Upload size={14} />
                    <span>{isUploadingBanner ? 'กำลังอัปโหลด...' : 'เลือกไฟล์รูปแบนเนอร์จากเครื่อง'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingBanner}
                      onChange={handleBannerImageUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <span style={{ fontSize: '0.82rem', color: 'var(--notion-text-muted)' }}>
                    (ระบบจะย่อขนาดและอัปโหลดไปเก็บที่คลาวด์ให้อัตโนมัติ โหลดเร็วมาก)
                  </span>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--notion-text-muted)', display: 'block', marginBottom: '4px' }}>
                    หรือระบุ URL รูปภาพโดยตรง:
                  </label>
                  <input
                    type="text"
                    value={heroBannerUrl}
                    onChange={(e) => setHeroBannerUrl(e.target.value)}
                    className="notion-input"
                    placeholder="https://... หรือ /banner.png"
                    style={{ fontSize: '0.88rem', padding: '8px 12px' }}
                  />
                </div>
              </div>
            </section>

            {/* SECTION 2: CAROUSEL SLIDES (สไลด์หมุนเวียน) */}
            <section style={{
              backgroundColor: '#ffffff',
              border: '1px solid var(--notion-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={18} color="var(--notion-text)" />
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--notion-text)' }}>
                    2. รูปภาพสไลด์แบนเนอร์ (Carousel Slides)
                  </h2>
                  <span style={{ fontSize: '0.82rem', color: 'var(--notion-text-muted)', background: '#f3f4f6', padding: '2px 8px', borderRadius: '12px' }}>
                    {slides.length} สไลด์
                  </span>
                </div>

                <button
                  onClick={addSlide}
                  className="notion-btn"
                  style={{ fontSize: '0.86rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={15} />
                  <span>เพิ่มรูปสไลด์ใหม่</span>
                </button>
              </div>

              {/* Timing & Autoplay Settings Box */}
              <div style={{
                backgroundColor: '#fbfbfa',
                border: '1px solid var(--notion-border)',
                borderRadius: 'var(--radius-xs)',
                padding: '16px 18px',
                marginBottom: '22px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={16} color="var(--notion-text)" />
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--notion-text)' }}>
                      ตั้งค่าระยะเวลาเปลี่ยนสไลด์ (Slide Duration)
                    </span>
                  </div>

                  {/* Autoplay toggle */}
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.84rem', fontWeight: 500, color: 'var(--notion-text)' }}>
                    <input
                      type="checkbox"
                      checked={isAutoplay}
                      onChange={(e) => setIsAutoplay(e.target.checked)}
                      style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                    />
                    <span>เล่นสไลด์อัตโนมัติ (Autoplay)</span>
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--notion-text-muted)' }}>
                      ระยะเวลาแสดงรูป:
                    </span>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="number"
                        min="1.5"
                        max="30"
                        step="0.5"
                        value={intervalSeconds}
                        onChange={(e) => setIntervalSeconds(Math.max(1, Number(e.target.value)))}
                        className="notion-input"
                        style={{ width: '74px', padding: '6px 8px', fontSize: '0.88rem', textAlign: 'center', fontWeight: 600 }}
                      />
                      <span style={{ fontSize: '0.84rem', color: 'var(--notion-text)' }}>วินาที</span>
                    </div>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--notion-text-muted)' }}>เลือกด่วน:</span>
                    {[3, 4, 5, 6, 8, 10].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setIntervalSeconds(sec)}
                        style={{
                          fontSize: '0.78rem',
                          padding: '3px 9px',
                          borderRadius: '4px',
                          border: '1px solid',
                          borderColor: intervalSeconds === sec ? 'var(--notion-text)' : 'var(--notion-border)',
                          backgroundColor: intervalSeconds === sec ? 'var(--notion-text)' : '#ffffff',
                          color: intervalSeconds === sec ? '#ffffff' : 'var(--notion-text)',
                          cursor: 'pointer',
                          fontWeight: intervalSeconds === sec ? 600 : 400,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {sec} วิ
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Slides List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {slides.map((slide, index) => {
                  const isUploading = uploadingSlideId === slide.id;

                  return (
                    <div
                      key={slide.id || index}
                      style={{
                        backgroundColor: '#fafafa',
                        border: '1px solid var(--notion-border)',
                        borderRadius: 'var(--radius-xs)',
                        padding: '18px'
                      }}
                    >
                      {/* Slide Title Bar */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.96rem', color: 'var(--notion-text)' }}>
                            รูปภาพสไลด์ #{index + 1}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {/* Move Up */}
                          <button
                            onClick={() => moveSlide(index, 'up')}
                            disabled={index === 0}
                            className="notion-btn"
                            style={{ padding: '4px 8px', opacity: index === 0 ? 0.3 : 1 }}
                            title="เลื่อนขึ้น"
                          >
                            <ChevronUp size={14} />
                          </button>

                          {/* Move Down */}
                          <button
                            onClick={() => moveSlide(index, 'down')}
                            disabled={index === slides.length - 1}
                            className="notion-btn"
                            style={{ padding: '4px 8px', opacity: index === slides.length - 1 ? 0.3 : 1 }}
                            title="เลื่อนลง"
                          >
                            <ChevronDown size={14} />
                          </button>

                          {/* Remove */}
                          {slides.length > 1 && (
                            <button
                              onClick={() => removeSlide(slide.id)}
                              className="notion-btn"
                              style={{
                                fontSize: '0.8rem',
                                color: '#dc2626',
                                backgroundColor: '#fef2f2',
                                borderColor: '#fca5a5',
                                padding: '4px 10px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Trash2 size={13} />
                              <span>ลบ</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Image Preview Box */}
                      <div style={{
                        position: 'relative',
                        height: '220px',
                        width: '100%',
                        borderRadius: 'var(--radius-xs)',
                        overflow: 'hidden',
                        border: '1px solid var(--notion-border)',
                        backgroundColor: '#0f0f11',
                        marginBottom: '14px'
                      }}>
                        <img
                          src={slide.imageUrl || '/banner.png'}
                          alt={`Slide ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block'
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/banner.png';
                          }}
                        />

                        {isUploading && (
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            gap: '8px',
                            fontSize: '0.88rem',
                            fontWeight: 600
                          }}>
                            <Loader2 size={18} className="animate-spin" />
                            <span>กำลังอัปโหลดรูปภาพสไลด์...</span>
                          </div>
                        )}
                      </div>

                      {/* Slide Controls */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <label className="notion-btn notion-btn-primary" style={{ padding: '7px 12px', cursor: 'pointer', fontSize: '0.84rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <Upload size={14} />
                            <span>{isUploading ? 'กำลังอัปโหลด...' : 'เลือกไฟล์รูปภาพจากเครื่องเพื่อเปลี่ยน'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={isUploading}
                              onChange={(e) => handleSlideImageUpload(e, slide.id)}
                              style={{ display: 'none' }}
                            />
                          </label>
                          <span style={{ fontSize: '0.8rem', color: 'var(--notion-text-muted)' }}>
                            (รองรับไฟล์ .png, .jpg, .webp)
                          </span>
                        </div>

                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--notion-text-muted)', display: 'block', marginBottom: '4px' }}>
                            URL รูปภาพ:
                          </label>
                          <input
                            type="text"
                            value={slide.imageUrl}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSlides(prev => prev.map(s => s.id === slide.id ? { ...s, imageUrl: val } : s));
                            }}
                            className="notion-input"
                            placeholder="https://... หรือ /banner.png"
                            style={{ fontSize: '0.86rem', padding: '7px 10px' }}
                          />
                        </div>

                        {/* Optional Title & Caption for slide */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                          <div>
                            <label style={{ fontSize: '0.8rem', color: 'var(--notion-text-muted)', display: 'block', marginBottom: '4px' }}>
                              หัวข้อสไลด์ (ไม่บังคับ):
                            </label>
                            <input
                              type="text"
                              value={slide.title || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSlides(prev => prev.map(s => s.id === slide.id ? { ...s, title: val } : s));
                              }}
                              className="notion-input"
                              placeholder="เช่น ผลงานไฮไลท์..."
                              style={{ fontSize: '0.86rem', padding: '7px 10px' }}
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: '0.8rem', color: 'var(--notion-text-muted)', display: 'block', marginBottom: '4px' }}>
                              คำบรรยายสไลด์ (ไม่บังคับ):
                            </label>
                            <input
                              type="text"
                              value={slide.caption || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSlides(prev => prev.map(s => s.id === slide.id ? { ...s, caption: val } : s));
                              }}
                              className="notion-input"
                              placeholder="คำอธิบายสั้นๆ..."
                              style={{ fontSize: '0.86rem', padding: '7px 10px' }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Bottom Save Bar */}
            <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={handleSaveAll}
                className="notion-btn notion-btn-primary"
                style={{ padding: '10px 24px', fontSize: '0.94rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Save size={16} />
                <span>บันทึกการเปลี่ยนแปลงทั้งหมด</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= TAB 2: UPLOAD & MANAGE WORK ================= */}
        {activeTab === 'upload' && (
          <UploadPage
            projects={projects}
            onAddProject={onAddProject}
            onUpdateProject={onUpdateProject}
            onDeleteProject={onDeleteProject}
            onReorderProjects={onReorderProjects}
          />
        )}

      </main>
    </div>
  );
};
