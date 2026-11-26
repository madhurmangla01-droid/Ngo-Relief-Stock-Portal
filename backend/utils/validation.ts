const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isNonEmptyString(value: unknown, maxLen = 255): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLen;
}

export function sanitizeOptionalString(value: unknown, maxLen = 1000): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  return trimmed.slice(0, maxLen);
}

export function isValidEmail(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length <= 180 && EMAIL_REGEX.test(value.trim());
}

export function parsePositiveNumber(value: unknown): number | null {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num) || num <= 0) return null;
  return Math.round(num * 100) / 100;
}

export function parseNonNegativeNumber(value: unknown): number | null {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.round(num * 100) / 100;
}

export function isValidDateString(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!DATE_REGEX.test(trimmed)) return false;
  const [y, m, d] = trimmed.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

export function validateAvatarUrl(value: unknown): { valid: boolean; sanitized: string | null; error?: string } {
  if (value === undefined || value === null || value === '') {
    return { valid: true, sanitized: null };
  }
  if (typeof value !== 'string') {
    return { valid: false, sanitized: null, error: 'Profile picture must be a valid image or URL.' };
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { valid: true, sanitized: null };
  }
  // Allow bundled local preset assets
  if (trimmed.startsWith('/src/assets/images/') && !trimmed.includes('..')) {
    return { valid: true, sanitized: trimmed };
  }
  // Allow safe resized raster image data URLs (bounded to ~350KB)
  if (/^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(trimmed)) {
    if (trimmed.length > 450_000) {
      return { valid: false, sanitized: null, error: 'Uploaded image is too large. Please choose a smaller image.' };
    }
    return { valid: true, sanitized: trimmed };
  }
  // Allow https URLs only (block javascript:, file:, data:text/html, etc.)
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:') {
      return { valid: true, sanitized: parsed.toString() };
    }
  } catch {
    // Fall through to invalid
  }
  return {
    valid: false,
    sanitized: null,
    error: 'Profile picture must be a preset avatar, uploaded PNG/JPG/WebP image, or an https:// URL.',
  };
}
