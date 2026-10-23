import React, { useState, useEffect } from 'react';
import { FileText, ExternalLink, Presentation } from 'lucide-react';
import { renderPdfFirstPageToImage } from '../utils/pdfThumbnail';
import { isCanvaUrl, toCanvaEmbedUrl } from '../utils/embedHelper';

interface PdfCardThumbnailProps {
  imageUrl?: string;
  pdfUrl?: string;
  title: string;
}

export const PdfCardThumbnail: React.FC<PdfCardThumbnailProps> = ({
  imageUrl,
  pdfUrl,
  title
}) => {
  const [renderedThumb, setRenderedThumb] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [canvaLoaded, setCanvaLoaded] = useState<boolean>(false);

  const isCanva = isCanvaUrl(pdfUrl) || isCanvaUrl(imageUrl);
  const isGenericLink = !!pdfUrl && !pdfUrl.includes('portfolio-docs') && !pdfUrl.endsWith('.pdf') && !pdfUrl.startsWith('data:');

  const isUnsplashDefault = !imageUrl || imageUrl.includes('unsplash.com');
  const hasValidPdf = !!pdfUrl && (pdfUrl.includes('.pdf') || pdfUrl.startsWith('data:application/pdf') || pdfUrl.includes('portfolio-docs'));

  useEffect(() => {
    // If the imageUrl is an Unsplash placeholder or missing, but we have a PDF url, render page 1 on the fly
    if (isUnsplashDefault && hasValidPdf && !renderedThumb) {
      let isMounted = true;
      setIsLoading(true);

      renderPdfFirstPageToImage(pdfUrl)
        .then((dataUrl) => {
          if (isMounted) {
            if (dataUrl) {
              setRenderedThumb(dataUrl);
            }
            setIsLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) setIsLoading(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [imageUrl, pdfUrl, isUnsplashDefault, hasValidPdf]);

  // 1. Canva Presentation Live Slide / Thumbnail Preview (Prioritized so no broken image or placeholder flashes)
  if (isCanva) {
    const embedSrc = toCanvaEmbedUrl(pdfUrl || imageUrl || '');
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          backgroundColor: '#f9fafb',
          overflow: 'hidden'
        }}
      >
        {/* Minimalist Notion-style neutral skeleton while Canva bootstraps */}
        {!canvaLoaded && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: '#f9fafb',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
              transition: 'opacity 0.25s ease'
            }}
          >
            {/* Elegant Minimalist Spinner */}
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                border: '2px solid #e5e7eb',
                borderTopColor: '#4b5563',
                animation: 'spin 0.8s linear infinite',
                marginBottom: '10px'
              }}
            />
            <span
              style={{
                fontSize: '0.78rem',
                color: '#6b7280',
                fontWeight: 500,
                letterSpacing: '0.01em',
                fontFamily: 'inherit'
              }}
            >
              กำลังโหลดสไลด์...
            </span>
          </div>
        )}

        {embedSrc ? (
          <div
            style={{
              position: 'absolute',
              top: '-10px',
              left: '-10px',
              right: '-10px',
              bottom: '-52px', // Extends iframe downwards so bottom toolbar is hidden regardless of aspect ratio
              overflow: 'hidden'
            }}
          >
            <iframe
              src={embedSrc}
              title={title}
              loading="lazy"
              allow="fullscreen; autoplay"
              onLoad={() => setCanvaLoaded(true)}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                pointerEvents: 'none', // Prevents capturing card click events
                transform: 'scale(1.05)', // fills card nicely for landscape / presentation mode
                transformOrigin: 'center center',
                opacity: canvaLoaded ? 1 : 0,
                transition: 'opacity 0.25s ease'
              }}
            />
          </div>
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#f9fafb',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              color: '#6b7280'
            }}
          >
            <Presentation size={32} color="#6b7280" />
          </div>
        )}
      </div>
    );
  }

  // 2. Normal Image / Rendered PDF first-page thumbnail
  const displaySrc = renderedThumb || (imageUrl && !isUnsplashDefault ? imageUrl : null);

  if (displaySrc && !hasError) {
    return (
      <img
        src={displaySrc}
        alt={title}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transition: 'transform 0.2s ease'
        }}
        onError={() => setHasError(true)}
      />
    );
  }

  // Generic External Link Badge
  if (isGenericLink && !hasValidPdf) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          color: '#1e40af',
          position: 'relative',
          userSelect: 'none'
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            backgroundColor: '#ffffff',
            border: '1px solid #bfdbfe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(30, 64, 175, 0.08)',
            marginBottom: '8px'
          }}
        >
          <ExternalLink size={26} color="#2563eb" />
        </div>
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e40af' }}>
          Web Link
        </span>
      </div>
    );
  }

  // Fallback: Elegant Notion-like PDF document presentation preview
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        position: 'relative',
        userSelect: 'none'
      }}
    >
      <div
        style={{
          width: '68px',
          height: '84px',
          backgroundColor: '#ffffff',
          borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          transition: 'transform 0.2s ease'
        }}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            backgroundColor: '#fee2e2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <FileText size={16} color="#dc2626" />
        </div>
        <span
          style={{
            fontSize: '0.62rem',
            fontWeight: 700,
            color: '#dc2626',
            letterSpacing: '0.04em'
          }}
        >
          PDF
        </span>
      </div>

      <div
        style={{
          marginTop: '12px',
          fontSize: '0.78rem',
          fontWeight: 500,
          color: '#64748b',
          maxWidth: '85%',
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        {isLoading ? 'กำลังโหลดหน้าแรก...' : (title || 'เอกสาร PDF')}
      </div>
    </div>
  );
};
