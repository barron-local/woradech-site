import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { renderPdfFirstPageToImage } from '../utils/pdfThumbnail';

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
