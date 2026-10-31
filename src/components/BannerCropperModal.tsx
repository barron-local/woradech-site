import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Check, X, Move, Scissors } from 'lucide-react';

interface BannerCropperModalProps {
  imageSrc: string;
  initialAspectRatio?: number; // e.g. 3.2 (width / height)
  onCrop: (croppedDataUrl: string, croppedBlob: Blob) => void;
  onClose: () => void;
  title?: string;
}

const ASPECT_RATIOS = [
  { label: '4 : 1 (พาโนรามา)', value: 4.0 },
  { label: '3.2 : 1 (มาตรฐาน)', value: 3.2 },
  { label: '2.5 : 1 (กว้างปานกลาง)', value: 2.5 },
  { label: '16 : 9 (จอกว้าง)', value: 16 / 9 }
];

export const BannerCropperModal: React.FC<BannerCropperModalProps> = ({
  imageSrc,
  initialAspectRatio = 3.2,
  onCrop,
  onClose,
  title = 'ครอบตัดและจัดตำแหน่งภาพแบนเนอร์'
}) => {
  const [aspectRatio, setAspectRatio] = useState<number>(initialAspectRatio);
  const [zoom, setZoom] = useState<number>(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [frameSize, setFrameSize] = useState<{ width: number; height: number }>({ width: 640, height: 200 });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Compute crop frame dimensions based on container width and aspect ratio
  const updateFrameDimensions = useCallback(() => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth;
    const maxFrameWidth = Math.min(containerWidth - 32, 760);
    const calculatedHeight = Math.round(maxFrameWidth / aspectRatio);

    // Limit max height so it fits well on laptop screens
    const maxAllowedHeight = Math.min(window.innerHeight * 0.42, 320);
    let finalWidth = maxFrameWidth;
    let finalHeight = calculatedHeight;

    if (calculatedHeight > maxAllowedHeight) {
      finalHeight = maxAllowedHeight;
      finalWidth = Math.round(finalHeight * aspectRatio);
    }

    setFrameSize({
      width: Math.max(260, finalWidth),
      height: Math.max(70, finalHeight)
    });
  }, [aspectRatio]);

  useEffect(() => {
    updateFrameDimensions();
    window.addEventListener('resize', updateFrameDimensions);
    return () => window.removeEventListener('resize', updateFrameDimensions);
  }, [updateFrameDimensions]);

  // Load natural dimensions of source image
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  // Base scale calculation so image always fills the frame
  const getScaleInfo = useCallback(() => {
    if (!naturalSize.width || !naturalSize.height) {
      return { baseScale: 1, currentScale: 1, dispW: frameSize.width, dispH: frameSize.height, maxOffsetX: 0, maxOffsetY: 0 };
    }
    const scaleX = frameSize.width / naturalSize.width;
    const scaleY = frameSize.height / naturalSize.height;
    const baseScale = Math.max(scaleX, scaleY);
    const currentScale = baseScale * zoom;

    const dispW = naturalSize.width * currentScale;
    const dispH = naturalSize.height * currentScale;

    const maxOffsetX = Math.max(0, (dispW - frameSize.width) / 2);
    const maxOffsetY = Math.max(0, (dispH - frameSize.height) / 2);

    return { baseScale, currentScale, dispW, dispH, maxOffsetX, maxOffsetY };
  }, [naturalSize, frameSize, zoom]);

  // Clamp offset when zoom or frame changes
  useEffect(() => {
    const { maxOffsetX, maxOffsetY } = getScaleInfo();
    setOffset((prev) => ({
      x: Math.max(-maxOffsetX, Math.min(maxOffsetX, prev.x)),
      y: Math.max(-maxOffsetY, Math.min(maxOffsetY, prev.y))
    }));
  }, [zoom, aspectRatio, frameSize, getScaleInfo]);

  // Mouse & Touch Dragging Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const { maxOffsetX, maxOffsetY } = getScaleInfo();
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    setOffset({
      x: Math.max(-maxOffsetX, Math.min(maxOffsetX, newX)),
      y: Math.max(-maxOffsetY, Math.min(maxOffsetY, newY))
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {}
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((prev) => Math.max(1, Math.min(3, +(prev + delta).toFixed(2))));
  };

  // Reset positioning to center
  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  // Execute High-Resolution Canvas Crop
  const handleConfirmCrop = async () => {
    if (!imageRef.current || !naturalSize.width || !naturalSize.height) return;
    setIsProcessing(true);

    try {
      const { currentScale } = getScaleInfo();
      const img = imageRef.current;

      // Determine output resolution (crisp width e.g. 1600px)
      const outputWidth = Math.min(1920, Math.max(1200, naturalSize.width));
      const outputHeight = Math.round(outputWidth / aspectRatio);

      // In frame coordinates, center of crop is (frameSize.width/2, frameSize.height/2)
      // Center of image relative to frame center is (offset.x, offset.y)
      // Center of crop relative to image top-left:
      const cropCenterInDispX = (naturalSize.width * currentScale) / 2 - offset.x;
      const cropCenterInDispY = (naturalSize.height * currentScale) / 2 - offset.y;

      // Convert to natural image coordinates
      const cropCenterInNatX = cropCenterInDispX / currentScale;
      const cropCenterInNatY = cropCenterInDispY / currentScale;

      const cropWidthInNat = frameSize.width / currentScale;
      const cropHeightInNat = frameSize.height / currentScale;

      let sx = cropCenterInNatX - cropWidthInNat / 2;
      let sy = cropCenterInNatY - cropHeightInNat / 2;

      // Clamp sx and sy inside natural image
      sx = Math.max(0, Math.min(naturalSize.width - cropWidthInNat, sx));
      sy = Math.max(0, Math.min(naturalSize.height - cropHeightInNat, sy));

      const canvas = document.createElement('canvas');
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Could not get canvas context');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(
        img,
        sx,
        sy,
        cropWidthInNat,
        cropHeightInNat,
        0,
        0,
        outputWidth,
        outputHeight
      );

      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.88);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error('Canvas blob generation failed'));
          },
          'image/jpeg',
          0.88
        );
      });

      onCrop(croppedDataUrl, blob);
    } catch (err) {
      console.error('Crop failure:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const { dispW, dispH } = getScaleInfo();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '820px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '94vh',
          animation: 'modalSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Scissors size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                {title}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                คลิกค้างแล้วลากเพื่อเลื่อนส่วนที่ต้องการแสดง หรือซูมเข้า-ออก
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Viewport / Interactive Canvas Container */}
        <div
          ref={containerRef}
          onWheel={handleWheel}
          style={{
            padding: '24px 16px',
            backgroundColor: '#090d16',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            userSelect: 'none',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          {/* Crop Frame Box */}
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{
              width: `${frameSize.width}px`,
              height: `${frameSize.height}px`,
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '8px',
              cursor: isDragging ? 'grabbing' : 'grab',
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65), 0 0 0 2px #38bdf8',
              touchAction: 'none'
            }}
          >
            {/* Draggable/Zoomable Image */}
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Crop target"
              onLoad={onImageLoad}
              draggable={false}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: `${dispW}px`,
                height: `${dispH}px`,
                maxWidth: 'none',
                maxHeight: 'none',
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                pointerEvents: 'none',
                transition: isDragging ? 'none' : 'transform 0.05s ease-out'
              }}
            />

            {/* Rule of Thirds Grid Overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gridTemplateRows: '1fr 1fr 1fr',
                opacity: 0.35
              }}
            >
              <div style={{ borderRight: '1px solid rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.7)' }} />
              <div style={{ borderRight: '1px solid rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.7)' }} />
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.7)' }} />
              <div style={{ borderRight: '1px solid rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.7)' }} />
              <div style={{ borderRight: '1px solid rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.7)' }} />
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.7)' }} />
              <div style={{ borderRight: '1px solid rgba(255,255,255,0.7)' }} />
              <div style={{ borderRight: '1px solid rgba(255,255,255,0.7)' }} />
              <div />
            </div>

            {/* Hint Badge */}
            <div
              style={{
                position: 'absolute',
                bottom: '8px',
                right: '8px',
                backgroundColor: 'rgba(0, 0, 0, 0.65)',
                color: '#f8fafc',
                fontSize: '0.72rem',
                padding: '3px 8px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                pointerEvents: 'none',
                backdropFilter: 'blur(4px)'
              }}
            >
              <Move size={12} />
              <span>ลากเพื่อเลื่อน</span>
            </div>
          </div>
        </div>

        {/* Toolbar & Controls */}
        <div
          style={{
            padding: '16px 22px',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}
        >
          {/* Row 1: Aspect Ratio Selection & Reset */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>
                สัดส่วน (Ratio):
              </span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {ASPECT_RATIOS.map((item) => {
                  const isActive = Math.abs(aspectRatio - item.value) < 0.05;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setAspectRatio(item.value)}
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: `1.5px solid ${isActive ? '#2563eb' : '#cbd5e1'}`,
                        backgroundColor: isActive ? '#eff6ff' : '#ffffff',
                        color: isActive ? '#1d4ed8' : '#334155',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={handleReset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 10px',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#475569',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={13} />
              <span>กึ่งกลางภาพ</span>
            </button>
          </div>

          {/* Row 2: Zoom Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569', minWidth: '45px' }}>
              ซูมภาพ:
            </span>
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.max(1, +(prev - 0.1).toFixed(2)))}
              disabled={zoom <= 1}
              style={{
                padding: '5px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                cursor: zoom <= 1 ? 'not-allowed' : 'pointer',
                opacity: zoom <= 1 ? 0.5 : 1
              }}
            >
              <ZoomOut size={16} color="#475569" />
            </button>
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              style={{
                flex: 1,
                cursor: 'pointer',
                accentColor: '#2563eb'
              }}
            />
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.max(1, Math.min(3, +(prev + 0.1).toFixed(2))))}
              disabled={zoom >= 3}
              style={{
                padding: '5px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                cursor: zoom >= 3 ? 'not-allowed' : 'pointer',
                opacity: zoom >= 3 ? 0.5 : 1
              }}
            >
              <ZoomIn size={16} color="#475569" />
            </button>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#2563eb', minWidth: '46px', textAlign: 'right' }}>
              {Math.round(zoom * 100)}%
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          className="responsive-modal-footer"
          style={{
            padding: '14px 22px',
            backgroundColor: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
            flexWrap: 'wrap'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            style={{
              padding: '8px 16px',
              fontSize: '0.88rem',
              fontWeight: 600,
              color: '#475569',
              backgroundColor: '#f1f5f9',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleConfirmCrop}
            disabled={isProcessing}
            style={{
              padding: '8px 20px',
              fontSize: '0.88rem',
              fontWeight: 600,
              color: '#ffffff',
              backgroundColor: '#2563eb',
              border: 'none',
              borderRadius: '8px',
              cursor: isProcessing ? 'wait' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
              opacity: isProcessing ? 0.75 : 1
            }}
          >
            <Check size={16} />
            <span>{isProcessing ? 'กำลังประมวลผลภาพ...' : 'ยืนยันการครอบตัด'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

