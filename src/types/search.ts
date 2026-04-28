import type { ProductInfo } from '@/types/product';

export type SortBy = 'relevance' | 'priceAsc' | 'priceDesc' | 'discount' | 'newest';

export interface FilterState {
  storeId?: number | null;
  priceMin?: number | null;
  priceMax?: number | null;
  onlyOnSale?: boolean;
  categoryId?: number | null;
  sort?: SortBy;
}

export interface SearchParams extends FilterState {
  q: string;
  page?: number;
}

export interface SearchPage {
  items: ProductInfo[];
  totalCount: number;
  fetchedPages: number;
  pageCap: number;
  exhausted: boolean;
}

export const DEFAULT_FILTER_STATE: FilterState = {
  storeId: null,
  priceMin: null,
  priceMax: null,
  onlyOnSale: false,
  categoryId: null,
  sort: 'relevance',
};
