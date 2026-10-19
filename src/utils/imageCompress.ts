/**
 * Image compression utility using HTML5 Canvas.
 * Resizes large photos to optimal web dimensions and compresses to JPEG/WebP.
 * Prevents localStorage QuotaExceededError and dramatically speeds up uploads.
 */
export async function compressImage(
  file: File,
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 0.82
): Promise<{ dataUrl: string; blob: Blob }> {
  return new Promise((resolve) => {
    // If not an image, resolve directly
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({ dataUrl: reader.result as string, blob: file });
      };
      reader.onerror = () => {
        resolve({ dataUrl: '', blob: file });
      };
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio preserved dimensions
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          const fallbackUrl = e.target?.result as string;
          resolve({ dataUrl: fallbackUrl, blob: file });
          return;
        }

        // Use high-quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ dataUrl, blob });
            } else {
              resolve({ dataUrl, blob: file });
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        const fallbackUrl = e.target?.result as string;
        resolve({ dataUrl: fallbackUrl, blob: file });
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      resolve({ dataUrl: '', blob: file });
    };

    reader.readAsDataURL(file);
  });
}
