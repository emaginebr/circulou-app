import type { ProductInfo as LofnProductInfo } from 'lofn-react';
import type { ProductFilterValueInfo } from '@/types/productType';

/**
 * `ProductInfo` extendido: o backend Lofn devolve `filterValues[]` e
 * `appliedProductTypeId` que ainda não estão refletidos no SDK. Mantemos
 * locais até a `lofn-react` exportar.
 */
export interface ProductInfo extends LofnProductInfo {
  filterValues?: ProductFilterValueInfo[];
  appliedProductTypeId?: number | null;
}

export type {
  ProductInsertInfo,
  ProductUpdateInfo,
  ProductSearchParam,
  ProductImageInfo,
} from 'lofn-react';

import type { ProductListPagedResult as LofnProductListPagedResult } from 'lofn-react';
export type ProductListPagedResult = Omit<LofnProductListPagedResult, 'products'> & {
  products: ProductInfo[];
};

export { ProductStatusEnum, ProductTypeEnum } from 'lofn-react';
