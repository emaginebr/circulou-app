import {
  CART_ANON_KEY,
  cartStorageKeyFor,
  type CartScope,
  type CartItem,
  type CartState,
} from '@/types/cart';
import type { ProductInfo } from '@/types/product';
import { ProductStatusEnum } from '@/types/product';
import type { StoreInfo } from '@/types/store';
import { StoreStatusEnum } from '@/types/store';
import { productsService } from '@/Services/ProductsService';

export interface LoadResult extends CartState {
  productsById: Map<number, ProductInfo>;
  unavailableProductIds: number[];
}

export interface AddResult {
  effectiveQty: number;
  refusedReason?: 'unavailable' | 'limit_exceeded';
}

const READ_STORAGE = (key: string): CartState | null => {
  // MOCK :: LOFN-G09 — persistência client-side do carrinho.
  // Substituir por GET /shopcart/{userId} quando o gap fechar.
  // Ver specs/001-circulou-marketplace/lofn-api-gaps.md#lofn-g09.
  const target =
    key === CART_ANON_KEY
      ? typeof sessionStorage !== 'undefined'
        ? sessionStorage
        : null
      : typeof localStorage !== 'undefined'
        ? localStorage
        : null;
  if (!target) return null;
  try {
    const raw = target.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CartState>;
    if (!Array.isArray(parsed.items)) return null;
    return {
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
      items: parsed.items.filter(it => isValidItem(it)),
    };
  } catch {
    target.removeItem(key);
    return null;
  }
};

const WRITE_STORAGE = (key: string, state: CartState): void => {
  // MOCK :: LOFN-G09 — persistir carrinho local (último-escreve-vence).
  // Substituir por PUT /shopcart/{userId} quando o gap fechar.
  // Ver specs/001-circulou-marketplace/lofn-api-gaps.md#lofn-g09.
  const target =
    key === CART_ANON_KEY
      ? typeof sessionStorage !== 'undefined'
        ? sessionStorage
        : null
      : typeof localStorage !== 'undefined'
        ? localStorage
        : null;
  if (!target) return;
  // QuotaExceededError ou similar é propagado para o Context tratar via toast.
  target.setItem(key, JSON.stringify(state));
};

const REMOVE_STORAGE = (key: string): void => {
  const target =
    key === CART_ANON_KEY
      ? typeof sessionStorage !== 'undefined'
        ? sessionStorage
        : null
      : typeof localStorage !== 'undefined'
        ? localStorage
        : null;
  target?.removeItem(key);
};

const isValidItem = (it: unknown): it is CartItem => {
  if (typeof it !== 'object' || it === null) return false;
  const obj = it as Record<string, unknown>;
  return (
    typeof obj.productId === 'number' &&
    typeof obj.storeId === 'number' &&
    typeof obj.quantity === 'number' &&
    obj.quantity > 0
  );
};

class CartService {
  /**
   * Carrega o carrinho do storage e re-hidrata `ProductInfo`. Itens cujo produto
   * está inativo (ou cuja loja está inativa) ficam marcados em
   * `unavailableProductIds` mas permanecem no carrinho (FR-021).
   */
  async load(
    scope: CartScope,
    storesById: Map<number, StoreInfo>,
    signal?: AbortSignal,
  ): Promise<LoadResult> {
    const key = cartStorageKeyFor(scope);
    const state = READ_STORAGE(key) ?? { updatedAt: new Date().toISOString(), items: [] };
    const productsById = await productsService.getByIds(
      state.items.map(it => ({ productId: it.productId, storeId: it.storeId })),
      signal,
    );
    const unavailableProductIds: number[] = [];
    for (const item of state.items) {
      const p = productsById.get(item.productId);
      const store = storesById.get(item.storeId);
      const productActive = p?.status === ProductStatusEnum.Active;
      const storeActive =
        store?.status === StoreStatusEnum.Active ||
        (store?.status as unknown as string) === 'Active';
      if (!p || !productActive || !storeActive) {
        unavailableProductIds.push(item.productId);
      }
    }
    return { ...state, productsById, unavailableProductIds };
  }

  save(scope: CartScope, items: CartItem[]): void {
    const key = cartStorageKeyFor(scope);
    const state: CartState = { updatedAt: new Date().toISOString(), items };
    WRITE_STORAGE(key, state);
  }

