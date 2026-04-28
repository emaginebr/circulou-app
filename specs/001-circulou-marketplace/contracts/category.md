# Contract — `Services/CategoriesService.ts`

**FRs cobertos**: FR-011 (filtro de categoria escopo de loja).
**Gaps backend referenciados**: LOFN-G08.

## 1. Endpoints reais consumidos

### 1.1 GraphQL — preferencial (via `storeBySlug`)

Quando `StoresService.getBySlug(slug)` já retorna `categories[]` aninhado (ver
`store.md` §1.2), `CategoriesService.listByStoreSlug` apenas devolve esse array
mapeado.

### 1.2 Fallback — derivar da listagem de produtos

Se `storeBySlug` não trouxer `categories[]`, `CategoriesService` infere a lista a
partir dos produtos da loja:

```text
POST /product/search { storeId, keyword: "", onlyActive: true, pageNum: 1..N }

Coletar todas as categorias distintas (categoryId, name) dos produtos retornados,
contar productCount client-side, e retornar como CategoryInfo[].
```

Para volume-alvo POC (cada loja com poucos produtos), N raramente passa de 1-3
páginas — custo aceitável.

```ts
// MOCK :: LOFN-G08 — categories[] não veio aninhado em storeBySlug.
// Substituir por GraphQL `storeBySlug.categories` ou REST GET /category/{storeSlug}/list quando o gap fechar.
// Ver specs/001-circulou-marketplace/lofn-api-gaps.md#lofn-g08.
```

## 2. Funções públicas

```ts
interface CategoriesService {
  // FR-011: lista as categorias da loja para alimentar o filtro de categoria.
  listByStoreSlug(storeSlug: string): Promise<CategoryInfo[]>;
}
```

## 3. Cache

Igual ao `StoresService`: cache em memória por sessão, invalidação manual exposta para
testes. Como `categories[]` é frequentemente lido junto com `storeBySlug`, o fluxo
preferido é cacheamento conjunto no `StoresContext` para evitar duplo round-trip.

## 4. Sem categoria global no MVP (Clarification Q3)

`CategoriesService` **NÃO** expõe `listAll()` ou similar. A spec é explícita: filtro
de categoria não existe na busca unificada — apenas escopo-loja. Tentativa de
adicionar uma listagem global aqui violaria o contrato da spec e seria flag em code
review.
