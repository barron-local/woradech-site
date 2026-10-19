import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { CarouselSlide } from '../types';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

interface CarouselProps {
  slides: CarouselSlide[];
  autoplay?: boolean;
  interval?: number;
  title?: string;
  subtitle?: string;
}

export const Carousel: React.FC<CarouselProps> = ({
  slides,
  autoplay = true,
  interval = 4500,
  title,
  subtitle
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  // 1. Preload all slide images into browser cache so switching is 100% instantaneous
  useEffect(() => {
    if (!slides || slides.length === 0) return;
    slides.forEach((slide) => {
      if (slide.imageUrl) {
        const img = new Image();
        img.src = slide.imageUrl;
      }
    });
  }, [slides]);

  // 2. Navigation handlers
  const nextSlide = useCallback(() => {
    if (slides.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    if (slides.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goToSlide = (idx: number) => {
    if (idx !== currentIndex) {
      setCurrentIndex(idx);
    }
  };

  // 3. Autoplay timer (pauses when hovered or user is interacting)
  useEffect(() => {
    if (!autoplay || slides.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoplay, interval, slides.length, isPaused, currentIndex]);

  // 4. Touch swipe gesture handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  };

  // 5. Keyboard arrow navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      prevSlide();
    } else if (e.key === 'ArrowRight') {
      nextSlide();
    }
  };

  // 6. Handle clicking slide with link
  const handleSlideClick = (link?: string) => {
    if (!link) return;
    if (link.startsWith('#')) {
      const el = document.querySelector(link);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else if (link.startsWith('http')) {
      window.open(link, '_blank', 'noreferrer');
    }
  };

  if (!slides || slides.length === 0) return null;

  return (
    <section
      id="home-carousel"
      className="search-scroll-target"
      style={{ maxWidth: '1080px', margin: '48px auto', padding: '0 24px' }}
      aria-roledescription="carousel"
      aria-label={title || "Featured Highlights Carousel"}
    >
      {/* Title Header */}
      {title && (
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--notion-text)', marginBottom: '4px', letterSpacing: '-0.02em' }}>
            {title}
          </h2>
          {subtitle && (
            <p style={{ fontSize: '0.95rem', color: 'var(--notion-text-muted)', margin: 0 }}>
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Main Carousel Frame Container */}
      <div
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'relative',
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
          border: '1px solid var(--notion-border)',
          boxShadow: '0 4px 20px rgba(15, 15, 15, 0.05)',
          backgroundColor: '#0c0c0e',
          outline: 'none'
        }}
      >
        {/* Slide Frame with Layered Crossfade */}
        <div
          className="carousel-slide-frame"
          style={{
            position: 'relative',
            height: '440px',
            width: '100%',
            overflow: 'hidden'
          }}
        >
          {slides.map((slide, idx) => {
            const isActive = idx === currentIndex;
            const hasLink = !!slide.link;

            return (
              <div
                key={slide.id || idx}
                className="carousel-slide-item"
                aria-hidden={!isActive}
                onClick={() => isActive && hasLink && handleSlideClick(slide.link)}
                style={{
                  opacity: isActive ? 1 : 0,
                  visibility: isActive ? 'visible' : 'hidden',
                  zIndex: isActive ? 2 : 1,
                  cursor: hasLink && isActive ? 'pointer' : 'default',
                  pointerEvents: isActive ? 'auto' : 'none'
                }}
              >
                {/* Image with subtle Cinematic Zoom on Active State */}
                <img
                  src={slide.imageUrl || '/banner.png'}
                  alt={slide.title || `Slide ${idx + 1}`}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/banner.png';
                  }}
                  className="carousel-slide-img"
                  style={{
                    transform: isActive ? 'scale(1)' : 'scale(1.045)'
                  }}
                />

                {/* Subtle Ambient Shadow Overlay for depth & text readability */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: (slide.title || slide.caption)
                      ? 'linear-gradient(to top, rgba(12, 12, 14, 0.88) 0%, rgba(12, 12, 14, 0.35) 48%, transparent 82%)'
                      : 'linear-gradient(to top, rgba(12, 12, 14, 0.25) 0%, transparent 40%)',
                    pointerEvents: 'none'
                  }}
                />

                {/* Slide Caption Overlay with Staggered Entrance */}
                {(slide.title || slide.caption || hasLink) && (
                  <div
                    className="carousel-caption-overlay"
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: '30px 36px',
                      color: '#ffffff',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-end',
                      gap: '20px',
                      zIndex: 3,
                      transform: isActive ? 'translateY(0)' : 'translateY(16px)',
                      opacity: isActive ? 1 : 0,
                      transition: 'transform 600ms cubic-bezier(0.16, 1, 0.3, 1) 120ms, opacity 600ms cubic-bezier(0.16, 1, 0.3, 1) 120ms',
                      pointerEvents: 'none'
                    }}
                  >
                    <div style={{ maxWidth: '720px' }}>
                      {slide.title && (
                        <h3 style={{
                          fontSize: '1.42rem',
                          fontWeight: 700,
                          color: '#ffffff',
                          marginBottom: '6px',
                          letterSpacing: '-0.02em',
                          textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                        }}>
                          {slide.title}
                        </h3>
                      )}
                      {slide.caption && (
                        <p style={{
                          fontSize: '0.94rem',
                          color: 'rgba(255, 255, 255, 0.88)',
                          lineHeight: 1.5,
                          margin: 0,
                          textShadow: '0 1px 6px rgba(0,0,0,0.4)'
                        }}>
                          {slide.caption}
                        </p>
                      )}
                    </div>

                    {hasLink && (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 14px',
                          borderRadius: '20px',
                          backgroundColor: 'rgba(255, 255, 255, 0.2)',
                          backdropFilter: 'blur(8px)',
                          WebkitBackdropFilter: 'blur(8px)',
                          border: '1px solid rgba(255, 255, 255, 0.35)',
                          color: '#ffffff',
                          fontSize: '0.82rem',
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          pointerEvents: 'auto'
                        }}
                      >
                        <span>ดูรายละเอียด</span>
                        <ExternalLink size={13} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Navigation Arrows (Glassmorphic) */}
          {slides.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevSlide();
                }}
                className="carousel-nav-btn"
                style={{ left: '16px' }}
                aria-label="Previous slide"
              >
                <ChevronLeft size={20} strokeWidth={2.2} />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextSlide();
                }}
                className="carousel-nav-btn"
                style={{ right: '16px' }}
                aria-label="Next slide"
              >
                <ChevronRight size={20} strokeWidth={2.2} />
              </button>
            </>
          )}

          {/* Sleek Autoplay Progress Bar at bottom of frame */}
          {autoplay && slides.length > 1 && (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '3px',
                backgroundColor: 'rgba(255, 255, 255, 0.18)',
                zIndex: 8,
                overflow: 'hidden'
              }}
            >
              <div
                key={`${currentIndex}-${isPaused}`}
                style={{
                  height: '100%',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 0 8px rgba(255, 255, 255, 0.75)',
                  width: isPaused ? '0%' : '100%',
                  animation: isPaused ? 'none' : `carouselProgress ${interval}ms linear forwards`
                }}
              />
            </div>
          )}
        </div>

        {/* Dots Indicator (Preserving user's requested circular dot style) */}
        {slides.length > 1 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '13px 16px',
              backgroundColor: '#ffffff',
              borderTop: '1px solid var(--notion-border)'
            }}
          >
            {slides.map((_, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={idx}
                  onClick={() => goToSlide(idx)}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: isActive ? 'var(--notion-text)' : 'var(--notion-border-dark)',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    transform: isActive ? 'scale(1.3)' : 'scale(1)',
                    opacity: isActive ? 1 : 0.45,
                    boxShadow: isActive ? '0 0 0 3px rgba(37, 99, 235, 0.16)' : 'none',
                    transition: 'all 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
                    outline: 'none'
                  }}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
