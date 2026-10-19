import React, { useState, useEffect } from 'react';
import { renderAllPdfPages } from '../utils/pdfThumbnail';
import { ExternalLink, Loader2 } from 'lucide-react';

interface PdfDocViewerProps {
  url: string;
  title: string;
}

export const PdfDocViewer: React.FC<PdfDocViewerProps> = ({ url, title }) => {
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [useIframeFallback, setUseIframeFallback] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setPages([]);
    setUseIframeFallback(false);

    renderAllPdfPages(url, (current, total) => {
      if (isMounted) {
        setProgress({ current, total });
      }
    })
      .then((renderedPages) => {
        if (!isMounted) return;
        if (renderedPages && renderedPages.length > 0) {
          setPages(renderedPages);
          setLoading(false);
        } else {
          // If PDF.js fails (e.g. CORS or security restrictions), fallback to native iframe
          setUseIframeFallback(true);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setUseIframeFallback(true);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [url]);

  if (useIframeFallback) {
    return (
      <iframe
        src={url}
        title={title}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block'
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#18181b',
        overflowY: 'auto',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 16px',
        gap: '20px'
      }}
    >
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '12px', color: '#ffffff' }}>
          <Loader2 size={32} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '0.92rem', color: '#a1a1aa' }}>
            {progress.total > 0
              ? `กำลังโหลดหน้าเอกสาร (${progress.current} / ${progress.total} หน้า)...`
              : 'กำลังเตรียมหน้าเอกสาร PDF...'}
          </span>
        </div>
      )}

      {!loading && pages.map((pageSrc, idx) => (
        <div
          key={idx}
          style={{
            maxWidth: '900px',
            width: '100%',
            backgroundColor: '#ffffff',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45)',
            borderRadius: '4px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <img
            src={pageSrc}
            alt={`${title} - หน้า ${idx + 1}`}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block'
            }}
          />
          <div style={{
            padding: '6px 12px',
            backgroundColor: '#fafafa',
            borderTop: '1px solid #f0f0f0',
            textAlign: 'right',
            fontSize: '0.72rem',
            color: '#71717a'
          }}>
            หน้า {idx + 1} จาก {pages.length}
          </div>
        </div>
      ))}

      {/* Floating Toolbar for Open in New Tab */}
      <div style={{
        position: 'sticky',
        bottom: '16px',
        marginTop: '8px',
        backgroundColor: 'rgba(24, 24, 27, 0.85)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '30px',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)'
      }}>
        <span style={{ fontSize: '0.8rem', color: '#e4e4e7' }}>
          {pages.length > 0 ? `รวมทั้งหมด ${pages.length} หน้า (เลื่อนลงเพื่อดูทุกหน้า)` : title}
        </span>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.78rem',
            color: '#60a5fa',
            textDecoration: 'none',
            fontWeight: 500
          }}
        >
          <ExternalLink size={13} />
          เปิดไฟล์ต้นฉบับ
        </a>
      </div>
    </div>
  );
};
