import { HttpClient, apiUrl, graphqlUrl, LofnApiError } from '@/Services/HttpClient';
import { normalizeText } from '@/lib/normalize';
import { sortByRelevance } from '@/lib/relevance';
import { INITIAL_PAGE_CAP, PAGE_SIZE } from '@/lib/pagination';
import type {
  ProductInfo,
  ProductListPagedResult,
} from '@/types/product';
import { ProductStatusEnum } from '@/types/product';
import type { FilterState, SearchPage, SortBy } from '@/types/search';

interface SearchUnifiedOptions {
  pageCap?: number;
  signal?: AbortSignal;
}

interface ProductSearchRequestBody {
  storeId?: number;
  userId: number;
  keyword: string;
  onlyActive: boolean;
  pageNum: number;
}

const MAX_INFLIGHT = 2;

class ProductsService {
  /** Busca cross-store. Aplica filtros e ordenação client-side conforme FR-007. */
  async searchUnified(
    keyword: string,
    filters: FilterState,
    options: SearchUnifiedOptions = {},
  ): Promise<SearchPage> {
    return this.searchInternal(undefined, keyword, filters, options);
  }

  /** Busca dentro de uma loja (StorePage). Permite filtro de categoria. */
  async searchInStore(
    storeId: number,
    keyword: string,
    filters: FilterState,
    options: SearchUnifiedOptions = {},
  ): Promise<SearchPage> {
    return this.searchInternal(storeId, keyword, filters, options);
  }

  /** Listagem da home: featured cross-store + completar com mais recentes (FR-004). */
  async loadHome(options: SearchUnifiedOptions = {}): Promise<{
    page: SearchPage;
    titleKey: 'homeTitleFeatured' | 'homeTitleCatalog';
  }> {
    // MOCK :: LOFN-G04 — featuredProducts cross-store via GraphQL.
    // Substituir por resolver oficial quando o gap fechar.
    // Ver specs/001-circulou-marketplace/lofn-api-gaps.md#lofn-g04.
    let featured: ProductInfo[] = [];
    try {
      featured = await this.fetchFeaturedViaGraphQL(options.signal);
    } catch {
      featured = [];
    }

    const recentPage = await this.searchUnified('', { ...filterDefaults, sort: 'newest' }, options);
    const fillers = recentPage.items.filter(
      r => !featured.some(f => f.productId === r.productId),
    );
    const merged = [...featured, ...fillers].slice(0, PAGE_SIZE);

    const titleKey: 'homeTitleFeatured' | 'homeTitleCatalog' =
      featured.length > 0 ? 'homeTitleFeatured' : 'homeTitleCatalog';

    return {
      page: {
        items: merged,
        totalCount: recentPage.totalCount + featured.length,
        fetchedPages: recentPage.fetchedPages,
        pageCap: recentPage.pageCap,
        exhausted: recentPage.exhausted,
      },
      titleKey,
    };
  }

  /**
   * Recupera produto por (storeSlug, productSlug) — chamada FRESCA, sem cache TTL.
   * Usado tanto pela ProductPage quanto pelo CartService.add() para revalidar
   * `limit` corrente (FR-020 + edge case "limit reduzido").
   */
  async getByStoreAndSlug(
    storeSlug: string,
    productSlug: string,
    signal?: AbortSignal,
  ): Promise<ProductInfo | null> {
    // MOCK :: LOFN-G05 — busca product por (storeSlug, productSlug).
    // Substituir por resolver GraphQL quando o gap fechar.
    // Ver specs/001-circulou-marketplace/lofn-api-gaps.md#lofn-g05.
    const body: ProductSearchRequestBody = {
      userId: 0,
      keyword: productSlug,
      onlyActive: false,
      pageNum: 1,
    };
    const opts = signal ? { signal } : {};
    const result = await HttpClient.post<ProductListPagedResult>(
      apiUrl('/product/search'),
      body,
      opts,
    );
    return (
      result.products.find(
        p => p.slug === productSlug && (storeSlug ? matchesStoreSlug(p, storeSlug) : true),
      ) ?? null
    );
  }

  /**
   * Recupera múltiplos produtos pelos seus IDs.
   * MOCK :: LOFN-G15 — fallback que faz N chamadas paralelas a /product/search com keyword=slug
   * desconhecido; usa o productId para filtrar. Quando o gap fechar, substituir por
   * GraphQL `products(ids: [...])` em uma única chamada.
   * Ver specs/001-circulou-marketplace/lofn-api-gaps.md#lofn-g15.
   */
  async getByIds(
    items: Array<{ productId: number; storeId: number }>,
    signal?: AbortSignal,
  ): Promise<Map<number, ProductInfo>> {
    const out = new Map<number, ProductInfo>();
    if (items.length === 0) return out;

    // MOCK :: LOFN-G15 — paralelismo limitado a 4 in-flight.
    const concurrency = 4;
    const queue = [...items];
    const workers: Promise<void>[] = [];
    for (let w = 0; w < concurrency; w++) {
      workers.push(
        (async () => {
          while (queue.length > 0) {
            const next = queue.shift();
            if (!next) break;
            const body: ProductSearchRequestBody = {
              storeId: next.storeId,
              userId: 0,
              keyword: '',
              onlyActive: false,
              pageNum: 1,
            };
            const opts = signal ? { signal } : {};
            try {
              const result = await HttpClient.post<ProductListPagedResult>(
                apiUrl('/product/search'),
                body,
                opts,
              );
              const found = result.products.find(p => p.productId === next.productId);
              if (found) out.set(next.productId, found);
            } catch {
              // Falhas individuais são silenciosas; o caller marca o item como unavailable.
            }
          }
        })(),
      );
    }
    await Promise.all(workers);
    return out;
  }

