import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  ExternalLink,
  Loader2,
  AlertCircle,
  ChevronDown
} from 'lucide-react';

// Configure worker if not already set
if (typeof window !== 'undefined' && 'Worker' in window && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

interface PdfDocViewerProps {
  url: string;
  title: string;
}

// Subcomponent to render a single page onto a canvas with High-DPI support
const PdfCanvasPage: React.FC<{
  pdfDoc: any;
  pageNum: number;
  zoom: number;
  rotation: number;
  containerWidth: number;
  totalCount: number;
}> = ({
  pdfDoc,
  pageNum,
  zoom,
  rotation,
  containerWidth,
  totalCount
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<any>(null);
  const [rendering, setRendering] = useState<boolean>(true);
  const [renderError, setRenderError] = useState<boolean>(false);

  useEffect(() => {
    let isCancelled = false;

    async function renderPage() {
      if (!pdfDoc || !canvasRef.current) return;
      setRendering(true);
      setRenderError(false);

      try {
        const page = await pdfDoc.getPage(pageNum);
        if (isCancelled) return;

        // Base unscaled viewport
        const unscaledViewport = page.getViewport({ scale: 1, rotation });

        // Calculate scale
        const availableWidth = Math.min(containerWidth > 0 ? containerWidth - 48 : 860, 860);
        const baseScale = Math.max(0.6, availableWidth / unscaledViewport.width);

        const effectiveScale = baseScale * zoom;
        const viewport = page.getViewport({ scale: effectiveScale, rotation });

        const canvas = canvasRef.current;
        if (!canvas) return;

        // High DPI scaling (Retina displays)
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;
        ctx.scale(dpr, dpr);

        // Cancel previous ongoing render task if any
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch {}
        }

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport
        };

        const task = page.render(renderContext);
        renderTaskRef.current = task;
        await task.promise;

        if (!isCancelled) {
          setRendering(false);
        }
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException' && !isCancelled) {
          console.warn(`Error rendering page ${pageNum}:`, err);
          setRenderError(true);
          setRendering(false);
        }
      }
    }

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {}
      }
    };
  }, [pdfDoc, pageNum, zoom, rotation, containerWidth]);

  return (
    <div
      id={`pdf-page-${pageNum}`}
      data-page-num={pageNum}
      className="pdf-page-container"
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '6px',
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.2), 0 2px 6px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid var(--notion-border)',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        margin: '0 auto',
        maxWidth: '100%',
        scrollMarginTop: '16px'
      }}
    >
      {rendering && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.75)',
            backdropFilter: 'blur(2px)',
            zIndex: 2,
            minHeight: '400px'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <Loader2 size={24} className="animate-spin" style={{ color: '#2563eb' }} />
            <span style={{ fontSize: '0.78rem', color: '#71717a' }}>กำลังโหลดหน้า {pageNum}...</span>
          </div>
        </div>
      )}

      {renderError ? (
        <div
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            color: '#71717a',
            fontSize: '0.85rem'
          }}
        >
          ไม่สามารถแสดงผลหน้า {pageNum} ได้
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            maxWidth: '100%',
            height: 'auto'
          }}
        />
      )}

      {/* Notion Page Badge */}
      <div
        style={{
          width: '100%',
          padding: '6px 14px',
          backgroundColor: '#fafafa',
          borderTop: '1px solid #f4f4f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.74rem',
          color: '#71717a',
          fontWeight: 500
        }}
      >
        <span style={{ color: '#a1a1aa' }}>หน้า {pageNum}</span>
        <span>จาก {totalCount} หน้า</span>
      </div>
    </div>
  );
};

