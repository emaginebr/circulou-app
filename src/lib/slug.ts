import { normalizeText } from '@/lib/normalize';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const slugify = (s: string): string =>
  normalizeText(s)
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

export const isValidSlug = (s: string): boolean => SLUG_RE.test(s);
