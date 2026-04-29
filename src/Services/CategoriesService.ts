import { HttpClient, apiUrl, graphqlUrl } from '@/Services/HttpClient';
import { storesService } from '@/Services/StoresService';
import type { CategoryInfo } from '@/types/category';
import type { ProductListPagedResult } from '@/types/product';

interface CategoriesByStoreSlug {
  [slug: string]: CategoryInfo[];
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

const GLOBAL_CATEGORIES_QUERY = /* GraphQL */ `
  query GlobalCategories($skip: Int, $take: Int) {
    categories(skip: $skip, take: $take) {
      items {
        categoryId
        slug
        name
      }
    }
  }
`;

class CategoriesService {
  private cache: CategoriesByStoreSlug = {};
  private globalCache: CategoryInfo[] | null = null;

  async listByStoreSlug(slug: string, signal?: AbortSignal): Promise<CategoryInfo[]> {
    const cached = this.cache[slug];
    if (cached) return cached;

    // Tentativa 1: extrair `categories[]` aninhado em StoresService.getBySlug.
    const store = await storesService.getBySlug(slug, signal);
    if (store?.categories && store.categories.length > 0) {
      this.cache[slug] = store.categories;
      return store.categories;
    }

    // MOCK :: LOFN-G08 — categorias inferidas da resposta de /product/search.
    // Substituir pelo resolver oficial quando o gap fechar.
    // Ver specs/001-circulou-marketplace/lofn-api-gaps.md#lofn-g08.
    if (!store) {
      this.cache[slug] = [];
      return [];
    }
    const opts = signal ? { signal } : {};
    const result = await HttpClient.post<ProductListPagedResult>(
      apiUrl('/product/search'),
      { storeId: store.storeId, userId: 0, keyword: '', onlyActive: true, pageNum: 1 },
      opts,
    );
    const seen = new Map<number, CategoryInfo>();
    for (const p of result.products) {
      if (p.categoryId !== null && !seen.has(p.categoryId)) {
        seen.set(p.categoryId, {
          categoryId: p.categoryId,
          slug: `cat-${p.categoryId}`,
          name: `Categoria ${p.categoryId}`,
        } as CategoryInfo);
      }
    }
    const inferred = Array.from(seen.values());
    this.cache[slug] = inferred;
    return inferred;
  }

  async listGlobal(signal?: AbortSignal): Promise<CategoryInfo[]> {
    if (this.globalCache) return this.globalCache;
    const url = graphqlUrl();
    if (!url) {
      this.globalCache = [];
      return this.globalCache;
    }
    const opts = signal ? { signal, skipAuth: true } : { skipAuth: true };
    const response = await HttpClient.post<
      GraphQLResponse<{ categories: { items: CategoryInfo[] } }>
    >(
      url,
      { query: GLOBAL_CATEGORIES_QUERY, variables: { skip: 0, take: 50 } },
      opts,
    );
    const list = response.data?.categories?.items ?? [];
    this.globalCache = list;
    return list;
  }

  invalidate(slug?: string): void {
    if (slug) {
      delete this.cache[slug];
    } else {
      this.cache = {};
      this.globalCache = null;
    }
  }
}

export const categoriesService = new CategoriesService();
export default CategoriesService;
