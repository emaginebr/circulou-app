import { Link } from 'react-router-dom';
import type { CartItem } from '@/types/cart';
import type { ProductInfo } from '@/types/product';
import type { StoreInfo } from '@/types/store';
import { formatBRL } from '@/lib/currency';
import { CartLine } from '@/components/cart/CartLine';

interface CartStoreGroupProps {
  store: StoreInfo | undefined;
  storeId: number;
  items: CartItem[];
  productsById: Map<number, ProductInfo>;
  unavailableProductIds: Set<number>;
  onQuantityChange: (productId: number, qty: number) => void;
  onRemove: (productId: number) => void;
}

export const CartStoreGroup = ({
  store,
  storeId,
  items,
  productsById,
  unavailableProductIds,
  onQuantityChange,
  onRemove,
}: CartStoreGroupProps) => {
  const subtotal = items.reduce((acc, it) => {
    const p = productsById.get(it.productId);
    if (!p) return acc;
    return acc + Math.max(0, p.price - p.discount) * it.quantity;
  }, 0);

  return (
    <section className="bg-white border border-gray-200 rounded-[var(--radius)] mb-3">
      <header className="flex items-center gap-2 px-4 py-3 border-b border-gray-200">
        {store?.logoUrl ? (
          <img
            src={store.logoUrl}
            alt=""
            className="w-7 h-7 object-cover rounded"
          />
        ) : null}
        {store ? (
          <Link
            to={`/loja/${store.slug}`}
            className="text-[var(--color-primary)] font-medium hover:underline"
          >
            {store.name}
          </Link>
        ) : (
          <span className="font-medium text-[var(--color-mute)]">Loja #{storeId}</span>
        )}
      </header>
      <div className="px-4">
        {items.map(item => (
          <CartLine
            key={item.productId}
            item={item}
            product={productsById.get(item.productId)}
            isUnavailable={unavailableProductIds.has(item.productId)}
            onQuantityChange={qty => onQuantityChange(item.productId, qty)}
            onRemove={() => onRemove(item.productId)}
          />
        ))}
      </div>
      <footer className="px-4 py-3 border-t border-gray-200 text-right text-sm">
        Subtotal da loja: <strong>{formatBRL(subtotal)}</strong>
      </footer>
    </section>
  );
};
