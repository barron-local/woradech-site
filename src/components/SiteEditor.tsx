import React, { useState } from 'react';
import type { SiteConfig, PortfolioItem, CarouselSlide } from '../types';
import { UploadPage } from './UploadPage';
import { ArrowLeft, Save, Plus, Trash2, Upload, CheckCircle2, Layers, FileText } from 'lucide-react';

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
  // Only 2 tabs: 'carousel' and 'upload'
  const [activeTab, setActiveTab] = useState<'carousel' | 'upload'>('carousel');
  const [slides, setSlides] = useState<CarouselSlide[]>(config.carousel.slides || []);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Handle uploading image file from computer for a slide
  const handleSlideImageUpload = (e: React.ChangeEvent<HTMLInputElement>, slideId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const resultUrl = reader.result as string;
        setSlides(prev => prev.map(s => s.id === slideId ? { ...s, imageUrl: resultUrl } : s));
      };
      reader.readAsDataURL(file);
    }
  };

  const addSlide = () => {
    const newSlide: CarouselSlide = {
      id: "slide-" + Date.now(),
      title: "",
      caption: "",
      imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
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

  const handleSaveCarousel = () => {
    const updatedConfig: SiteConfig = {
      ...config,
      carousel: {
        ...config.carousel,
        slides: slides
      }
    };
    onUpdateConfig(updatedConfig);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
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
      <header style={{
        height: '54px',
        borderBottom: '1px solid var(--notion-border)',
        backgroundColor: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        {/* Left: Back */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={onCloseEditor}
            className="notion-btn"
            style={{
              fontSize: '0.86rem',
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--notion-border)',
              backgroundColor: '#ffffff'
            }}
          >
            <ArrowLeft size={15} />
            <span>กลับหน้าหลัก (Back to Site)</span>
          </button>
        </div>

        {/* Right: Modern Prominent Tabs Switcher */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <button
            onClick={() => setActiveTab('carousel')}
            style={{
              fontSize: '0.92rem',
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
            <span style={{ whiteSpace: 'nowrap' }}>1. จัดการรูปภาพ Carousel</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            style={{
              fontSize: '0.92rem',
              fontWeight: activeTab === 'upload' ? 700 : 500,
              backgroundColor: activeTab === 'upload' ? 'var(--notion-text)' : '#ffffff',
              color: activeTab === 'upload' ? '#ffffff' : 'var(--notion-text)',
              border: '1.5px solid',
              borderColor: activeTab === 'upload' ? 'var(--notion-text)' : 'var(--notion-border)',
              borderRadius: 'var(--radius-xs)',
              boxShadow: activeTab === 'upload' ? '0 2px 6px rgba(0,0,0,0.15)' : '0 1px 2px rgba(0,0,0,0.03)',
              padding: '8px 18px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <FileText size={17} strokeWidth={activeTab === 'upload' ? 2.2 : 1.8} />
            <span style={{ whiteSpace: 'nowrap' }}>2. จัดการไฟล์งาน (PDF & รูปภาพ)</span>
          </button>
        </div>
      </header>

      {/* 2. Main Content Area */}
      <main style={{ flex: 1, padding: '36px 20px', maxWidth: '860px', width: '100%', margin: '0 auto' }}>

        {/* ================= TAB 1: CAROUSEL IMAGES ================= */}
        {activeTab === 'carousel' && (
          <div>
            {/* Header info */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--notion-text)', margin: 0 }}>
                  จัดการรูปภาพ Carousel Banner
                </h1>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                <button
                  onClick={addSlide}
                  className="notion-btn"
                  style={{ fontSize: '0.88rem', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  <Plus size={15} />
                  <span style={{ whiteSpace: 'nowrap' }}>เพิ่มรูปสไลด์</span>
                </button>

                <button
                  onClick={handleSaveCarousel}
                  className="notion-btn notion-btn-primary"
                  style={{ fontSize: '0.88rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  <Save size={15} />
                  <span style={{ whiteSpace: 'nowrap' }}>บันทึกการเปลี่ยนแปลง</span>
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
                marginBottom: '20px'
              }}>
                <CheckCircle2 size={18} />
                <span>บันทึกรูปภาพ Carousel เรียบร้อยแล้ว! หน้าเว็บจะแสดงภาพใหม่ทันที</span>
              </div>
            )}

            {/* Slides List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {slides.map((slide, index) => (
                <div
                  key={slide.id || index}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--notion-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--notion-text)' }}>
                        รูปภาพสไลด์ #{index + 1}
                      </span>
                    </div>

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
                        <span>ลบรูปนี้</span>
                      </button>
                    )}
                  </div>

                  {/* Image Preview Box */}
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
                      src={slide.imageUrl}
                      alt={`Slide ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80";
                      }}
                    />
                  </div>

                  {/* Change Image Options */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <label className="notion-btn notion-btn-primary" style={{ padding: '8px 14px', cursor: 'pointer', fontSize: '0.86rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Upload size={14} />
                        <span>เลือกไฟล์รูปภาพจากเครื่องเพื่อเปลี่ยน</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleSlideImageUpload(e, slide.id)}
                          style={{ display: 'none' }}
                        />
                      </label>
                      <span style={{ fontSize: '0.82rem', color: 'var(--notion-text-muted)' }}>
                        (รองรับไฟล์ .png, .jpg, .webp)
                      </span>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.82rem', color: 'var(--notion-text-muted)', display: 'block', marginBottom: '4px' }}>
                        หรือระบุ URL รูปภาพโดยตรง:
                      </label>
                      <input
                        type="text"
                        value={slide.imageUrl}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSlides(prev => prev.map(s => s.id === slide.id ? { ...s, imageUrl: val } : s));
                        }}
                        className="notion-input"
                        placeholder="https://images.unsplash.com/..."
                        style={{ fontSize: '0.88rem', padding: '8px 12px' }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Save Bar */}
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={handleSaveCarousel}
                className="notion-btn notion-btn-primary"
                style={{ padding: '10px 24px', fontSize: '0.92rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
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
