import * as pdfjsLib from 'pdfjs-dist';

// Use bundled worker from unpkg/cdnjs matching pdfjs-dist version
if (typeof window !== 'undefined' && 'Worker' in window) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

/**
 * Generates a thumbnail Data URL (JPEG image) from the first page of a PDF file or URL.
 */
export async function renderPdfFirstPageToImage(source: File | Blob | string): Promise<string | null> {
  try {
    let loadingTask;
    if (typeof source === 'string') {
      loadingTask = pdfjsLib.getDocument({ url: source });
    } else {
      const arrayBuffer = await source.arrayBuffer();
      loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    }

    const pdf = await loadingTask.promise;
    if (pdf.numPages === 0) return null;

    // Get first page
    const page = await pdf.getPage(1);
    
    // Calculate viewport scale for crisp cover image (approx width 800px)
    const initialViewport = page.getViewport({ scale: 1 });
    const desiredWidth = 800;
    const scale = Math.max(1, desiredWidth / initialViewport.width);
    const viewport = page.getViewport({ scale });

    // Prepare canvas
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext('2d');

    if (!context) return null;

    // Render page
    const renderContext = {
      canvasContext: context as any,
      viewport: viewport,
      canvas: canvas
    };

    await (page.render(renderContext) as any).promise;

    // Convert to JPEG data URL
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    return dataUrl;
  } catch (err) {
    console.warn('Could not generate PDF thumbnail:', err);
    return null;
  }
}

/**
 * Convert a Data URL to a Blob
 */
export function dataUrlToBlob(dataUrl: string): Blob | null {
  try {
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch {
    return null;
  }
}
