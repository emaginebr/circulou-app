import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useStores } from '@/hooks/useStores';
import { cartService, type AddResult } from '@/Services/CartService';
import type { CartItem, CartScope } from '@/types/cart';
import type { ProductInfo } from '@/types/product';

export interface CartContextValue {
  items: CartItem[];
  productsById: Map<number, ProductInfo>;
  unavailableProductIds: Set<number>;
  itemCount: number;
  loading: boolean;
  error: string | null;
  add: (product: ProductInfo, qty: number, storeSlug: string) => Promise<AddResult>;
  update: (productId: number, qty: number) => void;
  remove: (productId: number) => void;
  removeUnavailable: () => void;
  clear: () => void;
  refresh: () => Promise<void>;
  clearError: () => void;
}

export const CartContext = createContext<CartContextValue | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

const buildScope = (userId: number | undefined): CartScope =>
  userId !== undefined && userId !== null
    ? { type: 'user', userId: String(userId) }
    : { type: 'anon' };

export const CartProvider = ({ children }: CartProviderProps) => {
  const { user, isAuthenticated } = useAuth();
  const { storesById } = useStores();
  const [items, setItems] = useState<CartItem[]>([]);
  const [productsById, setProductsById] = useState<Map<number, ProductInfo>>(new Map());
  const [unavailableProductIds, setUnavailable] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mergedForUserId, setMergedForUserId] = useState<number | null>(null);

  const scope = useMemo(() => buildScope(user?.userId), [user?.userId]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await cartService.load(scope, storesById);
      setItems(result.items);
      setProductsById(result.productsById);
      setUnavailable(new Set(result.unavailableProductIds));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar carrinho');
    } finally {
      setLoading(false);
    }
  }, [scope, storesById]);

  // Mescla buffer anônimo ao logar (uma vez por userId).
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (mergedForUserId === user.userId) return;
    let cancelled = false;
    void (async () => {
      try {
        await cartService.mergeAnonBufferIntoUser(String(user.userId), storesById);
        if (!cancelled) {
          setMergedForUserId(user.userId);
          await refresh();
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Falha ao mesclar carrinho');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user, mergedForUserId, storesById, refresh]);

  // Recarrega quando muda o scope (login/logout).
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const add = useCallback(
    async (product: ProductInfo, qty: number, storeSlug: string): Promise<AddResult> => {
      const result = await cartService.add(scope, product, qty, storeSlug, storesById);
      await refresh();
      return result;
    },
    [scope, storesById, refresh],
  );

  const update = useCallback(
    (productId: number, qty: number) => {
      const next = cartService.update(scope, productId, qty);
      setItems(next);
    },
    [scope],
  );

  const remove = useCallback(
    (productId: number) => {
      const next = cartService.remove(scope, productId);
      setItems(next);
    },
    [scope],
  );

  const removeUnavailable = useCallback(() => {
    let next = items;
    for (const id of unavailableProductIds) {
      next = next.filter(it => it.productId !== id);
    }
    cartService.save(scope, next);
    setItems(next);
    setUnavailable(new Set());
  }, [items, unavailableProductIds, scope]);

  const clear = useCallback(() => {
    cartService.clear(scope);
    setItems([]);
    setProductsById(new Map());
    setUnavailable(new Set());
  }, [scope]);

  const clearError = useCallback(() => setError(null), []);

  const itemCount = useMemo(() => items.reduce((acc, it) => acc + it.quantity, 0), [items]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      productsById,
      unavailableProductIds,
      itemCount,
      loading,
      error,
      add,
      update,
      remove,
      removeUnavailable,
      clear,
      refresh,
      clearError,
    }),
    [
      items,
      productsById,
      unavailableProductIds,
      itemCount,
      loading,
      error,
      add,
      update,
      remove,
      removeUnavailable,
      clear,
      refresh,
      clearError,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
