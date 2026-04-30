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
import type {
  ProductAttributes,
  ProductAttributesGroup,
  ProductCondition,
} from '@/types/productAttributes';
import type { CategoryNode } from '@/types/category';

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

  /**
   * MOCK :: LOFN-G30/G31/G32/G33 — atributos estruturados da peça.
   * Backend Lofn só expõe `description: string`. Aqui derivamos atributos
   * determinísticos a partir do `productId` para visual estável entre reloads.
   *
   * TODO(LOFN-G30): trocar por GET /products/:productId/attributes quando
   * o backend modelar o schema de atributos.
   */
  getAttributes(productId: number, categoryId: number | null): Promise<ProductAttributes> {
    return Promise.resolve(buildMockAttributes(productId, categoryId));
  }

  /**
   * MOCK :: LOFN-G34 — produtos relacionados. Endpoint não existe; usamos a
   * categoria do produto atual e filtramos pelo próprio `productId`.
   * Limita ao número solicitado para o rail.
   *
   * TODO(LOFN-G34): substituir por GET /products/:productId/related quando
   * o backend modelar curadoria/recomendação.
   */
  async getRelated(
    productId: number,
    categoryId: number | null,
    limit = 6,
  ): Promise<ProductInfo[]> {
    if (categoryId === null) return [];
    // Import dinâmico evita ciclo com CategoriesService (que já importa
    // `applyFilters`/`applySort` daqui).
    const { categoriesService } = await import('@/Services/CategoriesService');
    const tree = await categoriesService.getMarketplaceCategoryTree();
    const slug = findCategorySlugById(tree, categoryId);
    if (!slug) return [];
    const result = await categoriesService.searchInCategory(
      slug,
      filterDefaults,
      1,
    );
    return result.products.filter(p => p.productId !== productId).slice(0, limit);
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

// ── Helpers para produtos relacionados (LOFN-G34) ───────────────────────────

const findCategorySlugById = (
  tree: CategoryNode[],
  categoryId: number,
): string | null => {
  for (const node of tree) {
    if (node.categoryId === categoryId) return node.slug;
    if (node.children) {
      const fromChild = findCategorySlugById(node.children, categoryId);
      if (fromChild) return fromChild;
    }
  }
  return null;
};

// ── Mocks dos atributos estruturados (LOFN-G30..G33) ────────────────────────

const hashProductId = (productId: number): number => {
  // FNV-1a-ish hash determinístico — evita Math.random() para garantir
  // estabilidade entre reloads e entre dispositivos.
  let h = Math.abs(productId | 0) + 0x9e3779b1;
  h = (h ^ (h >>> 16)) * 0x85ebca6b;
  h = (h ^ (h >>> 13)) * 0xc2b2ae35;
  h = h ^ (h >>> 16);
  return Math.abs(h);
};

const pick = <T>(items: readonly T[], hash: number, salt: number): T => {
  const idx = (hash + salt * 31) % items.length;
  return items[idx]!;
};

// MOCK :: LOFN-G31 — pool determinístico de condições.
const CONDITION_POOL: readonly ProductCondition[] = [
  'new-with-tag',
  'semi-new',
  'great',
  'signs-of-use',
];

const CONDITION_LABELS: Record<ProductCondition, string> = {
  'new-with-tag': 'Nova com etiqueta',
  'semi-new': 'Semi-nova',
  'great': 'Usada em ótimo estado',
  'signs-of-use': 'Usada com sinais',
};

const BRAND_POOL = [
  'Adidas', 'Nike', 'Vans', 'Converse', 'Reebok', 'New Balance',
  'Schutz', 'Arezzo', 'Melissa', 'Anacapri', 'Havaianas', 'Puma',
] as const;

const COLOR_POOL = [
  'Branco', 'Preto', 'Bege', 'Cobre', 'Marrom', 'Verde oliva',
  'Azul marinho', 'Vermelho', 'Areia', 'Cinza',
] as const;

const MATERIAL_POOL = [
  'Couro liso', 'Lona', 'Camurça', 'Tecido sintético', 'Couro envernizado',
  'Algodão encerado',
] as const;

const COMPOSITION_POOL = [
  '100% couro bovino', '100% algodão', 'Lona + sintético',
  '60% couro / 40% têxtil', 'Couro PU + forro têxtil',
] as const;

const GENDER_POOL = ['Unissex', 'Feminino', 'Masculino'] as const;

const MODEL_POOL = [
  'Stan Smith', 'Air Max', 'Old Skool', 'Chuck Taylor', '990 v5',
  'Classic Leather', 'Plataforma', 'Trekking',
] as const;

// MOCK :: LOFN-G32 — Tabela canônica de tamanhos calçado BR/US/EU.
const SIZE_BR_POOL = ['35', '36', '37', '38', '39', '40', '41', '42'] as const;

const SIZE_US: Record<string, string> = {
  '35': '5', '36': '5,5', '37': '6,5', '38': '7',
  '39': '7,5', '40': '8,5', '41': '9', '42': '10',
};

const SIZE_EU: Record<string, string> = {
  '35': '36', '36': '37', '37': '38', '38': '39',
  '39': '40', '40': '41', '41': '42', '42': '43',
};

// MOCK :: LOFN-G33 — Medidas dependentes do tamanho BR (calçados).
const FOOT_LENGTH_CM: Record<string, string> = {
  '35': '23,0', '36': '23,5', '37': '24,0', '38': '24,5',
  '39': '25,5', '40': '26,0', '41': '27,0', '42': '27,5',
};

const FOOT_WIDTH_CM: Record<string, string> = {
  '35': '8,5', '36': '8,8', '37': '9,0', '38': '9,2',
  '39': '9,5', '40': '9,7', '41': '10,0', '42': '10,3',
};

const SOLE_HEIGHT_CM = ['2,0', '2,4', '2,8', '3,0', '3,4'] as const;

const COLLECTION_POOL = [
  'Originals · clássica', 'Coleção 2023', 'Edição comemorativa',
  'Linha Performance', 'Resort 2024',
] as const;

const buildMockAttributes = (
  productId: number,
  categoryId: number | null,
): ProductAttributes => {
  const hash = hashProductId(productId);

  // Calçado tem o conjunto mais rico hoje. Para outras categorias, a seção
  // "Medidas" fica vazia (decisão do README — backend ainda não modela).
  // MOCK :: LOFN-G33 — gating por categoria.
  const isFootwear = isFootwearCategoryId(categoryId);

  const condition = pick(CONDITION_POOL, hash, 1);
  const brand = pick(BRAND_POOL, hash, 2);
  const color = pick(COLOR_POOL, hash, 3);
  const material = pick(MATERIAL_POOL, hash, 4);
  const composition = pick(COMPOSITION_POOL, hash, 5);
  const gender = pick(GENDER_POOL, hash, 6);
  const model = pick(MODEL_POOL, hash, 7);
  const collection = pick(COLLECTION_POOL, hash, 8);
  const sizeBr = isFootwear ? pick(SIZE_BR_POOL, hash, 9) : null;

  const groups: ProductAttributesGroup[] = [
    {
      title: 'Geral',
      items: [
        { label: 'Condição', value: CONDITION_LABELS[condition] },
        ...(sizeBr ? [{ label: 'Tamanho', value: sizeBr }] : []),
        { label: 'Marca', value: brand },
        { label: 'Cor predominante', value: color },
        { label: 'Material', value: material },
        { label: 'Composição', value: composition },
        { label: 'Gênero', value: gender },
        { label: 'Modelo', value: model },
        { label: 'Coleção', value: collection },
      ],
    },
    {
      title: 'Medidas',
      items: sizeBr
        ? [
            { label: 'Tamanho BR', value: sizeBr },
            { label: 'Tamanho US', value: SIZE_US[sizeBr] ?? '—' },
            { label: 'Tamanho EU', value: SIZE_EU[sizeBr] ?? '—' },
            { label: 'Comprimento da palmilha', value: `${FOOT_LENGTH_CM[sizeBr] ?? '—'} cm` },
            { label: 'Largura interna', value: `${FOOT_WIDTH_CM[sizeBr] ?? '—'} cm` },
            { label: 'Altura do solado', value: `${pick(SOLE_HEIGHT_CM, hash, 10)} cm` },
            { label: 'Cabedal', value: 'Cano baixo' },
          ]
        : [],
    },
    {
      title: 'Cuidados',
      items: [
        { label: 'Lavagem', value: 'Apenas pano úmido' },
        { label: 'Secagem', value: 'Sombra, longe de calor' },
        { label: 'Hidratação', value: 'Creme neutro de couro' },
        { label: 'Não pode', value: 'Imersão, alvejante, máquina' },
        { label: 'Armazenamento', value: 'Forma neutra ou papel' },
      ],
    },
  ];

  return {
    productId,
    condition,
    sizeBr,
    groups,
  };
};

// MOCK :: LOFN-G33 — heurística de "calçado" enquanto não há flag oficial.
// Conhecemos só `categoryId` numérico e a árvore tem `slug`. O hook de medidas
// detalhadas é gateado client-side; quando o backend modelar tipo de produto,
// trocar por flag oficial.
const isFootwearCategoryId = (categoryId: number | null): boolean => {
  if (categoryId === null) return false;
  // Heurística determinística por id — usa o último dígito como gating até
  // 50% dos produtos, suficiente pro mock.
  return categoryId % 2 === 0;
};

export const productsService = new ProductsService();
export default ProductsService;
