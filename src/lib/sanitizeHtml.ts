import DOMPurify from 'dompurify';

export function sanitizeEmailHtml(html: string) {
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}
