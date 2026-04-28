import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { FilterState, SortBy, SearchParams } from '@/types/search';
import { DEFAULT_FILTER_STATE } from '@/types/search';

const SORT_VALUES: ReadonlyArray<SortBy> = [
  'relevance',
  'priceAsc',
  'priceDesc',
  'discount',
  'newest',
];

const parseNumber = (raw: string | null): number | null => {
  if (raw === null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

const parseSort = (raw: string | null): SortBy | undefined => {
  if (raw === null) return undefined;
  return (SORT_VALUES as readonly string[]).includes(raw) ? (raw as SortBy) : undefined;
};

const parseBool = (raw: string | null): boolean => raw === 'true' || raw === '1';

export interface UseUrlSearchState {
  params: SearchParams;
  setQuery: (q: string) => void;
  setFilters: (next: Partial<FilterState>) => void;
  setSort: (sort: SortBy) => void;
  setPage: (page: number) => void;
  reset: () => void;
}

export const useUrlSearchState = (): UseUrlSearchState => {
  const [sp, setSp] = useSearchParams();

  const params = useMemo<SearchParams>(
    () => ({
      q: sp.get('q') ?? '',
      storeId: parseNumber(sp.get('store')),
      priceMin: parseNumber(sp.get('min')),
      priceMax: parseNumber(sp.get('max')),
      onlyOnSale: parseBool(sp.get('sale')),
      categoryId: parseNumber(sp.get('cat')),
      sort: parseSort(sp.get('sort')) ?? DEFAULT_FILTER_STATE.sort,
      page: parseNumber(sp.get('page')) ?? 1,
    }),
    [sp],
  );

  const update = useCallback(
    (mutator: (next: URLSearchParams) => void) => {
      setSp(prev => {
        const next = new URLSearchParams(prev);
        mutator(next);
        return next;
      });
    },
    [setSp],
  );

  const setQuery = useCallback(
    (q: string) =>
      update(next => {
        if (q) next.set('q', q);
        else next.delete('q');
        next.delete('page');
      }),
    [update],
  );

  const setFilters = useCallback(
    (filters: Partial<FilterState>) =>
      update(next => {
        const apply = (key: string, value: unknown) => {
          if (value === null || value === undefined || value === '' || value === false) next.delete(key);
          else next.set(key, String(value));
        };
        if ('storeId' in filters) apply('store', filters.storeId);
        if ('priceMin' in filters) apply('min', filters.priceMin);
        if ('priceMax' in filters) apply('max', filters.priceMax);
        if ('onlyOnSale' in filters) apply('sale', filters.onlyOnSale);
        if ('categoryId' in filters) apply('cat', filters.categoryId);
        if ('sort' in filters && filters.sort) next.set('sort', filters.sort);
        next.delete('page');
      }),
    [update],
  );

  const setSort = useCallback(
    (sort: SortBy) =>
      update(next => {
        next.set('sort', sort);
        next.delete('page');
      }),
    [update],
  );

  const setPage = useCallback(
    (page: number) =>
      update(next => {
        if (page > 1) next.set('page', String(page));
        else next.delete('page');
      }),
    [update],
  );

  const reset = useCallback(
    () =>
      update(next => {
        next.delete('store');
        next.delete('min');
        next.delete('max');
        next.delete('sale');
        next.delete('cat');
        next.delete('sort');
        next.delete('page');
      }),
    [update],
  );

  return { params, setQuery, setFilters, setSort, setPage, reset };
};
