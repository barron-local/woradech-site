import React, { useState, useEffect } from 'react';
import type { CarouselSlide } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  interval = 4000,
  title,
  subtitle
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!autoplay || slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, interval);
    return () => clearInterval(timer);
  }, [autoplay, interval, slides.length]);

  if (!slides || slides.length === 0) return null;

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const current = slides[currentIndex];

  return (
    <section style={{ maxWidth: '1080px', margin: '48px auto', padding: '0 24px' }}>
      {title && (
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--notion-text)', marginBottom: '4px' }}>
            {title}
          </h2>
          {subtitle && (
            <p style={{ fontSize: '0.95rem', color: 'var(--notion-text-muted)' }}>
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Main Carousel Frame */}
      <div style={{
        position: 'relative',
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
        border: '1px solid var(--notion-border)',
        boxShadow: '0 2px 8px rgba(15, 15, 15, 0.04)',
        backgroundColor: '#ffffff'
      }}>
        {/* Slide Image */}
        <div className="carousel-slide-frame" style={{ position: 'relative', height: '440px', width: '100%', overflow: 'hidden' }}>
          <img
            src={current.imageUrl}
            alt={current.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              transition: 'opacity 0.4s ease'
            }}
          />

          {/* Slide Caption Overlay (Only when title or caption is provided) */}
          {(current.title || current.caption) && (
            <div className="carousel-caption-overlay" style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '24px 28px',
              background: 'linear-gradient(to top, rgba(15, 15, 15, 0.85) 0%, rgba(15, 15, 15, 0.4) 60%, transparent 100%)',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: '16px'
            }}>
              <div>
                {current.title && (
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
                    {current.title}
                  </h3>
                )}
                {current.caption && (
                  <p style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.8)', maxWidth: '640px' }}>
                    {current.caption}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            aria-label="Previous slide"
            style={{
              position: 'absolute',
              top: '50%',
              left: '14px',
              transform: 'translateY(-50%)',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid var(--notion-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--notion-text)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
            }}
          >
            <ChevronLeft size={18} />
          </button>

          <button
            onClick={nextSlide}
            aria-label="Next slide"
            style={{
              position: 'absolute',
              top: '50%',
              right: '14px',
              transform: 'translateY(-50%)',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid var(--notion-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--notion-text)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Dots Indicator */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          padding: '12px',
          backgroundColor: '#ffffff',
          borderTop: '1px solid var(--notion-border)'
        }}>
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              style={{
                width: idx === currentIndex ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: idx === currentIndex ? 'var(--notion-text)' : 'var(--notion-border-dark)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
