import { useTranslation } from 'react-i18next';
import type { CartItem } from '@/types/cart';
import type { ProductInfo } from '@/types/product';
import { formatBRL } from '@/lib/currency';

interface CartLineProps {
  item: CartItem;
  product?: ProductInfo;
  isUnavailable: boolean;
  onQuantityChange: (qty: number) => void;
  onRemove: () => void;
}

export const CartLine = ({
  item,
  product,
  isUnavailable,
  onQuantityChange,
  onRemove,
}: CartLineProps) => {
  const { t } = useTranslation('cart');
  const limit = product && product.limit > 0 ? product.limit : 99;
  const finalPrice = product ? Math.max(0, product.price - product.discount) : 0;
  const subtotal = finalPrice * item.quantity;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-200 last:border-b-0">
      <img
        src={product?.imageUrl ?? ''}
        alt={product?.name ?? ''}
        className="w-16 h-16 object-cover rounded"
      />
      <div className="grow min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <strong className="text-sm truncate">
            {product?.name ?? `#${item.productId}`}
          </strong>
          {isUnavailable ? (
            <span className="inline-block px-2 py-0.5 text-xs rounded bg-[var(--color-warning)] text-gray-900">
              {t('unavailable')}
            </span>
          ) : null}
        </div>
        <small className="block text-xs text-[var(--color-mute)]">
          {formatBRL(finalPrice)} × {item.quantity} = {formatBRL(subtotal)}
        </small>
      </div>
      <input
        type="number"
        className="w-20 rounded-[var(--radius-sm)] border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] disabled:opacity-50"
        min={0}
        max={limit}
        value={item.quantity}
        disabled={isUnavailable}
        onChange={e => {
          const v = Math.max(0, Math.min(limit, Number(e.target.value) || 0));
          onQuantityChange(v);
        }}
        aria-label="Quantidade"
      />
      <button
        type="button"
        className="text-sm text-[var(--color-danger)] hover:underline px-2"
        onClick={onRemove}
        aria-label={`Remover ${product?.name ?? 'item'}`}
      >
        ✕
      </button>
    </div>
  );
};
