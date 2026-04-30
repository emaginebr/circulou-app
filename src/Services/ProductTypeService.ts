import { HttpClient, apiUrl } from '@/Services/HttpClient';
import type {
  ProductSearchFilteredParam,
  ProductSearchFilteredResult,
} from '@/types/productType';

/**
 * Serviço dedicado ao feature 003-product-type-filters.
 *
 * `POST /product/search-filtered` é a busca pública filtrada por
 * categoria + valores de filtro. Anônima. A resposta inclui agora
 * `availableFilters[]` — não há mais um endpoint separado pra schema.
 */
class ProductTypeService {
  /** Busca pública filtrada por categoria + filtros dinâmicos. Anônima. */
  async searchFiltered(
    param: ProductSearchFilteredParam,
    signal?: AbortSignal,
  ): Promise<ProductSearchFilteredResult> {
    const opts = signal ? { signal, skipAuth: true as const } : { skipAuth: true as const };
    return HttpClient.post<ProductSearchFilteredResult>(
      apiUrl('/product/search-filtered'),
      param,
      opts,
    );
  }
}

export const productTypeService = new ProductTypeService();
export default ProductTypeService;
