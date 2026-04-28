// Helpers do pré-fetch progressivo (FR-007).
// O cap inicial é 5 páginas (60 itens). "Buscar mais" sobe +5 páginas.
export const INITIAL_PAGE_CAP = 5;
export const PAGE_CAP_INCREMENT = 5;
export const PAGE_SIZE = 12;
export const MAX_PAGE_CAP_ABSOLUTE = 100;

export const incrementCap = (current: number): number =>
  Math.min(current + PAGE_CAP_INCREMENT, MAX_PAGE_CAP_ABSOLUTE);

export const isExhausted = (fetchedPages: number, totalPages: number): boolean =>
  totalPages > 0 && fetchedPages >= totalPages;

export const shouldShowLoadMore = (
  fetchedPages: number,
  pageCap: number,
  exhausted: boolean,
): boolean => fetchedPages >= pageCap && !exhausted;