export const PdfDocViewer: React.FC<PdfDocViewerProps> = ({ url, title }) => {
  const [pdfDoc, setPdfDoc] = useState<any | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [activePage, setActivePage] = useState<number>(1);

  // Zoom & View Options
  const [zoom, setZoom] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);

  // Loading & Error States
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [useIframeFallback, setUseIframeFallback] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(800);

  // Measure container width for responsive scaling
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Load PDF Document
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setErrorMsg(null);
    setUseIframeFallback(false);
    setActivePage(1);
    setZoom(1.0);
    setRotation(0);

    async function loadPdf() {
      try {
        let loadingTask: any;

        if (typeof url === 'string' && url.startsWith('data:')) {
          // Decode data URL safely into Uint8Array
          const base64Data = url.split(',')[1];
          const binaryString = window.atob(base64Data);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          loadingTask = pdfjsLib.getDocument({ data: bytes });
        } else {
          // Standard URL
          loadingTask = pdfjsLib.getDocument({ url });
        }

        const doc = await loadingTask.promise;
        if (isCancelled) return;

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setLoading(false);
      } catch (err: any) {
        console.warn('PDF.js failed to load document:', err);
        if (!isCancelled) {
          setUseIframeFallback(true);
          setLoading(false);
        }
      }
    }

    loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [url]);

  // Track active page while scrolling using IntersectionObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container || numPages === 0) return;

    const pageElements = container.querySelectorAll('.pdf-page-container');
    if (!pageElements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const pageNum = Number(entry.target.getAttribute('data-page-num'));
            if (pageNum) {
              setActivePage(pageNum);
            }
          }
        }
      },
      {
        root: container,
        threshold: 0.3
      }
    );

    pageElements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [numPages, loading]);

  // Jump to specific page
  const handleJumpToPage = (pageNum: number) => {
    const target = document.getElementById(`pdf-page-${pageNum}`);
    if (target && containerRef.current) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActivePage(pageNum);
    }
  };

  // Zoom Handlers
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(2.5, Math.round((prev + 0.15) * 100) / 100));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(0.5, Math.round((prev - 0.15) * 100) / 100));
  };

  const handleResetZoom = () => {
    setZoom(1.0);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Download Handler
  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title || 'document'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.open(url, '_blank');
    }
  };

  // Keyboard Shortcuts Support (+, -, 0)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        handleResetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Native iframe fallback if PDF.js fails
  if (useIframeFallback) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            padding: '8px 16px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.82rem',
            color: '#71717a'
          }}
        >
          <span>แสดงผ่านตัวอ่านเบราว์เซอร์เริ่มต้น</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleDownload}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                backgroundColor: '#ffffff',
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              <Download size={13} />
              ดาวน์โหลด PDF
            </button>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontSize: '0.78rem',
                textDecoration: 'none',
                fontWeight: 500
              }}
            >
              <ExternalLink size={13} />
              เปิดแท็บใหม่
            </a>
          </div>
        </div>
        <iframe
          src={url}
          title={title}
          style={{
            width: '100%',
            flex: 1,
            border: 'none',
            display: 'block'
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f7f7f5',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Notion-style Clean Sticky Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          padding: '8px 16px',
          backgroundColor: 'var(--notion-bg)',
          borderBottom: '1px solid var(--notion-border)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          zIndex: 10
        }}
      >
        {/* Left Section: Page Selector & Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {numPages > 0 && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 8px',
                backgroundColor: 'var(--notion-sidebar)',
                borderRadius: '6px',
                border: '1px solid var(--notion-border)',
                fontSize: '0.8rem',
                color: 'var(--notion-text)',
                fontWeight: 500
              }}
            >
              <span>หน้า</span>
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                <select
                  value={activePage}
                  onChange={(e) => handleJumpToPage(Number(e.target.value))}
                  style={{
                    appearance: 'none',
                    backgroundColor: 'var(--notion-bg)',
                    border: '1px solid var(--notion-border-dark)',
                    borderRadius: '4px',
                    padding: '2px 20px 2px 8px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--notion-text)',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  {Array.from({ length: numPages }, (_, i) => i + 1).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={12}
                  style={{
                    position: 'absolute',
                    right: '6px',
                    pointerEvents: 'none',
                    color: 'var(--notion-text-muted)'
                  }}
                />
              </div>
              <span style={{ color: 'var(--notion-text-muted)' }}>/ {numPages}</span>
            </div>
          )}
        </div>

        {/* Center Section: Zoom & Rotate Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Zoom Out */}
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={loading || zoom <= 0.5}
            title="ย่อขนาด (-)"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '30px',
              height: '30px',
              borderRadius: '6px',
              border: '1px solid var(--notion-border)',
              backgroundColor: 'var(--notion-bg)',
              color: 'var(--notion-text)',
              cursor: 'pointer'
            }}
          >
            <ZoomOut size={14} />
          </button>

          {/* Zoom Percentage / Reset to 100% */}
          <button
            type="button"
            onClick={handleResetZoom}
            title="รีเซ็ตขนาด 100% (กด 0)"
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid var(--notion-border)',
              backgroundColor: zoom === 1.0 ? 'var(--notion-blue-bg)' : 'var(--notion-bg)',
              color: zoom === 1.0 ? 'var(--notion-blue)' : 'var(--notion-text)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              minWidth: '54px',
              textAlign: 'center'
            }}
          >
            {`${Math.round(zoom * 100)}%`}
          </button>

          {/* Zoom In */}
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={loading || zoom >= 2.5}
            title="ขยายขนาด (+)"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '30px',
              height: '30px',
              borderRadius: '6px',
              border: '1px solid var(--notion-border)',
              backgroundColor: 'var(--notion-bg)',
              color: 'var(--notion-text)',
              cursor: 'pointer'
            }}
          >
            <ZoomIn size={14} />
          </button>

          {/* Rotate 90deg */}
          <button
            type="button"
            onClick={handleRotate}
            title="หมุนตามเข็มนาฬิกา 90°"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '30px',
              height: '30px',
              borderRadius: '6px',
              border: '1px solid var(--notion-border)',
              backgroundColor: rotation > 0 ? 'var(--notion-green-bg)' : 'var(--notion-bg)',
              color: rotation > 0 ? '#16a34a' : 'var(--notion-text)',
              cursor: 'pointer'
            }}
          >
            <RotateCw size={14} />
          </button>
        </div>
      </div>

      {/* Main Continuous Scroll Canvas Viewer */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          width: '100%',
          height: '100%',
          overflowX: 'auto',
          overflowY: 'auto',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: 'var(--notion-sidebar)'
        }}
      >
        {loading && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '360px',
              gap: '12px',
              color: '#71717a'
            }}
          >
            <Loader2 size={32} className="animate-spin" style={{ color: '#2563eb' }} />
            <span style={{ fontSize: '0.92rem', color: '#71717a', fontWeight: 500 }}>
              กำลังโหลดเอกสาร PDF...
            </span>
          </div>
        )}

        {errorMsg && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '300px',
              gap: '12px',
              color: '#ef4444'
            }}
          >
            <AlertCircle size={32} />
            <span style={{ fontSize: '0.92rem' }}>{errorMsg}</span>
            <button
              onClick={() => setUseIframeFallback(true)}
              style={{
                marginTop: '8px',
                padding: '6px 14px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                fontSize: '0.82rem'
              }}
            >
              เปิดผ่านตัวอ่านเบราว์เซอร์
            </button>
          </div>
        )}

        {!loading && !errorMsg && pdfDoc && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              width: '100%',
              alignItems: 'center'
            }}
          >
            {Array.from({ length: numPages }, (_, i) => i + 1).map((pNum) => (
              <PdfCanvasPage
                key={pNum}
                pdfDoc={pdfDoc}
                pageNum={pNum}
                zoom={zoom}
                rotation={rotation}
                containerWidth={containerWidth}
                totalCount={numPages}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