  // --- internos ----------------------------------------------------------------

  private async searchInternal(
    storeId: number | undefined,
    keyword: string,
    filters: FilterState,
    options: SearchUnifiedOptions,
  ): Promise<SearchPage> {
    const pageCap = options.pageCap ?? INITIAL_PAGE_CAP;
    const collected: ProductInfo[] = [];
    let lastPage = 0;
    let serverPageCount = pageCap;

    for (let pageStart = 1; pageStart <= pageCap; pageStart += MAX_INFLIGHT) {
      const batch: Promise<ProductListPagedResult>[] = [];
      const pages: number[] = [];
      for (let p = pageStart; p < pageStart + MAX_INFLIGHT && p <= pageCap; p++) {
        pages.push(p);
        batch.push(this.fetchPage(storeId, keyword, p, options.signal));
      }
      const results = await Promise.allSettled(batch);
      for (let i = 0; i < results.length; i++) {
        const res = results[i];
        const p = pages[i];
        if (!res || p === undefined) continue;
        if (res.status === 'fulfilled') {
          collected.push(...res.value.products);
          lastPage = Math.max(lastPage, p);
          serverPageCount = res.value.pageCount;
        } else if (res.reason instanceof LofnApiError && res.reason.status >= 500) {
          throw res.reason;
        }
      }
      if (lastPage >= serverPageCount) break;
    }

    const filtered = applyFilters(collected, { ...filters, storeId: storeId ?? filters.storeId });
    const sorted = applySort(filtered, filters.sort ?? 'relevance', keyword);

    return {
      items: sorted,
      totalCount: filtered.length,
      fetchedPages: lastPage,
      pageCap,
      exhausted: lastPage >= serverPageCount,
    };
  }

  private async fetchPage(
    storeId: number | undefined,
    keyword: string,
    pageNum: number,
    signal?: AbortSignal,
  ): Promise<ProductListPagedResult> {
    const body: ProductSearchRequestBody = {
      userId: 0,
      keyword: normalizeText(keyword),
      onlyActive: true,
      pageNum,
      ...(storeId !== undefined ? { storeId } : {}),
    };
    const opts = signal ? { signal } : {};
    return HttpClient.post<ProductListPagedResult>(apiUrl('/product/search'), body, opts);
  }

  private async fetchFeaturedViaGraphQL(signal?: AbortSignal): Promise<ProductInfo[]> {
    const url = graphqlUrl();
    if (!url) return [];
    const query = /* GraphQL */ `
      query Featured {
        featuredProducts {
          productId storeId categoryId slug imageUrl name description
          price discount frequency limit status productType featured
          createdAt updatedAt
          images { imageUrl sortOrder }
        }
      }
    `;
    const opts = signal ? { signal, skipAuth: true } : { skipAuth: true };
    const response = await HttpClient.post<{ data?: { featuredProducts?: ProductInfo[] } }>(
      url,
      { query },
      opts,
    );
    return response.data?.featuredProducts ?? [];
  }
}

const filterDefaults: FilterState = {
  storeId: null,
  priceMin: null,
  priceMax: null,
  onlyOnSale: false,
  categoryId: null,
  sort: 'relevance',
};

const matchesStoreSlug = (_p: ProductInfo, _slug: string): boolean => true;

// MOCK :: LOFN-G01 / LOFN-G02 — filtros price-range e onlyOnSale aplicados client-side.
// Substituir por filtros server-side quando os gaps fecharem.
// Ver specs/001-circulou-marketplace/lofn-api-gaps.md#lofn-g01.
export const applyFilters = (products: ProductInfo[], f: FilterState): ProductInfo[] =>
  products.filter(p => {
    if (p.status !== ProductStatusEnum.Active) return false;
    if (f.storeId !== null && f.storeId !== undefined && p.storeId !== f.storeId) return false;
    const finalPrice = p.price - p.discount;
    if (f.priceMin !== null && f.priceMin !== undefined && finalPrice < f.priceMin) return false;
    if (f.priceMax !== null && f.priceMax !== undefined && finalPrice > f.priceMax) return false;
    if (f.onlyOnSale && p.discount <= 0) return false;
    if (f.categoryId !== null && f.categoryId !== undefined && p.categoryId !== f.categoryId)
      return false;
    return true;
  });

// MOCK :: LOFN-G03 — ordenação aplicada client-side (preço, desconto, recente, relevância).
// Substituir por ordering server-side quando o gap fechar.
// Ver specs/001-circulou-marketplace/lofn-api-gaps.md#lofn-g03.
export const applySort = (
  items: ProductInfo[],
  sort: SortBy,
  keyword: string,
): ProductInfo[] => {
  const finalPrice = (p: ProductInfo) => p.price - p.discount;
  switch (sort) {
    case 'priceAsc':
      return [...items].sort((a, b) => finalPrice(a) - finalPrice(b));
    case 'priceDesc':
      return [...items].sort((a, b) => finalPrice(b) - finalPrice(a));
    case 'discount':
      return [...items].sort((a, b) => b.discount - a.discount);
    case 'newest':
      return [...items].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    case 'relevance':
    default:
      return sortByRelevance(items, keyword);
  }
};

export const productsService = new ProductsService();
export default ProductsService;
