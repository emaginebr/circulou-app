import type { ProductInfo } from '@/types/product';

export type {
  CategoryInfo,
  CategoryInsertInfo,
  CategoryUpdateInfo,
} from 'lofn-react';

/**
 * Nó da árvore canônica do marketplace (cross-store).
 * MOCK :: LOFN-G01 — alimentado por mock estático até o resolver
 * `marketplaceCategories` ser entregue pelo backend.
 *
 * TODO(LOFN-G01): substituir mock por GET /marketplace/categories.
 * Payload esperado: ver docs/design/category/README.md#lofn-g01.
 */
export interface CategoryNode {
  slug: string;
  name: string;
  productCount: number;
  /** Quando o nó tem correspondência direta no backend; ausente em pais
   *  sintetizados a partir do prefixo do slug. */
  categoryId?: number;
  children?: CategoryNode[];
}

/**
 * Loja agregada com contagem de produtos numa categoria global.
 * MOCK :: LOFN-G03 — agregação client-side a partir do resultado do
 * /product/search cruzado com storesService.listAll().
 *
 * TODO(LOFN-G03): substituir mock por GET /marketplace/categories/:slug/stores.
 */
export interface StoreInCategory {
  storeId: number;
  slug: string;
  name: string;
  logoUrl: string | null;
  productCount: number;
}

/**
 * Resultado paginado da busca de produtos numa categoria global.
 * MOCK :: LOFN-G02 — agregação client-side por nome/slug de categoria,
 * paginada em memória com PAGE_SIZE.
 *
 * TODO(LOFN-G02): substituir mock por
 * GET /marketplace/categories/:slug/products (server-side filters + sort).
 */
export interface CategorySearchResult {
  category: CategoryNode;
  parents: CategoryNode[];
  products: ProductInfo[];
  totalCount: number;
  page: number;
  pageCount: number;
}
