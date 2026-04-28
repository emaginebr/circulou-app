import { HttpClient, apiUrl } from '@/Services/HttpClient';
import { storesService } from '@/Services/StoresService';
import type { CategoryInfo } from '@/types/category';
import type { ProductListPagedResult } from '@/types/product';

interface CategoriesByStoreSlug {
  [slug: string]: CategoryInfo[];
}

class CategoriesService {
  private cache: CategoriesByStoreSlug = {};

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

  invalidate(slug?: string): void {
    if (slug) {
      delete this.cache[slug];
    } else {
      this.cache = {};
    }
  }
}

export const categoriesService = new CategoriesService();
export default CategoriesService;
