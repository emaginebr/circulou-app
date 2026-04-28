import type { ProductInfo } from '@/types/product';
import { normalizeText } from '@/lib/normalize';

// Ranqueamento (FR-006): match-exato → prefixo → substring → featured → recente.
// Score numérico: maior é mais relevante.
export const scoreRelevance = (product: ProductInfo, term: string): number => {
  const t = normalizeText(term);
  if (!t) {
    return (product.featured ? 1_000 : 0) + tieBreakRecent(product);
  }
  const name = normalizeText(product.name ?? '');
  let score = 0;
  if (name === t) {
    score += 10_000;
  } else if (name.startsWith(t)) {
    score += 5_000;
  } else if (name.includes(t)) {
    score += 1_000;
  }
  if (product.featured) score += 200;
  score += tieBreakRecent(product);
  return score;
};

const tieBreakRecent = (product: ProductInfo): number => {
  const ts = product.createdAt ? new Date(product.createdAt).getTime() : 0;
  return ts > 0 ? ts / 1_000_000 : 0;
};

export const sortByRelevance = (
  products: ProductInfo[],
  term: string,
): ProductInfo[] =>
  [...products].sort((a, b) => scoreRelevance(b, term) - scoreRelevance(a, term));
