# Contract — `Services/StoresService.ts`

**FRs cobertos**: FR-005 (filtro "loja"), FR-011, FR-012.
**Gaps backend referenciados**: LOFN-G06, G07.

## 1. Endpoints reais consumidos

### 1.1 `POST {VITE_API_URL}/graphql` — `stores`

Auth: anônimo · Implementado pelo Lofn ✅ (via GraphQL público).

**Request**:

```json
{
  "query": "query { stores { storeId slug name logoUrl status } }"
}
```

**Response**:

```json
{
  "data": {
    "stores": [
      { "storeId": 1, "slug": "cafedalua", "name": "Café da Lua", "logoUrl": "...", "status": "Active" },
      ...
    ]
  }
}
```

- O Circulou filtra `status === 'Active'` client-side caso o resolver não filtre por
  padrão. Volume-alvo POC < 10 lojas torna isso trivial.

### 1.2 `POST {VITE_API_URL}/graphql` — `storeBySlug`

Auth: anônimo · Implementado pelo Lofn ✅.

**Request**:

```graphql
query StoreBySlug($slug: String!) {
  storeBySlug(slug: $slug) {
    storeId
    slug
    name
    logoUrl
    status
    categories {
      categoryId
      slug
      name
      productCount
    }
  }
}
```

**Variables**: `{ "slug": "cafedalua" }`

**Response**:

```json
{
  "data": {
    "storeBySlug": {
      "storeId": 1,
      "slug": "cafedalua",
      "name": "Café da Lua",
      "logoUrl": "...",
      "status": "Active",
      "categories": [
        { "categoryId": 10, "slug": "cafe", "name": "Café", "productCount": 12 },
        ...
      ]
    }
  }
}
```

- Se o resolver `storeBySlug` **não** retornar `categories[]` aninhado, o
  `CategoriesService` faz fallback (ver `category.md` §3).

## 2. Funções públicas

```ts
interface StoresService {
  // FR-007 (filtro "loja específica" na busca unificada): popula a lista de lojas conhecidas.
  // Cacheado em memória durante a sessão.
  listAll(): Promise<StoreInfo[]>;

  // FR-011, FR-012: detalhe da loja para a StorePage.
  getBySlug(slug: string): Promise<StoreInfo & { categories?: CategoryInfo[] }>;
}
```

## 3. Cache

`listAll()` é memoizada por instância de Service (vida = sessão). Invalidação manual
via `StoresService.invalidate()` é exposta para o caso de a lista mudar (raro em POC,
mas necessário para testes).

## 4. Erros mapeados

| Falha | Tratamento |
|---|---|
| GraphQL `errors[]` não vazio | Lançar `LofnApiError(graphqlErrors)`. `StoresContext` registra em `errorState` e exibe toast via `sonner`. |
| Slug inexistente em `getBySlug` | Retornar `null` → a `StorePage` exibe estado "Loja não encontrada" e link para a home. |
| Network error | Mesma propagação; o Context preserva o último valor cacheado para evitar tela em branco. |

## 5. Convenção de mocks

Nenhum mock necessário aqui se o GraphQL público for o que a documentação do Lofn
indica. **Caso `stores` ou `storeBySlug` não estejam disponíveis** no ambiente de
desenvolvimento, fallback temporário:

```ts
// MOCK :: LOFN-G07 — listagem de lojas via GraphQL não disponível neste ambiente.
// Substituir pelo resolver `stores` quando confirmado.
// Ver specs/001-circulou-marketplace/lofn-api-gaps.md#lofn-g07.
```

O fallback usa `POST /product/search` agregando `storeId`s distintos da resposta —
soluciona apenas o filtro de busca, **não** dá nome/logo da loja. Solução considerada
inferior; mock só ativado se `stores` falhar com 404/erro persistente.
