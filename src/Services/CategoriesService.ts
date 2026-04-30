import { HttpClient, apiUrl, graphqlUrl } from '@/Services/HttpClient';
import { storesService } from '@/Services/StoresService';
import { PAGE_SIZE } from '@/lib/pagination';
import { applyFilters, applySort } from '@/Services/ProductsService';
import type {
  CategoryInfo,
  CategoryNode,
  CategorySearchResult,
  StoreInCategory,
} from '@/types/category';
import type {
  ProductInfo,
  ProductListPagedResult,
} from '@/types/product';
import type { FilterState } from '@/types/search';

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

const titleCaseSlugSegment = (segment: string): string =>
  segment
    .split('-')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

/**
 * Constrói a árvore do marketplace a partir do flat list de CategoryInfo
 * vindo de `listGlobal()`. Slugs hierárquicos (ex: "cursos/programacao")
 * viram pai → filho. Pais que não existem no backend são sintetizados
 * a partir do prefixo do slug (sem `categoryId`).
 */
const buildTreeFromFlatList = (flat: CategoryInfo[]): CategoryNode[] => {
  const nodesByPath = new Map<string, CategoryNode>();
  const roots: CategoryNode[] = [];

  for (const cat of flat) {
    const parts = cat.slug.split('/').filter(Boolean);
    if (parts.length === 0) continue;

    let parent: CategoryNode | null = null;
    let pathSoFar = '';

    for (let i = 0; i < parts.length; i++) {
      pathSoFar = pathSoFar ? `${pathSoFar}/${parts[i]}` : parts[i]!;
      const isLeaf = i === parts.length - 1;

      let node = nodesByPath.get(pathSoFar);
      if (!node) {
        node = {
          slug: pathSoFar,
          name: isLeaf ? cat.name : titleCaseSlugSegment(parts[i]!),
          productCount: 0,
        };
        nodesByPath.set(pathSoFar, node);
        if (parent) {
          (parent.children ??= []).push(node);
        } else {
          roots.push(node);
        }
      }

      if (isLeaf) {
        node.categoryId = cat.categoryId;
        node.name = cat.name;
      }
      parent = node;
    }
  }

  return roots;
};

interface CategorySearchOptions {
  pageCap?: number;
  signal?: AbortSignal;
}

interface MarketplaceProductSearchBody {
  userId: number;
  keyword: string;
  onlyActive: boolean;
  pageNum: number;
}

const MARKETPLACE_SEARCH_PAGE_BUDGET = 5;

class CategoriesService {
  private cache: CategoriesByStoreSlug = {};
  private globalCache: CategoryInfo[] | null = null;
  private marketplaceTreeCache: CategoryNode[] | null = null;
  private marketplaceProductCache: ProductInfo[] | null = null;

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

  /**
   * Árvore do marketplace derivada do `listGlobal()` (GraphQL público).
   * Slugs hierárquicos (ex: "cursos/programacao") viram pai/filho;
   * pais ausentes no backend são sintetizados a partir do prefixo.
   * `productCount` é computado client-side a partir do cache de produtos
   * do marketplace — leaf conta `categoryId` direto; pai soma dos filhos.
   *
   * TODO(LOFN-G01): se o backend passar a expor `productCount` e/ou
   * relação parent/child explícita, trocar por GET /marketplace/categories.
   */
  async getMarketplaceCategoryTree(): Promise<CategoryNode[]> {
    if (this.marketplaceTreeCache) return this.marketplaceTreeCache;
    const [flat, products] = await Promise.all([
      this.listGlobal(),
      this.fetchAllMarketplaceProducts(),
    ]);
    const tree = buildTreeFromFlatList(flat);
    populateProductCounts(tree, products);
    this.marketplaceTreeCache = tree;
    return this.marketplaceTreeCache;
  }

  /**
   * MOCK :: LOFN-G02 — busca paginada cross-store em uma categoria global.
   * Internamente chama POST /product/search (cross-store) e agrega
   * client-side por slug/nome de categoria. Pagina em memória com PAGE_SIZE.
   *
   * TODO(LOFN-G02): substituir por
   * GET /marketplace/categories/:slug/products?page=&filters=&sort=.
   */
  async searchInCategory(
    slug: string,
    filters: FilterState,
    page: number,
    options: CategorySearchOptions = {},
  ): Promise<CategorySearchResult> {
    const tree = await this.getMarketplaceCategoryTree();
    const { node, parents } = findInTree(tree, slug);
    if (!node) {
      return {
        category: { slug, name: slug, productCount: 0 },
        parents: [],
        products: [],
        totalCount: 0,
        page,
        pageCount: 1,
      };
    }

    const all = await this.fetchAllMarketplaceProducts(options.signal);

    // MOCK :: LOFN-G02 — filtragem por categoria via slug/nome.
    // ProductInfo expõe categoryId (numérico) sem categorySlug; usamos o
    // nome canônico do nó da árvore para casar contra o nome esperado.
    // Substituir por filtro server-side no endpoint dedicado.
    const inCategory = filterByCategoryNode(all, node);

    const filtered = applyFilters(inCategory, { ...filters, storeId: filters.storeId ?? null });
    const sorted = applySort(filtered, filters.sort ?? 'relevance', '');

    const totalCount = sorted.length;
    const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    const safePage = Math.min(Math.max(1, page), pageCount);
    const start = (safePage - 1) * PAGE_SIZE;
    const products = sorted.slice(start, start + PAGE_SIZE);

    return {
      category: { ...node, productCount: totalCount },
      parents,
      products,
      totalCount,
      page: safePage,
      pageCount,
    };
  }

