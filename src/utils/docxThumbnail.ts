import { renderAsync } from 'docx-preview';
import html2canvas from 'html2canvas';

/**
 * Generates a thumbnail Data URL (JPEG image) from the first page of a DOCX file or URL.
 * Renders the document into an isolated off-screen container, styled with TH Sarabun fonts,
 * and snapshots the first page to a clean canvas thumbnail.
 */
export async function renderDocxFirstPageToImage(source: File | Blob | string): Promise<string | null> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;

  let blob: Blob | null = null;

  try {
    if (typeof source === 'string') {
      if (source.startsWith('data:')) {
        const res = await fetch(source);
        blob = await res.blob();
      } else {
        const res = await fetch(source);
        if (!res.ok) return null;
        blob = await res.blob();
      }
    } else {
      blob = source;
    }

    if (!blob || blob.size === 0) return null;

    // Create an invisible, isolated off-screen container for rendering
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-99999px';
    container.style.top = '-99999px';
    container.style.width = '794px'; // Standard A4 at 96 DPI
    container.style.backgroundColor = '#ffffff';
    container.style.opacity = '0';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '-9999';
    container.style.fontFamily = "'TH Sarabun New', 'TH Sarabun PSK', 'Angsana New', 'Cordia New', 'IBM Plex Sans Thai', sans-serif";

    document.body.appendChild(container);

    try {
      await renderAsync(blob, container, undefined, {
        className: 'docx-preview-thumb',
        inWrapper: false,
        ignoreWidth: false,
        ignoreHeight: false,
        breakPages: true,
        useBase64URL: true,
        renderChanges: false
      });

      // Find the first rendered section or page
      const firstSection = (container.querySelector('section.docx-preview-thumb') ||
        container.querySelector('section') ||
        container.querySelector('.docx-wrapper') ||
        container) as HTMLElement;

      if (!firstSection) {
        document.body.removeChild(container);
        return null;
      }

      // Snapshot the first page using html2canvas
      const canvas = await html2canvas(firstSection, {
        scale: 1.2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 794,
        height: Math.min(1123, Math.max(600, firstSection.offsetHeight || 1123))
      });

      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      document.body.removeChild(container);
      return dataUrl;
    } catch (renderErr) {
      console.warn('docx-preview render error:', renderErr);
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
      return null;
    }
  } catch (err) {
    console.warn('renderDocxFirstPageToImage error:', err);
    return null;
  }
}
