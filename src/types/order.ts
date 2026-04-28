import type { CartItem } from '@/types/cart';
import type { Address } from '@/types/address';
import type { StoreInfo } from '@/types/store';

export type MockOrderId = `MOCK-${string}-${string}-${string}`;

export interface OrderGroup {
  store: StoreInfo;
  items: CartItem[];
  subtotal: number;
  orderId: MockOrderId | null;
  errorMessage?: string;
}

export interface OrderConfirmation {
  groups: OrderGroup[];
  total: number;
  address: Address;
  createdAt: string;
}
