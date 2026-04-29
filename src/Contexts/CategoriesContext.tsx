import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { categoriesService } from '@/Services/CategoriesService';
import type { CategoryInfo } from '@/types/category';

export interface CategoriesContextValue {
  byStoreSlug: Record<string, CategoryInfo[]>;
  global: CategoryInfo[];
  loading: boolean;
  error: string | null;
  loadByStoreSlug: (slug: string) => Promise<CategoryInfo[]>;
  loadGlobal: () => Promise<CategoryInfo[]>;
  clearError: () => void;
}

export const CategoriesContext = createContext<CategoriesContextValue | undefined>(undefined);

interface CategoriesProviderProps {
  children: ReactNode;
}

export const CategoriesProvider = ({ children }: CategoriesProviderProps) => {
  const [byStoreSlug, setByStoreSlug] = useState<Record<string, CategoryInfo[]>>({});
  const [global, setGlobal] = useState<CategoryInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadByStoreSlug = useCallback(async (slug: string) => {
    setLoading(true);
    setError(null);
    try {
      const list = await categoriesService.listByStoreSlug(slug);
      setByStoreSlug(prev => ({ ...prev, [slug]: list }));
      return list;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar categorias');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const loadGlobal = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await categoriesService.listGlobal();
      setGlobal(list);
      return list;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar categorias globais');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<CategoriesContextValue>(
    () => ({ byStoreSlug, global, loading, error, loadByStoreSlug, loadGlobal, clearError }),
    [byStoreSlug, global, loading, error, loadByStoreSlug, loadGlobal, clearError],
  );

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
};