  /**
   * Adiciona um item respeitando product.limit (FR-020).
   * MUST chamar productsService.getByStoreAndSlug — sempre fresca, sem cache TTL — para
   * cobrir o edge case "limit reduzido entre busca e adicionar". Não usa cache.
   */
  async add(
    scope: CartScope,
    product: ProductInfo,
    requestedQty: number,
    storeSlug: string,
    storesById: Map<number, StoreInfo>,
  ): Promise<AddResult> {
    // Re-busca fresco para validar limit/ativo no momento do add.
    const fresh = await productsService.getByStoreAndSlug(storeSlug, product.slug);
    const target = fresh ?? product;
    const store =
      target.storeId !== null && target.storeId !== undefined
        ? storesById.get(target.storeId)
        : undefined;
    const storeActive =
      store?.status === StoreStatusEnum.Active ||
      (store?.status as unknown as string) === 'Active';

    if (target.status !== ProductStatusEnum.Active || !storeActive) {
      return { effectiveQty: 0, refusedReason: 'unavailable' };
    }

    const limit = target.limit > 0 ? target.limit : Number.MAX_SAFE_INTEGER;
    const key = cartStorageKeyFor(scope);
    const current = READ_STORAGE(key) ?? { updatedAt: new Date().toISOString(), items: [] };
    const existing = current.items.find(it => it.productId === target.productId);
    const totalRequested = (existing?.quantity ?? 0) + Math.max(0, requestedQty);
    const cappedQty = Math.min(totalRequested, limit);

    let nextItems: CartItem[];
    if (existing) {
      nextItems = current.items.map(it =>
        it.productId === target.productId ? { ...it, quantity: cappedQty } : it,
      );
    } else {
      nextItems = [
        ...current.items,
        {
          productId: target.productId,
          storeId: target.storeId ?? 0,
          quantity: cappedQty,
        },
      ];
    }

    this.save(scope, nextItems);

    if (cappedQty < totalRequested) {
      return { effectiveQty: cappedQty, refusedReason: 'limit_exceeded' };
    }
    return { effectiveQty: cappedQty };
  }

  update(scope: CartScope, productId: number, quantity: number): CartItem[] {
    const key = cartStorageKeyFor(scope);
    const current = READ_STORAGE(key) ?? { updatedAt: new Date().toISOString(), items: [] };
    const next: CartItem[] =
      quantity <= 0
        ? current.items.filter(it => it.productId !== productId)
        : current.items.map(it =>
            it.productId === productId ? { ...it, quantity } : it,
          );
    this.save(scope, next);
    return next;
  }

  remove(scope: CartScope, productId: number): CartItem[] {
    return this.update(scope, productId, 0);
  }

  clear(scope: CartScope): void {
    REMOVE_STORAGE(cartStorageKeyFor(scope));
  }

  /**
   * Mescla o buffer anônimo (`sessionStorage["circulou:cart:anon"]`) no
   * carrinho do usuário recém-logado (FR-017). Soma quantidades por produto
   * respeitando product.limit. Apaga o buffer ao final.
   */
  async mergeAnonBufferIntoUser(
    userId: string,
    storesById: Map<number, StoreInfo>,
  ): Promise<CartItem[]> {
    const anon = READ_STORAGE(CART_ANON_KEY);
    if (!anon || anon.items.length === 0) {
      REMOVE_STORAGE(CART_ANON_KEY);
      const userKey = cartStorageKeyFor({ type: 'user', userId });
      return READ_STORAGE(userKey)?.items ?? [];
    }
    const userScope: CartScope = { type: 'user', userId };
    const userKey = cartStorageKeyFor(userScope);
    const userState = READ_STORAGE(userKey) ?? {
      updatedAt: new Date().toISOString(),
      items: [],
    };

    // Re-hidratar para conhecer limits frescos.
    const productsById = await productsService.getByIds(
      [...anon.items, ...userState.items].map(it => ({
        productId: it.productId,
        storeId: it.storeId,
      })),
    );

    const merged = new Map<number, CartItem>();
    for (const item of [...userState.items, ...anon.items]) {
      const existing = merged.get(item.productId);
      const product = productsById.get(item.productId);
      const store = storesById.get(item.storeId);
      const limit =
        product && product.limit > 0 ? product.limit : Number.MAX_SAFE_INTEGER;
      const storeActive =
        store?.status === StoreStatusEnum.Active ||
        (store?.status as unknown as string) === 'Active';
      if (
        product &&
        product.status === ProductStatusEnum.Active &&
        storeActive
      ) {
        const total = (existing?.quantity ?? 0) + item.quantity;
        merged.set(item.productId, {
          productId: item.productId,
          storeId: item.storeId,
          quantity: Math.min(total, limit),
        });
      }
    }
    const items = Array.from(merged.values());
    this.save(userScope, items);
    REMOVE_STORAGE(CART_ANON_KEY);
    return items;
  }
}

export const cartService = new CartService();
export default CartService;
