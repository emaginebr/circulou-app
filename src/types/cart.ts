export interface CartItem {
  productId: number;
  storeId: number;
  quantity: number;
}

export interface CartState {
  updatedAt: string;
  items: CartItem[];
}

export type CartScope =
  | { type: 'anon' }
  | { type: 'user'; userId: string };

export const CART_STORAGE_PREFIX = 'circulou:cart:';
export const CART_ANON_KEY = 'circulou:cart:anon';

export const cartStorageKeyFor = (scope: CartScope): string =>
  scope.type === 'anon' ? CART_ANON_KEY : `${CART_STORAGE_PREFIX}${scope.userId}`;
