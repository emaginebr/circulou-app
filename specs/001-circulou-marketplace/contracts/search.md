# Contract — `Services/ProductsService.ts` (busca unificada)

**FRs cobertos**: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009.
**Gaps backend referenciados**: LOFN-G01, G02, G03, G04.

## 1. Endpoint real consumido

### `POST {VITE_API_URL}/product/search`

Auth: anônimo · Implementado pelo Lofn ✅

**Request body**:

```json
{
  "storeId": 0,            // opcional — omitir para busca cross-store (FR-001)
  "userId": 0,             // não usado pelo Circulou
  "keyword": "café",       // pode ser ""
  "onlyActive": true,      // sempre true neste app
  "pageNum": 1             // 1-based
}
```

**Response body**:

```json
{
  "products": [ /* ProductInfo[] */ ],
  "pageNum": 1,
  "pageCount": 8
}
```

- O Circulou interpreta `pageCount` como total de páginas no servidor para o conjunto
  filtrado por keyword/storeId; é a base do `exhausted` em `SearchPage`.

## 2. Funções públicas do Service

```ts
// Service signature — assinatura conceitual; nomes finais ficam a cargo do
// scaffolding /react-architecture em /speckit.tasks.

interface ProductsService {
  // Busca cross-store. Aplica filtros e ordenação client-side conforme FR-007.
  searchUnified(filters: FilterState, opts?: { extendCap?: boolean }): Promise<SearchPage>;

  // Busca dentro de uma loja específica (StorePage). Categoria filter é per-store.
  searchInStore(storeId: number, filters: FilterState, opts?: { extendCap?: boolean }): Promise<SearchPage>;

  // Listagem da home: featured cross-store + completar com mais recentes.
  loadHome(opts?: { extendCap?: boolean }): Promise<SearchPage>;

  // Recupera produto por (storeSlug, productSlug) para deep-link na ProductPage.
  getProductBySlug(storeSlug: string, productSlug: string): Promise<ProductInfo | null>;
}
```

## 3. Algoritmo do pré-fetch progressivo (FR-007)

```text
function searchUnified(filters, opts):
    pageCap   = state.pageCap or 5
    fetched   = state.previouslyFetched or []
    pageStart = state.fetchedPages + 1 if opts.extendCap else 1

    if opts.extendCap:
        pageCap += 5

    pages = []
    for p in pageStart .. pageCap:
        // até 2 in-flight em paralelo
        pages.push( POST /product/search { storeId: filters.storeId, keyword: filters.keyword, onlyActive: true, pageNum: p } )
        if pages.length == 2 or p == pageCap:
            await Promise.allSettled(pages)
            fetched.push(...successes)
            pages = []

        if exhausted (server reported pageCount < p): break

    // Aplicar filtros e ordenação client-side (LOFN-G01..G03)
    filtered = applyFilters(fetched, filters)
    sorted   = applySort(filtered, filters.sortBy)
    visible  = sorted.slice(0, 12)

    return {
      items: visible,
      totalFetched: filtered.length,
      fetchedPages: lastPageReached,
      pageCap,
      exhausted: server pageCount <= lastPageReached,
    }
```

## 4. Filtros e ordenação client-side

### 4.1 `applyFilters` — referência LOFN-G01, G02, G04

```ts
function applyFilters(products: ProductInfo[], f: FilterState): ProductInfo[] {
  return products.filter(p => {
    if (f.storeId !== undefined && p.storeId !== f.storeId) return false;
    const finalPrice = p.price - p.discount;
    if (f.minPrice !== undefined && finalPrice < f.minPrice) return false;
    if (f.maxPrice !== undefined && finalPrice > f.maxPrice) return false;
    if (f.onlyOnSale && p.discount <= 0) return false;
    if (f.categoryId !== undefined && p.categoryId !== f.categoryId) return false;
    return true;
  });
}
```

### 4.2 `applySort` — referência LOFN-G03

```ts
function applySort(items: ProductInfo[], sort: SortBy): ProductInfo[] {
  switch (sort) {
    case 'priceAsc':     return [...items].sort(byPriceAsc);
    case 'priceDesc':    return [...items].sort(byPriceDesc);
    case 'discountDesc': return [...items].sort(byDiscountDesc);
    case 'recent':       return [...items].sort(byCreatedAtDesc);
    case 'relevance':    return relevance.rank(items);  // src/lib/relevance.ts
  }
}
```

### 4.3 Relevância (FR-006)

Definida em `src/lib/relevance.ts`:

1. Match exato no nome (case-insensitive, normalizado) → tier 1.
2. Match prefixo → tier 2.
3. Match substring → tier 3.
4. Sem match (não acontece após `applyFilters`) → tier 4.

Desempate: `featured: true` antes de `false`; depois `createdAt` desc.

## 5. Estratégia da home (FR-004)

```ts
function loadHome():
    // 1. Buscar featured cross-store
    featured = tryGraphQL(`
      query { featuredProducts { storeId slug name price discount images { imageUrl } featured createdAt } }
    `)
    // MOCK :: LOFN-G04 — fallback se GraphQL não suportar cross-store
    if featured falhou ou veio vazio:
        featured = []

    // 2. Se < 12, completar com mais recentes
    if featured.length < 12:
        recent = POST /product/search { keyword: "", onlyActive: true, pageNum: 1 }
        // ordenar por createdAt desc, retirar duplicados que já estão em `featured`
        toFill = recent.products
            .filter(p => !featured.some(f => f.productId === p.productId))
            .sort(byCreatedAtDesc)
        merged = [...featured, ...toFill].slice(0, 12)

    // 3. Decidir título
    sectionTitle = featured.length > 0 ? 'Em destaque' : 'Catálogo'

    return { items: merged, sectionTitle, ... }
```

## 6. Cancelamento e idempotência

- **Cancelamento**: `searchUnified` aceita opcionalmente um `AbortSignal` herdado do
  hook. Quando o usuário muda termo/filtro, o hook cria um novo `AbortController` e
  cancela o anterior — `HttpClient` propaga via fetch nativo.
- **Idempotência**: a mesma `(filters, pageCap)` retorna o mesmo conjunto. A função é
  pura sobre input + estado do servidor.

## 7. Erros mapeados

| Falha | Tratamento |
|---|---|
| HTTP 5xx | Toast "Falha ao buscar produtos. Tente novamente." + `errorState` no Context. |
| Network error | Idem; preservar termo e filtros (Edge Case "falha de rede durante busca"). |
| Resposta com `products: []` | Estado vazio nominal — exibir mensagem (FR-001 cenário 2). |
| GraphQL `featuredProducts` indisponível | Fallback silencioso para `searchUnified` puro com `sortBy = recent`. |

## 8. URL projection (FR-009)

Cada chamada do hook `useProducts` atualiza/lê a URL via `useUrlSearchState`:

| Param | Valor | Default |
|---|---|---|
| `q`    | `keyword` (URL-encoded) | "" |
| `store` | `storeId` numérico | omitido |
| `min`  | `minPrice` | omitido |
| `max`  | `maxPrice` | omitido |
| `sale` | `1` se `onlyOnSale` | omitido |
| `cat`  | `categoryId` (apenas em StorePage) | omitido |
| `sort` | um de `relevance|priceAsc|priceDesc|discountDesc|recent` | `relevance` |
| `page` | `pageCap` corrente | `5` |

A URL é a fonte de verdade para `FilterState`; o `useProducts` reage à mudança da URL
(via `useSearchParams` do RR6) e refaz a busca quando algum desses params mudar.
