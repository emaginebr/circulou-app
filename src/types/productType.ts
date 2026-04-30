/**
 * Tipos do feature 003-product-type-filters do Lofn (storefront-only).
 *
 * Os tipos abaixo NÃO existem na `lofn-react` ainda — vivem aqui
 * localmente até serem promovidos para o pacote.
 *
 * O backend agora devolve, dentro do próprio response de
 * `/product/search-filtered`, o array `availableFilters` com os filtros
 * disponíveis (já restritos aos valores que existem no conjunto resultante).
 * Isso eliminou o endpoint `/category/{id}/producttype/applied`.
 */

import type { ProductInfo } from '@/types/product';

/** Tipos de dado suportados por um filtro de Tipo de Produto. */
export type ProductTypeFilterDataType =
  | 'text'
  | 'integer'
  | 'decimal'
  | 'boolean'
  | 'enum';

/**
 * Filtro disponível devolvido por `POST /product/search-filtered`.
 *
 * `availableValues` traz APENAS os valores que existem nos produtos do
 * conjunto resultante (já dedup + ordenado alfabeticamente pelo backend).
 * Filtros sem nenhum valor são omitidos da resposta.
 */
export interface AvailableFilterInfo {
  filterId: number;
  label: string;
  dataType: ProductTypeFilterDataType;
  isRequired: boolean;
  displayOrder: number;
  availableValues: string[];
}

/** Par filterId × valor stringificado (formato aceito pelo backend). */
export interface ProductTypeFilterSelection {
  filterId: number;
  value: string;
}

/** Body de `POST /product/search-filtered`. */
export interface ProductSearchFilteredParam {
  storeSlug?: string;
  categorySlug: string;
  filters: ProductTypeFilterSelection[];
  /** Limite inferior (inclusive) de preço, em unidades inteiras de moeda. */
  priceMin?: number | null;
  /** Limite superior (inclusive) de preço, em unidades inteiras de moeda. */
  priceMax?: number | null;
  /** Restringe apenas a produtos em promoção. */
  onlyOnSale?: boolean;
  pageNum: number;
}

/** Eco do filtro aplicado pelo backend (com label resolvido). */
export interface AppliedProductTypeFilter {
  filterId: number;
  label: string;
  value: string;
}

/**
 * Valor de um filtro associado ao produto. Vem aninhado em
 * `ProductInfo.filterValues[]` — formato gravado pelo seller.
 */
export interface ProductFilterValueInfo {
  filterId: number;
  filterLabel: string;
  value: string;
  dataType: ProductTypeFilterDataType;
}

/** Resposta de `POST /product/search-filtered`. */
export interface ProductSearchFilteredResult {
  products: ProductInfo[];
  pageNum: number;
  pageCount: number;
  totalItems: number;
  appliedProductTypeId: number | null;
  appliedFilters: AppliedProductTypeFilter[];
  availableFilters: AvailableFilterInfo[];
  ignoredFilterIds: number[];
}
