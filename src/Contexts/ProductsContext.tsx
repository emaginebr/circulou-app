import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { productsService } from '@/Services/ProductsService';
import { INITIAL_PAGE_CAP, PAGE_CAP_INCREMENT, MAX_PAGE_CAP_ABSOLUTE } from '@/lib/pagination';
import type { FilterState, SearchPage } from '@/types/search';

export interface ProductsContextValue {
  searchPage: SearchPage | null;
  homeTitleKey: 'homeTitleFeatured' | 'homeTitleCatalog';
  loading: boolean;
  error: string | null;
  pageCap: number;
  searchUnified: (keyword: string, filters: FilterState) => Promise<void>;
  searchInStore: (storeId: number, keyword: string, filters: FilterState) => Promise<void>;
  loadHome: () => Promise<void>;
  extendCap: (currentRequest: () => Promise<void>) => Promise<void>;
  resetCap: () => void;
  clearError: () => void;
}

export const ProductsContext = createContext<ProductsContextValue | undefined>(undefined);

interface ProductsProviderProps {
  children: ReactNode;
}

export const ProductsProvider = ({ children }: ProductsProviderProps) => {
  const [searchPage, setSearchPage] = useState<SearchPage | null>(null);
  const [homeTitleKey, setHomeTitleKey] = useState<
    'homeTitleFeatured' | 'homeTitleCatalog'
  >('homeTitleCatalog');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageCap, setPageCap] = useState<number>(INITIAL_PAGE_CAP);

  const abortRef = useRef<AbortController | null>(null);

  const startRequest = useCallback((): AbortSignal => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    return controller.signal;
  }, []);

  const handleError = useCallback((err: unknown): void => {
    if (err instanceof DOMException && err.name === 'AbortError') return;
    const msg = err instanceof Error ? err.message : 'Falha ao buscar produtos';
    setError(msg);
  }, []);

  const searchUnified = useCallback(
    async (keyword: string, filters: FilterState): Promise<void> => {
      const signal = startRequest();
      setLoading(true);
      setError(null);
      try {
        const page = await productsService.searchUnified(keyword, filters, {
          pageCap,
          signal,
        });
        setSearchPage(page);
      } catch (err) {
        handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [pageCap, startRequest, handleError],
  );

  const searchInStore = useCallback(
    async (storeId: number, keyword: string, filters: FilterState): Promise<void> => {
      const signal = startRequest();
      setLoading(true);
      setError(null);
      try {
        const page = await productsService.searchInStore(storeId, keyword, filters, {
          pageCap,
          signal,
        });
        setSearchPage(page);
      } catch (err) {
        handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [pageCap, startRequest, handleError],
  );

  const loadHome = useCallback(async (): Promise<void> => {
    const signal = startRequest();
    setLoading(true);
    setError(null);
    try {
      const result = await productsService.loadHome({ pageCap, signal });
      setSearchPage(result.page);
      setHomeTitleKey(result.titleKey);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [pageCap, startRequest, handleError]);

  const extendCap = useCallback(
    async (currentRequest: () => Promise<void>) => {
      setPageCap(prev => Math.min(prev + PAGE_CAP_INCREMENT, MAX_PAGE_CAP_ABSOLUTE));
      await currentRequest();
    },
    [],
  );

  const resetCap = useCallback(() => setPageCap(INITIAL_PAGE_CAP), []);
  const clearError = useCallback(() => setError(null), []);

  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    [],
  );

  const value = useMemo<ProductsContextValue>(
    () => ({
      searchPage,
      homeTitleKey,
      loading,
      error,
      pageCap,
      searchUnified,
      searchInStore,
      loadHome,
      extendCap,
      resetCap,
      clearError,
    }),
    [
      searchPage,
      homeTitleKey,
      loading,
      error,
      pageCap,
      searchUnified,
      searchInStore,
      loadHome,
      extendCap,
      resetCap,
      clearError,
    ],
  );

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
};