  /**
   * MOCK :: LOFN-G03 — agrega lojas distintas presentes em uma categoria
   * global, com contagem de peças por loja. Cruza com storesService.listAll()
   * para enriquecer `name`/`logoUrl`/`slug`.
   *
   * TODO(LOFN-G03): substituir por GET /marketplace/categories/:slug/stores.
   */
  async listStoresInCategory(slug: string, signal?: AbortSignal): Promise<StoreInCategory[]> {
    const tree = await this.getMarketplaceCategoryTree();
    const { node } = findInTree(tree, slug);
    if (!node) return [];

    const all = await this.fetchAllMarketplaceProducts(signal);
    const inCategory = filterByCategoryNode(all, node);

    const counts = new Map<number, number>();
    for (const p of inCategory) {
      if (p.storeId === null) continue;
      counts.set(p.storeId, (counts.get(p.storeId) ?? 0) + 1);
    }

    const stores = await storesService.listAll(signal);
    const enriched: StoreInCategory[] = [];
    for (const [storeId, productCount] of counts.entries()) {
      const store = stores.find(s => s.storeId === storeId);
      if (!store) continue;
      enriched.push({
        storeId,
        slug: store.slug,
        name: store.name,
        logoUrl: store.logoUrl ?? null,
        productCount,
      });
    }
    enriched.sort((a, b) => b.productCount - a.productCount);
    return enriched;
  }

  invalidate(slug?: string): void {
    if (slug) {
      delete this.cache[slug];
    } else {
      this.cache = {};
      this.globalCache = null;
      this.marketplaceTreeCache = null;
      this.marketplaceProductCache = null;
    }
  }

  // ── internos ────────────────────────────────────────────────────────────

  /**
   * MOCK :: LOFN-G02 — varre N páginas do /product/search cross-store
   * (sem `storeId`) e cacheia em memória. Como o backend retorna ordem
   * implícita do servidor, limitamos a MARKETPLACE_SEARCH_PAGE_BUDGET
   * páginas para a primeira renderização não estourar.
   */
  private async fetchAllMarketplaceProducts(signal?: AbortSignal): Promise<ProductInfo[]> {
    if (this.marketplaceProductCache) return this.marketplaceProductCache;
    const collected: ProductInfo[] = [];
    let pageCount = MARKETPLACE_SEARCH_PAGE_BUDGET;
    for (let p = 1; p <= Math.min(pageCount, MARKETPLACE_SEARCH_PAGE_BUDGET); p++) {
      const body: MarketplaceProductSearchBody = {
        userId: 0,
        keyword: '',
        onlyActive: true,
        pageNum: p,
      };
      const opts = signal ? { signal } : {};
      try {
        const result = await HttpClient.post<ProductListPagedResult>(
          apiUrl('/product/search'),
          body,
          opts,
        );
        collected.push(...result.products);
        pageCount = result.pageCount;
        if (p >= pageCount) break;
      } catch {
        break;
      }
    }
    this.marketplaceProductCache = collected;
    return collected;
  }
}

const findInTree = (
  tree: CategoryNode[],
  slug: string,
  parents: CategoryNode[] = [],
): { node: CategoryNode | null; parents: CategoryNode[] } => {
  for (const node of tree) {
    if (node.slug === slug) return { node, parents };
    if (node.children) {
      const result = findInTree(node.children, slug, [...parents, node]);
      if (result.node) return result;
    }
  }
  return { node: null, parents: [] };
};

/**
 * Preenche `productCount` em cada nó da árvore. Folhas com `categoryId`
 * casam direto contra o `categoryId` do produto; pais (com ou sem id
 * próprio) recebem a soma dos filhos.
 */
const populateProductCounts = (tree: CategoryNode[], products: ProductInfo[]): void => {
  const countById = new Map<number, number>();
  for (const p of products) {
    if (p.categoryId === null) continue;
    countById.set(p.categoryId, (countById.get(p.categoryId) ?? 0) + 1);
  }
  const walk = (node: CategoryNode): number => {
    let total = node.categoryId !== undefined ? (countById.get(node.categoryId) ?? 0) : 0;
    if (node.children) {
      for (const child of node.children) total += walk(child);
    }
    node.productCount = total;
    return total;
  };
  for (const root of tree) walk(root);
};

/** Coleta `categoryId` do nó e de todos os descendentes. */
const collectCategoryIds = (node: CategoryNode): number[] => {
  const ids: number[] = [];
  if (node.categoryId !== undefined) ids.push(node.categoryId);
  if (node.children) {
    for (const child of node.children) ids.push(...collectCategoryIds(child));
  }
  return ids;
};

/**
 * Filtra produtos pelo `categoryId` do nó e descendentes. Se o nó é um
 * pai sintetizado (sem id próprio) mas tem filhos com id, casa pelos
 * filhos. Sem ids → array vazio (categoria não existe no backend).
 */
const filterByCategoryNode = (products: ProductInfo[], node: CategoryNode): ProductInfo[] => {
  const ids = new Set(collectCategoryIds(node));
  if (ids.size === 0) return [];
  return products.filter(p => p.categoryId !== null && ids.has(p.categoryId));
};

export type { CategorySearchOptions };

export const categoriesService = new CategoriesService();
export default CategoriesService;
