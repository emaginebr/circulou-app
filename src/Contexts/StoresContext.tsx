import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { storesService } from '@/Services/StoresService';
import type { StoreInfo } from '@/types/store';

export interface StoresContextValue {
  stores: StoreInfo[];
  storesById: Map<number, StoreInfo>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  clearError: () => void;
}

export const StoresContext = createContext<StoresContextValue | undefined>(undefined);

interface StoresProviderProps {
  children: ReactNode;
}

export const StoresProvider = ({ children }: StoresProviderProps) => {
  const [stores, setStores] = useState<StoreInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      storesService.invalidate();
      const all = await storesService.listAll();
      setStores(all);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar lojas');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    storesService
      .listAll()
      .then(all => {
        if (!cancelled) setStores(all);
      })
      .catch(err => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Falha ao carregar lojas');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const storesById = useMemo(() => {
    const map = new Map<number, StoreInfo>();
    for (const s of stores) map.set(s.storeId, s);
    return map;
  }, [stores]);

  const value = useMemo<StoresContextValue>(
    () => ({ stores, storesById, loading, error, refresh, clearError }),
    [stores, storesById, loading, error, refresh, clearError],
  );

  return <StoresContext.Provider value={value}>{children}</StoresContext.Provider>;
};
