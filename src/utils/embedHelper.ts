/**
 * Helper to parse and convert various external links into embeddable / presentation URLs
 * Supports Canva presentations, Google Slides, YouTube, Figma, etc.
 */

export function isCanvaUrl(url?: string): boolean {
  if (!url) return false;
  return /canva\.(com|link)/i.test(url);
}

export function extractCanvaDesignInfo(url: string): { designId: string; token: string } | null {
  if (!url) return null;
  const match = url.match(/canva\.com\/design\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)/i);
  if (match) {
    return { designId: match[1], token: match[2] };
  }
  return null;
}

export function toCanvaEmbedUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();

  // If already an embed or watch URL
  if (trimmed.includes('/view?embed') || trimmed.includes('/watch?embed')) {
    return trimmed;
  }

  // Handle canva.com/design/DAxxxx/yyyyy/edit or /view
  const info = extractCanvaDesignInfo(trimmed);
  if (info) {
    return `https://www.canva.com/design/${info.designId}/${info.token}/view?embed`;
  }

  return trimmed;
}

export function detectLinkType(url?: string): 'canva' | 'youtube' | 'pdf' | 'image' | 'generic' {
  if (!url) return 'generic';
  const u = url.toLowerCase();
  if (isCanvaUrl(u)) return 'canva';
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  if (u.endsWith('.pdf') || u.includes('.pdf?') || u.includes('portfolio-docs') || u.startsWith('data:application/pdf')) return 'pdf';
  if (/\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(u) || u.startsWith('data:image/')) return 'image';
  return 'generic';
}
