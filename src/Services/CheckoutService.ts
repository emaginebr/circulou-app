import { HttpClient, apiUrl } from '@/Services/HttpClient';
import { productsService } from '@/Services/ProductsService';
import { cartService } from '@/Services/CartService';
import { ProductStatusEnum } from '@/types/product';
import type { ProductInfo } from '@/types/product';
import { StoreStatusEnum } from '@/types/store';
import type { StoreInfo } from '@/types/store';
import type { Address } from '@/types/address';
import type { CartItem, CartScope } from '@/types/cart';
import type { MockOrderId, OrderConfirmation, OrderGroup } from '@/types/order';

interface CurrentUser {
  userId: number;
  name: string;
  email: string;
}

interface InsertItemPayload {
  product: ProductInfo;
  quantity: number;
}

interface InsertBody {
  user: CurrentUser;
  address: {
    zipCode: string;
    address: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  items: InsertItemPayload[];
  createdAt: string;
}

const pad = (n: number, w: number) => String(n).padStart(w, '0');

const formatTimestamp = (d: Date): string =>
  `${d.getFullYear()}${pad(d.getMonth() + 1, 2)}${pad(d.getDate(), 2)}-${pad(d.getHours(), 2)}${pad(d.getMinutes(), 2)}${pad(d.getSeconds(), 2)}`;

const randomAlphanumeric = (len: number): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
};

// MOCK :: LOFN-G11 — orderId é gerado client-side; o backend não devolve um.
// Substituir pelo orderId retornado por /shopcart/insert quando o gap fechar.
// Ver specs/001-circulou-marketplace/lofn-api-gaps.md#lofn-g11.
const generateMockOrderId = (storeSlug: string): MockOrderId =>
  `MOCK-${storeSlug || 'unknown'}-${formatTimestamp(new Date())}-${randomAlphanumeric(5)}` as MockOrderId;

class CheckoutService {
  /**
   * Pré-validação (FR-026): re-hidrata produtos e checa se todos seguem
   * ativos com loja ativa. Retorna lista de itens problemáticos (vazia = OK).
   */
  async validateAvailability(
    items: CartItem[],
    storesById: Map<number, StoreInfo>,
  ): Promise<{
    unavailable: { productId: number; reason: 'product_inactive' | 'store_inactive' | 'not_found' }[];
    productsById: Map<number, ProductInfo>;
  }> {
    const productsById = await productsService.getByIds(
      items.map(it => ({ productId: it.productId, storeId: it.storeId })),
    );
    const unavailable: {
      productId: number;
      reason: 'product_inactive' | 'store_inactive' | 'not_found';
    }[] = [];
    for (const it of items) {
      const p = productsById.get(it.productId);
      if (!p) {
        unavailable.push({ productId: it.productId, reason: 'not_found' });
        continue;
      }
      if (p.status !== ProductStatusEnum.Active) {
        unavailable.push({ productId: it.productId, reason: 'product_inactive' });
        continue;
      }
      const store = storesById.get(it.storeId);
      const storeActive =
        store?.status === StoreStatusEnum.Active ||
        (store?.status as unknown as string) === 'Active';
      if (!storeActive) {
        unavailable.push({ productId: it.productId, reason: 'store_inactive' });
      }
    }
    return { unavailable, productsById };
  }

  /**
   * Dispara N POST /shopcart/insert, um por loja, sequencialmente.
   * Sucesso → gera MOCK orderId; falha → mantém os itens no carrinho.
   */
  async submit(
    items: CartItem[],
    productsById: Map<number, ProductInfo>,
    storesById: Map<number, StoreInfo>,
    address: Address,
    user: CurrentUser,
    cartScope: CartScope,
  ): Promise<OrderConfirmation> {
    // Agrupa itens por storeId
    const byStore = new Map<number, CartItem[]>();
    for (const it of items) {
      const list = byStore.get(it.storeId) ?? [];
      list.push(it);
      byStore.set(it.storeId, list);
    }

    const groups: OrderGroup[] = [];
    const successfulProductIds = new Set<number>();
    const createdAt = new Date().toISOString();

    for (const [storeId, storeItems] of byStore) {
      const store = storesById.get(storeId);
      const subtotal = storeItems.reduce((acc, it) => {
        const p = productsById.get(it.productId);
        if (!p) return acc;
        return acc + Math.max(0, p.price - p.discount) * it.quantity;
      }, 0);

      const insertItems: InsertItemPayload[] = storeItems
        .map(it => {
          const p = productsById.get(it.productId);
          return p ? { product: p, quantity: it.quantity } : null;
        })
        .filter((x): x is InsertItemPayload => x !== null);

      const body: InsertBody = {
        user,
        address: {
          zipCode: address.zipCode,
          address: `${address.street}, ${address.number}`,
          ...(address.complement ? { complement: address.complement } : {}),
          neighborhood: address.district,
          city: address.city,
          state: address.state,
        },
        items: insertItems,
        createdAt,
      };

      try {
        await HttpClient.post(apiUrl('/shopcart/insert'), body);
        const orderId = generateMockOrderId(store?.slug ?? `store-${storeId}`);
        groups.push({
          store: store ?? minimalStoreFallback(storeId),
          items: storeItems,
          subtotal,
          orderId,
        });
        for (const it of storeItems) successfulProductIds.add(it.productId);
      } catch (err) {
        groups.push({
          store: store ?? minimalStoreFallback(storeId),
          items: storeItems,
          subtotal,
          orderId: null,
          errorMessage: err instanceof Error ? err.message : 'Falha ao enviar pedido',
        });
      }
    }

    // Itens das lojas que falharam VOLTAM ao carrinho.
    const remaining = items.filter(it => !successfulProductIds.has(it.productId));
    cartService.save(cartScope, remaining);

    const totalAll = groups
      .filter(g => g.orderId !== null)
      .reduce((sum, g) => sum + g.subtotal, 0);

    return {
      groups,
      total: totalAll,
      address,
      createdAt,
    };
  }
}

const minimalStoreFallback = (storeId: number): StoreInfo => ({
  storeId,
  slug: `store-${storeId}`,
  name: `Loja #${storeId}`,
  ownerId: 0,
  logo: '',
  logoUrl: '',
  status: StoreStatusEnum.Active,
});

export const checkoutService = new CheckoutService();
export default CheckoutService;
