import type { CartItem } from '@/types/cart';
import type { ProductInfo } from '@/types/product';
import type { StoreInfo } from '@/types/store';
import type { Address } from '@/types/address';
import { formatBRL } from '@/lib/currency';

interface OrderReviewProps {
  items: CartItem[];
  productsById: Map<number, ProductInfo>;
  storesById: Map<number, StoreInfo>;
  address: Address;
}

export const OrderReview = ({
  items,
  productsById,
  storesById,
  address,
}: OrderReviewProps) => {
  const byStore = new Map<number, CartItem[]>();
  for (const it of items) {
    const list = byStore.get(it.storeId) ?? [];
    list.push(it);
    byStore.set(it.storeId, list);
  }

  let total = 0;
  const groupRows = Array.from(byStore.entries()).map(([storeId, storeItems]) => {
    const store = storesById.get(storeId);
    const subtotal = storeItems.reduce((acc, it) => {
      const p = productsById.get(it.productId);
      if (!p) return acc;
      return acc + Math.max(0, p.price - p.discount) * it.quantity;
    }, 0);
    total += subtotal;
    return { storeId, store, items: storeItems, subtotal };
  });

  return (
    <div>
      <section className="bg-white border border-gray-200 rounded-[var(--radius)] p-4 mb-3">
        <h2 className="text-base font-semibold mb-2">Endereço de entrega</h2>
        <p className="text-sm text-[var(--color-mute)] mb-0">
          {address.recipientName}
          <br />
          {address.street}, {address.number}
          {address.complement ? ` ${address.complement}` : ''}
          <br />
          {address.district} — {address.city}/{address.state}
          <br />
          CEP {address.zipCode}
        </p>
      </section>

      {groupRows.map(({ storeId, store, items: storeItems, subtotal }) => (
        <section
          key={storeId}
          className="bg-white border border-gray-200 rounded-[var(--radius)] mb-3"
        >
          <header className="px-4 py-3 border-b border-gray-200 font-medium">
            {store?.name ?? `Loja #${storeId}`}
          </header>
          <ul className="divide-y divide-gray-200">
            {storeItems.map(it => {
              const p = productsById.get(it.productId);
              const finalPrice = p ? Math.max(0, p.price - p.discount) : 0;
              return (
                <li key={it.productId} className="px-4 py-2 text-sm">
                  {p?.name ?? `#${it.productId}`} — {it.quantity} ×{' '}
                  {formatBRL(finalPrice)} ={' '}
                  <strong>{formatBRL(finalPrice * it.quantity)}</strong>
                </li>
              );
            })}
          </ul>
          <footer className="px-4 py-3 border-t border-gray-200 text-right text-sm">
            Subtotal: <strong>{formatBRL(subtotal)}</strong>
          </footer>
        </section>
      ))}

      <div className="bg-white border border-gray-200 rounded-[var(--radius)] p-4 flex justify-between items-center">
        <span className="font-medium">Total geral</span>
        <strong className="text-xl">{formatBRL(total)}</strong>
      </div>
    </div>
  );
};
