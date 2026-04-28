import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '@/hooks/useCart';
import { useStores } from '@/hooks/useStores';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { CartStoreGroup } from '@/components/cart/CartStoreGroup';
import { CartSummary } from '@/components/cart/CartSummary';
import type { CartItem } from '@/types/cart';

export const CartPage = () => {
  const { t } = useTranslation('cart');
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { storesById } = useStores();
  const {
    items,
    productsById,
    unavailableProductIds,
    loading,
    error,
    update,
    remove,
    removeUnavailable,
    clearError,
    refresh,
  } = useCart();

  const groups = useMemo(() => {
    const map = new Map<number, CartItem[]>();
    for (const it of items) {
      const list = map.get(it.storeId) ?? [];
      list.push(it);
      map.set(it.storeId, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => {
      const sa = storesById.get(a)?.name ?? '';
      const sb = storesById.get(b)?.name ?? '';
      return sa.localeCompare(sb, 'pt-BR', { sensitivity: 'base' });
    });
  }, [items, storesById]);

  const total = useMemo(
    () =>
      items.reduce((acc, it) => {
        const p = productsById.get(it.productId);
        if (!p) return acc;
        return acc + Math.max(0, p.price - p.discount) * it.quantity;
      }, 0),
    [items, productsById],
  );

  const hasUnavailable = unavailableProductIds.size > 0;
  const canCheckout = items.length > 0 && !hasUnavailable;

  if (loading && items.length === 0) return <LoadingSpinner />;
  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => {
          clearError();
          void refresh();
        }}
      />
    );
  }
  if (items.length === 0) {
    return <EmptyState title={t('empty')} />;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-4">
      <h1 className="text-2xl font-semibold mb-3">{t('title')}</h1>
      <div
        className="bg-blue-50 border border-blue-200 text-blue-900 rounded-[var(--radius)] p-3 mb-3 text-sm"
        role="status"
      >
        {t('deviceWarning')}
      </div>
      {hasUnavailable ? (
        <div
          className="bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-[var(--radius)] p-3 mb-3 flex items-center justify-between gap-2"
          role="alert"
        >
          <span>Há itens indisponíveis no carrinho. Remova-os para continuar.</span>
          <button
            type="button"
            className="inline-flex items-center px-2 py-1 text-xs border border-gray-700 rounded-[var(--radius-sm)] hover:bg-gray-700 hover:text-white transition shrink-0"
            onClick={removeUnavailable}
          >
            {t('removeUnavailable')}
          </button>
        </div>
      ) : null}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8">
          {groups.map(([storeId, storeItems]) => (
            <CartStoreGroup
              key={storeId}
              storeId={storeId}
              store={storesById.get(storeId)}
              items={storeItems}
              productsById={productsById}
              unavailableProductIds={unavailableProductIds}
              onQuantityChange={(pid, qty) => update(pid, qty)}
              onRemove={pid => remove(pid)}
            />
          ))}
        </div>
        <div className="col-span-12 lg:col-span-4">
          <CartSummary
            total={total}
            canCheckout={canCheckout}
            onCheckout={() => {
              if (!isAuthenticated) {
                navigate('/login', { state: { from: '/cart' } });
                return;
              }
              navigate('/checkout');
            }}
          />
        </div>
      </div>
    </section>
  );
};
